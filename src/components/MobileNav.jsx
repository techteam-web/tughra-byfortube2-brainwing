import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CalendarCheck, Compass, Home, Images, LayoutGrid, MapPin, Menu, Sparkles, X } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/views', label: '360°', Icon: Compass },
  { to: '/floor-plans', label: 'Plans', Icon: LayoutGrid },
]

const MENU_LINKS = [
  { to: '/location', label: 'Location', Icon: MapPin },
  { to: '/amenities', label: 'Amenities', Icon: Sparkles },
  { to: '/gallery', label: 'Gallery', Icon: Images },
  { to: '/book-visit', label: 'Book a Visit', Icon: CalendarCheck },
]

/** Phone layout: fixed bottom bar with Home, 360°, Plans and Menu. */
export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const menuActive = MENU_LINKS.some((l) => pathname.startsWith(l.to))

  useEffect(() => setOpen(false), [pathname])

  const tabClass = (active) =>
    `flex flex-1 flex-col items-center justify-center gap-1 text-[12px] font-medium ${active ? 'text-gold' : 'text-ink/65'}`

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/55" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Menu"
            className="solid-panel absolute inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] rounded-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="eyebrow">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="p-1 text-ink/70">
                <X size={18} />
              </button>
            </div>
            {MENU_LINKS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] ${isActive ? 'bg-gold/10 text-gold' : 'text-ink'}`
                }
              >
                <Icon size={18} strokeWidth={1.7} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-[61] flex h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-white/10 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive && !open)}>
            <Icon size={20} strokeWidth={1.7} />
            {label}
          </NavLink>
        ))}
        <button type="button" onClick={() => setOpen((o) => !o)} className={tabClass(open || menuActive)} aria-expanded={open}>
          <Menu size={20} strokeWidth={1.7} />
          Menu
        </button>
      </nav>
    </>
  )
}

/** Small header for phone pages: Tughra badge left, Book Visit right. */
export function MobileHeader({ children }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <Link to="/" className="glass pointer-events-auto flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3" aria-label="Tughra Royale — Home">
        <img src="/media/tughra-mark-gold.png" alt="" className="h-6 w-auto" />
        <span className="font-display text-[12px] font-semibold tracking-[0.14em]">TUGHRA</span>
      </Link>
      {children}
      <Link to="/book-visit" className="btn-gold pointer-events-auto h-8 px-4 text-[12px]">
        Book Visit
      </Link>
    </div>
  )
}
