import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Plus } from 'lucide-react'
import { Button } from '@testsigmainc/ui-atoms'
import { palette } from '../theme'
import type { QuestionGate } from '../tiers/InputGate'
import { InputGate } from '../tiers/InputGate'

export type ComposerState = 'idle' | 'generating' | 'gate'

export interface ContextItem {
  kind: 'jira' | 'confluence' | 'figma' | 'doc' | 'add'
  label: string
  count?: number
}

interface Props {
  state: ComposerState
  placeholder?: string
  /** Default context chips to show — clickable; non-functional in proto. */
  contextChips?: ContextItem[]
  /** Selected context pills rendered at the top of the hero composer. */
  selectedChips?: ContextItem[]
  /** Initial value (used for prompt + variant). */
  initialValue?: string
  variant?: 'hero' | 'bottom'
  gate?: QuestionGate
  onSubmit?: (text: string) => void
  onStop?: () => void
  onAnswer?: (id: string, freeText?: string) => void
  /** Hero variant only — checkbox for "Faster Generation". */
  fasterGeneration?: boolean
  /** Catalog/preview mode: the gate won't grab focus or the global keydown. */
  passive?: boolean
}

/**
 * Composer — the bottom prompt box.
 *
 * - hero variant (S1): rounded-2xl with checkbox + Add Context chips +
 *   gradient "Generate with AI →" button inside the textarea.
 * - bottom variant (S2+): pinned at the bottom; left chips, right action
 *   toggles between gradient Send → and red square Stop based on state.
 * - gate state: expands inline with InputGate above the field.
 */
