# Events Structure

## Common events (shared by Authoring and Planner agent)

```json
// session_started
{ "event_id": "a1f3...", "type": "session_started", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "start",
  "content": "Session started", "thread_id": "thread_8d2c", "turn_id": 0 }

// plan_started
{ "event_id": "b2e4...", "type": "plan_started", "group_type": "plan",
  "group_id": "plan_1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Planning 3 steps",
  "items": [ { "item_id": "i1", "task": "Discover existing tests", "phase": "discovery" },
             { "item_id": "i2", "task": "Score candidates", "phase": "scoring" } ] }

// plan_item_completed
{ "event_id": "c3f5...", "type": "plan_item_completed", "group_type": "plan_item",
  "group_id": "i1", "parent_group_id": "plan_1", "lifecycle": "end",
  "content": "Discovery done", "item_id": "i1", "task": "Discover existing tests",
  "phase": "discovery", "status": "done", "done_count": 1, "total_count": 3, "notes": "" }

// tool_started
{ "event_id": "d4a6...", "type": "tool_started", "group_type": "tool",
  "group_id": "call_xy12", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Running search_test_cases",
  "tool_name": "search_test_cases", "tool_call_id": "call_xy12",
  "args_preview": { "query": "checkout payment flow" } }

// tool_completed
{ "event_id": "e5b7...", "type": "tool_completed", "group_type": "tool",
  "group_id": "call_xy12", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Found 12 matches",
  "tool_name": "search_test_cases", "tool_call_id": "call_xy12",
  "result_preview": "[{\"id\":\"TC-101\",\"title\":\"Checkout with Visa\"}, ...]" }

// question_asked
{ "event_id": "f6c8...", "type": "question_asked", "group_type": "question",
  "group_id": "q1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Which environment?",
  "question": "Which environment should this plan target?",
  "options": [ { "id": "staging", "label": "Staging" }, { "id": "prod", "label": "Production" } ] }

// token_usage  (standalone)
{ "event_id": "07d9...", "type": "token_usage", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "", "input_tokens": 4210, "output_tokens": 880,
  "total_tokens": 5090, "model": "claude-sonnet-4-6" }

// reasoning  (standalone)
{ "event_id": "18ea...", "type": "reasoning", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Prioritizing P0 regression tests",
  "message": "Prioritizing P0 regression tests", "phase": "scoring", "summary": "" }

// session_completed
{ "event_id": "29fb...", "type": "session_completed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "end",
  "content": "Done", "summary": "Generated 14 test cases across 3 scenarios" }
```

## TAA-specific events

