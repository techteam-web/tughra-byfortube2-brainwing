import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, LatheGeometry, Mesh, MeshLambertMaterial, Vector2 } from 'three'

// Birds wandering over the map around the tower: white gulls and black kites (both common over
// Mumbai). Units are metres, Y up, x east, z south; the building layer places this group at the
// tower, facing north. They are drawn a little larger than life so they still show at map zoom.
const KINDS = {
  gull: { colour: '#f3f1eb', span: 20, speed: 14, flapHz: 2.3, flapping: 0.65, wander: 0.1 },
  kite: { colour: '#17130f', span: 23, speed: 10, flapHz: 1.5, flapping: 0.12, wander: 0.16 },
}
const FLOCK = [
  ['gull', 60], ['gull', 85], ['gull', 45], ['gull', 100], ['gull', 70],
  ['kite', 110], ['kite', 120], ['kite', 95],
]

// The area the birds roam: about 4 km across on the map, centred on the tower. A bird that reaches
// the edge turns back in, so they keep crossing the whole map without circling the tower.
const MIDDLE = [0, 0]
const RANGE = 1300

/** Repeatable pseudo-random number in [0, 1). */
const rand = (a, b = 0) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return v - Math.floor(v)
}

function surface(points, material) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points.flat(), 3))
  geometry.computeVertexNormals()
  return new Mesh(geometry, material)
}

/** A quad (a, b, c, d in order) as two triangles. */
const quad = (a, b, c, d) => [a, b, c, a, c, d]

/** One bird facing +Z with a rounded body, tail, and two-part wings that bend at the wrist. */
function makeBird(kind, material) {
  const { span } = KINDS[kind]
  const L = span * (kind === 'gull' ? 0.36 : 0.3) // body length, beak to tail
  const h = span / 2
  const bird = new Group()

  // Body: a spindle from tail to beak, slightly flattened.
  const profile = [
    [0, -0.42], [0.06, -0.3], [0.11, -0.08], [0.105, 0.14], [0.07, 0.3], [0.075, 0.38], [0.045, 0.47], [0.012, 0.56], [0, 0.6],
  ].map(([r, y]) => new Vector2(r * L, y * L))
  const body = new LatheGeometry(profile, 10)
  body.rotateX(Math.PI / 2)
  body.scale(1, 0.85, 1)
  bird.add(new Mesh(body, material))

  // Tail: a short fan for gulls, a long forked tail for kites.
  const tail =
    kind === 'gull'
      ? quad([-0.07 * L, 0, -0.36 * L], [0.07 * L, 0, -0.36 * L], [0.13 * L, 0, -0.62 * L], [-0.13 * L, 0, -0.62 * L])
      : [
          ...quad([-0.06 * L, 0, -0.34 * L], [0.06 * L, 0, -0.34 * L], [0.1 * L, 0, -0.8 * L], [-0.1 * L, 0, -0.8 * L]),
          [-0.1 * L, 0, -0.8 * L], [0, 0, -0.66 * L], [-0.16 * L, 0, -0.9 * L],
          [0.1 * L, 0, -0.8 * L], [0.16 * L, 0, -0.9 * L], [0, 0, -0.66 * L],
        ]
  bird.add(surface(tail, material))

  // Wings: an inner part from the shoulder to the wrist, and an outer part (the hand) hinged at the
  // wrist, swept back to a point for gulls and with spread "fingers" for kites.
  const wing = (s) => {
    const wrist = h * 0.45
    const inner = new Group()
    inner.position.set(s * 0.07 * L, 0.02 * L, 0.05 * L)
    inner.add(surface(quad([0, 0, 0.16 * L], [s * wrist, 0, 0.13 * L], [s * wrist, 0, -0.14 * L], [0, 0, -0.2 * L]), material))
    const outer = new Group()
    outer.position.set(s * wrist, 0, 0)
    const reach = h - wrist
    const hand =
      kind === 'gull'
        ? [...quad([0, 0, 0.13 * L], [s * reach * 0.55, 0, 0.06 * L], [s * reach * 0.6, 0, -0.1 * L], [0, 0, -0.14 * L]), [s * reach * 0.55, 0, 0.06 * L], [s * reach, 0, -0.14 * L], [s * reach * 0.6, 0, -0.1 * L]]
        : [
            ...quad([0, 0, 0.13 * L], [s * reach * 0.8, 0, 0.09 * L], [s * reach * 0.8, 0, -0.14 * L], [0, 0, -0.16 * L]),
            ...[0.09, 0.02, -0.05, -0.12].flatMap((z) => [[s * reach * 0.8, 0, z * L + 0.03 * L], [s * reach, 0, z * L], [s * reach * 0.8, 0, z * L - 0.03 * L]]),
          ]
    outer.add(surface(hand, material))
    inner.add(outer)
    bird.add(inner)
    return { inner, outer }
  }
  bird.userData.left = wing(-1)
  bird.userData.right = wing(1)
  return bird
}

