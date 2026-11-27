import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial } from 'three'

// Flocks of birds flying across the map around the tower (metres, Y up; the building layer places
// this group at the tower, facing north). They are drawn several times life size so they show at map zoom levels.
const WINGSPAN = 28
const BODY = 9.5
const COLOURS = { body: '#120d0a', tip: '#d4a85a' } // near-black birds with the site's gold on the wing tips

// Each flock follows its own looping route over the map (a Lissajous curve), crossing the view in
// front of and behind the tower. Coordinates are metres from the tower: x east, z south (so negative
// z is north, the way the map opens). Speeds in radians a second.
const FLOCKS = [
  { count: 7, centre: [0, -40], size: [300, 170], speed: [0.05, 0.075], phase: [0, 1.2], height: 120 },
  { count: 5, centre: [-60, -300], size: [340, 200], speed: [0.04, 0.062], phase: [2.1, 0.4], height: 170 },
  { count: 6, centre: [130, 80], size: [260, 140], speed: [0.058, 0.044], phase: [4.0, 2.6], height: 90 },
  { count: 4, centre: [-180, -150], size: [220, 260], speed: [0.066, 0.05], phase: [1.1, 4.4], height: 145 },
]

function mesh(points, material) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3))
  geometry.computeVertexNormals()
  return new Mesh(geometry, material)
}

/** One bird facing +Z: a slim body and two wings hinged along the body, gold at the tips. */
function makeBird(materials) {
  const bird = new Group()
  const h = WINGSPAN / 2
  bird.add(
    mesh(
      [
        [0, 0.9, BODY * 0.55], [-1.3, 0, -BODY * 0.45], [1.3, 0, -BODY * 0.45],
        [0, -0.9, BODY * 0.55], [1.3, 0, -BODY * 0.45], [-1.3, 0, -BODY * 0.45],
      ],
      materials.body,
    ),
  )
  const wing = (s) => {
    const hinge = new Group()
    const m = s * h * 0.5 // where the gold tip starts
    hinge.add(mesh([[0, 0, 2.3], [0, 0, -1.9], [m, 0, -2.6], [0, 0, 2.3], [m, 0, -2.6], [m, 0, -0.9]], materials.body))
    hinge.add(mesh([[m, 0, -0.9], [m, 0, -2.6], [s * h, 0, -3]], materials.tip))
    bird.add(hinge)
    return hinge
  }
  bird.userData.left = wing(-1)
  bird.userData.right = wing(1)
  return bird
}

/** Where a flock is at time t (seconds). */
function route(flock, t, cx, cz) {
  const [ax, az] = flock.size
  const [wx, wz] = flock.speed
  const [px, pz] = flock.phase
  return [cx + flock.centre[0] + ax * Math.sin(wx * t + px), cz + flock.centre[1] + az * Math.sin(wz * t + pz)]
}

/**
 * Builds the flocks around `centre` ({x, z} in model space, the tower).
 * Returns the group to add to the scene and `update(seconds)` to move it.
 */
export function createBirds(centre) {
  const materials = {
    body: new MeshLambertMaterial({ color: COLOURS.body, side: DoubleSide }),
    tip: new MeshLambertMaterial({ color: COLOURS.tip, side: DoubleSide }),
  }
  const group = new Group()
  const birds = []
  FLOCKS.forEach((flock, f) => {
    for (let i = 0; i < flock.count; i++) {
      const bird = makeBird(materials)
      bird.rotation.order = 'YXZ'
      // A loose V: alternate sides, each a little further back, with a small personal wobble.
      const rank = Math.ceil(i / 2)
      bird.userData.flock = flock
      bird.userData.side = (i % 2 ? 1 : -1) * rank * 20 + Math.sin(i * 12.9898 + f) * 5
      bird.userData.back = rank * 24 + Math.cos(i * 78.233 + f) * 5
      bird.userData.lift = Math.sin(i * 37.719 + f) * 6
      bird.userData.phase = i * 1.7 + f * 2.3
      group.add(bird)
      birds.push(bird)
    }
  })

  function update(seconds) {
    for (const bird of birds) {
      const { flock, side, back, lift, phase, left, right } = bird.userData
      // Direction of travel from two nearby points on the route.
      const [x0, z0] = route(flock, seconds, centre.x, centre.z)
      const [x1, z1] = route(flock, seconds + 1, centre.x, centre.z)
      const [x2, z2] = route(flock, seconds + 2, centre.x, centre.z)
      const heading = Math.atan2(x1 - x0, z1 - z0)
      let turn = Math.atan2(x2 - x1, z2 - z1) - heading
      turn = Math.atan2(Math.sin(turn), Math.cos(turn))
      // Place the bird in the V, relative to the flock's heading.
      const fx = Math.sin(heading)
      const fz = Math.cos(heading)
      bird.position.set(
        x0 - fx * back + fz * side,
        flock.height + lift + Math.sin(seconds * 0.8 + phase) * 4,
        z0 - fz * back - fx * side,
      )
      // Face the way the flock is going and lean into its turns.
      bird.rotation.set(0, heading, Math.max(-0.6, Math.min(0.6, -turn * 6)))
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
      Object.values(materials).forEach((m) => m.dispose())
    },
  }
}
