import { useState } from 'react'
import {
  gettingStarted,
  glossary,
  moduleDocs,
  rawlinsonCoverage,
  rawlinsonFactors,
} from './educationContent'

type Tab = 'start' | 'modules' | 'glossary' | 'rawlinson'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'start', label: 'Getting Started' },
  { id: 'modules', label: 'Module Guides' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'rawlinson', label: 'Rawlinson Rates' },
]

/**
 * Help & Education — transliteration of legacy `X1` (R8, PARITY gap 6):
 * four tab chips (ink-filled active), then per tab —
 *
 *   Getting Started: 280px guide list + detail (20px title, pre-line body,
 *   STEPS eyebrow with numbered ink circles).
 *   Module Guides: same pattern with a "Pro Tip" callout (bg panel, 3px
 *   ink left rule).
 *   Glossary: "14 terms" eyebrow, 200px term / definition grid rows.
 *   Rawlinson Rates: handbook copy + Coverage list, Regional Location
 *   Factors with green/violet gradient bars, and the location-factor note.
 *
 * All copy is the legacy `wi` blob verbatim (educationContent.ts).
 */
export function EducationPage() {
  const [tab, setTab] = useState<Tab>('start')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const guide = gettingStarted.find((g) => g.id === (selectedId || 'gs-1'))
  const moduleDoc = moduleDocs.find((m) => m.id === (selectedId || 'mod-1'))

  return (
    <div className="sw-page">
      <header className="mb-7">
        <h1 className="mb-1.5 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
          Help & Education
        </h1>
        <p className="text-[13px] text-sw-dim">Learn how to get the most from SITEWORK.</p>
      </header>

      {/* Legacy X1 tab chips: ink-filled active, bg otherwise. */}
      <div className="mb-8 flex gap-1.5 border-b border-sw-rule pb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setSelectedId(null)
            }}
            className="cursor-pointer rounded-[1px] px-3.5 py-[7px] text-[12px]"
            style={{
              background: tab === t.id ? 'var(--sw-ink)' : 'var(--sw-bg)',
              color: tab === t.id ? '#fff' : 'var(--sw-dim)',
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Getting Started ────────────────────────────────────────────── */}
      {tab === 'start' && (
        <div className="grid grid-cols-[280px_1fr] gap-12">
          <div>
            {gettingStarted.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className="cursor-pointer border-b border-sw-rule py-3"
              >
                <div
                  className="text-[13px]"
                  style={{
                    fontWeight: (selectedId || 'gs-1') === g.id ? 700 : 500,
                    color: (selectedId || 'gs-1') === g.id ? 'var(--sw-ink)' : 'var(--sw-ink)',
                  }}
                >
                  {g.title}
                </div>
              </div>
            ))}
          </div>
          {guide && (
            <div>
              <h2 className="mb-4 text-[20px] font-bold tracking-[-0.02em] text-sw-ink">
                {guide.title}
              </h2>
              <div className="mb-6 whitespace-pre-line text-[14px] leading-[1.8] text-sw-dim">
                {guide.body}
              </div>
              <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
                Steps
              </div>
              {guide.steps.map((step, i) => (
                <div key={i} className="mb-3 flex items-start gap-3.5">
                  <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-sw-ink text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="pt-[3px] text-[13px] leading-normal text-sw-dim">{step}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Module Guides ──────────────────────────────────────────────── */}
      {tab === 'modules' && (
        <div className="grid grid-cols-[280px_1fr] gap-12">
          <div>
            {moduleDocs.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="cursor-pointer border-b border-sw-rule py-3"
              >
                <div
                  className="text-[13px] text-sw-ink"
                  style={{ fontWeight: (selectedId || 'mod-1') === m.id ? 700 : 500 }}
                >
                  {m.title}
                </div>
              </div>
            ))}
          </div>
          {moduleDoc && (
            <div>
              <h2 className="mb-4 text-[20px] font-bold tracking-[-0.02em] text-sw-ink">
                {moduleDoc.title}
              </h2>
              <div className="mb-6 whitespace-pre-line text-[14px] leading-[1.8] text-sw-dim">
                {moduleDoc.body}
              </div>
              <div
                className="bg-sw-bg px-5 py-3.5"
                style={{ borderLeft: '3px solid var(--sw-ink)' }}
              >
                <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-ink">
                  Pro Tip
                </div>
                <div className="text-[13px] leading-relaxed text-sw-dim">{moduleDoc.tip}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Glossary ───────────────────────────────────────────────────── */}
      {tab === 'glossary' && (
        <div className="max-w-[720px]">
          <div className="mb-4 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
            {glossary.length} terms
          </div>
          {glossary.map((g) => (
            <div
              key={g.term}
              className="grid grid-cols-[200px_1fr] items-start gap-6 border-b border-sw-rule py-3.5"
            >
              <div className="text-[13px] font-bold text-sw-ink">{g.term}</div>
              <div className="text-[13px] leading-relaxed text-sw-dim">{g.def}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rawlinson Rates ────────────────────────────────────────────── */}
      {tab === 'rawlinson' && (
        <div className="mb-8 grid grid-cols-2 gap-12">
          <div>
            <h2 className="mb-2.5 text-[18px] font-bold tracking-[-0.02em] text-sw-ink">
              Rawlinson's Australian Construction Handbook
            </h2>
            <p className="mb-4 text-[13px] leading-[1.8] text-sw-dim">
              Published annually since 1973, Rawlinson's is Australia's most authoritative source of
              construction cost data. The handbook covers labour, material and subcontractor rates
              across all trades, with regional multipliers for every state and territory.
            </p>
            <p className="mb-5 text-[13px] leading-[1.8] text-sw-dim">
              SITEWORK integrates Rawlinson rate data directly into the BOQ and Estimating modules.
              When adding line items, click <strong>Rawlinson Lookup</strong> to search and apply
              benchmark rates. Rates are adjusted automatically for your selected region and indexed
              to the current edition.
            </p>
            <div className="border-y border-sw-rule py-3.5">
              <div className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
                Coverage
              </div>
              {rawlinsonCoverage.map((item, i) => (
                <div
                  key={item}
                  className="py-1 text-[12px] text-sw-dim"
                  style={{
                    borderBottom:
                      i < rawlinsonCoverage.length - 1 ? '1px solid var(--sw-rule-l)' : 'none',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
              Regional Location Factors
            </div>
            {rawlinsonFactors.map(({ region, multiplier, note }) => (
              <div key={region} className="flex items-center gap-4 border-b border-sw-rule py-2.5">
                <div className="w-9 text-[13px] font-bold text-sw-ink">{region}</div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-[1px] bg-sw-rule-l">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min((multiplier / 1.25) * 100, 100)}%`,
                      background:
                        multiplier >= 1
                          ? 'linear-gradient(90deg,#059669 0%,#34D399 100%)'
                          : 'linear-gradient(90deg,#7C3AED 0%,#A78BFA 100%)',
                    }}
                  />
                </div>
                <div
                  className="w-12 text-right font-mono text-[12px] font-semibold"
                  style={{ color: multiplier >= 1 ? 'var(--sw-pos)' : 'var(--sw-violet)' }}
                >
                  {(multiplier * 100).toFixed(0)}%
                </div>
                <div className="w-20 text-[11px] text-sw-faint">{note}</div>
              </div>
            ))}
            <div className="mt-5 border-t border-sw-rule py-3 text-[11px] leading-relaxed text-sw-faint">
              Location factors are applied automatically when you select your project region in the
              Rawlinson Lookup. Factors are sourced from Rawlinson's published location indices and
              updated each edition.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
