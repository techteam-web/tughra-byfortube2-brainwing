import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial } from 'three'

// A few birds crossing the map around the tower (metres, Y up; x east, z south; the building layer
// places this group at the tower, facing north). Drawn several times life size so they show at map
// zoom. Each bird is one flat colour, unlit, so the map light never tints it.
const BIRDS = [
  // Small black birds.
  { colour: '#000000', span: 17, speed: 20, height: 95 },
  { colour: '#000000', span: 16, speed: 23, height: 130 },
  { colour: '#000000', span: 18, speed: 18, height: 70 },
  // White birds.
  { colour: '#ffffff', span: 26, speed: 16, height: 150 },
  { colour: '#ffffff', span: 24, speed: 19, height: 115 },
  { colour: '#ffffff', span: 27, speed: 15, height: 175 },
  { colour: '#ffffff', span: 25, speed: 17, height: 85 },
  { colour: '#ffffff', span: 26, speed: 21, height: 140 },
]

// Every crossing is a straight line through the area around the tower, LENGTH metres long, at a
// random direction and a random distance from the tower, with a gentle side-to-side drift.
const LENGTH = 1300
const SPREAD = 380 // how far a crossing may pass from the middle of the view
const MIDDLE = [0, -180] // the opening view shows more of the map north of the tower

/** Repeatable pseudo-random number in [0, 1) for a bird and crossing. */
const rand = (a, b) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return v - Math.floor(v)
}

function mesh(points, material) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3))
  return new Mesh(geometry, material)
}

/** One bird facing +Z: a slim body and two swept wings hinged along the body. */
function makeBird(span, material) {
  const bird = new Group()
  const h = span / 2
  const body = span * 0.34
  const w = span * 0.05
  bird.add(mesh([[0, w, body * 0.55], [-w, 0, -body * 0.45], [w, 0, -body * 0.45], [0, -w, body * 0.55], [w, 0, -body * 0.45], [-w, 0, -body * 0.45]], material))
  const wing = (s) => {
    const hinge = new Group()
    hinge.add(mesh([[0, 0, span * 0.08], [0, 0, -span * 0.07], [s * h, 0, -span * 0.11]], material))
    bird.add(hinge)
    return hinge
  }
  bird.userData.left = wing(-1)
  bird.userData.right = wing(1)
  return bird
}

/** Position, heading and sway of bird `i` after flying `travelled` metres. */
function locate(i, travelled) {
  const crossing = Math.floor(travelled / LENGTH)
  const s = travelled - crossing * LENGTH
  const angle = rand(i, crossing) * Math.PI * 2
  const offset = (rand(i + 50, crossing) - 0.5) * 2 * SPREAD
  const dx = Math.sin(angle)
  const dz = Math.cos(angle)
  // From one end of the line to the other, drifting gently sideways.
  const along = s - LENGTH / 2
  const side = offset + Math.sin(s / 260 + i) * 45
  return [MIDDLE[0] + dx * along + dz * side, MIDDLE[1] + dz * along - dx * side, angle, Math.cos(s / 260 + i)]
}

export function createBirds() {
  const group = new Group()
  const materials = new Map()
  const birds = BIRDS.map((spec, i) => {
    if (!materials.has(spec.colour)) materials.set(spec.colour, new MeshBasicMaterial({ color: spec.colour, side: DoubleSide }))
    const bird = makeBird(spec.span, materials.get(spec.colour))
    bird.rotation.order = 'YXZ'
    bird.userData.spec = spec
    bird.userData.start = rand(i + 9, 3) * LENGTH * 3
    group.add(bird)
    return bird
  })

  function update(seconds) {
    birds.forEach((bird, i) => {
      const { spec, start, left, right } = bird.userData
      const [x, z, angle, sway] = locate(i, start + seconds * spec.speed)
      const phase = i * 1.7
      bird.position.set(x, spec.height + Math.sin(seconds * 0.7 + phase) * 4, z)
      // Face along the crossing, turned slightly with the drift, and lean into it.
      bird.rotation.set(0, angle - sway * 0.17, sway * 0.25)
      // Flap for a while, then glide with the wings held slightly up.
      const glide = Math.sin(seconds * 0.45 + phase) > 0.5
      const beat = glide ? 0.15 : Math.sin(seconds * 8 + phase * 3) * 0.55 + 0.1
      left.rotation.z = -beat
      right.rotation.z = beat
    })
  }

  update(0)
  return {
    group,
    update,
    dispose() {
      group.traverse((node) => node.geometry?.dispose())
      materials.forEach((m) => m.dispose())
    },
  }
}
