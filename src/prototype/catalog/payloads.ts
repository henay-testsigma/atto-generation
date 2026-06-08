import type { CatalogEntry } from './catalogData'

/** Deterministic short hex id from a string (no Math.random — keeps stable). */
function shortId(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h.toString(16).slice(0, 4).padStart(4, '0')
}

const SOURCE: Record<string, string> = {
  COMMON: 'taa',
  TAA: 'taa',
  CAA: 'caa',
  RAA: 'raa',
  'SCA v2': 'sca',
  'TPA v1': 'tpa-v1',
  'TPA v2': 'tpa-v2',
  'PR-TAA': 'pr-taa',
}

/** Humanize an event name into a plausible `content` string. */
function humanize(e: string): string {
  return e
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Hand-authored sample payloads for the hard / high-signal events, drawn from
 * event-payloads.md. Keyed by event name (or `agent:event` for ambiguous ones).
 */
const OVERRIDES: Record<string, Record<string, unknown>> = {
  session_started: { content: 'Session started', thread_id: 'thread_8d2c', turn_id: 0 },
  session_completed: { content: 'Generated 42 Test Cases', summary: 'Generated 42 test cases across 6 scenarios.' },
  summary_generated: { content: 'Summary', summary: 'Generated 42 test cases across 6 scenarios (34 new, 8 updated).' },
  plan_started: {
    content: 'Generation Plan',
    items: [
      { item_id: 'i1', task: 'Analyze requirements for Google OAuth account creation', phase: 'discovery' },
      { item_id: 'i2', task: 'Create scenarios across happy path, errors, security, edge cases', phase: 'scoring' },
      { item_id: 'i3', task: 'Generate detailed test cases for each scenario', phase: 'authoring' },
      { item_id: 'i4', task: 'Validate, deduplicate, and summarize', phase: 'validation' },
    ],
  },
  plan_appended: { content: 'Added 1 step', items: [{ item_id: 'i5', task: 'Sync plan to TMS', phase: 'validation' }] },
  plan_completed: { content: 'Plan complete', done_count: 4, total_count: 4 },
  tool_started: { content: 'Analyzing prompt and context', tool_name: 'analyze_prompt', tool_call_id: 'call_ap01', args_preview: { prompt: 'Google OAuth account creation' } },
  tool_completed: { content: 'Analyzing prompt and context', tool_name: 'analyze_prompt', tool_call_id: 'call_ap01', result_preview: "{ intent: 'signup', provider: 'google' }" },
  tool_failed: { content: 'search_test_cases failed', tool_name: 'search_test_cases', error: 'Upstream timeout', traceback: 'Traceback (most recent call last): … (redacted from end users)' },
  'RAA:tool_start': { content: 'Running grep', tool_name: 'grep', args_preview: { pattern: 'oauth' } },
  question_asked: {
    content: 'I found 12 existing OAuth tests. How should I handle them?',
    question: 'I found 12 existing OAuth tests. How should I handle them?',
    options: [
      { id: 'new_only', label: 'Author new cases only' },
      { id: 'update_existing', label: 'Update the 12 existing where they overlap' },
      { id: 'both', label: 'Both — update overlaps, add new for gaps' },
    ],
  },
  question: {
    content: 'Which environment should this plan target?',
    question: 'Which environment should this plan target?',
    options: ['Staging', 'Production', 'Preview only'],
  },
  question_answered: { content: 'Answered: Both', answer: 'both' },
  reasoning: { content: 'The user wants test cases for account creation via Google OAuth. I will map the Jira requirements and the Figma flow before drafting scenarios.', phase: 'discovery' },
  progress: { content: 'Indexed 184 prior test cases', message: 'Indexed 184 prior test cases', percentage: 40 },
  // skill_loaded is per-agent: TAA sends only skill_name (no description);
  // CAA / RAA / TPA include skill_description.
  'TAA:skill_loaded': { content: 'Reading the Figma file', tool_name: 'load_skill', skill_name: 'scenario-from-figma', group_type: 'session', lifecycle: 'standalone' },
  'CAA:skill_loaded': { content: 'Loaded skill: gap-detection', tool_name: 'load_skill', skill_name: 'gap-detection', skill_description: 'Detect missing/incomplete/outdated coverage with severity', group_type: 'tool', lifecycle: 'end' },
  'RAA:skill_loaded': { content: 'Loaded skill: failure-classification', tool_name: 'load_skill', skill_name: 'failure-classification', skill_description: 'Classify failures (true/false-positive/flaky/env) with confidence', group_type: 'tool', lifecycle: 'end' },
  'TPA v1:skill_loaded': { content: 'Loaded skill: blast_radius', tool_name: 'load_skill', skill_name: 'blast_radius', skill_description: 'Map change propagation; classify direct/indirect/transitive risk', group_type: 'tool', lifecycle: 'end' },
  sub_agent_started: { content: 'App Explorer started', sub_agent_id: 'sa_explore', label: 'App Explorer', tool_name: 'spawn_app_explorer', objective: 'Map the Google OAuth signup flow' },
  sub_agent_progress: { content: 'Captured the OAuth consent dialog', sub_agent_id: 'sa_explore', step_number: 5, total_steps: 8 },
  sub_agent_signals: { content: 'Mapped 8 pages and 3 forms', sub_agent_id: 'sa_explore', signals: [{ name: 'form_found', value: 'oauth-consent', details: { fields: 6 } }] },
  sub_agent_completed: { content: 'App Explorer done', sub_agent_id: 'sa_explore', label: 'App Explorer', summary: 'Mapped 8 pages and 3 forms', step_count: 8 },
  scenario_saved: {
    content: 'Saved scenario: Successful account creation via Google OAuth',
    scenario_id: 'scn_1',
    title: 'Successful account creation via Google OAuth',
    scenario: { id: 'scn_1', title: 'Successful account creation via Google OAuth', priority: 'P1', category: 'Happy Path', tags: ['oauth', 'signup'] },
  },
  test_case_saved: {
    content: 'Saved TC: Successful sign-up redirects to the dashboard',
    test_case_id: 'tc_1001',
    scenario_id: 'scn_1',
    title: 'Successful sign-up redirects to the dashboard',
    human_id: 'TC-1001',
    is_update: false,
    test_case: {
      id: 'tc_1001',
      steps: [{ action: 'Complete the OAuth consent', expected: 'Account is created and a session is issued' }],
      priority: 'P0',
      template_type: 'STEPS',
      module: 'Authentication',
      test_type: 'Functional',
      acceptance_status: 'pending',
    },
  },
  test_case_updated: { content: 'Updated TC-1006', test_case_id: 'tc_1006', fields_changed: ['title', 'priority'], test_case: { id: 'tc_1006', priority: 'P1' } },
  acceptance_status_updated: { content: 'Accepted TC-1001', scenario_id: 'scn_1', test_case_id: 'tc_1001', human_id: 'TC-1001', status: 'accepted', chitragupt_test_case_id: '1023', folder_id: 'fld_3' },
  validation_completed: { content: 'Test cases validated', final_pass: true, total_iterations: 2, summary: 'All test cases valid' },
  validation_iteration: { content: 'Dedup: TC-1006 overlapped TC-1001 — merged', iteration: 1, passed: false, issues: ['TC-1006 overlaps TC-1001'] },
  visualization: { content: 'Coverage by feature', payload: { event_type: 'visualization', data: { viz_type: 'donut', title: 'Overall Coverage', subtitle: 'Across all features', data: { covered: 240, uncovered: 72 } } }, metadata: { auto_viz: true } },
  'RAA:visualization': { content: 'Tier buckets', viz_type: 'donut', title: 'Tier bucket counts', subtitle: 'Plan 55', data: { smoke: 18, feature: 64, regression: 230 } },
  event: { content: 'Coverage detected', event_type: 'gap_detected', payload: { feature: 'guest-checkout refund', severity: 'high' } },
  // SCA's `event` is an ad-hoc status NOTICE (no inner event_type) — a plain
  // Murmur line, NOT the generic chart/findings envelope. Distinct sample so it
  // routes to Murmur (matching the ledger), not Outcome.
  'SCA v2:event': { content: 'Session not found — nothing to resume', lifecycle: 'standalone' },
  welcome: { content: "On it — I'll author test cases for account creation via Google OAuth." },
  message: { content: 'Generate test cases for creating account using Google OAuth' },
  dev_context: { content: 'Context from GitHub PR #482 — “Add Google OAuth signup”.' },
  error: { content: 'Something went wrong', traceback: 'Traceback (most recent call last): … (redacted)' },
  signal_worker_started: { content: 'discovery worker started', signal: 'discovery', label: 'Discovery', attempt: 1 },
  signal_worker_failed: { content: 'blast_radius failed', signal: 'blast_radius', error_class: 'TimeoutError', error_message: 'redis read exceeded 5s', attempt: 2 },
  token_usage: { input_tokens: 4210, output_tokens: 880, total_tokens: 5090, model: 'claude-sonnet-4-6' },
}

export function payloadFor(entry: CatalogEntry): Record<string, unknown> {
  const override = OVERRIDES[entry.id] ?? OVERRIDES[entry.event] ?? {}
  const isSession = entry.groupType === 'session'
  const base: Record<string, unknown> = {
    event_id: shortId(entry.id),
    type: entry.event,
    group_type: entry.groupType,
    group_id: isSession ? 'thread_8d2c' : `${entry.groupType}_${shortId(entry.event)}`,
    parent_group_id: isSession ? null : 'thread_8d2c',
    lifecycle: entry.lifecycle,
    content: humanize(entry.event),
    source: SOURCE[entry.agent] ?? 'taa',
  }
  return { ...base, ...override }
}
