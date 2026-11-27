import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, Download, FileImage, Minus, Plus } from 'lucide-react'
import { DEFAULT_LEVEL, LEVEL_KIND_LABEL, LEVEL_NOTES, LEVEL_PLANS, RESIDENCES, SQFT_TO_SQM, TOWER_LEVELS } from '../data/residences'
import { prefersReducedMotion, useIsDesktop, useIsRoomy } from '../lib/hooks'
import { Segmented } from '../components/ui'
import TowerPicker from '../components/TowerPicker'

// 'cream' matches the residences screen design; 'dark' matches the rest of the site.
const FP_THEME = 'dark'
const TOWER_COLORS = {
  cream: { shade: [28, 19, 13], accent: [142, 90, 43], edge: [242, 233, 216] },
  dark: { shade: [22, 17, 14], accent: [212, 168, 90], edge: [245, 240, 232] },
}[FP_THEME]

const RESIDENCE_COUNT = TOWER_LEVELS.filter((l) => l.kind === 'residence').length
const isResidence = (l) => l?.kind === 'residence'
// Residence floors and shared levels with a supplied plan can be opened.
const canOpen = (l) => isResidence(l) || Boolean(LEVEL_PLANS[l?.id])
const SECTIONS = [
  { value: 'tower', label: 'Tower' },
  { value: 'details', label: 'Layout' },
]

function formatArea(sqft, unit) {
  if (sqft == null) return 'To be confirmed'
  return unit === 'sqm'
    ? `${(sqft * SQFT_TO_SQM).toLocaleString('en-IN', { maximumFractionDigits: 1 })} sq.m`
    : `${sqft.toLocaleString('en-IN')} sq.ft`
}

/** True when the plan PDF really exists (the dev server answers missing files with the app's HTML). */
function usePdfAvailable(url) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    setOk(false)
    fetch(url, { method: 'HEAD' })
      .then((r) => alive && setOk(r.ok && (r.headers.get('content-type') || '').includes('pdf')))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [url])
  return ok
}

