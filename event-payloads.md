# Event Payloads — build-ready sample JSON (scenarios + catalog bind to this)

Sample payloads for **every** event the prototype renders, one per event, grouped by agent. This is
the binding source for Screen 1 (scenario streams) and Screen 2 (per-event catalog).

> **Provenance.** Shapes for events documented in `events-structure.md` are reproduced faithfully.
> Shapes for events that source doc didn't include are **reconstructed** from the render-spec fields
> in `agentic-event-map.md` + the envelope rules below — verify these against captured frames before
> shipping. `events-structure.md` remains the authoritative reference for the subset it covers.

## Envelope cheatsheet (read before binding)
Two architectures. A normalizer should resolve both to one shape before the UI sees them.

- **Typed (COMMON, TAA, TPA-v2):** the wire value is the top-level `type`. Envelope fields are real:
  `event_id, type, group_type, group_id, parent_group_id, lifecycle, content` + event-specific fields.
- **Legacy (CAA, RAA, TPA-v1):** the raw frame is wrapped as
  `{ "type": "stream_entry", "entry_type": <wire>, "content", "payload", "metadata", "is_replay", "entry_id", "timestamp", "sequence", "event_id" }`.
  **The objects below show the *normalized/inner* shape** (with `type` = the wire value and fields
  flattened from `payload`/`metadata`), matching how `events-structure.md` presents them. Your
  normalizer must do: `wire = msg.type === 'stream_entry' ? msg.entry_type : msg.type`, then flatten
  `payload`+`metadata`, then backfill `lifecycle`/`group_type` for legacy literals.
- **SSE (PR-TAA):** `text/event-stream`, three event types, no websocket envelope.
- **Shared ids used below:** typed thread `thread_8d2c`; RAA thread `thread_run9`. Keep `group_id` /
  `parent_group_id` consistent so nesting works.

Cross-agent gotchas baked into the samples: `sub_agent_start` uses key `sub_agent` (not `label`);
legacy `question` options are bare strings (not `{id,label}`); CAA `visualization` nests under
`payload.data`, RAA `visualization` is flat; RAA `tool_start` has only `tool_name`; TAA `skill_loaded`
has no `skill_description`.

---

## COMMON — shared typed vocabulary (canonical emitter: TAA)

