import { EyeOff, Wand2 } from 'lucide-react'
import type { CatalogEntry, TierName } from './catalogData'
import { payloadFor } from './payloads'
import { routeEvent } from '../events/router'
import type { AgentEvent } from '../events/types'
import { iconKeyFor } from './icons'
import { skillGroupForAgent, skillDescription } from './skills'
import { MurmurLine } from '../murmur/MurmurLine'
import type { MurmurSnapshot } from '../murmur/controller'
import { TimelineRail, type TimelineItem } from '../components/TimelineRail'
import { ChatBubble } from '../tiers/ChatBubble'
import { OutcomeCard } from '../tiers/OutcomeCard'
import { ScenarioReviewCard, type ScenarioSummary } from '../tiers/ScenarioReviewCard'
import { PlanApprovalCard, type PlanItem } from '../tiers/PlanApprovalCard'
import { TestCaseTable, type TestCaseRow } from '../tiers/TestCaseTable'
import { type QuestionGate } from '../tiers/InputGate'
import { DonutChart } from '../tiers/Visualization'
import { Composer } from '../components/Composer'

const noop = () => {}

// ---- shared sample data -------------------------------------------------

const SAMPLE_SCENARIOS: ScenarioSummary[] = [
  { id: 's1', title: 'Successful account creation via Google OAuth', category: 'Happy Path', priority: 'P1' },
  { id: 's2', title: 'User cancels the OAuth consent flow', category: 'Error handling', priority: 'P1' },
  { id: 's3', title: 'OAuth state parameter CSRF protection', category: 'Error handling security-critical', priority: 'P0' },
  { id: 's4', title: 'Account creation with an email already in use', category: 'Data handling', priority: 'P2' },
  { id: 's5', title: 'OAuth creation with a restricted Google account', category: 'Edge case', priority: 'P3' },
]

function sampleRows(): TestCaseRow[] {
  const mk = (
    id: string,
    title: string,
    scenarioId: string,
    scenarioTitle: string,
    priority: string,
    is_update: boolean,
    acceptance_status: TestCaseRow['acceptance_status'],
    module: string,
    test_type: string,
  ): TestCaseRow => ({ id, human_id: id.toUpperCase().replace('TC', 'TC-'), title, scenarioId, scenarioTitle, priority, is_update, acceptance_status, template_type: 'STEPS', module, test_type })
  return [
    mk('tc1001', 'Successful sign-up redirects to the dashboard', 'scn1', 'Successful account creation via Google OAuth', 'P0', false, 'pending', 'Authentication', 'Functional'),
    mk('tc1002', 'Consent screen shows the requested scopes', 'scn1', 'Successful account creation via Google OAuth', 'P1', false, 'accepted', 'Authentication', 'User Experience'),
    mk('tc1003', 'Profile fields pre-fill from the Google account', 'scn1', 'Successful account creation via Google OAuth', 'P2', true, 'pending', 'User Profile', 'Functional'),
    mk('tc1004', 'Session cookie is Secure + HttpOnly', 'scn1', 'Successful account creation via Google OAuth', 'P1', false, 'rejected', 'Authentication', 'Non-Functional'),
    mk('tc1005', 'Callback with a tampered state is rejected', 'scn2', 'OAuth state parameter CSRF protection', 'P0', false, 'pending', 'Authentication', 'Functional'),
    mk('tc1006', 'Expired authorization code returns a clear error', 'scn2', 'OAuth state parameter CSRF protection', 'P1', true, 'pending', 'Authentication', 'Functional'),
  ]
}

function murmurSnap(
  action: string | null,
  detail: string | null,
  thought: string | null,
  extra: Partial<MurmurSnapshot> = {},
): MurmurSnapshot {
  return {
    segments: {
      action: action ? { text: action, shimmer: true } : null,
      detail: detail ? { text: detail, shimmer: false } : null,
      thought: thought ? { text: thought, shimmer: false } : null,
    },
    fanOut: null,
    stallPin: null,
    anyLive: true,
    ...extra,
  }
}

function Line({ snap }: { snap: MurmurSnapshot }) {
  return (
    <MurmurLine snapshot={snap} expanded={false} onToggle={noop} elapsedMs={8000} reasoningSummary={snap.segments.thought?.text} />
  )
}

// ---- per-tier previews --------------------------------------------------

function SuppressPreview({ entry }: { entry: CatalogEntry }) {
  return (
    <div className="cat-suppress">
      <EyeOff size={16} aria-hidden />
      <div>
        <div className="cat-suppress-title">Hidden from end users</div>
        <div className="cat-suppress-sub">
          <code>{entry.event}</code> is suppressed — it only surfaces in Dev mode (e.g. cost/latency footer, transport debug).
        </div>
      </div>
    </div>
  )
}

