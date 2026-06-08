import { useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react'
import { MotionConfig } from 'framer-motion'
import { AppShell } from './components/AppShell'
import { Composer, defaultChips } from './components/Composer'
import { DemoControls } from './components/DemoControls'
import { Breadcrumb } from './components/Breadcrumb'
import { AvatarRobot } from './components/AvatarRobot'
import { AttoAgentLottie } from './components/AttoAgentLottie'
import { MurmurLine } from './murmur/MurmurLine'
import { MurmurController, useMurmur } from './murmur/controller'
import { useEventEngine } from './events/engine'
import { routeEvent } from './events/router'
import type { AgentEvent, RenderIntent } from './events/types'
import { SCENARIOS } from './events/scenarios'
import { skillDescription } from './catalog/skills'
import { MilestoneGroupView, type MilestoneGroup } from './tiers/MilestoneSpine'
import { TestCaseTable, reconcileAcceptance, type TestCaseRow } from './tiers/TestCaseTable'
import { ScenarioReviewCard, type ScenarioSummary } from './tiers/ScenarioReviewCard'
import { PlanApprovalCard, type PlanItem } from './tiers/PlanApprovalCard'
import { ChatBubble } from './tiers/ChatBubble'
import { OutcomeCard } from './tiers/OutcomeCard'
import { DonutChart } from './tiers/Visualization'
import { FeedbackRow } from './tiers/FeedbackRow'
import { TwoPaneShell } from './layout/TwoPaneShell'
import type { TimelineItem } from './components/TimelineRail'
import {
  buildPlanApprovalGate,
  buildScenariosApprovalGate,
  type QuestionGate,
} from './tiers/InputGate'
import './styles.css'

// ---------------------------------------------------------------------------
// Reducer state — everything the UI binds to lives here.
// ---------------------------------------------------------------------------

interface UiState {
  /** running plan items, keyed by group_id. */
  plan: PlanItem[]
  /** plan settled? — drives the "Generation Plan" gate. */
  planShown: boolean
  planProceeded: boolean
  /** scenarios harvested from scenario_saved. */
  scenarios: ScenarioSummary[]
  scenariosProceeded: boolean
  /** test cases harvested from test_case_saved + reconcile. */
  testCases: TestCaseRow[]
  /** Ordered list of milestone phase-groups. Each is one collapsible group
   *  with a description + a vertical timeline of SETTLED steps. The active
   *  group accumulates steps; finished groups collapse (accordion). */
  groups: MilestoneGroup[]
  /** id of the group currently accumulating settled steps (null = none yet). */
  activeGroupId: string | null
  /** chat bubbles (welcome, assistant messages). */
  chat: { id: string; role: 'user' | 'assistant' | 'system'; text: string }[]
  /** active question gate (Pattern 2). null = none. */
  gate: QuestionGate | null
  /** Layout flag — flipped on scenarios-review Proceed. */
  twoPane: boolean
  /** Live "Generating Test Cases" % for S8 progress. */
  generating: { active: boolean; percent: number }
  /** Outcome card for visualization. */
  viz: { id: string; title: string; subtitle?: string; data: Record<string, number> } | null
  /** Run failed flag for failure scenario. */
  failed: { reason: string } | null
  /** Whole run finished — drives accordion "collapse all once complete". */
  runComplete: boolean
  /** Test-case validation/dedup in progress — drives the plan "validation" loader. */
  validating: boolean
  /** Chronological conversation log — chat bubbles + milestone groups interleaved
   *  in the order they appeared, so the thread reads as a real back-and-forth. */
  timeline: TimelineEntry[]
}

type TimelineEntry = { kind: 'chat'; id: string } | { kind: 'group'; id: string }

const INITIAL_STATE: UiState = {
  plan: [],
  planShown: false,
  planProceeded: false,
  scenarios: [],
  scenariosProceeded: false,
  testCases: [],
  groups: [],
  activeGroupId: null,
  chat: [],
  gate: null,
  twoPane: false,
  generating: { active: false, percent: 0 },
  viz: null,
  failed: null,
  runComplete: false,
  validating: false,
  timeline: [],
}

type Action =
  | { type: 'reset' }
  | { type: 'emit'; event: AgentEvent; nowMs: number }
  | { type: 'mark_plan_proceeded' }
  | { type: 'mark_scenarios_proceeded' }
  | { type: 'set_twopane'; v: boolean }
  | { type: 'tick_elapsed'; ms: number }
  | { type: 'set_gate'; gate: QuestionGate | null }
  | { type: 'reconcile_acceptance'; id: string; status: 'pending' | 'accepted' | 'rejected' }
  | { type: 'bulk_acceptance'; ids: string[]; status: 'accepted' | 'rejected' }

function reducer(state: UiState, action: Action): UiState {
  switch (action.type) {
    case 'reset':
      return INITIAL_STATE
    case 'mark_plan_proceeded':
      // The user's "Proceed" is logged as a chat bubble — no redundant pill.
      return {
        ...state,
        planProceeded: true,
        groups: patchGroup(state.groups, GID.plan, (g) => ({ ...g, settled: true })),
      }
    case 'mark_scenarios_proceeded':
      return {
        ...state,
        scenariosProceeded: true,
        groups: patchGroup(state.groups, GID.scn, (g) => ({ ...g, settled: true })),
      }
    case 'set_twopane':
      return { ...state, twoPane: action.v }
    case 'set_gate':
      return { ...state, gate: action.gate }
    case 'tick_elapsed':
      // Mirror the engine clock into whichever group is still running.
      if (!state.activeGroupId) return state
      return {
        ...state,
        groups: patchGroup(state.groups, state.activeGroupId, (g) =>
          g.settled ? g : { ...g, elapsedMs: action.ms },
        ),
      }
    case 'reconcile_acceptance':
      return {
        ...state,
        testCases: reconcileAcceptance(state.testCases, action.id, action.status),
      }
    case 'bulk_acceptance': {
      const set = new Set(action.ids)
      return {
        ...state,
        testCases: state.testCases.map((r) =>
          set.has(r.id) ? { ...r, acceptance_status: action.status } : r,
        ),
      }
    }
    case 'emit':
      return applyEmit(state, action.event, action.nowMs)
  }
}

// ---------------------------------------------------------------------------
// Milestone-group helpers — every phase is one collapsible group whose
// timeline accumulates SETTLED steps. Running work lives on the Murmur line.
// ---------------------------------------------------------------------------

const GID = { plan: 'g_plan', scn: 'g_scn', tc: 'g_tc', main: 'g_main' } as const

const GROUP_META: Record<string, { active: string; done: string; desc: string }> = {
  [GID.plan]: {
    active: 'Orchestrating a Generation Plan',
    done: 'Orchestrated a Generation Plan',
    desc: 'Analyzed the prompt and context, checked the test library, and built a plan.',
  },
  [GID.scn]: {
    active: 'Generating test scenarios',
    done: 'Generated test scenarios',
    desc: 'Explored the flow and drafted scenarios across happy paths, errors, and edge cases.',
  },
  [GID.tc]: {
    active: 'Generating test cases',
    done: 'Generated test cases',
    desc: 'Authored and validated detailed test cases for every scenario.',
  },
}

function patchGroup(
  groups: MilestoneGroup[],
  id: string,
  fn: (g: MilestoneGroup) => MilestoneGroup,
): MilestoneGroup[] {
  return groups.map((g) => (g.id === id ? fn(g) : g))
}

function inTimeline(state: UiState, kind: 'chat' | 'group', id: string): boolean {
  return state.timeline.some((t) => t.kind === kind && t.id === id)
}

/** Append a chat bubble to both the chat list and the chronological timeline. */
function addChat(
  state: UiState,
  role: 'user' | 'assistant' | 'system',
  text: string,
  nowMs: number,
): UiState {
  const id = `chat-${state.chat.length}-${Math.round(nowMs)}`
  return {
    ...state,
    chat: [...state.chat, { id, role, text }],
    timeline: [...state.timeline, { kind: 'chat', id }],
  }
}

/** Ensure a group exists and make it the active (step-accumulating) one. */
function ensureGroup(state: UiState, id: string, nowMs: number): UiState {
  if (state.groups.some((g) => g.id === id)) {
    return { ...state, activeGroupId: id }
  }
  const meta = GROUP_META[id]
  const group: MilestoneGroup = {
    id,
    title: meta?.active ?? 'Working',
    description: meta?.desc,
    elapsedMs: nowMs,
    items: [],
    settled: false,
  }
  // Phase groups (scenarios/test cases) appear in the timeline as soon as they
  // open; the first group waits until it has a settled step (handled in addStep)
  // so the opening murmur reads cleanly.
  const showNow = id !== GID.plan && id !== GID.main
  return {
    ...state,
    groups: [...state.groups, group],
    activeGroupId: id,
    timeline: showNow && !inTimeline(state, 'group', id)
      ? [...state.timeline, { kind: 'group', id }]
      : state.timeline,
  }
}

/** Append a settled timeline step to the active group (creating one if none). */
function addStep(state: UiState, item: TimelineItem): UiState {
  let s = state
  if (!s.activeGroupId) s = ensureGroup(s, GID.main, 0)
  const gid = s.activeGroupId as string
  return {
    ...s,
    groups: patchGroup(s.groups, gid, (g) => ({ ...g, items: upsertItem(g.items, item) })),
    timeline: inTimeline(s, 'group', gid) ? s.timeline : [...s.timeline, { kind: 'group', id: gid }],
  }
}

/** Map a phase_started/phase_completed event to its milestone-group id. */
function phaseGroupId(e: AgentEvent): string {
  const gid = e.group_id as string | undefined
  if (gid === 'ph_scn') return GID.scn
  if (gid === 'ph_tc') return GID.tc
  const c = ((e.content as string) ?? '').toLowerCase()
  if (c.includes('scenario')) return GID.scn
  if (c.includes('test case')) return GID.tc
  return GID.plan
}

// The reducer dispatches off `routeEvent(e)` — the SAME pure classifier that
// feeds the murmur line and drives the /catalog. The tier is decided in ONE
// place (the router); this function only owns the per-type STATE mutation under
// the correct tier. Two carve-outs come before routing:
//   • engine control events (__pause__/__layout__) are not wire events;
//   • a few SUPPRESS_TYPES are display-hidden yet stateful (they seed the table
//     or close the gate), so they must run before the `suppress → no-op` gate.
function applyEmit(state: UiState, e: AgentEvent, nowMs: number): UiState {
  const t = e.type

  // (a) Synthetic engine control events — bypass the wire router entirely.
  if (t === '__pause__') return state // engine pauses externally
  if (t === '__layout__') {
    return e.__layout__ === 'two-pane' ? { ...state, twoPane: true } : state
  }

  // (b) Display-suppressed but STATEFUL events (handled before the suppress gate).
  // The agent returns ALL case names together; the table seeds every row in a
  // "generating" (loader) state. Each `test_case_saved` then settles one row.
  if (t === 'test_cases_planned') {
    const names = (e.test_cases as Record<string, unknown>[] | undefined) ?? []
    const rows: TestCaseRow[] = names.map((n) => ({
      id: (n.id as string) ?? (n.test_case_id as string),
      human_id: (n.human_id as string) ?? undefined,
      title: (n.title as string) ?? 'Test case',
      scenarioId: (n.scenario_id as string) ?? 'unknown',
      scenarioTitle: (n.scenarioTitle as string) ?? (n.scenario_title as string) ?? 'Scenario',
      is_update: Boolean(n.is_update),
      template_type: (n.template_type as string) ?? undefined,
      module: (n.module as string) ?? undefined,
      test_type: (n.test_type as string) ?? undefined,
      acceptance_status: 'pending',
      generating: true,
    }))
    // Only seed rows we don't already have.
    const existing = new Set(state.testCases.map((r) => r.id))
    return { ...state, testCases: [...state.testCases, ...rows.filter((r) => !existing.has(r.id))] }
  }
  if (t === 'question_answered') {
    // Ack only — the user's pick already shows as a bubble; just close the gate.
    return { ...state, gate: null }
  }

  // (c) Single tier authority: the router decides which lane this belongs to.
  const intent = routeEvent(e)
  switch (intent.tier) {
    case 'suppress':
      return state
    case 'chat':
      return applyChatEmit(state, intent, nowMs)
    case 'murmur':
      return applyMurmurEmit(state, e)
    case 'milestone':
      return applyMilestoneEmit(state, e, nowMs)
    case 'outcome':
      return applyOutcomeEmit(state, e, nowMs)
    default:
      return state
  }
}

// --- CHAT tier: conversation bubbles. Role/text come straight from the router. ---
function applyChatEmit(state: UiState, intent: RenderIntent, nowMs: number): UiState {
  const role = intent.chat?.role ?? 'assistant'
  const text = intent.chat?.text ?? ''
  return addChat(state, role, text, nowMs)
}

// --- MURMUR tier: almost all murmur events are display-only (no state). The two
//     exceptions mutate the plan list / progress meter. Everything else (tool_started,
//     sub_agent_progress, reasoning, phase, ticks, …) is a no-op here. ---
function applyMurmurEmit(state: UiState, e: AgentEvent): UiState {
  const t = e.type
  if (t === 'plan_appended') {
    const more = (e.items as PlanItem[]) ?? []
    return { ...state, plan: [...state.plan, ...more] }
  }
  // GENERATING TEST CASES progress meter (right panel, S8).
  if (t === 'progress' && state.generating.active && typeof e.percentage === 'number') {
    return { ...state, generating: { active: true, percent: e.percentage as number } }
  }
  return state
}

// --- MILESTONE tier: structural group open/settle + settled step rows. Running
//     work (tool_started/sub_agent_started, routed to murmur) never lands here;
//     in-progress milestone markers stay no-ops (work settles on completion). ---
function applyMilestoneEmit(state: UiState, e: AgentEvent, nowMs: number): UiState {
  const t = e.type

  // SESSION lifecycle: open the planning group up-front.
  if (t === 'session_started') {
    return ensureGroup(state, GID.plan, nowMs)
  }
  // PHASE boundaries open / settle a milestone group.
  if (t === 'phase_started') {
    const gid = phaseGroupId(e)
    let next = ensureGroup(state, gid, nowMs)
    if (gid === GID.tc) next = { ...next, generating: { active: true, percent: 0 } }
    return next
  }
  if (t === 'phase_completed') {
    const gid = phaseGroupId(e)
    let next = state
    if (gid === GID.tc) next = { ...next, generating: { active: false, percent: 100 } }
    const meta = GROUP_META[gid]
    const doneTitle =
      gid === GID.scn
        ? `Generated ${next.scenarios.length} test scenarios`
        : gid === GID.tc
          ? `Generated ${next.testCases.length} test cases`
          : (meta?.done ?? undefined)
    return {
      ...next,
      groups: patchGroup(next.groups, gid, (g) => ({
        ...g,
        settled: true,
        title: doneTitle ?? g.title,
      })),
    }
  }
  // PLAN building (settles the planning group with a terminal Done).
  if (t === 'plan_started' || t === 'plan_created') {
    const items = (e.items as PlanItem[]) ?? []
    let next = ensureGroup(state, GID.plan, nowMs)
    next = {
      ...next,
      plan: items,
      planShown: true,
      groups: patchGroup(next.groups, GID.plan, (g) => ({
        ...g,
        title: GROUP_META[GID.plan].done,
        settled: true,
        items: upsertItem(g.items, { id: 'g_plan-done', title: 'Done', status: 'done', icon: 'check' }),
      })),
    }
    return next
  }
  if (t === 'plan_completed') {
    return state
  }
  if (t === 'validation_started') {
    // The test-case validation/dedup pass drives the plan "validation" loader.
    return state.scenariosProceeded ? { ...state, validating: true } : state
  }
  if (t === 'tool_completed' || t === 'tool_complete') {
    const id = (e.group_id as string) ?? `tool-${nowMs}`
    const desc = TOOL_DESCRIPTIONS[(e.tool_name as string) ?? ''] ?? undefined
    const icon = TOOL_ICONS[(e.tool_name as string) ?? ''] ?? 'sparkles'
    return addStep(state, { id, title: (e.content as string) ?? 'Done', description: desc, status: 'done', icon })
  }
  if (t === 'sub_agent_completed') {
    const id = (e.group_id as string) ?? `sa-${nowMs}`
    const title = (e.summary as string) ?? (e.content as string) ?? `${(e.label as string) ?? 'Sub agent'} done`
    return addStep(state, { id: `${id}-done`, title, status: 'done', icon: 'sparkles' })
  }
  if (t === 'sub_agent_signals') {
    const id = `${(e.group_id as string) ?? 'sa'}-sig`
    const n = Array.isArray(e.signals) ? (e.signals as unknown[]).length : undefined
    return addStep(state, { id, title: (e.content as string) ?? (n ? `${n} findings` : 'Findings'), status: 'done', icon: 'checks' })
  }
  if (t === 'skill_loaded') {
    const skill = e.skill_name as string | undefined
    return addStep(state, {
      id: (e.group_id as string) ?? `skill-${nowMs}`,
      title: (e.content as string) ?? (skill ? `Loaded skill: ${skill}` : 'Loaded skill'),
      // TAA sends only skill_name on the wire — enrich the step with the
      // skill's purpose from the catalog so the milestone reads clearly.
      description: (e.skill_description as string) ?? skillDescription(skill),
      status: 'done',
      icon: 'skill',
    })
  }
  // Validation settles as a calm step. A failure is recoverable (the agent
  // re-authors the offending cases) → an error-styled step + the per-scenario
  // "N re-authored" badge on the table, NOT a persistent Outcome card.
  if (t === 'validation_completed' || t === 'validation_result') {
    const failed = e.final_pass === false || e.status === 'fail'
    const reauthIds = (e.reauthored_ids as string[]) ?? undefined
    const reauthored = (e.reauthored as number) ?? reauthIds?.length
    const title =
      (e.summary as string) ??
      (e.content as string) ??
      (failed
        ? reauthored
          ? `Re-authored ${reauthored} case${reauthored === 1 ? '' : 's'} after validation`
          : 'Validation found issues'
        : 'Validated — all passed')
    // Badge the self-correction whenever cases were re-authored — on a hard fail
    // OR a recovered pass (the agent fixed overlaps and the batch then passed).
    const next =
      reauthIds && reauthIds.length
        ? markRevalidated(state, reauthIds)
        : failed
          ? markRevalidated(state, undefined)
          : state
    return addStep({ ...next, validating: false }, {
      id: (e.group_id as string) ?? `val-${nowMs}`,
      title,
      status: failed ? 'error' : 'done',
      icon: 'shield',
    })
  }
  if (t === 'tool_failed' || t === 'sub_agent_failed' || t === 'sub_agent_error') {
    return addStep(state, {
      id: (e.group_id as string) ?? `fail-${nowMs}`,
      title: (e.content as string) ?? 'Step failed',
      status: 'error',
      icon: 'sparkles',
    })
  }
  if (t === 'session_failed') {
    return { ...state, failed: { reason: (e.reason as string) ?? 'failed' }, runComplete: true }
  }
  if (t === 'error') {
    return addStep(state, {
      id: `err-${nowMs}`,
      title: (e.content as string) ?? 'Error',
      status: 'error',
      icon: 'sparkles',
    })
  }
  // Other milestone markers (sub_agent_started, signal_worker_*, tms_backfill_*,
  // scoring_completed, agent_done, …) carry no state mutation — work settles on
  // completion, so they are intentional no-ops.
  return state
}

// --- OUTCOME tier: persistent artifacts, charts, gates, and the session close. ---
function applyOutcomeEmit(state: UiState, e: AgentEvent, nowMs: number): UiState {
  const t = e.type

  // SCENARIOS list grows.
  if (t === 'scenario_saved') {
    const sc = e.scenario as ScenarioSummary | undefined
    const id = (e.scenario_id as string) ?? sc?.id ?? `scn-${nowMs}`
    const title = (sc?.title as string) ?? (e.title as string) ?? 'Scenario'
    const category = sc?.category ?? (e.category as string)
    const priority = sc?.priority ?? (e.priority as string)
    if (state.scenarios.some((s) => s.id === id)) return state
    return {
      ...state,
      scenarios: [...state.scenarios, { id, title, category, priority }],
    }
  }
  if (t === 'scenario_deleted') {
    const id = (e.scenario_id as string) ?? ''
    return {
      ...state,
      scenarios: state.scenarios.filter((s) => s.id !== id),
    }
  }

  // TEST CASES: settle a planned row (or append a back-compat row).
  if (t === 'test_case_saved') {
    const tc = (e.test_case as Record<string, unknown> | undefined) ?? {}
    const id = (e.test_case_id as string) ?? (tc.id as string)
    const patch = {
      priority: (tc.priority as string) ?? undefined,
      template_type: (tc.template_type as string) ?? undefined,
      module: (tc.module as string) ?? undefined,
      test_type: (tc.test_type as string) ?? undefined,
      generating: false,
    }
    // Flip an already-planned row to its authored state.
    if (state.testCases.some((r) => r.id === id)) {
      return {
        ...state,
        testCases: state.testCases.map((r) =>
          r.id === id
            ? { ...r, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) }
            : r,
        ),
      }
    }
    // Back-compat: a case that arrives without a prior plan entry.
    const row: TestCaseRow = {
      id,
      human_id: (e.human_id as string) ?? undefined,
      title: (e.title as string) ?? 'Test case',
      scenarioId: (e.scenario_id as string) ?? (e.parent_group_id as string) ?? 'unknown',
      scenarioTitle: (e.scenarioTitle as string) ?? (e.scenario_title as string) ?? 'Scenario',
      is_update: Boolean(e.is_update),
      priority: (tc.priority as string) ?? undefined,
      template_type: (tc.template_type as string) ?? undefined,
      module: (tc.module as string) ?? undefined,
      test_type: (tc.test_type as string) ?? undefined,
      acceptance_status: ((tc.acceptance_status as string) ?? 'pending') as TestCaseRow['acceptance_status'],
    }
    return { ...state, testCases: [...state.testCases, row] }
  }
  if (t === 'test_case_updated') {
    const id = (e.test_case_id as string) ?? ''
    return {
      ...state,
      testCases: state.testCases.map((r) => (r.id === id ? { ...r, ...(e.test_case as Partial<TestCaseRow>) } : r)),
    }
  }
  if (t === 'acceptance_status_updated') {
    return {
      ...state,
      testCases: reconcileAcceptance(
        state.testCases,
        (e.test_case_id as string) ?? '',
        (e.status as 'pending' | 'accepted' | 'rejected') ?? 'pending',
      ),
    }
  }

  // VISUALIZATION (donut) — direct or wrapped in the generic `event` envelope.
  if (t === 'visualization' || (t === 'event' && (e.event_type as string) === 'visualization')) {
    const data = (e.data as Record<string, number> | undefined) ?? {}
    return {
      ...state,
      viz: {
        id: `viz-${nowMs}`,
        title: (e.title as string) ?? 'Coverage',
        subtitle: (e.subtitle as string) ?? undefined,
        data,
      },
    }
  }

  // QUESTION gate (Pattern 2). The question stays in the transcript as an agent
  // message; the answer options render in the composer; the user's pick logs as
  // a right-aligned bubble.
  if (t === 'question_asked' || t === 'question') {
    const question = (e.question as string) ?? (e.content as string) ?? 'Choose one'
    const options = (e.options as { id: string; label: string }[]) ?? []
    const gate: QuestionGate = {
      id: (e.group_id as string) ?? `q-${nowMs}`,
      question,
      options,
    }
    // Log the question AND its options in the transcript as an audit trail.
    const optionsLog = options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')
    const msg = options.length ? `${question}\n${optionsLog}` : question
    return { ...addChat(state, 'assistant', msg, nowMs), gate }
  }

  // SESSION close — settle the final group, collapse all, mark complete.
  if (t === 'session_completed' || t === 'session_complete' || t === 'summary_generated') {
    const gid = state.activeGroupId ?? GID.tc
    const finalTitle =
      gid === GID.tc && state.testCases.length > 0
        ? `Generated ${state.testCases.length} test cases`
        : undefined
    const groups = state.groups.map((g) => ({
      ...g,
      settled: true,
      ...(g.id === gid ? { isFinal: true, title: finalTitle ?? g.title } : {}),
    }))
    return {
      ...state,
      generating: { active: false, percent: 100 },
      runComplete: true,
      validating: false,
      groups,
    }
  }

  // Other outcome events with no dedicated handler (analysis_saved,
  // plan_result_saved, result, phase_review, event/gap_detected) are no-ops —
  // their artifacts are not surfaced in this prototype's scenarios.
  return state
}

