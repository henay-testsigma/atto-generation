# Agentic-Test WebSocket Event Reference

Authoritative catalog of every websocket (and SSE) event emitted by the agentic-test agents. Synthesized from per-module source extraction. Use the exact wire string values below — these are what the frontend receives.

---

## 1. Overview

The agentic-test platform runs a family of LangGraph agents that stream their work to the frontend in real time. Each agent owns a per-thread **Redis Stream** (key `<agent-prefix>:{thread_id}:stream`) managed by an `AgentStreamManager`, plus a per-agent `websocket_handler` that tails the stream (XREADGROUP for live tail, XRANGE/XREVRANGE for replay) and fans entries out to the client. Every entry is durably mirrored to an EFS JSONL journal (`common.event_journal`) so history can be rebuilt after Redis eviction.

There are **two event architectures** in the tree:

- **Typed (modern):** A shared `CommonEventType` StrEnum (`src/common/events/types.py`) defines the base vocabulary. Each typed event is a frozen pydantic `BaseEvent` subclass carrying an **envelope**: `event_id` (UUIDv4, dedup on replay), `type` (discriminator), `group_type`, `group_id` (correlation key), `parent_group_id` (nesting), `lifecycle`, and `content` (human-readable one-liner). Agents extend the base with their own StrEnum (e.g. `TAAEventType`, `TPAv2EventType`) and emit via typed `emit_<name>(...)` helpers → `AgentStreamManager.emit()` → XADD. **COMMON / TAA / TPA-v2** use this path.
- **Untyped (legacy):** No StrEnum; events are raw lowercase string literals passed as the `entry_type` arg to `AgentStreamManager.write(entry_type, content, metadata)`. **CAA / RAA / TMA / TPA-v1** use this path. Wire values sometimes *coincide* with `CommonEventType` strings but are not the same enum.

Frontend transport shape differs by family: typed/promoted agents surface the wire value as the message `type`; the legacy `write()`-based handlers wrap every entry in an outer `{"type":"stream_entry", "entry_type":<wire value>, "content", "metadata", "is_replay", ...}` frame. **PR-TAA** is the odd one out — it uses **SSE**, not websocket.

**Agents and codes:**

| Code | Agent | Module root | Architecture |
| :---- | :---- | :---- | :---- |
| COMMON | Shared event vocabulary | `src/common/events/` | Typed (defines, emits nothing) |
| TAA | Test Authoring Agent | `src/test_authoring/` | Typed |
| CAA | Coverage Analysis Agent | `src/coverage_analysis/` | Untyped (`caa:`) |
| RAA | Run Analyzer Agent | `src/run_analyzer/` | Untyped (`raa:`) |
| TMA | Test Maintainer Agent | `src/test_maintainer/` | Untyped (`tma:`) |
| TPA v1 | Test Planning Agent (legacy) | `src/test_planning/` | Untyped (`tpa:`) |
| TPA v2 | Test Planning Agent v2 | `src/test_planning_v2/` | Typed (`tpa:`) |
| SCA v2 | Sprint Coverage Agent v2 | `src/sprint_coverage_v2/` | No own stream; forwards TAA+CAA |
| PR-TAA | PR Test Authoring | `src/pr_test_authoring/` | **SSE** |

---

## 2. Common events (shared base — `CommonEventType`)

`src/common/events/types.py` defines 25 members. COMMON itself emits **nothing**; the canonical reference emitter is TAA's `AgentStreamManager` (`src/test_authoring/infrastructure/stream.py`), which exercises every member.

| Wire value | Group | Lifecycle | Meaning |
| :---- | :---- | :---- | :---- |
| `session_started` | session | start | Opens the top-level session group when a session/turn begins. |
| `session_paused` | session | progress | Session paused (typically awaiting user input). |
| `session_resumed` | session | progress | Session resumed after pause/interrupt; may bump turn_id. |
| `session_completed` | session | end | Terminal: closes session group on success (one-shot `_closed` guard). |
| `session_terminated` | session | end | Terminal: closes session group on user/forced termination. |
| `session_failed` | session | end | Terminal: closes session group on fatal error. |
| `plan_started` | plan | start | Opens a plan card with initial todo items. |
| `plan_appended` | plan | progress | Appends items to an open plan card. |
| `plan_completed` | plan | end | Closes plan card with final counts. |
| `plan_item_started` | plan_item | start | Marks a single plan item in-progress. |
| `plan_item_completed` | plan_item | end | Marks a plan item done/skipped/failed + progress count. |
| `phase_started` | phase | start | Opens a phase card (scenarios, test_cases, validation, …). |
| `phase_completed` | phase | end | Closes a phase card; may flag `review_required`. |
| `tool_started` | tool | start | Opens a tool-call card when a tool begins. |
| `tool_completed` | tool | end | Closes a tool-call card on success (result preview). |
| `tool_failed` | tool | end | Closes a tool-call card on failure (error). |
| `question_asked` | question | start | Opens a question card prompting the user (optional options). |
| `question_answered` | question | end | Closes the question card once answered. |
| `progress` | session | standalone | Free-form progress log line, optional percentage. |
| `moreasoning` | session | standalone | Free-form agent thought line on the log rail. |
| `token_usage` | session | standalone | LLM token consumption for the turn/model. |
| `error` | session | standalone | Standalone error notice (non-terminal; distinct from `session_failed`). |
| `message` | session | standalone | Inbound user turn (new/resume/queued) + attached inputs. |
| `dev_context` | session | standalone | Auto-injected dev context bubble, emitted before the user `message`. |
| `welcome` | session | standalone | Connection handshake greeting (sent as a RAW dict, not via `emit()`). |
| `replay_complete` | session | standalone | Signals historical replay finished (sent as a RAW dict, not via `emit()`). |

