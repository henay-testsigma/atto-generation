// AUTO-GENERATED from tier-decision-doc.html (const D ledger) by scripts/gen-ledger.mjs.
// Do not edit by hand — edit the doc and run `npm run gen:ledger`.
// Fields: e=event, a=agent, g=group·lifecycle, c=current tier, f=final tier,
// st=status(keep|changed|dead), dev, cont(contested), sev, rule, note.

export interface LedgerRow {
  e: string
  a: string
  g: string
  c: string
  f: string
  st?: string
  dev?: number
  cont?: number
  sev?: string
  rule?: string
  note?: string
}

export const LEDGER: LedgerRow[] = [
  {
    "e": "session_started",
    "a": "COMMON",
    "g": "session·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "The turn container. Minimal render — opens the session frame."
  },
  {
    "e": "session_paused",
    "a": "COMMON",
    "g": "session·progress",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 0,
    "sev": "P1",
    "note": "A11y: standalone it's a silent repaint. Must announce 'Paused — waiting for your input' (polite), paired with the gate that caused it."
  },
  {
    "e": "session_resumed",
    "a": "COMMON",
    "g": "session·progress",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Resumes after a pause/interrupt."
  },
  {
    "e": "session_completed",
    "a": "COMMON",
    "g": "session·end",
    "c": "Milestone",
    "f": "Outcome",
    "st": "changed",
    "sev": "P2",
    "note": "CHANGED→Outcome. The single visible run-close: settles every group, marks the run complete, and seeds the feedback row — peer to summary_generated/result. Render summary_generated INTO it; dedup terminal renders by session group_id."
  },
  {
    "e": "session_terminated",
    "a": "COMMON",
    "g": "session·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Terminal close on user/forced termination."
  },
  {
    "e": "session_failed",
    "a": "COMMON",
    "g": "session·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 0,
    "sev": "P0",
    "note": "A11y P0: terminal failure must fire aria-live=assertive, never a silent frame restyle, or AT users wait on a dead session. Must NEVER be folded into Suppress."
  },
  {
    "e": "plan_started",
    "a": "COMMON",
    "g": "plan·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Renders the plan checklist up front. Stays the milestone; appends mutate it in place."
  },
  {
    "e": "plan_appended",
    "a": "COMMON",
    "g": "plan·progress",
    "c": "Milestone",
    "f": "Murmur",
    "st": "changed",
    "sev": "P2",
    "note": "CHANGED. An append is a mutation of the already-open plan card, not a new glanceable step. Murmur the tick; merge items into the existing card silently. A fresh spine row per append duplicates the plan."
  },
  {
    "e": "plan_completed",
    "a": "COMMON",
    "g": "plan·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Closes the plan card with final counts."
  },
  {
    "e": "plan_item_started",
    "a": "COMMON",
    "g": "plan_item·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Marks one plan item in-progress."
  },
  {
    "e": "plan_item_completed",
    "a": "COMMON",
    "g": "plan_item·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Discrete checklist tick — correctly Milestone (vs the continuous *_auto_progress which is Murmur)."
  },
  {
    "e": "phase_started",
    "a": "COMMON",
    "g": "phase·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P2",
    "note": "Keep, but dedupe against plan_item boundaries — plan_started already groups items by phase, so don't render the same boundary twice."
  },
  {
    "e": "phase_completed",
    "a": "COMMON",
    "g": "phase·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Closes a phase card. If it carries review_required:true, promote to an Outcome gate to match legacy phase_review."
  },
  {
    "e": "tool_started",
    "a": "COMMON",
    "g": "tool·start",
    "c": "Milestone",
    "f": "Conditional",
    "st": "changed",
    "cont": 1,
    "sev": "P0",
    "rule": "Murmur while active → collapsed Milestone on tool_completed; failure opens a card.",
    "note": "CONTESTED→RESOLVED. UX P0: a tool-open + tool-complete pair = 2 spine rows per call = wall of noise. Show the active tool as the one murmur line; settle into a single collapsed milestone at close. Feasibility preserved — the card still materializes at completion, keyed on group_id."
  },
  {
    "e": "tool_completed",
    "a": "COMMON",
    "g": "tool·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "sev": "P1",
    "note": "CONTESTED→RESOLVED. Settles the tool's single collapsed spine row. result_preview lives behind inspect-on-demand (count/few rows inline, full snippet on click), never raw JSON."
  },
  {
    "e": "tool_failed",
    "a": "COMMON",
    "g": "tool·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P1",
    "note": "Error state of the tool card. aria-live=assertive; text + icon (not colour alone)."
  },
  {
    "e": "question_asked",
    "a": "COMMON",
    "g": "question·start",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P0",
    "note": "Human-in-the-loop gate — pauses the run. Move focus to the question container once, announce the pause assertively, render options[{id,label}] as real buttons (label=name, id=submit value)."
  },
  {
    "e": "question_answered",
    "a": "COMMON",
    "g": "question·end",
    "c": "Outcome",
    "f": "Suppress",
    "st": "changed",
    "note": "CHANGED→Suppress. Ack only — the user's pick already renders as a right-aligned bubble and the gate closes, so the raw event is not separately painted (it would leak an 'Answered: …' line). Closes the gate; returns focus to the stream."
  },
  {
    "e": "progress",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "Free-form progress log line. Collapse into the one murmur line."
  },
  {
    "e": "reasoning",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "dev": 1,
    "sev": "P0",
    "note": "The thinking trace. Live murmur for novices; Dev mode retains the full scroll-back ('why did it do that'). Data is per-line standalone — retaining it costs nothing at the wire."
  },
  {
    "e": "token_usage",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "dev": 1,
    "sev": "P1",
    "note": "Hidden from end users. Dev mode surfaces per-turn + cumulative cost/latency footer (total_tokens, model). The cost/latency debug primitive."
  },
  {
    "e": "error",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "cont": 1,
    "sev": "P1",
    "rule": "Default Milestone (assertive, traceback redacted). PR-TAA error → Outcome (terminal).",
    "note": "CONTESTED→RESOLVED. A standalone non-terminal error has a card to attach to → Milestone state + assertive announce; traceback is dev-only. PR-TAA's error has no spine and ends the run → Outcome retry card."
  },
  {
    "e": "message",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Chat",
    "f": "Chat",
    "st": "keep",
    "note": "The user turn — a chat bubble, not an activity event."
  },
  {
    "e": "dev_context",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Chat",
    "f": "Chat",
    "st": "keep",
    "note": "Context from a GitHub PR / Claude Code session — an input bubble in the transcript."
  },
  {
    "e": "welcome",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Chat",
    "f": "Chat",
    "st": "keep",
    "sev": "P3",
    "note": "DESIGNER DECISION: stays Chat. Renders as a visible greeting bubble in the transcript. Keep in Chat, but dedupe by thread so a reconnect/historical replay doesn't re-greet — do NOT render it on session_restored / replay_complete paths."
  },
  {
    "e": "replay_complete",
    "a": "COMMON",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "dev": 1,
    "note": "Transport control frame. Dev mode may show replayed_count to confirm full history."
  },
  {
    "e": "sub_agent_started",
    "a": "TAA",
    "g": "sub_agent·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Nested sub-agent card. Title = label ?? sub_agent. Explorer / validator / TPA-adhoc."
  },
  {
    "e": "sub_agent_progress",
    "a": "TAA",
    "g": "sub_agent·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "High-frequency (screenshot 3/8). Determinate murmur with a progress bar from step_number/total_steps — correct."
  },
  {
    "e": "sub_agent_signals",
    "a": "TAA",
    "g": "sub_agent·progress",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "cont": 1,
    "sev": "P1",
    "note": "CONTESTED→RESOLVED. Stays a findings attachment on the sub-agent card (uniform across 4 agents — fragmenting breaks the SCA forwarder). Promote to Outcome only if a finding carries its own accept/reject — none do today. The durable actionable surface is analysis_saved / summary."
  },
  {
    "e": "sub_agent_completed",
    "a": "TAA",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Closes the card: 'Mapped 8 pages, 3 forms'."
  },
  {
    "e": "sub_agent_failed",
    "a": "TAA",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P1",
    "note": "Failed card state; assertive announce."
  },
  {
    "e": "scenario_saved",
    "a": "TAA",
    "g": "scenario·start",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "Opens the scenario group test cases nest under. A durable artifact."
  },
  {
    "e": "scenario_updated",
    "a": "TAA",
    "g": "scenario·progress",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "Existing scenario updated — reconcile into the card."
  },
  {
    "e": "scenario_deleted",
    "a": "TAA",
    "g": "scenario·end",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "Scenario permanently removed."
  },
  {
    "e": "test_case_saved",
    "a": "TAA",
    "g": "test_case·start",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P2",
    "note": "The core payoff — full preview card nested under its scenario. Ordering guard: if it arrives before scenario_saved, create a placeholder parent and reparent, never orphan or drop it."
  },
  {
    "e": "test_case_updated",
    "a": "TAA",
    "g": "test_case·progress",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "Change-summary line on the existing card (fields_changed[])."
  },
  {
    "e": "validation_started",
    "a": "TAA",
    "g": "validation·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "The validation loop began."
  },
  {
    "e": "validation_iteration",
    "a": "TAA",
    "g": "validation·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "dev": 1,
    "sev": "P0",
    "note": "Murmur for the happy path; Dev mode retains per-iteration passed + issues[] ('Missing expected result on step 4'). Promote a pinned 'still working on X' line if the same issue repeats ≥3× (stall signal)."
  },
  {
    "e": "validation_completed",
    "a": "TAA",
    "g": "validation·end",
    "c": "Milestone",
    "f": "Conditional",
    "st": "changed",
    "dev": 1,
    "cont": 1,
    "sev": "P2",
    "rule": "final_pass=true → collapsed Milestone close. final_pass=false → Outcome card + retry.",
    "note": "CONTESTED→RESOLVED. A passing validation needs no action (Milestone + inspectable iteration history); a failing one is actionable and must persist (Outcome). Tier-by-payload is feasible — final_pass is documented."
  },
  {
    "e": "validation_failed",
    "a": "TAA",
    "g": "validation·end",
    "c": "Suppress",
    "f": "Milestone",
    "st": "changed",
    "sev": "P2",
    "note": "CHANGED (dead/latent). Re-home from Suppress to Milestone: its live siblings are Milestone, and tiering a failure path 'hidden' sets a wrong precedent. If the call site is ever wired, the tier is already correct."
  },
  {
    "e": "skill_loaded",
    "a": "TAA",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "sev": "P1",
    "note": "Shows the lens ('Reading the Figma file…'). TAA sends only skill_name (no description) — ship the skill_id→label map or it renders the raw kebab id. Inspect reveals description + inputs."
  },
  {
    "e": "context_saved",
    "a": "TAA",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "Working context persisted. Internal — hidden even from dev mode (no debug value)."
  },
  {
    "e": "summary_generated",
    "a": "TAA",
    "g": "session·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P2",
    "note": "The 'return-moment' briefing. Must render INTO the single visible close (session_completed), not as a competing second bubble."
  },
  {
    "e": "agent_done",
    "a": "TAA",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Turn-end marker — mostly internal. Suppress when a summary/close follows it to avoid a double 'finished'."
  },
  {
    "e": "acceptance_status_updated",
    "a": "TAA",
    "g": "session·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P2",
    "note": "Human accept/reject result, pushed from a REST callback (out-of-band). Reconcile by test_case_id against persisted card state — tolerate the card not being present (upsert)."
  },
  {
    "e": "sprint_issues_loaded",
    "a": "TAA",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "dev": 1,
    "sev": "P2",
    "note": "Context plumbing. Dev mode may show it as input-provenance ('why did it generate THESE scenarios')."
  },
  {
    "e": "question",
    "a": "CAA",
    "g": "question·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P1",
    "note": "Legacy literal (NOT common question_asked). Options are bare strings — adapter must map each to {id:s,label:s}. Same gate semantics: focus + assertive pause."
  },
  {
    "e": "phase",
    "a": "CAA",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Murmur",
    "st": "changed",
    "cont": 0,
    "sev": "P1",
    "note": "CHANGED. Legacy 'Entering: reporting · 75%' is a progress tick. Feasibility-decisive: with group_type=session/standalone it is un-renderable as a spine node, so Milestone is structurally impossible. Coerce group_type for routing only."
  },
  {
    "e": "event",
    "a": "CAA",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Conditional",
    "st": "changed",
    "cont": 1,
    "sev": "P0",
    "rule": "Router on inner event_type: visualization/*_detected/*_complete → Outcome; else → Murmur.",
    "note": "CHANGED (P0). The catch-all envelope. CAA emits its chart via write('event',{event_type:visualization}) — a flat Murmur drops the donut into a transient line that gets overwritten. Must dispatch on the inner type."
  },
  {
    "e": "visualization",
    "a": "CAA",
    "g": "session·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P1",
    "note": "Chart Outcome — but CAA nests under payload.data.{viz_type,title,data}. Normalize (coalesce payload.data ?? payload) before charting or the card renders empty (worse than missing). Suppress the card if data is null."
  },
  {
    "e": "agent_done",
    "a": "CAA",
    "g": "session·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Final assistant message, no further tool calls."
  },
  {
    "e": "session_complete",
    "a": "CAA",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Outcome",
    "st": "changed",
    "sev": "P0",
    "note": "CHANGED (P0). The legacy run-close briefing (analyses_saved, signals[]). Must match the standing of summary_generated/result — SCA forwards CAA verbatim on the same socket as TAA, so a Milestone close here is visibly inconsistent with TAA's Outcome close."
  },
  {
    "e": "phase_review",
    "a": "CAA",
    "g": "session·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P1",
    "note": "A review/approval gate. Treat like a question (focus + assertive). Dedup against question / session_complete arriving in the same window on the same group_id."
  },
  {
    "e": "plan_auto_progress",
    "a": "CAA",
    "g": "session·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "Auto plan-progress tick after each tool. Pure cadence — correctly Murmur."
  },
  {
    "e": "sub_agent_started",
    "a": "CAA",
    "g": "sub_agent·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Spawned sub-agent (gap / impact / requirements). Uses label key (matches TAA)."
  },
  {
    "e": "sub_agent_completed",
    "a": "CAA",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Finished; tokens + findings count."
  },
  {
    "e": "sub_agent_failed",
    "a": "CAA",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P1",
    "note": "Sub-agent error; assertive."
  },
  {
    "e": "sub_agent_signals",
    "a": "CAA",
    "g": "sub_agent·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "cont": 1,
    "note": "finding→suggestion pairs. Findings attachment (lifecycle=standalone, so it floats rather than closing the card — render as a findings list under the sub-agent)."
  },
  {
    "e": "skill_loaded",
    "a": "CAA",
    "g": "tool·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "note": "Lens ('gap-detection'). CAA includes skill_description. group_type=tool here vs session in TAA — normalize so the chip renders identically."
  },
  {
    "e": "context_saved",
    "a": "CAA",
    "g": "tool·end",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "save_context. Internal."
  },
  {
    "e": "analysis_saved",
    "a": "CAA",
    "g": "tool·end",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "Coverage analysis persisted (triggers the viz auto-emit). A durable result."
  },
  {
    "e": "validation_iteration",
    "a": "CAA",
    "g": "tool·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "dev": 1,
    "note": "Self-eval / validate_analysis iteration N. Murmur; issues[] in dev."
  },
  {
    "e": "reasoning",
    "a": "RAA",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "dev": 1,
    "note": "Live thought-stream. Dev mode retains the trace."
  },
  {
    "e": "phase",
    "a": "RAA",
    "g": "phase·standalone",
    "c": "Milestone",
    "f": "Murmur",
    "st": "changed",
    "sev": "P2",
    "note": "CHANGED. Phase transition tick with progress_pct — Murmur, matching CAA/TPA-v1 legacy phase. (group_type=phase here, but standalone, so no open/close.)"
  },
  {
    "e": "progress",
    "a": "RAA",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "NL progress; also per sub-agent step / budget exhaustion."
  },
  {
    "e": "question",
    "a": "RAA",
    "g": "question·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P0",
    "note": "Gate with bare-string options (['Yes, draft it','No, skip']) and the prompt in content, no question field. A11y P0: without focus + assertive the run silently deadlocks. Options adapter mandatory or buttons render undefined."
  },
  {
    "e": "event",
    "a": "RAA",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Conditional",
    "st": "changed",
    "cont": 1,
    "sev": "P0",
    "rule": "Router on inner event_type (see CAA event).",
    "note": "CHANGED (P0). Generic envelope: session lifecycle markers + send_event + charts. Route by inner type."
  },
  {
    "e": "error",
    "a": "RAA",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "sev": "P1",
    "note": "Fatal/blocking error, payload carries raw traceback. Milestone state + assertive; traceback redacted to dev-only."
  },
  {
    "e": "token_usage",
    "a": "RAA",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "dev": 1,
    "note": "Per-LLM-call accounting. Dev cost footer."
  },
  {
    "e": "agent_done",
    "a": "RAA",
    "g": "session·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Reason node response, no tool calls."
  },
  {
    "e": "visualization",
    "a": "RAA",
    "g": "tool·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P1",
    "note": "Chart Outcome — RAA puts viz_type/title/data FLAT in payload (vs CAA's nested). One normalizer must handle both before charting."
  },
  {
    "e": "tool_start",
    "a": "RAA",
    "g": "tool·start",
    "c": "Milestone",
    "f": "Conditional",
    "st": "changed",
    "cont": 1,
    "sev": "P2",
    "rule": "Murmur while active. If no tool_call_id → ephemeral line, not an openable card (no guaranteed closer).",
    "note": "CONTESTED→RESOLVED. RAA tool_start carries ONLY tool_name — no args_preview, no tool_call_id. A pinned card you can't expand or correlate to a close is pure noise and risks a permanently-spinning card. Murmur it; correlate close by group_id fallback."
  },
  {
    "e": "skill_loaded",
    "a": "RAA",
    "g": "tool·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "note": "Analysis lens (failure-classification…). Includes skill_description."
  },
  {
    "e": "context_saved",
    "a": "RAA",
    "g": "tool·end",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "After save_context. Internal."
  },
  {
    "e": "analysis_saved",
    "a": "RAA",
    "g": "tool·end",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "After save_analysis_result (triggers auto-viz). Durable."
  },
  {
    "e": "validation_result",
    "a": "RAA",
    "g": "tool·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "sev": "P1",
    "note": "PASS/FAIL outcome. Keep Milestone; expose checks{} + issues[] via inspect, not just the headline."
  },
  {
    "e": "sub_agent_start",
    "a": "RAA",
    "g": "sub_agent·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P2",
    "note": "Name under key 'sub_agent' (NOT label) — normalize or the card title is undefined."
  },
  {
    "e": "sub_agent_complete",
    "a": "RAA",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Closes worker (sub_agent, findings_published)."
  },
  {
    "e": "sub_agent_error",
    "a": "RAA",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P1",
    "note": "Sub-agent failed; assertive."
  },
  {
    "e": "sub_agent_signals",
    "a": "RAA",
    "g": "sub_agent·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "note": "finding→suggestion findings list."
  },
  {
    "e": "plan_auto_progress",
    "a": "RAA",
    "g": "plan·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "Plan tracker auto-advances after tool execution."
  },
  {
    "e": "phase_review",
    "a": "RAA",
    "g": "plan·progress",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P1",
    "note": "Mid-session review gate. group_type=plan here (session in CAA, phase in TPA-v1) — needs a synthetic gate id to attach accept/reject consistently."
  },
  {
    "e": "session_complete",
    "a": "RAA",
    "g": "session·end",
    "c": "Milestone",
    "f": "Outcome",
    "st": "changed",
    "sev": "P0",
    "note": "CHANGED (P0). Legacy run-close briefing — promote to Outcome to match the visible-close concept across agents."
  },
  {
    "e": "summary",
    "a": "RAA",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "dead",
    "note": "Dead/unused — docstring only, no emit site. Correctly suppressed."
  },
  {
    "e": "tool_complete",
    "a": "RAA",
    "g": "tool·end",
    "c": "Suppress",
    "f": "Milestone",
    "st": "changed",
    "sev": "P3",
    "note": "CHANGED (dead/latent). Re-home from Suppress to Milestone: it's a generic tool·end. If ever emitted, Suppress would swallow a tool-card close, leaving the tool_start card hung open forever."
  },
  {
    "e": "event",
    "a": "TPA v1",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Conditional",
    "st": "changed",
    "cont": 1,
    "sev": "P0",
    "rule": "Router on inner event_type.",
    "note": "CHANGED (P0). Generic envelope: session lifecycle text + metadata.event_type sub-events."
  },
  {
    "e": "question",
    "a": "TPA v1",
    "g": "question·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "Asks the user and pauses (+ optional bare-string choices)."
  },
  {
    "e": "progress",
    "a": "TPA v1",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "NL progress; sub-agents emit per-step."
  },
  {
    "e": "reasoning",
    "a": "TPA v1",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "dev": 1,
    "note": "Live thought stream (phase + thought + action)."
  },
  {
    "e": "phase",
    "a": "TPA v1",
    "g": "phase·start",
    "c": "Milestone",
    "f": "Murmur",
    "st": "changed",
    "sev": "P2",
    "note": "CHANGED. Legacy phase transition tick → Murmur (consistent with CAA/RAA)."
  },
  {
    "e": "token_usage",
    "a": "TPA v1",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "dev": 1,
    "note": "Per-LLM-call accounting."
  },
  {
    "e": "message",
    "a": "TPA v1",
    "g": "session·standalone",
    "c": "Chat",
    "f": "Chat",
    "st": "keep",
    "note": "Plain message (autonomous/batch auto-proceed) — chat bubble."
  },
  {
    "e": "error",
    "a": "TPA v1",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "sev": "P1",
    "note": "Graph execution failure. Milestone state + assertive; traceback dev-only."
  },
  {
    "e": "agent_done",
    "a": "TPA v1",
    "g": "session·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Reason-node content, no tool calls."
  },
  {
    "e": "tool_start",
    "a": "TPA v1",
    "g": "tool·start",
    "c": "Milestone",
    "f": "Conditional",
    "st": "changed",
    "cont": 1,
    "sev": "P2",
    "rule": "Murmur while active → settle on completion.",
    "note": "CHANGED. Non-spawn tool invocation — same open-as-murmur rule as COMMON tool_started."
  },
  {
    "e": "sub_agent_start",
    "a": "TPA v1",
    "g": "sub_agent·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "spawn_* / spawn_parallel. Name under 'sub_agent' key — normalize."
  },
  {
    "e": "sub_agent_complete",
    "a": "TPA v1",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Finished (tokens / findings / result collections)."
  },
  {
    "e": "sub_agent_error",
    "a": "TPA v1",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P1",
    "note": "Failed; assertive."
  },
  {
    "e": "sub_agent_signals",
    "a": "TPA v1",
    "g": "sub_agent·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "note": "Findings/suggestions for plan-review accumulation."
  },
  {
    "e": "skill_loaded",
    "a": "TPA v1",
    "g": "tool·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "note": "Planning lens (blast_radius, regression_planning)."
  },
  {
    "e": "context_saved",
    "a": "TPA v1",
    "g": "tool·end",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "save_context completed."
  },
  {
    "e": "plan_result_saved",
    "a": "TPA v1",
    "g": "plan·standalone",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "save_plan_result persisted an analysis. Durable artifact."
  },
  {
    "e": "plan_created",
    "a": "TPA v1",
    "g": "plan·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "write_plan created the initial plan."
  },
  {
    "e": "plan_appended",
    "a": "TPA v1",
    "g": "plan·progress",
    "c": "Milestone",
    "f": "Murmur",
    "st": "changed",
    "sev": "P2",
    "note": "CHANGED. append_plan added items — mutate the open plan card in place (matches COMMON plan_appended)."
  },
  {
    "e": "plan_progress",
    "a": "TPA v1",
    "g": "plan·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "update_plan manually changed an item status."
  },
  {
    "e": "plan_auto_progress",
    "a": "TPA v1",
    "g": "plan·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "Plan status auto-advanced after tool execution."
  },
  {
    "e": "phase_review",
    "a": "TPA v1",
    "g": "phase·end",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "sev": "P1",
    "note": "Mid-session approval gate. group_type=phase here."
  },
  {
    "e": "session_complete",
    "a": "TPA v1",
    "g": "session·end",
    "c": "Milestone",
    "f": "Outcome",
    "st": "changed",
    "sev": "P0",
    "note": "CHANGED (P0). Legacy run-close → Outcome."
  },
  {
    "e": "validation_result",
    "a": "TPA v1",
    "g": "plan·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "note": "validate_plan PASS/FAIL. issues[]/checks via inspect."
  },
  {
    "e": "signal_worker_started",
    "a": "TPA v2",
    "g": "sub_agent·start",
    "c": "Milestone",
    "f": "Murmur",
    "st": "changed",
    "sev": "P1",
    "note": "CHANGED→Murmur. A parallel worker owns the fan-out lane on the Murmur line, not a spine row. When ≥2 are open concurrently, show a compact N-of-M worker strip (never one flickering line); each settles into a Milestone on signal_worker_completed."
  },
  {
    "e": "signal_worker_completed",
    "a": "TPA v2",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "'Discovery · 47 candidates in 2.3s'. result_ref (redis) not for display."
  },
  {
    "e": "signal_worker_failed",
    "a": "TPA v2",
    "g": "sub_agent·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "sev": "P1",
    "note": "Failed-worker state; assertive. error_class/message/attempt via inspect."
  },
  {
    "e": "scoring_completed",
    "a": "TPA v2",
    "g": "session·progress",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "dev": 1,
    "cont": 1,
    "sev": "P2",
    "note": "CONTESTED→RESOLVED. A step, not a gated artifact — nothing waits on the human. Single spine row 'Scored 312 candidates'; tier_bucket_counts mini-chart renders on expand, not in the Outcome lane."
  },
  {
    "e": "tier_view_built",
    "a": "TPA v2",
    "g": "session·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "dev": 1,
    "note": "'smoke tier: 18 candidates' tick. Largely redundant with scoring_completed's chart — reveal-on-demand, rate-limited so it never owns a live region."
  },
  {
    "e": "ladder_rung_committed",
    "a": "TPA v2",
    "g": "session·progress",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "dev": 1,
    "cont": 1,
    "sev": "P1",
    "note": "CONTESTED→RESOLVED. A persistence-commit tick. The watching human's job is 'is it progressing', not 'audit the txn'. Stays the rate-limited tick; run_count/case_count audit via inspect/dev. Totals surface in tms_backfill_completed."
  },
  {
    "e": "tms_backfill_started",
    "a": "TPA v2",
    "g": "phase·start",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "Opens a TMS sync phase card."
  },
  {
    "e": "tms_backfill_completed",
    "a": "TPA v2",
    "g": "phase·end",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "note": "'Backfill complete · 4 runs, 312 cases'. Surface failures only if >0."
  },
  {
    "e": "welcome",
    "a": "SCA v2",
    "g": "session·start",
    "c": "Chat",
    "f": "Chat",
    "st": "keep",
    "sev": "P3",
    "note": "DESIGNER DECISION: stays Chat — the SCA session greeting bubble. Guard only: it fires alongside session_restored on reconnect, so dedupe per thread (render the greeting once, skip it on cold-reconnect replay) to avoid re-greeting on socket flaps."
  },
  {
    "e": "session_restored",
    "a": "SCA v2",
    "g": "session·start",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "dev": 1,
    "sev": "P2",
    "note": "Cold-reconnect replay. Dev marker explains state discontinuities a power user might mistake for a bug. Idempotent (raw dict, no event_id dedup)."
  },
  {
    "e": "replay_complete",
    "a": "SCA v2",
    "g": "session·progress",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "dev": 1,
    "note": "End of TAA+CAA historical replay (replayed_count). Transport."
  },
  {
    "e": "event",
    "a": "SCA v2",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "Ad-hoc status/notice line (Session cancelled, not found…) — not the generic envelope, so a plain Murmur line is correct here."
  },
  {
    "e": "error",
    "a": "SCA v2",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P1",
    "note": "Connection/auth/lookup failure frame; assertive."
  },
  {
    "e": "jira_ticket",
    "a": "SCA v2",
    "g": "inbound·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "Inbound Jira webhook → TAA turn. Never a front-end frame."
  },
  {
    "e": "linear_ticket",
    "a": "SCA v2",
    "g": "inbound·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "Inbound Linear webhook → TAA turn."
  },
  {
    "e": "clickup_ticket",
    "a": "SCA v2",
    "g": "inbound·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "Inbound ClickUp webhook → TAA turn."
  },
  {
    "e": "azure_devops_ticket",
    "a": "SCA v2",
    "g": "inbound·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "Inbound Azure DevOps work-item webhook → TAA turn."
  },
  {
    "e": "github_pr",
    "a": "SCA v2",
    "g": "inbound·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "keep",
    "note": "Inbound GitHub PR webhook → TAA PR turn."
  },
  {
    "e": "user_message",
    "a": "SCA v2",
    "g": "inbound·standalone",
    "c": "Chat",
    "f": "Chat",
    "st": "keep",
    "note": "The message the user typed — a chat bubble."
  },
  {
    "e": "user_context",
    "a": "SCA v2",
    "g": "inbound·standalone",
    "c": "Chat",
    "f": "Chat",
    "st": "keep",
    "note": "Context the user shares (Figma/docs/video) — a log bubble in the chat window."
  },
  {
    "e": "runs_updated",
    "a": "SCA v2",
    "g": "session·standalone",
    "c": "Suppress",
    "f": "Suppress",
    "st": "dead",
    "note": "Dead/unused — publish_sprint_event has zero callers. Dashboard-invalidation signal, harmless if it fires."
  },
  {
    "e": "progress",
    "a": "PR-TAA",
    "g": "session·standalone",
    "c": "Murmur",
    "f": "Murmur",
    "st": "keep",
    "note": "Phase ticks: compressing → planning → expanding."
  },
  {
    "e": "result",
    "a": "PR-TAA",
    "g": "session·end",
    "c": "Outcome",
    "f": "Outcome",
    "st": "keep",
    "note": "Terminal success — the whole PR authoring result lands as one Outcome bubble (summary + scenarios/test cases). The payoff."
  },
  {
    "e": "error",
    "a": "PR-TAA",
    "g": "session·standalone",
    "c": "Milestone",
    "f": "Milestone",
    "st": "keep",
    "sev": "P1",
    "note": "Terminal failure of a 3-event SSE stream. Rendered as a visible Milestone error step (consistent with every other agent's error) so it is never silently dropped. A persistent Outcome card with a retry affordance is a future enhancement — if built, re-tier here and in router.ts together."
  }
]
