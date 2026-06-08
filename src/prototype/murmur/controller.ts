import type { MurmurSegment, RenderIntent } from '../events/types'

interface Channel {
  segment: MurmurSegment
  priority: number
  text: string
  shimmer: boolean
  /** Wall-clock ms when this channel was seated. */
  seatedAt: number
  /** TTL in ms (soft); after this, the channel decays. */
  ttlMs: number
  /** Optional hard TTL ms (for tool-open: 20s). */
  hardTtlMs?: number
  /** When true, this seat owns the segment as a tool-open. */
  isToolOpen?: boolean
  /** Dedup/correlation key. */
  dedupKey: string
  /** For tool-open: matches against tool-close by this key. */
  ownerGroupId?: string
}

interface FanOutWorker {
  signal: string
  label?: string
  startedAt: number
  done?: boolean
}

interface StallPin {
  text: string
  dedupKey: string
  hits: number
}

export interface MurmurSnapshot {
  /** [ACTION, DETAIL, THOUGHT] — null if empty. */
  segments: {
    action: { text: string; shimmer: boolean } | null
    detail: { text: string; shimmer: boolean } | null
    thought: { text: string; shimmer: boolean } | null
  }
  /** When ≥2 workers are open, this rolls up as an N-of-M strip. */
  fanOut: { open: number; total: number; labels: string[] } | null
  stallPin: { text: string } | null
  /** True iff any channel is live. */
  anyLive: boolean
}

type Listener = (snap: MurmurSnapshot) => void
type Announcer = (text: string, assertive?: boolean) => void

/** A freshly-seated channel holds its slot for at least this long (anti-flicker). */
const MIN_DWELL_MS = 600

const EMPTY_SNAPSHOT: MurmurSnapshot = {
  segments: { action: null, detail: null, thought: null },
  fanOut: null,
  stallPin: null,
  anyLive: false,
}

/**
 * MurmurController — the priority-arbitration state machine.
 *
 * Three segment slots `[ACTION · DETAIL · THOUGHT]`. Lower-priority feeders
 * may only seat in unowned segments OR their assigned segment, and never
 * displace a higher-priority seat. Each channel decays after its TTL.
 *
 * Holds outside React; surfaces via `subscribe`. Use
 * `useSyncExternalStore`-like adapters from React.
 */
export class MurmurController {
  private channels = new Map<MurmurSegment, Channel>()
  private fanOut = new Map<string, FanOutWorker>() // keyed by signal
  private stallPins = new Map<string, StallPin>()
  private listeners = new Set<Listener>()
  private lastSnapshot: MurmurSnapshot = EMPTY_SNAPSHOT
  private tickerHandle: ReturnType<typeof setInterval> | null = null
  private lastAnnouncedAt = 0
  private announceFn: Announcer | null = null
  private lastFanOutAnnounceText = ''
  /** Rate-limiter for priority-6 channel: ≤1 frame / 1.5s. */
  private lastP6At = 0

  constructor(opts: { announce?: Announcer } = {}) {
    this.announceFn = opts.announce ?? null
  }

  /** Start the decay ticker. Call once in app mount. */
  start(): void {
    if (this.tickerHandle) return
    this.tickerHandle = setInterval(() => this.tick(), 250)
  }