`welcome` and `replay_complete` are special: the WS handler sends them as raw dict envelopes (bypassing `emit()`/XADD). The typed `WelcomeEvent`/`ReplayCompleteEvent` classes are effectively scaffolding. All other 23 flow through `emit()` → XADD → WS.

**`GroupType` enum** (`base.py:25`, 10 members): `session`, `plan`, `plan_item`, `sub_agent`, `tool`, `scenario`, `test_case`, `validation`, `phase`, `question`. (`sub_agent`/`scenario`/`test_case`/`validation` have no `CommonEventType` member — used only by agent-specific vocabularies.)

**`Lifecycle` enum** (`base.py:40`, 4 members): `start` (opens a group card), `progress` (mid-run update), `end` (closes the card), `standalone` (no group lifecycle; pinned to session log rail).

---

## 3. Per-agent event tables

### 3.1 TAA — Test Authoring Agent

**What/transport:** Generates scenarios & test cases. Typed events via `emit_<name>` helpers → Redis Stream `taa:{thread_id}:stream` → WS `_envelope()`. Three non-stream raw envelopes are sent directly (`welcome`, `session_restored`, `replay_complete`). `acceptance_status_updated` is pushed out-of-band from the REST callback handler.

**Common events reused:** `session_started`, `session_paused`, `session_resumed`, `session_completed`, `session_terminated`, `session_failed`, `plan_started`, `plan_appended`, `plan_completed`, `plan_item_started`, `plan_item_completed`, `phase_started`, `phase_completed`, `tool_started`, `tool_completed`, `tool_failed`, `question_asked`, `question_answered`, `progress`, `reasoning`, `token_usage`, `error`, `message`, `dev_context`, `welcome`, `replay_complete`

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `sub_agent_started` | SUB_AGENT_STARTED | sub_agent | start | Explorer/validator/TPA-adhoc sub-agent began. | ✅ |
| `sub_agent_progress` | SUB_AGENT_PROGRESS | sub_agent | progress | Incremental sub-agent progress (step/screenshot/finding/…). | ✅ |
| `sub_agent_signals` | SUB_AGENT_SIGNALS | sub_agent | progress | Structured signals surfaced at end of sub-agent run. | ✅ |
| `sub_agent_completed` | SUB_AGENT_COMPLETED | sub_agent | end | Sub-agent finished successfully. | ✅ |
| `sub_agent_failed` | SUB_AGENT_FAILED | sub_agent | end | Sub-agent errored out. | ✅ |
| `scenario_saved` | SCENARIO_SAVED | scenario | start | First persistence of a scenario; opens scenario card. | ✅ |
| `scenario_updated` | SCENARIO_UPDATED | scenario | progress | Existing scenario updated. | ✅ |
| `scenario_deleted` | SCENARIO_DELETED | scenario | end | Scenario permanently removed. | ✅ |
| `test_case_saved` | TEST_CASE_SAVED | test_case | start | Test case persisted; nested under its scenario. | ✅ |
| `test_case_updated` | TEST_CASE_UPDATED | test_case | progress | Test case edited (agent or manual FE update). | ✅ |
| `validation_started` | VALIDATION_STARTED | validation | start | Validation loop began. | ✅ |
| `validation_iteration` | VALIDATION_ITERATION | validation | progress | One validation iteration (pass/fail + issues). | ✅ |
| `validation_completed` | VALIDATION_COMPLETED | validation | end | Validation loop finished. | ✅ |
| `validation_failed` | VALIDATION_FAILED | validation | end | Closes validation group with error. Helper exists, **no call site**. | ⚠️ unused |
| `skill_loaded` | SKILL_LOADED | session | standalone | A skill module was loaded into the agent. | ✅ |
| `context_saved` | CONTEXT_SAVED | session | standalone | Working context persisted to context store. | ✅ |
| `summary_generated` | SUMMARY_GENERATED | session | standalone | A run/turn summary was generated. | ✅ |
| `agent_done` | AGENT_DONE | session | standalone | Agent finished its work for the turn/run. | ✅ |
| `acceptance_status_updated` | ACCEPTANCE_STATUS_UPDATED | session | standalone | TC acceptance status changed; emitted from REST callback. | ✅ |
| `sprint_issues_loaded` | SPRINT_ISSUES_LOADED | session | standalone | Sprint issues injected into the prompt. Emitted via direct `emit(...)`, no helper. | ✅ |

