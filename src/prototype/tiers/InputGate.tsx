import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, MessageSquare, Sparkles, Send } from 'lucide-react'
import { Kbd } from '@testsigmainc/ui-atoms'
import type { ReactNode } from 'react'

export interface GateOption {
  id: string
  label: string
  description?: string
  /** Optional icon shown on the left of the row. */
  icon?: ReactNode
  /** Reveals an inline text field when picked (like "Other…"). */
  expandsText?: boolean
  /** Render this option emphasized (gradient accent on the arrow). */
  primary?: boolean
}

export interface QuestionGate {
  id: string
  question: string
  options: GateOption[]
  /** Optional short helper above the options. */
  helper?: string
}

interface Props {
  gate: QuestionGate
  onAnswer: (id: string, freeText?: string) => void
  onSkip?: () => void
  /** Catalog/preview mode: don't auto-focus or grab the global keydown so a
   *  mounted gate can't hijack page scroll, search, or typing. */
  passive?: boolean
}

/**
 * List-style human-in-the-loop gate.
 *
 * Renders above the composer as a single bordered card with the question
 * + a vertical list of full-width option rows (left-aligned label, right
 * arrow, hover background). Picking an option with `expandsText:true`
 * (e.g. "Modify in chat", "Other…") reveals an inline input. Focus moves
 * to the first row on mount; the question announces assertively.
 */
export function InputGate({ gate, onAnswer, onSkip, passive }: Props) {
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    if (!passive) rowRefs.current[0]?.focus()
    setExpandedId(null)
    setText('')
  }, [gate.id, passive])

  const onPick = useCallback(
    (o: GateOption) => {
      if (o.expandsText) {
        setExpandedId(o.id)
        // focus the input after it mounts
        requestAnimationFrame(() => {
          const inp = document.querySelector<HTMLInputElement>(
            '.proto-gate-row-input',
          )
          inp?.focus()
        })
      } else {
        onAnswer(o.id)
      }
    },
    [onAnswer],
  )

  // Single window-level keydown handler — handles every kind of keyboard
  // interaction the gate cares about (arrows, Home/End, Enter, Esc, number
  // shortcuts). Routing this through window (instead of per-row React
  // onKeyDown) makes navigation work even if focus has drifted off the
  // rows (e.g. user clicked the question text). Silent while the user is
  // typing in an input/textarea so the Reply composer isn't disrupted.
  useEffect(() => {
    if (passive) return
    const handler = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null
      const isTyping =
        !!ae &&
        (ae.tagName === 'INPUT' ||
          ae.tagName === 'TEXTAREA' ||
          ae.isContentEditable)
      // While typing in the inline modify-input, let arrows move the caret
      // and Enter submit. Only Esc has special meaning, handled by the
      // input's own onKeyDown.
      if (isTyping) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const rows = rowRefs.current
      const count = gate.options.length
      const currentIdx = rows.findIndex((r) => r === ae)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = currentIdx >= 0 ? (currentIdx + 1) % count : 0
        rows[next]?.focus()
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev =
          currentIdx >= 0 ? (currentIdx - 1 + count) % count : count - 1
        rows[prev]?.focus()
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        rows[0]?.focus()
        return
      }
      if (e.key === 'End') {
        e.preventDefault()
        rows[count - 1]?.focus()
        return
      }
      if (e.key === 'Enter' && currentIdx >= 0) {
        e.preventDefault()
        onPick(gate.options[currentIdx])
        return
      }
      if (e.key === 'Escape' && onSkip) {
        e.preventDefault()
        onSkip()
        return
      }

      const n = parseInt(e.key, 10)
      if (Number.isFinite(n) && n >= 1 && n <= count) {
        e.preventDefault()
        onPick(gate.options[n - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gate.options, onPick, onSkip, passive])

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label="Question"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.24, ease: 'easeOut' },
      }}
      style={{ overflow: 'hidden' }}
      className="proto-gate"
    >
      <div className="proto-gate-q" aria-live="assertive">{gate.question}</div>
      {gate.helper && <div className="proto-gate-helper">{gate.helper}</div>}
      <div className="proto-gate-list" role="listbox">
        {gate.options.map((o, i) => {
          const isExpanded = expandedId === o.id
          const shortcut = i < 9 ? String(i + 1) : null
          return (
            <div key={o.id} className="proto-gate-row-wrap">
              <motion.button
                ref={(el) => {
                  rowRefs.current[i] = el
                }}
                type="button"
                role="option"
                aria-selected={false}
                aria-keyshortcuts={shortcut ?? undefined}
                onClick={() => onPick(o)}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.03 * i,
                  type: 'spring',
                  stiffness: 360,
                  damping: 28,
                }}
                className={`proto-gate-row ${o.primary ? 'is-primary' : ''} ${isExpanded ? 'is-active' : ''}`}
              >
                {o.icon && (
                  <span className="proto-gate-row-icon" aria-hidden>
                    {o.icon}
                  </span>
                )}
                <span className="proto-gate-row-body">
                  <span className="proto-gate-row-label">{o.label}</span>
                  {o.description && (
                    <span className="proto-gate-row-desc">{o.description}</span>
                  )}
                </span>
                {shortcut && (
                  <span className="proto-gate-row-kbd" aria-hidden>
                    <Kbd>{shortcut}</Kbd>
                  </span>
                )}
                <span
                  className={`proto-gate-row-arrow ${o.primary ? 'is-primary' : ''}`}
                  aria-hidden
                >
                  <ArrowRight size={13} />
                </span>
              </motion.button>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 28,
                    }}
                    className="proto-gate-row-input-wrap"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (text.trim()) onAnswer(o.id, text.trim())
                    }}
                  >
                    <div className="proto-gate-row-input-row">
                      <input
                        value={text}
                        onChange={(ev) => setText(ev.target.value)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Escape') {
                            ev.preventDefault()
                            setExpandedId(null)
                            rowRefs.current[i]?.focus()
                          }
                        }}
                        placeholder={
                          o.id.includes('modify')
                            ? 'Describe the changes you want…'
                            : 'Type your answer…'
                        }
                        className="proto-gate-row-input"
                      />
                      <button
                        type="submit"
                        className="proto-gate-row-input-send"
                        disabled={!text.trim()}
                        aria-label="Send"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      <div className="proto-gate-foot">
        <span className="proto-gate-foot-hint">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <span>to navigate</span>
          <span className="proto-gate-foot-sep">·</span>
          <Kbd>↵</Kbd>
          <span>to pick</span>
          {onSkip && (
            <>
              <span className="proto-gate-foot-sep">·</span>
              <Kbd>esc</Kbd>
              <span>to skip</span>
            </>
          )}
        </span>
        {onSkip && (
          <button type="button" onClick={onSkip} className="proto-gate-skip">
            Skip
          </button>
        )}
      </div>
    </motion.div>
  )
}

