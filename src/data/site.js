export const NAV_LINKS = [
  { to: '/', label: 'Overview' },
  { to: '/views', label: '360° Views' },
  { to: '/floor-plans', label: 'Floor Plans' },
  { to: '/amenities', label: 'Amenities' },
  { to: '/location', label: 'Location' },
  { to: '/gallery', label: 'Gallery' },
]

export const PAGE_TITLES = {
  '/': 'Tughra Royale',
  '/views': '360° Views · Tughra Royale',
  '/floor-plans': 'Floor Plans · Tughra Royale',
  '/amenities': 'Amenities · Tughra Royale',
  '/location': 'Location · Tughra Royale',
  '/gallery': 'Gallery · Tughra Royale',
  '/book-visit': 'Book a Visit · Tughra Royale',
}

export const PROJECT_STATS = [
  { value: '28', label: 'Floors' },
  { value: '108.9 m', label: 'Sky Terrace', gold: true },
  { value: '4 & 5 BHK', label: 'Residences' },
]

// Sales lounge details shown on the Book a Visit page.
// The phone number is the one shown in the UI notes mockup; confirm before launch.
export const SALES_LOUNGE = {
  name: 'Fortune Square Sales Lounge, Mumbai Central',
  hours: 'Open Daily · 10:00 AM – 7:30 PM',
  phone: '+91 22 4890 1200',
}

// Where the enquiry form posts leads. Set VITE_LEAD_ENDPOINT in .env to the
// backend URL; it receives a JSON POST (see src/pages/BookVisit.jsx).
export const LEAD_ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT || ''
