#!/usr/bin/env node
/**
 * Extract the seed object from the legacy single-file app (`../index.html`)
 * and emit a TypeScript module at `src/state/seed.ts`.
 *
 * Strategy: locate each named seed variable (i1, t1, e1, …) in the minified
 * source, take its value expression up to the next `=` or `;`, eval each in
 * a shared scope, then JSON-stringify the result with the same key names
 * the legacy useReducer call uses.
 *
 * The minified source uses valid JS syntax (`!1` for false, `!0` for true,
 * `2e7` for 20000000), so `Function('return ' + expr)()` evaluates cleanly.
 *
 * Run: `node scripts/extract-seed.mjs`
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const legacyPath = resolve(here, '../../index.html')
const outPath = resolve(here, '../src/state/seed.ts')

const source = readFileSync(legacyPath, 'utf8')

/**
 * Pull the value of a top-level `name = <expr>` assignment out of the
 * minified source. Returns the raw expression string (no `name = ` prefix
 * and no trailing `,` or `;`).
 */
function extractValue(name) {
  // Escape regex meta chars in name (e.g. `$c`), then use a manual
  // look-behind for a non-identifier char so we don't match `xy$c=` mid-token.
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startRe = new RegExp(`(?:^|[^\\w$])(${esc})\\s*=\\s*`, 'g')
  const m = startRe.exec(source)
  if (!m) throw new Error(`Couldn't find ${name}=`)
  const start = m.index + m[0].length
  // Walk forward respecting strings, balanced [], {}, () until depth returns
  // to zero AND we hit a top-level `,` followed by an identifier-then-`=`, or
  // a top-level `;`.
  let depth = 0
  let inStr = null
  let i = start
  let escaped = false
  while (i < source.length) {
    const c = source[i]
    if (inStr) {
      if (escaped) {
        escaped = false
      } else if (c === '\\') {
        escaped = true
      } else if (c === inStr) {
        inStr = null
      }
    } else {
      if (c === '"' || c === "'" || c === '`') {
        inStr = c
      } else if (c === '[' || c === '{' || c === '(') {
        depth++
      } else if (c === ']' || c === '}' || c === ')') {
        depth--
      } else if (depth === 0) {
        if (c === ',' || c === ';') {
          // Peek to confirm the comma starts another top-level decl
          // (`,foo=` or `,foo:` — only the former is what we want; the latter
          // would mean we're actually inside an object literal).
          if (c === ';') break
          // Look ahead for `<ident>=` (assignment) — not `<ident>:` (object key).
          const rest = source.slice(i + 1, i + 60)
          if (/^[A-Za-z_$][\w$]*\s*=/.test(rest)) break
        }
      }
    }
    i++
  }
  return source.slice(start, i)
}

/**
 * Top-level seed variables in the legacy app (see ARCHITECTURE.md §6/§7).
 * The right-hand value is the legacy variable name.
 */
const TOP_LEVEL = {
  projects: 'i1',
  clients: 't1',
  suppliers: 'e1',
  materials: 'l1',
  estimates: 'd1',
  leads: 'a1',
  subs: 'n1',
  milestones: 's1',
  selections: 'r1',
  timesheets: 'f1',
  purchases: 'o1',
  diary: 'u1',
  retention: 'c1',
  claims: 'sw_claims',
  rfis: 'sw_rfis',
  defects: 'sw_defects',
}

/**
 * BOQ templates and the inline primeCostItems / provisionalSums dicts live
 * in different shapes — handle separately.
 *
 * The templates var in the legacy source is `$c` (confirmed by inspecting
 * the assignment site preceding `id:"TPL-001"`).
 */
function extractTemplates() {
  return { varName: '$c', value: extractValue('$c') }
}

function extractInlineDict(label) {
  // primeCostItems:{...} and provisionalSums:{...} are inline in the
  // useReducer call. Locate `<label>:{` and walk to matching `}`.
  const needle = `${label}:{`
  const start = source.lastIndexOf(needle)
  if (start < 0) throw new Error(`Inline dict ${label} not found`)
  let i = start + needle.length
  let depth = 1
  while (i < source.length && depth > 0) {
    const c = source[i]
    if (c === '{') depth++
    else if (c === '}') depth--
    i++
  }
  return source.slice(start + label.length + 1, i)
}

// Build a shared scope and eval each value
const scope = {}
for (const [tsKey, legacyName] of Object.entries(TOP_LEVEL)) {
  const expr = extractValue(legacyName)
  scope[tsKey] = Function('return ' + expr)()
}

const templates = extractTemplates()
scope.templates = Function('return ' + templates.value)()

scope.primeCostItems = Function('return ' + extractInlineDict('primeCostItems'))()
scope.provisionalSums = Function('return ' + extractInlineDict('provisionalSums'))()
scope.settings = {}

// Cosmetic: stable key order so diffs are minimal
const ORDER = [
  'projects',
  'clients',
  'subs',
  'leads',
  'estimates',
  'materials',
  'suppliers',
  'templates',
  'milestones',
  'diary',
  'timesheets',
  'defects',
  'selections',
  'claims',
  'purchases',
  'primeCostItems',
  'provisionalSums',
  'rfis',
  'retention',
  'settings',
]

const ordered = {}
for (const key of ORDER) {
  if (!(key in scope)) throw new Error(`Missing seed key: ${key}`)
  ordered[key] = scope[key]
}

// Sanity report
const report = []
for (const [k, v] of Object.entries(ordered)) {
  if (Array.isArray(v)) report.push(`  ${k}: ${v.length} records`)
  else if (v && typeof v === 'object') report.push(`  ${k}: ${Object.keys(v).length} keys`)
  else report.push(`  ${k}: ${typeof v}`)
}
console.error('Extracted seed:')
console.error(report.join('\n'))

const json = JSON.stringify(ordered, null, 2)

const tsOut = `/**
 * Seed data — extracted verbatim from the legacy single-file app's
 * \`index.html\` initial useReducer state.
 *
 * Generated by \`scripts/extract-seed.mjs\` — do not edit by hand.
 * Re-run the script to regenerate after editing the legacy seed.
 *
 * The cast at the bottom is intentional: hand-typing every value would
 * duplicate the type definitions and add no safety. The legacy shape is
 * already trusted (it's the seed the production app has been running on).
 * Phase 5 transforms will live in migration scripts, not here.
 */
import type { RootState } from '@/types'

const RAW = ${json} as const

export const seed: RootState = RAW as unknown as RootState
`

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, tsOut, 'utf8')
console.error(`\nWrote ${outPath} (${(tsOut.length / 1024).toFixed(1)} KB)`)
