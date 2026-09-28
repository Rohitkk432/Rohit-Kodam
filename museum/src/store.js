import { useSyncExternalStore } from 'react'

// tiny shared store so the 3D scene and the DOM overlay can talk
let state = { active: null, arrived: false, contact: false, started: false }
const subs = new Set()
export const store = {
  get: () => state,
  set: patch => { state = { ...state, ...patch }; subs.forEach(f => f()) },
  sub: f => { subs.add(f); return () => subs.delete(f) },
}
export const useStore = sel => useSyncExternalStore(store.sub, () => sel(store.get()))