function ChatPreview({ entry }: { entry: CatalogEntry }) {
  const p = payloadFor(entry)
  const role = entry.event === 'welcome' ? 'system' : entry.event === 'dev_context' ? 'assistant' : entry.event.includes('user') || entry.event === 'message' ? 'user' : 'assistant'
  const ctx = entry.event === 'message' ? [{ kind: 'jira', label: 'Jira Requirements', count: 3 }, { kind: 'figma', label: 'Figma', count: 2 }] : undefined
  return <ChatBubble role={role} text={(p.content as string) ?? entry.event} context={ctx} />
}

function MurmurPreview({ entry }: { entry: CatalogEntry }) {
  const p = payloadFor(entry)
  const text = (p.content as string) ?? entry.event
  let snap: MurmurSnapshot
  if (entry.event === 'reasoning') snap = murmurSnap('Thinking through coverage', null, text)
  else if (/progress|appended|tick|auto_progress|tier_view|ladder/.test(entry.event)) snap = murmurSnap('Working', text, null)
  else snap = murmurSnap(text, null, null)
  return (
    <div className="cat-murmur-stack">
      <Line snap={snap} />
      <div className="cat-substates-label">Canonical murmur states</div>
      <Line snap={murmurSnap('Generating test cases', null, null)} />
      <Line snap={murmurSnap('Running search_test_cases', 'Indexed 184 prior test cases', 'Prioritizing happy paths first')} />
      <Line snap={murmurSnap(null, null, null, { fanOut: { open: 3, total: 3, labels: ['Discovery', 'Impact', 'Blast radius'] } })} />
      <Line snap={murmurSnap('Validating test cases', null, null, { stallPin: { text: 'redis read exceeded 5s (attempt 3)' } })} />
    </div>
  )
}

function MilestonePreview({ entry, status }: { entry: CatalogEntry; status?: TimelineItem['status'] }) {
  const p = payloadFor(entry)
  const st: TimelineItem['status'] = status ?? (/(_failed|_error|_terminated|^error$)/.test(entry.event) ? 'error' : 'done')
  const desc =
    (p.objective as string) ?? (p.summary as string) ?? (p.result_preview as string) ?? undefined
  const item: TimelineItem = {
    id: entry.id,
    title: (p.content as string) ?? entry.event,
    description: desc,
    status: st,
    icon: iconKeyFor(entry),
  }
  return (
    <div className="cat-milestone-wrap">
      <TimelineRail items={[item]} />
    </div>
  )
}

