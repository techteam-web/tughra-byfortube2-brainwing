// Coordinates are [longitude, latitude].
// The tower stands on the corner of Dr. Anandrao L. Nair Road and Souter Street (Meghraj Sethi Marg).
// Exact building location supplied by the client: 18.972330979560734, 72.82237632533439.
export const TOWER = { name: 'Tughra Royale', area: 'Mumbai Central', at: [72.82237632533439, 18.972330979560734] }

// Well-known, highly rated places around Mumbai Central. Most positions were supplied by the client;
// the rest come from OpenStreetMap (checked November 2026).
const CATEGORIES_RAW = [
  {
    key: 'connectivity',
    label: 'Connectivity',
    places: [
      { name: 'Mumbai Central Station', note: 'Western Railway & Long-Distance Trains', at: [72.81925830168002, 18.969660468864745] },
      { name: 'Mumbai Central Metro', note: 'Aqua Line · Jagannath Shankarsheth Stn', at: [72.8213312761598, 18.970730764861575] },
      { name: 'Grant Road Station', note: 'Western Railway', at: [72.8162507663682, 18.96343532319463] },
      { name: 'Mahalaxmi Station', note: 'Western Railway', at: [72.82379635515282, 18.981858622927227] },
      { name: 'Coastal Road', note: 'Worli Access', at: [72.82643417134376, 19.044122723145186] },
      { name: 'Bandra-Worli Sea Link', note: 'Worli Entry', at: [72.8166773658634, 19.034111515735727] },
      { name: 'CSMT', note: 'Central & Harbour Lines', at: [72.8357071761353, 18.94015117385] },
      { name: 'Airport Terminal 2', note: 'International & Domestic Flights', at: [72.87340451300028, 19.103820561169737] },
    ],
  },
  {
    key: 'landmarks',
    label: 'Landmarks',
    places: [
      { name: 'Mahalakshmi Temple', note: 'Historic Temple', at: [72.806025, 18.977391] },
      { name: 'Haji Ali Dargah', note: 'Shrine in the Sea', at: [72.80899889768484, 18.98282067840381] },
      { name: 'Mahalaxmi Racecourse', note: 'Racecourse & Open Grounds', at: [72.81982577354225, 18.984780548806043] },
      { name: 'Bhau Daji Lad Museum', note: 'City Museum, Rani Baug', at: [72.834794, 18.979102] },
      { name: 'Girgaum Chowpatty', note: 'Seafront Beach', at: [72.81462368338347, 18.954420255468246] },
      { name: 'Hanging Gardens', note: 'Malabar Hill Gardens', at: [72.804904, 18.956692] },
      { name: 'Marine Drive', note: 'Queen’s Necklace Promenade', at: [72.82263750445065, 18.944011065877188] },
      { name: 'Gateway of India', note: 'Heritage Monument', at: [72.83464650481335, 18.922018113532324] },
    ],
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    places: [
      { name: 'Nair Hospital', note: 'Teaching Hospital', at: [72.82179349892209, 18.973053274618074] },
      { name: 'Wockhardt Hospital', note: 'Super-Speciality Care', at: [72.82388192583713, 18.975224003514434] },
      { name: 'Bhatia Hospital', note: 'Multi-Speciality Care', at: [72.81323667330311, 18.965867932392847] },
      { name: 'Jaslok Hospital', note: 'Multi-Speciality Care', at: [72.809926, 18.971701] },
      { name: 'Sir H. N. Reliance Hospital', note: 'Multi-Speciality Care', at: [72.82033311519925, 18.958774939036584] },
      { name: 'Breach Candy Hospital', note: 'Multi-Speciality Care', at: [72.804268, 18.972566] },
      { name: 'Saifee Hospital', note: 'Multi-Speciality Care', at: [72.818195, 18.952521] },
    ],
  },
  {
    key: 'hospitality',
    label: 'Hospitality',
    places: [
      { name: 'The St. Regis Mumbai', note: 'Luxury Hotel, Palladium', at: [72.82372043670141, 18.995171400588944] },
      { name: 'Four Seasons Mumbai', note: 'Luxury Hotel', at: [72.82055793141221, 18.994984003986865] },
      { name: 'ITC Grand Central', note: 'Luxury Hotel', at: [72.83872472124136, 18.999144728750828] },
      { name: 'The Oberoi Mumbai', note: 'Luxury Hotel', at: [72.820585, 18.926984] },
      { name: 'Trident Nariman Point', note: 'Seafront Hotel', at: [72.821126, 18.927838] },
      { name: 'The Taj Mahal Palace', note: 'Heritage Hotel', at: [72.83319317372491, 18.92169981272087] },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    places: [
      { name: 'Peninsula Business Park', note: 'Lower Parel Offices', at: [72.829247, 18.998704] },
      { name: 'One Indiabulls Centre', note: 'Lower Parel Office Towers', at: [72.832934, 19.00674] },
      { name: 'Bombay Stock Exchange', note: 'Dalal Street, Fort', at: [72.83340560839316, 18.930003309263377] },
      { name: 'Nariman Point', note: 'Business District', at: [72.823586, 18.927089] },
      { name: 'World Trade Centre', note: 'Cuffe Parade', at: [72.817349, 18.914445] },
      { name: 'Bandra Kurla Complex', note: 'Business District', at: [72.866638, 19.063875] },
    ],
  },
  {
    key: 'schools',
    label: 'Education',
    places: [
      { name: 'Hill Spring International', note: 'IB & IGCSE School, Tardeo', at: [72.812737, 18.972956] },
      { name: 'Activity High School', note: 'School, Pedder Road', at: [72.80886, 18.974314] },
      { name: 'Sophia College', note: 'College, Breach Candy', at: [72.806832, 18.969725] },
      { name: 'Fellowship School', note: 'School, Gowalia Tank', at: [72.811003, 18.962004] },
      { name: 'Walsingham House School', note: 'Girls’ School, Malabar Hill', at: [72.796187, 18.953764] },
      { name: 'St. Xavier’s College', note: 'College, Fort', at: [72.831361, 18.943102] },
      { name: 'Cathedral & John Connon', note: 'School, Fort', at: [72.832551, 18.936118] },
      { name: 'Bombay Scottish School', note: 'School, Mahim', at: [72.83911477696665, 19.034425309535248] },
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
  // The open sea off the Mahalakshmi coast, left of Haji Ali in the view. It names an area, so it is
  // shown just above the horizon and without a distance.
  { label: 'Arabian Sea', at: [72.79929, 18.98076], dot: 'gold', placeId: null, area: true },
  { label: 'Mahalaxmi Racecourse', at: [72.81982577354225, 18.984780548806043], dot: 'blue', placeId: 'landmarks:Mahalaxmi Racecourse' },
  { label: 'Haji Ali Dargah', at: [72.80899889768484, 18.98282067840381], dot: 'blue', placeId: 'landmarks:Haji Ali Dargah' },
  { label: 'Marine Drive', at: [72.82263750445065, 18.944011065877188], dot: 'blue', placeId: 'landmarks:Marine Drive' },
]

// What lies in each compass direction from the tower (for the "Facing …" pill).
export const DIRECTION_HINTS = {
  North: 'Mahalaxmi & Worli Skyline',
  'North-East': 'Lower Parel Towers',
  East: 'Byculla & Eastern Harbour',
  'South-East': 'Nagpada & South Mumbai',
  South: 'Girgaon & Marine Drive',
  'South-West': 'Malabar Hill',
  West: 'Tardeo & Arabian Sea',
  'North-West': 'Haji Ali Bay',
}
