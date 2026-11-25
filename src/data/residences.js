const isoFrames = (id) =>
  Array.from({ length: 120 }, (_, i) => `/isoframes/${id}/${String(i + 1).padStart(3, '0')}.webp`)

// Areas are in sq.ft. `null` means the figure has not been supplied yet;
// the UI shows a dash for it. 4 BHK numbers are from the UI integration notes.
export const RESIDENCES = [
  {
    id: '4bhk',
    label: '4 BHK',
    title: '4 BHK Home',
    typeName: 'Residence Type A',
    tag: 'Sky Deck',
    carpetArea: 3640,
    balcony: 283,
    rooms: [
      { name: 'Living Room', area: 1101 },
      { name: 'Master Bedroom 4', area: 365 },
      { name: 'Dining Room', area: 270 },
      { name: 'Master Bedroom 1', area: 266 },
      { name: 'Media Room', area: 190 },
      { name: 'Island Kitchen', area: 180 },
    ],
    isoFrames: isoFrames('4bhk'),
    // Drop the 2D drawing at this path to enable the 2D view and preview.
    plan2d: null, // e.g. '/plans/4bhk-plan.webp'
    planPdf: '/plans/tughra-royale-4bhk-plan.pdf',
  },
  {
    id: '5bhk',
    label: '5 BHK',
    title: '5 BHK Home',
    typeName: 'Residence Type B',
    tag: 'Dual Corner',
    carpetArea: 4820,
    balcony: null,
    rooms: [
      { name: 'Drawing Room', area: null },
      { name: 'Dining', area: null },
      { name: 'Kitchen', area: null },
      { name: 'Bedroom 01', area: null },
      { name: 'Bedroom 02', area: null },
      { name: 'Bedroom 03', area: null },
      { name: 'Bedroom 04', area: null },
      { name: 'Bedroom 05', area: null },
    ],
    isoFrames: isoFrames('5bhk'),
    plan2d: null, // e.g. '/plans/5bhk-plan.webp'
    planPdf: '/plans/tughra-royale-5bhk-plan.pdf',
  },
]

export const SQFT_TO_SQM = 0.092903

const pad2 = (n) => String(n).padStart(2, '0')
const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`

/**
 * Every level of the tower, bottom to top. The ORDER MATTERS: the floor masks in
 * /towerframes/floors/NNN.png store (index + 1) of this list in each pixel, which
 * is how a click on the turning tower is mapped to a level.
 */
export const TOWER_LEVELS = [
  { id: 'ground', num: 'G', label: 'Ground Floor', kind: 'lobby' },
  { id: 'retail', num: '01', label: 'Retail Level 01', kind: 'retail' },
  ...[2, 3, 4, 5, 6, 7].map((n) => ({ id: `podium-${pad2(n)}`, num: pad2(n), label: `Podium Level ${pad2(n)}`, kind: 'podium' })),
  ...[8, 9].map((n) => ({ id: `office-${pad2(n)}`, num: pad2(n), label: `Office Level ${pad2(n)}`, kind: 'office' })),
  { id: 'amenities', num: '10', label: 'Amenities', kind: 'amenity' },
  ...Array.from({ length: 17 }, (_, i) => i + 11).map((n) => ({ id: `f${n}`, num: String(n), label: `${ordinal(n)} Floor`, level: n, kind: 'residence' })),
  { id: 'terrace', num: 'T', label: 'Terrace', kind: 'terrace' },
]

export const LEVEL_KIND_LABEL = {
  lobby: 'Entrance',
  retail: 'Retail',
  podium: 'Podium',
  office: 'Office',
  amenity: 'Amenities',
  terrace: 'Terrace',
  residence: 'Floor',
}

export const LEVEL_NOTES = {
  lobby: 'The entrance lobby. No residences on this level.',
  retail: 'The retail level, at the street. No residences on this level.',
  podium: 'A podium level. No residences on this level.',
  office: 'An office level. No residences on this level.',
  amenity: 'Amenities for residents. No residences on this level.',
  terrace: 'The terrace, above the residences.',
}

export const DEFAULT_LEVEL = 'f17'