```json
// session_started — Milestone
{ "event_id": "a1f3", "type": "session_started", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "start",
  "content": "Session started", "thread_id": "thread_8d2c", "turn_id": 0 }

// session_paused — Milestone (announce "Paused — awaiting input")
{ "event_id": "a1f4", "type": "session_paused", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "Awaiting your input" }

// session_resumed — Milestone
{ "event_id": "a1f5", "type": "session_resumed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "Resumed", "turn_id": 1 }

// session_completed — Milestone (renders the closing-summary bubble; render summary_generated INTO this)
{ "event_id": "29fb", "type": "session_completed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "end",
  "content": "Done", "summary": "Generated 14 test cases across 3 scenarios" }

// session_terminated — Milestone
{ "event_id": "29fc", "type": "session_terminated", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "end",
  "content": "Session terminated by user" }

// session_failed — Milestone (P0: aria-live=assertive; NEVER suppress)
{ "event_id": "29fd", "type": "session_failed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "end",
  "content": "Run failed", "reason": "graph_execution_error" }

// plan_started — Milestone
{ "event_id": "b2e4", "type": "plan_started", "group_type": "plan",
  "group_id": "plan_1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Planning 3 steps",
  "items": [ { "item_id": "i1", "task": "Discover existing tests", "phase": "discovery" },
             { "item_id": "i2", "task": "Score candidates", "phase": "scoring" },
             { "item_id": "i3", "task": "Author cases", "phase": "authoring" } ] }

// plan_appended — Murmur (merge into open plan card; do not add a spine row)
{ "event_id": "b2e5", "type": "plan_appended", "group_type": "plan",
  "group_id": "plan_1", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "Added 1 step", "items": [ { "item_id": "i4", "task": "Validate", "phase": "validation" } ] }

// plan_completed — Milestone
{ "event_id": "b2e6", "type": "plan_completed", "group_type": "plan",
  "group_id": "plan_1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Plan complete", "done_count": 4, "total_count": 4 }

// plan_item_started — Milestone
{ "event_id": "b2e7", "type": "plan_item_started", "group_type": "plan_item",
  "group_id": "i1", "parent_group_id": "plan_1", "lifecycle": "start",
  "content": "Discovering existing tests", "task": "Discover existing tests", "phase": "discovery" }

// plan_item_completed — Milestone
{ "event_id": "c3f5", "type": "plan_item_completed", "group_type": "plan_item",
  "group_id": "i1", "parent_group_id": "plan_1", "lifecycle": "end",
  "content": "Discovery done", "item_id": "i1", "task": "Discover existing tests",
  "phase": "discovery", "status": "done", "done_count": 1, "total_count": 3, "notes": "" }

// phase_started — Milestone
{ "event_id": "c401", "type": "phase_started", "group_type": "phase",
  "group_id": "ph_scn", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Phase: scenarios" }

// phase_completed — Milestone (promote to gate if review_required:true)
{ "event_id": "c402", "type": "phase_completed", "group_type": "phase",
  "group_id": "ph_scn", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Scenarios phase complete", "review_required": false }

// tool_started — Murmur (open) → settles to Milestone on completion
{ "event_id": "d4a6", "type": "tool_started", "group_type": "tool",
  "group_id": "call_xy12", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Running search_test_cases",
  "tool_name": "search_test_cases", "tool_call_id": "call_xy12",
  "args_preview": { "query": "checkout payment flow" } }

// tool_completed — Milestone (full result_preview behind inspect)
{ "event_id": "e5b7", "type": "tool_completed", "group_type": "tool",
  "group_id": "call_xy12", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Found 12 matches",
  "tool_name": "search_test_cases", "tool_call_id": "call_xy12",
  "result_preview": "[{\"id\":\"TC-101\",\"title\":\"Checkout with Visa\"}, ...]" }

// tool_failed — Milestone (error card state, assertive)
{ "event_id": "e5b8", "type": "tool_failed", "group_type": "tool",
  "group_id": "call_xy12", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "search_test_cases failed", "tool_name": "search_test_cases",
  "tool_call_id": "call_xy12", "error": "Upstream timeout" }

// question_asked — Outcome (GATE; options are {id,label}; expands the composer)
{ "event_id": "f6c8", "type": "question_asked", "group_type": "question",
  "group_id": "q1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Which environment?",
  "question": "Which environment should this plan target?",
  "options": [ { "id": "staging", "label": "Staging" }, { "id": "prod", "label": "Production" } ] }

// question_answered — Outcome (closes the gate, resume run)
{ "event_id": "f6c9", "type": "question_answered", "group_type": "question",
  "group_id": "q1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Answered: Staging", "answer": "staging" }

// progress — Murmur (DETAIL segment)
{ "event_id": "1701", "type": "progress", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Mapping forms", "message": "Mapping forms", "percentage": 40 }

// reasoning — Murmur (THOUGHT segment)
{ "event_id": "18ea", "type": "reasoning", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Prioritizing P0 regression tests",
  "message": "Prioritizing P0 regression tests", "phase": "scoring", "summary": "" }

// token_usage — Suppress (dev-only cost footer)
{ "event_id": "07d9", "type": "token_usage", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "", "input_tokens": 4210, "output_tokens": 880,
  "total_tokens": 5090, "model": "claude-sonnet-4-6" }

// error — Milestone (standalone; assertive; REDACT traceback from UI)
{ "event_id": "14bb", "type": "error", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Something went wrong", "traceback": "Traceback (most recent call last): ..." }

// message — Chat (user turn bubble)
{ "event_id": "2200", "type": "message", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Generate checkout regression tests" }

// dev_context — Chat (PR / Claude Code context input bubble)
{ "event_id": "2201", "type": "dev_context", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Context from PR #482", "source": "github_pr", "ref": "PR #482" }

// welcome — Chat (greeting bubble; dedupe per thread, don't re-greet on reconnect)
{ "event_id": "2202", "type": "welcome", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Hi! I can author, plan and analyze tests for you." }

// replay_complete — Suppress (transport)
{ "event_id": "2203", "type": "replay_complete", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "", "replayed_count": 37 }
```

---

## TAA — Test Authoring Agent (typed)

