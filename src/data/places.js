// Coordinates are [longitude, latitude].
export const TOWER = { name: 'Tughra Royale', area: 'Mumbai Central', at: [72.822374, 18.972319] }

const CATEGORIES_RAW = [
  {
    key: 'connectivity',
    label: 'Connectivity',
    places: [
      { name: 'Aqua Line Metro', note: 'Metro Line 3 Station', at: [72.8203, 18.9708] },
      { name: 'Grant Road Station', note: 'Western Railway', at: [72.8161, 18.9637] },
      { name: 'Mahalaxmi Station', note: 'Western Railway', at: [72.8236, 18.9826] },
      { name: 'Lower Parel Station', note: 'Western Railway', at: [72.83, 18.997] },
      { name: 'Bandra-Worli Sea Link', note: 'Expressway Access', at: [72.817, 19.0275] },
      { name: 'CSMT Terminus', note: 'Central & Harbour Lines', at: [72.8355, 18.9398] },
      { name: 'Airport Terminal 2', note: 'International Airport', at: [72.8656, 19.0896] },
    ],
  },
  {
    key: 'landmarks',
    label: 'Landmarks',
    places: [
      { name: 'Maratha Mandir', note: 'Iconic Cinema', at: [72.8217, 18.9712] },
      { name: 'Mahalaxmi Race Course', note: '225-Acre Open Grounds', at: [72.8185, 18.982] },
      { name: 'Haji Ali Dargah', note: 'Heritage Shrine', at: [72.8089, 18.9827] },
      { name: 'Nehru Science Centre', note: 'Museum & Gardens', at: [72.8185, 18.9908] },
      { name: 'Palladium Mall', note: 'Luxury Retail', at: [72.8256, 18.9937] },
      { name: 'Girgaum Chowpatty', note: 'Seafront Beach', at: [72.8147, 18.9547] },
      { name: 'Marine Drive', note: 'Queen’s Necklace', at: [72.8236, 18.944] },
      { name: 'Gateway of India', note: 'Heritage Monument', at: [72.8347, 18.922] },
    ],
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    places: [
      { name: 'Nair Hospital', note: 'Teaching Hospital', at: [72.8202, 18.9751] },
      { name: 'Wockhardt Hospital', note: 'Super-Speciality Care', at: [72.8177, 18.9737] },
      { name: 'Jaslok Hospital', note: 'Multi-Specialty Care', at: [72.8096, 18.9716] },
      { name: 'Breach Candy Hospital', note: 'Multi-Specialty Care', at: [72.8045, 18.9715] },
      { name: 'Bombay Hospital', note: 'Multi-Specialty Care', at: [72.8277, 18.9432] },
    ],
  },
  {
    key: 'hospitality',
    label: 'Hospitality',
    places: [
      { name: 'Four Seasons Mumbai', note: 'Luxury Hotel', at: [72.8186, 18.9946] },
      { name: 'St. Regis Mumbai', note: 'Luxury Hotel', at: [72.8267, 18.9925] },
      { name: 'ITC Grand Central', note: 'Luxury Hotel', at: [72.8362, 19.0002] },
      { name: 'Trident Nariman Point', note: 'Seafront Hotel', at: [72.8203, 18.9273] },
      { name: 'Taj Mahal Palace', note: 'Heritage Hotel', at: [72.8332, 18.9217] },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    places: [
      { name: 'Peninsula Business Park', note: 'Office Campus', at: [72.8247, 18.9999] },
      { name: 'Kamala Mills', note: 'Offices & Dining', at: [72.8264, 19.0006] },
      { name: 'One Indiabulls Centre', note: 'Office Towers', at: [72.833, 18.998] },
      { name: 'Fort District', note: 'Financial Quarter', at: [72.8337, 18.934] },
      { name: 'Nariman Point', note: 'Business District', at: [72.8246, 18.9256] },
      { name: 'Bandra Kurla Complex', note: 'Business District', at: [72.8683, 19.0674] },
    ],
  },
  {
    key: 'schools',
    label: 'Schools',
    places: [
      { name: 'Sophia College', note: 'College', at: [72.8085, 18.9697] },
      { name: 'Grant Medical College', note: 'Medical College', at: [72.8346, 18.9632] },
      { name: 'St. Xavier’s College', note: 'College', at: [72.8312, 18.9435] },
      { name: 'Govt. Law College', note: 'Law College', at: [72.828, 18.9435] },
    ],
  },
]

/** Great-circle distance in km. */
export function distanceKm([lon1, lat1], [lon2, lat2]) {
  const r = Math.PI / 180
  const dLat = (lat2 - lat1) * r
  const dLon = (lon2 - lon1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(a))
}

/** Compass bearing in degrees (0 = north) from a to b. */
export function bearingDeg([lon1, lat1], [lon2, lat2]) {
  const r = Math.PI / 180
  const y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r)
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r)
  return (Math.atan2(y, x) / r + 360) % 360
}

