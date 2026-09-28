import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'motion/react'
import Scene, { goTo } from './Scene'
import { STOPS } from './tour.js'
import { store, useStore } from './store.js'

const EASE = [0.16, 1, 0.3, 1]

// the wall label for whatever exhibit the visitor opened
function Panel() {
  const active = useStore(s => s.active)
  const idx = active ? STOPS.indexOf(active) : -1
  useEffect(() => {
    const k = e => {
      if (!active) return
      if (e.key === 'Escape') store.set({ active: null })
      if (e.key === ']' || e.key === 'n') goTo(STOPS[(idx + 1) % STOPS.length])
      if (e.key === '[' || e.key === 'p') goTo(STOPS[(idx - 1 + STOPS.length) % STOPS.length])
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [active, idx])
  const e = active?.data
  const work = active?.kind === 'work'
  const no = active?.kind === 'career' ? `Career · ${String(active.i + 1).padStart(2, '0')} / 04`
    : work ? `Work · ${String(active.i + 1).padStart(2, '0')} / 08` : 'Centrepiece'
  return (
    <div className="placard-wrap">
      <AnimatePresence mode="wait">
        {active && (
          <motion.article key={active.label} className={`placard${work ? ' placard--work' : ''}`}
            initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 30, filter: 'blur(10px)' }} transition={{ duration: 0.6, ease: EASE }}>
            <button className="placard__close" onClick={() => store.set({ active: null })} aria-label="Close">×</button>
            <p className="placard__no">{no}</p>
            <p className="placard__kicker">{work ? e.org : e.kicker}</p>
            <h2>{e.title}</h2>
            {e.sub && <p className="placard__sub"><em>{e.sub}</em></p>}
            {e.stats && <div className="placard__stats">{e.stats.map(([n, l]) => <p key={l}><b>{n}</b><span>{l}</span></p>)}</div>}
            {e.body && <p className="placard__body">{e.body}</p>}
            {e.groups && <dl className="placard__groups">{e.groups.map(([g, v]) => <div key={g}><dt>{g}</dt><dd>{v}</dd></div>)}</dl>}
            {e.tags && <ul className="placard__tags">{e.tags.map(t => <li key={t}>{t}</li>)}</ul>}
            <p className="placard__piece">{work ? 'Painting' : 'On view'} · <em>{e.piece}</em></p>
            <nav className="placard__nav">
              <button onClick={() => goTo(STOPS[(idx - 1 + STOPS.length) % STOPS.length])}>← {STOPS[(idx - 1 + STOPS.length) % STOPS.length].label}</button>
              <button onClick={() => goTo(STOPS[(idx + 1) % STOPS.length])}>{STOPS[(idx + 1) % STOPS.length].label} →</button>
            </nav>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  )
}

// exhibit index: jump straight to any piece
function Index({ open, onClose }) {
  const groups = [['Career', 'career'], ['Works', 'work'], ['Rotunda', 'centre']]
  return (
    <AnimatePresence>
      {open && (
        <motion.nav className="index" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
          {groups.map(([name, kind]) => (
            <div key={kind}>
              <p>{name}</p>
              {STOPS.filter(s => s.kind === kind).map(s => (
                <button key={s.label} onClick={() => { goTo(s); onClose() }}><b>{s.label}</b> {s.data.title}</button>
              ))}
            </div>
          ))}
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

function Fin() {
  const open = useStore(s => s.contact)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText('rohitkodam4@gmail.com'); setCopied(true); setTimeout(() => setCopied(false), 1800) }
    catch { location.href = 'mailto:rohitkodam4@gmail.com' }
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.section className="credits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <button className="fin__back" onClick={() => store.set({ contact: false })}>← Back to the gallery</button>
          <motion.div className="fin" initial={{ scale: 0.94 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: EASE }}>
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
      )}
    </AnimatePresence>
  )
}

// opening titles; any click or key cuts straight to the gallery
function Opening({ phase, skip }) {
  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div className="opening" onClick={skip} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeInOut' }}>
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.p key="p" className="opening__presents" initial={{ opacity: 0, letterSpacing: '0.2em' }} animate={{ opacity: 1, letterSpacing: '0.5em' }}
                exit={{ opacity: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>Rohit Kodam presents</motion.p>
            )}
            {phase === 2 && (
              <motion.h1 key="t" className="opening__title" initial={{ opacity: 0, scale: 1.08, filter: 'blur(14px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 1.2, ease: EASE }}>
                The Gallery<small>walk in, look around, click anything labelled</small>
              </motion.h1>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const { active: loading, progress: pct } = useProgress()
  const loaded = !loading && pct === 100
  const [phase, setPhase] = useState(0)
  const [index, setIndex] = useState(false)
  const current = useStore(s => s.active)
  const skip = () => setPhase(3)

  useEffect(() => {
    if (!loaded) return
    const ts = [setTimeout(() => setPhase(1), 150), setTimeout(() => setPhase(2), 1100), setTimeout(() => setPhase(3), 2600)]
    addEventListener('keydown', skip, { once: true })
    return () => { ts.forEach(clearTimeout); removeEventListener('keydown', skip) }
  }, [loaded])

  const next = () => goTo(STOPS[current ? (STOPS.indexOf(current) + 1) % STOPS.length : 0])

  return (
    <>
      <div className="stage">
        <Canvas dpr={[1, 2]} camera={{ fov: 55, near: 0.1, far: 90, position: [0, 1.75, 8.5] }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
      </div>

      <Panel />

      <motion.div className="bar bar--top" initial={{ height: '50vh' }} animate={{ height: phase >= 3 ? 'var(--bar)' : '50vh' }} transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}>
        <span className="mark">R · K</span>
        <div className="bar__actions">
          <button onClick={() => setIndex(v => !v)}>Exhibits ▾</button>
          <button onClick={next}>{current ? 'Next exhibit →' : 'Start the tour →'}</button>
          <button className="bar__cta" onClick={() => store.set({ contact: true, active: null })}>Contact</button>
        </div>
      </motion.div>
      <Index open={index} onClose={() => setIndex(false)} />
      <motion.div className="bar bar--bottom" initial={{ height: '50vh' }} animate={{ height: phase >= 3 ? 'var(--bar)' : '50vh' }} transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}>
        <span className="hint hint--desk"><kbd>W A S D</kbd> / <kbd>↑ ↓</kbd> walk (hold to run) · <kbd>⇧</kbd> sprint · <kbd>Space</kbd> jump · <kbd>← →</kbd> turn · drag to look · double-click floor to run · click a label to view</span>
        <span className="hint hint--touch">Drag to look · tap the floor to walk · double-tap to run · tap a label to view</span>
      </motion.div>

      <Fin />
      <Opening phase={loaded ? phase : 0} skip={skip} />
      {!loaded && <div className="loading">Loading the collection… {Math.round(pct)}%</div>}
    </>
  )
}
