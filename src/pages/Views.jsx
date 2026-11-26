import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Moon, Navigation, Sun, Sunset } from 'lucide-react'
import { LIGHT_MODES, PANO_FACE_SIZE, PANO_FLOORS, PANO_LEVELS, PANO_TILE_ROOT, SCENES, WEST_YAW } from '../data/panos'
import { DIRECTION_HINTS, TOWER, VIEW_LANDMARKS, bearingDeg, distanceKm } from '../data/places'
import { Marzipano, compassName, createViewer, deg, destroyViewer, onFirstDrag, rad, tiledSource } from '../lib/pano'
import { useIsDesktop } from '../lib/hooks'
import { Chrome, DragHint, EyeToggle, Segmented } from '../components/ui'

const MODE_ICONS = { day: Sun, evening: Sunset, night: Moon }
const MODE_OPTIONS = LIGHT_MODES.map((m) => ({ value: m.key, label: m.label, Icon: MODE_ICONS[m.key] }))
const DEFAULT_FLOOR = 1 // 17th Floor
const fmtHeight = (h) => `${h} m`

// Landmarks are placed by real-world bearing; pitch dips with distance and floor height.
const LANDMARKS = VIEW_LANDMARKS.map((l) => ({
  ...l,
  km: distanceKm(TOWER.at, l.at),
  yaw: WEST_YAW + rad(bearingDeg(TOWER.at, l.at) - 270),
}))

function parseFloor(value) {
  const i = PANO_FLOORS.findIndex((f) => f.short === value)
  return i >= 0 ? i : DEFAULT_FLOOR
}