19 of 20 own events emitted; only `validation_failed` is defined-but-unused. (`session_restored` is a handler-only raw envelope with no event class — not counted.)

---

### 3.2 CAA — Coverage Analysis Agent

**What/transport:** Coverage gap/impact analysis. **No StrEnum** — raw string literals via `AgentStreamManager.write()`. Redis Stream `caa:{thread_id}:stream`; WS handler wraps each in `{type:"stream_entry", entry_type:<wire>}`. Module lives at `src/coverage_analysis/` (there is **no** `src/coverage_authoring`).

**Common events reused:** `session_started`, `session_resumed`, `session_paused`, `session_completed`, `session_terminated`, `reasoning`, `progress`, `token_usage`, `phase_started`, `phase_completed`, `tool_started`, `tool_completed`, `error`

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `question` | (raw literal) | session | standalone | Ask user a question + pause graph. (Common uses `question_asked`.) | ✅ |
| `phase` | (raw literal) | session | standalone | Legacy phase-transition marker (distinct from common phase pair). | ✅ |
| `event` | (raw literal) | session | standalone | Generic envelope; inner `event_type` + data (coverage_complete, gap_detected, viz). | ✅ |
| `visualization` | (inner `event_type`) | session | standalone | Chart payload auto-emitted after save (donut/bar/table/kpi_cards/line/…). | ✅ |
| `agent_done` | (raw literal) | session | end | Final assistant message, no further tool calls. | ✅ |
| `session_complete` | (raw literal) | session | standalone | Plan-level completion notice (NOT common `session_completed`). | ✅ |
| `phase_review` | (raw literal) | session | standalone | Phase-boundary review summary for approval. | ✅ |
| `plan_auto_progress` | (raw literal) | session | progress | Auto plan progress tick after each tool. | ✅ |
| `sub_agent_started` | (raw literal) | sub_agent | start | Spawned sub-agent began (gap/impact/requirements/…). | ✅ |
| `sub_agent_completed` | (raw literal) | sub_agent | end | Sub-agent finished; tokens + findings count. | ✅ |
| `sub_agent_failed` | (raw literal) | sub_agent | end | Sub-agent returned an error. | ✅ |
| `sub_agent_signals` | (raw literal) | sub_agent | standalone | Findings/signals (finding→suggestion pairs). | ✅ |
| `skill_loaded` | (raw literal) | tool | end | Skill loaded via load_skill tool. | ✅ |
| `context_saved` | (raw literal) | tool | end | Session context persisted via save_context. | ✅ |
| `analysis_saved` | (raw literal) | tool | end | Coverage analysis persisted (triggers viz auto-emit). | ✅ |
| `validation_iteration` | (raw literal) | tool | progress | self-eval/validate_analysis result for iteration N. | ✅ |

Defined-but-unused: `emit_tool_failed()` helper has no caller (so common `tool_failed` is **not** reused by CAA); `send_event()` helper documented for `visualization` has no caller (viz emitted via `write('event', ...)` instead). `session_failed` never emitted (failures use `error`). The `StreamEntry.type` docstring lists a `summary` type with no emit site.

---

### 3.3 RAA — Run Analyzer Agent

**What/transport:** Analyzes test runs. **No StrEnum** — free-form string literals via `write()`. Redis Stream `raa:{thread_id}:stream`; WS wraps each in `{type:"stream_entry", entry_type:<wire>}`. `events.py` here is a **visualization-builder registry**, not an event enum. **Does not consume the common typed system at all.**

