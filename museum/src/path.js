import * as THREE from 'three'
import { CAREER, WORKS, ROTUNDA_Z } from './data.js'

// Camera keyframes. `stop` marks a hold where a label can be read;
// `wing` names the gallery the camera walks into from that key.
const K = [
  { pos: [0, 2.4, 17], look: [0, 2.6, 0] }, // at the doors
  { pos: [0, 1.75, 5], look: [0, 2.2, -14], wing: 'career' }, // step inside
]
CAREER.forEach((e, i) => {
  K.push({ pos: [-e.side * 0.9, 1.75, e.z + 3.6], look: [e.side * 3.3, 2.1, e.z], stop: { kind: 'career', i } })
})
K.push({ pos: [0, 1.8, -44], look: [0, 2.4, -58], wing: 'works' }) // through the arch
WORKS.forEach((w, i) => {
  K.push({ pos: [-w.side * 1.4, 2.2, w.z + 1.2], look: [w.side * 7, 3.5, w.z], stop: { kind: 'work', i } })
})
K.push({ pos: [0, 1.8, -92], look: [0, 2.6, ROTUNDA_Z], wing: 'rotunda' }) // the rotunda reveal
K.push({ pos: [1.6, 2.1, ROTUNDA_Z + 5.4], look: [0, 2.7, ROTUNDA_Z], stop: { kind: 'centre' } })
K.push({ pos: [-3.4, 2.6, ROTUNDA_Z + 3.6], look: [0, 2.8, ROTUNDA_Z] })
K.push({ pos: [0, 2.3, ROTUNDA_Z + 13], look: [0, 3.2, ROTUNDA_Z - 6] }) // pull back as the lights go down

const mk = pts => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal')
export const posCurve = mk(K.map(k => k.pos))
// Interpolate the *view angle* (yaw measured from straight down the hall, and pitch)
// rather than the look-at point: blending a left-wall target into a right-wall one
// would pass right beside the camera and whip it up and down. Angles pan level,
// through "straight ahead".
const angCurve = new THREE.CatmullRomCurve3(K.map(k => {
  const dx = k.look[0] - k.pos[0], dy = k.look[1] - k.pos[1], dz = k.look[2] - k.pos[2]
  return new THREE.Vector3(Math.atan2(dx, -dz), Math.atan2(dy, Math.hypot(dx, dz)), 0)
}), false, 'catmullrom', 0)
export function lookAt(t, pos, out) {
  const a = angCurve.getPoint(t)
  return out.set(Math.sin(a.x) * Math.cos(a.y), Math.sin(a.y), -Math.cos(a.x) * Math.cos(a.y)).multiplyScalar(8).add(pos)
}

// Scroll → film time with holds. Each stop gets HOLD units of scroll where the
// camera barely moves (a slow push-in) before walking on.
const HOLD = 1.3
const segs = []
K.forEach((k, i) => {
  if (k.stop) segs.push({ hold: true, i, len: HOLD })
  if (i < K.length - 1) segs.push({ hold: false, i, len: 1 })
})
const total = segs.reduce((s, x) => s + x.len, 0)
const N = K.length - 1

export function film(u) {
  let d = Math.min(Math.max(u, 0), 1) * total
  for (let s = 0; s < segs.length; s++) {
    const seg = segs[s]
    if (d > seg.len && s < segs.length - 1) { d -= seg.len; continue }
    const f = d / seg.len
    if (seg.hold) return { t: seg.i / N, stop: K[seg.i].stop, focus: 1, push: f, wing: null }
    // walking between keys; eased so the camera settles into each stop
    const e = f * f * (3 - 2 * f)
    const nearStop = (K[seg.i].stop ? 1 - f : 0) + (K[seg.i + 1]?.stop ? f : 0)
    return { t: (seg.i + e) / N, stop: null, focus: Math.max(0, (nearStop - 0.6) / 0.4), push: 0, wing: K[seg.i].wing || null }
  }
  return { t: 1, stop: null, focus: 0, push: 0, wing: null }
}
