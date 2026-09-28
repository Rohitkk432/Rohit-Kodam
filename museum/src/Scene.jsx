import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture, SpotLight, MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'
import { scroll, remap } from './scroll'
import { CAREER, WORKS, CENTREPIECE, DECOR, ROTUNDA_Z, FILM_END } from './data.js'
import { posCurve, lookAt, film } from './path.js'

const HALL = { w: 14, h: 8.5, start: 12, end: -100 }
const WALL = '#5a2328' // oxblood gallery walls
const STONE = '#9a8b78'
const MARBLE = '#ece6da'
const WARM = '#ffe2b8'
const HAZE = '#1d1416'
const rand = (a, b) => a + Math.random() * (b - a)
const tex = t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t }

// ---------- a statue: cut-out on a marble podium under its own spotlight ----------
function Exhibit({ e, x, z, podium = [1.3, 1.2, 1.3], beam = 0.55 }) {
  const map = tex(useTexture(`/art/${e.src}.webp`))
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
      <RoundedBox args={podium} radius={0.04} position={[x, top / 2, z]}>
        <meshStandardMaterial color={MARBLE} roughness={0.3} />
      </RoundedBox>
      <group ref={statue} position={[x, top, z]}>
        <mesh position={[0, e.h / 2, 0]}>
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
function Painting({ name, position, rotation, h = 2.6, maxW = 4.4 }) {
  const map = tex(useTexture(`/art/${name}.jpg`))
  const a = map.image.width / map.image.height
  let w = h * a, hh = h
  if (w > maxW) { w = maxW; hh = w / a }
  const f = 0.22 + hh * 0.04 // frame thickness scales with the picture
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[w + f * 2, hh + f * 2, 0.1]} />
        <meshStandardMaterial color="#c79a45" metalness={0.9} roughness={0.28} emissive="#5a3a10" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -55]}>
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
      {WORKS.map(w => (
        <Painting key={w.img + w.z + w.side} name={w.img} position={[w.side * (HALL.w / 2 - 0.06), 3.5, w.z]} rotation={[0, -w.side * Math.PI / 2, 0]} h={2.8} maxW={4.3} />
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

// ---------- the director: camera move with holds, focus pull, handheld breath ----------
const _fwd = new THREE.Vector3()
const _right = new THREE.Vector3()
function Director() {
  const { camera, size } = useThree()
  const mobile = size.width < 760
  const look = useRef(new THREE.Vector3(0, 2.6, 0))
  const dof = useRef()
  const ca = useRef()
  const target = useMemo(() => new THREE.Vector3(), [])
  useEffect(() => {
    camera.fov = mobile ? 66 : 42
    camera.updateProjectionMatrix()
  }, [mobile])
  useFrame(({ clock }, dt) => {
    const f = film(remap(scroll.p, 0, FILM_END))
    const d = Math.min(dt, 1 / 30)
    const pos = posCurve.getPoint(f.t)
    lookAt(f.t, pos, target)
    _fwd.subVectors(target, pos).setY(0).normalize()
    // while holding at an exhibit: slow push-in, and frame the statue to leave room for its label
    pos.addScaledVector(_fwd, f.push * 0.6)
    if (mobile) target.y -= 0.75 * f.focus // statue in the top half, label below
    else target.addScaledVector(_right.set(-_fwd.z, 0, _fwd.x), 1.25 * f.focus) // statue left, label right
    const e = clock.elapsedTime
    pos.x += Math.sin(e * 0.7) * 0.025; pos.y += Math.sin(e * 1.1) * 0.015
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, 3, d)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, 3, d)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, 3, d)
    look.current.lerp(target, 1 - Math.exp(-3 * d))
    camera.lookAt(look.current)
    if (dof.current) dof.current.target = look.current
    if (ca.current) { const o = 0.0003 + Math.min(Math.abs(scroll.v) * 0.00005, 0.003); ca.current.offset.set(o, o * 0.5) }
  })
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField ref={dof} target={[0, 2.6, 0]} focalLength={mobile ? 0.16 : 0.09} bokehScale={mobile ? 1.4 : 2.4} height={900} />
      <Bloom intensity={0.7} luminanceThreshold={0.85} mipmapBlur radius={0.7} />
      <ChromaticAberration ref={ca} offset={[0.0003, 0.00015]} radialModulation={false} />
      <Noise opacity={0.06} premultiply />
      <Vignette offset={0.25} darkness={0.65} />
    </EffectComposer>
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
      <Director />
      <Architecture />
      <Gallery />
      <Dust />
      {CAREER.map(e => <Exhibit key={e.src} e={e} x={e.side * 3.3} z={e.z} />)}
      {DECOR.map(e => (
        <Exhibit key={e.src} e={e} x={e.x} z={e.z} podium={e.wide ? [2.9, 0.75, 1.4] : [1.3, 1.2, 1.3]} beam={e.wide ? 0.62 : 0.5} />
      ))}
      <Exhibit e={CENTREPIECE} x={0} z={ROTUNDA_Z} podium={[1.8, 1.5, 1.8]} beam={0.42} />
      <Oculus />
    </>
  )
}