/** Mark the given test-case ids (or all currently-generating rows when ids are
 *  unknown) as re-authored after a validation failure, so the table can badge
 *  the self-correction per scenario. */
function markRevalidated(state: UiState, ids?: string[]): UiState {
  if (!state.testCases.length) return state
  const set = ids && ids.length ? new Set(ids) : null
  return {
    ...state,
    testCases: state.testCases.map((r) =>
      set ? (set.has(r.id) || set.has(r.human_id ?? '') ? { ...r, revalidated: true } : r) : { ...r, revalidated: true },
    ),
  }
}

function upsertItem(items: TimelineItem[], next: TimelineItem): TimelineItem[] {
  if (items.some((i) => i.id === next.id)) {
    return items.map((i) => (i.id === next.id ? { ...i, ...next } : i))
  }
  return [...items, next]
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  analyze_prompt: "Atto's parsed the user's prompt and any attached context, like Jira tickets or Figma designs.",
  search_test_cases: "Identifying existing test cases and prior runs that relate to the new request.",
  requirements_to_cover: "Mapping out happy paths, error scenarios, and edge cases that must be covered.",
  build_plan: "Synthesizing the final ordered plan of test scenarios and detailed cases to author.",
  survey_env: 'Comparing available environments and their readiness.',
}
const TOOL_ICONS: Record<string, string> = {
  analyze_prompt: 'search',
  search_test_cases: 'book',
  requirements_to_cover: 'checks',
  build_plan: 'sparkles',
  survey_env: 'shield',
}

