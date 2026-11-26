// Draws the Tughra Royale 3D model on the MapLibre map, at its real size.
// Loaded on demand by the Location page, so three.js stays out of the other pages.
import { MercatorCoordinate } from 'maplibre-gl'
import { ACESFilmicToneMapping, AmbientLight, Camera, DirectionalLight, Matrix4, PMREMGenerator, Scene, Vector3, Vector4, WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Web copy of public/Building_Updated (smaller textures, compact geometry, same triangles).
const MODEL_URL = '/models/tughra-royale.glb'

// Which way the tower faces, in degrees clockwise. Change this to turn it on its plot.
export const BUILDING_HEADING_DEG = 0

// The centre of the footprint in the model's own coordinates (metres, Y up).
const FOOTPRINT_CENTRE = { x: 4.53, z: -2.71 }

export const BUILDING_LAYER_ID = 'tughra-building'

export function createBuildingLayer(lngLat, { onLoad, onError } = {}) {
  const origin = MercatorCoordinate.fromLngLat(lngLat, 0)
  const metre = origin.meterInMercatorCoordinateUnits()

  // Model space (metres, Y up) → map space.
  const placement = new Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new Vector3(metre, -metre, metre))
    .multiply(new Matrix4().makeRotationX(Math.PI / 2))
    .multiply(new Matrix4().makeRotationY((-BUILDING_HEADING_DEG * Math.PI) / 180))
    .multiply(new Matrix4().makeTranslation(-FOOTPRINT_CENTRE.x, 0, -FOOTPRINT_CENTRE.z))

  const camera = new Camera()
  camera.matrixWorldAutoUpdate = false // set from the map's view on every frame
  const view = new Matrix4()
  const inverse = new Matrix4()
  const eye = new Vector4()
  const scene = new Scene()
  let renderer = null
  let environment = null
  let removed = false

  const release = (object) =>
    object.traverse((node) => {
      node.geometry?.dispose()
      for (const material of [node.material].flat()) {
        if (!material) continue
        Object.values(material).forEach((value) => value?.isTexture && value.dispose())
        material.dispose()
      }
    })

  return {
    id: BUILDING_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map, gl) {
      renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false
      renderer.toneMapping = ACESFilmicToneMapping
      renderer.toneMappingExposure = 0.9

      // Soft studio reflections for the glass and copper, plus a low warm sun.
      const pmrem = new PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      environment = pmrem.fromScene(room, 0.04).texture
      scene.environment = environment
      scene.environmentIntensity = 0.55
      pmrem.dispose()
      renderer.resetState()

      scene.add(new AmbientLight(0xfff1e0, 0.35))
      const sun = new DirectionalLight(0xffd9a8, 1.8)
      sun.position.set(-60, 90, 50)
      scene.add(sun)

      new GLTFLoader().load(
        MODEL_URL,
        (gltf) => {
          if (removed) return release(gltf.scene)
          scene.add(gltf.scene)
          map.triggerRepaint()
          onLoad?.()
        },
        undefined,
        (error) => {
          console.warn('The 3D building could not be loaded.', error)
          onError?.(error)
        },
      )
    },

    render(_gl, args) {
      view.fromArray(args.defaultProjectionData.mainMatrix).multiply(placement)
      // MapLibre gives one combined matrix. Recover where its camera sits (in model space) so
      // reflections on the glass and copper are seen from the right direction.
      eye.set(0, 0, 1, 0).applyMatrix4(inverse.copy(view).invert())
      const x = eye.x / eye.w
      const y = eye.y / eye.w
      const z = eye.z / eye.w
      camera.matrixWorld.makeTranslation(x, y, z)
      camera.matrixWorldInverse.makeTranslation(-x, -y, -z)
      camera.projectionMatrix.copy(view).multiply(camera.matrixWorld)
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
      renderer.resetState()
      renderer.render(scene, camera)
    },

    onRemove() {
      removed = true
      release(scene)
      environment?.dispose()
      renderer?.dispose()
    },
  }
}

/** Hide the map's own grey blocks where the tower stands, so they don't poke through it. */
export function clearBuildingPlot(map, lngLat, radiusMetres = 32) {
  const away = ['>', ['distance', { type: 'Point', coordinates: lngLat }], radiusMetres]
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'fill-extrusion') continue
    const current = map.getFilter(layer.id)
    map.setFilter(layer.id, current ? ['all', current, away] : away)
  }
}
