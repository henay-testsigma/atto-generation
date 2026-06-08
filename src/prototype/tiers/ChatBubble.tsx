import { motion } from 'framer-motion'

interface Props {
  role: 'user' | 'assistant' | 'system'
  text: string
  context?: { kind: string; label: string; count?: number }[]
}

/**
 * Conversation bubble. `user` → right-aligned tinted bubble; `assistant` /
 * `system` → left-aligned agent text. Colors are owned by CSS per role.
 */
export function ChatBubble({ role, text, context }: Props) {
  return (
    <motion.div
      className={`proto-chat-bubble is-${role}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      {context && context.length > 0 && (
        <div className="proto-chat-context">
          {context.map((c) => (
            <span key={c.label} className="proto-chat-context-chip">
              {c.label}
              {c.count !== undefined && (
                <span className="proto-chat-context-num">{c.count}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="proto-chat-text">{text}</div>
    </motion.div>
  )
}