export function Composer({
  state,
  placeholder = 'Reply…',
  contextChips,
  selectedChips,
  initialValue = '',
  variant = 'bottom',
  gate,
  onSubmit,
  onStop,
  onAnswer,
  fasterGeneration,
  passive,
}: Props) {
  const [val, setVal] = useState(initialValue)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // hero composer focuses on mount
    if (variant === 'hero') taRef.current?.focus()
  }, [variant])

  const submit = () => {
    const t = val.trim()
    if (!t) return
    onSubmit?.(t)
    setVal('')
  }

  const isGenerating = state === 'generating'

  if (variant === 'hero') {
    return (
      <div className="proto-composer-hero" data-state={state}>
        <div className="proto-composer-hero-grad" aria-hidden />
        <div className="proto-composer-hero-inner">
          {selectedChips && selectedChips.length > 0 && (
            <div className="proto-selected-row">
              {selectedChips.map((c) => (
                <button
                  key={'sel-' + c.kind + c.label}
                  type="button"
                  className="proto-selected-chip"
                >
                  <ChipIcon kind={c.kind} />
                  <span>{c.label}</span>
                  {typeof c.count === 'number' && (
                    <span className="proto-selected-count">{c.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Write a one-line description of what you want Atto to test. Add additional context to improve test relevance and traceability."
            className="proto-composer-hero-ta"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <div className="proto-composer-hero-controls">
            <label className="proto-composer-hero-faster">
              <input
                type="checkbox"
                defaultChecked={fasterGeneration ?? false}
                aria-label="Don't read test library (Faster Generation)"
              />
              <span>Don't read test library <em>(Faster Generation)</em></span>
            </label>
            <div className="proto-composer-hero-bottom">
              <div className="proto-context-row">
                <span className="proto-context-label">Add Context:</span>
                {(contextChips ?? defaultChips).map((c) => (
                  <Button
                    key={c.kind + c.label}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="proto-context-btn"
                    icon={<ChipIcon kind={c.kind} />}
                  >
                    {c.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="proto-context-btn is-add"
                  aria-label="Add context"
                  icon={<Plus size={12} />}
                />
              </div>
              <Button
                type="button"
                variant="ai"
                onClick={submit}
                disabled={!val.trim()}
                className="proto-generate-btn"
              >
                Generate with AI <Send size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="proto-composer-bottom" data-state={state}>
      <AnimatePresence>
        {state === 'gate' && gate && onAnswer && (
          <InputGate gate={gate} onAnswer={onAnswer} passive={passive} />
        )}
      </AnimatePresence>
      <div className="proto-composer-bottom-grad" aria-hidden />
      <div className="proto-composer-bottom-inner">
        <textarea
          ref={taRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="proto-composer-bottom-ta"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <div className="proto-composer-bottom-controls">
          <div className="proto-context-row is-compact">
            <button type="button" className="proto-context-chip is-add" aria-label="Add">
              <Plus size={12} />
            </button>
            <span className="proto-context-label">Add Context:</span>
            {(contextChips ?? defaultChips.slice(0, 3)).map((c) => (
              <button
                key={c.kind + c.label}
                type="button"
                className="proto-context-chip"
              >
                <ChipIcon kind={c.kind} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          {isGenerating ? (
            <motion.button
              key="stop"
              type="button"
              onClick={onStop}
              className="proto-composer-stop"
              aria-label="Stop"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Square size={11} fill={palette.bg.white} stroke={palette.bg.white} />
            </motion.button>
          ) : (
            <Button
              key="send"
              type="button"
              variant="ai"
              size="sm"
              onClick={submit}
              disabled={!val.trim()}
              className="proto-send-btn"
              aria-label="Send"
            >
              Send <Send size={11} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ChipIcon({ kind }: { kind: ContextItem['kind'] }) {
  switch (kind) {
    case 'jira':
      return <JiraIcon />
    case 'confluence':
      return <ConfluenceIcon />
    case 'figma':
      return <FigmaIcon />
    case 'doc':
      return (
        <span className="proto-chip-icon" style={{ background: '#f1f2f4', color: '#42526e' }}>D</span>
      )
    case 'add':
      return <Plus size={12} />
  }
}

function JiraIcon() {
  return (
    <svg className="proto-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#2684FF"
        d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z"
      />
      <path
        fill="#2684FF"
        opacity=".8"
        d="M17.294 5.757H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.001 1.001 0 0 0-1.001-1.005z"
      />
      <path
        fill="#2684FF"
        opacity=".55"
        d="M23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z"
      />
    </svg>
  )
}

function ConfluenceIcon() {
  return (
    <svg className="proto-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="conf-grad-a" x1="100%" x2="35%" y1="92%" y2="45%">
          <stop offset="18%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
        <linearGradient id="conf-grad-b" x1="0%" x2="65%" y1="8%" y2="55%">
          <stop offset="18%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#conf-grad-a)"
        d="M.92 17.685c-.244.41-.524.875-.768 1.265a.764.764 0 0 0 .258 1.05l4.972 3.06a.766.766 0 0 0 1.064-.262c.208-.336.474-.781.764-1.244 2.043-3.388 4.097-2.971 7.798-1.197l4.94 2.353a.767.767 0 0 0 1.030-.371l2.388-5.385a.755.755 0 0 0-.382-1.001c-1.041-.488-3.116-1.464-4.953-2.341-7.071-3.408-13.085-3.184-17.111 4.073z"
      />
      <path
        fill="url(#conf-grad-b)"
        d="M23.08 6.328c.243-.41.524-.875.768-1.265a.764.764 0 0 0-.258-1.05L18.618.953a.755.755 0 0 0-1.064.244c-.208.336-.474.781-.764 1.244-2.043 3.388-4.097 2.971-7.798 1.197L4.075 1.297a.767.767 0 0 0-1.030.371L.657 7.053a.755.755 0 0 0 .382 1.001c1.041.488 3.116 1.464 4.953 2.341 7.085 3.401 13.099 3.17 17.088-4.067z"
      />
    </svg>
  )
}

function FigmaIcon() {
  return (
    <svg className="proto-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F24E1E" d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z" />
      <path fill="#A259FF" d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z" />
      <path fill="#0ACF83" d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z" />
      <path fill="#FF7262" d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" />
      <path fill="#1ABCFE" d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z" />
    </svg>
  )
}

export const defaultChips: ContextItem[] = [
  { kind: 'jira', label: 'Jira Requirements' },
  { kind: 'confluence', label: 'Confluence' },
  { kind: 'figma', label: 'Figma' },
]