**Common events reused:** *(none — see caveats; some wire strings coincide but are emitted untyped)*

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `reasoning` | (raw literal) | session | standalone | Live agent thought-stream line. | ✅ |
| `phase` | (raw literal) | phase | standalone | Phase transition notification. | ✅ |
| `progress` | (raw literal) | session | standalone | NL progress; also per sub-agent step / budget exhaustion. | ✅ |
| `question` | (raw literal) | question | standalone | Ask user + pause; also session-complete / phase-review pauses. | ✅ |
| `event` | (raw literal) | session | standalone | Generic envelope: session lifecycle markers + send_event + charts. | ✅ |
| `error` | (raw literal) | session | standalone | Fatal/blocking error (graph failure, resume failure). | ✅ |
| `token_usage` | (raw literal) | session | standalone | Per-LLM-call token accounting. | ✅ |
| `agent_done` | (raw literal) | session | end | Reason node response with no tool calls. | ✅ |
| `visualization` | (raw literal) | tool | standalone | Chart payload (donut/bar/gauge/heatmap/…). | ✅ |
| `tool_start` | (raw literal) | tool | start | Before tool invocation (NOT common `tool_started`). | ✅ |
| `skill_loaded` | (raw literal) | tool | end | After load_skill completes. | ✅ |
| `context_saved` | (raw literal) | tool | end | After save_context completes. | ✅ |
| `analysis_saved` | (raw literal) | tool | end | After save_analysis_result (triggers auto-viz). | ✅ |
| `validation_result` | (raw literal) | tool | standalone | After validate_analysis (status/issues/checks/iteration). | ✅ |
| `sub_agent_start` | (raw literal) | sub_agent | start | spawn_* / each spawn_parallel agent about to run. | ✅ |
| `sub_agent_complete` | (raw literal) | sub_agent | end | Sub-agent finished (tokens + findings). | ✅ |
| `sub_agent_error` | (raw literal) | sub_agent | end | Sub-agent failed. | ✅ |
| `sub_agent_signals` | (raw literal) | sub_agent | standalone | Sub-agent returned signals/findings. | ✅ |
| `plan_auto_progress` | (raw literal) | plan | progress | Plan tracker auto-advances after tool exec. | ✅ |
| `phase_review` | (raw literal) | plan | progress | Mid-session phase-boundary review. | ✅ |
| `session_complete` | (raw literal) | session | end | All plan items complete (NOT common `session_completed`). | ✅ |
| `summary` | (docstring only) | unknown | standalone | Listed in `StreamEntry.type` docstring; **no emit site**. | ⚠️ unused |
| `tool_complete` | (docstring/ARCH.md) | tool | end | Documented generic completion; specialized into skill_loaded/context_saved/analysis_saved instead. | ⚠️ unused |

Value collisions only: `progress`, `reasoning`, `error`, `token_usage` coincide with common wire strings but are emitted untyped (so `common_events_reused` is empty). `tool_start`/`question`/`session_complete` deliberately differ from common names.

---

### 3.4 TMA — Test Maintainer Agent

**What/transport:** Dedup/quality/health maintenance. Defines `EVENT_*` **string constants** in `events.py` (not a StrEnum), but every actual emit passes a **bare lowercase literal** to `write()` — the `EVENT_*` constants are **dead references** (zero usages outside `events.py`). Redis Stream `tma:{thread_id}:stream`; WS wraps in `{type:"stream_entry", entry_type:<wire>}`. **Does not consume the common typed system.**

