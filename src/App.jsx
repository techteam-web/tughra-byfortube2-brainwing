import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import TopBar from './components/TopBar'
import MobileNav from './components/MobileNav'
import Loader from './components/Loader'
import { PAGE_TITLES } from './data/site'
import { prefersReducedMotion, useIsDesktop } from './lib/hooks'
import { finishIntro, shouldPlayIntro } from './lib/intro'
import Home from './pages/Home'

gsap.registerPlugin(useGSAP)

const Views = lazy(() => import('./pages/Views'))
const FloorPlans = lazy(() => import('./pages/FloorPlans'))
const Location = lazy(() => import('./pages/Location'))
const Amenities = lazy(() => import('./pages/Amenities'))
const Gallery = lazy(() => import('./pages/Gallery'))
const BookVisit = lazy(() => import('./pages/BookVisit'))

export default function App() {
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const [loading, setLoading] = useState(shouldPlayIntro)
  useEffect(() => {
    if (!loading) finishIntro()
  }, [loading])
  const stage = useRef(null)

  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] ?? 'Tughra Royale'
  }, [location.pathname])

  // Soft fade between pages.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(stage.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power1.out' })
    },
    { dependencies: [location.pathname] },
  )

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      {isDesktop && <TopBar />}
      <main ref={stage} className="absolute inset-0">
        <Suspense fallback={<div className="h-full w-full bg-bg" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/views" element={<Views />} />
            <Route path="/floor-plans" element={<FloorPlans />} />
            <Route path="/location" element={<Location />} />
            <Route path="/amenities" element={<Amenities />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/book-visit" element={<BookVisit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isDesktop && <MobileNav />}
      {loading && <Loader onDone={() => setLoading(false)} />}
    </div>
  )
}
