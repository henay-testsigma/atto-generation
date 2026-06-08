import { useState } from 'react'
import { SlidersHorizontal, X, ArrowUpRight } from 'lucide-react'
import { Button } from '@testsigmainc/ui-atoms'
import { ScenarioPicker } from './ScenarioPicker'
import { TransportBar } from './TransportBar'
import type { ScenarioMeta } from '../events/scenarios'
import type { RunState } from '../events/engine'

interface Props {
  scenarios: ScenarioMeta[]
  active: string
  onChange: (id: string) => void
  runState: RunState
  speed: number
  setSpeed: (s: number) => void
  onPlay: () => void
  onPause: () => void
  onRestart: () => void
  onStep: () => void
  elapsedMs: number
  cursor: number
  total: number
}

/**
 * Floating demo harness. Keeps the prototype view clean (like a real product)
 * while tucking the scenario switcher, transport scrubber, and catalog link
 * behind an unobtrusive toggle in the corner.
 */
export function DemoControls({
  scenarios,
  active,
  onChange,
  runState,
  speed,
  setSpeed,
  onPlay,
  onPause,
  onRestart,
  onStep,
  elapsedMs,
  cursor,
  total,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="proto-demo">
      {open && (
        <div className="proto-demo-panel" role="dialog" aria-label="Demo controls">
          <div className="proto-demo-head">
            <span>Demo controls</span>
            <button
              type="button"
              className="proto-demo-close"
              onClick={() => setOpen(false)}
              aria-label="Close demo controls"
            >
              <X size={14} />
            </button>
          </div>

          <div className="proto-demo-section-label">Scenario</div>
          <ScenarioPicker scenarios={scenarios} active={active} onChange={onChange} />

          <div className="proto-demo-section-label">Playback</div>
          <TransportBar
            state={runState}
            speed={speed}
            setSpeed={setSpeed}
            onPlay={onPlay}
            onPause={onPause}
            onRestart={onRestart}
            onStep={onStep}
            elapsedMs={elapsedMs}
            cursor={cursor}
            total={total}
          />

        </div>
      )}

      <div className="proto-demo-bar">
        <Button
          type="button"
          variant="ai"
          className="proto-demo-catalog"
          onClick={() => {
            window.location.href = '/catalog'
          }}
        >
          Event catalog <ArrowUpRight size={13} />
        </Button>
        <button
          type="button"
          className={`proto-demo-toggle ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Demo controls"
        >
          <SlidersHorizontal size={14} />
          <span>Demo</span>
        </button>
      </div>
    </div>
  )
}
