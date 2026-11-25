import { useEffect, useRef, useState } from 'react'
import { Rotate3d } from 'lucide-react'

const PX_PER_FRAME = 7

/** Frame-sequence turntable: drag sideways (or scroll) to rotate. */
export default function Turntable({ frames, alt, className = '', fit = 'contain' }) {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const frameRef = useRef(0)
  const dragRef = useRef(null)
  const [loaded, setLoaded] = useState(0)
  const [touched, setTouched] = useState(false)

  const draw = (index) => {
    const canvas = canvasRef.current
    const img = imagesRef.current[index]
    if (!canvas || !img?.complete || !img.naturalWidth) return false
    const { width, height } = canvas
    const ctx = canvas.getContext('2d')
    const scale = (fit === 'cover' ? Math.max : Math.min)(width / img.naturalWidth, height / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    const x = (width - w) / 2
    const y = (height - h) / 2
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    ctx.clearRect(0, 0, width, height)
    // Fill the letterbox by stretching the frame's own edge pixels, so the backdrop has no seam.
    if (y > 0) {
      ctx.drawImage(img, 0, 0, iw, 2, x, 0, w, y + 1)
      ctx.drawImage(img, 0, ih - 2, iw, 2, x, y + h - 1, w, y + 1)
    }
    if (x > 0) {
      ctx.drawImage(img, 0, 0, 2, ih, 0, y, x + 1, h)
      ctx.drawImage(img, iw - 2, 0, 2, ih, x + w - 1, y, x + 1, h)
    }
    ctx.drawImage(img, x, y, w, h)
    return true
  }

  // Load the sequence (first frame first, the rest after).
  useEffect(() => {
    let alive = true
    frameRef.current = 0
    setLoaded(0)
    const imgs = frames.map(() => new Image())
    imagesRef.current = imgs
    const load = (i) => {
      imgs[i].decoding = 'async'
      imgs[i].onload = () => {
        if (!alive) return
        setLoaded((n) => n + 1)
        if (i === frameRef.current) draw(i)
      }
      imgs[i].src = frames[i]
    }
    load(0)
    imgs[0].addEventListener('load', () => frames.forEach((_, i) => i && alive && load(i)), { once: true })
    return () => {
      alive = false
    }
  }, [frames])

  // Keep the canvas sharp at any size.
  useEffect(() => {
    const canvas = canvasRef.current
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      draw(frameRef.current)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const step = (delta) => {
    const n = frames.length
    const next = (((frameRef.current + delta) % n) + n) % n
    if (next === frameRef.current) return
    // Skip frames that have not arrived yet.
    if (draw(next)) frameRef.current = next
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, acc: 0 }
    setTouched(true)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    d.acc += e.clientX - d.x
    d.x = e.clientX
    const frames = Math.trunc(d.acc / PX_PER_FRAME)
    if (frames) {
      step(-frames)
      d.acc -= frames * PX_PER_FRAME
    }
  }
  const onPointerUp = () => (dragRef.current = null)

  const onWheel = (e) => {
    setTouched(true)
    step(Math.sign(e.deltaY || e.deltaX))
  }

  const ready = loaded > 0
  const progress = Math.round((loaded / frames.length) * 100)

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className="h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      {!ready && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      <div
        className={`glass pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-medium text-ink/85 transition-opacity duration-500 ${
          touched && progress === 100 ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Rotate3d size={14} className="text-gold" />
        {progress < 100 ? `Loading 3D layout · ${progress}%` : 'Drag to rotate 3D layout'}
      </div>
    </div>
  )
}
