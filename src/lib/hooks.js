import { useCallback, useEffect, useState } from 'react'

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null

/** Ask for browser fullscreen. Must run inside a click or tap. Resolves false where unsupported (iPhone Safari). */
export async function enterFullscreen() {
  const root = document.documentElement
  const request = root.requestFullscreen || root.webkitRequestFullscreen
  if (!request || fsElement()) return false
  try {
    await request.call(root)
    return true
  } catch {
    return false
  }
}

export function exitFullscreen() {
  if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document)?.catch?.(() => {})
}

/** Fullscreen state plus a safe toggle. `supported` is false on iPhone Safari. */
export function useFullscreen() {
  const root = typeof document !== 'undefined' ? document.documentElement : null
  const supported = !!root && !!(root.requestFullscreen || root.webkitRequestFullscreen)
  const [active, setActive] = useState(() => (typeof document !== 'undefined' ? !!fsElement() : false))

  useEffect(() => {
    const onChange = () => setActive(!!fsElement())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (fsElement()) {
        await (document.exitFullscreen || document.webkitExitFullscreen).call(document)
      } else {
        await (root.requestFullscreen || root.webkitRequestFullscreen).call(root)
      }
    } catch {
      // The browser refused (e.g. not triggered by a click); nothing to do.
    }
  }, [root])

  return { supported, active, toggle }
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Desktop layout = top bar + side panels. Below this width the phone layout is used. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')

/** A phone held sideways: very little height, so panels sit side by side. */
export const useIsLandscapePhone = () => useMediaQuery('(orientation: landscape) and (max-height: 500px)')

/** Tablet in portrait: enough room to show everything at once. */
export const useIsRoomy = () => useMediaQuery('(min-width: 768px) and (min-height: 900px)')

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
