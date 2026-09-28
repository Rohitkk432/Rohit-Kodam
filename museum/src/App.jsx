import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence, useTransform, useMotionValueEvent } from 'motion/react'
import Lenis from 'lenis'
import Scene from './Scene'
import { scroll, progress, remap } from './scroll'
import { CAREER, WORKS, CENTREPIECE, WINGS, FILM_END } from './data.js'
import { film } from './path.js'

const EASE = [0.16, 1, 0.3, 1]
const RUNTIME = 190 // seconds of "film" the scroll represents, for the timecode

function Timecode() {
  const ref = useRef()
  useMotionValueEvent(progress, 'change', p => {
    const s = p * RUNTIME, f = Math.floor((s % 1) * 24)
    const pad = n => String(Math.floor(n)).padStart(2, '0')
    ref.current.textContent = `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`
  })
  return <span ref={ref} className="tc">00:00:00:00</span>
}

// Gallery I and the rotunda use a cream wall label beside the sculpture;
// Gallery II uses a darker "work" label beside each painting.
function Placard() {
  const [stop, setStop] = useState(null)
  useMotionValueEvent(progress, 'change', p => {
    const s = p >= FILM_END ? null : film(remap(p, 0, FILM_END)).stop
    setStop(prev => (prev?.kind === s?.kind && prev?.i === s?.i ? prev : s))
  })
  let e = null, key = null, no = null
  if (stop?.kind === 'career') { e = CAREER[stop.i]; key = e.src; no = `Career · ${String(stop.i + 1).padStart(2, '0')} / ${String(CAREER.length).padStart(2, '0')}` }
  if (stop?.kind === 'work') { e = WORKS[stop.i]; key = e.img + stop.i; no = `Work · ${String(stop.i + 1).padStart(2, '0')} / ${String(WORKS.length).padStart(2, '0')}` }
  if (stop?.kind === 'centre') { e = CENTREPIECE; key = 'centre'; no = 'Centrepiece' }
  const work = stop?.kind === 'work'
  return (
    <div className="placard-wrap">
      <AnimatePresence mode="wait">
        {e && (
          <motion.article key={key} className={`placard${work ? ' placard--work' : ''}`}
            initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }} transition={{ duration: 0.8, ease: EASE }}>
            <p className="placard__no">{no}</p>
            <p className="placard__kicker">{work ? e.org : e.kicker}</p>
            <h2>{e.title}</h2>
            {e.sub && <p className="placard__sub"><em>{e.sub}</em></p>}
            {e.stats && <div className="placard__stats">{e.stats.map(([n, l]) => <p key={l}><b>{n}</b><span>{l}</span></p>)}</div>}
            {e.body && <p className="placard__body">{e.body}</p>}
            {e.groups && <dl className="placard__groups">{e.groups.map(([g, v]) => <div key={g}><dt>{g}</dt><dd>{v}</dd></div>)}</dl>}
            {e.tags && <ul className="placard__tags">{e.tags.map(t => <li key={t}>{t}</li>)}</ul>}
            <p className="placard__piece">{work ? 'Painting' : 'On view'} · <em>{e.piece}</em></p>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  )
}