function SkillLoadedPreview({ entry }: { entry: CatalogEntry }) {
  const p = payloadFor(entry)
  const skillName = (p.skill_name as string) ?? ''
  const desc = (p.skill_description as string) ?? skillDescription(skillName)
  const group = skillGroupForAgent(entry.agent)
  const item: TimelineItem = {
    id: entry.id,
    title: (p.content as string) ?? `Loaded skill: ${skillName}`,
    description: desc,
    status: 'done',
    icon: 'skill',
  }
  return (
    <div className="cat-skill-wrap">
      <TimelineRail items={[item]} />
      <div className="cat-skills-head">
        <Wand2 size={13} aria-hidden /> Available skills · {group.agent} ({group.skills.length})
      </div>
      <ul className="cat-skills">
        {group.skills.map((s) => (
          <li key={s.name} className={`cat-skill ${s.name === skillName ? 'is-loaded' : ''}`}>
            <code className="cat-skill-name">{s.name}</code>
            <span className="cat-skill-desc">{s.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function donutData(p: Record<string, unknown>): { title: string; subtitle?: string; data: Record<string, number> } {
  // CAA-nested: payload.payload.data.{title,subtitle,data}
  const nested = (p.payload as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
  if (nested && nested.data) {
    return { title: (nested.title as string) ?? 'Coverage', subtitle: nested.subtitle as string, data: nested.data as Record<string, number> }
  }
  // RAA-flat: payload.{title,subtitle,data}
  if (p.data) return { title: (p.title as string) ?? 'Chart', subtitle: p.subtitle as string, data: p.data as Record<string, number> }
  return { title: 'Coverage', data: { covered: 240, uncovered: 72 } }
}

function OutcomePreview({ entry }: { entry: CatalogEntry }) {
  const e = entry.event
  const p = payloadFor(entry)
  if (e === 'question_asked' || e === 'question') {
    const raw = (p.options as unknown[]) ?? []
    const options = raw.map((o) =>
      typeof o === 'string' ? { id: o, label: o } : (o as { id: string; label: string }),
    )
    const gate: QuestionGate = {
      id: entry.id,
      question: (p.question as string) ?? (p.content as string) ?? 'Choose one',
      options: options.map((o, i) => ({ ...o, primary: i === 0 })),
      helper: e === 'question' ? 'Legacy bare-string options are adapted to {id,label}.' : undefined,
    }
    // Use the REAL prompt box (the bottom Composer with the gate above it),
    // exactly as it appears in the live flow.
    return (
      <div className="cat-promptbox">
        <Composer variant="bottom" state="gate" gate={gate} onAnswer={noop} onStop={noop} passive />
      </div>
    )
  }
  if (e === 'scenario_saved' || e === 'scenario_updated' || e === 'scenario_deleted') {
    return <ScenarioReviewCard scenarios={SAMPLE_SCENARIOS} />
  }
  if (e === 'test_case_saved' || e === 'test_case_updated' || e === 'acceptance_status_updated') {
    return <TestCaseTable rows={sampleRows()} title="Successful account creation via Google OAuth" meta={{ figma: 2, jira: 4 }} onAccept={noop} onReject={noop} />
  }
  if (e === 'visualization' || (e === 'event' && (p.event_type as string) === 'visualization')) {
    const d = donutData(p)
    return <DonutChart title={d.title} subtitle={d.subtitle} data={d.data} />
  }
  if (e === 'plan_started' || e === 'plan_created' || e === 'phase_review') {
    const items = ((p.items as { item_id: string; task: string; phase?: string }[]) ?? []).map((it) => ({ id: it.item_id, task: it.task, phase: it.phase })) as PlanItem[]
    return <PlanApprovalCard items={items.length ? items : [{ id: 'i1', task: 'Author cases', phase: 'authoring' }]} />
  }
  if (e === 'event') {
    // generic envelope: known inner → routed; unknown payload → fail-visible card
    const inner = p.event_type as string | undefined
    if (inner === 'gap_detected')
      return <OutcomeCard title="Coverage gap detected" description="guest-checkout refund has no tests" state="error" />
    return (
      <OutcomeCard title="Unrecognised result" description={`Unknown event payload (event_type: ${inner ?? 'n/a'}) — rendered fail-visible so nothing is silently dropped.`} state="error" />
    )
  }
  // generic outcome cards (gap, analysis_saved, plan_result_saved, close, pr_result, …)
  return <OutcomeCard title={(p.content as string) ?? entry.event} description={(p.summary as string) ?? undefined} state={/fail|error/.test(e) ? 'error' : 'normal'} />
}

function ConditionalPreview({ entry }: { entry: CatalogEntry }) {
  const e = entry.event
  if (e === 'tool_started' || e === 'tool_start') {
    return (
      <div className="cat-branches">
        <Branch label="While active → Murmur">
          <Line snap={murmurSnap('Analyzing prompt and context', null, null)} />
        </Branch>
        <Branch label="On tool_completed → settled Milestone">
          <MilestonePreview entry={entry} status="done" />
        </Branch>
        <Branch label="On tool_failed → settled Milestone (error)">
          <MilestonePreview entry={entry} status="error" />
        </Branch>
      </div>
    )
  }
  if (e === 'validation_completed') {
    return (
      <div className="cat-branches">
        <Branch label="final_pass: true → Milestone (done)">
          <MilestonePreview entry={entry} status="done" />
        </Branch>
        <Branch label="final_pass: false → Milestone (error) + re-author badge">
          <MilestonePreview entry={entry} status="error" />
        </Branch>
      </div>
    )
  }
  // generic `event` envelope
  return (
    <div className="cat-branches">
      <Branch label="Known inner type → Outcome (chart / findings)">
        <DonutChart title="Coverage" subtitle="routed by payload.event_type" data={{ covered: 240, uncovered: 72 }} />
      </Branch>
      <Branch label="Unknown payload → fail-visible card">
        <OutcomeCard title="Unrecognised result" description="Unknown but payload-bearing event — never silently dropped." state="error" />
      </Branch>
    </div>
  )
}

function Branch({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cat-branch">
      <div className="cat-branch-label">{label}</div>
      {children}
    </div>
  )
}

const ROUTER_TIER_NAME: Record<string, TierName> = {
  suppress: 'Suppress',
  murmur: 'Murmur',
  milestone: 'Milestone',
  outcome: 'Outcome',
  chat: 'Chat',
}

/**
 * The tier the LIVE router (`routeEvent`) assigns this event, derived from its
 * sample payload — the single classifier that also drives the prototype. The
 * router resolves payload/lifecycle conditionals, so it never returns
 * 'Conditional'. Compare against the documented `entry.final` to detect drift.
 */
export function liveTier(entry: CatalogEntry): TierName {
  const intent = routeEvent(payloadFor(entry) as AgentEvent)
  return ROUTER_TIER_NAME[intent.tier] ?? 'Outcome'
}

export function EventPreview({ entry }: { entry: CatalogEntry; animate?: boolean }) {
  // 'Conditional' is a lifecycle/payload meta-tier — a single routeEvent() call
  // resolves to one branch, so keep the multi-branch teaching preview here.
  if (entry.final === 'Conditional') return <ConditionalPreview entry={entry} />
  // Everything else renders the tier the LIVE router actually assigns, so the
  // catalog can never silently diverge from the running app.
  switch (liveTier(entry)) {
    case 'Suppress':
      return <SuppressPreview entry={entry} />
    case 'Chat':
      return <ChatPreview entry={entry} />
    case 'Murmur':
      return <MurmurPreview entry={entry} />
    case 'Milestone':
      return entry.event === 'skill_loaded' ? <SkillLoadedPreview entry={entry} /> : <MilestonePreview entry={entry} />
    case 'Outcome':
      return <OutcomePreview entry={entry} />
    default:
      return <OutcomeCard title={entry.event} />
  }
}
