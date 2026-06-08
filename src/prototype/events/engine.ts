import { useEffect, useRef, useState, useCallback } from 'react'
import type { AgentEvent } from './types'
import { normalize } from './normalize'

export type RunState = 'idle' | 'playing' | 'paused' | 'complete'

export interface EngineOptions {
  speed: number
  autoplay: boolean
}

/**
 * useEventEngine — virtual clock that walks a scenario (an ordered array of
 * `AgentEvent` records each carrying a tDelta in ms). It emits normalized
 * events at the right wall-clock times, supports play/pause/restart/step,
 * and exposes speed.
 *
 * The engine does NOT decide what tier each event renders into — that's the
 * router's job. The engine is purely a clock + emitter so the prototype's
 * stream feels exactly like the live websocket would.
 */
export function useEventEngine(
  scenarioEvents: AgentEvent[] | null,
  onEmit: (e: AgentEvent) => void,
) {
  const [state, setState] = useState<RunState>('idle')
  const [speed, setSpeed] = useState(1)
  const [cursor, setCursor] = useState(0) // index of next event to emit
  const [elapsedMs, setElapsedMs] = useState(0)

  const cursorRef = useRef(cursor)
  const stateRef = useRef<RunState>(state)
  const speedRef = useRef(speed)
  const elapsedRef = useRef(elapsedMs)
  const lastTickRef = useRef<number | null>(null)
  const accRef = useRef(0) // accumulated wall-clock toward next event
  const onEmitRef = useRef(onEmit)
  const scenarioRef = useRef(scenarioEvents)

  // keep refs in sync
  cursorRef.current = cursor
  stateRef.current = state
  speedRef.current = speed
  elapsedRef.current = elapsedMs
  onEmitRef.current = onEmit
  scenarioRef.current = scenarioEvents

  // raf loop — runs while playing.
  useEffect(() => {
    if (state !== 'playing') {
      lastTickRef.current = null
      return
    }
    let frame: number
    const tick = (now: number) => {
      if (lastTickRef.current == null) {
        lastTickRef.current = now
      }
      const dt = (now - lastTickRef.current) * speedRef.current
      lastTickRef.current = now
      elapsedRef.current += dt
      setElapsedMs(elapsedRef.current)
      accRef.current += dt
      const s = scenarioRef.current ?? []
      while (cursorRef.current < s.length) {
        const next = s[cursorRef.current]
        const wait = next.tDelta ?? 0
        if (accRef.current >= wait) {
          accRef.current -= wait
          try {
            const evt = normalize(next as unknown as Record<string, unknown>)
            onEmitRef.current(evt)
          } catch (err) {
            console.error('event emit error', err, next)
          }
          cursorRef.current += 1
          setCursor(cursorRef.current)
        } else {
          break
        }
      }
      if (cursorRef.current >= s.length) {
        setState('complete')
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [state])

  const play = useCallback(() => {
    if (!scenarioRef.current || scenarioRef.current.length === 0) return
    setState('playing')
  }, [])

  const pause = useCallback(() => {
    if (stateRef.current === 'playing') setState('paused')
  }, [])

  const restart = useCallback(() => {
    cursorRef.current = 0
    accRef.current = 0
    elapsedRef.current = 0
    lastTickRef.current = null
    setCursor(0)
    setElapsedMs(0)
    setState('idle')
  }, [])

  const step = useCallback(() => {
    const s = scenarioRef.current ?? []
    if (cursorRef.current >= s.length) return
    const next = s[cursorRef.current]
    try {
      const evt = normalize(next as unknown as Record<string, unknown>)
      onEmitRef.current(evt)
    } catch (err) {
      console.error('step error', err)
    }
    cursorRef.current += 1
    accRef.current = 0
    setCursor(cursorRef.current)
    if (cursorRef.current >= s.length) setState('complete')
  }, [])

  return {
    state,
    speed,
    setSpeed,
    cursor,
    elapsedMs,
    play,
    pause,
    restart,
    step,
  }
}