```json
// sub_agent_started — Milestone (title = label ?? sub_agent)
{ "event_id": "6d3f", "type": "sub_agent_started", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Exploring app", "sub_agent_id": "sa_app1", "label": "App Explorer",
  "tool_name": "spawn_app_explorer", "objective": "Map the checkout flow" }

// sub_agent_progress — Murmur (determinate → progress bar)
{ "event_id": "7e40", "type": "sub_agent_progress", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "Captured screenshot of cart page", "sub_agent_id": "sa_app1",
  "kind": "screenshot", "message": "Captured screenshot of cart page",
  "step_number": 3, "total_steps": 8, "details": { "url": "/cart" } }

// sub_agent_signals — Milestone findings attachment (TAA shape: {name,value,details})
{ "event_id": "8f51", "type": "sub_agent_signals", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "2 signals", "sub_agent_id": "sa_app1",
  "signals": [ { "name": "form_found", "value": "checkout-form", "details": { "fields": 6 } } ] }

// sub_agent_completed — Milestone
{ "event_id": "9062", "type": "sub_agent_completed", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Exploration complete", "sub_agent_id": "sa_app1",
  "summary": "Mapped 8 pages, 3 forms", "step_count": 8 }

// sub_agent_failed — Milestone (assertive)
{ "event_id": "9063", "type": "sub_agent_failed", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "App Explorer failed", "sub_agent_id": "sa_app1", "error": "Navigation timeout" }

// scenario_saved — Outcome (group header; test cases nest under group_id; category drives the tag pill)
{ "event_id": "3a0c", "type": "scenario_saved", "group_type": "scenario",
  "group_id": "scn_42", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Saved scenario: Successful account creation via Google OAuth",
  "scenario_id": "scn_42", "title": "Successful account creation via Google OAuth",
  "description": "User signs up with a Google account",
  "scenario": { "id": "scn_42", "title": "Successful account creation via Google OAuth",
    "priority": "P1", "category": "Happy Path", "tags": ["oauth","signup"] } }
// category drives the right-aligned tag pill in the scenarios-review card:
//   Happy Path (green) | Error handling (orange; security-critical → red) | Data handling (blue) | Edge case (purple)

// scenario_updated — Outcome
{ "event_id": "3a0d", "type": "scenario_updated", "group_type": "scenario",
  "group_id": "scn_42", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "Updated scenario", "scenario_id": "scn_42",
  "fields_changed": ["description"], "scenario": { "id": "scn_42", "priority": "P1" } }

// scenario_deleted — Outcome
{ "event_id": "3a0e", "type": "scenario_deleted", "group_type": "scenario",
  "group_id": "scn_42", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Removed scenario: Guest checkout", "scenario_id": "scn_42" }

// test_case_saved — Outcome (nested under scenario; is_update=false → NEW; feeds the review table)
{ "event_id": "4b1d", "type": "test_case_saved", "group_type": "test_case",
  "group_id": "tc_900", "parent_group_id": "scn_42", "lifecycle": "start",
  "content": "Saved TC: Retry on 500 returns correct HTTP status",
  "test_case_id": "tc_900", "scenario_id": "scn_42", "title": "Retry on 500 returns correct HTTP status",
  "human_id": "TC-105", "is_update": false,
  "test_case": { "id": "tc_900",
    "steps": [ { "action": "Trigger a 500 from the OAuth callback", "expected": "Client retries with backoff" } ],
    "priority": "P1", "template_type": "STEPS",
    "module": "Payment Gateway", "test_type": "Functional", "acceptance_status": "pending" } }
// Review-table bindings: is_update → New/Update badge · priority → priority icon (P0/P1 = red up-arrows,
//   P2 = amber "=", lower = down) · module → module link · test_type ∈ Functional | Non-Functional |
//   User Experience · acceptance_status ∈ pending | accepted | rejected (drives the status pill + tab).

// test_case_updated — Outcome (patch existing card by test_case_id)
{ "event_id": "5c2e", "type": "test_case_updated", "group_type": "test_case",
  "group_id": "tc_900", "parent_group_id": "scn_42", "lifecycle": "progress",
  "content": "Updated 2 fields", "test_case_id": "tc_900", "scenario_id": "scn_42",
  "fields_changed": ["title", "priority"], "test_case": { "id": "tc_900", "priority": "P1" } }

// validation_started — Milestone
{ "event_id": "a172", "type": "validation_started", "group_type": "validation",
  "group_id": "val_1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Validating test cases" }

// validation_iteration — Murmur (issues[] retained in dev)
{ "event_id": "a173", "type": "validation_iteration", "group_type": "validation",
  "group_id": "val_1", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "Iteration 2: 1 issue", "iteration": 2, "passed": false,
  "issues": ["Missing expected result on step 4"] }

// validation_completed — Milestone on pass / Outcome card on fail (tier by final_pass)
{ "event_id": "b284", "type": "validation_completed", "group_type": "validation",
  "group_id": "val_1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Validation passed", "total_iterations": 3, "final_pass": true,
  "summary": "All test cases valid" }

// validation_failed — Milestone (latent / dead; closes validation group as error if ever fired)
{ "event_id": "b285", "type": "validation_failed", "group_type": "validation",
  "group_id": "val_1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Validation failed", "final_pass": false, "issues": ["Unresolved after 3 iterations"] }

// skill_loaded — Milestone (TAA: only skill_name, NO skill_description → use id→label map)
{ "event_id": "c395", "type": "skill_loaded", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Loaded skill: scenario-from-jira", "skill_name": "scenario-from-jira" }

// context_saved — Suppress
{ "event_id": "c396", "type": "context_saved", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone", "content": "" }

// summary_generated — Outcome (return-moment briefing; render INTO session_completed)
{ "event_id": "c397", "type": "summary_generated", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Generated 14 test cases across 3 scenarios",
  "summary": "Generated 14 test cases across 3 scenarios (8 NEW, 6 UPDATE)." }

// agent_done — Milestone (internal turn-end; suppress if a summary/close follows)
{ "event_id": "e5b9", "type": "agent_done", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "", "reason": "all_scenarios_generated" }

// acceptance_status_updated — Outcome (out-of-band REST; reconcile by test_case_id)
{ "event_id": "d4a7", "type": "acceptance_status_updated", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "TC accepted", "scenario_id": "scn_42", "test_case_id": "tc_900",
  "human_id": "TC-105", "folder_id": "fld_3", "chitragupt_test_case_id": "1023",
  "status": "accepted" }

// sprint_issues_loaded — Suppress (dev: input provenance)
{ "event_id": "d4a8", "type": "sprint_issues_loaded", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Loaded 12 sprint issues", "count": 12 }
```

### TAA review surfaces (build composites — Screens S6–S10, not new wire events)
These are UI compositions of the events above:
- **Scenarios-review card ("N scenarios generated") — Outcome GATE #2.** The batch of `scenario_saved`
  rendered as a numbered list with category tag pills, plus a gate: "Review the scenarios below. Edit,
  add, or remove any scenario by replying in chat before generating detailed test cases." + **Proceed →**.
