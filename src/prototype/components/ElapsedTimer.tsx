interface Props {
  ms: number
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

/** Hourglass icon + tabular HH:MM:SS counter. Pure render — driven by props. */
export function ElapsedTimer({ ms }: Props) {
  return (
    <span className="proto-elapsed">
      <svg
        width="11"
        height="13"
        viewBox="0 0 11 13"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.5 1 H9.5 V3 L6 6.5 L9.5 10 V12 H1.5 V10 L5 6.5 L1.5 3 Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span className="proto-elapsed-num">{fmt(ms)}</span>
    </span>
  )
}