```json
// scenario_saved
{ "event_id": "3a0c...", "type": "scenario_saved", "group_type": "scenario",
  "group_id": "scn_42", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Saved scenario: Guest checkout",
  "scenario_id": "scn_42", "title": "Guest checkout", "description": "Buy without an account",
  "scenario": { "id": "scn_42", "title": "Guest checkout", "priority": "P1", "tags": ["checkout"] } }

// test_case_saved
{ "event_id": "4b1d...", "type": "test_case_saved", "group_type": "test_case",
  "group_id": "tc_900", "parent_group_id": "scn_42", "lifecycle": "start",
  "content": "Saved TC: Checkout with expired card",
  "test_case_id": "tc_900", "scenario_id": "scn_42", "title": "Checkout with expired card",
  "human_id": "TC-105", "is_update": false,
  "test_case": { "id": "tc_900", "steps": [ { "action": "Enter expired card", "expected": "Error shown" } ],
                 "priority": "P2", "template_type": "STEPS" } }

// test_case_updated
{ "event_id": "5c2e...", "type": "test_case_updated", "group_type": "test_case",
  "group_id": "tc_900", "parent_group_id": "scn_42", "lifecycle": "progress",
  "content": "Updated 2 fields",
  "test_case_id": "tc_900", "scenario_id": "scn_42",
  "fields_changed": ["title", "priority"], "test_case": { "id": "tc_900", "priority": "P1" } }

// sub_agent_started
{ "event_id": "6d3f...", "type": "sub_agent_started", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Exploring app",
  "sub_agent_id": "sa_app1", "label": "App Explorer", "tool_name": "spawn_app_explorer",
  "objective": "Map the checkout flow" }

// sub_agent_progress
{ "event_id": "7e40...", "type": "sub_agent_progress", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "Captured screenshot of cart page",
  "sub_agent_id": "sa_app1", "kind": "screenshot", "message": "Captured screenshot of cart page",
  "step_number": 3, "total_steps": 8, "details": { "url": "/cart" } }

// sub_agent_signals
{ "event_id": "8f51...", "type": "sub_agent_signals", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "2 signals",
  "sub_agent_id": "sa_app1",
  "signals": [ { "name": "form_found", "value": "checkout-form", "details": { "fields": 6 } } ] }

// sub_agent_completed
{ "event_id": "9062...", "type": "sub_agent_completed", "group_type": "sub_agent",
  "group_id": "sa_app1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Exploration complete",
  "sub_agent_id": "sa_app1", "summary": "Mapped 8 pages, 3 forms", "step_count": 8 }

// validation_iteration
{ "event_id": "a173...", "type": "validation_iteration", "group_type": "validation",
  "group_id": "val_1", "parent_group_id": "thread_8d2c", "lifecycle": "progress",
  "content": "Iteration 2: 1 issue",
  "iteration": 2, "passed": false, "issues": ["Missing expected result on step 4"] }

// validation_completed
{ "event_id": "b284...", "type": "validation_completed", "group_type": "validation",
  "group_id": "val_1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Validation passed",
  "total_iterations": 3, "final_pass": true, "summary": "All test cases valid" }

// skill_loaded  (standalone)
{ "event_id": "c395...", "type": "skill_loaded", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "Loaded skill: scenario-from-jira", "skill_name": "scenario-from-jira" }

// acceptance_status_updated  (standalone)
{ "event_id": "d4a6...", "type": "acceptance_status_updated", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "TC accepted",
  "scenario_id": "scn_42", "test_case_id": "tc_900", "human_id": "TC-105",
  "folder_id": "fld_3", "chitragupt_test_case_id": "1023", "status": "accepted" }

// agent_done  (standalone)
{ "event_id": "e5b7...", "type": "agent_done", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "standalone",
  "content": "", "reason": "all_scenarios_generated" }
```

## Planner specific events

```json
// signal_worker_started
{ "event_id": "f6c8...", "type": "signal_worker_started", "group_type": "sub_agent",
  "group_id": "sw_discovery", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "discovery worker started",
  "signal": "discovery", "label": "Discovery", "attempt": 1 }

// signal_worker_completed
{ "event_id": "0719...", "type": "signal_worker_completed", "group_type": "sub_agent",
  "group_id": "sw_discovery", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "discovery: 47 candidates in 2.3s",
  "signal": "discovery", "elapsed_s": 2.34, "n": 47,
  "result_ref": "tpa:v3:plan_55:signal:discovery" }

// signal_worker_failed
{ "event_id": "182a...", "type": "signal_worker_failed", "group_type": "sub_agent",
  "group_id": "sw_blast", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "blast_radius failed",
  "signal": "blast_radius", "error_class": "TimeoutError",
  "error_message": "redis read exceeded 5s", "attempt": 2 }

// scoring_completed
{ "event_id": "293b...", "type": "scoring_completed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "Scored 312 candidates",
  "scored": 312, "tier_bucket_counts": { "smoke": 18, "feature": 64, "regression": 230 } }

// tier_view_built
{ "event_id": "3a4c...", "type": "tier_view_built", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "smoke tier: 18 candidates",
  "tier": "smoke", "n_candidates": 18, "modules": 5 }

// ladder_rung_committed
{ "event_id": "4b5d...", "type": "ladder_rung_committed", "group_type": "session",
  "group_id": "thread_8d2c", "parent_group_id": null, "lifecycle": "progress",
  "content": "Committed smoke rung",
  "tier": "smoke", "tier_rank": 1, "plan_id": "plan_55", "run_count": 1, "case_count": 18 }

// tms_backfill_started
{ "event_id": "5c6e...", "type": "tms_backfill_started", "group_type": "phase",
  "group_id": "backfill_1", "parent_group_id": "thread_8d2c", "lifecycle": "start",
  "content": "Syncing plan to TMS", "plan_id": "plan_55" }

// tms_backfill_completed
{ "event_id": "6d7f...", "type": "tms_backfill_completed", "group_type": "phase",
  "group_id": "backfill_1", "parent_group_id": "thread_8d2c", "lifecycle": "end",
  "content": "Backfill complete",
  "plan_id": "plan_55", "runs_synced": 4, "cases_synced": 312, "failures": 0, "details": {} }
```