export function createBirds() {
  const group = new Group()
  const materials = {}
  const birds = FLOCK.map(([kind, height], i) => {
    const spec = KINDS[kind]
    materials[kind] ??= new MeshLambertMaterial({ color: spec.colour, side: DoubleSide })
    const bird = makeBird(kind, materials[kind])
    bird.rotation.order = 'YXZ'
    const a = rand(i, 1) * Math.PI * 2
    const r = Math.sqrt(rand(i, 2)) * RANGE * 0.9
    bird.userData.state = {
      x: MIDDLE[0] + Math.cos(a) * r,
      z: MIDDLE[1] + Math.sin(a) * r,
      heading: rand(i, 3) * Math.PI * 2,
      turn: 0,
    }
    Object.assign(bird.userData, { kind, spec, height, phase: rand(i, 4) * 50 })
    group.add(bird)
    return bird
  })
  let last = null

  function update(seconds) {
    const dt = last == null ? 0 : Math.min(0.1, Math.max(0, seconds - last))
    last = seconds
    for (const bird of birds) {
      const { spec, height, phase, state, left, right } = bird.userData
      // Wander: a slowly changing turn, plus a firm turn back in near the edge of the area.
      let want = (Math.sin(seconds * 0.11 + phase) * 0.7 + Math.sin(seconds * 0.043 + phase * 1.3) * 0.5) * spec.wander
      const dx = MIDDLE[0] - state.x
      const dz = MIDDLE[1] - state.z
      const out = Math.hypot(dx, dz) / RANGE
      if (out > 0.7) {
        let diff = Math.atan2(dx, dz) - state.heading
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        want += Math.max(-0.35, Math.min(0.35, diff * 0.8)) * Math.min(1, (out - 0.7) * 3)
      }
      state.turn += (want - state.turn) * Math.min(1, dt * 1.5)
      state.heading += state.turn * dt
      state.x += Math.sin(state.heading) * spec.speed * dt
      state.z += Math.cos(state.heading) * spec.speed * dt

      // Flapping comes and goes smoothly; between bouts the bird glides.
      const bout = Math.sin(seconds * 0.23 + phase) * 0.5 + 0.5
      const effort = Math.min(1, Math.max(0, (bout - (1 - spec.flapping)) * 4))
      const w = seconds * spec.flapHz * Math.PI * 2 + phase
      const beat = Math.sin(w) * effort
      bird.position.set(state.x, height + Math.sin(seconds * 0.4 + phase) * 3 - beat * 0.6, state.z)
      // Face the way it flies and lean into turns.
      bird.rotation.set(-0.04, state.heading, Math.max(-0.7, Math.min(0.7, -state.turn * 2.2)))
      // Glide pose: gulls hold a shallow "M", kites hold their wings flat and spread.
      const gull = bird.userData.kind === 'gull'
      const innerAngle = (gull ? 0.12 : 0.05) + beat * 0.5
      const outerAngle = (gull ? -0.2 : 0.02) + Math.sin(w - 0.9) * effort * 0.4
      left.inner.rotation.z = -innerAngle
      right.inner.rotation.z = innerAngle
      left.outer.rotation.z = -outerAngle
      right.outer.rotation.z = outerAngle
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
