import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRight } from 'lucide-react'
import { HOME_PANO } from '../data/panos'
import { PROJECT_STATS } from '../data/site'
import { Marzipano, createViewer, destroyViewer, onFirstDrag, rad, startAutorotate, tiledSource } from '../lib/pano'
import { prefersReducedMotion, useIsDesktop } from '../lib/hooks'
import { introDone } from '../lib/intro'
import { DragHint } from '../components/ui'
import { MobileHeader } from '../components/MobileNav'

/** The drone panorama with the tower's balcony layered on top, kept in sync. */
function HomePanorama({ onDrag }) {
  const bgRef = useRef(null)
  const fgRef = useRef(null)

  useEffect(() => {
    const bgViewer = createViewer(bgRef.current)
    const limiter = Marzipano.RectilinearView.limit.traditional(3600, rad(120))
    const view = new Marzipano.RectilinearView({ yaw: rad(HOME_PANO.startYawDeg), pitch: 0, fov: rad(90) }, limiter)
    bgViewer
      .createScene({
        source: tiledSource(HOME_PANO.tiles),
        geometry: new Marzipano.CubeGeometry([
          { tileSize: 256, size: 256, fallbackOnly: true },
          { tileSize: 512, size: 512 },
          { tileSize: 512, size: 1024 },
          { tileSize: 512, size: 2048 },
          { tileSize: 512, size: 4096 },
        ]),
        view,
        pinFirstLevel: true,
      })
      .switchTo()

    const fgViewer = new Marzipano.Viewer(fgRef.current, { controls: { mouseViewMode: 'drag' } })
    const fgView = new Marzipano.RectilinearView(view.parameters())
    fgViewer
      .createScene({
        source: Marzipano.ImageUrlSource.fromString(HOME_PANO.foreground),
        geometry: new Marzipano.CubeGeometry([{ tileSize: 2048, size: 2048 }]),
        view: fgView,
      })
      .switchTo()
    const sync = () => fgView.setParameters(view.parameters())
    view.addEventListener('change', sync)

    if (!prefersReducedMotion()) startAutorotate(bgViewer)
    const stopDrag = onFirstDrag(bgRef.current, onDrag)

    return () => {
      stopDrag()
      view.removeEventListener('change', sync)
      destroyViewer(fgViewer)
      destroyViewer(bgViewer)
    }
  }, [onDrag])

  return (
    <>
      <div ref={bgRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div ref={fgRef} className="pointer-events-none absolute inset-0" />
    </>
  )
}

export default function Home() {
  const isDesktop = useIsDesktop()
  const [dragged, setDragged] = useState(false)
  const [onDrag] = useState(() => () => setDragged(true))
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // Hold the hero hidden until the preloader's curtain has opened.
      const tl = gsap.timeline({ paused: true })
      tl.from('.hero-in', { autoAlpha: 0, y: 22, duration: 0.9, stagger: 0.09, ease: 'power3.out' })
      tl.progress(0).pause()
      introDone.then(() => tl.play())
    },
    { scope: root },
  )

  return (
    <div ref={root} className="absolute inset-0">
      <HomePanorama onDrag={onDrag} />

      {/* Soft shadow so the headline reads over the sunset. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDesktop
            ? 'linear-gradient(90deg, rgb(22 17 14 / 0.88) 0%, rgb(22 17 14 / 0.6) 28%, rgb(22 17 14 / 0.12) 52%, transparent 66%)'
            : 'linear-gradient(0deg, rgb(22 17 14 / 0.95) 0%, rgb(22 17 14 / 0.75) 34%, transparent 62%)',
        }}
      />

      {isDesktop ? (
        <>
          <section className="pointer-events-none absolute left-[max(3rem,6vw)] top-1/2 max-w-[520px] -translate-y-[42%]">
            <p className="hero-in eyebrow">Mumbai Central · An Initiative by Fortune Square</p>
            <h1 className="hero-in mt-4 font-display text-[clamp(44px,5vw,68px)] font-semibold leading-[1.03] tracking-[-0.02em]">
              A World Away
              <br />
              From Ordinary.
            </h1>
            <p className="hero-in mt-5 max-w-[420px] text-[15px] leading-relaxed text-ink/80">
              Spacious 4 &amp; 5 BHK sky residences crowned in architectural copper, rising 108.9 metres above Mumbai
              Central and the Arabian Sea.
            </p>
            <div className="hero-in pointer-events-auto mt-8 flex items-center gap-3">
              <Link to="/views" className="btn-gold h-11 px-6 text-[14px]">
                Explore 360° Views
              </Link>
              <Link to="/floor-plans" className="btn-outline h-11 px-6 text-[14px]">
                View Floor Plans
              </Link>
            </div>
          </section>

          <DragHint visible={!dragged} className="absolute bottom-7 left-1/2 -translate-x-1/2" />

          <dl className="glass hero-in absolute bottom-6 right-6 flex divide-x divide-white/10 rounded-2xl py-3">
            {PROJECT_STATS.map((s) => (
              <div key={s.label} className="px-5">
                <dt className="sr-only">{s.label}</dt>
                <dd className={`font-display text-[18px] font-semibold ${s.gold ? 'text-gold' : 'text-ink'}`}>{s.value}</dd>
                <dd className="mt-0.5 text-[12px] text-ink/60">{s.label}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <>
          <MobileHeader />
          <section className="pointer-events-none absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] px-5 pb-5">
            <DragHint visible={!dragged} className="mx-auto mb-5 w-fit" />
            <p className="hero-in eyebrow">Mumbai Central · 4 &amp; 5 BHK</p>
            <h1 className="hero-in mt-3 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em]">
              A World Away
              <br />
              From Ordinary.
            </h1>
            <p className="hero-in mt-3 text-[14px] leading-relaxed text-ink/80">
              108.9 m sky terrace overlooking the Arabian Sea.
            </p>
            <Link to="/views" className="hero-in btn-gold pointer-events-auto mt-5 h-12 w-full text-[15px]">
              Explore 360° Views <ArrowRight size={16} />
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
