import { ThumbsUp, ThumbsDown, RotateCcw, MessageSquare } from 'lucide-react'

interface Props {
  onRetry?: () => void
}

/** Settled run-end feedback row: 👍 👎 · ↻ Retry · 💬 Give Feedback. */
export function FeedbackRow({ onRetry }: Props) {
  return (
    <div className="proto-feedback-row" role="group" aria-label="Run feedback">
      <button type="button" className="proto-icon-btn" aria-label="Thumbs up">
        <ThumbsUp size={12} />
      </button>
      <button type="button" className="proto-icon-btn" aria-label="Thumbs down">
        <ThumbsDown size={12} />
      </button>
      <span className="proto-feedback-sep">·</span>
      <button type="button" className="proto-btn-ghost" onClick={onRetry}>
        <RotateCcw size={11} aria-hidden /> Retry
      </button>
      <button type="button" className="proto-btn-ghost">
        <MessageSquare size={11} aria-hidden /> Give Feedback
      </button>
    </div>
  )
}
