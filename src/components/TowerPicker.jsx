import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// Tower turntable frames (1600×900, transparent background) and per-frame floor masks.
// Mask geometry is expressed in a 1920×1080 frame space: each mask pixel covers a
// STEP×STEP block starting at (X, Y). A pixel's red value is (level index + 1).
const FRAME_W = 1920
const FRAME_H = 1080
const STEP = 2
const MASK_X = 792
const MASK_Y = 110
const MASK_W = 165
const MASK_H = 445
const FRAME_COUNT = 100
const RANGE = [-FRAME_COUNT / 2, FRAME_COUNT / 2] // half a turn either way
const PX_PER_FRAME = 9
const CLICK_SLOP = 6

const pad3 = (n) => String(n).padStart(3, '0')
const FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => `/towerframes/${pad3(i + 1)}.webp`)
const MASKS = Array.from({ length: FRAME_COUNT }, (_, i) => `/towerframes/floors/${pad3(i + 1)}.png`)

const wrap = (i) => ((i % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT
const clamp = (v) => Math.min(RANGE[1], Math.max(RANGE[0], v))

/**
 * Drag or scroll to turn the tower; hover a band to highlight a level; click to pick it.
 * `colors` = { shade, accent, edge } as [r, g, b].
 */
export default function TowerPicker({ levels, selectedId, hoveredId, onHover, onPick, isPickable, colors, className = '' }) {
  const boxRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const imagesRef = useRef([])
  const masksRef = useRef(new Map())
  const motion = useRef({ pos: 0, target: 0, dragging: false, raf: 0, grabX: 0, grabFrom: 0, downX: 0, downY: 0, moved: false })
  const pointerRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [settled, setSettled] = useState(0) // frame index when still, null while turning
  const [maskTick, setMaskTick] = useState(0)
  const [ready, setReady] = useState(false)
  const [turned, setTurned] = useState(false)

  // Frame → container mapping ("cover", like the frames themselves).
  const scale = size.w && size.h ? Math.max(size.w / FRAME_W, size.h / FRAME_H) : 0
  const offX = (size.w - FRAME_W * scale) / 2
  const offY = (size.h - FRAME_H * scale) / 2

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = canvas
    const pos = motion.current.pos
    const base = Math.floor(pos)
    const frac = pos - base
    const draw = (img, alpha) => {
      if (!img?.complete || !img.naturalWidth) return false
      const s = Math.max(width / img.naturalWidth, height / img.naturalHeight)
      const w = img.naturalWidth * s
      const h = img.naturalHeight * s
      ctx.globalAlpha = alpha
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
      ctx.globalAlpha = 1
      return true
    }
    // Nearest loaded frame, so turning never shows a blank.
    let img = null
    for (let d = 0; d < FRAME_COUNT && !img; d++) {
      for (const i of [base - d, base + d]) {
        const cand = imagesRef.current[wrap(i)]
        if (cand?.complete && cand.naturalWidth) {
          img = cand
          break
        }
      }
    }
    if (!img) return
    ctx.clearRect(0, 0, width, height)
    draw(img, 1)
    if (frac > 0.02) draw(imagesRef.current[wrap(base + 1)], frac)
  }, [])

  // Load frames and masks.
  useEffect(() => {
    let alive = true
    imagesRef.current = FRAMES.map((src, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (!alive) return
        if (i === 0) setReady(true)
        paint()
      }
      img.src = src
      return img
    })
    const scratch = document.createElement('canvas')
    scratch.width = MASK_W
    scratch.height = MASK_H
    const sctx = scratch.getContext('2d', { willReadFrequently: true })
    MASKS.forEach((src, i) => {
      const img = new Image()
      img.onload = () => {
        if (!alive) return
        sctx.clearRect(0, 0, MASK_W, MASK_H)
        sctx.drawImage(img, 0, 0)
        const data = sctx.getImageData(0, 0, MASK_W, MASK_H).data
        const ids = new Uint8Array(MASK_W * MASK_H)
        for (let p = 0; p < ids.length; p++) ids[p] = data[p * 4]
        masksRef.current.set(i, ids)
        setMaskTick((t) => t + 1)
      }
      img.src = src
    })
    return () => {
      alive = false
      imagesRef.current.forEach((im) => (im.onload = null))
    }
  }, [paint])

  // Size the canvas to its box.
  useEffect(() => {
    const box = boxRef.current
    const ro = new ResizeObserver(() => {
      const w = box.clientWidth
      const h = box.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvasRef.current.width = Math.round(w * dpr)
      canvasRef.current.height = Math.round(h * dpr)
      setSize({ w, h })
      paint()
    })
    ro.observe(box)
    return () => ro.disconnect()
  }, [paint])

  useEffect(() => () => cancelAnimationFrame(motion.current.raf), [])

  const animate = useCallback(() => {
    const m = motion.current
    if (m.raf) return
    const tick = () => {
      if (!m.dragging) m.target += (Math.round(m.target) - m.target) * 0.18
      m.pos += (m.target - m.pos) * 0.22
      paint()
      const still = !m.dragging && Math.abs(m.pos - m.target) < 0.003 && Math.abs(m.target - Math.round(m.target)) < 0.003
      if (still) {
        m.pos = m.target = Math.round(m.target)
        paint()
        m.raf = 0
        setSettled(wrap(m.pos))
        return
      }
      m.raf = requestAnimationFrame(tick)
    }
    m.raf = requestAnimationFrame(tick)
  }, [paint])

  const startTurning = () => {
    setSettled(null)
    setTurned(true)
    onHover(null)
    animate()
  }

  // Which level is under a screen point (only when the tower is still).
  const levelAt = useCallback(
    (clientX, clientY) => {
      if (settled == null || !scale) return null
      const mask = masksRef.current.get(settled)
      if (!mask) return null
      const r = boxRef.current.getBoundingClientRect()
      const fx = (clientX - r.left - offX) / scale
      const fy = (clientY - r.top - offY) / scale
      const c = Math.floor((fx - MASK_X) / STEP)
      const l = Math.floor((fy - MASK_Y) / STEP)
      if (c < 0 || l < 0 || c >= MASK_W || l >= MASK_H) return null
      const v = mask[l * MASK_W + c]
      return v ? (levels[v - 1] ?? null) : null
    },
    [settled, scale, offX, offY, levels],
  )

  // Re-evaluate hover once the tower stops under a resting pointer.
  useEffect(() => {
    if (settled != null && pointerRef.current) onHover(levelAt(pointerRef.current.x, pointerRef.current.y)?.id ?? null)
  }, [settled, maskTick, levelAt, onHover])

  // Paint the floor highlight overlay for the current still frame.
  useLayoutEffect(() => {
    const canvas = overlayRef.current
    const mask = settled == null ? null : masksRef.current.get(settled)
    if (!canvas) return
    if (!mask) {
      canvas.style.opacity = '0'
      return
    }
    const ctx = canvas.getContext('2d')
    const out = ctx.createImageData(MASK_W, MASK_H)
    const px = out.data
    const styleFor = levels.map((lv) => {
      const pickable = isPickable(lv)
      if (pickable && lv.id === selectedId) return [colors.accent, 0.6, true]
      if (lv.id === hoveredId) return pickable ? [colors.accent, 0.45, true] : [colors.shade, 0.18, false]
      return pickable ? [colors.shade, 0.2, true] : null
    })
    for (let p = 0; p < mask.length; p++) {
      const v = mask[p]
      if (!v) continue
      const st = styleFor[v - 1]
      const above = p >= MASK_W ? mask[p - MASK_W] : 0
      let rgb
      let a
      if (above && above !== v && (st?.[2] || styleFor[above - 1]?.[2])) {
        rgb = colors.edge
        a = 0.45
      } else if (st) {
        ;[rgb, a] = st
      } else continue
      const o = p * 4
      px[o] = rgb[0]
      px[o + 1] = rgb[1]
      px[o + 2] = rgb[2]
      px[o + 3] = Math.round(a * 255)
    }
    ctx.putImageData(out, 0, 0)
    canvas.style.opacity = '1'
  }, [settled, maskTick, selectedId, hoveredId, levels, isPickable, colors])

  const onPointerDown = (e) => {
    if (!ready) return
    const m = motion.current
    e.currentTarget.setPointerCapture(e.pointerId)
    Object.assign(m, { dragging: true, grabX: e.clientX, grabFrom: m.target, downX: e.clientX, downY: e.clientY, moved: false })
  }
  const onPointerMove = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY }
    const m = motion.current
    if (m.dragging) {
      if (!m.moved && Math.hypot(e.clientX - m.downX, e.clientY - m.downY) > CLICK_SLOP) {
        m.moved = true
        startTurning()
      }
      if (m.moved) {
        m.target = clamp(m.grabFrom - (e.clientX - m.grabX) / PX_PER_FRAME)
        animate()
      }
      return
    }
    const id = levelAt(e.clientX, e.clientY)?.id ?? null
    if (id !== hoveredId) onHover(id)
  }
  const onPointerUp = (e) => {
    const m = motion.current
    if (!m.dragging) return
    m.dragging = false
    if (!m.moved) {
      const lv = levelAt(e.clientX, e.clientY)
      if (lv && isPickable(lv)) onPick(lv.id)
    } else animate()
  }
  const onWheel = (e) => {
    if (!ready) return
    const m = motion.current
    m.target = clamp(m.target + (e.deltaY || e.deltaX) / 40)
    startTurning()
  }

  const hovered = levels.find((l) => l.id === hoveredId)
  const cursor = hovered && isPickable(hovered) ? 'pointer' : 'grab'

  return (
    <div
      ref={boxRef}
      className={`relative touch-pan-y select-none overflow-hidden ${className}`}
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (motion.current.dragging = false)}
      onPointerLeave={() => {
        pointerRef.current = null
        if (!motion.current.dragging && hoveredId) onHover(null)
      }}
      onWheel={onWheel}
      role="img"
      aria-label="Tughra Royale tower — drag or scroll to turn, click a residence floor to open its plans"
    >
      {!ready && <img src={FRAMES[0]} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <canvas
        ref={overlayRef}
        width={MASK_W}
        height={MASK_H}
        aria-hidden="true"
        className="pointer-events-none absolute transition-opacity duration-300"
        style={{
          opacity: 0,
          left: offX + MASK_X * scale,
          top: offY + MASK_Y * scale,
          width: MASK_W * STEP * scale,
          height: MASK_H * STEP * scale,
        }}
      />
      <span
        className={`pointer-events-none absolute bottom-[18%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--fp-ink)]/15 bg-[var(--fp-bg)]/90 px-4 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[var(--fp-ink-soft)] transition-opacity duration-500 ${
          turned ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {ready ? 'Drag or scroll to turn' : 'Loading the tower'}
      </span>
    </div>
  )
}
