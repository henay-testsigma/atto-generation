# Skills Of Agents

## TAA — Test Authoring Agent (19)

| Skill | What it does |
| ----- | ----- |
| generate-functional-scenarios | Generate functional test scenarios in structured JSON |
| scenario-from-jira | Turn Jira stories + acceptance criteria into scenarios |
| scenario-from-app-flow | Turn discovered app flows (pages, forms, nav) into scenarios |
| scenario-from-api | Turn API endpoints (OpenAPI/routes) into scenarios |
| scenario-from-requirements | Turn PRD/BRD/spec docs into scenarios with traceability |
| scenario-from-figma | Turn Figma frames + visual analysis into scenarios |
| scenario-from-linear | Turn Linear issues into scenarios |
| scenario-from-clickup | Turn ClickUp tasks/lists into scenarios |
| scenario-from-azure-devops | Turn Azure DevOps work items into scenarios |
| scenario-from-document | Generate scenarios from parsed PDF/DOCX/XLSX/PPTX |
| scenario-from-video | Generate scenarios from analyzed app-usage video |
| dedup-batch | Embed, search, classify & gap-fill to dedupe generated cases |
| synthesis-cross-reference | Merge app/Jira/docs/API sources into one feature map |
| reuse-step-groups | Find & reuse existing step groups to cut redundancy |
| test-data-suggestions | Use existing test-data collections for data-driven params |
| evaluate-coverage | Score coverage/quality/gaps to decide if generation is done |
| impact-analysis | Find relationships to existing tests & impacted areas |
| intake-analysis | Assess request completeness; clarify vs. proceed |
| review-and-refine | Fix quality issues & gaps after validation |

## Planner — Test Planning Agent (16)

| Skill | What it does |
| ----- | ----- |
| intake_analysis | Parse input, extract features/actors, find ambiguities |
| discovery_strategy | Generate diverse search queries to find existing tests |
| impact_analysis | Interpret relationship traversal & indirect regression risk |
| failure_analysis | Prioritize tests by regression risk from failure history |
| critical_path_analysis | Identify critical journeys & deployment gates for P0 |
| blast_radius | Map change propagation; classify direct/indirect/transitive risk |
| merge_strategy | Merge multi-dimensional scores with weights & tie-breaks |
| manual_vs_automation | Classify cases as manual/automated/automatable |
| risk_assessment | Score business/technical/instability risk into composite |
| priority_selection | Filter cases by priority (P0–P3) with env rules |
| execution_estimation | Estimate run time from history + parallel capacity |
| assignee_distribution | Load-balance assignments across the QA team |
| scheduling_sequencing | Order execution by priority, deps & fast feedback |
| regression_planning | Broad-coverage regression strategy weighting indirect impact |
| smoke_planning | Minimal P0 critical-path strategy, <30 min target |
| feature_planning | Feature-focused strategy emphasizing new code paths |

## Coverage — Coverage Analysis Agent (10)

| Skill | What it does |
| ----- | ----- |
| gap-detection | Detect missing/incomplete/outdated coverage with severity |
| coverage-report | Generate audience-tailored coverage reports |
| requirements-traceability | Build requirements→test matrix; find uncovered reqs |
| coverage-trends | Track coverage evolution across sprints/releases |
| impact-assessment | Score business risk of coverage gaps & prioritize |
| suggestion-generation | Propose new test cases (steps + expected) for gaps |
| feature-coverage | Per-feature coverage metrics & module breakdown |
| sprint-coverage | Sprint-level story status & readiness |
| api-coverage | Untested endpoints & API integration gaps |
| regression-risk | Flag areas at risk from low/declining coverage |

## Run Analyzer Agent (11)

| Skill | What it does |
| ----- | ----- |
| failure-classification | Classify failures (true/false-positive/flaky/env) with confidence |
| action-items | Generate prioritized actions + bug-report drafts |
| bug-categorization | Group bugs by component/root-cause/severity to find patterns |
| review-summary | Aggregate saved analyses into one overview |
| reporting | Audience-aware reports (exec/release/standup/PM) |
| trend-analysis | Detect degrading/improving/flaky stability trends |
| compare-runs | Diff two runs: new/fixed/recurring failures, pass-rate |
| release-readiness | Go/no-go eval with risk scoring & thresholds |
| retest-planning | Prioritized retest plan with assignments & estimates |
| sprint-health | Sprint delivery status & story-level rollup |
| tester-analytics | Tester workload, productivity & discovery rates |
