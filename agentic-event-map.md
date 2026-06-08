# Agentic Event Map — by Agent

A per-agent breakdown of every websocket / SSE event the QI agents emit, for verification. Generated from the same data as the interactive event map, reorganised by agent so each one can be checked against the source system. **Tier assignments are a proposal, not ground truth** — the column to scrutinise.

> Source: *Agentic-Test WebSocket Event Reference* + *Events Structure*. Emit sites are treated as ground truth; in-code docstrings are stale. The Test Maintainer Agent (TMA) is **excluded** — not in use at Testsigma.

## Display tiers

| Tier | What it is | Typical events |
| :--- | :--- | :--- |
| **Suppress** | Plumbing & dead — hide, or bury behind a dev/verbose toggle | `token_usage`, `context_saved`, inbound routing, dead constants |
| **Murmur** | One live, breathing status line — never the raw stream | `reasoning`, `progress`, `sub_agent_progress` |
| **Milestone** | The glanceable, collapsible step spine; failures are a card state | `plan_*`, `phase_*`, `tool_*`, `sub_agent_*`, `validation_*` |
| **Outcome** | Persistent, actionable cards + the accept/reject gates | `test_case_saved`, `scenario_saved`, `analysis_saved`, `visualization`, `question_asked` |
| **Chat** | Not an activity tier — bubbles in the conversation thread | `message`, `welcome`, `dev_context`, `user_message`, `user_context` |

Lifecycle is the verb (`start` opens a card · `progress` updates it in place by `group_id` · `end` closes it · `standalone` = ephemeral line). `group_type` is the noun (10 values). `group_id`/`parent_group_id` give nesting.

## Summary

| Agent | Architecture | Events | Dead/unused | With payload spec |
| :--- | :--- | ---: | ---: | ---: |
| COMMON | Typed (base vocabulary) | 26 | 0 | 10 |
| TAA | Typed | 20 | 1 | 12 |
| CAA | Untyped (legacy) | 16 | 0 | 12 |
| RAA | Untyped (legacy) | 23 | 2 | 16 |
| TPA v1 | Untyped (legacy) | 24 | 0 | 14 |
| TPA v2 | Typed | 8 | 0 | 8 |
| SCA v2 | Untyped (legacy) | 13 | 1 | 1 |
| PR-TAA | SSE | 3 | 0 | 2 |
| **Total** |  | **133** | **4** | — |

---

## COMMON — shared base vocabulary

Typed base. Defines the 25 `CommonEventType` members and the envelope; **emits nothing itself** — TAA is the canonical emitter that exercises them. Other agents reuse subsets.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `session_started` | session | start | Milestone | emitted | Opens the top-level session group when a turn begins. |
| `session_paused` | session | progress | Milestone | emitted | Session paused — usually because it is awaiting user input. |
| `session_resumed` | session | progress | Milestone | emitted | Session resumed after a pause or interrupt. |
| `session_completed` | session | end | Milestone | emitted | Terminal: closes the session group on success. |
| `session_terminated` | session | end | Milestone | emitted | Terminal: closes the session on user/forced termination. |
| `session_failed` | session | end | Milestone | emitted | Terminal: closes the session on a fatal error — render as the failed state of the session frame. |
| `plan_started` | plan | start | Milestone | emitted | Opens a plan card with its initial todo items. |
| `plan_appended` | plan | progress | Milestone | emitted | Appends items to an already-open plan card. |
| `plan_completed` | plan | end | Milestone | emitted | Closes the plan card with final counts. |
| `plan_item_started` | plan_item | start | Milestone | emitted | Marks one plan item as in-progress. |
| `plan_item_completed` | plan_item | end | Milestone | emitted | Marks a plan item done / skipped / failed and bumps the progress count. |
| `phase_started` | phase | start | Milestone | emitted | Opens a phase card (scenarios, test_cases, validation…). |
| `phase_completed` | phase | end | Milestone | emitted | Closes a phase card; may flag review_required. |
| `tool_started` | tool | start | Milestone | emitted | Opens a tool-call card when a tool begins. |
| `tool_completed` | tool | end | Milestone | emitted | Closes a tool-call card on success, with a result preview. |
| `tool_failed` | tool | end | Milestone | emitted | Closes a tool-call card on failure — the error state of the tool card. |
| `question_asked` | question | start | Outcome | emitted | Opens a question card prompting the user. This is a human-in-the-loop gate — the run waits here. |
| `question_answered` | question | end | Outcome | emitted | Closes the question card once the user has answered. |
| `progress` | session | standalone | Murmur | emitted | Free-form progress log line, optional percentage. Collapse into the one murmur line. |
| `reasoning` | session | standalone | Murmur | emitted | Free-form agent thought line. Stream into the thinking trace; do not pin every line. |
| `token_usage` | session | standalone | Suppress | emitted | LLM token consumption for the turn. Pure observability — hide from end users. |
| `error` | session | standalone | Milestone | emitted | Standalone, non-terminal error notice. Surface as a toast / inline error, distinct from session_failed. |
| `message` | session | standalone | Chat | emitted | The user turn itself — a chat bubble in the transcript, not an activity event. |
| `dev_context` | session | standalone | Chat | emitted | The dev-context bubble — context gathered from a GitHub PR or Claude Code session, rendered as an input bubble in the chat transcript. |
| `welcome` | session | standalone | Chat | emitted | Greeting bubble in the chat. Note: the source doc calls this a connection handshake, so keep it here only if it renders as a visible greeting; if it is only a connection ack, it belongs in Suppress. |
| `replay_complete` | session | standalone | Suppress | emitted | Signals that historical replay finished. Transport control frame. |

