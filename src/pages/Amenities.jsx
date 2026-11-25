import { useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Expand } from 'lucide-react'
import { AMENITIES, AMENITY_FILTERS, HOME_SPECS } from '../data/media'
import { prefersReducedMotion, useIsDesktop } from '../lib/hooks'
import { Lightbox } from '../components/ui'
import { MobileHeader } from '../components/MobileNav'

const countFor = (key) => (key === 'all' || key === 'specs' ? AMENITIES.length : AMENITIES.filter((a) => a.category === key).length)

/**
 * Bento layouts that fill the whole stage for any number of cards.
 * Each entry: grid template + per-card span classes (by index).
 */
function bentoFor(n) {
  switch (n) {
    case 1:
      return { grid: 'grid-cols-1 grid-rows-1', spans: [''] }
    case 2:
      return { grid: 'grid-cols-2 grid-rows-1', spans: ['', ''] }
    case 3:
      return { grid: 'grid-cols-3 grid-rows-2', spans: ['col-span-2 row-span-2', '', ''] }
    case 4:
      return { grid: 'grid-cols-2 grid-rows-2', spans: ['', '', '', ''] }
    case 5:
      return { grid: 'grid-cols-4 grid-rows-2', spans: ['col-span-2 row-span-2', '', '', '', ''] }
    case 6:
      return { grid: 'grid-cols-3 grid-rows-2', spans: Array(6).fill('') }
    default:
      // 7: one wide hero card on the top row, four below.
      return { grid: 'grid-cols-4 grid-rows-2', spans: ['col-span-2', '', '', '', '', '', ''] }
  }
}

function AmenityCard({ amenity, span = '', large, onOpen, className = '' }) {
  const img = amenity.images[0]
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`am-card group relative min-h-0 overflow-hidden rounded-2xl border border-white/10 text-left ${span} ${className}`}
      aria-label={`${amenity.title} — open photo${amenity.images.length > 1 ? 's' : ''}`}
    >
      <img
        src={img.thumb}
        srcSet={`${img.thumb} 900w, ${img.src} 2400w`}
        sizes={large ? '50vw' : '25vw'}
        alt={img.alt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-[1.05]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <span className={`absolute bottom-0 left-0 right-0 ${large ? 'p-6' : 'p-4 xl:p-5'}`}>
        <span className="eyebrow block">{amenity.eyebrow}</span>
        <span className={`mt-1 block font-display font-semibold leading-tight ${large ? 'text-[26px]' : 'text-[18px] xl:text-[20px]'}`}>{amenity.title}</span>
        <span className="mt-1 block text-[13px] text-ink/70">{amenity.blurb}</span>
      </span>
      <span className="glass absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] opacity-0 transition-opacity group-hover:opacity-100">
        <Expand size={13} /> {amenity.images.length > 1 ? `${amenity.images.length} photos` : 'View'}
      </span>
    </button>
  )
}

export default function Amenities() {
  const isDesktop = useIsDesktop()
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const stageRef = useRef(null)

  const shown = useMemo(() => (filter === 'all' || filter === 'specs' ? AMENITIES : AMENITIES.filter((a) => a.category === filter)), [filter])
  const photos = useMemo(() => shown.flatMap((a) => a.images.map((im) => ({ ...im, caption: a.title }))), [shown])
  const openPhoto = (a) => setLightbox(photos.findIndex((p) => p.src === a.images[0].src))
  const bento = bentoFor(shown.length)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.am-card', { autoAlpha: 0, y: 18, scale: 0.985, duration: 0.6, stagger: 0.05, ease: 'power3.out' })
    },
    { scope: stageRef, dependencies: [filter === 'specs' ? 'all' : filter] },
  )
  useGSAP(
    () => {
      if (filter !== 'specs' || prefersReducedMotion()) return
      gsap.fromTo('.am-specs', { boxShadow: '0 0 0 0 rgb(212 168 90 / 0.6)' }, { boxShadow: '0 0 0 10px rgb(212 168 90 / 0)', duration: 1, ease: 'power2.out' })
    },
    { scope: stageRef, dependencies: [filter] },
  )

  const filters = (
    <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Filter amenities">
      {AMENITY_FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => setFilter(f.key)}
          aria-pressed={filter === f.key}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
            filter === f.key ? 'bg-gold text-[#1a130d]' : 'border border-white/12 text-ink/75 hover:text-ink'
          }`}
        >
          {f.label}
          {f.key === 'all' && ` (${countFor('all')})`}
        </button>
      ))}
    </div>
  )

  const specs = (
    <section
      aria-label="Home specifications"
      className={`am-specs solid-panel grid shrink-0 rounded-2xl ${isDesktop ? 'grid-cols-4 px-6 py-4' : 'grid-cols-2 gap-y-3 px-4 py-3'} ${
        filter === 'specs' ? 'border-gold/60' : ''
      }`}
    >
      {HOME_SPECS.map((s, i) => (
        <div key={s.title} className={`pr-4 ${isDesktop && i ? 'border-l border-white/10 pl-6' : ''}`}>
          <p className={`font-display font-semibold ${isDesktop ? 'text-[17px]' : 'text-[15px]'} ${i === 0 ? 'text-gold' : ''}`}>{s.value}</p>
          <p className="mt-0.5 text-[12px] text-ink/55">{s.detail}</p>
        </div>
      ))}
    </section>
  )

  return (
    <div ref={stageRef} className="absolute inset-0 overflow-hidden">
      {isDesktop ? (
        <div className="absolute inset-x-4 bottom-4 top-[88px] flex flex-col gap-3">
          <header className="flex shrink-0 items-end justify-between gap-4 px-1">
            <div>
              <p className="eyebrow">Level 10 &amp; Sky Terrace</p>
              <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight">Curated Lifestyle Spaces</h1>
            </div>
            {filters}
          </header>
          <div className={`grid min-h-0 flex-1 gap-3 ${bento.grid}`}>
            {shown.map((a, i) => (
              <AmenityCard key={a.id} amenity={a} span={bento.spans[i]} large={bento.spans[i].includes('span-2')} onOpen={() => openPhoto(a)} />
            ))}
          </div>
          {specs}
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-0 flex flex-col gap-3 pb-3 pt-[calc(max(0.75rem,env(safe-area-inset-top))+3rem)]">
          <MobileHeader />
          <header className="shrink-0 px-4">
            <p className="eyebrow">Level 10 &amp; Sky Terrace</p>
            <h1 className="mt-1 font-display text-[24px] font-semibold leading-tight">Curated Lifestyle Spaces</h1>
          </header>
          <div className="shrink-0 px-4">{filters}</div>
          <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 [scrollbar-width:none]">
            {shown.map((a) => (
              <AmenityCard key={a.id} amenity={a} large onOpen={() => openPhoto(a)} className="h-full w-[84%] shrink-0 snap-center" />
            ))}
          </div>
          <div className="shrink-0 px-4">{specs}</div>
        </div>
      )}

      {lightbox != null && <Lightbox images={photos} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