## Coverage (CAA), data lives in payload (Not typed events)

```json
// tool_started
{ "entry_id": "1700000000000-0", "type": "tool_started", "content": "Running query_test_cases",
  "timestamp": 1700000000.12, "sequence": 14, "event_id": "aa11...",
  "group_id": "call_q1", "group_type": "tool", "parent_group_id": "thread_8d2c",
  "payload": { "lifecycle": "start", "tool_name": "query_test_cases",
               "tool_call_id": "call_q1", "args_preview": { "module": "checkout" } },
  "metadata": {} }

// skill_loaded
{ "entry_id": "1700000000500-0", "type": "skill_loaded", "content": "Loaded skill: gap-detection",
  "timestamp": 1700000000.5, "sequence": 15, "event_id": "bb22...",
  "group_id": "call_s1", "group_type": "tool", "parent_group_id": "thread_8d2c",
  "payload": { "tool_name": "load_skill", "tool_call_id": "call_s1",
               "skill_name": "gap-detection", "skill_description": "Detect missing/incomplete coverage gaps" },
  "metadata": {} }

// analysis_saved
{ "entry_id": "1700000001000-0", "type": "analysis_saved", "content": "Saved analysis: gap_detection",
  "timestamp": 1700000001.0, "sequence": 22, "event_id": "cc33...",
  "group_id": "call_a1", "group_type": "tool", "parent_group_id": "thread_8d2c",
  "payload": { "tool_name": "save_coverage_analysis", "tool_call_id": "call_a1",
               "analysis_name": "gap_detection" }, "metadata": {} }

// sub_agent_started
{ "entry_id": "1700000001500-0", "type": "sub_agent_started", "content": "Gap Detection Agent started",
  "timestamp": 1700000001.5, "sequence": 23, "event_id": "dd44...",
  "group_id": "call_g1", "group_type": "sub_agent", "parent_group_id": "thread_8d2c",
  "payload": { "lifecycle": "start", "sub_agent_id": "call_g1", "label": "Gap Detection Agent",
               "tool_name": "spawn_gap_detection_agent", "tool_call_id": "call_g1",
               "objective": "Find untested requirements in checkout" }, "metadata": {} }

// sub_agent_completed
{ "entry_id": "1700000003000-0", "type": "sub_agent_completed", "content": "Gap Detection Agent done",
  "timestamp": 1700000003.0, "sequence": 31, "event_id": "ee55...",
  "group_id": "call_g1", "group_type": "sub_agent", "parent_group_id": "thread_8d2c",
  "payload": { "lifecycle": "end", "sub_agent_id": "call_g1", "label": "Gap Detection Agent",
               "findings_count": 7, "input_tokens": 3200, "output_tokens": 540, "llm_calls": 2 },
  "metadata": {} }

// sub_agent_signals
{ "entry_id": "1700000003200-0", "type": "sub_agent_signals", "content": "7 findings",
  "timestamp": 1700000003.2, "sequence": 32, "event_id": "ff66...",
  "group_id": "call_g1", "group_type": "sub_agent", "parent_group_id": "thread_8d2c",
  "payload": { "sub_agent_id": "call_g1", "label": "Gap Detection Agent",
               "signals": [ { "finding": "No tests for guest checkout refund",
                              "suggestion": "Add a refund flow test case" } ],
               "source_tool": "spawn_gap_detection_agent" }, "metadata": {} }

// phase_review
{ "entry_id": "1700000004000-0", "type": "phase_review", "content": "Phase complete — review",
  "timestamp": 1700000004.0, "sequence": 40, "event_id": "1077...",
  "group_id": "thread_8d2c", "group_type": "phase", "parent_group_id": null,
  "payload": { "completed_phase": "detection", "next_phase": "reporting",
               "done_count": 2, "total_count": 4, "analyses_saved": 2, "total_tokens": 8800,
               "signals": [ { "finding": "...", "suggestion": "..." } ], "plan": [ { "task": "...", "status": "done" } ] },
  "metadata": {} }

// visualization
{ "entry_id": "1700000005000-0", "type": "visualization", "content": "Coverage by feature",
  "timestamp": 1700000005.0, "sequence": 48, "event_id": "1188...",
  "group_id": "thread_8d2c", "group_type": "session", "parent_group_id": null,
  "payload": { "event_type": "visualization",
               "data": { "viz_type": "donut", "title": "Overall Coverage", "subtitle": null,
                         "data": { "covered": 240, "uncovered": 72 } } },
  "metadata": { "auto_viz": true } }

// token_usage
{ "entry_id": "1700000005500-0", "type": "token_usage", "content": "",
  "timestamp": 1700000005.5, "sequence": 49, "event_id": "1299...",
  "group_id": "thread_8d2c", "group_type": "session", "parent_group_id": null,
  "payload": { "input_tokens": 1800, "output_tokens": 410, "total_tokens": 2210,
               "cumulative_input_tokens": 12400, "cumulative_output_tokens": 3100,
               "cumulative_total_tokens": 15500, "llm_call_number": 6 }, "metadata": {} }

// session_complete
{ "entry_id": "1700000006000-0", "type": "session_complete", "content": "Coverage analysis complete",
  "timestamp": 1700000006.0, "sequence": 55, "event_id": "13aa...",
  "group_id": "thread_8d2c", "group_type": "session", "parent_group_id": null,
  "payload": { "analyses_saved": 4, "total_llm_calls": 11, "total_tokens": 26300,
               "plan": [ { "task": "...", "status": "done" } ],
               "signals": [ { "finding": "...", "suggestion": "..." } ] }, "metadata": {} }
```

