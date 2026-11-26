import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GALLERY } from '../data/media'
import { prefersReducedMotion, useIsDesktop } from '../lib/hooks'
import { Chrome, EyeToggle, Segmented } from '../components/ui'

const SETS = [
  { value: 'exterior', label: 'Exterior' },
  { value: 'amenities', label: 'Amenities' },
]
const AUTO_ADVANCE_MS = 6000
const pad = (n) => String(n).padStart(2, '0')

/** Slideshow in a framed box: every photo is shown whole (never cropped). */
export default function Gallery() {
  const isDesktop = useIsDesktop()
  const [params, setParams] = useSearchParams()
  const set = SETS.some((s) => s.value === params.get('set')) ? params.get('set') : 'exterior'
  const images = GALLERY[set]
  const [index, setIndex] = useState(0)
  const [hidden, setHidden] = useState(false)
  const [paused, setPaused] = useState(false)
  const [ratio, setRatio] = useState(4 / 3) // current photo's width / height
  const imgRef = useRef(null)
  const thumbsRef = useRef(null)
  const touchX = useRef(null)

  const go = useCallback((d) => setIndex((i) => (i + d + images.length) % images.length), [images.length])

  useEffect(() => setIndex(0), [set])

  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const t = setTimeout(() => go(1), AUTO_ADVANCE_MS)
    return () => clearTimeout(t)
  }, [index, paused, go])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  useEffect(() => {
    thumbsRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    if (!imgRef.current || prefersReducedMotion()) return
    gsap.fromTo(imgRef.current, { autoAlpha: 0, scale: 1.025 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' })
  }, [index, set])

  const image = images[index]
  const arrow = 'glass grid h-11 w-11 place-items-center rounded-full text-ink/90 transition hover:text-ink lg:h-12 lg:w-12'

  const stage = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-panel ${isDesktop ? 'h-full w-full' : ''}`}
      // On phones the box takes the photo's own shape (as large as fits), so nothing is cropped or lost in empty space.
      style={isDesktop ? undefined : { aspectRatio: ratio, width: `min(100cqw, ${ratio} * 100cqh)` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      {/* Soft blurred fill so portrait and landscape shots both sit nicely in the box. */}
      <img src={image.thumb} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl" />
      <img
        ref={imgRef}
        key={image.src}
        src={image.src}
        alt={image.alt}
        onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        className="absolute inset-0 h-full w-full object-contain p-2 lg:p-3"
      />

      <Chrome hidden={hidden}>
        <div className="absolute inset-y-0 left-3 flex items-center lg:left-5">
          <button type="button" aria-label="Previous photo" className={arrow} onClick={() => go(-1)}>
            <ChevronLeft size={22} />
          </button>
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center lg:right-5">
          <button type="button" aria-label="Next photo" className={arrow} onClick={() => go(1)}>
            <ChevronRight size={22} />
          </button>
        </div>
        <p className="glass absolute left-4 top-4 max-w-[70%] truncate rounded-full px-4 py-2 text-[12px] text-ink/85">{image.caption || image.alt}</p>
      </Chrome>
    </div>
  )

  const counter = (
    <p className="font-display text-[15px] tabular-nums text-ink/80">
      <span className="text-gold">{pad(index + 1)}</span> <span className="text-ink/40">/ {pad(images.length)}</span>
    </p>
  )

  const controls = (
    <div className="flex items-center gap-2">
      {!hidden && <Segmented label="Gallery set" options={SETS} value={set} onChange={(v) => setParams({ set: v }, { replace: true })} className="glass" />}
      <EyeToggle hidden={hidden} onToggle={() => setHidden((h) => !h)} />
    </div>
  )

  const thumbs = (
    <div ref={thumbsRef} className="flex max-w-[34vw] gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
      {images.map((im, i) => (
        <button
          key={im.src}
          type="button"
          onClick={() => setIndex(i)}
          aria-label={`Show photo ${i + 1}`}
          aria-current={i === index ? 'true' : undefined}
          className={`h-12 w-[72px] shrink-0 overflow-hidden rounded-md border transition ${
            i === index ? 'border-gold opacity-100' : 'border-white/10 opacity-55 hover:opacity-90'
          }`}
        >
          <img src={im.thumb} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  )

  if (!isDesktop) {
    return (
      <div className="absolute inset-0 flex flex-col gap-3 px-3 pb-[calc(var(--nav-h)+0.75rem)] pt-[max(0.75rem,env(safe-area-inset-top))] land:gap-1.5 land:pb-[calc(var(--nav-h)+0.375rem)] land:pt-1.5">
        <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">{stage}</div>
        <div className="flex shrink-0 items-center justify-between px-1">
          {counter}
          {controls}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-x-4 bottom-4 top-[88px] flex flex-col gap-3">
      <div className="min-h-0 flex-1">{stage}</div>
      <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-1">
        <div>{counter}</div>
        {controls}
        <Chrome hidden={hidden} className="flex justify-end">
          {thumbs}
        </Chrome>
      </div>
    </div>
  )
}
