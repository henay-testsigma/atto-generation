import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { MurmurSnapshot } from './controller'
import { palette } from '../theme'
import { AvatarRobot } from '../components/AvatarRobot'
import { ElapsedTimer } from '../components/ElapsedTimer'

interface Props {
  snapshot: MurmurSnapshot
  expanded: boolean
  onToggle: () => void
  elapsedMs: number
  /** When provided, an inline reasoning summary shows when expanded. */
  reasoningSummary?: string
}

/**
 * Renders the live arbitrated `[ACTION · DETAIL · THOUGHT]` line.
 *
 * Per the spec: when nothing is live, it shows the latest settled action so
 * the user always has context. ACTION uses shimmer while streaming; DETAIL
 * is dim secondary text; THOUGHT is italic-tertiary.
 */
export function MurmurLine({
  snapshot,
  expanded,
  onToggle,
  elapsedMs,
  reasoningSummary,
}: Props) {
  const { action, detail, thought } = snapshot.segments
  const actionText = action?.text ?? ''
  const detailText = detail?.text ?? ''
  const thoughtText = thought?.text ?? ''
  const hasAnything =
    !!actionText || !!detailText || !!thoughtText || snapshot.fanOut != null

  // Ordered live segments. The FIRST present one leads (line 1); the rest are
  // supporting context. This guarantees the line always opens with real content
  // while work is live — never a stranded "Awaiting next step…" placeholder.
  const segs = [
    actionText ? { text: actionText, kind: 'detail' as const, shimmer: !!action?.shimmer } : null,
    detailText ? { text: detailText, kind: 'detail' as const, shimmer: !!detail?.shimmer } : null,
    thoughtText ? { text: thoughtText, kind: 'thought' as const, shimmer: false } : null,
  ].filter(Boolean) as { text: string; kind: 'detail' | 'thought'; shimmer: boolean }[]
  const primary = segs[0]
  const support = segs.slice(1)
  const supportColor = (k: 'detail' | 'thought') =>
    k === 'thought' ? palette.text.tertiary : palette.text.secondary

  return (
    <div className="proto-murmur-wrap">
      <AnimatePresence>
        {snapshot.stallPin && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="proto-murmur-stall"
            role="status"
          >
            <span aria-hidden>⏳</span>
            <span>Still working: {snapshot.stallPin.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onToggle}
        className={`proto-murmur-row ${expanded ? 'is-expanded' : ''}`}
        aria-expanded={expanded}
        aria-live="polite"
        aria-atomic="true"
      >
        <AvatarRobot size={16} />

        <span className="proto-murmur-segments">
          {snapshot.fanOut ? (
            <>
              <span className="proto-murmur-primary">
                <span className="proto-murmur-action">
                  Running {snapshot.fanOut.open} workers in parallel
                </span>
              </span>
              <span className="proto-murmur-support">
                <span className="proto-murmur-fanout-pills">
                  {snapshot.fanOut.labels.slice(0, 3).map((l) => (
                    <span key={l} className="proto-murmur-fanout-pill">
                      {l}
                    </span>
                  ))}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="proto-murmur-primary" title={primary?.text || undefined}>
                {primary ? (
                  <span className={`proto-murmur-action ${primary.shimmer ? 'proto-shimmer' : ''}`}>
                    {primary.text}
                  </span>
                ) : (
                  <span className="proto-murmur-idle" style={{ color: palette.text.secondary }}>
                    Awaiting next step…
                  </span>
                )}
              </span>
              {support.length > 0 && (
                <span className="proto-murmur-support">
                  {support.map((s, i) => (
                    <span
                      key={i}
                      className={s.kind === 'thought' ? 'proto-murmur-thought' : 'proto-murmur-detail'}
                      style={{ color: supportColor(s.kind) }}
                      title={s.text}
                    >
                      <span className="proto-murmur-sep" aria-hidden>·</span> {s.text}
                    </span>
                  ))}
                </span>
              )}
            </>
          )}
        </span>

        <span className="proto-murmur-timer" aria-hidden={!hasAnything}>
          <ElapsedTimer ms={elapsedMs} />
        </span>

        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="proto-murmur-chevron"
          aria-hidden
        >
          <ChevronRight size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && reasoningSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="proto-murmur-reasoning"
          >
            <div className="proto-murmur-reasoning-inner">
              {reasoningSummary}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
