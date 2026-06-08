import type { AgentEvent } from './types'

export interface ScenarioMeta {
  id: string
  name: string
  hint: string
  events: AgentEvent[]
  /** Top-right pinned user prompt — rendered as a chat bubble. */
  pinnedPrompt?: {
    text: string
    context?: { kind: string; label: string; count?: number }[]
  }
  /** Optional fixed breadcrumb for the right work-panel (when twoPane). */
  rightBreadcrumb?: string[]
}

// ---------------------------------------------------------------------------
// TAA — default scenario (walks S1 → S10)
// ---------------------------------------------------------------------------

// The 15 OAuth scenarios drafted in Phase B. The first 6 are also the groups
// the Phase-C test cases are authored under, so the review table mirrors the
// scenarios the user just approved.
const SCN_ITEMS: { id: string; title: string; category: string }[] = [
  { id: 'scn_1', title: 'Successful account creation via Google OAuth', category: 'Happy Path' },
  { id: 'scn_2', title: 'Account creation with an existing Google account', category: 'Happy Path' },
  { id: 'scn_3', title: 'Session is established after OAuth account creation', category: 'Happy Path' },
  { id: 'scn_4', title: 'User cancels the OAuth consent flow', category: 'Error handling' },
  { id: 'scn_5', title: 'OAuth token validation failure', category: 'Error handling' },
  { id: 'scn_6', title: 'Google API error during account creation', category: 'Error handling' },
  { id: 'scn_7', title: 'Network failure mid OAuth flow', category: 'Error handling' },
  { id: 'scn_8', title: 'OAuth state parameter CSRF protection', category: 'Error handling security-critical' },
  { id: 'scn_9', title: 'OAuth redirect URI validation', category: 'Error handling security-critical' },
  { id: 'scn_10', title: 'Account creation with missing Google profile data', category: 'Data handling' },
  { id: 'scn_11', title: 'Account creation with an email already in use', category: 'Data handling' },
  { id: 'scn_12', title: 'OAuth creation with a restricted Google account', category: 'Edge case' },
  { id: 'scn_13', title: 'Multiple OAuth attempts with the same account', category: 'Edge case' },
  { id: 'scn_14', title: 'OAuth scope permission variations', category: 'Edge case' },
  { id: 'scn_15', title: 'Account creation with a Google Workspace account', category: 'Edge case' },
]