## TAA — Test Authoring Agent

Typed. Generates scenarios and test cases. Stream `taa:{thread}:stream` → WS; wire value is the top-level `type`. Reuses the full common set.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sub_agent_started` | sub_agent | start | Milestone | emitted | An explorer / validator / TPA-adhoc sub-agent began. |
| `sub_agent_progress` | sub_agent | progress | Murmur | emitted | Incremental sub-agent progress (step / screenshot / finding). High-frequency — murmur. |
| `sub_agent_signals` | sub_agent | progress | Milestone | emitted | Structured signals surfaced at the end of a sub-agent run. |
| `sub_agent_completed` | sub_agent | end | Milestone | emitted | Sub-agent finished successfully. |
| `sub_agent_failed` | sub_agent | end | Milestone | emitted | Sub-agent errored out — failed state of the sub-agent card. |
| `scenario_saved` | scenario | start | Outcome | emitted | First persistence of a scenario; opens the scenario card. A durable artifact. |
| `scenario_updated` | scenario | progress | Outcome | emitted | An existing scenario was updated. |
| `scenario_deleted` | scenario | end | Outcome | emitted | A scenario was permanently removed. |
| `test_case_saved` | test_case | start | Outcome | emitted | A test case was persisted, nested under its scenario. The core payoff of the run. |
| `test_case_updated` | test_case | progress | Outcome | emitted | A test case was edited, by the agent or a manual front-end update. |
| `validation_started` | validation | start | Milestone | emitted | The validation loop began. |
| `validation_iteration` | validation | progress | Murmur | emitted | One validation iteration (pass/fail + issues). Can fire many times — murmur. |
| `validation_completed` | validation | end | Milestone | emitted | The validation loop finished. |
| `validation_failed` | validation | end | Milestone | dead / unused | Would close the validation group with an error — but the helper has no call site. |
| `skill_loaded` | session | standalone | Milestone | emitted | A skill module was loaded — shows which lens the agent is using on the prompt (e.g. scenario-from-figma, impact-analysis). Render the human-readable skill name, not the raw id. |
| `context_saved` | session | standalone | Suppress | emitted | Working context persisted to the context store. Internal. |
| `summary_generated` | session | standalone | Outcome | emitted | A run/turn summary was generated — the "return moment" briefing for the user. |
| `agent_done` | session | standalone | Milestone | emitted | The agent finished its work for the turn/run. |
| `acceptance_status_updated` | session | standalone | Outcome | emitted | A test case acceptance status changed (the human accept/reject result), pushed from the REST callback. |
| `sprint_issues_loaded` | session | standalone | Suppress | emitted | Sprint issues injected into the prompt. Context plumbing. |

## CAA — Coverage Analysis Agent

Untyped (legacy). Coverage gap/impact analysis. `caa:` prefix; every entry wrapped in `{type:"stream_entry", entry_type:…}`; envelope fields live in `payload`, and `group_type`/`lifecycle` are partly **inferred, not in code**.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `question` | question | standalone | Outcome | emitted | Asks the user a question and pauses the graph (legacy literal, not common question_asked). |
| `phase` | session | standalone | Milestone | emitted | Legacy phase-transition marker, distinct from the common phase pair. |
| `event` | session | standalone | Murmur | emitted | Generic envelope; inner event_type carries coverage_complete / gap_detected / viz. Tier depends on inner type. |
| `visualization` | session | standalone | Outcome | emitted | Chart payload auto-emitted after a save (donut / bar / kpi_cards…). A rendered artifact. |
| `agent_done` | session | end | Milestone | emitted | Final assistant message, no further tool calls. |
| `session_complete` | session | standalone | Milestone | emitted | Plan-level completion notice (NOT the common session_completed). |
| `phase_review` | session | standalone | Outcome | emitted | Phase-boundary review summary for approval — a gate. |
| `plan_auto_progress` | session | progress | Murmur | emitted | Auto plan-progress tick after each tool. Murmur. |
| `sub_agent_started` | sub_agent | start | Milestone | emitted | A spawned sub-agent began (gap / impact / requirements). |
| `sub_agent_completed` | sub_agent | end | Milestone | emitted | Sub-agent finished; tokens + findings count. |
| `sub_agent_failed` | sub_agent | end | Milestone | emitted | Sub-agent returned an error. |
| `sub_agent_signals` | sub_agent | standalone | Milestone | emitted | Findings / signals (finding → suggestion pairs). |
| `skill_loaded` | tool | end | Milestone | emitted | Skill loaded via load_skill — surfaces how coverage is being analyzed (e.g. gap-detection, api-coverage). |
| `context_saved` | tool | end | Suppress | emitted | Session context persisted via save_context. Internal. |
| `analysis_saved` | tool | end | Outcome | emitted | Coverage analysis persisted (triggers the viz auto-emit). A durable result. |
| `validation_iteration` | tool | progress | Murmur | emitted | Self-eval / validate_analysis result for iteration N. Murmur. |

## RAA — Run Analyzer Agent

Untyped (legacy). Analyzes test runs. `raa:` prefix; does **not** consume the common typed system at all. Several wire strings coincide with common ones but are emitted as raw literals.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `reasoning` | session | standalone | Murmur | emitted | Live agent thought-stream line. |
| `phase` | phase | standalone | Milestone | emitted | Phase transition notification. |
| `progress` | session | standalone | Murmur | emitted | NL progress; also per sub-agent step / budget exhaustion. |
| `question` | question | standalone | Outcome | emitted | Asks the user and pauses; also session-complete / phase-review pauses. |
| `event` | session | standalone | Murmur | emitted | Generic envelope: session lifecycle markers + send_event + charts. |
| `error` | session | standalone | Milestone | emitted | Fatal / blocking error (graph or resume failure). |
| `token_usage` | session | standalone | Suppress | emitted | Per-LLM-call token accounting. Observability. |
| `agent_done` | session | end | Milestone | emitted | Reason node response with no tool calls. |
| `visualization` | tool | standalone | Outcome | emitted | Chart payload (donut / bar / gauge / heatmap). |
| `tool_start` | tool | start | Milestone | emitted | Before a tool invocation (NOT the common tool_started). |
| `skill_loaded` | tool | end | Milestone | emitted | Skill loaded via load_skill — surfaces the analysis lens (e.g. failure-classification, release-readiness). |
| `context_saved` | tool | end | Suppress | emitted | After save_context completes. Internal. |
| `analysis_saved` | tool | end | Outcome | emitted | After save_analysis_result (triggers auto-viz). A durable result. |
| `validation_result` | tool | standalone | Milestone | emitted | After validate_analysis (status / issues / checks / iteration). |
| `sub_agent_start` | sub_agent | start | Milestone | emitted | Each spawn_* / spawn_parallel agent about to run. |
| `sub_agent_complete` | sub_agent | end | Milestone | emitted | Sub-agent finished (tokens + findings). |
| `sub_agent_error` | sub_agent | end | Milestone | emitted | Sub-agent failed. |
| `sub_agent_signals` | sub_agent | standalone | Milestone | emitted | Sub-agent returned signals / findings. |
| `plan_auto_progress` | plan | progress | Murmur | emitted | Plan tracker auto-advances after tool execution. Murmur. |
| `phase_review` | plan | progress | Outcome | emitted | Mid-session phase-boundary review — a gate. |
| `session_complete` | session | end | Milestone | emitted | All plan items complete (NOT common session_completed). |
| `summary` | session | standalone | Suppress | dead / unused | Listed in the StreamEntry docstring only — no emit site. |
| `tool_complete` | tool | end | Suppress | dead / unused | Documented generic completion; specialized into skill_loaded / context_saved / analysis_saved instead. |

## TPA v1 — Test Planning Agent (legacy)

Untyped (legacy). Superseded by v2 but still in the tree. `tpa:` namespace. Wire strings coincide ad-hoc with common values, not via the enum.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `event` | session | standalone | Murmur | emitted | Generic envelope: session lifecycle text + metadata.event_type sub-events. |
| `question` | question | standalone | Outcome | emitted | Asks the user and pauses (+ optional answer choices). |
| `progress` | session | standalone | Murmur | emitted | NL progress; sub-agents emit per-step (+ optional screenshot). |
| `reasoning` | session | standalone | Murmur | emitted | Live thought stream (phase + thought + optional action). |
| `phase` | phase | start | Milestone | emitted | Phase transition notification. |
| `token_usage` | session | standalone | Suppress | emitted | Per-LLM-call token accounting. Observability. |
| `message` | session | standalone | Chat | emitted | Plain message (autonomous / batch auto-proceed) — rendered as a chat bubble. |
| `error` | session | standalone | Milestone | emitted | Graph execution failure / cannot resume. |
| `agent_done` | session | end | Milestone | emitted | Reason-node content with no tool calls. |
| `tool_start` | tool | start | Milestone | emitted | Before a non-spawn tool invocation. |
| `sub_agent_start` | sub_agent | start | Milestone | emitted | Each spawn_* / spawn_parallel agent starting. |
| `sub_agent_complete` | sub_agent | end | Milestone | emitted | Sub-agent finished (tokens / findings / result collections). |
| `sub_agent_error` | sub_agent | end | Milestone | emitted | Sub-agent failed. |
| `sub_agent_signals` | sub_agent | standalone | Milestone | emitted | Findings / suggestions for plan-review accumulation. |
| `skill_loaded` | tool | end | Milestone | emitted | Skill loaded via load_skill — surfaces the planning lens (e.g. blast_radius, regression_planning). |
| `context_saved` | tool | end | Suppress | emitted | save_context completed. Internal. |
| `plan_result_saved` | plan | standalone | Outcome | emitted | save_plan_result persisted an analysis result. A durable artifact. |
| `plan_created` | plan | start | Milestone | emitted | write_plan created the initial plan. |
| `plan_appended` | plan | progress | Milestone | emitted | append_plan added items. |
| `plan_progress` | plan | progress | Murmur | emitted | update_plan manually changed an item status. |
| `plan_auto_progress` | plan | progress | Murmur | emitted | Plan status auto-advanced after tool execution. Murmur. |
| `phase_review` | phase | end | Outcome | emitted | Mid-session phase-boundary review → approval. A gate. |
| `session_complete` | session | end | Milestone | emitted | All plan items complete. |
| `validation_result` | plan | standalone | Milestone | emitted | validate_plan PASS / FAIL outcome. |

## TPA v2 — Test Planning Agent v2

Typed. The live planner (signal fan-out, scoring, tier ladder, TMS backfill). `tpa:` namespace. Reaches common `phase_*`/`tool_*` via its publisher.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `signal_worker_started` | sub_agent | start | Milestone | emitted | A signal worker (discovery / impact / failure / blast_radius…) started in the fan-out. |
| `signal_worker_completed` | sub_agent | end | Milestone | emitted | Signal worker finished; output count + redis result ref. |
| `signal_worker_failed` | sub_agent | end | Milestone | emitted | Signal worker raised; error class + capped message. |
| `scoring_completed` | session | progress | Milestone | emitted | Deterministic score_test_plan finished; per-tier bucket counts. |
| `tier_view_built` | session | progress | Murmur | emitted | One tier view materialised (smoke / feature / regression / deep_regression). Tick — murmur. |
| `ladder_rung_committed` | session | progress | Murmur | emitted | One tier-rung persistence txn committed (bottom-up UX). Tick — murmur. |
| `tms_backfill_started` | phase | start | Milestone | emitted | TMS sync phase started (push plan + runs + cases to chitragupt). |
| `tms_backfill_completed` | phase | end | Milestone | emitted | TMS sync finished; runs / cases synced + failures + details. |

## SCA v2 — Sprint Coverage Agent v2

Forwarder. Owns no stream/enum; on `/api/v1/sca/ws` it forwards the **union of TAA + CAA events verbatim** (CAA tagged `source:"caa"`). It authors only a few control dicts plus an inbound webhook-routing enum that never reaches the front end.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `welcome` | session | start | Chat | emitted | New SCA session greeting — rendered as a chat bubble. |
| `session_restored` | session | start | Suppress | emitted | Cold-reconnect replay of persisted session data. Transport. |
| `replay_complete` | session | progress | Suppress | emitted | End of TAA+CAA historical replay; carries replayed_count. Transport. |
| `event` | session | standalone | Murmur | emitted | Ad-hoc status / notice line (Session cancelled, not found…). |
| `error` | session | standalone | Milestone | emitted | Connection / auth / lookup failure frame. |
| `jira_ticket` | inbound | standalone | Suppress | emitted | Inbound Jira webhook → TAA turn. Never a front-end frame. |
| `linear_ticket` | inbound | standalone | Suppress | emitted | Inbound Linear webhook → TAA turn. Never a front-end frame. |
| `clickup_ticket` | inbound | standalone | Suppress | emitted | Inbound ClickUp webhook → TAA turn. Never a front-end frame. |
| `azure_devops_ticket` | inbound | standalone | Suppress | emitted | Inbound Azure DevOps work-item webhook → TAA turn. Never a front-end frame. |
| `github_pr` | inbound | standalone | Suppress | emitted | Inbound GitHub PR webhook → TAA PR turn. Never a front-end frame. |
| `user_message` | inbound | standalone | Chat | emitted | The message the user typed and sent — a chat bubble in the transcript. |
| `user_context` | inbound | standalone | Chat | emitted | Context the user shares (Figma / docs / video) — present in the chat window as a log bubble. |
| `runs_updated` | session | standalone | Suppress | dead / unused | Dashboard-invalidation signal; publish_sprint_event has zero callers. |

## PR-TAA — PR Test Authoring

SSE, not websocket. A lightweight two-pass PR test generator over `text/event-stream`. Exactly 3 event types.

| Wire value | group_type | lifecycle | Tier | Status | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `progress` | session | standalone | Murmur | emitted | Phase ticks: compressing → planning → expanding. Murmur. |
| `result` | session | end | Outcome | emitted | Terminal success: the full PR test-authoring result (summary + scenarios / test cases). The payoff. |
| `error` | session | standalone | Milestone | emitted | Failure during generation. |

---

## Render-spec reference (documented payloads)

What each event *becomes* in chat, and the payload fields the UI binds to — from the Events Structure examples. **Illustrative; verify against captured frames.** Events not listed here have no documented payload in the source.

### `session_started`

*Emitted by: COMMON*

**Renders as:** Opens the turn frame. Minimal render — this is the container, not content.

| Field | Render note |
| :--- | :--- |
| `content` | "Session started" — usually not shown |
| `turn_id` | which turn in a multi-turn thread |

### `session_completed`

*Emitted by: COMMON*

**Renders as:** The agent closing-summary bubble: **Generated 14 test cases across 3 scenarios**.

| Field | Render note |
| :--- | :--- |
| `summary` | the closing message |

### `plan_started`

*Emitted by: COMMON*

**Renders as:** Renders the plan checklist up front — every step visible before work begins.

| Field | Render note |
| :--- | :--- |
| `content` | headline, e.g. "Planning 3 steps" |
| `items[] {task, phase}` | one checklist row each; phase groups them |

### `plan_item_completed`

*Emitted by: COMMON*

**Renders as:** Ticks one checklist row and advances the progress count.

| Field | Render note |
| :--- | :--- |
| `task` | the row label |
| `status` | done / skipped / failed → row state |
| `done_count / total_count` | progress, e.g. 1/3 |

### `tool_started`

*Emitted by: COMMON*

**Renders as:** Opens a tool-call card: **search_test_cases("checkout payment flow")**.

| Field | Render note |
| :--- | :--- |
| `tool_name` | card title |
| `args_preview` | the call arguments, shown inline |
| `tool_call_id` | correlates with tool_completed via group_id |

### `tool_completed`

*Emitted by: COMMON*

**Renders as:** Closes the tool card with its result: **Found 12 matches**.

| Field | Render note |
| :--- | :--- |
| `content` | headline result |
| `result_preview` | a JSON snippet — render a count or a few rows, not raw JSON |

### `question_asked`

*Emitted by: COMMON*

**Renders as:** An interactive choice bubble that pauses the run until answered.

| Field | Render note |
| :--- | :--- |
| `question` | the prompt |
| `options[] {id, label}` | tappable buttons |

> ⚠ **Cross-agent gotcha:** RAA uses the wire question (not question_asked) and its options are bare strings, not {id,label} — the renderer must handle both shapes.

### `reasoning`

*Emitted by: COMMON, RAA, TPA v1*

**Renders as:** The phase-aware murmur line: **Scoring · Prioritizing P0 regression tests**. One live line, replaced in place.

| Field | Render note |
| :--- | :--- |
| `phase` | current phase, prefixes the line |
| `message` | the thought text |
| `summary` | optional condensed form |

### `token_usage`

*Emitted by: COMMON, RAA, TPA v1*

**Renders as:** Suppressed for end users. Available for a dev/verbose view only.

| Field | Render note |
| :--- | :--- |
| `input/output/total_tokens` | usage counts |
| `model` | which model ran |

### `error`

*Emitted by: COMMON, PR-TAA, RAA, SCA v2, TPA v1*

**Renders as:** An error state. Payload may carry a raw traceback — **never render the traceback to users**; show a friendly failure + retry.

| Field | Render note |
| :--- | :--- |
| `traceback` | raw stack — logs / dev only, not the UI |

### `sub_agent_started`

*Emitted by: CAA, TAA*

**Renders as:** A nested sub-agent activity card: **App Explorer · Map the checkout flow**.

| Field | Render note |
| :--- | :--- |
| `label` | the sub-agent name |
| `objective` | what it is doing |
| `tool_name` | which spawn tool |

> ⚠ **Cross-agent gotcha:** RAA uses sub_agent_start and labels with the key sub_agent (not label); CAA matches TAA (label).

### `sub_agent_progress`

*Emitted by: TAA*

**Renders as:** Feeds the murmur with determinate progress: **Exploring app · screenshot 3/8**.

| Field | Render note |
| :--- | :--- |
| `kind` | step / screenshot / finding |
| `message` | the progress text |
| `step_number / total_steps` | determinate progress, not a spinner |
| `details` | context, e.g. {url} |

### `sub_agent_signals`

*Emitted by: CAA, RAA, TAA, TPA v1*

**Renders as:** A findings list — each a finding paired with a suggestion.

| Field | Render note |
| :--- | :--- |
| `signals[]` | TAA = {name, value, details}; CAA/RAA = {finding, suggestion} |

> ⚠ **Cross-agent gotcha:** Signal shape differs by agent — TAA = {name, value, details}; CAA/RAA = {finding, suggestion}.

### `sub_agent_completed`

*Emitted by: CAA, TAA*

**Renders as:** Closes the sub-agent card: **Mapped 8 pages, 3 forms**.

| Field | Render note |
| :--- | :--- |
| `summary` | the result line |
| `step_count` | steps taken |

### `scenario_saved`

*Emitted by: TAA*

**Renders as:** Opens a scenario group / header card that test cases nest under.

| Field | Render note |
| :--- | :--- |
| `title` | scenario name |
| `description` | one-line description |
| `scenario.priority` | priority pill (P1…) |
| `scenario.tags[]` | tag chips |

### `test_case_saved`

*Emitted by: TAA*

**Renders as:** A full test-case preview card nested under its scenario.

| Field | Render note |
| :--- | :--- |
| `human_id` | ID badge, e.g. TC-105 |
| `title` | card title |
| `is_update` | false → NEW badge; true → UPDATE badge |
| `test_case.steps[] {action, expected}` | step rows |
| `test_case.priority` | priority pill |
| `template_type` | STEPS vs DOC layout |

### `test_case_updated`

*Emitted by: TAA*

**Renders as:** A change-summary line on the existing card: **Updated title, priority**.

| Field | Render note |
| :--- | :--- |
| `fields_changed[]` | which fields changed → the summary |
| `test_case` | new values to reconcile into the card |

### `validation_iteration`

*Emitted by: CAA, TAA*

**Renders as:** Murmur during the validation loop: **Iteration 2 · 1 issue**.

| Field | Render note |
| :--- | :--- |
| `iteration` | loop counter |
| `passed` | true / false |
| `issues[]` | what failed this pass |

### `validation_completed`

*Emitted by: TAA*

**Renders as:** Closes validation: **Validation passed**.

| Field | Render note |
| :--- | :--- |
| `final_pass` | pass / fail end state |
| `total_iterations` | how many loops |
| `summary` | closing line |

### `skill_loaded`

*Emitted by: CAA, RAA, TAA, TPA v1*

**Renders as:** A milestone showing the lens: **Reading the Figma file…** (map skill_name to a friendly label).

| Field | Render note |
| :--- | :--- |
| `skill_name` | the skill id → map to a human label |
| `skill_description` | CAA/RAA send this; TAA does NOT |

> ⚠ **Cross-agent gotcha:** TAA payload has only skill_name; CAA/RAA add skill_description. Build one skill_id → label map (section 6) to cover TAA.

### `agent_done`

*Emitted by: CAA, RAA, TAA, TPA v1*

**Renders as:** Turn-end marker. Mostly internal — the visible close is session_completed / summary.

| Field | Render note |
| :--- | :--- |
| `reason` | why it ended, e.g. all_scenarios_generated |

### `acceptance_status_updated`

*Emitted by: TAA*

**Renders as:** An outcome line: **TC-105 accepted → saved to folder**.

| Field | Render note |
| :--- | :--- |
| `human_id` | the TC id |
| `status` | accepted / rejected |
| `folder_id` | where it landed |
| `chitragupt_test_case_id` | the persisted TMS id |

### `question`

*Emitted by: CAA, RAA, TPA v1*

**Renders as:** A choice bubble that pauses the run. Options here are bare strings, not {id, label}.

| Field | Render note |
| :--- | :--- |
| `content` | the question text |
| `options[]` | bare strings (legacy) — render as buttons |

> ⚠ **Cross-agent gotcha:** Legacy question (CAA/RAA/TPA-v1) is NOT common question_asked. Options are plain strings, and group_type varies.

### `phase`

*Emitted by: CAA, RAA, TPA v1*

**Renders as:** A phase-transition marker: **Entering: reporting · 75%**.

| Field | Render note |
| :--- | :--- |
| `phase_name` | the new phase |
| `progress_pct` | overall progress |

> ⚠ **Cross-agent gotcha:** Legacy literal (CAA/RAA/TPA-v1), distinct from the common phase_started/phase_completed pair.

### `visualization`

*Emitted by: CAA, RAA*

**Renders as:** An embedded chart in the thread (donut / bar / gauge…).

| Field | Render note |
| :--- | :--- |
| `viz_type` | chart type |
| `title` | chart title |
| `data` | the chart data |

> ⚠ **Cross-agent gotcha:** Nesting differs: CAA wraps under payload.data (event_type=visualization); RAA puts viz_type/title/data flat in payload. Normalize before charting.

### `session_complete`

*Emitted by: CAA, RAA, TPA v1*

**Renders as:** A closing summary for legacy agents (CAA/RAA): analyses saved + findings. Distinct from common session_completed.

| Field | Render note |
| :--- | :--- |
| `analyses_saved` | count |
| `signals[] {finding, suggestion}` | closing findings |
| `total_tokens` | usage — optional |

### `phase_review`

*Emitted by: CAA, RAA, TPA v1*

**Renders as:** A review gate: **Phase complete — review**, with the phase summary and findings.

| Field | Render note |
| :--- | :--- |
| `completed_phase / next_phase` | the boundary |
| `signals[] {finding, suggestion}` | what surfaced |
| `done_count / total_count` | plan progress |

### `analysis_saved`

*Emitted by: CAA, RAA*

**Renders as:** An outcome line: **Saved analysis: gap_detection** (this triggers the auto-viz that follows).

| Field | Render note |
| :--- | :--- |
| `analysis_name` | what was saved |
| `tool_name` | save_coverage_analysis |

### `tool_start`

*Emitted by: RAA, TPA v1*

**Renders as:** Opens a tool card, but RAA sends only tool_name — **no args_preview**, so the card cannot show arguments.

| Field | Render note |
| :--- | :--- |
| `tool_name` | the only field available |

> ⚠ **Cross-agent gotcha:** RAA tool_start is leaner than common tool_started — no args_preview, no tool_call_id in the example.

### `validation_result`

*Emitted by: RAA, TPA v1*

**Renders as:** A validation outcome line: **Validation failed (1 issue)**.

| Field | Render note |
| :--- | :--- |
| `status` | pass / fail |
| `issues[]` | what failed |
| `iteration / max_iterations` | loop position |

### `sub_agent_start`

*Emitted by: RAA, TPA v1*

**Renders as:** Opens a sub-agent / worker card (RAA / TPA v1).

| Field | Render note |
| :--- | :--- |
| `sub_agent` | the name — note the key is sub_agent, not label |
| `tool_name` | which spawn tool |

> ⚠ **Cross-agent gotcha:** RAA/TPA-v1 use sub_agent_start with key sub_agent; TAA/CAA use sub_agent_started with label.

### `sub_agent_complete`

*Emitted by: RAA, TPA v1*

**Renders as:** Closes a worker (RAA / TPA v1).

| Field | Render note |
| :--- | :--- |
| `sub_agent` | worker name |
| `findings_published` | findings count |

### `signal_worker_started`

*Emitted by: TPA v2*

**Renders as:** A parallel-worker card in a fan-out: **Discovery worker started**.

| Field | Render note |
| :--- | :--- |
| `label` | worker name |
| `signal` | discovery / impact / blast_radius… |
| `attempt` | retry number |

### `signal_worker_completed`

*Emitted by: TPA v2*

**Renders as:** Closes a worker: **Discovery · 47 candidates in 2.3s**.

| Field | Render note |
| :--- | :--- |
| `label` | worker name |
| `n` | result count |
| `elapsed_s` | duration |
| `result_ref` | redis pointer — not for display |

### `signal_worker_failed`

*Emitted by: TPA v2*

**Renders as:** Failed-worker state on the card.

| Field | Render note |
| :--- | :--- |
| `error_class` | exception type |
| `error_message` | capped message |
| `attempt` | retry number |

### `scoring_completed`

*Emitted by: TPA v2*

**Renders as:** Headline plus a tier-distribution mini-chart: **Scored 312 candidates**.

| Field | Render note |
| :--- | :--- |
| `scored` | total scored |
| `tier_bucket_counts` | {smoke, feature, regression} → the chart data |

### `tier_view_built`

*Emitted by: TPA v2*

**Renders as:** Murmur tick: **smoke tier: 18 candidates**.

| Field | Render note |
| :--- | :--- |
| `tier` | which tier |
| `n_candidates` | count |
| `modules` | module spread |

### `ladder_rung_committed`

*Emitted by: TPA v2*

**Renders as:** Murmur tick: **Committed smoke rung** (bottom-up build).

| Field | Render note |
| :--- | :--- |
| `tier` | tier name |
| `run_count` | runs committed |
| `case_count` | cases committed |

### `tms_backfill_started`

*Emitted by: TPA v2*

**Renders as:** Opens a sync phase card: **Syncing plan to TMS**.

| Field | Render note |
| :--- | :--- |
| `plan_id` | which plan |

### `tms_backfill_completed`

*Emitted by: TPA v2*

**Renders as:** Closes the sync: **Backfill complete · 4 runs, 312 cases**.

| Field | Render note |
| :--- | :--- |
| `runs_synced` | runs pushed |
| `cases_synced` | cases pushed |
| `failures` | sync failures — surface only if > 0 |

### `result`

*Emitted by: PR-TAA*

**Renders as:** PR-TAA terminal success: the whole authoring result lands as one outcome bubble (summary + scenarios/test cases).

| Field | Render note |
| :--- | :--- |
| `summary` | the result summary |
| `scenarios / test_cases` | the generated artifacts |

---

## Skills each agent can load

`skill_loaded` is treated as a Milestone — it reveals which lens the agent is reasoning through. Map these ids to friendly labels for display. (TAA sends only `skill_name`; CAA/RAA include `skill_description`.)

**TAA — Test Authoring Agent** (19 skills)

  `generate-functional-scenarios` · `scenario-from-jira` · `scenario-from-app-flow` · `scenario-from-api` · `scenario-from-requirements` · `scenario-from-figma` · `scenario-from-linear` · `scenario-from-clickup` · `scenario-from-azure-devops` · `scenario-from-document` · `scenario-from-video` · `dedup-batch` · `synthesis-cross-reference` · `reuse-step-groups` · `test-data-suggestions` · `evaluate-coverage` · `impact-analysis` · `intake-analysis` · `review-and-refine`

**TPA — Planner Agent** (16 skills)

  `intake_analysis` · `discovery_strategy` · `impact_analysis` · `failure_analysis` · `critical_path_analysis` · `blast_radius` · `merge_strategy` · `manual_vs_automation` · `risk_assessment` · `priority_selection` · `execution_estimation` · `assignee_distribution` · `scheduling_sequencing` · `regression_planning` · `smoke_planning` · `feature_planning`

**CAA — Coverage Agent** (10 skills)

  `gap-detection` · `coverage-report` · `requirements-traceability` · `coverage-trends` · `impact-assessment` · `suggestion-generation` · `feature-coverage` · `sprint-coverage` · `api-coverage` · `regression-risk`

**RAA — Run Analyzer Agent** (11 skills)

  `failure-classification` · `action-items` · `bug-categorization` · `review-summary` · `reporting` · `trend-analysis` · `compare-runs` · `release-readiness` · `tester-analytics` · `sprint-health` · `retest-planning`

---

## Caveats & how to verify

- **Two architectures.** Only COMMON, TAA, and TPA v2 use the typed envelope where `group_type`/`lifecycle`/`content` are real. For CAA, RAA, and TPA v1 those fields are *inferred* — the hard dependency for this whole model is a **normalization layer** that backfills `lifecycle` (and validates `group_type`) for the legacy literals before the UI sees them.
- **Same string, different meaning.** Wire values like `progress`, `phase`, `question`, `tool_start`, `session_complete` repeat across agents but are not the same enum and can carry different shapes. Verify per agent, not per string.
- **`reasoning`, not `moreasoning`.** The source §2 table lists `moreasoning` — that is a typo. The real wire string is `reasoning` (used everywhere else and in every payload example). Code against `reasoning`.
- **Docstrings are stale.** In the legacy agents the `StreamEntry.type` docstrings list phantom/aspirational events and omit real ones. Trust emit sites, which is what this map reflects.
- **The generic `event` envelope is not enumerable.** It carries a runtime `metadata.event_type` (`test_generated`, `gap_detected`, `coverage_complete`, `dedup_complete`, …) chosen at emit time. It has no documented payload here by design — this is the messy ~20% to pin with engineering.
- **Transport envelope differs.** Typed agents put the wire value in the top-level `type`; legacy agents wrap it as `{type:"stream_entry", entry_type:<wire>, …}` with fields in `metadata`/`payload`. The Events Structure CAA/RAA examples show the *inner* object.
- **SCA v2 is a forwarder.** The live events on its socket are the union of TAA + CAA. Its own `welcome`/`session_restored`/`replay_complete` are transport; its inbound `*_ticket`/`github_pr`/`user_message`/`user_context` feed TAA turns and (except where noted) do not reach the front end.
- **Chat vs activity.** `message`, `welcome`, `dev_context`, `user_message`, `user_context` are the conversation transcript (Chat tier), not activity events. `welcome` is flagged: the source calls it a connection handshake, so confirm it renders as a visible greeting before keeping it in Chat. `user_context` is treated as a shared-context log bubble (the earlier engineering gap was retired per scope).
