/**
 * Parity screenshots — captures every screen of the legacy baseline (:8766)
 * and the Vite app (:5173) side by side into test-results/parity/.
 *
 * The legacy app is state-driven (no URLs): the script clicks through its
 * top nav / project tabs by visible text. The Vite side navigates by route
 * with the splash skipped (except for the splash capture itself).
 *
 * Run with both servers up:
 *   cd legacy && python3 -m http.server 8766 --bind 127.0.0.1
 *   npm run dev
 *   node scripts/parity-shots.mjs
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const OUT = 'test-results/parity'
mkdirSync(OUT, { recursive: true })

const VIEWPORT = { width: 1440, height: 900 }
const LEGACY = 'http://127.0.0.1:8766/'
const VITE = 'http://localhost:5173'

const TOP_PAGES = [
  ['dashboard', 'Dashboard', '/'],
  ['projects', 'Projects', '/projects'],
  ['leads', 'Leads / Tender', '/leads'],
  ['estimating', 'Estimating', '/estimating'],
  ['clients', 'Clients', '/clients'],
  ['subs', 'Subcontractors', '/subs'],
  ['help', 'Help & Learn', '/education'],
  ['settings', 'Settings', '/settings'],
]

const PROJECT_TABS = [
  ['overview', 'Overview', 'overview'],
  ['boq', 'BOQ & Budget', 'boq'],
  ['pcps', 'PC & PS', 'pcps'],
  ['variations', 'Variations', 'variations'],
  ['invoices', 'Invoices', 'invoices'],
  ['purchases', 'Purchase Orders', 'purchases'],
  ['claims', 'Progress Claims', 'claims'],
  ['defects', 'Defects', 'defects'],
  ['schedule', 'Schedule', 'schedule'],
  ['diary', 'Site Diary', 'diary'],
  ['rfis', 'RFI Register', 'rfis'],
  ['selections', 'Client Selections', 'selections'],
  ['timesheets', 'Timesheets', 'timesheets'],
  ['calendar', 'Calendar', 'calendar'],
  ['openbook', 'Open Book', 'openbook'],
  ['cashflow', 'Cash Flow', 'cashflow'],
]

const browser = await chromium.launch()

// ── Legacy side ────────────────────────────────────────────────────────────
const lp = await browser.newPage({ viewport: VIEWPORT })
await lp.goto(LEGACY)
await lp.waitForTimeout(700)
await lp.screenshot({ path: `${OUT}/splash--legacy.png` })
await lp.mouse.click(720, 450)
await lp.waitForTimeout(900)

async function legacyNav(label) {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const el = lp.getByText(new RegExp(`^${esc}$`, 'i')).first()
  if ((await el.count()) === 0) return false
  await el.click()
  await lp.waitForTimeout(600)
  return true
}

for (const [name, label] of TOP_PAGES) {
  const ok = await legacyNav(label)
  if (!ok) {
    console.log(`legacy nav miss: ${label}`)
    continue
  }
  await lp.screenshot({ path: `${OUT}/${name}--legacy.png` })
}

// open first project for the tab set
await legacyNav('PROJECTS')
const firstProject = lp.getByText('Akademie').first()
if (await firstProject.count()) {
  await firstProject.click()
  await lp.waitForTimeout(700)
  for (const [name, label] of PROJECT_TABS) {
    const ok = await legacyNav(label)
    if (!ok) {
      console.log(`legacy tab miss: ${label}`)
      continue
    }
    await lp.screenshot({ path: `${OUT}/project-${name}--legacy.png` })
  }
}

// one open modal for form parity
await legacyNav('CLIENTS')
const addClient = lp.getByText('+ New Client', { exact: true }).first()
if (await addClient.count()) {
  await addClient.click()
  await lp.waitForTimeout(400)
  await lp.screenshot({ path: `${OUT}/modal-client--legacy.png` })
}
await lp.close()

// ── Vite side ──────────────────────────────────────────────────────────────
const vp = await browser.newPage({ viewport: VIEWPORT })
await vp.goto(VITE + '/')
await vp.waitForTimeout(900)
await vp.screenshot({ path: `${OUT}/splash--vite.png` })
await vp.evaluate(() => sessionStorage.setItem('sw:skipSplash', '1'))

for (const [name, , route] of TOP_PAGES) {
  await vp.goto(VITE + route)
  await vp.waitForTimeout(600)
  await vp.screenshot({ path: `${OUT}/${name}--vite.png` })
}
for (const [name, , tab] of PROJECT_TABS) {
  await vp.goto(`${VITE}/projects/PRJ-001/${tab}`)
  await vp.waitForTimeout(600)
  await vp.screenshot({ path: `${OUT}/project-${name}--vite.png` })
}
await vp.goto(VITE + '/clients')
await vp.waitForTimeout(500)
const addBtn = vp.getByRole('button', { name: /New Client/i }).first()
if (await addBtn.count()) {
  await addBtn.click()
  await vp.waitForTimeout(400)
  await vp.screenshot({ path: `${OUT}/modal-client--vite.png` })
}
await vp.close()

await browser.close()
console.log('parity shots complete →', OUT)
