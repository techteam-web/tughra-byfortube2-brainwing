import { useRef } from 'react'
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { useGSAP } from '@gsap/react'
import { FORTUNE_LOGO, TUGHRA_LOGO } from '../data/logoPaths'
import { prefersReducedMotion } from '../lib/hooks'

gsap.registerPlugin(DrawSVGPlugin)

const GOLD = '#d4a85a'
const INK = '#f5f0e8'
const split = (d) => d.split(/(?=M)/).filter(Boolean)

/**
 * Traced logo: one stroked <path> per outline (so DrawSVG can stagger them)
 * plus a single filled compound path that fades in once the lines are drawn.
 */
function DrawnLogo({ logo, className, prefix, strokeWidth }) {
  return (
    <svg viewBox={logo.viewBox} className={className} aria-hidden="true">
      {['mark', 'word'].map((part) => (
        <g key={part} className={`${prefix}-${part}`}>
          <path className={`${prefix}-fill`} d={logo[part]} fill={part === 'mark' ? GOLD : INK} fillRule="evenodd" opacity="0" />
          {split(logo[part]).map((d, i) => (
            <path
              key={i}
              className={`${prefix}-line`}
              d={d}
              fill="none"
              stroke={part === 'mark' ? GOLD : INK}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

/**
 * Brand intro: Tughra Royale seal and wordmark draw in, then "An initiative by"
 * Fortune Square, then the screen parts like a curtain onto the site.
 */
export default function Loader({ onDone }) {
  const root = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const finish = () => onDone()

      if (prefersReducedMotion()) {
        gsap.set(q('.tr-fill, .fs-fill'), { opacity: 1 })
        gsap.set(q('.tr-line, .fs-line'), { opacity: 0 })
        gsap.timeline({ onComplete: finish }).to(root.current, { autoAlpha: 0, duration: 0.4, delay: 0.6 })
        return
      }

      gsap.set(q('.tr-line, .fs-line'), { drawSVG: '0%' })
      gsap.set(q('.stage-fortune'), { autoAlpha: 0 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: finish })
      tl
        // 1. Tughra seal, then wordmark, drawn as lines.
        .to(q('.tr-mark .tr-line'), { drawSVG: '100%', duration: 1.5, stagger: 0.04 })
        .to(q('.tr-word .tr-line'), { drawSVG: '100%', duration: 0.9, stagger: 0.025 }, '-=0.7')
        // 2. Fill in, lines dissolve.
        .to(q('.tr-fill'), { opacity: 1, duration: 0.6, ease: 'power1.out' }, '-=0.15')
        .to(q('.tr-line'), { opacity: 0, duration: 0.5 }, '<')
        .from(q('.tr-tag'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'power2.out' }, '<0.2')
        // 3. Hand over to Fortune Square.
        .to(q('.stage-tughra'), { autoAlpha: 0, y: -14, duration: 0.55, ease: 'power2.in' }, '+=0.45')
        .set(q('.stage-fortune'), { autoAlpha: 1 })
        .from(q('.fs-by'), { autoAlpha: 0, y: 8, duration: 0.45, ease: 'power2.out' })
        .to(q('.fs-mark .fs-line'), { drawSVG: '100%', duration: 0.9, stagger: 0.05 }, '-=0.15')
        .to(q('.fs-word .fs-line'), { drawSVG: '100%', duration: 0.8, stagger: 0.02 }, '-=0.5')
        .to(q('.fs-fill'), { opacity: 1, duration: 0.5, ease: 'power1.out' }, '-=0.1')
        .to(q('.fs-line'), { opacity: 0, duration: 0.4 }, '<')
        // 4. Curtain: a gold hairline appears, then the two halves part.
        .to(q('.stage-fortune'), { autoAlpha: 0, scale: 0.97, duration: 0.45, ease: 'power2.in' }, '+=0.5')
        .fromTo(q('.seam'), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power3.inOut' }, '-=0.1')
        .to(q('.skip'), { autoAlpha: 0, duration: 0.3 }, '<')
        .to(q('.half-l'), { xPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.05')
        .to(q('.half-r'), { xPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
        .to(q('.seam'), { autoAlpha: 0, duration: 0.3 }, '<0.1')

      // Skip jumps straight to the curtain.
      root.current.querySelector('.skip').onclick = () => tl.seek(tl.duration() - 1.2)
    },
    { scope: root },
  )

  const half = 'absolute inset-y-0 w-1/2 bg-bg'
  const glow = { backgroundImage: 'radial-gradient(48rem 30rem at 50% 46%, rgb(212 168 90 / 0.09), transparent 70%)' }

  return (
    <div ref={root} className="fixed inset-0 z-[200]" role="presentation">
      <div className={`half-l left-0 ${half}`} style={{ ...glow, backgroundSize: '200% 100%', backgroundPosition: 'left' }} />
      <div className={`half-r right-0 ${half}`} style={{ ...glow, backgroundSize: '200% 100%', backgroundPosition: 'right' }} />
      <span className="seam absolute inset-y-0 left-1/2 w-px -translate-x-1/2 origin-center bg-gradient-to-b from-transparent via-gold to-transparent" />

      <div className="stage-tughra absolute inset-0 flex flex-col items-center justify-center">
        <DrawnLogo logo={TUGHRA_LOGO} prefix="tr" strokeWidth={5} className="h-[min(38vh,300px)] w-auto" />
        <p className="tr-tag mt-7 text-[12px] font-medium uppercase tracking-[0.32em] text-ink/60">Mumbai Central</p>
      </div>

      <div className="stage-fortune absolute inset-0 flex flex-col items-center justify-center">
        <p className="fs-by mb-7 text-[12px] font-medium uppercase tracking-[0.32em] text-ink/60">An initiative by</p>
        <DrawnLogo logo={FORTUNE_LOGO} prefix="fs" strokeWidth={4} className="h-[min(36vh,280px)] w-auto" />
      </div>

      <button
        type="button"
        className="skip absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 rounded-full px-3 py-2 text-[12px] font-medium uppercase tracking-[0.2em] text-ink/50 transition hover:text-ink"
      >
        Skip
      </button>
    </div>
  )
}
