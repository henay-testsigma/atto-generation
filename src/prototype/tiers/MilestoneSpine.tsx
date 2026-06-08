import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { ElapsedTimer } from '../components/ElapsedTimer'
import { AvatarRobot } from '../components/AvatarRobot'
import { TimelineRail, type TimelineItem } from '../components/TimelineRail'
import { palette } from '../theme'

export interface MilestoneGroup {
  id: string
  title: string
  /** Optional one-line description of the group, shown under the title. */
  description?: string
  /** A ms-snapshot of when this group was completed (or paused). */
  elapsedMs: number
  items: TimelineItem[]
  /** When true, group is final (collapsed by default, no live status). */
  settled: boolean
  /** When set, group is in error state. */
  error?: string
  /** Optional settled-action chip rendered on the right (e.g. "Proceed"). */
  settledAction?: string
  /** True for run-end feedback row (👍 👎 · ↻ Retry · 💬 Give Feedback). */
  isFinal?: boolean
}

interface Props {
  group: MilestoneGroup
  /** Optional initial expansion state (uncontrolled). Defaults to !settled. */
  defaultExpanded?: boolean
  /** Controlled expansion. When provided, the parent owns open/closed state. */
  expanded?: boolean
  /** Toggle handler for controlled mode. */
  onToggle?: () => void
  /** When non-null, content is rendered AFTER the timeline (e.g. plan card). */
  trailing?: React.ReactNode
}

export function MilestoneGroupView({
  group,
  defaultExpanded,
  expanded: controlledExpanded,
  onToggle,
  trailing,
}: Props) {
  const [internal, setInternal] = useState(defaultExpanded ?? !group.settled)
  const isControlled = controlledExpanded !== undefined
  const expanded = isControlled ? controlledExpanded : internal
  const toggle = () => (isControlled ? onToggle?.() : setInternal((v) => !v))
  const headerColor = group.error
    ? palette.semantic.error
    : palette.text.primary
  return (
    <div className={`proto-milestone-group ${group.settled ? 'is-settled' : ''}`}>
      <button
        type="button"
        className="proto-milestone-header"
        onClick={toggle}
        aria-expanded={expanded}
      >
        <AvatarRobot size={16} alive={!group.settled} />
        <span className="proto-milestone-titlecol">
          <span className="proto-milestone-title" style={{ color: headerColor }}>
            {group.title}
          </span>
          {group.description && !expanded && (
            <span className="proto-milestone-subtitle" style={{ color: palette.text.tertiary }}>
              {group.description}
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="proto-milestone-chevron"
          aria-hidden
        >
          <ChevronRight size={14} />
        </motion.span>
        <span className="proto-milestone-timer">
          <ElapsedTimer ms={group.elapsedMs} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="proto-milestone-body"
          >
            <div className="proto-milestone-body-inner">
              {group.items.length > 0 && <TimelineRail items={group.items} />}
              {trailing}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {group.settledAction && (
        <div className="proto-milestone-settled-row">
          <span className="proto-milestone-settled-pill">
            {group.settledAction}
          </span>
        </div>
      )}
    </div>
  )
}
