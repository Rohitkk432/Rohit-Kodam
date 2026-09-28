import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture, SpotLight, MeshReflectorMaterial, RoundedBox, Html } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CAREER, WORKS, CENTREPIECE, DECOR, ROTUNDA_Z } from './data.js'
import { STOPS, START, walkable } from './tour.js'
import { store, useStore } from './store.js'

const HALL = { w: 14, h: 8.5, start: 12, end: -100 }
const WALL = '#5a2328' // oxblood gallery walls
const STONE = '#9a8b78'
const MARBLE = '#ece6da'
const WARM = '#ffe2b8'
const HAZE = '#1d1416'
const rand = (a, b) => a + Math.random() * (b - a)
const tex = t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t }

// ---------- a statue: cut-out on a marble podium under its own spotlight ----------
function Exhibit({ e, x, z, podium = [1.3, 1.2, 1.3], beam = 0.55, stop }) {
  const map = tex(useTexture(`${import.meta.env.BASE_URL}art/${e.src}.webp`))
  const statue = useRef()
  const light = useRef()
  const { camera, scene } = useThree()
  const top = podium[1]
  useEffect(() => {
    const target = light.current.target
    target.position.set(x, top + e.h * 0.5, z)
    scene.add(target)
    return () => scene.remove(target)
  }, [])
  // the cut-out turns to meet the visitor, so it always reads as a solid form
  useFrame(() => { statue.current.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z) })
  return (
    <group>
      <RoundedBox args={podium} radius={0.04} position={[x, top / 2, z]} userData={{ stop }}>
        <meshStandardMaterial color={MARBLE} roughness={0.3} />
      </RoundedBox>
      <group ref={statue} position={[x, top, z]}>
        <mesh position={[0, e.h / 2, 0]} userData={{ stop }}>
          <planeGeometry args={[e.h * e.aspect, e.h]} />
          <meshStandardMaterial map={map} alphaTest={0.5} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.45} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <SpotLight ref={light} position={[x * 0.55, HALL.h - 0.3, z + 1.2]} color={WARM} intensity={110} distance={11} angle={beam} penumbra={0.6}
        attenuation={6} anglePower={4.5} opacity={0.22} />
    </group>
  )
}

// ---------- a painting in a gilded frame ----------
function Painting({ name, position, rotation, h = 2.6, maxW = 4.4, stop }) {
  const map = tex(useTexture(`${import.meta.env.BASE_URL}art/${name}.jpg`))
  const a = map.image.width / map.image.height
  let w = h * a, hh = h
  if (w > maxW) { w = maxW; hh = w / a }
  const f = 0.22 + hh * 0.04 // frame thickness scales with the picture
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.02]} userData={{ stop }}>
        <boxGeometry args={[w + f * 2, hh + f * 2, 0.1]} />
        <meshStandardMaterial color="#c79a45" metalness={0.9} roughness={0.28} emissive="#5a3a10" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.035]} userData={{ stop }}>
        <planeGeometry args={[w, hh]} />
        <meshStandardMaterial map={map} roughness={0.75} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.42} />
      </mesh>
      {/* brass picture light */}
      <mesh position={[0, hh / 2 + f + 0.2, 0.2]}>
        <boxGeometry args={[Math.min(w * 0.55, 1.4), 0.06, 0.14]} />
        <meshStandardMaterial color="#c9a24a" metalness={1} roughness={0.3} emissive={WARM} emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

// ---------- architecture ----------
const BAYS = Array.from({ length: 11 }, (_, i) => 6 - i * 10.6)

