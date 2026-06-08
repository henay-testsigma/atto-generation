import { palette } from '../theme'

interface Props {
  status: 'pending' | 'accepted' | 'rejected'
}

export function AcceptStatusPill({ status }: Props) {
  const color = {
    pending: { fg: palette.semantic.success, bg: palette.semantic.successBg },
    accepted: { fg: '#0a6e2a', bg: '#d2f0dd' },
    rejected: { fg: palette.semantic.error, bg: palette.semantic.errorBg },
  }[status]
  return (
    <span className="proto-status-pill" style={{ color: color.fg, background: color.bg }}>
      <span
        className="proto-status-dot"
        style={{ background: color.fg }}
        aria-hidden
      />
      <span style={{ textTransform: 'capitalize' }}>{status}</span>
    </span>
  )
}