/* ----------------------------------------------------------------------- *
 *  Helpers — build the synthetic plan / scenarios gates                   *
 * ----------------------------------------------------------------------- */

export function buildPlanApprovalGate(): QuestionGate {
  return {
    id: 'plan-approval',
    question: 'Ready to start generating with this plan?',
    helper: 'Choose Proceed to generate test cases, or describe changes in chat.',
    options: [
      {
        id: 'plan:proceed',
        label: 'Proceed',
        description: 'Generate scenarios + test cases from this plan',
        icon: <Sparkles size={14} />,
        primary: true,
      },
      {
        id: 'plan:modify',
        label: 'Modify in chat',
        description: 'Reply with the changes you’d like before generating',
        icon: <MessageSquare size={14} />,
        expandsText: true,
      },
    ],
  }
}

export function buildScenariosApprovalGate(count: number): QuestionGate {
  return {
    id: 'scenarios-approval',
    question: `${count} scenarios are ready — proceed to generate test cases?`,
    helper: 'Edit, add, or remove any scenario by replying in chat first.',
    options: [
      {
        id: 'scenarios:proceed',
        label: 'Proceed',
        description: 'Generate detailed test cases for these scenarios',
        icon: <Sparkles size={14} />,
        primary: true,
      },
      {
        id: 'scenarios:modify',
        label: 'Modify scenarios in chat',
        description: 'Add, remove, or change a scenario before continuing',
        icon: <MessageSquare size={14} />,
        expandsText: true,
      },
    ],
  }
}
