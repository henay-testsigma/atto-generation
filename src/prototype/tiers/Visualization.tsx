import { palette } from '../theme'
import { OutcomeCard } from './OutcomeCard'

interface DonutProps {
  title: string
  subtitle?: string
  data: Record<string, number>
}

const SLICE_COLORS = [
  palette.semantic.success,
  palette.priority.p2,
  palette.semantic.info,
  palette.category.edge.dot,
  palette.semantic.error,
]

/** Lightweight donut for CAA/RAA visualizations — pure SVG, no recharts dep needed. */
export function DonutChart({ title, subtitle, data }: DonutProps) {
  const entries = Object.entries(data)
  const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1
  let acc = 0
  const r = 50
  const innerR = 32
  const cx = 70
  const cy = 70

  function arc(start: number, end: number) {
    const a0 = (start / total) * Math.PI * 2 - Math.PI / 2
    const a1 = (end / total) * Math.PI * 2 - Math.PI / 2
    const large = end - start > total / 2 ? 1 : 0
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const xi0 = cx + innerR * Math.cos(a0)
    const yi0 = cy + innerR * Math.sin(a0)
    const xi1 = cx + innerR * Math.cos(a1)
    const yi1 = cy + innerR * Math.sin(a1)
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${innerR} ${innerR} 0 ${large} 0 ${xi0} ${yi0} Z`
  }

  return (
    <OutcomeCard title={title} description={subtitle}>
      <div className="proto-viz">
        <svg viewBox="0 0 140 140" width="160" height="160" aria-hidden>
          {entries.map(([k, v], i) => {
            const d = arc(acc, acc + v)
            acc += v
            return <path key={k} d={d} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
          })}
          <text
            x="70"
            y="70"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="14"
            fontWeight={600}
            fill={palette.text.primary}
          >
            {total}
          </text>
        </svg>
        <ul className="proto-viz-legend">
          {entries.map(([k, v], i) => (
            <li key={k}>
              <span
                className="proto-viz-dot"
                style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                aria-hidden
              />
              <span className="proto-viz-key">{k.replace(/_/g, ' ')}</span>
              <span className="proto-viz-val">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </OutcomeCard>
  )
}