**Common events reused:** *(none — own hardcoded literals; some coincide with common strings)*

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `reasoning` | EVENT_REASONING | session | standalone | Reasoning / planned tool calls thought-stream. | ✅ |
| `progress` | EVENT_PROGRESS | session | standalone | NL progress / sub-agent step progress. | ✅ |
| `question` | EVENT_QUESTION | question | standalone | Ask user + pause (sets needs_user_input). | ✅ |
| `phase` | EVENT_PHASE | phase | start | Phase transition notification. | ✅ |
| `phase_review` | EVENT_PHASE_REVIEW | phase | end | Phase boundary; pause for review + TMA metrics. | ✅ |
| `error` | EVENT_ERROR | session | standalone | Graph/agent-level error. | ✅ |
| `event` | EVENT_EVENT | session | standalone | Generic lifecycle/structured envelope (carries SendEventTool dynamic event_type). | ✅ |
| `token_usage` | EVENT_TOKEN_USAGE | session | standalone | Per-LLM-call token usage + totals. | ✅ |
| `tool_start` | EVENT_TOOL_START | tool | start | Tool call about to execute. | ✅ |
| `tool_complete` | EVENT_TOOL_COMPLETE | tool | end | Tool call finished. | ✅ |
| `sub_agent_complete` | EVENT_SUB_AGENT_COMPLETE | sub_agent | end | Spawned sub-agent completed. | ✅ |
| `sub_agent_error` | EVENT_SUB_AGENT_ERROR | sub_agent | end | Spawned sub-agent failed. | ✅ |
| `plan_created` | EVENT_PLAN_CREATED | plan | start | Maintenance plan created (write_plan) → approval pause. | ✅ |
| `plan_auto_progress` | (bare literal, not in events.py) | plan | progress | Plan auto-updated after tool exec. | ✅ |
| `plan_appended` | EVENT_PLAN_APPENDED | plan | progress | Items appended (append_plan). | ✅ |
| `session_complete` | (bare literal, not in events.py) | session | end | All plan items complete → apply/review/finish prompt. | ✅ |
| `sub_agent_start` | EVENT_SUB_AGENT_START | sub_agent | start | Sub-agent start. Defined, **no emit site**. | ⚠️ unused |
| `sub_agent_signals` | EVENT_SUB_AGENT_SIGNALS | sub_agent | standalone | Sub-agent signals. Defined, **no emit** (attached to result dict instead). | ⚠️ unused |
| `plan_progress` | EVENT_PLAN_PROGRESS | plan | progress | Defined; superseded by literal `plan_auto_progress`. | ⚠️ unused |
| `dedup_pair_found` | EVENT_DEDUP_PAIR_FOUND | scenario | standalone | Defined, **no emit** (flows through generic `event`). | ⚠️ unused |
| `dedup_group_formed` | EVENT_DEDUP_GROUP_FORMED | scenario | standalone | Defined, **no emit site**. | ⚠️ unused |
| `duplicate_marked` | EVENT_DUPLICATE_MARKED | scenario | standalone | Defined, **no emit** (only bumps a counter). | ⚠️ unused |
| `quality_analyzed` | EVENT_QUALITY_ANALYZED | scenario | standalone | Defined, **no emit** (only bumps a counter). | ⚠️ unused |
| `quality_result` | EVENT_QUALITY_RESULT | scenario | standalone | Defined, **no emit** (surfaced via generic `event`). | ⚠️ unused |
| `health_report` | EVENT_HEALTH_REPORT | scenario | standalone | Defined, **no emit** (embedded in phase_review/session_complete). | ⚠️ unused |
| `recommendation` | EVENT_RECOMMENDATION | scenario | standalone | Defined, **no emit site**. | ⚠️ unused |
| `summary` | EVENT_SUMMARY | session | standalone | Defined, **no emit** (accumulates into state). | ⚠️ unused |
| `agent_done` | EVENT_AGENT_DONE | session | end | Defined, **no emit** (completion via `session_complete` / lifecycle `event`). | ⚠️ unused |

16 emitted, 12 defined-but-unused. `group_type`/`lifecycle` are **inferred** (TMA has no GroupType machinery). `plan_auto_progress` and `session_complete` are emitted as bare literals not present in `events.py`. SendEventTool always writes `event` with a free-form `metadata.event_type` (dedup_complete/quality_complete/analysis_complete/error), not a first-class type.

---

### 3.5 TPA v1 — Test Planning Agent (legacy)

**What/transport:** Legacy deep-agent test planner. **No StrEnum** — raw string `entry_type` via `write()`. Redis Stream `tpa:{thread_id}:stream`; WS forwards as `{type:"stream_entry", entry_type:<value>}`. Superseded by TPA v2 but still present in the tree. **Does not consume the common typed system.**

**Common events reused:** *(none — wire strings coincide ad-hoc, not via CommonEventType)*

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `event` | (raw literal) | session | standalone | Generic envelope: session lifecycle text + `metadata.event_type` sub-events (visualization, dynamic). | ✅ |
| `question` | (raw literal) | question | standalone | Ask user + pause (+ optional answer choices). | ✅ |
| `progress` | (raw literal) | session | standalone | NL progress; sub-agents emit per-step (+ optional screenshot). | ✅ |
| `reasoning` | (raw literal) | session | standalone | Live thought stream (phase + thought + optional action). | ✅ |
| `phase` | (raw literal) | phase | start | Phase transition notification. | ✅ |
| `token_usage` | (raw literal) | session | standalone | Per-LLM-call token accounting. | ✅ |
| `message` | (raw literal) | session | standalone | Plain message; autonomous/batch auto-proceed approval. | ✅ |
| `error` | (raw literal) | session | standalone | Graph execution failure / cannot resume. | ✅ |
| `agent_done` | (raw literal) | session | end | Reason-node content with no tool calls. | ✅ |
| `tool_start` | (raw literal) | tool | start | Before non-spawn tool invocation (+ load_skill/save_context variants). | ✅ |
| `sub_agent_start` | (raw literal) | sub_agent | start | spawn_* / each spawn_parallel agent starting. | ✅ |
| `sub_agent_complete` | (raw literal) | sub_agent | end | Sub-agent finished (tokens/findings/result collections). | ✅ |
| `sub_agent_error` | (raw literal) | sub_agent | end | Sub-agent failed. | ✅ |
| `sub_agent_signals` | (raw literal) | sub_agent | standalone | Findings/suggestions for plan-review accumulation. | ✅ |
| `skill_loaded` | (raw literal) | tool | end | load_skill completed. | ✅ |
| `context_saved` | (raw literal) | tool | end | save_context completed. | ✅ |
| `plan_result_saved` | (raw literal) | plan | standalone | save_plan_result persisted an analysis result. | ✅ |
| `plan_created` | (raw literal) | plan | start | write_plan created the initial plan. | ✅ |
| `plan_appended` | (raw literal) | plan | progress | append_plan added items. | ✅ |
| `plan_progress` | (raw literal) | plan | progress | update_plan manually changed an item status. | ✅ |
| `plan_auto_progress` | (raw literal) | plan | progress | Plan status auto-advanced after tool exec. | ✅ |
| `phase_review` | (raw literal) | phase | end | Mid-session phase-boundary review → approval. | ✅ |
| `session_complete` | (raw literal) | session | end | All plan items complete (distinct from `event` Session-* texts). | ✅ |
| `validation_result` | (raw literal) | plan | standalone | validate_plan PASS/FAIL outcome. | ✅ |

