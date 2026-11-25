import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, Download, FileImage, Minus, Plus } from 'lucide-react'
import { DEFAULT_LEVEL, LEVEL_KIND_LABEL, LEVEL_NOTES, RESIDENCES, SQFT_TO_SQM, TOWER_LEVELS } from '../data/residences'
import { prefersReducedMotion, useIsDesktop } from '../lib/hooks'
import TowerPicker from '../components/TowerPicker'
import Turntable from '../components/Turntable'

// 'cream' matches the residences screen design; 'dark' matches the rest of the site.
const FP_THEME = 'dark'
const TOWER_COLORS = {
  cream: { shade: [28, 19, 13], accent: [142, 90, 43], edge: [242, 233, 216] },
  dark: { shade: [22, 17, 14], accent: [212, 168, 90], edge: [245, 240, 232] },
}[FP_THEME]

const RESIDENCE_COUNT = TOWER_LEVELS.filter((l) => l.kind === 'residence').length
const isResidence = (l) => l?.kind === 'residence'

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
  const levelId = TOWER_LEVELS.some((l) => l.id === params.get('level') && isResidence(l)) ? params.get('level') : DEFAULT_LEVEL
  const homeId = RESIDENCES.some((r) => r.id === params.get('home')) ? params.get('home') : RESIDENCES[0].id
  const plansOpen = params.get('plans') === '1'
  const view = params.get('view') === '2d' ? '2d' : 'iso'
  const [hoveredId, setHoveredId] = useState(null)
  const [unit, setUnit] = useState('sqft')

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

  const layoutCard = (
    <div className="rounded-xl bg-[var(--fp-panel)] px-6 py-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="whitespace-nowrap font-display text-[20px] font-medium text-[var(--fp-ink)] 2xl:text-[22px]">{home.label} layout</h2>
        {unitToggle}
      </div>
      <dl className="mt-3 divide-y divide-[var(--fp-ink)]/10 text-[14px]">
        {[{ name: 'Carpet area', area: home.carpetArea }, ...home.rooms, { name: 'Balcony', area: home.balcony }].map((row) => (
          <div key={row.name} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-[var(--fp-ink)]">{row.name}</dt>
            <dd className={`shrink-0 ${row.area == null ? 'text-[var(--fp-ink-soft)]' : 'font-semibold text-[var(--fp-ink)]'}`}>{formatArea(row.area, unit)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )

  const enquire = (
    <Link to={`/book-visit?home=${home.id}`} className="btn-gold h-11 w-full text-[14px]">
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
        onClick={() => openPlans(isResidence(shown) ? shown.id : level.id)}
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
      isPickable={isResidence}
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
        <div className="absolute inset-x-0 bottom-0 top-[88px] grid grid-cols-[minmax(0,1fr)_16rem] gap-6 px-6 pb-6 xl:grid-cols-[15rem_minmax(0,1fr)_17rem] xl:gap-10 xl:px-10 xl:pb-8 2xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
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
        <div className="absolute inset-0 overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
          <p className="fp-in text-[12px] uppercase tracking-[0.24em] text-[var(--fp-accent)]">Residences</p>
          <h1 className="fp-in mt-2 font-display text-[30px] font-medium leading-[1.05]">Homes Designed to Inspire</h1>
          <div className="fp-in mt-4">{homeList}</div>
          <section className="fp-in mt-4 overflow-hidden rounded-md bg-[var(--fp-panel)] p-5">
            {elevation}
            <div className="relative -mx-5 mt-2 h-[52vh]">{tower}</div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-[14px] text-[var(--fp-ink-soft)]">{isResidence(shown) ? 'Floor' : LEVEL_KIND_LABEL[shown.kind]}</span>
                <span className="block font-display text-[56px] font-medium leading-[0.9] text-[var(--fp-accent)]">{shown.num}</span>
              </div>
              <button
                type="button"
                onClick={() => openPlans(level.id)}
                className="rounded-full bg-[var(--fp-button)] px-6 py-3 text-[15px] font-semibold text-[var(--fp-button-ink)]"
              >
                Open plans
              </button>
            </div>
            <p className="mt-3 text-[13px] text-[var(--fp-ink-soft)]">Tap a floor on the tower to see its plans.</p>
          </section>
          <div className="fp-in mt-4">{layoutCard}</div>
          <div className="mt-3">{enquire}</div>
        </div>
      )}

      {plansOpen && (
        <PlansView
          key={home.id}
          home={home}
          level={level}
          view={view}
          unit={unit}
          isDesktop={isDesktop}
          onView={(v) => update({ view: v === 'iso' ? null : v })}
          onHome={(id) => update({ home: id })}
          onClose={() => update({ plans: null, view: null })}
          unitToggle={unitToggle}
        />
      )}
    </div>
  )
}

/** Full-area plan view opened from "Open plans" or a click on the tower. */
function PlansView({ home, level, view, unit, isDesktop, onView, onHome, onClose, unitToggle }) {
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

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-full border border-[var(--fp-ink)]/15 bg-[var(--fp-bg)]/90 p-1 backdrop-blur">
      {[
        ['iso', 'Isometric'],
        ['2d', 'Floor plan'],
      ].map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => onView(k)}
          aria-pressed={view === k}
          className={`rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.16em] transition-colors ${
            view === k ? 'bg-[var(--fp-accent)] text-[var(--fp-bg)]' : 'text-[var(--fp-ink-soft)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  const homePicker = (
    <div className="rounded-lg border border-[var(--fp-accent)]/25 bg-[var(--fp-bg)]/92 px-4 py-3 backdrop-blur">
      <span className="block text-[12px] uppercase tracking-[0.22em] text-[var(--fp-accent)]">
        Level {level.level} · {home.typeName}
      </span>
      <div className="mt-2.5 flex flex-col gap-2.5">
        {RESIDENCES.map((r, i) => {
          const active = r.id === home.id
          return (
            <div key={r.id} className="relative pl-3">
              {active && <span className="absolute left-0 top-[0.2em] h-[0.95em] w-[2px] bg-[var(--fp-accent)]" />}
              <button type="button" onClick={() => onHome(r.id)} aria-pressed={active} className="flex items-baseline gap-2.5 text-left">
                <span className="text-[12px] tabular-nums text-[var(--fp-ink-soft)]">{String(i + 1).padStart(2, '0')}</span>
                <span className={`font-display text-[17px] leading-none ${active ? 'text-[var(--fp-ink)]' : 'text-[var(--fp-ink-soft)]'}`}>{r.title}</span>
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

  return (
    <div ref={panel} className="absolute inset-0 z-30 bg-[var(--fp-bg)]" role="dialog" aria-label={`${home.title} plans, ${level.label}`}>
      <div className={`absolute overflow-hidden ${isDesktop ? 'inset-x-4 bottom-4 top-[88px] rounded-2xl border border-[var(--fp-ink)]/10' : 'inset-0'}`}>
        {view === 'iso' ? (
          <Turntable frames={home.isoFrames} alt={`${home.title} isometric layout`} className="h-full w-full" />
        ) : (
          <PlanDrawing home={home} />
        )}
      </div>

      <div className={`pv-in absolute left-5 z-10 flex items-center gap-3 ${isDesktop ? 'top-[108px] left-10' : 'top-[max(1rem,env(safe-area-inset-top))]'}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to the tower"
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--fp-ink)]/20 bg-[var(--fp-bg)]/92 text-[var(--fp-ink)]"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="rounded-full bg-[var(--fp-bg)]/92 px-3 py-1.5 text-[13px] text-[var(--fp-ink-soft)]">{level.label}</span>
      </div>

      {isDesktop ? (
        <>
          <div className="pv-in absolute left-10 top-1/2 z-10 w-fit -translate-y-1/2">{homePicker}</div>
          <div className="pv-in absolute right-10 top-1/2 z-10 w-[17rem] -translate-y-1/2">{summary}</div>
          <div className="pv-in absolute bottom-10 left-1/2 z-10 -translate-x-1/2">{viewToggle}</div>
        </>
      ) : (
        <div className="absolute inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 flex flex-col gap-3">
          <div className="pv-in mx-auto">{viewToggle}</div>
          <div className="pv-in">{homePicker}</div>
        </div>
      )}
    </div>
  )
}