- **Test-case review table (right work-panel).** `test_case_saved` events grouped by scenario/feature
  into collapsible groups (each with a count), under tabs **All / Pending / Accepted / Rejected**. Each
  row: priority icon (`priority`), title, New/Update badge (`is_update`), template/steps icon, module
  link (`module`), `test_type`, link icon, status pill (`acceptance_status`). `acceptance_status_updated`
  flips a row's pill and moves it between tabs. Header = feature title + source counts (Figma files,
  Jira Stories). A run-level **"Generated N Test Cases"** milestone settles with 👍 / 👎 · ↻ Retry ·
  💬 Give Feedback. Apply the Outcome-density rules (grouping, collapse-past-N, bulk accept) from
  `tier-decision-doc.html`.

---

## CAA — Coverage Analysis Agent (legacy; inner shape shown)

```json
// question — Outcome GATE (legacy: options are BARE STRINGS, prompt in content)
{ "type": "question", "content": "Generate a coverage report?", "group_type": "question",
  "group_id": "q_caa1", "parent_group_id": "thread_8d2c",
  "payload": { "options": ["Yes, generate it", "No, skip"], "thread_id": "thread_8d2c" } }

// phase — Murmur (legacy tick; NOTE group_type=session for CAA, progress_pct)
{ "type": "phase", "content": "Entering: reporting", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "phase_name": "reporting", "progress_pct": 75.0 } }

// event — Conditional ROUTER (tier from inner metadata.event_type). Here: a chart → Outcome
{ "type": "event", "content": "Coverage by feature", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "event_type": "visualization",
    "data": { "viz_type": "donut", "title": "Overall Coverage",
              "data": { "covered": 240, "uncovered": 72 } } },
  "metadata": { "auto_viz": true } }

// event — same envelope, a gap finding → Outcome
{ "type": "event", "content": "Gap detected", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "event_type": "gap_detected",
    "data": { "area": "guest-checkout refund", "severity": "high" } }, "metadata": {} }

// event — same envelope, a plain status → Murmur
{ "type": "event", "content": "Session cancelled", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "event_type": "status", "message": "Session cancelled" }, "metadata": {} }

// visualization — Outcome (CAA NESTS under payload.data — normalize before charting)
{ "type": "visualization", "content": "Overall Coverage", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "event_type": "visualization",
    "data": { "viz_type": "donut", "title": "Overall Coverage", "subtitle": null,
              "data": { "covered": 240, "uncovered": 72 } } },
  "metadata": { "auto_viz": true } }

// agent_done — Milestone
{ "type": "agent_done", "content": "", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "reason": "analysis_complete" } }

// session_complete — Outcome (legacy run-close briefing; match summary_generated standing)
{ "type": "session_complete", "content": "Coverage analysis complete", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "analyses_saved": 4, "total_llm_calls": 11, "total_tokens": 26300,
    "plan": [ { "task": "Detect gaps", "status": "done" } ],
    "signals": [ { "finding": "No tests for guest-checkout refund",
                   "suggestion": "Add a refund flow test" } ] } }

// phase_review — Outcome GATE (review/approval; dedupe vs question/session_complete in same window)
{ "type": "phase_review", "content": "Phase complete — review", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "completed_phase": "detection", "next_phase": "reporting",
    "done_count": 2, "total_count": 4, "analyses_saved": 2, "total_tokens": 8800,
    "signals": [ { "finding": "...", "suggestion": "..." } ] } }

// plan_auto_progress — Murmur
{ "type": "plan_auto_progress", "content": "Step advanced", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null,
  "payload": { "done_count": 2, "total_count": 4 } }

// sub_agent_started — Milestone (CAA uses label, like TAA)
{ "type": "sub_agent_started", "content": "Gap Detection Agent started", "group_type": "sub_agent",
  "group_id": "call_g1", "parent_group_id": "thread_8d2c",
  "payload": { "lifecycle": "start", "sub_agent_id": "call_g1", "label": "Gap Detection Agent",
    "tool_name": "spawn_gap_detection_agent", "objective": "Find untested requirements in checkout" } }

// sub_agent_completed — Milestone
{ "type": "sub_agent_completed", "content": "Gap Detection Agent done", "group_type": "sub_agent",
  "group_id": "call_g1", "parent_group_id": "thread_8d2c",
  "payload": { "lifecycle": "end", "sub_agent_id": "call_g1", "label": "Gap Detection Agent",
    "findings_count": 7, "input_tokens": 3200, "output_tokens": 540, "llm_calls": 2 } }

// sub_agent_failed — Milestone (assertive)
{ "type": "sub_agent_failed", "content": "Gap Detection Agent failed", "group_type": "sub_agent",
  "group_id": "call_g1", "parent_group_id": "thread_8d2c",
  "payload": { "lifecycle": "end", "sub_agent_id": "call_g1", "label": "Gap Detection Agent",
    "error": "LLM call failed" } }

// sub_agent_signals — Milestone findings (CAA/RAA shape: {finding,suggestion})
{ "type": "sub_agent_signals", "content": "7 findings", "group_type": "sub_agent",
  "group_id": "call_g1", "parent_group_id": "thread_8d2c",
  "payload": { "sub_agent_id": "call_g1", "label": "Gap Detection Agent",
    "signals": [ { "finding": "No tests for guest checkout refund",
                   "suggestion": "Add a refund flow test case" } ],
    "source_tool": "spawn_gap_detection_agent" } }

// skill_loaded — Milestone (CAA INCLUDES skill_description)
{ "type": "skill_loaded", "content": "Loaded skill: gap-detection", "group_type": "tool",
  "group_id": "call_s1", "parent_group_id": "thread_8d2c",
  "payload": { "tool_name": "load_skill", "tool_call_id": "call_s1",
    "skill_name": "gap-detection", "skill_description": "Detect missing/incomplete coverage gaps" } }

// context_saved — Suppress
{ "type": "context_saved", "content": "", "group_type": "tool",
  "group_id": "call_c1", "parent_group_id": "thread_8d2c",
  "payload": { "tool_name": "save_context" } }

// analysis_saved — Outcome (triggers the auto-viz that follows)
{ "type": "analysis_saved", "content": "Saved analysis: gap_detection", "group_type": "tool",
  "group_id": "call_a1", "parent_group_id": "thread_8d2c",
  "payload": { "tool_name": "save_coverage_analysis", "tool_call_id": "call_a1",
    "analysis_name": "gap_detection" } }

// validation_iteration — Murmur
{ "type": "validation_iteration", "content": "Iteration 1", "group_type": "tool",
  "group_id": "val_caa", "parent_group_id": "thread_8d2c",
  "payload": { "iteration": 1, "passed": true, "issues": [] } }
```

