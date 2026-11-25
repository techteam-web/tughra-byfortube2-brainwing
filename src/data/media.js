// Web-sized copies of the renders live in /public/media (originals stay in /public/assets).
const img = (path, alt) => ({ src: `/media/${path}.webp`, thumb: `/media/${path}-sm.webp`, alt })

export const AMENITY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'social', label: 'Social' },
  { key: 'specs', label: 'Home Specs' },
]

export const AMENITIES = [
  {
    id: 'pool',
    title: 'Infinity Sky Pool',
    eyebrow: 'Level 10 · Wellness',
    blurb: 'Temperature-controlled sunset lap deck',
    category: 'wellness',
    images: [img('amenities/pool', 'Infinity sky pool at sunset')],
  },
  {
    id: 'theatre',
    title: 'Starlight Private Theatre',
    eyebrow: 'Private Club · 18 Seats',
    blurb: 'Acoustic suede recliners & surround sound',
    category: 'social',
    images: [img('amenities/theatre', 'Private theatre with starlight ceiling')],
  },
  {
    id: 'garden',
    title: 'Planted Garden Terrace',
    eyebrow: 'Podium · 37.65 m',
    blurb: 'Landscaped courts & shaded swing seating',
    category: 'wellness',
    images: [img('amenities/garden', 'Planted garden terrace on the podium')],
  },
  {
    id: 'banquet',
    title: 'Grand Banquet Hall',
    eyebrow: 'Social · Divisible Hall',
    blurb: 'Fluted glass partitions & brass chandeliers',
    category: 'social',
    images: [
      img('amenities/banquet-1', 'Banquet hall set for a reception'),
      img('amenities/banquet-2', 'Banquet hall dining layout'),
    ],
  },
  {
    id: 'gym',
    title: 'Fitness Studio',
    eyebrow: 'Wellness · Club Level',
    blurb: 'Strength & cardio floor with skyline views',
    category: 'wellness',
    images: [img('amenities/gym-1', 'Fitness studio strength floor'), img('amenities/gym-2', 'Fitness studio free weights')],
  },
  {
    id: 'games',
    title: 'Games Lounge',
    eyebrow: 'Social · Club Level',
    blurb: 'Billiards, table tennis & chess lounge',
    category: 'social',
    images: [img('amenities/games-1', 'Games lounge with billiards'), img('amenities/games-2', 'Games lounge with table tennis')],
  },
  {
    id: 'podium',
    title: 'Podium Landscape Deck',
    eyebrow: 'Podium · Aerial',
    blurb: 'Green deck wrapped around the tower base',
    category: 'wellness',
    images: [img('amenities/podium-aerial', 'Aerial view of the landscaped podium')],
  },
]

export const HOME_SPECS = [
  { value: '3.6 m', title: 'Ceiling Height', detail: 'Floor-to-Floor Ceiling Height' },
  { value: 'Private Lift', title: 'Private Lift', detail: 'Direct Biometric Entrance Lobby' },
  { value: 'Acoustic Glass', title: 'Acoustic Glass', detail: 'Double-Glazed Low-E Windows' },
  { value: 'VRV & EV', title: 'VRV & EV', detail: 'Climate Control & Charging Ready' },
]

export const GALLERY = {
  exterior: [
    img('exterior/evening-wide', 'Tughra Royale balconies at dusk'),
    img('exterior/golden-hour', 'Tower at golden hour'),
    img('exterior/day', 'Tower in daylight'),
    img('exterior/evening-tower', 'Tower lit up in the evening'),
    img('exterior/metro', 'Tower above the metro line'),
  ],
  amenities: AMENITIES.flatMap((a) => a.images.map((im) => ({ ...im, caption: a.title }))),
}

export const BOOK_VISIT_PHOTO = img('exterior/golden-hour', 'Tughra Royale tower at golden hour')
