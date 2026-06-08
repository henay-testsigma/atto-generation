import { categoryFor } from '../theme'

interface Props {
  category: string | undefined
  size?: 'sm' | 'md'
}

export function CategoryPill({ category, size = 'md' }: Props) {
  const c = categoryFor(category)
  return (
    <span
      className={`proto-cat-pill is-${size}`}
      style={{ background: c.bg, color: c.fg }}
    >
      <span
        className="proto-cat-pill-dot"
        style={{ background: c.dot }}
        aria-hidden
      />
      {c.label}
    </span>
  )
}