---

## RAA — Run Analyzer Agent (legacy; thread `thread_run9`)

```json
// reasoning — Murmur (THOUGHT)
{ "type": "reasoning", "content": "Classifying CI-only failures as flaky", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "message": "Classifying CI-only failures as flaky", "phase": "classification" } }

// phase — Murmur (legacy tick; group_type=phase for RAA)
{ "type": "phase", "content": "Entering: reporting", "group_type": "phase",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "phase_name": "reporting", "progress_pct": 75.0, "thread_id": "thread_run9" } }

// progress — Murmur (DETAIL)
{ "type": "progress", "content": "Analyzing 42 failures", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "message": "Analyzing 42 failures", "percentage": 30 } }

// question — Outcome GATE (bare-string options)
{ "type": "question", "content": "Generate a release email?", "group_type": "session",
  "group_id": "q_raa1", "parent_group_id": "thread_run9",
  "payload": { "options": ["Yes, draft it", "No, skip"], "thread_id": "thread_run9" } }

// event — Conditional router (RAA generic envelope: lifecycle markers + charts + send_event)
{ "type": "event", "content": "Run analysis started", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "event_type": "session_start", "message": "Run analysis started" }, "metadata": {} }

// error — Milestone (assertive; REDACT traceback)
{ "type": "error", "content": "Graph execution failed", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "traceback": "Traceback (most recent call last): ..." } }

// token_usage — Suppress
{ "type": "token_usage", "content": "", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "input_tokens": 1800, "output_tokens": 410, "total_tokens": 2210,
    "cumulative_total_tokens": 15500, "llm_call_number": 6 } }

// agent_done — Milestone
{ "type": "agent_done", "content": "", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null, "payload": { "reason": "report_ready" } }

// visualization — Outcome (RAA is FLAT in payload — no payload.data wrapper)
{ "type": "visualization", "content": "Failure breakdown", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "viz_type": "donut", "title": "Failure Classification", "subtitle": "Run #9",
    "data": { "true_failure": 6, "flaky": 9, "environmental": 3, "false_positive": 2 } },
  "metadata": { "auto_viz": true } }

// tool_start — Murmur (RAA: ONLY tool_name — no args_preview, no tool_call_id)
{ "type": "tool_start", "content": "Running fetch_run_results", "group_type": "tool",
  "group_id": "call_r1", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "fetch_run_results" } }

// skill_loaded — Milestone (RAA includes description)
{ "type": "skill_loaded", "content": "Loaded skill: failure-classification", "group_type": "tool",
  "group_id": "call_s1", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "load_skill", "skill_name": "failure-classification",
    "skill_description": "Classify failures as true/false-positive/flaky/env" } }

// context_saved — Suppress
{ "type": "context_saved", "content": "", "group_type": "tool",
  "group_id": "call_c2", "parent_group_id": "thread_run9", "payload": { "tool_name": "save_context" } }

// analysis_saved — Outcome
{ "type": "analysis_saved", "content": "Saved analysis: failure_classification", "group_type": "tool",
  "group_id": "call_a2", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "save_analysis_result", "analysis_name": "failure_classification" } }

// validation_result — Milestone (issues[]/checks via inspect)
{ "type": "validation_result", "content": "Validation failed (1 issue)", "group_type": "tool",
  "group_id": "call_v1", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "validate_analysis", "status": "fail",
    "issues": ["3 failures missing classification"], "checks": { "all_classified": false },
    "iteration": 1, "max_iterations": 3 } }

// sub_agent_start — Milestone (KEY IS sub_agent, not label)
{ "type": "sub_agent_start", "content": "Classification Agent started", "group_type": "sub_agent",
  "group_id": "call_c1", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "spawn_classification_agent", "sub_agent": "Classification Agent" } }

// sub_agent_complete — Milestone
{ "type": "sub_agent_complete", "content": "Classification Agent done", "group_type": "sub_agent",
  "group_id": "call_c1", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "spawn_classification_agent", "sub_agent": "Classification Agent",
    "input_tokens": 4100, "output_tokens": 720, "llm_calls": 3, "findings_published": 9 } }

// sub_agent_error — Milestone (assertive)
{ "type": "sub_agent_error", "content": "Classification Agent failed", "group_type": "sub_agent",
  "group_id": "call_c1", "parent_group_id": "thread_run9",
  "payload": { "sub_agent": "Classification Agent", "error": "Timeout" } }

// sub_agent_signals — Milestone findings ({finding,suggestion})
{ "type": "sub_agent_signals", "content": "9 findings", "group_type": "sub_agent",
  "group_id": "call_c1", "parent_group_id": "thread_run9",
  "payload": { "signals": [ { "finding": "TC-44 fails only on CI",
    "suggestion": "Mark as flaky/environmental" } ], "source_tool": "spawn_classification_agent" } }

// plan_auto_progress — Murmur
{ "type": "plan_auto_progress", "content": "Step advanced", "group_type": "plan",
  "group_id": "thread_run9", "parent_group_id": null, "payload": { "done_count": 3, "total_count": 5 } }

// phase_review — Outcome GATE
{ "type": "phase_review", "content": "Phase complete — review", "group_type": "plan",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "completed_phase": "classification", "next_phase": "reporting",
    "done_count": 2, "total_count": 3, "signals": [ { "finding": "...", "suggestion": "..." } ] } }

// session_complete — Outcome (legacy run-close)
{ "type": "session_complete", "content": "Run analysis complete", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null,
  "payload": { "analyses_saved": 3, "total_llm_calls": 14, "total_tokens": 31200,
    "plan": [ { "task": "Classify failures", "status": "done" } ],
    "signals": [ { "finding": "...", "suggestion": "..." } ] } }

// summary — Suppress (DEAD: docstring only, no emit site)
{ "type": "summary", "content": "", "group_type": "session",
  "group_id": "thread_run9", "parent_group_id": null, "payload": {} }

// tool_complete — Milestone (latent/DEAD; re-homed so a stray completion closes its card)
{ "type": "tool_complete", "content": "Tool finished", "group_type": "tool",
  "group_id": "call_r1", "parent_group_id": "thread_run9", "payload": { "tool_name": "fetch_run_results" } }
```

