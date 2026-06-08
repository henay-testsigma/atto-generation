import { ChevronRight } from 'lucide-react'

interface Props {
  items: string[]
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="proto-breadcrumb">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="proto-breadcrumb-item">
          {i > 0 && <ChevronRight size={12} className="proto-breadcrumb-sep" aria-hidden />}
          <span className={i === items.length - 1 ? 'is-current' : ''}>{item}</span>
        </span>
      ))}
    </nav>
  )
}