The `StreamEntry.type` docstring lists `scenario`, `summary`, `scenario_saved` with no v1 emit sites (aspirational/inherited) and omits several that ARE emitted; only confirmed live emitters are listed above.

---

### 3.6 TPA v2 — Test Planning Agent v2

**What/transport:** Typed rewrite of the planner. `EventPublisher.emit(BaseEvent)` → `_StreamManagerSink` → `AgentStreamManager.write(entry_type=event.type, …)`. Redis Stream `tpa:{thread_id}:stream` (**note: `tpa:`, not `tpa_v2:`** despite the docstring). WS forwards as `{type:"stream_entry", entry_type:<wire>, metadata:{...envelope+payload}}`. `publisher.group()` auto-emits start on enter and end/failed on exit.

**Common events reused:** `phase_started`, `phase_completed`, `tool_started`, `tool_completed`, `tool_failed`, `progress`, `question_asked`, `event`

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `signal_worker_started` | SIGNAL_WORKER_STARTED | sub_agent | start | A signal worker (discovery/impact/failure/critical_path/blast_radius/resource_planning) started in fan-out. | ✅ |
| `signal_worker_completed` | SIGNAL_WORKER_COMPLETED | sub_agent | end | Signal worker finished; output count + redis result ref. | ✅ |
| `signal_worker_failed` | SIGNAL_WORKER_FAILED | sub_agent | end | Signal worker raised; error class + capped message. | ✅ |
| `scoring_completed` | SCORING_COMPLETED | session | progress | Deterministic score_test_plan finished; per-tier bucket counts. | ✅ |
| `tier_view_built` | TIER_VIEW_BUILT | session | progress | One tier view materialised (smoke/feature/regression/deep_regression). | ✅ |
| `ladder_rung_committed` | LADDER_RUNG_COMMITTED | session | progress | One tier-rung persistence txn committed (bottom-up UX). | ✅ |
| `tms_backfill_started` | TMS_BACKFILL_STARTED | phase | start | TMS sync phase started (push plan+runs+cases to chitragupt). | ✅ |
| `tms_backfill_completed` | TMS_BACKFILL_COMPLETED | phase | end | TMS sync finished; runs/cases synced + failures + details. | ✅ |

All 8 own events emitted (none unused). Common `phase_*`/`tool_*` reach the wire via `publisher.group()`/`publisher.tool()`. Legacy communication tools (AskUserTool/SendProgressTool/SendEventTool) bypass the typed publisher and `write()` raw `question`/`progress`/`event` — mapped to common values approximately. The `StreamEntry.type` docstring lists stale v1 entry types (documentation drift, not ground truth).

---

### 3.7 SCA v2 — Sprint Coverage Agent v2

**What/transport:** Sprint coverage orchestrator. **Owns no stream/event enum.** WS route `@router.websocket("/api/v1/sca/ws")` → `SCAWebSocketHandler._stream_loop` reads the upstream **TAA + CAA** Redis streams and forwards each entry verbatim (CAA entries tagged `source:"caa"`). It authors only a few control dicts and an inbound routing enum.