---

## TPA v1 — Test Planning Agent (legacy)

```json
// event — Conditional router
{ "type": "event", "content": "Planning started", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "event_type": "session_start", "message": "Planning started" }, "metadata": {} }

// question — Outcome GATE (bare-string options)
{ "type": "question", "content": "Target which environments?", "group_type": "question",
  "group_id": "q_tpa1", "parent_group_id": "thread_tpa1",
  "payload": { "options": ["Staging only", "Staging + Prod"] } }

// progress — Murmur
{ "type": "progress", "content": "Scoring candidates", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null, "payload": { "message": "Scoring candidates" } }

// reasoning — Murmur (THOUGHT)
{ "type": "reasoning", "content": "Weighting indirect regression risk", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "phase": "scoring", "thought": "Weighting indirect regression risk", "action": null } }

// phase — Murmur (legacy tick; lifecycle start for TPA-v1)
{ "type": "phase", "content": "Entering: scoring", "group_type": "phase",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "phase_name": "scoring", "progress_pct": 50.0 } }

// token_usage — Suppress
{ "type": "token_usage", "content": "", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "input_tokens": 2200, "output_tokens": 500, "total_tokens": 2700 } }

// message — Chat (autonomous / batch auto-proceed)
{ "type": "message", "content": "Auto-proceeding with the default plan", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null, "payload": {} }

// error — Milestone (assertive)
{ "type": "error", "content": "Cannot resume graph", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "traceback": "Traceback (most recent call last): ..." } }

// agent_done — Milestone
{ "type": "agent_done", "content": "", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null, "payload": { "reason": "plan_ready" } }

// tool_start — Murmur (non-spawn tool)
{ "type": "tool_start", "content": "Running search_existing_tests", "group_type": "tool",
  "group_id": "call_t1", "parent_group_id": "thread_tpa1",
  "payload": { "tool_name": "search_existing_tests" } }

// sub_agent_start — Milestone (key sub_agent)
{ "type": "sub_agent_start", "content": "Impact Agent started", "group_type": "sub_agent",
  "group_id": "call_i1", "parent_group_id": "thread_tpa1",
  "payload": { "tool_name": "spawn_impact_agent", "sub_agent": "Impact Agent" } }

// sub_agent_complete — Milestone
{ "type": "sub_agent_complete", "content": "Impact Agent done", "group_type": "sub_agent",
  "group_id": "call_i1", "parent_group_id": "thread_tpa1",
  "payload": { "sub_agent": "Impact Agent", "findings_published": 5 } }

// sub_agent_error — Milestone
{ "type": "sub_agent_error", "content": "Impact Agent failed", "group_type": "sub_agent",
  "group_id": "call_i1", "parent_group_id": "thread_tpa1",
  "payload": { "sub_agent": "Impact Agent", "error": "timeout" } }

// sub_agent_signals — Milestone findings
{ "type": "sub_agent_signals", "content": "5 findings", "group_type": "sub_agent",
  "group_id": "call_i1", "parent_group_id": "thread_tpa1",
  "payload": { "signals": [ { "finding": "checkout module changed",
    "suggestion": "include payment regression" } ] } }

// skill_loaded — Milestone
{ "type": "skill_loaded", "content": "Loaded skill: blast_radius", "group_type": "tool",
  "group_id": "call_s3", "parent_group_id": "thread_tpa1",
  "payload": { "tool_name": "load_skill", "skill_name": "blast_radius",
    "skill_description": "Map change propagation; classify direct/indirect/transitive risk" } }

// context_saved — Suppress
{ "type": "context_saved", "content": "", "group_type": "tool",
  "group_id": "call_c3", "parent_group_id": "thread_tpa1", "payload": { "tool_name": "save_context" } }

// plan_result_saved — Outcome (durable artifact)
{ "type": "plan_result_saved", "content": "Saved plan result", "group_type": "plan",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "tool_name": "save_plan_result", "result_name": "regression_plan" } }

// plan_created — Milestone
{ "type": "plan_created", "content": "Plan created", "group_type": "plan",
  "group_id": "plan_t1", "parent_group_id": "thread_tpa1",
  "payload": { "items": [ { "task": "Discover", "phase": "discovery" } ] } }

// plan_appended — Murmur (merge into open plan card)
{ "type": "plan_appended", "content": "Added 2 items", "group_type": "plan",
  "group_id": "plan_t1", "parent_group_id": "thread_tpa1",
  "payload": { "items": [ { "task": "Score", "phase": "scoring" } ] } }

// plan_progress — Murmur (manual item status change)
{ "type": "plan_progress", "content": "Item updated", "group_type": "plan",
  "group_id": "plan_t1", "parent_group_id": "thread_tpa1",
  "payload": { "item_id": "i2", "status": "in_progress" } }

// plan_auto_progress — Murmur
{ "type": "plan_auto_progress", "content": "Step advanced", "group_type": "plan",
  "group_id": "plan_t1", "parent_group_id": "thread_tpa1", "payload": { "done_count": 2, "total_count": 4 } }

// phase_review — Outcome GATE (lifecycle end for TPA-v1)
{ "type": "phase_review", "content": "Phase complete — approve?", "group_type": "phase",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "completed_phase": "scoring", "next_phase": "authoring",
    "done_count": 2, "total_count": 3, "signals": [ { "finding": "...", "suggestion": "..." } ] } }

// session_complete — Outcome (legacy run-close)
{ "type": "session_complete", "content": "Planning complete", "group_type": "session",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "analyses_saved": 1, "total_tokens": 18400,
    "plan": [ { "task": "Author plan", "status": "done" } ] } }

// validation_result — Milestone
{ "type": "validation_result", "content": "Plan validation PASS", "group_type": "plan",
  "group_id": "thread_tpa1", "parent_group_id": null,
  "payload": { "tool_name": "validate_plan", "status": "pass", "issues": [] } }
```

