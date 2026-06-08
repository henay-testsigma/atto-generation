import { motion } from 'framer-motion'
import { Sparkles, AlertCircle } from 'lucide-react'
import { ICON_BY_KEY } from '../catalog/icons'
import { palette } from '../theme'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  status: 'in_progress' | 'done' | 'error'
  icon?: string
}

interface Props {
  items: TimelineItem[]
}

export function TimelineRail({ items }: Props) {
  return (
    <ol className="proto-timeline">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const isError = item.status === 'error'
        const Icon = ICON_BY_KEY[item.icon ?? 'sparkles'] ?? Sparkles
        const icon = isError
          ? <AlertCircle size={14} strokeWidth={1.75} />
          : <Icon size={14} strokeWidth={1.75} />
        return (
          <li key={item.id} className="proto-timeline-item">
            <div className="proto-timeline-iconcol">
              <motion.div
                className={`proto-timeline-icon ${item.status}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                style={{ color: isError ? palette.semantic.error : palette.icon.secondary }}
              >
                {icon}
              </motion.div>
              {!isLast && <span className="proto-timeline-connector" aria-hidden />}
            </div>
            <div className="proto-timeline-body">
              <div className="proto-timeline-title">{item.title}</div>
              {item.description && (
                <div className="proto-timeline-desc">{item.description}</div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