const taaEvents: AgentEvent[] = [
  // ===================================================================
  //  PHASE A — Analysis & planning  (S1→S5)
  // ===================================================================
  { tDelta: 100, type: 'session_started', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'start', content: 'Session started', thread_id: 'thread_8d2c', turn_id: 0, source: 'taa' },
  { tDelta: 300, type: 'welcome', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: "On it — I'll author test cases for account creation via Google OAuth. One quick question before I start.", source: 'taa' },

  // ❓ Disambiguation UPFRONT — scope question → user answer → then the work.
  { tDelta: 400, type: 'question_asked', group_type: 'question', group_id: 'q_reuse', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'How should I treat the existing OAuth tests in this project?', question: 'How should I treat the existing OAuth tests in this project?', options: [{ id: 'new_only', label: 'Author new cases only' }, { id: 'update_existing', label: 'Update existing tests where they overlap' }, { id: 'both', label: 'Both — update overlaps, add new for gaps' }] },
  { tDelta: 0, type: '__pause__', __pause__: 'disambiguation', source: 'taa' },
  { tDelta: 200, type: 'question_answered', group_type: 'question', group_id: 'q_reuse', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Answered', answer: 'both' },
  { tDelta: 250, type: 'message', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Got it — putting together a generation plan.', source: 'taa' },

  // S2/S3 — murmur "Analyzing prompt and context" + reasoning under the chevron
  { tDelta: 500, type: 'reasoning', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Reading the prompt with the 3 linked Jira requirements and 2 Figma screens.', phase: 'discovery' },
  { tDelta: 300, type: 'tool_started', group_type: 'tool', group_id: 'call_analyze', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Analyzing prompt and context', tool_name: 'analyze_prompt' },
  { tDelta: 900, type: 'reasoning', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'The user wants test cases for account creation via Google OAuth. I will map the Jira requirements and the Figma screen flow before drafting scenarios.', phase: 'discovery' },
  { tDelta: 1300, type: 'tool_completed', group_type: 'tool', group_id: 'call_analyze', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Analyzing prompt and context', tool_name: 'analyze_prompt', result_preview: "intent: account-creation, provider: google" },
  { tDelta: 150, type: 'token_usage', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', input_tokens: 4210, output_tokens: 880, model: 'claude-sonnet-4-6' },

  // S4 — milestone timeline grows
  { tDelta: 250, type: 'tool_started', group_type: 'tool', group_id: 'call_memcheck', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Checking project memory and test library', tool_name: 'search_test_cases' },
  { tDelta: 1100, type: 'progress', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Indexed 184 prior test cases', message: 'Indexed 184 prior test cases', percentage: 40 },
  { tDelta: 700, type: 'tool_completed', group_type: 'tool', group_id: 'call_memcheck', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Checking project memory and test library', tool_name: 'search_test_cases', result_preview: '12 related OAuth tests' },

  // Skills ("lenses") loaded for the attached context. TAA sends skill_name
  // only on the wire — the UI enriches the step with the skill's purpose.
  { tDelta: 300, type: 'skill_loaded', group_type: 'session', group_id: 'skill_intake', parent_group_id: 'thread_8d2c', lifecycle: 'standalone', content: 'Assessing the request', tool_name: 'load_skill', skill_name: 'intake-analysis', source: 'taa' },
  { tDelta: 350, type: 'skill_loaded', group_type: 'session', group_id: 'skill_jira', parent_group_id: 'thread_8d2c', lifecycle: 'standalone', content: 'Reading the Jira stories', tool_name: 'load_skill', skill_name: 'scenario-from-jira', source: 'taa' },
  { tDelta: 350, type: 'skill_loaded', group_type: 'session', group_id: 'skill_figma', parent_group_id: 'thread_8d2c', lifecycle: 'standalone', content: 'Reading the Figma screens', tool_name: 'load_skill', skill_name: 'scenario-from-figma', source: 'taa' },

  { tDelta: 300, type: 'tool_started', group_type: 'tool', group_id: 'call_req', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Identifying requirements to cover', tool_name: 'requirements_to_cover' },
  { tDelta: 1200, type: 'reasoning', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Prioritizing happy-path coverage first, then error handling, security, and finally edge cases.', phase: 'scoring' },
  { tDelta: 700, type: 'tool_completed', group_type: 'tool', group_id: 'call_req', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Identifying requirements to cover', tool_name: 'requirements_to_cover' },
  { tDelta: 250, type: 'tool_started', group_type: 'tool', group_id: 'call_plan', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Building generation plan', tool_name: 'build_plan' },
  { tDelta: 1400, type: 'tool_completed', group_type: 'tool', group_id: 'call_plan', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Building generation plan', tool_name: 'build_plan' },

  // S5 — Generation Plan approval gate
  {
    tDelta: 300,
    type: 'plan_started',
    group_type: 'plan',
    group_id: 'plan_1',
    parent_group_id: 'thread_8d2c',
    lifecycle: 'start',
    content: 'Generation Plan',
    items: [
      { item_id: 'i1', task: 'Analyze requirements for Google OAuth account creation', phase: 'discovery' },
      { item_id: 'i2', task: 'Create test scenarios covering happy path, errors, security, and edge cases', phase: 'scoring' },
      { item_id: 'i3', task: 'Generate detailed test cases for each scenario', phase: 'authoring' },
      { item_id: 'i4', task: 'Validate, deduplicate, and produce a final summary', phase: 'validation' },
    ],
  },
  { tDelta: 0, type: '__pause__', __pause__: 'plan_approval', source: 'taa' },
  { tDelta: 100, type: 'plan_completed', group_type: 'plan', group_id: 'plan_1', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Plan complete', done_count: 4, total_count: 4 },

  // ===================================================================
  //  PHASE B — Scenario generation  (S6/S7) — takes time, has events
  // ===================================================================
  { tDelta: 200, type: 'phase_started', group_type: 'phase', group_id: 'ph_scn', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Generating test scenarios' },
  { tDelta: 200, type: 'sub_agent_started', group_type: 'sub_agent', group_id: 'sa_explore', parent_group_id: 'ph_scn', lifecycle: 'start', content: 'App Explorer started', sub_agent_id: 'sa_explore', label: 'App Explorer', tool_name: 'spawn_app_explorer', objective: 'Map the Google OAuth signup flow' },
  { tDelta: 300, type: 'skill_loaded', group_type: 'session', group_id: 'skill_appflow', parent_group_id: 'thread_8d2c', lifecycle: 'standalone', content: 'Mapping the discovered app flow', tool_name: 'load_skill', skill_name: 'scenario-from-app-flow', source: 'taa' },
  { tDelta: 800, type: 'sub_agent_progress', group_type: 'sub_agent', group_id: 'sa_explore', parent_group_id: 'thread_8d2c', lifecycle: 'progress', content: 'Loaded the signup screen', sub_agent_id: 'sa_explore', step_number: 2, total_steps: 8 },
  { tDelta: 800, type: 'reasoning', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Walking the consent and callback handling to find branch points worth covering.', phase: 'scenarios' },
  { tDelta: 900, type: 'sub_agent_progress', group_type: 'sub_agent', group_id: 'sa_explore', parent_group_id: 'thread_8d2c', lifecycle: 'progress', content: 'Captured the OAuth consent dialog', sub_agent_id: 'sa_explore', step_number: 5, total_steps: 8 },
  { tDelta: 800, type: 'sub_agent_progress', group_type: 'sub_agent', group_id: 'sa_explore', parent_group_id: 'thread_8d2c', lifecycle: 'progress', content: 'Inspecting the account-exists collision path', sub_agent_id: 'sa_explore', step_number: 7, total_steps: 8 },
  { tDelta: 600, type: 'sub_agent_signals', group_type: 'sub_agent', group_id: 'sa_explore', parent_group_id: 'thread_8d2c', lifecycle: 'progress', content: 'Mapped 8 pages and 3 forms', sub_agent_id: 'sa_explore', signals: [{ name: 'form_found', value: 'oauth-consent', details: { fields: 6 } }, { name: 'form_found', value: 'profile-complete' }] },
  { tDelta: 500, type: 'sub_agent_completed', group_type: 'sub_agent', group_id: 'sa_explore', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'App Explorer done', sub_agent_id: 'sa_explore', label: 'App Explorer', summary: 'Mapped 8 pages and 3 forms', step_count: 8 },
  { tDelta: 400, type: 'progress', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Drafting scenarios across happy paths, errors, and edge cases', message: 'Drafting scenarios', percentage: 55 },
  ...buildScenarioBatch(),
  { tDelta: 300, type: 'skill_loaded', group_type: 'session', group_id: 'skill_dedup', parent_group_id: 'thread_8d2c', lifecycle: 'standalone', content: 'De-duplicating against existing tests', tool_name: 'load_skill', skill_name: 'dedup-batch', source: 'taa' },
  { tDelta: 300, type: 'validation_started', group_type: 'validation', group_id: 'val_scn', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Validating scenarios' },
  { tDelta: 700, type: 'validation_iteration', group_type: 'validation', group_id: 'val_scn', parent_group_id: 'thread_8d2c', lifecycle: 'progress', content: 'Checking each scenario has clear preconditions', iteration: 1, passed: true },
  { tDelta: 700, type: 'validation_completed', group_type: 'validation', group_id: 'val_scn', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Scenarios validated', final_pass: true, total_iterations: 1, summary: 'All 15 scenarios valid' },
  { tDelta: 250, type: 'phase_completed', group_type: 'phase', group_id: 'ph_scn', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Scenario generation complete', review_required: true },
  { tDelta: 0, type: '__pause__', __pause__: 'scenarios_review', source: 'taa' },

  // ===================================================================
  //  PHASE C — Test-case generation  (S8→S10) — two-pane, per-scenario
  // ===================================================================
  { tDelta: 100, type: '__layout__', __layout__: 'two-pane' },
  { tDelta: 150, type: 'phase_started', group_type: 'phase', group_id: 'ph_tc', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Generating test cases' },
  { tDelta: 300, type: 'progress', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Spinning up authoring agents', message: 'Generating test cases', percentage: 1 },
  { tDelta: 700, type: 'reasoning', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Authoring detailed steps and expected results for each approved scenario.', phase: 'authoring' },
  ...buildTestCaseBatch(),
  { tDelta: 300, type: 'skill_loaded', group_type: 'session', group_id: 'skill_refine', parent_group_id: 'thread_8d2c', lifecycle: 'standalone', content: 'Refining cases after validation', tool_name: 'load_skill', skill_name: 'review-and-refine', source: 'taa' },
  { tDelta: 300, type: 'validation_started', group_type: 'validation', group_id: 'val_tc', parent_group_id: 'thread_8d2c', lifecycle: 'start', content: 'Validating and deduplicating test cases' },
  { tDelta: 700, type: 'validation_iteration', group_type: 'validation', group_id: 'val_tc', parent_group_id: 'thread_8d2c', lifecycle: 'progress', content: 'Dedup: TC-1006 overlapped TC-1001 — merged', iteration: 1, passed: false, issues: ['TC-1006 overlaps TC-1001'] },
  { tDelta: 700, type: 'validation_completed', group_type: 'validation', group_id: 'val_tc', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Test cases validated', final_pass: true, total_iterations: 2, summary: 'Re-authored 2 overlapping cases — all 42 now pass', reauthored: 2, reauthored_ids: ['tc_1001', 'tc_1006'] },
  { tDelta: 250, type: 'phase_completed', group_type: 'phase', group_id: 'ph_tc', parent_group_id: 'thread_8d2c', lifecycle: 'end', content: 'Test case generation complete', review_required: false },
  { tDelta: 250, type: 'summary_generated', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: 'Summary', summary: 'Generated 42 test cases across 6 scenarios (34 new, 8 updated).' },
  { tDelta: 200, type: 'session_completed', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'end', content: 'Generated 42 Test Cases', summary: 'Generated 42 test cases across 6 scenarios.' },
]

function categoryPriority(category: string): string {
  if (category.includes('security')) return 'P0'
  if (category.startsWith('Happy')) return 'P1'
  if (category.startsWith('Error')) return 'P1'
  return 'P2'
}

function buildScenarioBatch(): AgentEvent[] {
  return SCN_ITEMS.map((it, idx) => ({
    tDelta: idx === 0 ? 350 : 230,
    type: 'scenario_saved',
    group_type: 'scenario',
    group_id: it.id,
    parent_group_id: 'thread_8d2c',
    lifecycle: 'start',
    content: `Saved scenario: ${it.title}`,
    scenario_id: it.id,
    title: it.title,
    scenario: {
      id: it.id,
      title: it.title,
      priority: categoryPriority(it.category),
      category: it.category,
      tags: ['oauth', 'signup'],
    },
  }))
}

function buildTestCaseBatch(): AgentEvent[] {
  // Names-first: the agent returns ALL case names together (one event seeds the
  // whole review table with loading rows), then authors each case — every
  // `test_case_saved` flips one row's loader to its final priority icon.
  const groups = SCN_ITEMS.slice(0, 6)
  const caseTitles = [
    'Successful sign-up redirects to the dashboard',
    'Consent screen shows the requested scopes',
    'Profile fields are pre-filled from the Google account',
    'Callback with a tampered state is rejected',
    'Expired authorization code returns a clear error',
    'Duplicate email surfaces an account-linking prompt',
    'Session cookie is issued with Secure + HttpOnly',
  ]

  type Case = {
    id: string
    human: string
    title: string
    scenarioId: string
    scenarioTitle: string
    is_update: boolean
    priority: string
    module: string
    test_type: string
  }
  const byGroup: Case[][] = []
  let counter = 1001
  groups.forEach((g) => {
    const cases: Case[] = []
    for (let i = 0; i < 7; i++) {
      const id = `tc_${counter}`
      cases.push({
        id,
        human: `TC-${counter}`,
        title: caseTitles[i % caseTitles.length],
        scenarioId: g.id,
        scenarioTitle: g.title,
        is_update: i % 6 === 0,
        priority: i === 0 ? 'P0' : i < 2 ? 'P1' : i < 5 ? 'P2' : 'P3',
        module: i % 2 === 0 ? 'Authentication' : 'User Profile',
        test_type: i % 3 === 0 ? 'Functional' : i % 3 === 1 ? 'Non-Functional' : 'User Experience',
      })
      counter += 1
    }
    byGroup.push(cases)
  })
  const all = byGroup.flat()

  const evs: AgentEvent[] = []
  // 1) All names at once — every row appears in a loading state.
  evs.push({
    tDelta: 700,
    type: 'test_cases_planned',
    group_type: 'session',
    group_id: 'thread_8d2c',
    parent_group_id: null,
    lifecycle: 'standalone',
    content: `Planned ${all.length} test cases`,
    test_cases: all.map((c) => ({
      id: c.id,
      test_case_id: c.id,
      human_id: c.human,
      title: c.title,
      scenario_id: c.scenarioId,
      scenarioTitle: c.scenarioTitle,
      is_update: c.is_update,
      template_type: 'STEPS',
      module: c.module,
      test_type: c.test_type,
    })),
    source: 'taa',
  })

  // 2) Author each scenario's cases — flips loaders to priority icons.
  groups.forEach((g, gi) => {
    const cases = byGroup[gi]
    evs.push({ tDelta: 250, type: 'sub_agent_started', group_type: 'sub_agent', group_id: `sa_au_${gi}`, parent_group_id: 'ph_tc', lifecycle: 'start', content: `Authoring cases for “${g.title}”`, sub_agent_id: `sa_au_${gi}`, label: 'Case Author', objective: `Author cases for ${g.title}` })
    evs.push({ tDelta: 400, type: 'sub_agent_progress', group_type: 'sub_agent', group_id: `sa_au_${gi}`, parent_group_id: 'thread_8d2c', lifecycle: 'progress', content: `Writing steps for “${g.title}”`, sub_agent_id: `sa_au_${gi}`, step_number: gi + 1, total_steps: groups.length })
    cases.forEach((c) => {
      evs.push({
        tDelta: 220,
        type: 'test_case_saved',
        group_type: 'test_case',
        group_id: c.id,
        parent_group_id: g.id,
        lifecycle: 'end',
        content: `Authored: ${c.title}`,
        test_case_id: c.id,
        scenario_id: g.id,
        scenarioTitle: g.title,
        title: c.title,
        human_id: c.human,
        is_update: c.is_update,
        test_case: {
          id: c.id,
          steps: [{ action: 'Trigger the OAuth callback', expected: 'Account is created and a session is issued' }],
          priority: c.priority,
          template_type: 'STEPS',
          module: c.module,
          test_type: c.test_type,
          acceptance_status: 'pending',
        },
      })
    })
    evs.push({ tDelta: 200, type: 'sub_agent_completed', group_type: 'sub_agent', group_id: `sa_au_${gi}`, parent_group_id: 'thread_8d2c', lifecycle: 'end', content: `Authored ${cases.length} cases for “${g.title}”`, sub_agent_id: `sa_au_${gi}`, label: 'Case Author', summary: `Authored ${cases.length} cases for “${g.title}”` })
    evs.push({ tDelta: 100, type: 'progress', group_type: 'session', group_id: 'thread_8d2c', parent_group_id: null, lifecycle: 'standalone', content: `Generated cases for ${gi + 1} of ${groups.length} scenarios`, message: 'Generating test cases', percentage: Math.round(((gi + 1) / groups.length) * 100) })
  })
  return evs
}

// ---------------------------------------------------------------------------
// CAA — coverage analysis (gap-detection sub-agent + donut + close)
// ---------------------------------------------------------------------------

const caaEvents: AgentEvent[] = [
  { tDelta: 100, type: 'welcome', group_type: 'session', group_id: 'thread_caa', parent_group_id: null, lifecycle: 'standalone', content: 'Coverage analyzer ready.', source: 'caa' },
  { tDelta: 300, type: 'skill_loaded', group_type: 'tool', group_id: 'call_skill_caa', parent_group_id: 'thread_caa', lifecycle: 'standalone', content: 'Loaded skill: gap-detection', tool_name: 'load_skill', skill_name: 'gap-detection', skill_description: 'Detect missing/incomplete coverage gaps', source: 'caa' },
  { tDelta: 200, type: 'sub_agent_started', group_type: 'sub_agent', group_id: 'call_g1', parent_group_id: 'thread_caa', lifecycle: 'start', content: 'Gap Detection Agent started', sub_agent_id: 'call_g1', label: 'Gap Detection Agent', tool_name: 'spawn_gap_detection_agent', objective: 'Find untested requirements in checkout', source: 'caa' },
  { tDelta: 800, type: 'reasoning', group_type: 'session', group_id: 'thread_caa', parent_group_id: null, lifecycle: 'standalone', content: 'Comparing checkout flows against existing test ownership', source: 'caa' },
  { tDelta: 1200, type: 'sub_agent_signals', group_type: 'sub_agent', group_id: 'call_g1', parent_group_id: 'thread_caa', lifecycle: 'progress', content: '7 findings', sub_agent_id: 'call_g1', label: 'Gap Detection Agent', signals: [{ finding: 'No tests for guest-checkout refund', suggestion: 'Add a refund flow test case' }], source: 'caa' },
  { tDelta: 600, type: 'sub_agent_completed', group_type: 'sub_agent', group_id: 'call_g1', parent_group_id: 'thread_caa', lifecycle: 'end', content: 'Gap Detection Agent done', sub_agent_id: 'call_g1', label: 'Gap Detection Agent', findings_count: 7, source: 'caa' },
  { tDelta: 300, type: 'analysis_saved', group_type: 'tool', group_id: 'call_a1', parent_group_id: 'thread_caa', lifecycle: 'standalone', content: 'Saved analysis: gap_detection', tool_name: 'save_coverage_analysis', analysis_name: 'gap_detection', source: 'caa' },
  { tDelta: 400, type: 'visualization', group_type: 'session', group_id: 'thread_caa', parent_group_id: null, lifecycle: 'standalone', content: 'Coverage by feature', payload: { event_type: 'visualization', data: { viz_type: 'donut', title: 'Overall Coverage', subtitle: 'Across all features', data: { covered: 240, uncovered: 72 } } }, metadata: { auto_viz: true }, source: 'caa' },
  { tDelta: 600, type: 'session_complete', group_type: 'session', group_id: 'thread_caa', parent_group_id: null, lifecycle: 'end', content: 'Coverage analysis complete', payload: { analyses_saved: 4, total_llm_calls: 11, total_tokens: 26300 }, source: 'caa' },
]

// ---------------------------------------------------------------------------
// TPA-v2 — 3-way fan-out + scoring
// ---------------------------------------------------------------------------

const tpaV2Events: AgentEvent[] = [
  { tDelta: 100, type: 'session_started', group_type: 'session', group_id: 'thread_tpa', parent_group_id: null, lifecycle: 'start', content: 'Session started', source: 'tpa-v2' },
  // 3 workers open in quick succession — Murmur N-of-M strip should appear
  { tDelta: 200, type: 'signal_worker_started', group_type: 'sub_agent', group_id: 'sw_discovery', parent_group_id: 'thread_tpa', lifecycle: 'start', content: 'discovery worker started', signal: 'discovery', label: 'Discovery', attempt: 1, source: 'tpa-v2' },
  { tDelta: 80, type: 'signal_worker_started', group_type: 'sub_agent', group_id: 'sw_impact', parent_group_id: 'thread_tpa', lifecycle: 'start', content: 'impact worker started', signal: 'impact', label: 'Impact', attempt: 1, source: 'tpa-v2' },
  { tDelta: 80, type: 'signal_worker_started', group_type: 'sub_agent', group_id: 'sw_blast', parent_group_id: 'thread_tpa', lifecycle: 'start', content: 'blast_radius worker started', signal: 'blast_radius', label: 'Blast Radius', attempt: 1, source: 'tpa-v2' },
  { tDelta: 800, type: 'reasoning', group_type: 'session', group_id: 'thread_tpa', parent_group_id: null, lifecycle: 'standalone', content: 'Weighting indirect regression risk', source: 'tpa-v2' },
  { tDelta: 1200, type: 'signal_worker_completed', group_type: 'sub_agent', group_id: 'sw_discovery', parent_group_id: 'thread_tpa', lifecycle: 'end', content: 'discovery: 47 candidates in 2.3s', signal: 'discovery', elapsed_s: 2.34, n: 47, source: 'tpa-v2' },
  { tDelta: 600, type: 'signal_worker_completed', group_type: 'sub_agent', group_id: 'sw_impact', parent_group_id: 'thread_tpa', lifecycle: 'end', content: 'impact: 18 changes', signal: 'impact', elapsed_s: 3.0, n: 18, source: 'tpa-v2' },
  { tDelta: 500, type: 'signal_worker_failed', group_type: 'sub_agent', group_id: 'sw_blast', parent_group_id: 'thread_tpa', lifecycle: 'end', content: 'blast_radius failed', signal: 'blast_radius', error_class: 'TimeoutError', error_message: 'redis read exceeded 5s', attempt: 2, source: 'tpa-v2' },
  { tDelta: 600, type: 'scoring_completed', group_type: 'session', group_id: 'thread_tpa', parent_group_id: null, lifecycle: 'progress', content: 'Scored 312 candidates', scored: 312, tier_bucket_counts: { smoke: 18, feature: 64, regression: 230 }, source: 'tpa-v2' },
  { tDelta: 250, type: 'visualization', group_type: 'session', group_id: 'thread_tpa', parent_group_id: null, lifecycle: 'standalone', content: 'Tier buckets', viz_type: 'donut', title: 'Tier bucket counts', subtitle: 'Plan 55', data: { smoke: 18, feature: 64, regression: 230 }, source: 'tpa-v2' },
  { tDelta: 300, type: 'tms_backfill_started', group_type: 'phase', group_id: 'backfill_1', parent_group_id: 'thread_tpa', lifecycle: 'start', content: 'Syncing plan to TMS', plan_id: 'plan_55', source: 'tpa-v2' },
  { tDelta: 800, type: 'tms_backfill_completed', group_type: 'phase', group_id: 'backfill_1', parent_group_id: 'thread_tpa', lifecycle: 'end', content: 'Backfill complete', plan_id: 'plan_55', runs_synced: 4, cases_synced: 312, failures: 0, source: 'tpa-v2' },
  { tDelta: 300, type: 'session_completed', group_type: 'session', group_id: 'thread_tpa', parent_group_id: null, lifecycle: 'end', content: 'Plan ready', source: 'tpa-v2' },
]

// ---------------------------------------------------------------------------
// Gate-question scenario — pauses for a discrete-option answer
// ---------------------------------------------------------------------------

const gateEvents: AgentEvent[] = [
  { tDelta: 100, type: 'session_started', group_type: 'session', group_id: 'thread_gate', parent_group_id: null, lifecycle: 'start', content: 'Session started', source: 'taa' },
  { tDelta: 300, type: 'tool_started', group_type: 'tool', group_id: 'call_a', parent_group_id: 'thread_gate', lifecycle: 'start', content: 'Surveying environments', tool_name: 'survey_env' },
  { tDelta: 900, type: 'tool_completed', group_type: 'tool', group_id: 'call_a', parent_group_id: 'thread_gate', lifecycle: 'end', content: 'Surveying environments', tool_name: 'survey_env' },
  { tDelta: 200, type: 'question_asked', group_type: 'question', group_id: 'q1', parent_group_id: 'thread_gate', lifecycle: 'start', content: 'Which environment should this plan target?', question: 'Which environment should this plan target?', options: [{ id: 'staging', label: 'Staging' }, { id: 'prod', label: 'Production' }, { id: 'preview', label: 'Preview only' }] },
  { tDelta: 0, type: '__pause__', __pause__: 'gate_question', source: 'taa' },
  { tDelta: 200, type: 'question_answered', group_type: 'question', group_id: 'q1', parent_group_id: 'thread_gate', lifecycle: 'end', content: 'Answered', answer: 'staging' },
  { tDelta: 400, type: 'progress', content: 'Building plan for Staging', message: 'Building plan for Staging' },
  { tDelta: 800, type: 'session_completed', group_type: 'session', group_id: 'thread_gate', parent_group_id: null, lifecycle: 'end', content: 'Plan ready' },
]

// ---------------------------------------------------------------------------
// SCA — sprint coverage (TAA + CAA interleaved, source-tagged)
// ---------------------------------------------------------------------------

const scaEvents: AgentEvent[] = [
  { tDelta: 100, type: 'welcome', content: 'Sprint coverage assistant ready.', group_type: 'session', group_id: 'thread_sca', parent_group_id: null, source: 'sca' },
  { tDelta: 250, type: 'skill_loaded', content: 'Loaded skill: gap-detection', group_type: 'tool', group_id: 'call_sca_skill', parent_group_id: 'thread_sca', payload: { tool_name: 'load_skill', skill_name: 'gap-detection', skill_description: 'Detect missing/incomplete coverage gaps' }, source: 'caa' },
  { tDelta: 400, type: 'tool_started', group_type: 'tool', group_id: 'call_sca_a', parent_group_id: 'thread_sca', lifecycle: 'start', content: 'Searching sprint test cases', tool_name: 'search_test_cases', source: 'taa' },
  { tDelta: 900, type: 'tool_completed', group_type: 'tool', group_id: 'call_sca_a', parent_group_id: 'thread_sca', lifecycle: 'end', content: 'Searching sprint test cases', tool_name: 'search_test_cases', source: 'taa' },
  { tDelta: 200, type: 'sub_agent_started', group_type: 'sub_agent', group_id: 'sca_gap', parent_group_id: 'thread_sca', lifecycle: 'start', content: 'Gap Detection Agent started', label: 'Gap Detection Agent', source: 'caa' },
  { tDelta: 1100, type: 'sub_agent_completed', group_type: 'sub_agent', group_id: 'sca_gap', parent_group_id: 'thread_sca', lifecycle: 'end', content: 'Gap Detection Agent done', label: 'Gap Detection Agent', source: 'caa' },
  { tDelta: 300, type: 'analysis_saved', group_type: 'tool', group_id: 'call_sca_ana', parent_group_id: 'thread_sca', content: 'Saved analysis: gap_detection', tool_name: 'save_coverage_analysis', analysis_name: 'gap_detection', source: 'caa' },
  { tDelta: 400, type: 'visualization', content: 'Sprint coverage', group_type: 'session', group_id: 'thread_sca', parent_group_id: null, payload: { event_type: 'visualization', data: { viz_type: 'donut', title: 'Sprint coverage', subtitle: 'Sprint 42', data: { covered: 38, uncovered: 12 } } }, source: 'caa' },
  { tDelta: 350, type: 'scenario_saved', group_type: 'scenario', group_id: 'sca_scn_1', parent_group_id: 'thread_sca', lifecycle: 'start', content: 'Saved scenario: Guest checkout refund', scenario_id: 'sca_scn_1', title: 'Guest checkout refund', scenario: { id: 'sca_scn_1', title: 'Guest checkout refund', priority: 'P1', category: 'Error handling' }, source: 'taa' },
  { tDelta: 600, type: 'session_completed', content: 'Sprint coverage complete', group_type: 'session', group_id: 'thread_sca', parent_group_id: null, source: 'sca' },
]

// ---------------------------------------------------------------------------
// Failure scenario
// ---------------------------------------------------------------------------

const failEvents: AgentEvent[] = [
  { tDelta: 100, type: 'session_started', group_type: 'session', group_id: 'thread_fail', parent_group_id: null, lifecycle: 'start', content: 'Session started' },
  { tDelta: 300, type: 'tool_started', group_type: 'tool', group_id: 'call_fail', parent_group_id: 'thread_fail', lifecycle: 'start', content: 'Running search_test_cases', tool_name: 'search_test_cases', args_preview: { query: 'checkout' } },
  { tDelta: 800, type: 'progress', content: 'Connecting…', message: 'Connecting…' },
  { tDelta: 1200, type: 'tool_failed', group_type: 'tool', group_id: 'call_fail', parent_group_id: 'thread_fail', lifecycle: 'end', content: 'search_test_cases failed', tool_name: 'search_test_cases', error: 'Upstream timeout' },
  { tDelta: 400, type: 'error', group_type: 'session', group_id: 'thread_fail', parent_group_id: null, lifecycle: 'standalone', content: 'Something went wrong', traceback: 'Traceback (most recent call last): ...' },
  { tDelta: 500, type: 'session_failed', group_type: 'session', group_id: 'thread_fail', parent_group_id: null, lifecycle: 'end', content: 'Run failed', reason: 'graph_execution_error' },
]

// ---------------------------------------------------------------------------

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'taa-default',
    name: 'Author tests (TAA)',
    hint: 'S1 → S10 walk-through',
    events: taaEvents,
    pinnedPrompt: {
      text: 'Generate testcases for creating account using Google OAuth',
      context: [
        { kind: 'jira', label: 'Jira Requirements', count: 3 },
        { kind: 'figma', label: 'Figma', count: 2 },
      ],
    },
    rightBreadcrumb: ['Atto’s Home', 'Sprints', 'Sprint #42', 'Implement Stripe pay…'],
  },
  {
    id: 'caa-coverage',
    name: 'Coverage analysis (CAA)',
    hint: 'Gap finding + donut chart',
    events: caaEvents,
  },
  {
    id: 'tpa-v2-plan',
    name: 'Plan tests (TPA-v2)',
    hint: '3-worker fan-out + tiers',
    events: tpaV2Events,
  },
  {
    id: 'gate-question',
    name: 'Needs your input',
    hint: 'Pause for option-pick gate',
    events: gateEvents,
  },
  {
    id: 'sca-sprint',
    name: 'Sprint coverage (SCA)',
    hint: 'TAA + CAA, source-tagged',
    events: scaEvents,
  },
  {
    id: 'failure',
    name: 'Failure mode',
    hint: 'Tool failure + retry card',
    events: failEvents,
  },
]
