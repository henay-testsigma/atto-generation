import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { palette } from '../theme'

interface Props {
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  state?: 'normal' | 'error' | 'success'
  /** True → animate in with a subtle spring. */
  appear?: boolean
  /** When true, the header shows a chevron that collapses the body. */
  collapsible?: boolean
  /** Initial + reactive collapsed state (re-syncs when this prop changes). */
  collapsed?: boolean
}

/**
 * Generic Outcome surface. Persistent, actionable card with a soft white
 * fill, subtle border + shadow. Used for Plan/Scenarios/Test cases/Viz/etc.
 * Optionally collapsible — used to keep approved plan/scenarios compact (esp.
 * in the narrow two-pane rail).
 */
export function OutcomeCard({
  title,
  description,
  children,
  footer,
  state = 'normal',
  appear = true,
  collapsible = false,
  collapsed = false,
}: Props) {
  const [open, setOpen] = useState(!collapsed)
  // Re-sync when the controlled collapsed intent changes (e.g. on proceed /
  // entering the rail), while still allowing manual toggle afterwards.
  useEffect(() => setOpen(!collapsed), [collapsed])

  const borderColor =
    state === 'error'
      ? palette.semantic.error
      : state === 'success'
        ? palette.semantic.success
        : palette.line.line400

  const header = (
    <div className="proto-outcome-card-header">
      <div className="proto-outcome-card-title">{title}</div>
      {description && open && (
        <div className="proto-outcome-card-desc">{description}</div>
      )}
    </div>
  )

  const isCollapsed = collapsible && !open
  return (
    <motion.div
      className={`proto-outcome-card ${isCollapsed ? 'is-collapsed' : ''}`}
      initial={appear ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{ borderColor }}
      role="region"
      aria-label={title}
    >
      {collapsible ? (
        <button
          type="button"
          className="proto-outcome-card-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {header}
          <motion.span
            className="proto-outcome-card-chevron"
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            aria-hidden
          >
            <ChevronDown size={15} />
          </motion.span>
        </button>
      ) : (
        header
      )}

      <AnimatePresence initial={false}>
        {open && (children || footer) && (
          <motion.div
            initial={collapsible ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{ overflow: 'hidden' }}
          >
            {children && <div className="proto-outcome-card-body">{children}</div>}
            {footer && <div className="proto-outcome-card-footer">{footer}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
