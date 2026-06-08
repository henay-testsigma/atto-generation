import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import type { RunState } from '../events/engine'

interface Props {
  state: RunState
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

function clock(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export function TransportBar({
  state,
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
  const playing = state === 'playing'
  return (
    <div className="proto-transport">
      <button
        type="button"
        onClick={playing ? onPause : onPlay}
        aria-label={playing ? 'Pause' : 'Play'}
        className="proto-icon-btn"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <button
        type="button"
        onClick={onStep}
        aria-label="Step"
        className="proto-icon-btn"
        title="Step"
      >
        <SkipForward size={13} />
      </button>
      <button
        type="button"
        onClick={onRestart}
        aria-label="Restart"
        className="proto-icon-btn"
        title="Restart"
      >
        <RotateCcw size={13} />
      </button>
      <div className="proto-transport-divider" />
      <span className="proto-transport-clock">{clock(elapsedMs)}</span>
      <span className="proto-transport-cursor">
        {cursor}/{total}
      </span>
      <div className="proto-transport-divider" />
      <label className="proto-transport-speed">
        <span>Speed</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          aria-label="Speed"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </label>
    </div>
  )
}