---

## TPA v2 — Test Planning Agent v2 (typed; thread `thread_8d2c`)

```json
// signal_worker_started — Milestone (parallel fan-out; ≥2 → Murmur N-of-M strip)
{ "event_id": "f6c8", "type": "signal_worker_started", "group_type": "sub_agent",
  "group_id": "sw_discovery", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "discovery worker started", "signal": "discovery", "label": "Discovery", "attempt": 1 }

// signal_worker_completed — Milestone
{ "event_id": "0719", "type": "signal_worker_completed", "group_type": "sub_agent",
  "group_id": "sw_discovery", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "discovery: 47 candidates in 2.3s", "signal": "discovery",
  "elapsed_s": 2.34, "n": 47, "result_ref": "tpa:v3:plan_55:signal:discovery" }

// signal_worker_failed — Milestone (assertive; class/message/attempt via inspect)
{ "event_id": "182a", "type": "signal_worker_failed", "group_type": "sub_agent",
  "group_id": "sw_blast", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "blast_radius failed", "signal": "blast_radius",
  "error_class": "TimeoutError", "error_message": "redis read exceeded 5s", "attempt": 2 }

// scoring_completed — Milestone (tier_bucket_counts → mini-chart on expand)
{ "event_id": "293b", "type": "scoring_completed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "Scored 312 candidates", "scored": 312,
  "tier_bucket_counts": { "smoke": 18, "feature": 64, "regression": 230 } }

// tier_view_built — Murmur (rate-limited tick)
{ "event_id": "3a4c", "type": "tier_view_built", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "smoke tier: 18 candidates", "tier": "smoke", "n_candidates": 18, "modules": 5 }

// ladder_rung_committed — Murmur (run_count/case_count audit via inspect)
{ "event_id": "4b5d", "type": "ladder_rung_committed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "Committed smoke rung", "tier": "smoke", "tier_rank": 1,
  "plan_id": "plan_55", "run_count": 1, "case_count": 18 }

// tms_backfill_started — Milestone
{ "event_id": "5c6e", "type": "tms_backfill_started", "group_type": "phase",
  "group_id": "backfill_1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Syncing plan to TMS", "plan_id": "plan_55" }

// tms_backfill_completed — Milestone (surface failures only if > 0)
{ "event_id": "6d7f", "type": "tms_backfill_completed", "group_type": "phase",
  "group_id": "backfill_1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Backfill complete", "plan_id": "plan_55",
  "runs_synced": 4, "cases_synced": 312, "failures": 0, "details": {} }
```

