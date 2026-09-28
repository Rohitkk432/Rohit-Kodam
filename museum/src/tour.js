import { CAREER, WORKS, CENTREPIECE, DECOR, ROTUNDA_Z } from './data.js'

const view = (pos, look, extra) => {
  const dx = look[0] - pos[0], dy = look[1] - pos[1], dz = look[2] - pos[2]
  // yaw measured from straight down the hall (-z); pitch up/down
  return { pos, yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), ...extra }
}

// every labelled exhibit, in tour order, with the spot to view it from
export const STOPS = [
  ...CAREER.map((e, i) => view([-e.side * 0.9, 1.75, e.z + 3.6], [e.side * 3.3, 2.1, e.z], {
    kind: 'career', i, data: e, label: `Career ${String(i + 1).padStart(2, '0')}`, anchor: [e.side * 3.3, 0.9, e.z + 0.7],
  })),
  ...WORKS.map((w, i) => view([-w.side * 1.4, 1.75, w.z + 1.2], [w.side * 7, 3.3, w.z], {
    kind: 'work', i, data: w, label: `Work ${String(i + 1).padStart(2, '0')}`, anchor: [w.side * 6.7, 1.45, w.z],
  })),
  view([1.6, 1.75, ROTUNDA_Z + 5.4], [0, 2.7, ROTUNDA_Z], { kind: 'centre', data: CENTREPIECE, label: 'Toolkit', anchor: [0, 1.15, ROTUNDA_Z + 0.95] }),
]
export const START = { pos: [0, 1.75, 8.5], yaw: 0, pitch: 0.02 }

// ---------- walkable space ----------
const R = 0.35 // visitor radius
const SOLIDS = [
  ...CAREER.map(e => [e.side * 3.3, e.z, 1.05]),
  ...DECOR.map(d => [d.x, d.z, d.wide ? 1.7 : 1.05]),
  [0, ROTUNDA_Z, 1.5],
]
export function walkable(x, z) {
  const inRotunda = Math.hypot(x, z - ROTUNDA_Z) < 10.1 - R
  const inHall = Math.abs(x) < 6.3 - R && z < 9.6 && z > -101
  if (!inRotunda && !inHall) return false
  if (Math.abs(z + 47) < 0.6 + R && Math.abs(x) > 3 - R) return false // arch piers
  return SOLIDS.every(([sx, sz, r]) => Math.hypot(x - sx, z - sz) > r + R)
}