// ---------------------------------------------------------------------------
// PrototypeApp — top-level
// ---------------------------------------------------------------------------

export function PrototypeApp() {
  const [scenarioId, setScenarioId] = useState<string>('taa-default')
  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  )

  const [submitted, setSubmitted] = useState(false)
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [murmurExpanded, setMurmurExpanded] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  // Murmur controller (lives across scenario changes)
  const announceRef = useRef<HTMLDivElement>(null)
  const ctrl = useMemo(
    () =>
      new MurmurController({
        announce: (text) => {
          if (announceRef.current) announceRef.current.textContent = text
        },
      }),
    [],
  )
  useEffect(() => {
    ctrl.start()
    return () => ctrl.stop()
  }, [ctrl])
  const murmurSnap = useMurmur(ctrl)

  // Event sink → dispatch + murmur ingest. The engine is responsible for
  // pausing on the synthetic '__pause__' events.
  const handleEmit = useCallback(
    (e: AgentEvent) => {
      // Sync pause handling: when we hit a __pause__ event, pause the engine —
      // UNLESS its gate has already been answered (the user may have clicked
      // Proceed while the stream was still playing toward the pause). Pausing
      // then would strand the run with no gate left to resume it.
      if (e.type === '__pause__') {
        const kind = e.__pause__ as string | undefined
        const s = stateRef.current
        if (kind === 'plan_approval' && s.planProceeded) return
        if (kind === 'scenarios_review' && s.scenariosProceeded) return
        enginePauseRef.current?.()
        return
      }
      // Settle murmur when a tool closes.
      if (e.type === 'tool_completed' || e.type === 'tool_complete' || e.type === 'tool_failed') {
        ctrl.closeToolOpen(e.group_id as string | undefined)
      }
      if (e.type === 'signal_worker_completed' || e.type === 'signal_worker_failed') {
        ctrl.closeFanOut(e.signal as string | undefined)
      }
      const intent = routeEvent(e)
      if (intent.tier === 'murmur') {
        ctrl.ingest(intent, e.group_id as string | undefined)
      }
      dispatch({ type: 'emit', event: e, nowMs: performance.now() })
    },
    [ctrl],
  )

  // Engine
  const enginePauseRef = useRef<(() => void) | null>(null)
  const { state: runState, speed, setSpeed, cursor, elapsedMs, play, pause, restart, step } =
    useEventEngine(submitted ? scenario.events : null, handleEmit)
  enginePauseRef.current = pause

  // Mirror engine elapsed into whichever phase group is still running.
  useEffect(() => {
    dispatch({ type: 'tick_elapsed', ms: elapsedMs })
  }, [elapsedMs])

  // The Murmur line is live ONLY while the engine is actively playing. The
  // moment the run pauses (a gate), completes, or idles, clear it — so a gate
  // never sits beneath a stranded, decaying status line.
  useEffect(() => {
    if (runState !== 'playing') ctrl.clear()
  }, [runState, ctrl])

  // Reset & rerun when scenario changes
  useEffect(() => {
    ctrl.reset()
    dispatch({ type: 'reset' })
    setSubmitted(false)
    setMurmurExpanded(false)
    restart()
  }, [scenarioId, ctrl, restart])

  // Hero-state submit ⇒ pin user prompt + start engine
  const onHeroSubmit = (text: string) => {
    setSubmitted(true)
    // give React a beat to mount the thread, then play
    requestAnimationFrame(() => play())
    // mirror text into scenario.pinnedPrompt if user typed something custom
    if (text && scenario.pinnedPrompt) scenario.pinnedPrompt.text = text
  }

  // Derive the effective gate. Explicit question gates (from question_asked)
  // win; otherwise we synthesize a Proceed/Modify gate for the plan and
  // scenarios approval moments so every human-in-the-loop pause uses the same
  // list-style picker above the composer.
  const scnSettled = !!state.groups.find((g) => g.id === GID.scn)?.settled
  const effectiveGate: QuestionGate | null = useMemo(() => {
    if (state.gate) return state.gate
    // Scenarios gate only after the scenario PHASE has completed (settled),
    // not while scenarios are still streaming in.
    if (state.scenarios.length > 0 && !state.scenariosProceeded && scnSettled) {
      return buildScenariosApprovalGate(state.scenarios.length)
    }
    if (state.planShown && !state.planProceeded) {
      return buildPlanApprovalGate()
    }
    return null
  }, [
    state.gate,
    state.scenarios.length,
    state.scenariosProceeded,
    scnSettled,
    state.planShown,
    state.planProceeded,
  ])

  const composerState =
    effectiveGate
      ? 'gate'
      : runState === 'playing' || runState === 'paused'
        ? 'generating'
        : 'idle'

  // Auto-resume the engine when a gate is answered or a card is proceeded
  const resume = useCallback(() => {
    if (runState === 'paused') play()
  }, [runState, play])

  // Unified gate-answer handler. Routes by id prefix:
  //   plan:proceed       → mark plan proceeded + resume engine
  //   plan:modify        → emit user_message chat bubble (gate stays open)
  //   scenarios:proceed  → mark scenarios proceeded + resume engine
  //   scenarios:modify   → emit user_message chat bubble (gate stays open)
  //   *                  → explicit question_answered (resume engine)
  const handleGateAnswer = useCallback(
    (id: string, freeText?: string) => {
      // Log EVERY answer the user gives as a chat bubble (the conversation
      // transcript). Use the typed text, else the chosen option's label.
      const text =
        freeText ??
        effectiveGate?.options.find((o) => o.id === id)?.label ??
        id
      dispatch({
        type: 'emit',
        event: { type: 'user_message', content: text, source: 'taa' },
        nowMs: performance.now(),
      })

      if (id === 'plan:proceed') {
        dispatch({ type: 'mark_plan_proceeded' })
        resume()
        return
      }
      if (id === 'scenarios:proceed') {
        dispatch({ type: 'mark_scenarios_proceeded' })
        resume()
        return
      }
      if (id === 'plan:modify' || id === 'scenarios:modify') {
        // The bubble above already logged the reply; gate stays open.
        return
      }
      // Explicit question gate from question_asked
      handleEmit({
        type: 'question_answered',
        group_type: 'question',
        group_id: state.gate?.id,
        parent_group_id: 'thread_8d2c',
        lifecycle: 'end',
        content: `Answered: ${freeText ?? id}`,
        answer: freeText ?? id,
      })
      resume()
    },
    [handleEmit, resume, state.gate, effectiveGate],
  )

  return (
    <MotionConfig reducedMotion="user">
    <AppShell gradientActive={runState === 'playing'}>
      <a ref={announceRef as never} className="proto-sr-only" aria-live="polite" />

      {/* Demo harness lives in a floating, tucked-away control so the prototype
          reads like a real product by default. */}
      <DemoControls
        scenarios={SCENARIOS}
        active={scenarioId}
        onChange={(id) => setScenarioId(id)}
        runState={runState}
        speed={speed}
        setSpeed={setSpeed}
        onPlay={play}
        onPause={pause}
        onRestart={() => {
          ctrl.reset()
          dispatch({ type: 'reset' })
          setSubmitted(false)
          restart()
        }}
        onStep={step}
        elapsedMs={elapsedMs}
        cursor={cursor}
        total={scenario.events.length}
      />

      {!submitted ? (
        <HeroState onSubmit={onHeroSubmit} />
      ) : (
        <TwoPaneShell
          twoPane={state.twoPane}
          left={
            <ThreadView
              scenario={scenario}
              state={state}
              murmurSnap={murmurSnap}
              murmurExpanded={murmurExpanded}
              setMurmurExpanded={setMurmurExpanded}
              elapsedMs={elapsedMs}
              composerState={composerState}
              effectiveGate={effectiveGate}
              onAnswer={handleGateAnswer}
              onComposerSubmit={(text) => {
                // user replies during chat or between phases — treat as chat
                dispatch({
                  type: 'emit',
                  event: { type: 'user_message', content: text },
                  nowMs: performance.now(),
                })
              }}
              onStop={() => pause()}
              onAccept={(ids) => dispatch({ type: 'bulk_acceptance', ids, status: 'accepted' })}
              onReject={(ids) => dispatch({ type: 'bulk_acceptance', ids, status: 'rejected' })}
              twoPane={state.twoPane}
            />
          }
          right={
            <RightWorkPanel
              scenario={scenario}
              state={state}
              onAccept={(ids) => dispatch({ type: 'bulk_acceptance', ids, status: 'accepted' })}
              onReject={(ids) => dispatch({ type: 'bulk_acceptance', ids, status: 'rejected' })}
            />
          }
        />
      )}
    </AppShell>
    </MotionConfig>
  )
}

