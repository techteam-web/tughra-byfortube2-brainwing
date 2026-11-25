import Marzipano from 'marzipano'

export { Marzipano }

export const deg = (r) => (r * 180) / Math.PI
export const rad = (d) => (d * Math.PI) / 180

/** A tiled cube source as exported by Marzipano Tool (with preview.jpg for the lowest level). */
export function tiledSource(sceneUrl) {
  return Marzipano.ImageUrlSource.fromString(`${sceneUrl}/{z}/{f}/{y}/{x}.jpg`, {
    cubeMapPreviewUrl: `${sceneUrl}/preview.jpg`,
  })
}

export function createViewer(element) {
  return new Marzipano.Viewer(element, {
    controls: { mouseViewMode: 'drag' },
    stage: { progressive: true },
  })
}

export function startAutorotate(viewer, { speed = 0.03, idleMs = 3000 } = {}) {
  const motion = Marzipano.autorotate({ yawSpeed: speed, targetPitch: 0, targetFov: Math.PI / 2 })
  viewer.setIdleMovement(idleMs, motion)
  viewer.startMovement(motion)
}

/** Calls `onDrag` once the user actually drags (not just clicks) inside `element`. */
export function onFirstDrag(element, onDrag) {
  let start = null
  const down = (e) => (start = { x: e.clientX, y: e.clientY })
  const move = (e) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) {
      cleanup()
      onDrag()
    }
  }
  const up = () => (start = null)
  const cleanup = () => {
    element.removeEventListener('pointerdown', down)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  element.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  return cleanup
}

const DIRECTIONS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West']
export const compassName = (bearing) => DIRECTIONS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]

/**
 * Marzipano can throw ("TextureStore: unloading texture not in cache") when a
 * viewer is destroyed while tiles are still loading. Never let that break a
 * page change.
 */
export function destroyViewer(viewer) {
  try {
    viewer.stopMovement()
    viewer.setIdleMovement(Infinity)
    viewer.destroy()
  } catch {
    /* already torn down */
  }
}
