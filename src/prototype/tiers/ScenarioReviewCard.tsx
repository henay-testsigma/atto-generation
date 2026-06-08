import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { OutcomeCard } from './OutcomeCard'
import { CategoryPill } from '../components/CategoryPill'
import { categoryFor } from '../theme'

export interface ScenarioSummary {
  id: string
  title: string
  category?: string
  priority?: string
}

interface Props {
  scenarios: ScenarioSummary[]
  /** Hint text under the title. */
  helper?: string
  collapsible?: boolean
  collapsed?: boolean
}

/**
 * Scenarios-review card. Wide layout = numbered list with right-aligned
 * category pills. Narrow layout = grouped-by-category sections (handled
 * via container queries in CSS; here we render both layouts; CSS hides
 * the one not in use). The Proceed/Modify decision lives in the gate
 * above the composer (see InputGate).
 */
export function ScenarioReviewCard({ scenarios, helper, collapsible, collapsed }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, ScenarioSummary[]>()
    for (const s of scenarios) {
      const cat = categoryFor(s.category).label
      const arr = map.get(cat) ?? []
      arr.push(s)
      map.set(cat, arr)
    }
    return [...map.entries()]
  }, [scenarios])
  return (
    <OutcomeCard
      title={`${scenarios.length} scenarios generated`}
      collapsible={collapsible}
      collapsed={collapsed}
      description={
        helper ??
        'Review the scenarios below. Pick an option in the composer to proceed or modify in chat.'
      }
    >
      <div className="proto-scen-wide">
        <ol className="proto-scen-list">
          <AnimatePresence initial={false}>
            {scenarios.map((s, i) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="proto-scen-row"
              >
                <span className="proto-scen-num">{i + 1}.</span>
                <span className="proto-scen-title">{s.title}</span>
                <span className="proto-scen-tag">
                  <CategoryPill category={s.category} />
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>

      <div className="proto-scen-narrow">
        <div className="proto-scen-summary-chips">
          {grouped.map(([cat, items]) => {
            const c = categoryFor(cat)
            return (
              <span
                key={cat}
                className="proto-scen-summary-chip"
                style={{ background: c.bg, color: c.fg }}
              >
                <span
                  className="proto-scen-summary-dot"
                  style={{ background: c.dot }}
                  aria-hidden
                />
                {items.length} {c.label.split(' ')[0]}
              </span>
            )
          })}
        </div>
        <NarrowGroups grouped={grouped} />
      </div>
    </OutcomeCard>
  )
}

function NarrowGroups({
  grouped,
}: {
  grouped: [string, ScenarioSummary[]][]
}) {
  const [openIdx, setOpenIdx] = useState(0)
  let runningIdx = 0
  return (
    <div className="proto-scen-groups">
      {grouped.map(([cat, items], gIdx) => {
        const c = categoryFor(cat)
        const open = openIdx === gIdx
        const startNum = runningIdx + 1
        runningIdx += items.length
        return (
          <div key={cat} className="proto-scen-group">
            <button
              type="button"
              onClick={() => setOpenIdx(open ? -1 : gIdx)}
              className="proto-scen-group-hdr"
              style={{ color: c.fg }}
              aria-expanded={open}
            >
              <motion.span
                animate={{ rotate: open ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                aria-hidden
              >
                <ChevronRight size={13} />
              </motion.span>
              <span
                className="proto-scen-group-dot"
                style={{ background: c.dot }}
                aria-hidden
              />
              <span>{c.label}</span>
              <span className="proto-scen-group-count">({items.length})</span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="proto-scen-group-list"
                >
                  {items.map((s, i) => (
                    <li key={s.id} className="proto-scen-group-item">
                      <span className="proto-scen-num">{startNum + i}</span>
                      <span className="proto-scen-title">{s.title}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
