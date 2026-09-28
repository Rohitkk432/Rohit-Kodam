import { motionValue } from 'motion/react'

// shared by the WebGL scene (read per frame) and DOM overlays (motion values)
export const scroll = { p: 0, v: 0 }
export const progress = motionValue(0)

export const clamp01 = x => Math.min(1, Math.max(0, x))
export const remap = (p, a, b) => clamp01((p - a) / (b - a))
export const smooth = t => t * t * (3 - 2 * t)