/** Light cream drawing box with zoom, or a note until the drawing is supplied. */
function PlanDrawing({ home }) {
  const [zoom, setZoom] = useState(1)
  const style = useMemo(() => ({ transform: `scale(${zoom})` }), [zoom])
  const zoomBtn = 'grid h-9 w-9 place-items-center rounded-full bg-white text-[#3a2c20] shadow disabled:opacity-40'
  return (
    <div className="absolute inset-0 overflow-auto bg-cream">
      {home.plan2d ? (
        <>
          <img src={home.plan2d} alt={`${home.title} 2D floor plan`} className="h-full w-full origin-center object-contain p-24 transition-transform" style={style} />
          <div className="absolute bottom-24 right-10 flex flex-col gap-2">
            <button type="button" aria-label="Zoom in" className={zoomBtn} disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
              <Plus size={16} />
            </button>
            <button type="button" aria-label="Zoom out" className={zoomBtn} disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.25))}>
              <Minus size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[#3a2c20]">
          <FileImage size={28} className="opacity-50" />
          <p className="text-[12px] uppercase tracking-[0.2em] opacity-70">Coming soon</p>
          <p className="max-w-[18rem] font-display text-[17px]">The {home.label} floor plan drawing will appear here.</p>
        </div>
      )}
    </div>
  )
}
