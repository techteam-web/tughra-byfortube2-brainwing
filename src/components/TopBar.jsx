import { Link, NavLink } from 'react-router-dom'
import { Maximize, Minimize } from 'lucide-react'
import { NAV_LINKS } from '../data/site'
import { useFullscreen } from '../lib/hooks'

export function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-full pr-2" aria-label="Tughra Royale — Home">
      <img src="/media/tughra-mark-gold.png" alt="" className={compact ? 'h-7 w-auto' : 'h-8 w-auto'} />
      <span className="whitespace-nowrap font-display text-[13px] font-semibold tracking-[0.16em] text-ink">TUGHRA ROYALE</span>
    </Link>
  )
}

export function FullscreenButton({ className = '' }) {
  const { supported, active, toggle } = useFullscreen()
  if (!supported) return null
  const Icon = active ? Minimize : Maximize
  return (
    <button
      type="button"
      onClick={toggle}
      className={`grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink/85 transition hover:border-white/40 hover:text-ink ${className}`}
      aria-label={active ? 'Exit full screen' : 'Enter full screen'}
      title={active ? 'Exit full screen' : 'Full screen'}
    >
      <Icon size={16} strokeWidth={1.8} />
    </button>
  )
}

/** Desktop top menu bar, fixed on every page. */
export default function TopBar() {
  return (
    <header className="glass fixed inset-x-4 top-4 z-50 flex h-14 items-center justify-between rounded-2xl px-3 pl-4">
      <Logo />
      <nav aria-label="Main" className="flex items-center gap-0.5 xl:absolute xl:left-1/2 xl:-translate-x-1/2 xl:gap-1">
        {NAV_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors xl:px-3.5 ${
                isActive ? 'bg-gold/15 text-gold ring-1 ring-gold/40' : 'text-ink/75 hover:text-ink'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/book-visit" className="btn-gold h-9 whitespace-nowrap px-4 text-[13px] xl:px-5">
          Book a Visit
        </Link>
        <FullscreenButton />
      </div>
    </header>
  )
}
