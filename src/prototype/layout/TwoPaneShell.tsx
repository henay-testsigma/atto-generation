import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  twoPane: boolean
  /** When true (in two-pane), the chat rail is hidden and the right work panel
   *  fills the screen. Toggled via the breadcrumb panel icon. */
  railCollapsed?: boolean
  left: ReactNode
  right: ReactNode
}

/**
 * Single-column ↔ two-pane layout. While twoPane=false the `left` (chat) fills
 * the column. On twoPane=true the right work panel opens; the chat either docks
 * to a ~32% rail (railCollapsed=false) or hides entirely so the work panel goes
 * full-screen (railCollapsed=true).
 */
export function TwoPaneShell({ twoPane, railCollapsed = false, left, right }: Props) {
  const reduce = useReducedMotion()
  const split = twoPane && !railCollapsed
  const showLeft = !twoPane || !railCollapsed
  return (
    <div className={`proto-twopane ${split ? 'is-split' : ''}`}>
      <AnimatePresence initial={false}>
        {showLeft && (
          <motion.section
            key="left"
            layout={!reduce}
            className="proto-twopane-left"
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          >
            {left}
          </motion.section>
        )}
      </AnimatePresence>
      {twoPane && (
        <motion.section
          className="proto-twopane-right"
          layout={!reduce}
          initial={reduce ? { opacity: 0 } : { x: 40, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        >
          {right}
        </motion.section>
      )}
    </div>
  )
}