**Common events reused:** `message`, `progress`, `test_case_updated` *(via reused TAA emit helpers writing into the TAA stream)*

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `welcome` | (raw dict) | session | start | New SCA session greeting (own hand-built dict, not common model). | ✅ |
| `session_restored` | (raw dict) | session | start | Cold-reconnect replay of persisted session data. | ✅ |
| `replay_complete` | (raw dict) | session | progress | End of TAA+CAA historical replay; carries replayed_count. | ✅ |
| `event` | (raw dict) | session | standalone | Ad-hoc status/notice line (Session cancelled, not found, …). | ✅ |
| `error` | (raw dict) | session | standalone | Connection/auth/lookup failure frame. | ✅ |
| `jira_ticket` | TicketEventType.JIRA | inbound routing | standalone | **Inbound** Jira webhook → TAA turn. Not a FE WS frame. | ✅ (inbound) |
| `linear_ticket` | TicketEventType.LINEAR | inbound routing | standalone | **Inbound** Linear webhook → TAA turn. | ✅ (inbound) |
| `clickup_ticket` | TicketEventType.CLICKUP | inbound routing | standalone | **Inbound** ClickUp webhook → TAA turn. | ✅ (inbound) |
| `azure_devops_ticket` | TicketEventType.AZURE_DEVOPS | inbound routing | standalone | **Inbound** Azure DevOps work-item webhook → TAA turn. | ✅ (inbound) |
| `github_pr` | (string literal) | inbound routing | standalone | **Inbound** GitHub PR webhook → TAA PR turn. | ✅ (inbound) |
| `user_message` | (string literal) | inbound routing | standalone | **Inbound** queued user chat message → TAA turn. | ✅ (inbound) |
| `user_context` | (string literal) | inbound routing | standalone | **Inbound** user context (Figma/docs/video); consume-only, no producer in module. | ⚠️ unused (consume-only) |
| `runs_updated` | (dashboard payload) | session | standalone | Dashboard-invalidation signal; `publish_sprint_event` has **zero callers**. | ⚠️ unused |

`welcome`/`replay_complete`/`error` reuse common wire values but are hand-built dicts. The full set of *live agent* events the FE sees on `/api/v1/sca/ws` is the **union of all TAA + CAA events** (forwarded verbatim) — see §3.1 and §3.2.

---

### 3.8 PR-TAA — PR Test Authoring (SSE)

**What/transport:** Lightweight two-pass PR test generator. **SSE, not websocket.** `POST /api/v1/generation/pr-test-authoring/stream` returns a FastAPI `StreamingResponse` (`text/event-stream`); `generate()` yields plain dicts, formatted via `format_sse(event_id, event_type, data)` → `id:<n>\nevent:<type>\ndata:<json>\n\n`. **No StrEnum, no event-bus.** Exactly 3 distinct `type` values.

**Common events reused:** `progress`, `error` *(by string coincidence only — module uses bare literals, does not import CommonEventType)*

| Wire value | Enum member | Group | Lifecycle | Meaning | Emitted? |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `progress` | (bare dict literal) | session | standalone | Phase ticks: compressing → planning → expanding. | ✅ (3x) |
| `result` | (bare dict literal) | unknown | end | Terminal success: full PR test authoring result (summary + scenarios/test cases); also empty-result terminal. | ✅ |
| `error` | (bare dict literal) | session | standalone | Failure during generation. | ✅ |

`progress` (3x: compressing/planning/expanding phases) and `error` coincide with common wire values but are emitted as bare strings. No session/plan/phase/tool/welcome/replay events on this path.

---

## 4. Grand total counts

| Agent | # own events | (own emitted / ⚠️ unused) | # common reused |
| :---- | :---- | :---- | :---- |
| COMMON | 25 (defines vocabulary) | n/a (emits nothing) | 0 |
| TAA | 20 | 19 / 1 | 26 |
| CAA | 16 | 16 / 0 | 13 |
| RAA | 22 | 20 / 2 | 0 |
| TMA | 28 | 16 / 12 | 0 |
| TPA v1 | 24 | 24 / 0 | 0 |
| TPA v2 | 8 | 8 / 0 | 8 |
| SCA v2 | 13 | 11 / 2 | 3 |
| PR-TAA | 3 | 3 / 0 | 2 (by coincidence) |

**Distinct event wire-values across the whole system:**

- **25** common (`CommonEventType`) wire values.
- Agent-specific wire values, deduplicated across agents (many literals like `progress`, `question`, `phase`, `tool_start`, `sub_agent_*`, `plan_auto_progress`, `phase_review`, `session_complete`, `agent_done`, `skill_loaded`, `context_saved`, `validation_*`, `analysis_saved`, etc. are reused verbatim across CAA/RAA/TMA/TPA-v1) come to **~60 distinct module-specific strings**.
- Counting the union of common + all distinct agent-specific wire values (collapsing duplicates): **~85 distinct event wire-value strings** system-wide. (Approximate because many legacy literals deliberately overlap across the untyped agents.)

