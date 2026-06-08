import type { AgentEvent, RenderIntent } from './types'
import { SUPPRESS_TYPES } from './normalize'

/**
 * Pure event → render-intent dispatcher.
 * Encodes the 5-tier classification + the Murmur priority lattice (0-7)
 * from tier-decision-doc.html.
 *
 *   0  Stall pin (banner above the line; dedup detection)
 *   1  Parallel fan-out strip (ACTION owner, while ≥2 workers open)
 *   2  Tool open  (ACTION  · soft 8s / hard 20s)
 *   3  Determinate sub-progress  (ACTION · 4s)
 *   4  Indeterminate progress  (DETAIL · 4s)
 *   5  Validation iteration  (DETAIL · 5s)
 *   6  Legacy/structural ticks  (DETAIL · 3s; rate-limited ≤1/1.5s)
 *   7  reasoning  (THOUGHT · 6s)
 */
export function routeEvent(e: AgentEvent): RenderIntent {
  const t = e.type
  const key = (e.group_id as string) ?? `${t}:${(e.event_id ?? '') as string}`

  if (SUPPRESS_TYPES.has(t)) return { tier: 'suppress', key }

  // ---------- CHAT -----------
  if (t === 'message' || t === 'user_message' || t === 'welcome' || t === 'dev_context' || t === 'user_context') {
    const text = (e.content as string) ?? ''
    return {
      tier: 'chat',
      key,
      chat: {
        role: t === 'user_message' || t === 'user_context' ? 'user' : t === 'welcome' ? 'system' : 'assistant',
        text,
      },
    }
  }

  // ---------- OUTCOME (cards + gates) -----------
  if (t === 'question_asked' || t === 'question') {
    return { tier: 'outcome', key, outcome: { kind: 'plan_approval' } }
  }
  if (t === 'phase_review') {
    return { tier: 'outcome', key, outcome: { kind: 'phase_review' } }
  }
  if (t === 'scenario_saved' || t === 'scenario_updated' || t === 'scenario_deleted') {
    return { tier: 'outcome', key, outcome: { kind: 'scenarios_review' } }
  }
  if (t === 'test_case_saved' || t === 'test_case_updated' || t === 'acceptance_status_updated') {
    return { tier: 'outcome', key, outcome: { kind: 'test_cases' } }
  }
  if (t === 'visualization') {
    return { tier: 'outcome', key, outcome: { kind: 'visualization' } }
  }
  if (t === 'session_complete' || t === 'session_completed' || t === 'summary_generated' || t === 'result') {
    return { tier: 'outcome', key, outcome: { kind: 'session_close' } }
  }
  if (t === 'analysis_saved') {
    return { tier: 'outcome', key, outcome: { kind: 'analysis_saved' } }
  }
  if (t === 'plan_result_saved') {
    return { tier: 'outcome', key, outcome: { kind: 'plan_result_saved' } }
  }
  // Conditional `event` envelope router
  if (t === 'event') {
    const inner = e.event_type as string | undefined
    if (inner === 'visualization' || inner === 'gap_detected') {
      return {
        tier: 'outcome',
        key,
        outcome: { kind: inner === 'gap_detected' ? 'gap' : 'visualization' },
      }
    }
    // status / generic → murmur
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'detail',
        priority: 6,
        ttlMs: 3000,
        text: (e.content as string) ?? (e.message as string) ?? '',
        dedupKey: `event:${(e.content as string) ?? ''}`,
      },
    }
  }
  // Conditional validation_completed: pass → milestone close; fail → milestone
  // ERROR step. A failing validation in this product is recoverable — the agent
  // re-authors the offending cases — so it settles as a calm (error-styled) step
  // in the spine, NOT an alarming persistent Outcome card. The self-correction is
  // surfaced separately via the per-scenario "N re-authored" badge on the table.
  if (t === 'validation_completed') {
    if (e.final_pass === true) {
      return {
        tier: 'milestone',
        key,
        milestone: {
          title: (e.content as string) ?? 'Validation passed',
          status: 'done',
          icon: 'check',
        },
      }
    }
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? 'Validation found issues',
        status: 'error',
        icon: 'shield',
      },
    }
  }
  if (t === 'validation_failed') {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? 'Validation failed',
        status: 'error',
        icon: 'shield',
      },
    }
  }
  // plan_started / plan_created settle the planning group as a Milestone. The
  // plan-APPROVAL gate is a separate synthesized question (buildPlanApprovalGate),
  // not this event — so these are not Outcome cards.
  if (t === 'plan_started' || t === 'plan_created') {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? t,
        status: e.lifecycle === 'end' ? 'done' : 'in_progress',
      },
    }
  }
  if (t === 'tms_backfill_started' || t === 'tms_backfill_completed') {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? t,
        status: t === 'tms_backfill_completed' ? 'done' : 'in_progress',
      },
    }
  }

  // ---------- MILESTONE -----------
  if (
    t === 'session_started' ||
    t === 'session_resumed' ||
    t === 'session_paused' ||
    t === 'session_terminated' ||
    t === 'session_failed' ||
    t === 'phase_started' ||
    t === 'phase_completed' ||
    t === 'plan_completed' ||
    t === 'plan_item_started' ||
    t === 'plan_item_completed' ||
    t === 'sub_agent_started' ||
    t === 'sub_agent_completed' ||
    t === 'sub_agent_start' ||
    t === 'sub_agent_complete' ||
    t === 'sub_agent_signals' ||
    t === 'validation_started' ||
    t === 'skill_loaded' ||
    t === 'agent_done' ||
    t === 'signal_worker_completed' ||
    t === 'scoring_completed' ||
    t === 'error'
  ) {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? t,
        description: (e.message as string) ?? (e.summary as string) ?? undefined,
        status:
          t === 'session_failed' || t === 'error'
            ? 'error'
            : e.lifecycle === 'end'
              ? 'done'
              : 'in_progress',
      },
    }
  }
  if (t === 'signal_worker_started') {
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'action',
        priority: 1,
        ttlMs: 20_000,
        text: (e.content as string) ?? `${e.signal ?? 'worker'} started`,
        dedupKey: `fanout:${e.signal ?? ''}`,
        fanOut: 'open',
        shimmer: true,
      },
    }
  }
  if (t === 'signal_worker_failed') {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? 'Worker failed',
        status: 'error',
      },
    }
  }
  if (t === 'sub_agent_failed' || t === 'sub_agent_error' || t === 'tool_failed') {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? `${t} failed`,
        status: 'error',
      },
    }
  }
  if (t === 'tool_completed' || t === 'tool_complete') {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? 'Tool done',
        status: 'done',
      },
    }
  }
  if (t === 'validation_result') {
    return {
      tier: 'milestone',
      key,
      milestone: {
        title: (e.content as string) ?? 'Validation result',
        status: e.status === 'fail' ? 'error' : 'done',
      },
    }
  }

  // ---------- MURMUR -----------
  if (t === 'tool_started' || t === 'tool_start') {
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'action',
        priority: 2,
        ttlMs: 20_000,
        text: (e.content as string) ?? `Running ${e.tool_name ?? 'tool'}`,
        dedupKey: `tool:${(e.tool_name as string) ?? ''}`,
        isToolOpen: true,
        shimmer: true,
      },
    }
  }
  if (t === 'sub_agent_progress') {
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'action',
        priority: 3,
        ttlMs: 4000,
        text: (e.content as string) ?? (e.message as string) ?? '',
        dedupKey: `progress:${e.sub_agent_id ?? ''}`,
        shimmer: true,
      },
    }
  }
  if (t === 'progress') {
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'detail',
        priority: 4,
        ttlMs: 4000,
        text: (e.content as string) ?? (e.message as string) ?? '',
        dedupKey: `prog:${(e.message as string) ?? ''}`,
        shimmer: true,
      },
    }
  }
  if (t === 'validation_iteration') {
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'detail',
        priority: 5,
        ttlMs: 5000,
        text: (e.content as string) ?? `Iteration ${e.iteration ?? '?'}`,
        dedupKey: `valit:${e.iteration ?? ''}`,
      },
    }
  }
  if (
    t === 'phase' ||
    t === 'plan_auto_progress' ||
    t === 'plan_progress' ||
    t === 'plan_appended' ||
    t === 'tier_view_built' ||
    t === 'ladder_rung_committed'
  ) {
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'detail',
        priority: 6,
        ttlMs: 3000,
        text: (e.content as string) ?? '',
        dedupKey: `tick:${(e.content as string) ?? t}`,
      },
    }
  }
  if (t === 'reasoning') {
    return {
      tier: 'murmur',
      key,
      murmur: {
        segment: 'thought',
        priority: 7,
        ttlMs: 6000,
        text:
          (e.content as string) ??
          (e.message as string) ??
          (e.thought as string) ??
          '',
        dedupKey: `reason:${(e.content as string) ?? ''}`,
      },
    }
  }

  // Unknown — show in murmur as detail with low priority so nothing is silently
  // lost during scenario authoring.
  return {
    tier: 'murmur',
    key,
    murmur: {
      segment: 'detail',
      priority: 6,
      ttlMs: 3000,
      text: (e.content as string) ?? `(${t})`,
      dedupKey: `unk:${t}`,
    },
  }
}