// film-style title card as the camera walks into each wing
function WingTitle() {
  const [wing, setWing] = useState(null)
  useMotionValueEvent(progress, 'change', p => setWing(p >= FILM_END ? null : film(remap(p, 0, FILM_END)).wing))
  return (
    <div className="wing">
      <AnimatePresence mode="wait">
        {wing && (
          <motion.p key={wing} initial={{ opacity: 0, letterSpacing: '0.1em', filter: 'blur(12px)' }} animate={{ opacity: 1, letterSpacing: '0.32em', filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(12px)' }} transition={{ duration: 1.1, ease: EASE }}>{WINGS[wing]}</motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// the lights go down on the rotunda and the film ends on a single card
function Fin() {
  const shade = useTransform(progress, [FILM_END - 0.025, FILM_END], [0, 1])
  const visibility = useTransform(shade, o => (o < 0.01 ? 'hidden' : 'visible'))
  const finOpacity = useTransform(progress, [FILM_END, FILM_END + 0.02], [0, 1])
  const finScale = useTransform(progress, [FILM_END, 1], [0.94, 1])
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText('rohitkodam4@gmail.com'); setCopied(true); setTimeout(() => setCopied(false), 1800) }
    catch { location.href = 'mailto:rohitkodam4@gmail.com' }
  }
  return (
    <motion.section className="credits" style={{ opacity: shade, visibility }}>
      <motion.div className="fin" style={{ opacity: finOpacity, scale: finScale }}>
        <p className="fin__word"><em>Fin.</em></p>
        <p className="fin__line">For the sequel, write to</p>
        <button className="fin__mail" onClick={copy}>rohitkodam4@gmail.com <small>{copied ? 'copied ✓' : 'click to copy'}</small></button>
        <ul className="fin__links">
          <li><a href="https://github.com/Rohitkk432" target="_blank" rel="noopener">GitHub</a></li>
          <li><a href="https://www.linkedin.com/in/rohit-kodam-b81b95204/" target="_blank" rel="noopener">LinkedIn</a></li>
          <li><a href="https://x.com/rohitkk432" target="_blank" rel="noopener">X</a></li>
          <li><a href="https://www.instagram.com/ryuk_432/" target="_blank" rel="noopener">Instagram</a></li>
        </ul>
        <p className="fin__art">Sculptures &amp; paintings: The Metropolitan Museum of Art, Open Access</p>
      </motion.div>
    </motion.section>
  )
}

// opening titles: black → "presents" → title → shutters open onto the hall
function Opening({ phase }) {
  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div className="opening" exit={{ opacity: 0 }} transition={{ duration: 1.6, ease: 'easeInOut' }}>
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.p key="p" className="opening__presents" initial={{ opacity: 0, letterSpacing: '0.2em' }} animate={{ opacity: 1, letterSpacing: '0.5em' }}
                exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: 'easeOut' }}>Rohit Kodam presents</motion.p>
            )}
            {phase === 2 && (
              <motion.h1 key="t" className="opening__title" initial={{ opacity: 0, scale: 1.08, filter: 'blur(14px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 1.6, ease: EASE }}>
                The Gallery<small>a walk through marble &amp; time</small>
              </motion.h1>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const { active, progress: pct } = useProgress()
  const loaded = !active && pct === 100
  const [phase, setPhase] = useState(0)
  const lenisRef = useRef()

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const lenis = new Lenis({ lerp: 0.05, wheelMultiplier: 0.7, touchMultiplier: 1.2 })
    lenisRef.current = lenis
    lenis.stop()
    lenis.on('scroll', l => { scroll.p = l.progress; scroll.v = l.velocity; progress.set(l.progress) })
    let id
    const raf = t => { lenis.raf(t); id = requestAnimationFrame(raf) }
    id = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(id); lenis.destroy() }
  }, [])

  useEffect(() => {
    if (!loaded) return
    lenisRef.current.start() // scrolling is never locked; the first scroll just cuts the titles short
    const cut = () => setPhase(3)
    addEventListener('wheel', cut, { once: true, passive: true })
    addEventListener('touchmove', cut, { once: true, passive: true })
    const ts = [setTimeout(() => setPhase(1), 150), setTimeout(() => setPhase(2), 1100), setTimeout(() => setPhase(3), 2500)]
    return () => { ts.forEach(clearTimeout); removeEventListener('wheel', cut); removeEventListener('touchmove', cut) }
  }, [loaded])

  const skip = e => { e.preventDefault(); lenisRef.current.scrollTo(FILM_END * lenisRef.current.limit + 2, { duration: 3 }) }
  const hint = useTransform(progress, [0, 0.015], [1, 0])

  return (
    <>
      <div className="stage">
        <Canvas dpr={[1, 1.5]} camera={{ fov: 45, near: 0.1, far: 90, position: [0, 2.6, 19] }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
      </div>

      <Placard />
      <WingTitle />
      <Fin />

      {/* anamorphic letterbox — closed (full black) until the titles are done */}
      <motion.div className="bar bar--top" initial={{ height: '50vh' }} animate={{ height: phase >= 3 ? 'var(--bar)' : '50vh' }} transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1] }}>
        <a href="#" className="mark" onClick={e => { e.preventDefault(); lenisRef.current.scrollTo(0, { duration: 3 }) }}>R · K</a>
        <a href="#" className="skip" onClick={skip}>Skip to the end →</a>
      </motion.div>
      <motion.div className="bar bar--bottom" initial={{ height: '50vh' }} animate={{ height: phase >= 3 ? 'var(--bar)' : '50vh' }} transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1] }}>
        <Timecode />
        <motion.span className="hint" style={{ opacity: hint }}>Scroll to walk the gallery</motion.span>
        <span className="reel">Reel 1 · 2.39 : 1</span>
      </motion.div>

      <Opening phase={loaded ? phase : 0} />
      {!loaded && <div className="loading">Loading the collection… {Math.round(pct)}%</div>}

      <div className="spacer" />
    </>
  )
}