---

## 5. Notes & caveats

**Two architectures, one tree.** Only **COMMON, TAA, and TPA v2** use the typed `CommonEventType`/`BaseEvent` pipeline with real envelope fields. **CAA, RAA, TMA, and TPA v1** predate it and emit raw string literals via `write()`; their `group_type`/`lifecycle` values are often *inferred*, not present in code. Wire strings like `progress`/`reasoning`/`error`/`token_usage` frequently coincide with common values but are NOT enum reuse — the FE sees identical strings regardless.

**v1 vs v2.**

- **TPA v1 (`src/test_planning/`)** is legacy and superseded by **TPA v2 (`src/test_planning_v2/`)**, but both remain in the tree. Both use Redis namespace `tpa:` (v2's docstring incorrectly says `tpa_v2:`). v2 owns the typed-event path and the qi_metrics sync. There is also a leftover legacy `agent.py`/`events.py` inside the v2 package — the typed path is `agent_v2.py` + `events/`.
- **SCA v1 (`src/sprint_coverage/`)** has only `.pyc` files left — no inspectable `.py` sources; effectively dead/removed. **SCA v2** is the live one.

**SSE vs websocket.** **PR-TAA is the only SSE path** (`text/event-stream`, 3 event types). Everything else is websocket over Redis Streams.

**SCA v2 is a forwarder, not an author.** The complete set of live events on `/api/v1/sca/ws` is the **union of TAA + CAA events** (forwarded verbatim, CAA tagged `source:"caa"`). SCA authors only 5 control dicts + an inbound webhook-routing enum (`TicketEventType` + bare strings `github_pr`/`user_message`/`user_context`) that are **never pushed to the FE** — they feed TAA turns.

**Transport envelope differs.** Typed/promoted agents (TAA, SCA forward) surface the wire value as the top-level message `type`. The legacy `write()`-based handlers (CAA, RAA, TMA, TPA v1, TPA v2) wrap every entry in an outer `{"type":"stream_entry", "entry_type":<wire value>, "content", "metadata", "is_replay", ...}` frame — **the FE reads the event name from `entry_type`, not `type`** for those agents. All envelope + payload fields live inside `metadata` for the legacy frames.

**Raw / non-stream control messages.** `welcome`, `replay_complete`, and `session_restored` (TAA + SCA) are sent as **raw dicts** bypassing `emit()`/XADD. WS handlers also emit transport-control frames (`replay_start`, `replay_end`, `reconnecting`, `reconnected`, `stream_entry`, and an `error` for bad client JSON) — these are protocol frames, **not** agent domain events.

**Dynamic / uncertain event names.** The generic `event` envelope (CAA/RAA/TMA/TPA-v1/v2) carries an open-ended `metadata.event_type` chosen at runtime by `SendEventTool` (e.g. `test_generated`, `analysis_complete`, `dedup_complete`, `quality_complete`, `coverage_complete`, `gap_detected`, plus `visualization` for charts). These are NOT first-class wire types and are not enumerable from static analysis.

**Defined-but-unused (⚠️) summary.** TAA: `validation_failed`. RAA: `summary`, `tool_complete` (docstring only). TMA: 12 dead `EVENT_*` constants (`sub_agent_start`, `sub_agent_signals`, `plan_progress`, `dedup_pair_found`, `dedup_group_formed`, `duplicate_marked`, `quality_analyzed`, `quality_result`, `health_report`, `recommendation`, `summary`, `agent_done`) — `events.py` is effectively documentation. SCA v2: `runs_updated` (`publish_sprint_event` has no callers), `user_context` (consume-only).

**`StreamEntry.type` docstrings are stale.** In CAA, RAA, TMA, TPA-v1, and TPA-v2 the `StreamEntry.type` field docstring enumerates an aspirational/legacy list that does not match what is actually emitted (omits real events, lists phantom ones). Treat docstrings as documentation drift; the emit sites are ground truth.

**CAA module naming.** CAA is `src/coverage_analysis/` — it owns its WS handler, stream manager (`caa:` prefix), session, and graph. There is **no** `src/coverage_authoring` package in the repo; any reference to one is incorrect.

**TMA name collision gotcha.** TMA's `events.py` `EVENT_*` constants and the actual emitted literals diverge: live literals `plan_auto_progress` and `session_complete` are NOT in `events.py` (they match the `StreamEntry` docstring vocabulary instead), while `events.py`'s `plan_progress`/`agent_done` are stale aliases never emitted under those names.

---

*Generated from static analysis of the agentic-test repo (branch: fix/qi-release-readiness-bugs). Emit sites are ground truth; treat in-code docstrings as potentially stale.*
