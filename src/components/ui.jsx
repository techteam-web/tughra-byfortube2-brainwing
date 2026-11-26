import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Hand, RotateCw, X } from 'lucide-react'
import { useMediaQuery } from '../lib/hooks'

/** Pill switch; the active option is gold. */
export function Segmented({ options, value, onChange, size = 'md', className = '', label }) {
  const pad = size === 'sm' ? 'h-8 px-3 text-[12px]' : 'h-9 px-4 text-[13px]'
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex items-center gap-1 rounded-full p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.Icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors ${pad} ${
              active ? 'bg-gold text-[#1a130d]' : 'text-ink/70 hover:text-ink'
            }`}
          >
            {Icon && <Icon size={14} strokeWidth={2} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Eye icon that hides every on-screen control for a clean photo. */
export function EyeToggle({ hidden, onToggle, className = '' }) {
  const Icon = hidden ? EyeOff : Eye
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={hidden}
      aria-label={hidden ? 'Show controls' : 'Hide controls for a clean view'}
      title={hidden ? 'Show controls' : 'Hide controls'}
      className={`glass grid h-10 w-10 place-items-center rounded-full text-ink/85 transition hover:text-ink ${className}`}
    >
      <Icon size={17} strokeWidth={1.8} />
    </button>
  )
}

export function DragHint({ visible, children = 'Drag anywhere to look around 360°', className = '' }) {
  return (
    <div
      className={`glass pointer-events-none flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium text-ink/85 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      aria-hidden={!visible}
    >
      <Hand size={14} className="text-gold" />
      {children}
    </div>
  )
}

/** Full-screen photo viewer with arrows, keyboard and swipe. */
export function Lightbox({ images, index, onClose, onIndex }) {
  const [touch, setTouch] = useState(null)
  // An upright phone can turn a wide photo sideways so it fills the whole screen.
  const portrait = useMediaQuery('(orientation: portrait) and (max-width: 1023px)')
  const [turned, setTurned] = useState(false)
  const [wide, setWide] = useState(false)
  const rotated = turned && portrait && wide
  const go = useCallback((d) => onIndex((index + d + images.length) % images.length), [index, images.length, onIndex])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  const img = images[index]
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={img.alt}
      className="fixed inset-0 z-[120] flex touch-none items-center justify-center overflow-hidden bg-black"
      onClick={onClose}
      onTouchStart={(e) => setTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch) return
        // When the photo is turned sideways, "sideways" for the viewer is up and down.
        const d = rotated ? e.changedTouches[0].clientY - touch.y : e.changedTouches[0].clientX - touch.x
        if (Math.abs(d) > 50) go(d < 0 ? 1 : -1)
        setTouch(null)
      }}
    >
      <img
        key={img.src}
        src={img.src}
        alt={img.alt}
        className={
          rotated
            ? 'absolute left-1/2 top-1/2 h-[100vw] w-[100dvh] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-contain'
            : 'max-h-[100dvh] max-w-[100vw] object-contain'
        }
        onLoad={(e) => setWide(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)}
        onClick={(e) => e.stopPropagation()}
      />
      {portrait && wide && (
        <button
          type="button"
          aria-pressed={turned}
          onClick={(e) => (e.stopPropagation(), setTurned((t) => !t))}
          className="glass absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-medium"
        >
          <RotateCw size={16} /> {turned ? 'Upright' : 'Rotate'}
        </button>
      )}
      <p className="glass pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-max max-w-[92vw] -translate-x-1/2 truncate rounded-full px-4 py-2 text-[12px] text-ink/85">
        {img.caption || img.alt} · {index + 1} / {images.length}
      </p>
      <button type="button" aria-label="Close" onClick={onClose} className="glass absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full">
        <X size={20} />
      </button>
      {images.length > 1 && !rotated && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => (e.stopPropagation(), go(-1))}
            className="glass absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => (e.stopPropagation(), go(1))}
            className="glass absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  )
}

/** Fades children out when `hidden` (used by the Eye toggle). */
export function Chrome({ hidden, children, className = '' }) {
  return (
    <div className={`transition-opacity duration-300 ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'} ${className}`}>
      {children}
    </div>
  )
}