export default function FloorPlans() {
  const isDesktop = useIsDesktop()
  const [params, setParams] = useSearchParams()
  const levelId = TOWER_LEVELS.some((l) => l.id === params.get('level') && canOpen(l)) ? params.get('level') : DEFAULT_LEVEL
  const homeId = RESIDENCES.some((r) => r.id === params.get('home')) ? params.get('home') : RESIDENCES[0].id
  const plansOpen = params.get('plans') === '1'
  const [hoveredId, setHoveredId] = useState(null)
  const [unit, setUnit] = useState('sqft')
  // Phones show one section at a time; portrait tablets have room for both.
  const showBoth = useIsRoomy()
  const [section, setSection] = useState('tower')

  const level = TOWER_LEVELS.find((l) => l.id === levelId)
  const home = RESIDENCES.find((r) => r.id === homeId)
  const shown = TOWER_LEVELS.find((l) => l.id === hoveredId) ?? level

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params)
      Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)))
      setParams(next, { replace: true })
    },
    [params, setParams],
  )
  const openPlans = (id) => update({ level: id, plans: '1' })

  const root = useRef(null)
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.fp-in', { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.08, ease: 'power3.out' })
    },
    { scope: root },
  )

  // Animate the big floor number when it changes.
  const numRef = useRef(null)
  useEffect(() => {
    if (!numRef.current || prefersReducedMotion()) return
    gsap.fromTo(numRef.current, { yPercent: 35, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' })
  }, [shown.id])

  const homeList = (
    <ul className="flex flex-row flex-wrap gap-x-6 gap-y-2 lg:flex-col lg:gap-5">
      {RESIDENCES.map((r, i) => {
        const active = r.id === homeId
        return (
          <li key={r.id} className="relative pl-4">
            {active && <span className="absolute left-0 top-[0.2em] h-[1.1em] w-[2px] bg-[var(--fp-accent)]" />}
            <button type="button" onClick={() => update({ home: r.id })} aria-pressed={active} className="flex items-baseline gap-3 text-left">
              <span className="text-[12px] tabular-nums tracking-[0.1em] text-[var(--fp-ink-soft)]">{String(i + 1).padStart(2, '0')}</span>
              <span className={`font-display text-[20px] leading-none transition-colors ${active ? 'text-[var(--fp-ink)]' : 'text-[var(--fp-ink-soft)] hover:text-[var(--fp-ink)]'}`}>
                {r.label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  const unitToggle = (
    <div className="flex rounded-full border border-[var(--fp-ink)]/15 p-0.5 text-[12px]">
      {[
        ['sqft', 'sq.ft'],
        ['sqm', 'sq.m'],
      ].map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => setUnit(k)}
          aria-pressed={unit === k}
          className={`rounded-full px-2.5 py-1 transition-colors ${unit === k ? 'bg-[var(--fp-button)] text-[var(--fp-button-ink)]' : 'text-[var(--fp-ink-soft)]'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  const rows = [{ name: 'Carpet area', area: home.carpetArea }, ...home.rooms, { name: 'Balcony', area: home.balcony }]

  const layoutCard = (
    <div className="rounded-xl bg-[var(--fp-panel)] px-6 py-5 compact:py-3 [@media(max-height:650px)]:py-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="whitespace-nowrap font-display text-[20px] font-medium text-[var(--fp-ink)] 2xl:text-[22px]">{home.label} layout</h2>
        {unitToggle}
      </div>
      <dl className="mt-3 divide-y divide-[var(--fp-ink)]/10 text-[14px] [@media(max-height:650px)]:mt-1.5 [@media(max-height:650px)]:text-[13px]">
        {rows.map((row) => (
          <div key={row.name} className="flex items-baseline justify-between gap-3 py-2.5 [@media(max-height:850px)]:py-1.5 [@media(max-height:650px)]:py-0.5">
            <dt className="text-[var(--fp-ink)]">{row.name}</dt>
            <dd className={`shrink-0 ${row.area == null ? 'text-[var(--fp-ink-soft)]' : 'font-semibold text-[var(--fp-ink)]'}`}>{formatArea(row.area, unit)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )

  // Phone and tablet version: rooms in columns so every row fits without scrolling.
  const compactLayoutCard = (
    <div className="rounded-xl bg-[var(--fp-panel)] px-4 py-3 xs:py-4 land:py-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="whitespace-nowrap font-display text-[18px] font-medium text-[var(--fp-ink)] land:text-[16px]">{home.label} layout</h2>
        {unitToggle}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 md:grid-cols-5 land:mt-1 land:grid-cols-5">
        {rows.map((row) => (
          <div key={row.name} className="border-t border-[var(--fp-ink)]/10 py-1.5 xs:py-2.5 md:py-2 land:py-1">
            <dt className="truncate text-[12px] text-[var(--fp-ink-soft)]">{row.name}</dt>
            <dd className={`text-[13px] xs:text-[14px] ${row.area == null ? 'text-[var(--fp-ink-soft)]' : 'font-semibold text-[var(--fp-ink)]'}`}>
              {formatArea(row.area, unit)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )

  const enquire = (
    <Link to={`/book-visit?home=${home.id}`} className="btn-gold h-11 w-full text-[14px] [@media(max-height:650px)]:h-9">
      Enquire About This Home
    </Link>
  )

  const floorReadout = (big) => (
    <div className="flex flex-col items-start">
      <span className="text-[15px] text-[var(--fp-ink-soft)]">{isResidence(shown) ? 'Floor' : LEVEL_KIND_LABEL[shown.kind]}</span>
      <span className="overflow-hidden">
        <span
          ref={numRef}
          className={`block font-display font-medium leading-[0.9] tracking-[-0.03em] text-[var(--fp-accent)] ${big ? 'text-[clamp(80px,8vw,144px)]' : 'text-[64px]'}`}
        >
          {shown.num}
        </span>
      </span>
      <p className={`max-w-[15rem] text-[15px] leading-snug text-[var(--fp-ink-soft)] ${big ? 'mt-6' : 'mt-2'}`}>
        {isResidence(shown) ? (
'Choose a floor on the tower to see its plans.'
        ) : (
          LEVEL_NOTES[shown.kind]
        )}
      </p>
      <button
        type="button"
        onClick={() => openPlans(canOpen(shown) ? shown.id : level.id)}
        className="pointer-events-auto mt-5 whitespace-nowrap rounded-full bg-[var(--fp-button)] px-6 py-3 text-[15px] font-semibold text-[var(--fp-button-ink)] transition hover:opacity-90"
      >
        Open plans
      </button>
    </div>
  )

  const tower = (
    <TowerPicker
      levels={TOWER_LEVELS}
      selectedId={levelId}
      hoveredId={hoveredId}
      onHover={setHoveredId}
      onPick={openPlans}
      isPickable={canOpen}
      colors={TOWER_COLORS}
      className="tower-fade h-full w-full"
    />
  )

  const elevation = (
    <div>
      <p className="text-[12px] uppercase tracking-[0.24em] text-[var(--fp-accent)]">Elevation</p>
      <p className="mt-1.5 font-display text-[22px] leading-none text-[var(--fp-ink)]">
        {TOWER_LEVELS.length} levels <span className="text-[var(--fp-ink-soft)]">· {RESIDENCE_COUNT} to explore</span>
      </p>
    </div>
  )

  return (
    <div ref={root} className={`fp-${FP_THEME} absolute inset-0 bg-[var(--fp-bg)] text-[var(--fp-ink)]`}>
      {isDesktop ? (
        <div className="absolute inset-x-0 bottom-0 top-[88px] grid grid-cols-[minmax(0,1fr)_16rem] gap-6 px-6 pb-10 xl:grid-cols-[15rem_minmax(0,1fr)_17rem] xl:gap-10 xl:px-10 2xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
          <aside className="fp-in hidden self-center xl:block">
            <p className="text-[12px] uppercase tracking-[0.24em] text-[var(--fp-accent)]">Residences</p>
            <h1 className="mt-4 font-display text-[clamp(36px,3.2vw,50px)] font-medium leading-[1.05] tracking-[-0.01em]">
              Homes Designed to Inspire
            </h1>
            <p className="mt-5 max-w-[18rem] text-[15px] leading-relaxed text-[var(--fp-ink-soft)]">
              4 &amp; 5 BHK residences, each with panoramic views over the city skyline and the sea.
            </p>
            <div className="mt-9">{homeList}</div>
          </aside>

          <section className="fp-in relative flex min-h-0 flex-col overflow-hidden rounded-xl bg-[var(--fp-panel)]">
            <div className="z-10 flex shrink-0 items-start justify-between gap-6 px-8 pt-7 xl:px-10 xl:pt-8">
              {elevation}
              <div className="xl:hidden">{homeList}</div>
            </div>
            {/* Readout and tower side by side, so they never overlap at any width. */}
            <div className="flex min-h-0 flex-1 items-center">
              <div className="z-10 w-[13rem] shrink-0 pl-8 xl:w-[15rem] xl:pl-[clamp(2.5rem,4vw,5rem)]">{floorReadout(true)}</div>
              <div className="h-full min-w-0 flex-1 -translate-y-[2%] pr-[4%]">{tower}</div>
            </div>
          </section>

          <aside className="fp-in flex flex-col gap-3 self-center">
            {layoutCard}
            {enquire}
          </aside>
        </div>
      ) : (
        <div
          className="absolute inset-x-0 bottom-[var(--nav-h)] top-0 flex flex-col gap-2.5 px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] xs:px-4 md:gap-4 md:px-6 md:pt-6 land:gap-1.5 land:pt-1.5"
        >
          <header className="fp-in shrink-0 land:flex land:items-center land:justify-between land:gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.24em] text-[var(--fp-accent)] compact:hidden">Residences</p>
              <h1 className="mt-1 font-display text-[22px] font-medium leading-[1.1] xs:text-[26px] md:text-[32px] compact:mt-0 compact:text-[20px] land:text-[16px]">
                Homes Designed to Inspire
              </h1>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3 land:mt-0">
              <div className="land:mr-2">{homeList}</div>
              {!showBoth && (
                <Segmented label="Floor plan section" options={SECTIONS} value={section} onChange={setSection} size="sm" className="shrink-0 bg-white/5" />
              )}
            </div>
          </header>

          {/* Both sections stay mounted so the tower keeps its loaded frames. */}
          <div className={`fp-in relative min-h-0 flex-1 ${showBoth ? 'flex flex-col gap-4' : ''}`}>
            <section
              className={`flex min-h-0 flex-col overflow-hidden rounded-xl bg-[var(--fp-panel)] p-3 xs:p-4 land:flex-row land:p-2 ${
                showBoth ? 'flex-1' : `absolute inset-0 ${section === 'tower' ? '' : 'invisible'}`
              }`}
            >
              <div className="shrink-0 compact:hidden">{elevation}</div>
              <div className="relative -mx-3 min-h-0 flex-1 xs:-mx-4 land:order-2 land:mx-0">
                <div className="absolute inset-0 land:left-1/2 land:right-auto land:aspect-video land:max-w-full land:-translate-x-1/2">{tower}</div>
              </div>
              <div className="flex shrink-0 items-end justify-between gap-4 land:order-1 land:w-40 land:flex-col land:items-start land:justify-center land:gap-3 land:pl-2">
                <div>
                  <span className="text-[14px] text-[var(--fp-ink-soft)]">{isResidence(shown) ? 'Floor' : LEVEL_KIND_LABEL[shown.kind]}</span>
                  <span className="block font-display text-[44px] font-medium leading-[0.9] text-[var(--fp-accent)] xs:text-[56px] compact:text-[40px]">{shown.num}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openPlans(level.id)}
                  className="rounded-full bg-[var(--fp-button)] px-6 py-3 text-[15px] font-semibold text-[var(--fp-button-ink)] compact:py-2.5 compact:text-[14px]"
                >
                  Open plans
                </button>
                <p className="hidden text-[13px] leading-snug text-[var(--fp-ink-soft)] land:block">Tap a floor on the tower to see its plans.</p>
              </div>
            </section>
            <div
              className={`flex flex-col justify-center gap-2.5 land:gap-1.5 ${
                showBoth ? 'shrink-0' : `absolute inset-0 ${section === 'details' ? '' : 'invisible'}`
              }`}
            >
              {compactLayoutCard}
              {enquire}
            </div>
          </div>
        </div>
      )}

      {plansOpen && (
        <PlansView
          key={home.id}
          home={home}
          level={level}
          unit={unit}
          isDesktop={isDesktop}
          onHome={(id) => update({ home: id })}
          onClose={() => update({ plans: null })}
          unitToggle={unitToggle}
        />
      )}
    </div>
  )
}

/**
 * Full-area plan view opened from "Open plans" or a click on the tower.
 * A shared level shows its one plan; a residence floor shows the chosen home's plan.
 */
function PlansView({ home, level, unit, isDesktop, onHome, onClose, unitToggle }) {
  const levelPlan = LEVEL_PLANS[level.id]
  const pdfReady = usePdfAvailable(home.planPdf)
  const panel = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(panel.current, { autoAlpha: 0, duration: 0.4, ease: 'power1.out' })
      gsap.from('.pv-in', { autoAlpha: 0, y: 12, duration: 0.5, stagger: 0.06, delay: 0.15, ease: 'power2.out' })
    },
    { scope: panel },
  )

  const homePicker = (
    <div className="rounded-lg border border-[var(--fp-accent)]/25 bg-[var(--fp-bg)]/92 px-4 py-3 backdrop-blur">
      <span className="block text-[12px] uppercase tracking-[0.22em] text-[var(--fp-accent)]">
        Level {level.level} · {home.typeName}
      </span>
      <div className="mt-2.5 flex flex-col gap-2.5 max-lg:flex-row max-lg:gap-6 max-xs:gap-4 max-lg:land:flex-col max-lg:land:gap-3">
        {RESIDENCES.map((r, i) => {
          const active = r.id === home.id
          return (
            <div key={r.id} className="relative pl-3">
              {active && <span className="absolute left-0 top-[0.2em] h-[0.95em] w-[2px] bg-[var(--fp-accent)]" />}
              <button type="button" onClick={() => onHome(r.id)} aria-pressed={active} className="flex items-baseline gap-2.5 text-left">
                <span className="text-[12px] tabular-nums text-[var(--fp-ink-soft)]">{String(i + 1).padStart(2, '0')}</span>
                <span className={`whitespace-nowrap font-display text-[17px] leading-none max-xs:text-[15px] ${active ? 'text-[var(--fp-ink)]' : 'text-[var(--fp-ink-soft)]'}`}>{r.title}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  const summary = (
    <div className="rounded-lg border border-[var(--fp-accent)]/25 bg-[var(--fp-bg)]/92 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] uppercase tracking-[0.22em] text-[var(--fp-accent)]">Carpet area</span>
        {unitToggle}
      </div>
      <p className="mt-1 font-display text-[22px] font-medium">{formatArea(home.carpetArea, unit)}</p>
      <div className="mt-3 flex flex-col gap-2">
        <Link to={`/book-visit?home=${home.id}`} className="btn-gold h-10 text-[13px]">
          Enquire About This Home
        </Link>
        {pdfReady ? (
          <a href={home.planPdf} download className="btn-outline h-10 border-[var(--fp-ink)]/25 bg-transparent text-[13px] text-[var(--fp-ink)]">
            <Download size={14} /> Download 2D Plan PDF
          </a>
        ) : (
          <button type="button" disabled className="btn-outline h-10 border-[var(--fp-ink)]/25 bg-transparent text-[13px] text-[var(--fp-ink)]" title="The plan PDF has not been uploaded yet">
            <Download size={14} /> 2D Plan PDF · Coming Soon
          </button>
        )}
      </div>
    </div>
  )

  const drawing = levelPlan ? (
    <PlanDrawing key={level.id} src={levelPlan.src} alt={`${level.label}: ${levelPlan.title}`} />
  ) : (
    <PlanDrawing key={home.id} src={home.plan2d} alt={`${home.title} 2D floor plan`} emptyText={`The ${home.label} floor plan drawing will appear here.`} />
  )

  const backRow = (
    <div className={`pv-in absolute z-10 flex items-center gap-3 ${isDesktop ? 'left-10 top-[108px]' : 'left-3 top-[max(0.75rem,env(safe-area-inset-top))]'}`}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to the tower"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--fp-ink)]/20 bg-[var(--fp-bg)]/92 text-[var(--fp-ink)]"
      >
        <ArrowLeft size={18} />
      </button>
      <span className="rounded-full bg-[var(--fp-bg)]/92 px-3 py-1.5 text-[13px] text-[var(--fp-ink-soft)]">
        {level.label}
        {levelPlan && <span className="text-[var(--fp-ink)]"> · {levelPlan.title}</span>}
      </span>
    </div>
  )

  return (
    <div ref={panel} className="absolute inset-0 z-30 bg-[var(--fp-bg)]" role="dialog" aria-label={`${levelPlan ? levelPlan.title : `${home.title} plans`}, ${level.label}`}>
      {isDesktop ? (
        <>
          <div className="absolute inset-x-4 bottom-10 top-[88px] overflow-hidden rounded-2xl border border-[var(--fp-ink)]/10">{drawing}</div>
          {backRow}
          {!levelPlan && (
            <>
              <div className="pv-in absolute left-10 top-1/2 z-10 w-fit -translate-y-1/2">{homePicker}</div>
              <div className="pv-in absolute right-10 top-1/2 z-10 w-[17rem] -translate-y-1/2">{summary}</div>
            </>
          )}
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-[var(--nav-h)] top-0 flex flex-col land:flex-row">
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            <div className="absolute inset-0">{drawing}</div>
            {backRow}
          </div>
          {!levelPlan && <div className="pv-in flex shrink-0 flex-col justify-center p-3 pb-6 land:w-56">{homePicker}</div>}
          {levelPlan && <div className="h-6 shrink-0 land:hidden" />}
        </div>
      )}
    </div>
  )
}

/**
 * A plan drawing on white. Zoom with the buttons, the mouse wheel or a double click;
 * drag to move around a zoomed plan. Shows a note until the drawing is supplied.
 */
function PlanDrawing({ src, alt, emptyText }) {
  const box = useRef(null)
  const drag = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  // Keep the zoomed drawing covering the box: it can't be dragged out of view.
  const clamp = useCallback((p, z) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return p
    const mx = (r.width * (z - 1)) / 2
    const my = (r.height * (z - 1)) / 2
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) }
  }, [])

  const zoomTo = (z) => {
    const next = Math.min(4, Math.max(1, z))
    setPan((p) => clamp({ x: (p.x * next) / zoom, y: (p.y * next) / zoom }, next))
    setZoom(next)
  }

  const zoomBtn = 'grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white text-[#3a2c20] shadow disabled:opacity-40'

  if (!src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream px-6 text-center text-[#3a2c20]">
        <FileImage size={28} className="opacity-50" />
        <p className="text-[12px] uppercase tracking-[0.2em] opacity-70">Coming soon</p>
        <p className="max-w-[18rem] font-display text-[17px]">{emptyText}</p>
      </div>
    )
  }

  return (
    <div
      ref={box}
      className={`absolute inset-0 select-none overflow-hidden bg-white ${zoom > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      style={{ touchAction: zoom > 1 ? 'none' : 'manipulation' }}
      onWheel={(e) => zoomTo(zoom + (e.deltaY < 0 ? 0.25 : -0.25))}
      onDoubleClick={() => zoomTo(zoom > 1 ? 1 : 2)}
      onPointerDown={(e) => {
        if (zoom === 1 || e.target.closest('button')) return
        drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
      }}
      onPointerMove={(e) => drag.current && setPan(clamp({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }, zoom))}
      onPointerUp={() => {
        drag.current = null
        setDragging(false)
      }}
      onPointerCancel={() => {
        drag.current = null
        setDragging(false)
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-contain p-3 pt-16 lg:p-14"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragging ? 'none' : 'transform 0.2s ease-out' }}
      />
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 lg:bottom-6 lg:right-6 max-lg:land:bottom-7">
        <button type="button" aria-label="Zoom in" className={zoomBtn} disabled={zoom >= 4} onClick={() => zoomTo(zoom + 0.5)}>
          <Plus size={16} />
        </button>
        <button type="button" aria-label="Zoom out" className={zoomBtn} disabled={zoom <= 1} onClick={() => zoomTo(zoom - 0.5)}>
          <Minus size={16} />
        </button>
      </div>
    </div>
  )
}