function Architecture() {
  const len = HALL.start - HALL.end, mid = (HALL.start + HALL.end) / 2
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -55]} userData={{ floor: true }}>
        <planeGeometry args={[40, 170]} />
        <MeshReflectorMaterial blur={[400, 120]} resolution={1024} mixBlur={1} mixStrength={14} roughness={0.85} depthScale={1.1}
          minDepthThreshold={0.4} maxDepthThreshold={1.3} color="#4b3e35" metalness={0.5} mirror={0.55} />
      </mesh>
      {[-1, 1].map(s => (
        <group key={s}>
          <mesh position={[s * HALL.w / 2, HALL.h / 2, mid]} rotation={[0, -s * Math.PI / 2, 0]}>
            <planeGeometry args={[len, HALL.h]} />
            <meshStandardMaterial color={WALL} roughness={0.95} />
          </mesh>
          {/* skirting, dado rail and cornice in stone */}
          <mesh position={[s * (HALL.w / 2 - 0.06), 0.2, mid]}><boxGeometry args={[0.12, 0.4, len]} /><meshStandardMaterial color="#3a2a26" /></mesh>
          <mesh position={[s * (HALL.w / 2 - 0.06), 1.1, mid]}><boxGeometry args={[0.1, 0.07, len]} /><meshStandardMaterial color={STONE} /></mesh>
          <mesh position={[s * (HALL.w / 2 - 0.22), HALL.h - 0.35, mid]}><boxGeometry args={[0.44, 0.6, len]} /><meshStandardMaterial color={STONE} roughness={0.7} /></mesh>
          {BAYS.map(z => (
            <group key={z} position={[s * (HALL.w / 2 - 0.3), 0, z]}>
              <mesh position={[0, HALL.h / 2, 0]}><boxGeometry args={[0.6, HALL.h, 0.9]} /><meshStandardMaterial color={STONE} roughness={0.7} /></mesh>
              <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.8, 0.6, 1.1]} /><meshStandardMaterial color="#857664" /></mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, HALL.h, mid]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL.w, len]} />
        <meshStandardMaterial color="#2c2327" />
      </mesh>
      {/* coffered skylights */}
      {BAYS.slice(0, -1).map(z => (
        <mesh key={z} position={[0, HALL.h - 0.02, z - 5.3]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5, 2]} />
          <meshBasicMaterial color={new THREE.Color('#fff1dc').multiplyScalar(1.5)} toneMapped={false} />
        </mesh>
      ))}
      {/* light washing the walls, one per bay */}
      {BAYS.slice(0, -1).map(z => <pointLight key={z} position={[0, 6.8, z - 5.3]} color={WARM} intensity={38} distance={17} />)}
      {/* entrance portal */}
      <group position={[0, 0, HALL.start - 2]}>
        {[-1, 1].map(s => (
          <mesh key={s} position={[s * 4.6, HALL.h / 2, 0]}><boxGeometry args={[4.8, HALL.h, 1]} /><meshStandardMaterial color={STONE} roughness={0.7} /></mesh>
        ))}
        <mesh position={[0, HALL.h - 1, 0]}><boxGeometry args={[4.4, 2, 1]} /><meshStandardMaterial color={STONE} roughness={0.7} /></mesh>
      </group>
      {/* arch into Gallery II */}
      <group position={[0, 0, -47]}>
        {[-1, 1].map(s => (
          <mesh key={s} position={[s * 5, HALL.h / 2, 0]}><boxGeometry args={[4, HALL.h, 1.2]} /><meshStandardMaterial color={STONE} roughness={0.7} /></mesh>
        ))}
        <mesh position={[0, HALL.h - 1.1, 0]}><boxGeometry args={[6, 2.2, 1.2]} /><meshStandardMaterial color={STONE} roughness={0.7} /></mesh>
      </group>
      {/* rotunda: drum, pilasters, dome, oculus */}
      <group position={[0, 0, ROTUNDA_Z]}>
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[11, 11, 12, 64, 1, true]} />
          <meshStandardMaterial color={WALL} side={THREE.BackSide} roughness={0.95} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => {
          if (i === 0 || i === 1 || i === 15) return null // keep the doorway from the hall clear
          const a = (i / 16) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.sin(a) * 10.6, 6, Math.cos(a) * 10.6]} rotation={[0, a, 0]}>
              <boxGeometry args={[0.9, 12, 0.6]} /><meshStandardMaterial color={STONE} roughness={0.7} />
            </mesh>
          )
        })}
        <mesh position={[0, 12, 0]}>
          <sphereGeometry args={[11, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6d5d50" side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 22.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.2, 48]} />
          <meshBasicMaterial color={new THREE.Color('#fff4e0').multiplyScalar(4)} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 7, 0]} color={WARM} intensity={90} distance={20} />
      </group>
    </group>
  )
}

const DETAILS = ['d-temple', 'd-temple2', 'd-interior', 'd-rotunda', 'd-arch2']