// ---------------------------------------------------------------------------
// Hero state (S1)
// ---------------------------------------------------------------------------

function HeroState({ onSubmit }: { onSubmit: (text: string) => void }) {
  return (
    <div className="proto-hero">
      <div className="proto-hero-avatar">
        <AttoAgentLottie size={120} />
      </div>
      <h1 className="proto-hero-title">What would you like to test?</h1>
      <p className="proto-hero-sub">
        Atto's Generator Agent will create comprehensive test cases from your testing goal, and{' '}
        <strong>additional context</strong> from <strong>requirements</strong>,{' '}
        <strong>Figma designs</strong>, or other files.
      </p>
      <div className="proto-hero-composer">
        <Composer
          state="idle"
          variant="hero"
          contextChips={defaultChips.slice(0, 3)}
          selectedChips={[
            { kind: 'jira', label: 'Jira Requirements', count: 3 },
            { kind: 'figma', label: 'Figma', count: 2 },
          ]}
          initialValue="Generate testcases for creating account using Google OAuth"
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Thread view (left rail when twoPane, full column otherwise)
// ---------------------------------------------------------------------------

function ThreadView({
  scenario,
  state,
  murmurSnap,
  murmurExpanded,
  setMurmurExpanded,
  elapsedMs,
  composerState,
  effectiveGate,
  onAnswer,
  onComposerSubmit,
  onStop,
  twoPane,
}: {
  scenario: ReturnType<typeof useScenario>
  state: UiState
  murmurSnap: ReturnType<typeof useMurmur>
  murmurExpanded: boolean
  setMurmurExpanded: React.Dispatch<React.SetStateAction<boolean>>
  elapsedMs: number
  composerState: 'idle' | 'generating' | 'gate'
  effectiveGate: QuestionGate | null
  onAnswer: (id: string, freeText?: string) => void
  onComposerSubmit: (text: string) => void
  onStop: () => void
  onAccept?: (ids: string[]) => void
  onReject?: (ids: string[]) => void
  twoPane: boolean
}) {
  // Per-group expand overrides (user toggles win over the accordion default).
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  // Accordion: the most-recent group in the timeline is expanded; finished
  // groups collapse; all collapse on completion.
  const groupOrder = state.timeline.filter((t) => t.kind === 'group').map((t) => t.id)
  const lastGroupId = groupOrder[groupOrder.length - 1]
  const isExpanded = (g: MilestoneGroup) =>
    overrides[g.id] ?? (g.id === lastGroupId && !state.runComplete)
  const toggleGroup = (id: string) =>
    setOverrides((m) => ({ ...m, [id]: !(m[id] ?? (id === lastGroupId && !state.runComplete)) }))

  // Keep the newest streamed content in view as the run progresses.
  const streamRef = useRef<HTMLDivElement>(null)
  const settledSteps = state.groups.reduce((n, g) => n + g.items.length, 0)
  const scrollKey =
    state.timeline.length +
    state.scenarios.length +
    state.testCases.length +
    settledSteps +
    (state.planShown ? 1 : 0) +
    (state.scenariosProceeded ? 1 : 0) +
    (state.runComplete ? 1 : 0)
  useEffect(() => {
    const el = streamRef.current
    if (!el) return
    const toBottom = () => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    toBottom()
    // When a gate opens, the composer expands beneath the stream; re-scroll once
    // it settles so the input card (plan / scenarios / question) ends up fully
    // visible just above the composer.
    const t1 = setTimeout(toBottom, 200)
    const t2 = setTimeout(toBottom, 420)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [scrollKey, effectiveGate?.id])

  const scnSettled = !!state.groups.find((g) => g.id === GID.scn)?.settled
  // The accepted Generation Plan stays pinned under the (collapsed) planning
  // group throughout generation, so the user always sees what they approved.
  const showPlanCard = state.planShown
  // Per-step status for the plan card's loader (which phase is running now).
  const planStatuses: Record<string, 'pending' | 'active' | 'done'> = {
    discovery: state.planShown ? 'done' : 'pending',
    scoring: scnSettled ? 'done' : state.planProceeded ? 'active' : 'pending',
    authoring:
      state.runComplete || state.validating
        ? 'done'
        : state.scenariosProceeded && state.generating.active
          ? 'active'
          : 'pending',
    validation: state.runComplete ? 'done' : state.validating ? 'active' : 'pending',
  }
  // The scenarios card persists once generated, collapsing after approval (and
  // in the narrow rail) so it stays in the session without dominating it.
  const showScenarioCard = state.scenarios.length > 0 && scnSettled

  return (
    <div className={`proto-thread ${twoPane ? 'is-rail' : 'is-full'}`}>
      <div className="proto-thread-stream" ref={streamRef}>
        {/* Pinned user prompt — top-right in single column, top-left in rail */}
        {scenario.pinnedPrompt && (
          <div className="proto-pinned-prompt">
            <ChatBubble
              role="user"
              text={scenario.pinnedPrompt.text}
              context={scenario.pinnedPrompt.context}
            />
          </div>
        )}

        {/* Chronological conversation: agent messages + user replies + milestone
            groups (with their cards) interleaved in the order they happened, so
            the thread reads as a real back-and-forth. */}
        {state.timeline.map((entry) => {
          if (entry.kind === 'chat') {
            const c = state.chat.find((x) => x.id === entry.id)
            if (!c) return null
            return <ChatBubble key={entry.id} role={c.role} text={c.text} />
          }
          const g = state.groups.find((x) => x.id === entry.id)
          if (!g) return null
          return (
            <div key={g.id}>
              <MilestoneGroupView
                group={g}
                expanded={isExpanded(g)}
                onToggle={() => toggleGroup(g.id)}
                trailing={g.isFinal && state.runComplete ? <FeedbackRow /> : undefined}
              />
              {/* Plan card sits directly under the planning group. Collapses in
                  the narrow rail to keep the session tidy. */}
              {g.id === GID.plan && showPlanCard && (
                <div className="proto-plan-bubble">
                  <PlanApprovalCard
                    items={state.plan}
                    statuses={planStatuses}
                    collapsible
                    collapsed={twoPane}
                  />
                </div>
              )}
              {/* Scenarios card — collapses once approved / in the rail. */}
              {g.id === GID.scn && showScenarioCard && (
                <ScenarioReviewCard
                  scenarios={state.scenarios}
                  collapsible
                  collapsed={state.scenariosProceeded || twoPane}
                />
              )}
            </div>
          )
        })}

        {/* Live Murmur — the SINGLE arbitrated status line. Present through every
            active phase, replacing its content in place; clears at gates and on
            completion. Sits under the active group. */}
        {murmurSnap.anyLive && (
          <MurmurLine
            snapshot={murmurSnap}
            expanded={murmurExpanded}
            onToggle={() => setMurmurExpanded((v) => !v)}
            elapsedMs={elapsedMs}
            reasoningSummary={murmurSnap.segments.thought?.text}
          />
        )}

        {/* Final feedback row when the run completes with no two-pane table. */}
        {state.runComplete && state.testCases.length === 0 && !state.failed && (
          <div className="proto-thread-feedback">
            <FeedbackRow />
          </div>
        )}

        {/* Visualization card (CAA / TPA-v2) */}
        {state.viz && !twoPane && (
          <DonutChart
            title={state.viz.title}
            subtitle={state.viz.subtitle}
            data={state.viz.data}
          />
        )}

        {/* Failure card */}
        {state.failed && (
          <OutcomeCard
            title="Run failed"
            description={state.failed.reason}
            state="error"
            footer={
              <button type="button" className="proto-gradient-btn">
                Retry →
              </button>
            }
          />
        )}
      </div>

      <div className="proto-thread-composer">
        <Composer
          state={composerState}
          variant="bottom"
          gate={effectiveGate ?? undefined}
          onSubmit={onComposerSubmit}
          onStop={onStop}
          onAnswer={onAnswer}
        />
      </div>
    </div>
  )
}

// Hooks for return-type inference — used only at type level
function useScenario() {
  return SCENARIOS[0]
}

// ---------------------------------------------------------------------------
// Right work panel (S8–S10)
// ---------------------------------------------------------------------------

function RightWorkPanel({
  scenario,
  state,
  onAccept,
  onReject,
}: {
  scenario: ReturnType<typeof useScenario>
  state: UiState
  onAccept: (ids: string[]) => void
  onReject: (ids: string[]) => void
}) {
  if (state.failed) {
    return (
      <div className="proto-rightpanel">
        <Breadcrumb items={scenario.rightBreadcrumb ?? ['Atto’s Home', 'Workspace']} />
        <OutcomeCard title="Run failed" description={state.failed.reason} state="error" />
      </div>
    )
  }
  return (
    <div className="proto-rightpanel">
      <Breadcrumb items={scenario.rightBreadcrumb ?? ['Atto’s Home', 'Workspace']} />
      {state.testCases.length === 0 ? (
        <div className="proto-rightpanel-empty">
          <div className="proto-rightpanel-orb">
            <AvatarRobot size={84} alive />
          </div>
          <div className="proto-rightpanel-emptytitle">Generating Test Cases</div>
          <div className="proto-rightpanel-meter">
            <div
              className="proto-rightpanel-meter-fill"
              style={{ width: `${state.generating.percent}%` }}
            />
          </div>
          <div className="proto-rightpanel-percent">{state.generating.percent}%</div>
        </div>
      ) : (
        <TestCaseTable
          rows={state.testCases}
          title="User authentication"
          meta={{ figma: 2, jira: 4 }}
          onAccept={onAccept}
          onReject={onReject}
        />
      )}
    </div>
  )
}

