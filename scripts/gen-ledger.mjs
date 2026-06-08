#!/usr/bin/env node
// Generates src/prototype/catalog/ledger.ts from the `const D=[…]` ledger block
// embedded in tier-decision-doc.html — the single authoritative event→tier
// decision record. Edit the doc, then run `npm run gen:ledger`.
//
// Usage: node scripts/gen-ledger.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOC = join(root, 'tier-decision-doc.html')
const OUT = join(root, 'src/prototype/catalog/ledger.ts')

const html = readFileSync(DOC, 'utf8')
const m = html.match(/const\s+D\s*=\s*(\[[\s\S]*?\]);/)
if (!m) {
  console.error('ERROR: could not find `const D=[…]` block in tier-decision-doc.html')
  process.exit(1)
}

// The block is plain JS object-literal data (unquoted keys). eval in a sandboxed
// expression position is safe here: the input is our own committed doc.
let rows
try {
  rows = eval(m[1])
} catch (err) {
  console.error('ERROR: failed to parse the D ledger block:', err.message)
  process.exit(1)
}

if (!Array.isArray(rows) || !rows.length) {
  console.error('ERROR: ledger block parsed to a non-array / empty array')
  process.exit(1)
}

// Stable field order so the generated file diffs cleanly.
const ORDER = ['e', 'a', 'g', 'c', 'f', 'st', 'dev', 'cont', 'sev', 'rule', 'note']
const ordered = rows.map((r) => {
  const o = {}
  for (const k of ORDER) if (r[k] !== undefined) o[k] = r[k]
  // preserve any unexpected extra keys (forward-compatible)
  for (const k of Object.keys(r)) if (!(k in o)) o[k] = r[k]
  return o
})

const header = `// AUTO-GENERATED from tier-decision-doc.html (const D ledger) by scripts/gen-ledger.mjs.
// Do not edit by hand — edit the doc and run \`npm run gen:ledger\`.
// Fields: e=event, a=agent, g=group·lifecycle, c=current tier, f=final tier,
// st=status(keep|changed|dead), dev, cont(contested), sev, rule, note.

export interface LedgerRow {
  e: string
  a: string
  g: string
  c: string
  f: string
  st?: string
  dev?: number
  cont?: number
  sev?: string
  rule?: string
  note?: string
}

export const LEDGER: LedgerRow[] = ${JSON.stringify(ordered, null, 2)}
`

writeFileSync(OUT, header)
console.log(`gen-ledger: wrote ${ordered.length} rows → ${OUT}`)
