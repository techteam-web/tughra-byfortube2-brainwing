// Draws the Tughra Royale 3D model on the MapLibre map, at its real size.
// Loaded on demand by the Location page, so three.js stays out of the other pages.
import { MercatorCoordinate } from 'maplibre-gl'
import { AmbientLight, Camera, DirectionalLight, Matrix4, MeshLambertMaterial, NoToneMapping, Scene, Vector3, WebGLRenderer } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createBirds } from './birds'
import { prefersReducedMotion } from './hooks'

// Web copy of public/Building_Updated (smaller textures, compact geometry, same triangles).
const MODEL_URL = '/models/tughra-royale.glb'

// Which way the tower faces, in degrees clockwise. 150 turns its front (the side with the
// TUGHRA ROYALE sign) towards the map's opening view. Change this to turn it on its plot.
export const BUILDING_HEADING_DEG = 150

// Drawn a little larger than life so the tower stands out on the map. 1 = real size.
export const BUILDING_SCALE = 1.5

// Colours measured from the approved screenshot of the model (front view).
// `keepTexture` keeps the exported picture (grass, lattice); the rest are flat colours.
const COLOURS = {
  'Material__-2147483610': { color: '#7b6962' }, // the taupe strips
  'Material__-2147483613': { color: '#55463f' }, // their shaded edges
  MI_Glass_Windshield_Tinted: { color: '#8e9496' }, // walls and floor bands
  'Material__-2147483573': { color: '#8e9496' },
  Stucco_F01_50cm: { color: '#686b6c' }, // slab edges, core and grills
  'Material__-214702145': { color: '#a6abad' }, // light rails
  'Material__-2147483575': { color: '#6f6a67' },
  Empty_material: { color: '#7f8384' },
  M09_Shadow_Night: { color: '#33373a' }, // dark window frames
  M_Glass_Pathtracing_Inst_Glass: { color: '#8b9088', opacity: 0.5 }, // grey glass, slightly olive
  M_Glass_Pathtracing_Inst_Glass_Submesh: { color: '#8b9088', opacity: 0.5 },
  'Material__-2147483627': { keepTexture: true }, // grass
  A02_Rose_Quartz_Patterns: { keepTexture: true },
}

// Light is balanced so a surface on the front face shows exactly its colour above:
// ambient + sun x (how directly the front faces the sun) = PI.
// In the model's own space the front faces -Z, and -X is to the viewer's right.
const SUN_FROM = new Vector3(-0.35, 0.6, -0.72).normalize()
const AMBIENT = 0.62 * Math.PI
const SUN = (Math.PI - AMBIENT) / -SUN_FROM.z

/** A plain matte version of an exported material: no reflections to change its colour. */
function matte(source) {
  const style = COLOURS[source.name] ?? {}
  const material = new MeshLambertMaterial({
    name: source.name,
    color: style.color ?? source.color,
    map: style.keepTexture ? source.map : null,
    transparent: source.transparent,
    opacity: style.opacity ?? source.opacity,
    alphaTest: source.alphaTest,
    side: source.side,
    depthWrite: !source.transparent,
  })
  if (!style.keepTexture) source.map?.dispose()
  source.dispose()
  return material
}

// The centre of the footprint in the model's own coordinates (metres, Y up).
const FOOTPRINT_CENTRE = { x: 4.53, z: -2.71 }

export const BUILDING_LAYER_ID = 'tughra-building'

export function createBuildingLayer(lngLat, { onLoad, onError } = {}) {
  const origin = MercatorCoordinate.fromLngLat(lngLat, 0)
  const metre = origin.meterInMercatorCoordinateUnits() * BUILDING_SCALE

  // Model space (metres, Y up) → map space.
  const placement = new Matrix4()
    .makeTranslation(origin.x, origin.y, origin.z)
    .scale(new Vector3(metre, -metre, metre))
    .multiply(new Matrix4().makeRotationX(Math.PI / 2))
    .multiply(new Matrix4().makeRotationY((-BUILDING_HEADING_DEG * Math.PI) / 180))
    .multiply(new Matrix4().makeTranslation(-FOOTPRINT_CENTRE.x, 0, -FOOTPRINT_CENTRE.z))

  const camera = new Camera()
  const scene = new Scene()
  let renderer = null
  let removed = false
  let mapRef = null
  // Gulls circling the tower. They keep the map redrawing while they fly.
  const birds = createBirds(FOOTPRINT_CENTRE)
  const flying = !prefersReducedMotion()
  scene.add(birds.group)

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
      mapRef = map
      renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false
      renderer.toneMapping = NoToneMapping // nothing may shift the colours

      scene.add(new AmbientLight(0xffffff, AMBIENT))
      const sun = new DirectionalLight(0xffffff, SUN)
      sun.position.copy(SUN_FROM)
      scene.add(sun)

      new GLTFLoader().load(
        MODEL_URL,
        (gltf) => {
          if (removed) return release(gltf.scene)
          // Meshes can share a material, so each one is converted once.
          const converted = new Map()
          const convert = (source) => {
            if (!converted.has(source)) converted.set(source, matte(source))
            return converted.get(source)
          }
          gltf.scene.traverse((node) => {
            if (node.material) node.material = Array.isArray(node.material) ? node.material.map(convert) : convert(node.material)
          })
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
      // Matte materials look the same from any side, so MapLibre’s combined matrix is all that is needed.
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(placement)
      if (flying) birds.update(performance.now() / 1000)
      renderer.resetState()
      renderer.render(scene, camera)
      if (flying) mapRef?.triggerRepaint()
    },

    onRemove() {
      removed = true
      release(scene)
      birds.dispose()
      renderer?.dispose()
    },
  }
}

/** Hide the map's own grey blocks where the tower stands, so they don't poke through it. */
export function clearBuildingPlot(map, lngLat, radiusMetres = 32 * BUILDING_SCALE) {
  const away = ['>', ['distance', { type: 'Point', coordinates: lngLat }], radiusMetres]
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'fill-extrusion') continue
    const current = map.getFilter(layer.id)
    map.setFilter(layer.id, current ? ['all', current, away] : away)
  }
}
