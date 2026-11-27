import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial } from 'three'

// A small flock of gulls circling the tower, in the building model's own space (metres, Y up).
// They are drawn several times life size so they still show at map zoom levels.
const WINGSPAN = 13
const BODY = 4.6
const COLOUR = '#ece6da'

// Two loose groups on different circles, so some birds pass in front of the tower and some behind.
const FLIGHTS = [
  { count: 6, radius: 62, height: 100, speed: 0.13, dir: 1 },
  { count: 4, radius: 100, height: 66, speed: 0.09, dir: -1 },
]

function triangle(points) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3))
  geometry.computeVertexNormals()
  return geometry
}

/** One bird facing +Z: a slim body and two wings hinged along the body. */
function makeBird(material) {
  const bird = new Group()
  const half = WINGSPAN / 2
  const body = triangle([
    [0, 0.5, BODY * 0.55], [-0.7, 0, -BODY * 0.45], [0.7, 0, -BODY * 0.45],
    [0, -0.5, BODY * 0.55], [0.7, 0, -BODY * 0.45], [-0.7, 0, -BODY * 0.45],
  ])
  bird.add(new Mesh(body, material))
  // Each wing: a swept triangle from the shoulder out to the tip.
  const wing = (side) => {
    const hinge = new Group()
    hinge.add(new Mesh(triangle([[0, 0, 1.3], [0, 0, -1.1], [side * half, 0, -1.7]]), material))
    bird.add(hinge)
    return hinge
  }
  bird.userData.left = wing(-1)
  bird.userData.right = wing(1)
  return bird
}

/**
 * Builds the flock around `centre` ({x, z} in model space).
 * Returns the group to add to the scene and `update(seconds)` to move it.
 */
export function createBirds(centre) {
  const material = new MeshLambertMaterial({ color: COLOUR, side: DoubleSide })
  const group = new Group()
  const birds = []
  FLIGHTS.forEach((flight, f) => {
    for (let i = 0; i < flight.count; i++) {
      const bird = makeBird(material)
      bird.rotation.order = 'YXZ'
      // Spread along the circle in a loose line, each with its own wobble.
      bird.userData.flight = flight
      bird.userData.offset = (i / flight.count) * 0.22 + f * 0.5 + Math.sin(i * 12.9898) * 0.03
      bird.userData.lane = (Math.sin(i * 78.233 + f) * 0.5) * 14 // metres in or out of the circle
      bird.userData.lift = Math.cos(i * 37.719 + f) * 8 // metres up or down
      bird.userData.phase = i * 1.7 + f
      group.add(bird)
      birds.push(bird)
    }
  })

  function update(seconds) {
    for (const bird of birds) {
      const { flight, offset, lane, lift, phase, left, right } = bird.userData
      const a = flight.dir * seconds * flight.speed + offset * Math.PI * 2
      const r = flight.radius + lane + Math.sin(seconds * 0.3 + phase) * 6
      const x = centre.x + Math.cos(a) * r
      const z = centre.z + Math.sin(a) * r
      const y = flight.height + lift + Math.sin(seconds * 0.8 + phase) * 3
      bird.position.set(x, y, z)
      // Face along the circle and lean into the turn.
      const vx = -Math.sin(a) * flight.dir
      const vz = Math.cos(a) * flight.dir
      bird.rotation.set(0, Math.atan2(vx, vz), flight.dir * 0.32)
      // Flap for a while, then glide with the wings held slightly up.
      const glide = Math.sin(seconds * 0.45 + phase) > 0.55
      const beat = glide ? 0.18 : Math.sin(seconds * 9 + phase * 3) * 0.55 + 0.1
      left.rotation.z = -beat
      right.rotation.z = beat
    }
  }

  update(0)
  return {
    group,
    update,
    dispose() {
      group.traverse((node) => node.geometry?.dispose())
      material.dispose()
    },
  }
}
