// Unified AgentEvent shape. After normalization, every wire frame becomes one
// of these objects (with `payload`/`metadata` flattened to top-level fields).

export type Lifecycle = 'start' | 'progress' | 'end' | 'standalone'

export type GroupType =
  | 'session'
  | 'plan'
  | 'plan_item'
  | 'phase'
  | 'tool'
  | 'sub_agent'
  | 'scenario'
  | 'test_case'
  | 'validation'
  | 'question'
  | 'inbound'

export type AgentSource =
  | 'taa'
  | 'caa'
  | 'raa'
  | 'tpa-v1'
  | 'tpa-v2'
  | 'sca'
  | 'pr-taa'

export interface AgentEvent {
  /** Step delta from previous event (ms); engine uses to schedule emission. */
  tDelta?: number
  /** Wire type, e.g. session_started, tool_started, scenario_saved. */
  type: string
  group_type?: GroupType
  group_id?: string
  parent_group_id?: string | null
  lifecycle?: Lifecycle
  /** Per-agent source tag (SCA forwards both TAA + CAA). */
  source?: AgentSource
  content?: string
  // Free-form fields kept on the event (we don't type each one — the renderer
  // pulls what it needs based on `type`). Examples: items, scenario, test_case,
  // question, options, signals, percentage, message, summary, error, …
  [key: string]: unknown
}

export type Tier = 'suppress' | 'murmur' | 'milestone' | 'outcome' | 'chat'

/** Murmur segment slots — the line is always [ACTION · DETAIL · THOUGHT]. */
export type MurmurSegment = 'action' | 'detail' | 'thought'

/** Render intent emitted by the router for a routed event. */
export interface RenderIntent {
  tier: Tier
  /** Stable per-spine key; usually group_id but may be derived. */
  key: string
  /** Murmur-only: which segment, priority lattice rank, TTL ms. */
  murmur?: {
    segment: MurmurSegment
    priority: number
    ttlMs: number
    text: string
    /** A deduplication key for stall-pin detection. */
    dedupKey: string
    /** When true, mark the murmur line as actively shimmering. */
    shimmer?: boolean
    /** When true, treat as a tool-open holding the ACTION slot. */
    isToolOpen?: boolean
    /** When true, treat as a fan-out worker open/close. */
    fanOut?: 'open' | 'close'
  }
  /** Milestone-only: settle a prior murmur, or update spine state. */
  milestone?: {
    title: string
    description?: string
    icon?: string
    status?: 'in_progress' | 'done' | 'error'
  }
  /** Outcome-only: which card kind to render. */
  outcome?: {
    kind:
      | 'plan_approval'
      | 'scenarios_review'
      | 'test_cases'
      | 'visualization'
      | 'gap'
      | 'session_close'
      | 'phase_review'
      | 'validation_failed'
      | 'analysis_saved'
      | 'plan_result_saved'
      | 'pr_result'
  }
  /** Chat-only. */
  chat?: { role: 'user' | 'assistant' | 'system'; text: string }
}