export default function Views() {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const floorIndex = parseFloor(params.get('floor'))
  const mode = LIGHT_MODES.some((m) => m.key === params.get('mode')) ? params.get('mode') : 'evening'
  const floor = PANO_FLOORS[floorIndex]

  const panoRef = useRef(null)
  const [viewer, setViewer] = useState(null)
  const scenesRef = useRef(new Map())
  const [hotspotHosts, setHotspotHosts] = useState(null)
  const [bearing, setBearing] = useState(270)
  const [dragged, setDragged] = useState(false)
  const [hidden, setHidden] = useState(false)
  const tagPress = useRef(null)

  const setFloorAndMode = useCallback(
    (nextFloor, nextMode) => {
      const next = new URLSearchParams(params)
      next.set('floor', PANO_FLOORS[nextFloor].short)
      next.set('mode', nextMode)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  // Viewer lifetime.
  useEffect(() => {
    const viewer = createViewer(panoRef.current)
    setViewer(viewer)
    const scenes = scenesRef.current
    let frame = 0
    const onView = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const yaw = viewer.view()?.yaw?.()
        if (yaw != null) setBearing(Math.round(270 + deg(yaw - WEST_YAW)))
      })
    }
    viewer.addEventListener('viewChange', onView)
    const stopDrag = onFirstDrag(panoRef.current, () => setDragged(true))
    return () => {
      stopDrag()
      cancelAnimationFrame(frame)
      viewer.removeEventListener('viewChange', onView)
      destroyViewer(viewer)
      scenes.clear()
      setViewer(null)
    }
  }, [isDesktop])

  // Switch scene when floor or light changes, keeping the direction the user is looking.
  useEffect(() => {
    if (!viewer) return
    const id = floor.scenes[mode]
    const scenes = scenesRef.current
    let entry = scenes.get(id)
    if (!entry) {
      const [yaw, pitch] = SCENES[id]
      const limiter = Marzipano.RectilinearView.limit.traditional(PANO_FACE_SIZE, rad(100), rad(120))
      const view = new Marzipano.RectilinearView({ yaw, pitch, fov: 1.4 }, limiter)
      const scene = viewer.createScene({
        source: tiledSource(`${PANO_TILE_ROOT}/${id}`),
        geometry: new Marzipano.CubeGeometry(PANO_LEVELS),
        view,
        pinFirstLevel: true,
      })
      const hosts = LANDMARKS.map((l) => {
        const el = document.createElement('div')
        el.className = 'pano-hotspot'
        const pitchDown = -Math.atan(floor.height / (l.km * 1000))
        scene.hotspotContainer().createHotspot(el, { yaw: l.yaw, pitch: pitchDown })
        return el
      })
      entry = { scene, hosts }
      scenes.set(id, entry)
    }
    const current = viewer.scene()
    if (current && current !== entry.scene) {
      const { yaw, pitch, fov } = current.view().parameters()
      entry.scene.view().setParameters({ yaw, pitch, fov })
    }
    entry.scene.switchTo({ transitionDuration: current ? 450 : 0 })
    setHotspotHosts(entry.hosts)
  }, [viewer, floor, mode])

  const direction = compassName(bearing)
  const facing = `Facing ${direction} · ${DIRECTION_HINTS[direction]}`
  const modeLabel = LIGHT_MODES.find((m) => m.key === mode).label

  const tags =
    hotspotHosts &&
    LANDMARKS.map((l, i) =>
      createPortal(
        <button
          type="button"
          onPointerDown={(e) => (tagPress.current = { x: e.clientX, y: e.clientY })}
          onClick={(e) => {
            // Ignore the click that ends a drag which happened to start on a tag.
            const p = tagPress.current
            tagPress.current = null
            if (p && e.detail > 0 && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) return
            navigate(l.placeId ? `/location?place=${encodeURIComponent(l.placeId)}` : '/location')
          }}
          className={`glass -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium text-ink transition hover:border-white/40 ${
            hidden ? 'hidden' : 'flex'
          }`}
          title={l.placeId ? 'Show on the location map' : 'Open the location map'}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${l.dot === 'gold' ? 'bg-gold' : 'bg-route'}`} />
          {l.label} · {l.km.toFixed(1)} km
        </button>,
        hotspotHosts[i],
        l.label,
      ),
    )

  const compassPill = (
    <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium" aria-live="polite">
      <Navigation size={14} className="text-gold" style={{ transform: `rotate(${bearing - 45}deg)` }} />
      {facing}
    </div>
  )

  if (!isDesktop) {
    return (
      <div className="absolute inset-0 flex flex-col pb-[var(--nav-h)]">
        <div className="relative min-h-0 flex-1">
          <div ref={panoRef} className="absolute inset-0" />
          {tags}
          <Chrome hidden={hidden} className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-[max(0.75rem,env(safe-area-inset-top))]">
            {compassPill}
          </Chrome>
          <DragHint visible={!dragged && !hidden} className="absolute bottom-3 left-1/2 w-max max-w-[92%] -translate-x-1/2 land:hidden" />
        </div>
        <div className="shrink-0 bg-panel land:flex land:items-center">
        <Chrome hidden={hidden} className="solid-panel rounded-t-2xl border-b-0 px-4 pb-4 pt-4 xs:px-5 compact:pb-2 compact:pt-3 land:min-w-0 land:flex-1 land:rounded-none land:border-0 land:py-1.5">
          <p className="eyebrow compact:hidden">Floor Height</p>
          <p className="mt-1 font-display text-[20px] font-semibold compact:mt-0 compact:text-[17px] land:text-[14px]">
            {floor.label} · <span className="text-gold">{fmtHeight(floor.height)}</span>
          </p>
          <input
            type="range"
            min={0}
            max={PANO_FLOORS.length - 1}
            step={1}
            value={PANO_FLOORS.length - 1 - floorIndex}
            onChange={(e) => setFloorAndMode(PANO_FLOORS.length - 1 - Number(e.target.value), mode)}
            aria-label="Floor height"
            aria-valuetext={`${floor.label}, ${fmtHeight(floor.height)}`}
            className="mt-3 h-8 w-full accent-[#d4a85a] compact:mt-1 compact:h-7 land:mt-0 land:h-5"
          />
          <div className="flex justify-between text-[12px] text-ink/55">
            <span>Podium {fmtHeight(PANO_FLOORS.at(-1).height)}</span>
            <span>Terrace {fmtHeight(PANO_FLOORS[0].height)}</span>
          </div>
        </Chrome>
        <div className="flex items-center justify-center gap-2 px-3 pb-6 land:shrink-0 land:pt-2 land:pl-0">
          {!hidden && (
            <Segmented label="Lighting" options={MODE_OPTIONS} value={mode} onChange={(m) => setFloorAndMode(floorIndex, m)} size="sm" className="bg-white/5" />
          )}
          <EyeToggle hidden={hidden} onToggle={() => setHidden((h) => !h)} className="shrink-0" />
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <div ref={panoRef} className="absolute inset-0" />
      {tags}

      <Chrome hidden={hidden}>
        <div className="pointer-events-none absolute left-1/2 top-[88px] -translate-x-1/2">{compassPill}</div>

        <FloorSlider floorIndex={floorIndex} onChange={(i) => setFloorAndMode(i, mode)} />

        <div className="glass absolute bottom-6 left-6 w-[260px] rounded-2xl px-5 py-4">
          <p className="eyebrow">You Are Viewing</p>
          <p className="mt-1.5 font-display text-[22px] font-semibold">{floor.label}</p>
          <p className="mt-0.5 text-[13px] text-ink/65">
            Height: {fmtHeight(floor.height)} · {modeLabel} Light
          </p>
        </div>

        <DragHint visible={!dragged} className="absolute bottom-[88px] left-1/2 -translate-x-1/2" />
      </Chrome>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {!hidden && (
          <Segmented label="Lighting" options={MODE_OPTIONS} value={mode} onChange={(m) => setFloorAndMode(floorIndex, m)} className="glass" />
        )}
        <EyeToggle hidden={hidden} onToggle={() => setHidden((h) => !h)} />
      </div>
    </div>
  )
}

/** Vertical floor slider: arrows, draggable handle and a gold floor label. Always visible. */
function FloorSlider({ floorIndex, onChange }) {
  const trackRef = useRef(null)
  const [dragIndex, setDragIndex] = useState(null)
  const last = PANO_FLOORS.length - 1
  const shown = dragIndex ?? floorIndex
  const pct = (shown / last) * 100
  const floor = PANO_FLOORS[shown]

  const indexAt = (clientY) => {
    const r = trackRef.current.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientY - r.top) / r.height))
    return Math.round(t * last)
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragIndex(indexAt(e.clientY))
  }
  const onPointerMove = (e) => {
    if (dragIndex != null) setDragIndex(indexAt(e.clientY))
  }
  const onPointerUp = () => {
    if (dragIndex != null && dragIndex !== floorIndex) onChange(dragIndex)
    setDragIndex(null)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') onChange(Math.max(0, floorIndex - 1))
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') onChange(Math.min(last, floorIndex + 1))
    else if (e.key === 'Home') onChange(0)
    else if (e.key === 'End') onChange(last)
    else return
    e.preventDefault()
  }

  return (
    <div className="glass absolute right-6 top-1/2 flex h-[min(480px,calc(100vh-240px))] w-[84px] -translate-y-[44%] flex-col items-center rounded-2xl py-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, floorIndex - 1))}
        disabled={floorIndex === 0}
        aria-label="Go up one floor"
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink/80 transition hover:text-ink disabled:opacity-35"
      >
        <ChevronUp size={18} />
      </button>
      <span className="mt-3 text-[12px] font-semibold tracking-[0.12em] text-ink/55">TERRACE</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Floor height"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={last - floorIndex}
        aria-valuetext={`${PANO_FLOORS[floorIndex].label}, ${fmtHeight(PANO_FLOORS[floorIndex].height)}`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDragIndex(null)}
        className="relative my-3 w-10 flex-1 cursor-pointer touch-none"
      >
        <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-white/12" />
        <span className="absolute bottom-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-gold/70" style={{ top: `${pct}%` }} />
        <span
          className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-gold shadow-[0_0_0_4px_rgb(212_168_90/0.25)]"
          style={{ top: `${pct}%` }}
        />
        <span
          className="pointer-events-none absolute right-[calc(100%+14px)] -translate-y-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-[12px] font-semibold text-[#1a130d]"
          style={{ top: `${pct}%` }}
        >
          {floor.label} · {fmtHeight(floor.height)}
        </span>
      </div>
      <span className="mb-3 text-[12px] font-semibold tracking-[0.12em] text-ink/55">PODIUM</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(last, floorIndex + 1))}
        disabled={floorIndex === last}
        aria-label="Go down one floor"
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink/80 transition hover:text-ink disabled:opacity-35"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  )
}
