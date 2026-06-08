import { LEDGER, type LedgerRow } from './ledger'

export type TierName = 'Suppress' | 'Murmur' | 'Milestone' | 'Outcome' | 'Chat' | 'Conditional'

export interface CatalogEntry {
  /** Permalink key, e.g. "TAA:sub_agent_started". Unique across the catalog. */
  id: string
  event: string
  agent: string
  groupType: string
  lifecycle: string
  /** Current tier (as shipped) and final (designed) tier. */
  current: string
  final: TierName
  changed: boolean
  contested: boolean
  dev: boolean
  dead: boolean
  severity?: string
  rule?: string
  note?: string
  row: LedgerRow
}

/** Split the ledger `g` field "group·lifecycle" (· = U+00B7). */
function splitGroup(g: string): { groupType: string; lifecycle: string } {
  const [groupType = 'session', lifecycle = 'standalone'] = g.split('·')
  return { groupType, lifecycle }
}

function toEntry(row: LedgerRow, seen: Map<string, number>): CatalogEntry {
  const { groupType, lifecycle } = splitGroup(row.g)
  let id = `${row.a}:${row.e}`
  // De-dupe identical agent+event keys (e.g. RAA vs TPA `event`, `tool_start`).
  const n = seen.get(id) ?? 0
  seen.set(id, n + 1)
  if (n > 0) id = `${id}#${n + 1}`
  return {
    id,
    event: row.e,
    agent: row.a,
    groupType,
    lifecycle,
    current: row.c,
    final: row.f as TierName,
    changed: row.st === 'changed',
    contested: row.cont === 1,
    dev: row.dev === 1,
    dead: row.st === 'dead',
    severity: row.sev,
    rule: row.rule,
    note: row.note,
    row,
  }
}

const seen = new Map<string, number>()
export const CATALOG: CatalogEntry[] = LEDGER.map((r) => toEntry(r, seen))

/** Tier display order + token-driven accent color (resolved in CSS via class). */
export const TIER_ORDER: TierName[] = ['Murmur', 'Milestone', 'Outcome', 'Chat', 'Conditional', 'Suppress']

export const TIER_BLURB: Record<TierName, string> = {
  Murmur: 'One live, breathing status line — replaced in place, never stacked.',
  Milestone: 'The collapsible step spine — settled work with a lucide icon.',
  Outcome: 'Persistent cards + gates — saved artifacts, charts, approvals, questions.',
  Chat: 'Conversation bubbles — the user turn and assistant greetings.',
  Conditional: 'Tier depends on payload/lifecycle — both branches shown.',
  Suppress: 'Hidden from end users; surfaced only in Dev mode.',
}

export const AGENT_ORDER = ['COMMON', 'TAA', 'CAA', 'RAA', 'SCA v2', 'TPA v1', 'TPA v2', 'PR-TAA']

/** Group entries by tier, then agent, preserving the canonical orders. */
export function groupByTierAgent(entries: CatalogEntry[]) {
  const byTier = new Map<TierName, Map<string, CatalogEntry[]>>()
  for (const e of entries) {
    if (!byTier.has(e.final)) byTier.set(e.final, new Map())
    const agents = byTier.get(e.final)!
    if (!agents.has(e.agent)) agents.set(e.agent, [])
    agents.get(e.agent)!.push(e)
  }
  return TIER_ORDER.filter((t) => byTier.has(t)).map((tier) => {
    const agents = byTier.get(tier)!
    const orderedAgents = [...agents.keys()].sort(
      (a, b) => agentIdx(a) - agentIdx(b),
    )
    return { tier, agents: orderedAgents.map((a) => ({ agent: a, entries: agents.get(a)! })) }
  })
}

function agentIdx(a: string): number {
  const i = AGENT_ORDER.indexOf(a)
  return i === -1 ? 99 : i
}