## Run Analyzer (RAA)

```json
// tool_start
{ "entry_id": "1700000000000-0", "type": "tool_start", "content": "Running fetch_run_results",
  "timestamp": 1700000000.1, "sequence": 8, "event_id": "aa01...",
  "group_id": "call_r1", "group_type": "tool", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "fetch_run_results" }, "metadata": {} }

// skill_loaded
{ "entry_id": "1700000000400-0", "type": "skill_loaded", "content": "Loaded skill: failure-classification",
  "timestamp": 1700000000.4, "sequence": 9, "event_id": "bb02...",
  "group_id": "call_s1", "group_type": "tool", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "load_skill", "skill_name": "failure-classification",
               "skill_description": "Classify failures as true/false-positive/flaky/env" }, "metadata": {} }

// sub_agent_start
{ "entry_id": "1700000001000-0", "type": "sub_agent_start", "content": "Classification Agent started",
  "timestamp": 1700000001.0, "sequence": 12, "event_id": "cc03...",
  "group_id": "call_c1", "group_type": "sub_agent", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "spawn_classification_agent", "sub_agent": "Classification Agent" },
  "metadata": {} }

// sub_agent_complete
{ "entry_id": "1700000002500-0", "type": "sub_agent_complete", "content": "Classification Agent done",
  "timestamp": 1700000002.5, "sequence": 18, "event_id": "dd04...",
  "group_id": "call_c1", "group_type": "sub_agent", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "spawn_classification_agent", "sub_agent": "Classification Agent",
               "input_tokens": 4100, "output_tokens": 720, "llm_calls": 3, "findings_published": 9 },
  "metadata": {} }

// sub_agent_signals
{ "entry_id": "1700000002700-0", "type": "sub_agent_signals", "content": "9 findings",
  "timestamp": 1700000002.7, "sequence": 19, "event_id": "ee05...",
  "group_id": "call_c1", "group_type": "sub_agent", "parent_group_id": "thread_run9",
  "payload": { "signals": [ { "finding": "TC-44 fails only on CI", "suggestion": "Mark as flaky/environmental" } ],
               "source_tool": "spawn_classification_agent" }, "metadata": {} }

// validation_result
{ "entry_id": "1700000003000-0", "type": "validation_result", "content": "Validation failed (1 issue)",
  "timestamp": 1700000003.0, "sequence": 20, "event_id": "ff06...",
  "group_id": "call_v1", "group_type": "tool", "parent_group_id": "thread_run9",
  "payload": { "tool_name": "validate_analysis", "status": "fail",
               "issues": ["3 failures missing classification"], "checks": { "all_classified": false },
               "iteration": 1, "max_iterations": 3 }, "metadata": {} }

// visualization
{ "entry_id": "1700000004000-0", "type": "visualization", "content": "Failure breakdown",
  "timestamp": 1700000004.0, "sequence": 26, "event_id": "1007...",
  "group_id": "thread_run9", "group_type": "session", "parent_group_id": null,
  "payload": { "viz_type": "donut", "title": "Failure Classification", "subtitle": "Run #9",
               "data": { "true_failure": 6, "flaky": 9, "environmental": 3, "false_positive": 2 } },
  "metadata": { "auto_viz": true } }

// phase  (transition)
{ "entry_id": "1700000004500-0", "type": "phase", "content": "Entering: reporting",
  "timestamp": 1700000004.5, "sequence": 27, "event_id": "1108...",
  "group_id": "thread_run9", "group_type": "phase", "parent_group_id": null,
  "payload": { "phase_name": "reporting", "progress_pct": 75.0, "thread_id": "thread_run9" }, "metadata": {} }

// question
{ "entry_id": "1700000005000-0", "type": "question", "content": "Generate a release email?",
  "timestamp": 1700000005.0, "sequence": 30, "event_id": "1209...",
  "group_id": "q1", "group_type": "session", "parent_group_id": "thread_run9",
  "payload": { "options": ["Yes, draft it", "No, skip"], "thread_id": "thread_run9" }, "metadata": {} }

// session_complete
{ "entry_id": "1700000006000-0", "type": "session_complete", "content": "Run analysis complete",
  "timestamp": 1700000006.0, "sequence": 36, "event_id": "13aa...",
  "group_id": "thread_run9", "group_type": "session", "parent_group_id": null,
  "payload": { "analyses_saved": 3, "total_llm_calls": 14, "total_tokens": 31200,
               "plan": [ { "task": "Classify failures", "status": "done" } ],
               "signals": [ { "finding": "...", "suggestion": "..." } ] }, "metadata": {} }

// error
{ "entry_id": "1700000006500-0", "type": "error", "content": "Graph execution failed",
  "timestamp": 1700000006.5, "sequence": 37, "event_id": "14bb...",
  "group_id": "thread_run9", "group_type": "session", "parent_group_id": null,
  "payload": { "traceback": "Traceback (most recent call last): ..." }, "metadata": {} }
```
