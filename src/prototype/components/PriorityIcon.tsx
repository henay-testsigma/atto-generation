import { palette } from '../theme'

interface Props {
  priority?: string | null
}

/**
 * P0/P1 → red up-arrow filled; P2 → amber equals; P3+ → green down.
 * Rendered as a small square chip per the S9 design.
 */
export function PriorityIcon({ priority }: Props) {
  const p = (priority ?? '').toUpperCase()
  let bg: string = palette.priority.p3
  let glyph: 'up' | 'eq' | 'down' = 'down'
  if (p === 'P0' || p === 'P1') {
    bg = palette.priority.p0
    glyph = 'up'
  } else if (p === 'P2') {
    bg = palette.priority.p2
    glyph = 'eq'
  }
  return (
    <span
      className="proto-prio"
      style={{ background: bg }}
      aria-label={p || 'priority'}
      title={p || 'priority'}
    >
      {glyph === 'up' && (
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
          <path d="M5 1 L8.5 5 H6.5 V9 H3.5 V5 H1.5 Z" fill="#fff" />
        </svg>
      )}
      {glyph === 'eq' && (
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
          <rect x="2" y="3" width="6" height="1.3" fill="#fff" />
          <rect x="2" y="5.7" width="6" height="1.3" fill="#fff" />
        </svg>
      )}
      {glyph === 'down' && (
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
          <path d="M5 9 L1.5 5 H3.5 V1 H6.5 V5 H8.5 Z" fill="#fff" />
        </svg>
      )}
    </span>
  )
}
