// Skill catalog — sourced from skills-of-agents.md. Each agent loads domain
// skills ("lenses") at runtime; a `skill_loaded` event names which one.

export interface Skill {
  name: string
  desc: string
}

export interface SkillGroup {
  /** Display name of the owning agent. */
  agent: string
  skills: Skill[]
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    agent: 'TAA — Test Authoring Agent',
    skills: [
      { name: 'generate-functional-scenarios', desc: 'Generate functional test scenarios in structured JSON' },
      { name: 'scenario-from-jira', desc: 'Turn Jira stories + acceptance criteria into scenarios' },
      { name: 'scenario-from-app-flow', desc: 'Turn discovered app flows (pages, forms, nav) into scenarios' },
      { name: 'scenario-from-api', desc: 'Turn API endpoints (OpenAPI/routes) into scenarios' },
      { name: 'scenario-from-requirements', desc: 'Turn PRD/BRD/spec docs into scenarios with traceability' },
      { name: 'scenario-from-figma', desc: 'Turn Figma frames + visual analysis into scenarios' },
      { name: 'scenario-from-linear', desc: 'Turn Linear issues into scenarios' },
      { name: 'scenario-from-clickup', desc: 'Turn ClickUp tasks/lists into scenarios' },
      { name: 'scenario-from-azure-devops', desc: 'Turn Azure DevOps work items into scenarios' },
      { name: 'scenario-from-document', desc: 'Generate scenarios from parsed PDF/DOCX/XLSX/PPTX' },
      { name: 'scenario-from-video', desc: 'Generate scenarios from analyzed app-usage video' },
      { name: 'dedup-batch', desc: 'Embed, search, classify & gap-fill to dedupe generated cases' },
      { name: 'synthesis-cross-reference', desc: 'Merge app/Jira/docs/API sources into one feature map' },
      { name: 'reuse-step-groups', desc: 'Find & reuse existing step groups to cut redundancy' },
      { name: 'test-data-suggestions', desc: 'Use existing test-data collections for data-driven params' },
      { name: 'evaluate-coverage', desc: 'Score coverage/quality/gaps to decide if generation is done' },
      { name: 'impact-analysis', desc: 'Find relationships to existing tests & impacted areas' },
      { name: 'intake-analysis', desc: 'Assess request completeness; clarify vs. proceed' },
      { name: 'review-and-refine', desc: 'Fix quality issues & gaps after validation' },
    ],
  },
  {
    agent: 'Planner — Test Planning Agent',
    skills: [
      { name: 'intake_analysis', desc: 'Parse input, extract features/actors, find ambiguities' },
      { name: 'discovery_strategy', desc: 'Generate diverse search queries to find existing tests' },
      { name: 'impact_analysis', desc: 'Interpret relationship traversal & indirect regression risk' },
      { name: 'failure_analysis', desc: 'Prioritize tests by regression risk from failure history' },
      { name: 'critical_path_analysis', desc: 'Identify critical journeys & deployment gates for P0' },
      { name: 'blast_radius', desc: 'Map change propagation; classify direct/indirect/transitive risk' },
      { name: 'merge_strategy', desc: 'Merge multi-dimensional scores with weights & tie-breaks' },
      { name: 'manual_vs_automation', desc: 'Classify cases as manual/automated/automatable' },
      { name: 'risk_assessment', desc: 'Score business/technical/instability risk into composite' },
      { name: 'priority_selection', desc: 'Filter cases by priority (P0–P3) with env rules' },
      { name: 'execution_estimation', desc: 'Estimate run time from history + parallel capacity' },
      { name: 'assignee_distribution', desc: 'Load-balance assignments across the QA team' },
      { name: 'scheduling_sequencing', desc: 'Order execution by priority, deps & fast feedback' },
      { name: 'regression_planning', desc: 'Broad-coverage regression strategy weighting indirect impact' },
      { name: 'smoke_planning', desc: 'Minimal P0 critical-path strategy, <30 min target' },
      { name: 'feature_planning', desc: 'Feature-focused strategy emphasizing new code paths' },
    ],
  },
  {
    agent: 'Coverage — Coverage Analysis Agent',
    skills: [
      { name: 'gap-detection', desc: 'Detect missing/incomplete/outdated coverage with severity' },
      { name: 'coverage-report', desc: 'Generate audience-tailored coverage reports' },
      { name: 'requirements-traceability', desc: 'Build requirements→test matrix; find uncovered reqs' },
      { name: 'coverage-trends', desc: 'Track coverage evolution across sprints/releases' },
      { name: 'impact-assessment', desc: 'Score business risk of coverage gaps & prioritize' },
      { name: 'suggestion-generation', desc: 'Propose new test cases (steps + expected) for gaps' },
      { name: 'feature-coverage', desc: 'Per-feature coverage metrics & module breakdown' },
      { name: 'sprint-coverage', desc: 'Sprint-level story status & readiness' },
      { name: 'api-coverage', desc: 'Untested endpoints & API integration gaps' },
      { name: 'regression-risk', desc: 'Flag areas at risk from low/declining coverage' },
    ],
  },
  {
    agent: 'Run Analyzer Agent',
    skills: [
      { name: 'failure-classification', desc: 'Classify failures (true/false-positive/flaky/env) with confidence' },
      { name: 'action-items', desc: 'Generate prioritized actions + bug-report drafts' },
      { name: 'bug-categorization', desc: 'Group bugs by component/root-cause/severity to find patterns' },
      { name: 'review-summary', desc: 'Aggregate saved analyses into one overview' },
      { name: 'reporting', desc: 'Audience-aware reports (exec/release/standup/PM)' },
      { name: 'trend-analysis', desc: 'Detect degrading/improving/flaky stability trends' },
      { name: 'compare-runs', desc: 'Diff two runs: new/fixed/recurring failures, pass-rate' },
      { name: 'release-readiness', desc: 'Go/no-go eval with risk scoring & thresholds' },
      { name: 'retest-planning', desc: 'Prioritized retest plan with assignments & estimates' },
      { name: 'sprint-health', desc: 'Sprint delivery status & story-level rollup' },
      { name: 'tester-analytics', desc: 'Tester workload, productivity & discovery rates' },
    ],
  },
]

/** Map a catalog agent code (COMMON, TAA, CAA, RAA, TPA v1/v2, SCA v2, PR-TAA) → its skill group. */
export function skillGroupForAgent(code: string): SkillGroup {
  if (code.startsWith('TPA')) return SKILL_GROUPS[1] // Planner
  if (code === 'CAA' || code.startsWith('SCA')) return SKILL_GROUPS[2] // Coverage
  if (code === 'RAA') return SKILL_GROUPS[3] // Run Analyzer
  return SKILL_GROUPS[0] // TAA (also COMMON / PR-TAA)
}

const ALL_SKILLS = new Map<string, string>()
for (const g of SKILL_GROUPS) for (const s of g.skills) ALL_SKILLS.set(s.name, s.desc)

/** Look up a skill's description by name (used to enrich `skill_loaded` steps). */
export function skillDescription(name: string | undefined): string | undefined {
  return name ? ALL_SKILLS.get(name) : undefined
}
