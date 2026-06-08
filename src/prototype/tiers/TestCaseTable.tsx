import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown, Link2, FileText, LoaderCircle, RotateCcw } from 'lucide-react'
import { Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@testsigmainc/ui-atoms'
import { PriorityIcon } from '../components/PriorityIcon'
import { AcceptStatusPill } from '../components/AcceptStatusPill'
import { palette } from '../theme'

export interface TestCaseRow {
  id: string
  human_id?: string
  title: string
  scenarioId: string
  scenarioTitle: string
  is_update?: boolean
  priority?: string
  template_type?: string
  module?: string
  test_type?: string
  acceptance_status: 'pending' | 'accepted' | 'rejected'
  /** True while the case's details (priority + steps) are still being authored;
   *  the row shows a loader in the priority slot until it settles. */
  generating?: boolean
  /** True when this case was re-authored after a validation failure — the
   *  scenario group surfaces a "N re-authored" badge so the agent's
   *  self-correction reads as a feature, not a hidden error. */
  revalidated?: boolean
}

interface Props {
  rows: TestCaseRow[]
  /** Optional title — defaults to the first scenario's title. */
  title?: string
  /** Optional meta line (e.g. "2 Figma files · 4 Jira Stories"). */
  meta?: { figma?: number; jira?: number }
  onAccept?: (ids: string[]) => void
  onReject?: (ids: string[]) => void
}

/**
 * Outcome density rules from tier-decision-doc.html:
 * - Groups past 3 collapse to header-only
 * - Cards within a group past 5 show "+N more"
 * - Hard ceiling 50 forces header-only triage
 * - Rolling window of last 3 newly-authored rows visible per group
 * - Bulk-accept CTAs in summary banner
 */
const GROUP_COLLAPSE_THRESHOLD = 3
const CARDS_PER_GROUP_LIMIT = 5
const HARD_CEILING = 50

export function TestCaseTable({ rows, title, meta, onAccept, onReject }: Props) {
  const [tab, setTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        tab === 'all' ? true : r.acceptance_status === tab,
      ),
    [rows, tab],
  )

  const groups = useMemo(() => {
    const m = new Map<string, { title: string; rows: TestCaseRow[] }>()
    for (const r of filtered) {
      const g = m.get(r.scenarioId) ?? { title: r.scenarioTitle, rows: [] }
      g.rows.push(r)
      m.set(r.scenarioId, g)
    }
    return [...m.entries()].map(([id, v]) => ({ id, ...v }))
  }, [filtered])

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.acceptance_status === 'pending').length,
      accepted: rows.filter((r) => r.acceptance_status === 'accepted').length,
      rejected: rows.filter((r) => r.acceptance_status === 'rejected').length,
    }),
    [rows],
  )

  const headerTitle = title ?? groups[0]?.title ?? 'Test cases'
  const reviewed = counts.accepted + counts.rejected
  const total = counts.all
  const hardCeiling = total >= HARD_CEILING

  return (
    <div className="proto-tc-table">
      <header className="proto-tc-header">
        <div className="proto-tc-feature-title">{headerTitle}</div>
        {meta && (
          <div className="proto-tc-meta-row">
            {meta.figma !== undefined && (
              <span className="proto-tc-meta-chip">
                <FileText size={12} aria-hidden /> {meta.figma} Figma files
              </span>
            )}
            {meta.jira !== undefined && (
              <span className="proto-tc-meta-chip">
                <Link2 size={12} aria-hidden /> {meta.jira} Jira Stories
              </span>
            )}
          </div>
        )}

        {total > 0 && (
          <div className="proto-tc-banner">
            <div className="proto-tc-banner-row">
              <div>
                <div className="proto-tc-banner-count">
                  {total} test cases
                  <span className="proto-tc-banner-rev">
                    {' '}· {reviewed} / {total} reviewed
                  </span>
                </div>
                <div className="proto-tc-banner-meter">
                  <div
                    className="proto-tc-banner-meter-fill"
                    style={{ width: `${total ? (reviewed / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="proto-tc-banner-actions">
                <button
                  type="button"
                  className="proto-btn-ghost"
                  onClick={() =>
                    onAccept?.(
                      rows
                        .filter((r) => r.acceptance_status === 'pending')
                        .map((r) => r.id),
                    )
                  }
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="proto-btn-ghost"
                  onClick={() =>
                    onAccept?.(
                      rows
                        .filter(
                          (r) =>
                            r.acceptance_status === 'pending' &&
                            (r.priority === 'P0' || r.priority === 'P1'),
                        )
                        .map((r) => r.id),
                    )
                  }
                >
                  Accept all P0/P1
                </button>
                <button
                  type="button"
                  className="proto-btn-ghost"
                  onClick={() => setTab('pending')}
                >
                  Review NEW only
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        variant="default"
      >
        <TabsList>
          <TabsTrigger value="all">All Test Cases ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({counts.accepted})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {hardCeiling && (
            <div className="proto-tc-ceiling">
              Showing group headers only ({total} test cases — past the {HARD_CEILING} ceiling).
              Use the bulk actions or a tab to drill in.
            </div>
          )}
          <div className="proto-tc-groups">
            {groups.map((g, i) => (
              <GroupView
                key={g.id}
                group={g}
                defaultOpen={i === 0 && !hardCeiling}
                collapsedByDensity={!hardCeiling && i >= GROUP_COLLAPSE_THRESHOLD}
                onAccept={onAccept}
                onReject={onReject}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GroupView({
  group,
  defaultOpen,
  collapsedByDensity,
  onAccept,
  onReject,
}: {
  group: { id: string; title: string; rows: TestCaseRow[] }
  defaultOpen: boolean
  collapsedByDensity: boolean
  onAccept?: (ids: string[]) => void
  onReject?: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(defaultOpen && !collapsedByDensity)
  const [showAll, setShowAll] = useState(false)
  const reduce = useReducedMotion()

  const visible = showAll ? group.rows : group.rows.slice(0, CARDS_PER_GROUP_LIMIT)
  const hidden = group.rows.length - visible.length
  const reauthored = group.rows.filter((r) => r.revalidated).length

  return (
    <div className="proto-tc-group">
      <button
        type="button"
        className="proto-tc-group-hdr"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          aria-hidden
        >
          <ChevronDown size={14} />
        </motion.span>
        <span className="proto-tc-group-title">{group.title}</span>
        <Badge color="neutral" size="1">{group.rows.length}</Badge>
        {reauthored > 0 && (
          <span
            className="proto-tc-reauth"
            title={`${reauthored} case${reauthored === 1 ? '' : 's'} re-authored after validation`}
          >
            <RotateCcw size={11} aria-hidden />
            {reauthored} re-authored
          </span>
        )}
        <div style={{ flex: 1 }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, height: 0 }
            }
            animate={
              reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }
            }
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="proto-tc-group-body"
          >
            <ul className="proto-tc-rows">
              {visible.map((r) => (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className={`proto-tc-row ${r.generating ? 'is-generating' : ''}`}
                >
                  {r.generating ? (
                    <span className="proto-tc-row-spinner" aria-label="Authoring" title="Authoring…">
                      <LoaderCircle size={13} />
                    </span>
                  ) : (
                    <PriorityIcon priority={r.priority} />
                  )}
                  <span className="proto-tc-row-title" title={r.title}>{r.title}</span>
                  {r.is_update ? (
                    <Badge color="info" size="1">Update</Badge>
                  ) : (
                    <Badge color="success" size="1">New</Badge>
                  )}
                  <span className="proto-tc-row-tmpl" aria-hidden>
                    <FileText size={12} />
                  </span>
                  <div style={{ flex: 1 }} />
                  {r.module && (
                    <a
                      href="#"
                      className="proto-tc-row-module"
                      onClick={(e) => e.preventDefault()}
                    >
                      {r.module}
                    </a>
                  )}
                  {r.test_type && (
                    <span className="proto-tc-row-type" style={{ color: palette.text.secondary }}>
                      {r.test_type}
                    </span>
                  )}
                  <Link2
                    size={12}
                    className="proto-tc-row-link"
                    color={palette.icon.secondary}
                    aria-hidden
                  />
                  <AcceptStatusPill status={r.acceptance_status} />
                  {r.acceptance_status === 'pending' && !r.generating && (
                    <span className="proto-tc-row-actions">
                      <button
                        type="button"
                        aria-label="Accept"
                        className="proto-icon-btn ok"
                        onClick={() => onAccept?.([r.id])}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        aria-label="Reject"
                        className="proto-icon-btn no"
                        onClick={() => onReject?.([r.id])}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </motion.li>
              ))}
              {hidden > 0 && (
                <li className="proto-tc-more">
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="proto-btn-ghost"
                  >
                    + {hidden} more
                  </button>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      {collapsedByDensity && !open && (
        <div className="proto-tc-group-collapsed-hint">
          Collapsed by density · click to expand
        </div>
      )}
    </div>
  )
}

/**
 * Helper: reconcile an out-of-band `acceptance_status_updated` event by
 * test_case_id. Returns a new list with the matching row's status patched
 * (tolerates the row not yet existing — upserts a stub instead).
 */
export function reconcileAcceptance(
  rows: TestCaseRow[],
  id: string,
  status: 'pending' | 'accepted' | 'rejected',
): TestCaseRow[] {
  let found = false
  const next = rows.map((r) => {
    if (r.id === id) {
      found = true
      return { ...r, acceptance_status: status }
    }
    return r
  })
  if (!found) {
    next.push({
      id,
      title: 'Unknown test case',
      scenarioId: 'orphan',
      scenarioTitle: 'Out-of-band',
      acceptance_status: status,
    })
  }
  return next
}
