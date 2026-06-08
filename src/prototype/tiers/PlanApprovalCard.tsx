import { Search, ListChecks, FileText, ShieldCheck, Sparkles, Check, LoaderCircle } from 'lucide-react'
import { OutcomeCard } from './OutcomeCard'
import { palette } from '../theme'

export interface PlanItem {
  id: string
  task: string
  phase?: string
}

export type PlanStepStatus = 'pending' | 'active' | 'done'

interface Props {
  items: PlanItem[]
  /** Hint text under the title. Defaults to the standard approval ask. */
  helper?: string
  /** Per-phase progress — drives the check / spinner / idle step icon. */
  statuses?: Record<string, PlanStepStatus>
  collapsible?: boolean
  collapsed?: boolean
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  discovery: <Search size={14} />,
  scoring: <ListChecks size={14} />,
  authoring: <FileText size={14} />,
  validation: <ShieldCheck size={14} />,
}

/**
 * Generation Plan card. The Proceed/Modify decision now lives in the
 * gate above the composer (see InputGate) — this card is purely the
 * plan content.
 */
export function PlanApprovalCard({ items, helper, statuses, collapsible, collapsed }: Props) {
  return (
    <OutcomeCard
      title="Generation Plan"
      description={
        helper ??
        'Review the plan below. Pick an option in the composer to proceed or describe changes in chat.'
      }
      collapsible={collapsible}
      collapsed={collapsed}
    >
      <ul className="proto-plan-list">
        {items.map((it) => {
          const status = statuses?.[it.phase ?? ''] ?? 'pending'
          return (
            <li key={it.id} className={`proto-plan-item is-${status}`}>
              <span
                className={`proto-plan-icon is-${status}`}
                style={{ color: status === 'pending' ? palette.icon.secondary : undefined }}
              >
                {status === 'done' ? (
                  <Check size={14} strokeWidth={2.4} />
                ) : status === 'active' ? (
                  <LoaderCircle size={14} />
                ) : (
                  PHASE_ICONS[it.phase ?? ''] ?? <Sparkles size={14} />
                )}
              </span>
              <span className="proto-plan-task">{it.task}</span>
            </li>
          )
        })}
      </ul>
    </OutcomeCard>
  )
}
