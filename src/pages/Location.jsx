import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { Car, Footprints, RotateCcw } from 'lucide-react'
import { PLACE_CATEGORIES, TOWER, TRAVEL_MODES, estimateTrip, fetchRoute } from '../data/places'
import { applyDarkStyle } from '../lib/mapStyle'
import { prefersReducedMotion, useIsDesktop, useIsLandscapePhone, useIsRoomy, useMediaQuery } from '../lib/hooks'
import { Segmented } from '../components/ui'
import { MobileHeader } from '../components/MobileNav'

// MapLibre's worker is an ES module; let Vite bundle it and hand MapLibre the URL.
setWorkerUrl(mapWorkerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const HOME_VIEW = { center: TOWER.at, zoom: 14.4, pitch: 50, bearing: -20 }
const EMPTY = { type: 'FeatureCollection', features: [] }
const MODE_OPTIONS = [
  { value: 'drive', label: 'By Car', Icon: Car },
  { value: 'walk', label: 'Walking', Icon: Footprints },
]
const ALL_PLACES = PLACE_CATEGORIES.flatMap((c) => c.places)
const LIST_CLASS = {
  column: 'scroll-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1',
  grid: 'grid min-h-0 grid-cols-2 content-start gap-1.5',
  row: 'flex shrink-0 snap-x gap-2 overflow-x-auto [scrollbar-width:none]', // swipe sideways
}

const fmtTrip = (t) => `${t.minutes} min`
const fmtKm = (t) => `${t.km.toFixed(1)} km`

function markerEl(className, html) {
  const el = document.createElement('div')
  el.className = className
  el.innerHTML = html
  return el
}

export default function Location() {
  const isDesktop = useIsDesktop()
  const isLand = useIsLandscapePhone()
  const isRoomy = useIsRoomy()
  const isShortDesktop = useMediaQuery('(min-width: 1024px) and (max-height: 820px)')
  // How the place list is laid out so the whole page fits on one screen.
  const listLayout = isDesktop ? (isShortDesktop ? 'grid' : 'column') : isRoomy || isLand ? 'grid' : 'row'
  const [params, setParams] = useSearchParams()
  const linked = ALL_PLACES.find((p) => p.id === params.get('place'))
  const [categoryKey, setCategoryKey] = useState(linked ? linked.id.split(':')[0] : PLACE_CATEGORIES[0].key)
  const [mode, setMode] = useState('drive')
  const [selectedId, setSelectedId] = useState(linked?.id ?? null)
  const [trips, setTrips] = useState({}) // `${mode}:${id}` -> trip
  const [mapReady, setMapReady] = useState(false)

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const destMarkerRef = useRef(null)

  const category = PLACE_CATEGORIES.find((c) => c.key === categoryKey)
  const selected = ALL_PLACES.find((p) => p.id === selectedId) ?? null
  const tripFor = useCallback((p) => trips[`${mode}:${p.id}`] ?? estimateTrip(p, mode), [trips, mode])

  const padding = useMemo(
    () =>
      isDesktop
        ? { top: 120, bottom: 100, left: isShortDesktop ? 520 : 420, right: 80 }
        : { top: isLand ? 60 : 80, bottom: 30, left: 50, right: 50 },
    [isDesktop, isLand, isShortDesktop],
  )

  // Map lifetime.
  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      ...HOME_VIEW,
      zoom: 12.6,
      pitch: 0,
      maxPitch: 70,
      attributionControl: { compact: true },
    })
    mapRef.current = map
    if (isDesktop) map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right')
    map.scrollZoom.setWheelZoomRate(1 / 600)

    map.on('load', () => {
      applyDarkStyle(map)
      map.addSource('route', { type: 'geojson', data: EMPTY })
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#0b1522', 'line-width': 7 },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#4d9bff', 'line-width': 3.5 },
      })
      map.easeTo({ ...HOME_VIEW, duration: prefersReducedMotion() ? 0 : 2600 })
      setMapReady(true)
    })

    new Marker({
      element: markerEl(
        'flex items-center gap-2',
        `<span class="block h-4 w-4 rounded-full border-2 border-[#16110e] bg-[#d4a85a] shadow-[0_0_0_5px_rgb(212_168_90/0.3)]"></span>
         <span class="rounded-md bg-[#d4a85a] px-2.5 py-1 text-[12px] font-semibold text-[#1a130d] whitespace-nowrap">${TOWER.name} · ${TOWER.area}</span>`,
      ),
      anchor: 'left',
      offset: [-8, 0],
    })
      .setLngLat(TOWER.at)
      .addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      destMarkerRef.current = null
      setMapReady(false)
    }
  }, [isDesktop])

  // Estimate → real route times for the visible list, one request at a time.
  useEffect(() => {
    let alive = true
    ;(async () => {
      for (const p of category.places) {
        if (!alive) return
        const trip = await fetchRoute(p, mode)
        if (!alive) return
        if (!trip.approx) setTrips((t) => ({ ...t, [`${mode}:${p.id}`]: trip }))
      }
    })()
    return () => {
      alive = false
    }
  }, [category, mode])

  // Draw the selected route.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const source = map.getSource('route')
    destMarkerRef.current?.remove()
    destMarkerRef.current = null
    if (!selected) {
      source.setData(EMPTY)
      return
    }
    let alive = true
    fetchRoute(selected, mode).then((trip) => {
      if (!alive) return
      if (!trip.approx) setTrips((t) => ({ ...t, [`${mode}:${selected.id}`]: trip }))
      source.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: trip.coords }, properties: {} })
      destMarkerRef.current?.remove()
      destMarkerRef.current = new Marker({
        element: markerEl(
          'flex flex-col items-center gap-1.5',
          `<span class="rounded-md border border-[#4d9bff] bg-[#16110e]/95 px-2.5 py-1 text-[12px] font-semibold text-[#f5f0e8] whitespace-nowrap">${selected.name} · ${trip.minutes} min (${trip.km.toFixed(1)} km)</span>
           <span class="block h-3.5 w-3.5 rounded-full border-2 border-[#4d9bff] bg-[#16110e]"></span>`,
        ),
        anchor: 'bottom',
        offset: [0, 7],
      })
        .setLngLat(selected.at)
        .addTo(map)
      const bounds = trip.coords.reduce((b, c) => b.extend(c), new LngLatBounds(TOWER.at, TOWER.at))
      map.fitBounds(bounds, { padding, maxZoom: 16, pitch: 40, bearing: -20, duration: prefersReducedMotion() ? 0 : 1400 })
    })
    return () => {
      alive = false
    }
  }, [selected, mode, mapReady, padding])

  const choosePlace = (p) => {
    setSelectedId(p.id)
    const next = new URLSearchParams(params)
    next.set('place', p.id)
    setParams(next, { replace: true })
  }

  const resetMap = () => {
    setSelectedId(null)
    setParams({}, { replace: true })
    mapRef.current?.flyTo({ ...HOME_VIEW, duration: prefersReducedMotion() ? 0 : 1400 })
  }

  const panel = (
    <>
      <p className="eyebrow compact:hidden">Mumbai Central</p>
      <h1 className="mt-1 font-display text-[22px] font-semibold compact:text-[18px] land:hidden">Nearby Landmarks</h1>
      <div className="mt-4 flex shrink-0 flex-wrap gap-1.5 compact:mt-2 max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:[scrollbar-width:none]">
        {PLACE_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategoryKey(c.key)}
            aria-pressed={c.key === categoryKey}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              c.key === categoryKey ? 'bg-gold text-[#1a130d]' : 'border border-white/12 text-ink/75 hover:text-ink'
            }`}
          >
            {c.label} ({c.places.length})
          </button>
        ))}
      </div>
      <Segmented label="Travel mode" options={MODE_OPTIONS} value={mode} onChange={setMode} size="sm" className="mt-3 shrink-0 self-start bg-white/5 compact:mt-2 land:mt-1.5" />
      <ul className={`${LIST_CLASS[listLayout]} mt-4 compact:mt-2 land:mt-1.5`}>
        {category.places.map((p) => {
          const active = p.id === selectedId
          const trip = tripFor(p)
          return (
            <li key={p.id} className={listLayout === 'row' ? 'w-[68%] shrink-0 snap-start phablet:w-[46%]' : 'min-w-0'}>
              <button
                type="button"
                onClick={() => choosePlace(p)}
                aria-current={active ? 'true' : undefined}
                className={`flex h-full w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors compact:py-1.5 land:px-2.5 land:py-1.5 ${
                  active ? 'border-route/70 bg-route/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                  <span className={`block truncate text-[12px] land:hidden ${active ? 'text-route' : 'text-ink/50'}`}>{active ? 'Showing route' : p.note}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={`block text-[13px] font-semibold ${active ? 'text-route' : ''}`}>
                    {trip.approx ? '~' : ''}
                    {fmtTrip(trip)}
                  </span>
                  <span className="block text-[12px] text-ink/50 land:hidden">{fmtKm(trip)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )

  const selectedTrip = selected && tripFor(selected)
  const routeBar = (
    <div className="glass flex shrink-0 items-center justify-between gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-[12px]">
      {selected ? (
        <span className="min-w-0 truncate text-route">
          {selected.name} · {fmtKm(selectedTrip)} · {fmtTrip(selectedTrip)} {TRAVEL_MODES[mode].short}
        </span>
      ) : (
        <span className="min-w-0 truncate text-ink/65">Pick a place to see the route</span>
      )}
      <button type="button" onClick={resetMap} className="btn-outline h-8 shrink-0 whitespace-nowrap px-3.5 text-[12px]">
        <RotateCcw size={13} /> Reset Map
      </button>
    </div>
  )

  if (!isDesktop) {
    return (
      <div className="absolute inset-0 flex flex-col pb-[var(--nav-h)] land:flex-row">
        {/* On a sideways phone the header sits over the map only. */}
        <MobileHeader className="land:right-[58%]" />
        <div className="relative min-h-0 flex-1">
          <div ref={containerRef} className="absolute inset-0" />
        </div>
        <div className="solid-panel relative -mt-3 flex shrink-0 flex-col rounded-t-2xl border-b-0 px-4 pb-3 pt-3 md:px-6 md:pb-4 md:pt-4 compact:pb-2 compact:pt-2 land:mt-0 land:w-[58%] land:justify-center land:rounded-none land:px-3 land:py-1.5">
          {routeBar}
          <div className="mt-3 flex flex-col compact:mt-2 land:mt-1.5">{panel}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      <aside className={`glass absolute bottom-6 left-6 top-[88px] flex flex-col rounded-2xl p-5 compact:bottom-4 compact:p-4 ${isShortDesktop ? 'w-[440px]' : 'w-[340px]'}`}>
        {panel}
      </aside>
      <div className="absolute bottom-6 right-16">{routeBar}</div>
    </div>
  )
}
