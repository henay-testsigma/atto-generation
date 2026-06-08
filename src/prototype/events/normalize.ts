import type { AgentEvent, Lifecycle, GroupType, AgentSource } from './types'

// Backfills lifecycle/group_type for legacy literals where the wire frame does
// not include them. Sourced from events-structure.md / tier-decision-doc.html.
const LEGACY_DEFAULTS: Record<
  string,
  { lifecycle?: Lifecycle; group_type?: GroupType }
> = {
  reasoning: { lifecycle: 'standalone', group_type: 'session' },
  progress: { lifecycle: 'standalone', group_type: 'session' },
  phase: { lifecycle: 'progress', group_type: 'phase' },
  question: { lifecycle: 'start', group_type: 'question' },
  message: { lifecycle: 'standalone', group_type: 'session' },
  user_message: { lifecycle: 'standalone', group_type: 'inbound' },
  user_context: { lifecycle: 'standalone', group_type: 'inbound' },
  welcome: { lifecycle: 'standalone', group_type: 'session' },
  agent_done: { lifecycle: 'standalone', group_type: 'session' },
  visualization: { lifecycle: 'standalone', group_type: 'session' },
  error: { lifecycle: 'standalone', group_type: 'session' },
  token_usage: { lifecycle: 'standalone', group_type: 'session' },
  context_saved: { lifecycle: 'standalone', group_type: 'tool' },
  analysis_saved: { lifecycle: 'standalone', group_type: 'tool' },
  plan_result_saved: { lifecycle: 'standalone', group_type: 'plan' },
  tool_start: { lifecycle: 'start', group_type: 'tool' },
  tool_complete: { lifecycle: 'end', group_type: 'tool' },
  skill_loaded: { lifecycle: 'standalone', group_type: 'tool' },
  sub_agent_start: { lifecycle: 'start', group_type: 'sub_agent' },
  sub_agent_complete: { lifecycle: 'end', group_type: 'sub_agent' },
  sub_agent_error: { lifecycle: 'end', group_type: 'sub_agent' },
  sub_agent_signals: { lifecycle: 'progress', group_type: 'sub_agent' },
  validation_iteration: { lifecycle: 'progress', group_type: 'validation' },
  validation_result: { lifecycle: 'end', group_type: 'validation' },
  plan_auto_progress: { lifecycle: 'progress', group_type: 'plan' },
  plan_progress: { lifecycle: 'progress', group_type: 'plan' },
  plan_appended: { lifecycle: 'progress', group_type: 'plan' },
  plan_created: { lifecycle: 'start', group_type: 'plan' },
  phase_review: { lifecycle: 'end', group_type: 'phase' },
  session_complete: { lifecycle: 'end', group_type: 'session' },
  session_restored: { lifecycle: 'standalone', group_type: 'session' },
  replay_complete: { lifecycle: 'standalone', group_type: 'session' },
  jira_ticket: { lifecycle: 'standalone', group_type: 'inbound' },
  github_pr: { lifecycle: 'standalone', group_type: 'inbound' },
  event: { lifecycle: 'standalone', group_type: 'session' },
  runs_updated: { lifecycle: 'standalone', group_type: 'session' },
}

/**
 * Adapter for legacy bare-string options:  ["Yes","No"]  →  [{id,label}, …]
 */
function adaptOptions(
  options: unknown,
): { id: string; label: string }[] | undefined {
  if (!Array.isArray(options)) return undefined
  if (options.length === 0) return []
  if (typeof options[0] === 'string') {
    return (options as string[]).map((s) => ({ id: s, label: s }))
  }
  return options as { id: string; label: string }[]
}

/** Flattens payload+metadata onto the top level (legacy frames carry both). */
function flatten(frame: Record<string, unknown>): Record<string, unknown> {
  const { payload, metadata, ...rest } = frame
  const result: Record<string, unknown> = { ...rest }
  if (payload && typeof payload === 'object') {
    for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
      if (result[k] === undefined) result[k] = v
    }
  }
  if (metadata && typeof metadata === 'object') {
    for (const [k, v] of Object.entries(metadata as Record<string, unknown>)) {
      if (result[k] === undefined) result[k] = v
    }
  }
  return result
}

/**
 * Normalize one wire frame to the unified AgentEvent shape.
 *
 * - Unwraps the legacy `{type:'stream_entry', entry_type, ...}` envelope.
 * - Flattens payload/metadata into top-level fields.
 * - Backfills lifecycle + group_type for legacy literals.
 * - Coalesces sub-agent label: label ?? sub_agent ?? tool_name.
 * - Adapts legacy bare-string `options` to `{id,label}`.
 * - Coalesces CAA viz nesting (`payload.data.{viz_type,…}` flattened).
 * - Stamps a missing SCA source default to 'taa'.
 */
export function normalize(raw: Record<string, unknown>): AgentEvent {
  let frame = raw
  // Unwrap legacy stream_entry envelope
  if (frame.type === 'stream_entry' && typeof frame.entry_type === 'string') {
    frame = { ...frame, type: frame.entry_type as string }
  }
  const flat = flatten(frame)

  const type = flat.type as string
  const defaults = LEGACY_DEFAULTS[type] ?? {}

  // Lifecycle backfill
  if (flat.lifecycle === undefined && defaults.lifecycle !== undefined) {
    flat.lifecycle = defaults.lifecycle
  }
  // group_type backfill
  if (flat.group_type === undefined && defaults.group_type !== undefined) {
    flat.group_type = defaults.group_type
  }

  // Sub-agent label coalescing → label
  if (flat.label === undefined) {
    if (typeof flat.sub_agent === 'string') flat.label = flat.sub_agent
    else if (typeof flat.tool_name === 'string') flat.label = flat.tool_name
  }

  // Legacy `question` options adapter
  if (type === 'question' || type === 'question_asked') {
    const adapted = adaptOptions(flat.options)
    if (adapted) flat.options = adapted
    // legacy `question` carries the prompt in `content`; promote to a field
    if (!flat.question && typeof flat.content === 'string') {
      flat.question = flat.content
    }
  }

  // CAA visualization nesting coalesce
  if (
    type === 'visualization' ||
    (type === 'event' && (flat.event_type as string) === 'visualization')
  ) {
    const data = flat.data as Record<string, unknown> | undefined
    if (data && data.viz_type && !flat.viz_type) {
      flat.viz_type = data.viz_type
      flat.title = data.title ?? flat.title
      flat.subtitle = data.subtitle ?? flat.subtitle
      flat.data = data.data ?? flat.data
    }
  }

  // SCA forwards default to TAA when no source tag present (per cross-agent
  // quirk note in event-payloads.md).
  if (flat.source === undefined) {
    flat.source = 'taa' as AgentSource
  }

  return flat as AgentEvent
}

/**
 * Suppression set — these never reach the UI but are surfaced behind the
 * (optional) dev-mode toggle.
 */
export const SUPPRESS_TYPES = new Set([
  'token_usage',
  'context_saved',
  'replay_complete',
  'session_restored',
  'jira_ticket',
  'github_pr',
  'linear_ticket',
  'clickup_ticket',
  'azure_devops_ticket',
  'runs_updated',
  'summary',
  'sprint_issues_loaded',
  // Names-first batch: seeds the review table with all (loading) rows; handled
  // directly by the reducer, not surfaced on the murmur line.
  'test_cases_planned',
  // Answer ack is reflected by the user's chat bubble + gate close — it should
  // not leak onto the murmur line as "Answered: …".
  'question_answered',
])