export const PLACE_CATEGORIES = CATEGORIES_RAW.map((c) => ({
  ...c,
  places: c.places
    .map((p) => ({ ...p, id: `${c.key}:${p.name}`, km: distanceKm(TOWER.at, p.at) }))
    .sort((a, b) => a.km - b.km),
}))

export const TRAVEL_MODES = {
  drive: {
    label: 'By Car',
    short: 'by car',
    osrm: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
    kmh: 28,
  },
  walk: {
    label: 'Walking',
    short: 'walking',
    osrm: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
    kmh: 4.8,
  },
}

/** Rough door-to-door estimate used until a real route arrives. */
export function estimateTrip(place, mode) {
  const km = place.km * 1.3
  return { km, minutes: Math.max(1, Math.round((km / TRAVEL_MODES[mode].kmh) * 60)), approx: true }
}

const routeCache = new Map()

/** Fetch a road route from the tower to a place. Falls back to a curved line if routing is unavailable. */
export function fetchRoute(place, mode) {
  const key = `${mode}:${place.id}`
  if (routeCache.has(key)) return routeCache.get(key)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  const url = `${TRAVEL_MODES[mode].osrm}/${TOWER.at.join(',')};${place.at.join(',')}?overview=full&geometries=geojson`
  const promise = fetch(url, { signal: ctrl.signal })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data) => {
      const route = data.routes?.[0]
      if (!route?.geometry?.coordinates?.length) throw new Error('no route')
      return {
        coords: [TOWER.at, ...route.geometry.coordinates, place.at],
        km: route.distance / 1000,
        minutes: Math.max(1, Math.round(route.duration / 60)),
        approx: false,
      }
    })
    .catch(() => {
      routeCache.delete(key) // allow a retry next time
      return { coords: curve(TOWER.at, place.at), ...estimateTrip(place, mode) }
    })
    .finally(() => clearTimeout(timer))
  routeCache.set(key, promise)
  return promise
}

function curve(a, b, steps = 48) {
  const mid = [(a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.18, (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.18]
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const u = 1 - t
    return [u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0], u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1]]
  })
}

// Landmark tags shown on the 360° view. `placeId` links to the Location page.
export const VIEW_LANDMARKS = [
  { label: 'Arabian Sea', at: [72.8025, 18.9705], dot: 'gold', placeId: null },
  { label: 'Mahalaxmi Racecourse', at: [72.8185, 18.982], dot: 'blue', placeId: 'landmarks:Mahalaxmi Race Course' },
  { label: 'Haji Ali Dargah', at: [72.8089, 18.9827], dot: 'blue', placeId: 'landmarks:Haji Ali Dargah' },
  { label: 'Marine Drive', at: [72.8236, 18.944], dot: 'blue', placeId: 'landmarks:Marine Drive' },
]

// What lies in each compass direction from the tower (for the "Facing …" pill).
export const DIRECTION_HINTS = {
  North: 'Mahalaxmi & Worli Skyline',
  'North-East': 'Lower Parel Towers',
  East: 'Byculla & Eastern Harbour',
  'South-East': 'Nagpada & South Mumbai',
  South: 'Girgaon & Marine Drive',
  'South-West': 'Malabar Hill',
  West: 'Arabian Sea Horizon',
  'North-West': 'Haji Ali Bay',
}
