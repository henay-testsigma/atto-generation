import { useMemo, useState, useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { ChevronLeft, Search } from 'lucide-react'
import {
  CATALOG,
  TIER_ORDER,
  TIER_BLURB,
  groupByTierAgent,
  type CatalogEntry,
  type TierName,
} from './catalogData'
import { iconFor } from './icons'
import { payloadFor } from './payloads'
import { EventPreview, liveTier } from './EventPreview'
import { AvatarRobot } from '../components/AvatarRobot'
import '../styles.css'
import './catalog.css'

type FlagFilter = 'changed' | 'contested' | 'dev'

function highlightJson(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2)
  const esc = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let cls = 'tok-num'
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'tok-key' : 'tok-str'
      else if (/true|false|null/.test(m)) cls = 'tok-bool'
      return `<span class="${cls}">${m}</span>`
    },
  )
}

export function CatalogPage() {
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<Set<TierName>>(new Set())
  const [flagFilter, setFlagFilter] = useState<Set<FlagFilter>>(new Set())
  const [selectedId, setSelectedId] = useState<string>(() => {
    const h = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    return CATALOG.some((e) => e.id === h) ? h : CATALOG[0].id
  })
  const [animate, setAnimate] = useState(false)

  // Sync selection ↔ permalink hash.
  useEffect(() => {
    const onHash = () => {
      const h = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      if (CATALOG.some((e) => e.id === h)) setSelectedId(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const select = (id: string) => {
    setSelectedId(id)
    setAnimate(false)
    window.history.replaceState(null, '', `#${encodeURIComponent(id)}`)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CATALOG.filter((e) => {
      if (tierFilter.size && !tierFilter.has(e.final)) return false
      for (const f of flagFilter) if (!e[f]) return false
      if (!q) return true
      return (
        e.event.toLowerCase().includes(q) ||
        e.agent.toLowerCase().includes(q) ||
        e.groupType.toLowerCase().includes(q) ||
        (e.note ?? '').toLowerCase().includes(q)
      )
    })
  }, [query, tierFilter, flagFilter])

  const grouped = useMemo(() => groupByTierAgent(filtered), [filtered])
  const selected = CATALOG.find((e) => e.id === selectedId) ?? CATALOG[0]

  const toggleTier = (t: TierName) =>
    setTierFilter((s) => {
      const n = new Set(s)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })
  const toggleFlag = (f: FlagFilter) =>
    setFlagFilter((s) => {
      const n = new Set(s)
      n.has(f) ? n.delete(f) : n.add(f)
      return n
    })

  return (
    <MotionConfig reducedMotion="user">
      <div className="cat-root">
        <header className="cat-header">
          <a className="cat-back" href="/">
            <ChevronLeft size={14} /> Prototype
          </a>
          <AvatarRobot size={22} />
          <div className="cat-header-titles">
            <div className="cat-header-title">Event Render Catalog</div>
            <div className="cat-header-sub">{CATALOG.length} events · how the frontend renders each tier</div>
          </div>
        </header>

        <div className="cat-body">
          {/* LEFT — filterable index */}
          <aside className="cat-index">
            <div className="cat-search">
              <Search size={14} aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, agents, notes…"
                aria-label="Search events"
              />
            </div>
            <div className="cat-filters">
              {TIER_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`cat-chip tier-${t.toLowerCase()} ${tierFilter.has(t) ? 'is-on' : ''}`}
                  onClick={() => toggleTier(t)}
                >
                  {t}
                </button>
              ))}
              {(['changed', 'contested', 'dev'] as FlagFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`cat-chip flag ${flagFilter.has(f) ? 'is-on' : ''}`}
                  onClick={() => toggleFlag(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="cat-list">
              {grouped.map(({ tier, agents }) => (
                <div key={tier} className="cat-tier-group">
                  <div className={`cat-tier-head tier-${tier.toLowerCase()}`} title={TIER_BLURB[tier]}>
                    <span className="cat-tier-dot" />
                    {tier}
                    <span className="cat-tier-count">
                      {agents.reduce((n, a) => n + a.entries.length, 0)}
                    </span>
                  </div>
                  {agents.map(({ agent, entries }) => (
                    <div key={agent} className="cat-agent-group">
                      <div className="cat-agent-head">{agent}</div>
                      {entries.map((entry) => {
                        const Icon = iconFor(entry)
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            className={`cat-row ${entry.id === selectedId ? 'is-sel' : ''}`}
                            onClick={() => select(entry.id)}
                          >
                            <Icon size={13} className="cat-row-icon" aria-hidden />
                            <span className="cat-row-name">{entry.event}</span>
                            {entry.changed && <span className="cat-row-flag changed" title="CHANGED">▲</span>}
                            {entry.contested && <span className="cat-row-flag contested" title="CONTESTED">◆</span>}
                            {entry.dev && <span className="cat-row-flag dev" title="DEV">⚙</span>}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && <div className="cat-empty">No events match.</div>}
            </div>
          </aside>

          {/* RIGHT — detail */}
          <main className="cat-detail" key={selected.id}>
            <DetailPanel entry={selected} animate={animate} onToggleAnimate={() => setAnimate((v) => !v)} />
          </main>
        </div>
      </div>
    </MotionConfig>
  )
}

function DetailPanel({
  entry,
  animate,
  onToggleAnimate,
}: {
  entry: CatalogEntry
  animate: boolean
  onToggleAnimate: () => void
}) {
  const payload = payloadFor(entry)
  const [rail, setRail] = useState(false)
  return (
    <>
      <div className="cat-detail-head">
        <div>
          <div className="cat-detail-event">{entry.event}</div>
          <div className="cat-detail-agent">{entry.agent}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="cat-width-toggle" role="group" aria-label="Preview width">
          <button type="button" className={!rail ? 'is-on' : ''} onClick={() => setRail(false)}>Full</button>
          <button type="button" className={rail ? 'is-on' : ''} onClick={() => setRail(true)}>Rail</button>
        </div>
        <button type="button" className={`cat-animate ${animate ? 'is-on' : ''}`} onClick={onToggleAnimate}>
          ▶ {animate ? 'animating' : 'animate'}
        </button>
      </div>

      {/* metadata chips */}
      <div className="cat-meta">
        <span className={`cat-meta-chip tier-${entry.final.toLowerCase()}`}>
          {entry.current !== entry.final ? `${entry.current} → ${entry.final}` : entry.final}
        </span>
        {entry.final !== 'Conditional' && liveTier(entry) !== entry.final && (
          <span
            className="cat-meta-chip flag-drift"
            title="The live router assigns a different tier than the documented decision. Reconcile router.ts or the ledger."
          >
            ⚠ live: {liveTier(entry)} · doc: {entry.final}
          </span>
        )}
        <span className="cat-meta-chip neutral">{entry.groupType}</span>
        <span className="cat-meta-chip neutral">{entry.lifecycle}</span>
        {entry.severity && <span className={`cat-meta-chip sev-${entry.severity.toLowerCase()}`}>{entry.severity}</span>}
        {entry.changed && <span className="cat-meta-chip flag-changed">CHANGED</span>}
        {entry.contested && <span className="cat-meta-chip flag-contested">CONTESTED</span>}
        {entry.dev && <span className="cat-meta-chip flag-dev">DEV-ONLY</span>}
        {entry.dead && <span className="cat-meta-chip flag-dead">DEAD</span>}
      </div>

      {/* live preview */}
      <section className="cat-section">
        <h3 className="cat-section-title">
          Rendered component
          {rail && <span className="cat-section-hint"> · collapsed chat width (~340px)</span>}
        </h3>
        <div className={`cat-preview ${rail ? 'is-rail' : ''}`} key={`${entry.id}-${animate}-${rail}`}>
          <EventPreview entry={entry} animate={animate} />
        </div>
      </section>

      {/* payload */}
      <section className="cat-section">
        <h3 className="cat-section-title">Trigger payload</h3>
        <pre className="cat-json" dangerouslySetInnerHTML={{ __html: highlightJson(payload) }} />
      </section>

      {/* handling notes */}
      <section className="cat-section">
        <h3 className="cat-section-title">Frontend handling</h3>
        {entry.rule && (
          <div className="cat-note cat-note-rule">
            <strong>Rule:</strong> {entry.rule}
          </div>
        )}
        <div className="cat-note">{entry.note ?? 'Render via its tier component; bind payload fields by lifecycle (start opens / progress updates by group_id / end closes).'}</div>
      </section>
    </>
  )
}