function Gallery() {
  // Gallery I: small Panini details between the career sculptures (decor only)
  const decor = []
  BAYS.slice(0, 5).forEach((z, i) => [-1, 1].forEach((s, k) => {
    decor.push({ name: DETAILS[(i * 2 + k) % DETAILS.length], position: [s * (HALL.w / 2 - 0.06), 4.1, z - 5.3], rotation: [0, -s * Math.PI / 2, 0], h: 2.2 })
  }))
  const r = 10.25 // rotunda: Panini's Ancient Rome behind the emperor, flanked by two more
  return (
    <>
      {decor.map((p, i) => <Painting key={i} {...p} />)}
      {/* Gallery II: one large painting per project */}
      {WORKS.map((w, i) => (
        <Painting key={w.img + w.z + w.side} name={w.img} position={[w.side * (HALL.w / 2 - 0.06), 3.5, w.z]} rotation={[0, -w.side * Math.PI / 2, 0]} h={2.8} maxW={4.3} stop={STOPS.find(t => t.kind === 'work' && t.i === i)} />
      ))}
      <Painting name="p-rome" position={[0, 4.6, ROTUNDA_Z - r]} rotation={[0, 0, 0]} h={4.6} maxW={6.4} />
      <Painting name="p-portico" position={[Math.sin(-2.2) * r, 4.4, ROTUNDA_Z + Math.cos(-2.2) * r]} rotation={[0, -2.2 + Math.PI, 0]} h={4.2} />
      <Painting name="p-trojan" position={[Math.sin(2.2) * r, 4.4, ROTUNDA_Z + Math.cos(2.2) * r]} rotation={[0, 2.2 + Math.PI, 0]} h={3.4} maxW={5} />
    </>
  )
}