  stop(): void {
    if (this.tickerHandle) {
      clearInterval(this.tickerHandle)
      this.tickerHandle = null
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    fn(this.lastSnapshot)
    return () => this.listeners.delete(fn)
  }

  snapshot(): MurmurSnapshot {
    return this.lastSnapshot
  }

  /** Reset all state (between scenarios). */
  reset(): void {
    this.channels.clear()
    this.fanOut.clear()
    this.stallPins.clear()
    this.lastP6At = 0
    this.lastFanOutAnnounceText = ''
    this.emit()
  }

  /**
   * Feed a routed RenderIntent (its `.murmur` block). Most of the lattice
   * lives here.
   */
  ingest(intent: RenderIntent, eventGroupId?: string): void {
    const m = intent.murmur
    if (!m) return
    const now = performance.now()

    // Stall-pin detection: same dedupKey ≥3× → banner above the line
    const pin = this.stallPins.get(m.dedupKey)
    const hits = (pin?.hits ?? 0) + 1
    if (hits >= 3) {
      this.stallPins.set(m.dedupKey, {
        text: m.text,
        dedupKey: m.dedupKey,
        hits,
      })
    } else {
      this.stallPins.set(m.dedupKey, {
        text: m.text,
        dedupKey: m.dedupKey,
        hits,
      })
    }
    // Also clear other stall pins (only one key can be "stuck" at once).
    for (const [k, v] of this.stallPins) {
      if (k !== m.dedupKey && v.hits >= 3) v.hits = 0
    }

    // Fan-out tracking
    if (m.fanOut === 'open') {
      const signal = (intent.key || '').replace(/^sw_/, '') || m.dedupKey
      this.fanOut.set(signal, { signal, label: m.text, startedAt: now })
    }

    // Rate limit priority 6
    if (m.priority === 6) {
      if (now - this.lastP6At < 1500) {
        this.emit()
        return
      }
      this.lastP6At = now
    }

    // Decide where the feeder is allowed to seat.
    const current = this.channels.get(m.segment)
    // Minimum dwell: a freshly-seated status holds its slot for ~600ms so the
    // line stays legible and doesn't strobe at high playback speed. A strictly
    // higher-priority feeder of a DIFFERENT message is the one thing the hold
    // blocks; fan-out (priority 1), a same-key refresh, and a tool-open
    // continuation always bypass it (and decay/TTL is unaffected).
    const toolCorrelated =
      !!current && current.isToolOpen && !!m.isToolOpen && current.ownerGroupId === eventGroupId
    const freshHold =
      !!current &&
      now - current.seatedAt < MIN_DWELL_MS &&
      current.dedupKey !== m.dedupKey &&
      !toolCorrelated &&
      m.priority !== 1
    const canSeat =
      !freshHold &&
      (!current ||
        m.priority < current.priority || // lower number = higher priority
        toolCorrelated)

    // Special: fan-out (priority 1) always owns ACTION while ≥2 workers
    const openWorkers = [...this.fanOut.values()].filter((w) => !w.done).length
    if (openWorkers >= 2) {
      this.channels.set('action', {
        segment: 'action',
        priority: 1,
        text: `Running ${openWorkers} workers in parallel`,
        shimmer: true,
        seatedAt: now,
        ttlMs: 30_000,
        dedupKey: 'fanout',
      })
    } else if (canSeat) {
      this.channels.set(m.segment, {
        segment: m.segment,
        priority: m.priority,
        text: m.text,
        shimmer: m.shimmer ?? false,
        seatedAt: now,
        ttlMs: m.ttlMs,
        hardTtlMs: m.isToolOpen ? 20_000 : undefined,
        isToolOpen: m.isToolOpen,
        dedupKey: m.dedupKey,
        ownerGroupId: eventGroupId,
      })
    } else if (
      m.priority === 7 &&
      !this.channels.get('thought')
    ) {
      // reasoning always allowed into THOUGHT if empty
      this.channels.set('thought', {
        segment: 'thought',
        priority: 7,
        text: m.text,
        shimmer: false,
        seatedAt: now,
        ttlMs: m.ttlMs,
        dedupKey: m.dedupKey,
      })
    }

    this.emit()

    // aria-live announce, throttled to ≤1/1.5s, most-important segment only
    this.maybeAnnounce(now)
  }

  /** Settle a tool-open ACTION seat (called on tool_completed / tool_failed). */
  closeToolOpen(groupId: string | undefined): void {
    if (!groupId) return
    const a = this.channels.get('action')
    if (a?.isToolOpen && a.ownerGroupId === groupId) {
      this.channels.delete('action')
      this.emit()
    }
  }

  /** Mark a fan-out worker as completed. */
  closeFanOut(signal: string | undefined): void {
    if (!signal) return
    const w = this.fanOut.get(signal)
    if (w) {
      w.done = true
      const openWorkers = [...this.fanOut.values()].filter((w) => !w.done).length
      if (openWorkers < 2) {
        // strip dissolves
        const a = this.channels.get('action')
        if (a?.dedupKey === 'fanout') this.channels.delete('action')
      }
      this.emit()
    }
  }

  /** Force-clear all (e.g. on session_complete). */
  clear(): void {
    this.channels.clear()
    this.fanOut.clear()
    this.stallPins.clear()
    this.emit()
  }

  private tick(): void {
    const now = performance.now()
    let changed = false
    for (const [segment, ch] of this.channels) {
      const age = now - ch.seatedAt
      const expired = ch.hardTtlMs
        ? age > ch.hardTtlMs
        : age > ch.ttlMs
      if (expired) {
        this.channels.delete(segment)
        changed = true
      }
    }
    // Drop fan-out workers idle for > 30s (failsafe)
    for (const [signal, w] of this.fanOut) {
      if (!w.done && now - w.startedAt > 30_000) {
        this.fanOut.delete(signal)
        changed = true
      }
    }
    if (changed) this.emit()
  }

  private maybeAnnounce(now: number): void {
    if (!this.announceFn) return
    if (now - this.lastAnnouncedAt < 1500) return
    const a = this.channels.get('action')
    const d = this.channels.get('detail')
    const th = this.channels.get('thought')
    const top = a ?? d ?? th
    if (!top) return
    if (top.text === this.lastFanOutAnnounceText) return
    this.lastFanOutAnnounceText = top.text
    this.announceFn(top.text, false)
    this.lastAnnouncedAt = now
  }

  private emit(): void {
    const action = this.channels.get('action')
    const detail = this.channels.get('detail')
    const thought = this.channels.get('thought')
    const openWorkers = [...this.fanOut.values()].filter((w) => !w.done)
    const fanOutSnap =
      openWorkers.length >= 2
        ? {
            open: openWorkers.length,
            total: this.fanOut.size,
            labels: openWorkers.map((w) => w.label ?? w.signal),
          }
        : null

    // Find stall pin (any with hits ≥3)
    let pinSnap: { text: string } | null = null
    for (const v of this.stallPins.values()) {
      if (v.hits >= 3) {
        pinSnap = { text: v.text }
        break
      }
    }

    const snap: MurmurSnapshot = {
      segments: {
        action: action
          ? { text: action.text, shimmer: action.shimmer }
          : null,
        detail: detail
          ? { text: detail.text, shimmer: detail.shimmer }
          : null,
        thought: thought
          ? { text: thought.text, shimmer: thought.shimmer }
          : null,
      },
      fanOut: fanOutSnap,
      stallPin: pinSnap,
      anyLive:
        !!action ||
        !!detail ||
        !!thought ||
        (fanOutSnap != null) ||
        pinSnap != null,
    }
    this.lastSnapshot = snap
    for (const fn of this.listeners) fn(snap)
  }
}

/** React adapter using useSyncExternalStore semantics. */
import { useSyncExternalStore } from 'react'

export function useMurmur(controller: MurmurController): MurmurSnapshot {
  return useSyncExternalStore(
    (cb) => controller.subscribe(cb),
    () => controller.snapshot(),
    () => controller.snapshot(),
  )
}