---

## SCA v2 — Sprint Coverage Agent (forwarder; own control dicts + source-tagged forwards)

```json
// welcome — Chat (greeting; dedupe per thread, skip on reconnect)
{ "type": "welcome", "content": "Sprint coverage assistant ready.", "group_type": "session",
  "group_id": "thread_sca1", "parent_group_id": null }

// session_restored — Suppress (cold reconnect; dev marker)
{ "type": "session_restored", "content": "", "group_type": "session",
  "group_id": "thread_sca1", "parent_group_id": null, "payload": { "restored": true } }

// replay_complete — Suppress
{ "type": "replay_complete", "content": "", "group_type": "session",
  "group_id": "thread_sca1", "parent_group_id": null, "payload": { "replayed_count": 52 } }

// event — Murmur (ad-hoc status notice; NOT the generic router envelope)
{ "type": "event", "content": "Session not found", "group_type": "session",
  "group_id": "thread_sca1", "parent_group_id": null, "payload": { "message": "Session not found" } }

// error — Milestone (assertive)
{ "type": "error", "content": "Connection failed", "group_type": "session",
  "group_id": "thread_sca1", "parent_group_id": null, "payload": { "reason": "auth" } }

// jira_ticket — Suppress (inbound webhook → TAA turn; never a front-end frame)
{ "type": "jira_ticket", "content": "", "group_type": "inbound",
  "group_id": "thread_sca1", "parent_group_id": null, "payload": { "key": "QA-101" } }

// github_pr — Suppress (inbound; → TAA PR turn)
{ "type": "github_pr", "content": "", "group_type": "inbound",
  "group_id": "thread_sca1", "parent_group_id": null, "payload": { "pr": 482 } }
// (linear_ticket, clickup_ticket, azure_devops_ticket follow the same inbound/Suppress shape)

// user_message — Chat (the message the user typed)
{ "type": "user_message", "content": "Check checkout sprint coverage and fill gaps",
  "group_type": "inbound", "group_id": "thread_sca1", "parent_group_id": null }

// user_context — Chat (context the user shares — Figma/docs/video)
{ "type": "user_context", "content": "Shared: checkout-spec.pdf", "group_type": "inbound",
  "group_id": "thread_sca1", "parent_group_id": null,
  "payload": { "kind": "document", "name": "checkout-spec.pdf" } }

// runs_updated — Suppress (DEAD: publish_sprint_event has zero callers)
{ "type": "runs_updated", "content": "", "group_type": "session",
  "group_id": "thread_sca1", "parent_group_id": null, "payload": {} }

// --- FORWARDED frames: SCA re-emits TAA + CAA events VERBATIM, CAA tagged source:"caa" ---
// e.g. a forwarded CAA analysis_saved:
{ "type": "analysis_saved", "content": "Saved analysis: gap_detection", "group_type": "tool",
  "group_id": "call_a1", "parent_group_id": "thread_sca1", "source": "caa",
  "payload": { "tool_name": "save_coverage_analysis", "analysis_name": "gap_detection" } }
// a forwarded TAA test_case_saved (source absent or "taa") nests as usual.
```

---

## PR-TAA — PR Test Authoring (SSE, 3 events)

```json
// progress — Murmur (phase ticks: compressing → planning → expanding)
{ "type": "progress", "content": "expanding", "phase": "expanding", "percentage": 70 }

// result — Outcome (terminal success: the whole authoring payoff in one bubble)
{ "type": "result", "content": "PR test authoring complete",
  "summary": "Authored 6 scenarios, 18 test cases for PR #482",
  "scenarios": [ { "id": "scn_pr1", "title": "New refund endpoint", "priority": "P1" } ],
  "test_cases": [ { "human_id": "TC-501", "title": "Refund happy path",
    "steps": [ { "action": "POST /refund", "expected": "200 + refund id" } ], "priority": "P1" } ] }

// error — Outcome (terminal failure of a 3-event stream → persistent retry card, NOT a spine state)
{ "type": "error", "content": "PR test authoring failed",
  "error": "Could not parse the diff", "retryable": true }
```