// ---------- dust drifting through the light ----------
function Dust() {
  const ref = useRef()
  const geo = useMemo(() => {
    const n = 1400, a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) a.set([rand(-6.5, 6.5), rand(0.2, 8), rand(-122, 12)], i * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(a, 3))
    return g
  }, [])
  useFrame(({ clock }) => {
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.3
    ref.current.position.x = Math.cos(clock.elapsedTime * 0.13) * 0.2
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.012} color="#ffe9c9" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ---------- the visitor: walk, look, click ----------
export const goTo = stop => store.set({ active: stop, arrived: false })
const hover = { point: null, stop: null }
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

function Player() {
  const { camera, gl, size, scene } = useThree()
  const mobile = size.width < 760
  const me = useRef({ x: START.pos[0], z: START.pos[2], yaw: START.yaw, pitch: START.pitch, bob: 0, walkTo: null, held: 0, run: 0, jump: 0, vy: 0 })
  const keys = useRef({})
  const dof = useRef()
  const focus = useMemo(() => new THREE.Vector3(), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  useEffect(() => {
    camera.fov = mobile ? 70 : 55
    camera.updateProjectionMatrix()
  }, [mobile])

  useEffect(() => {
    const el = gl.domElement
    // what's under the pointer: a labelled exhibit, the floor, or nothing
    const pick = e => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      for (const h of ray.intersectObjects(scene.children, true)) {
        if (h.object.isPoints || h.object.userData.ignore) continue
        if (h.object.userData.stop) return { stop: h.object.userData.stop }
        if (h.object.userData.floor && h.distance < 30) return { point: h.point }
        if (h.object.material?.transparent) continue // light cones, glass, etc. never block a click
        if (h.object.isMesh) return {}
      }
      return {}
    }
    let drag = null, lastTap = null
    const down = e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; el.setPointerCapture(e.pointerId) }
    const move = e => {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y
        drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY
        if (drag.moved > 6) {
          const k = e.pointerType === 'touch' ? 0.006 : 0.004
          me.current.yaw -= dx * k // grab-and-drag the view
          me.current.pitch = THREE.MathUtils.clamp(me.current.pitch + dy * k, -0.6, 0.6)
          if (store.get().active && !store.get().arrived) store.set({ active: null })
          hover.point = null
        }
        return
      }
      const p = pick(e)
      hover.point = p.point || null; hover.stop = p.stop || null
      el.style.cursor = p.stop ? 'pointer' : p.point ? 'crosshair' : 'grab'
    }
    const up = e => {
      if (drag && drag.moved <= 6) {
        const p = pick(e)
        if (p.stop) goTo(p.stop)
        else if (p.point) {
          // double tap / double click on the floor runs there instead of walking
          const now = performance.now(), prev = lastTap
          const run = prev && now - prev.t < 350 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40
          lastTap = run ? null : { t: now, x: e.clientX, y: e.clientY }
          me.current.walkTo = { x: p.point.x, z: p.point.z, run }
          store.set({ active: null })
        }
      }
      drag = null
    }
    const kd = e => {
      if (e.target.closest?.('input, a') || (e.code !== 'Space' && e.target.closest?.('button'))) return
      keys.current[e.code] = true
      if (e.code === 'Space') {
        e.preventDefault()
        if (me.current.jump === 0) me.current.vy = 4.6 // only from the ground
      }
      if (MOVE_KEYS.includes(e.code)) { e.preventDefault(); me.current.walkTo = null; if (store.get().active) store.set({ active: null }) }
    }
    const ku = e => { keys.current[e.code] = false }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up)
    addEventListener('keydown', kd); addEventListener('keyup', ku)
    return () => {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up)
      removeEventListener('keydown', kd); removeEventListener('keyup', ku)
    }
  }, [])

  useFrame((_, dt) => {
    const m = me.current, k = keys.current, d = Math.min(dt, 1 / 30)
    const { active, arrived } = store.get()
    let moving = false
    if (active) m.walkTo = null // opening an exhibit cancels any pending click-to-walk
    const step = (nx, nz) => { // slide along walls instead of stopping dead
      if (walkable(nx, nz)) { m.x = nx; m.z = nz } else if (walkable(nx, m.z)) m.x = nx; else if (walkable(m.x, nz)) m.z = nz
    }
    if (active && !arrived) { // glide to the viewing spot
      let [tx, , tz] = active.pos
      let tp = active.pitch
      if (mobile) { // phones: step back and tilt down so the piece sits above the label sheet
        tx -= Math.sin(active.yaw) * 1.3; tz += Math.cos(active.yaw) * 1.3; tp -= 0.3
      }
      m.x = THREE.MathUtils.damp(m.x, tx, 2.6, d); m.z = THREE.MathUtils.damp(m.z, tz, 2.6, d)
      m.yaw += angDiff(m.yaw, active.yaw) * (1 - Math.exp(-3 * d))
      m.pitch = THREE.MathUtils.damp(m.pitch, tp, 3, d)
      moving = true
      if (Math.hypot(m.x - tx, m.z - tz) < 0.05 && Math.abs(angDiff(m.yaw, active.yaw)) < 0.02) store.set({ arrived: true })
    } else if (m.walkTo) { // tap-to-walk
      const dx = m.walkTo.x - m.x, dz = m.walkTo.z - m.z, dist = Math.hypot(dx, dz)
      if (dist < 0.1) { m.walkTo = null; m.run = 0 }
      else {
        m.run = THREE.MathUtils.damp(m.run, m.walkTo.run ? 1 : 0, 5, d)
        const sp = Math.min(dist, THREE.MathUtils.lerp(3.4, 7.5, m.run) * d)
        const bx = m.x, bz = m.z
        step(m.x + (dx / dist) * sp, m.z + (dz / dist) * sp)
        m.yaw += angDiff(m.yaw, Math.atan2(dx, -dz)) * (1 - Math.exp(-2 * d)) * Math.min(1, dist / 2)
        if (bx === m.x && bz === m.z) m.walkTo = null // blocked
        moving = true
      }
    } else {
      const fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
      const strafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0)
      m.yaw += ((k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0)) * 1.8 * d
      m.held = fwd || strafe ? m.held + d : 0
      // keep a key held and the walk builds into a run; Shift runs straight away
      const runTarget = k.ShiftLeft || k.ShiftRight ? 1 : THREE.MathUtils.smoothstep(m.held, 0.7, 1.4)
      m.run = THREE.MathUtils.damp(m.run, fwd || strafe ? runTarget : 0, 5, d)
      if (fwd || strafe) {
        const sp = THREE.MathUtils.lerp(3.4, 7.5, m.run) * d, sy = Math.sin(m.yaw), cy = Math.cos(m.yaw)
        const len = Math.hypot(fwd, strafe)
        step(m.x + ((sy * fwd + cy * strafe) / len) * sp, m.z + ((-cy * fwd + sy * strafe) / len) * sp)
        moving = true
      }
    }
    // jump: simple ballistic arc, no bobbing in the air
    if (m.vy !== 0 || m.jump > 0) {
      m.vy -= 13 * d
      m.jump += m.vy * d
      if (m.jump <= 0) { m.jump = 0; m.vy = 0 }
    }
    m.bob += moving && m.jump === 0 ? d * (8 + 5 * m.run) : 0
    const bob = moving && m.jump === 0 ? Math.sin(m.bob) * (0.025 + 0.03 * m.run) : 0
    camera.position.set(m.x, 1.75 + bob + m.jump, m.z)
    const fov = (mobile ? 70 : 55) + 7 * m.run // lens widens a touch at a run
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix() }
    camera.rotation.set(m.pitch, -m.yaw, 0, 'YXZ')
    // focus on the exhibit when viewing one, otherwise a few metres ahead
    if (active) focus.set(active.pos[0] + Math.sin(active.yaw) * 4, 2.2, active.pos[2] - Math.cos(active.yaw) * 4)
    else focus.set(m.x + Math.sin(m.yaw) * 6, 2, m.z - Math.cos(m.yaw) * 6)
    if (dof.current) dof.current.target = focus
  })

  return (
    <EffectComposer multisampling={0}>
      <DepthOfField ref={dof} target={[0, 2, 0]} focalLength={0.14} bokehScale={1.6} height={900} />
      <Bloom intensity={0.7} luminanceThreshold={0.85} mipmapBlur radius={0.7} />
      <Noise opacity={0.05} premultiply />
      <Vignette offset={0.25} darkness={0.6} />
    </EffectComposer>
  )
}

// ---------- labels under every exhibit: "Career 01", "Work 03", "Toolkit" ----------
function Marker({ stop }) {
  const ref = useRef()
  const { camera } = useThree()
  const active = useStore(s => s.active)
  useFrame(() => {
    const dist = Math.hypot(camera.position.x - stop.anchor[0], camera.position.z - stop.anchor[2])
    if (ref.current) ref.current.style.opacity = dist > 22 ? 0 : dist > 16 ? (22 - dist) / 6 : 1
  })
  const on = active === stop
  return (
    <Html position={stop.anchor} center zIndexRange={[4, 0]}>
      <button ref={ref} className={`marker marker--${stop.kind}${on ? ' is-on' : ''}`} onClick={() => goTo(stop)}>
        <span className="marker__dot" />{stop.label}
      </button>
    </Html>
  )
}
function Markers() { return STOPS.map(s => <Marker key={s.label} stop={s} />) }

// ring on the floor where a click will walk you to
function FloorCursor() {
  const ref = useRef()
  useFrame(({ clock }) => {
    const p = hover.point
    ref.current.visible = !!p
    if (p) { ref.current.position.set(p.x, 0.02, p.z); ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4) * 0.06) }
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} userData={{ ignore: true }}>
      <ringGeometry args={[0.22, 0.28, 48]} />
      <meshBasicMaterial color="#fff4e0" transparent opacity={0.8} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

function Oculus() {
  const light = useRef()
  const { scene } = useThree()
  useEffect(() => {
    const target = light.current.target
    target.position.set(0, 0, ROTUNDA_Z) // straight down onto the centrepiece
    scene.add(target)
    return () => scene.remove(target)
  }, [])
  return <SpotLight ref={light} position={[0, 21, ROTUNDA_Z]} color="#fff4e0" intensity={260} distance={26} angle={0.2} penumbra={0.4} attenuation={22} anglePower={3} opacity={0.3} />
}

export default function Scene() {
  return (
    <>
      <color attach="background" args={[HAZE]} />
      <fog attach="fog" args={[HAZE, 22, 85]} />
      <ambientLight intensity={0.55} color="#ffe6d6" />
      <hemisphereLight args={['#ffe9d0', '#3a2622', 0.7]} />
      <Player />
      <Architecture />
      <Gallery />
      <Dust />
      {CAREER.map((e, i) => <Exhibit key={e.src} e={e} x={e.side * 3.3} z={e.z} stop={STOPS.find(t => t.kind === 'career' && t.i === i)} />)}
      {DECOR.map(e => (
        <Exhibit key={e.src} e={e} x={e.x} z={e.z} podium={e.wide ? [2.9, 0.75, 1.4] : [1.3, 1.2, 1.3]} beam={e.wide ? 0.62 : 0.5} />
      ))}
      <Exhibit e={CENTREPIECE} x={0} z={ROTUNDA_Z} podium={[1.8, 1.5, 1.8]} beam={0.42} stop={STOPS.find(t => t.kind === 'centre')} />
      <Markers />
      <FloorCursor />
      <Oculus />
    </>
  )
}
