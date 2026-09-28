// The film: Gallery I (career, told by sculptures) → an arch → Gallery II
// (projects, told by paintings) → the rotunda (toolkit) → Fin.
// Scroll 0 → FILM_END drives the camera; the rest fades to the Fin card.
export const FILM_END = 0.965

export const CAREER = [
  {
    src: 'veiled', aspect: 0.725, h: 1.9, piece: 'Portrait bust of a woman · Severan, ca. 193–211 CE',
    kicker: 'Introduction', title: 'Rohit Kodam', sub: 'Full Stack AI Engineer',
    body: 'I build full-stack AI products end to end — from the backend systems that carry the load to the interfaces people actually touch. Growing toward distributed systems at scale.',
  },
  {
    src: 'augustus', aspect: 0.867, h: 1.35, piece: 'Portrait of the emperor Augustus · ca. 14–37 CE',
    kicker: 'Sept 2026 — Present', title: 'OnFinance', sub: 'Full Stack AI SDE',
    body: 'Building NeoGPT-powered AI agents for BFSI compliance teams — regulatory circulars in, assigned and trackable actionables out.',
    tags: ['ComplianceOS', 'V2T', 'ResearchOS'],
  },
  {
    src: 'queen', aspect: 0.532, h: 1.8, piece: 'Head of a Ptolemaic queen · Hellenistic, ca. 270–250 BCE',
    kicker: 'Jul 2024 — Aug 2026', title: 'TMRW House of Brands', sub: 'Software Development Engineer I',
    body: 'Led architecture and full-stack development for multitenant e-commerce behind Bewakoof, Wrogn, Veirdo and Juneberry. Migrated legacy stacks to a custom multitenant core, rebuilt order tracking with idempotent crons, owned the Shopify stack and mentored interns.',
    tags: ['Multitenant', 'Shopify', 'Performance'],
  },
  {
    src: 'woman', aspect: 0.507, h: 1.9, piece: 'Portrait bust of a woman · Trajanic, ca. 100–120 CE',
    kicker: 'Where it began', title: 'BITS Pilani, Goa', sub: 'B.E. Computer Science + M.Sc. Economics',
    body: 'A dual degree that taught me to think in both systems and markets.',
  },
].map((e, i) => ({ ...e, side: i % 2 ? 1 : -1, z: -10 - i * 11 }))

// one painting per project
export const WORKS = [
  { img: 'p-rome', piece: 'G. P. Panini, Ancient Rome, 1757', org: 'OnFinance', title: 'AI agents for compliance',
    body: 'NeoGPT products that capture regulatory communications and break them into assigned, audit-ready actionables.',
    tags: ['ComplianceOS', 'V2T', 'ResearchOS'] },
  { img: 'p-trojan', piece: 'Claude Lorrain, The Trojan Women Setting Fire to Their Fleet, c. 1643', org: 'Wrogn · TMRW', title: 'Core Web Vitals, fixed in 4 weeks',
    stats: [['2.2s', 'LCP, from 4.5s+'], ['0.001', 'CLS'], ['450ms', 'TTFB, from 2s']] },
  { img: 'p-sunrise', piece: 'Claude Lorrain, Sunrise, c. 1646–47', org: 'Veirdo · Wrogn · Juneberry', title: 'Growth experiments that paid',
    stats: [['+9%', 'conversion · cart progress bar'], ['+4%', 'conversion · PDP offers'], ['+2.2%', 'conversion · Cart Add X']] },
  { img: 'p-portico', piece: 'Hubert Robert, The Portico of a Country Mansion, 1773', org: 'TMRW · Nautinati', title: 'Multitenant B2B returns',
    stats: [['Zero', 'downtime onboarding Nautinati']],
    body: 'Order-to-warehouse RMS synced with Shopify, plus a configurable Shopify app with hybrid data fetching.' },
  { img: 'p-campagna', piece: 'Claude Lorrain, Pastoral Landscape: The Roman Campagna, c. 1639', org: 'TMRW', title: 'Communication module',
    stats: [['15+', 'email templates'], ['52+', 'SMS templates']] },
  { img: 'd-colosseum', piece: 'G. P. Panini, Ancient Rome (detail), 1757', org: 'Nucleus Admin Panel', title: 'High-volume data pipelines',
    body: 'Bulk CSV import/export on streaming exports and batch-insert jobs — heavy lifting without crushing the database.' },
  { img: 'd-pantheon', piece: 'G. P. Panini, Ancient Rome (detail), 1757', org: 'Bewakoof', title: 'Checkout & coupons',
    body: 'Full-stack Selective Checkout, dynamic delivery messaging, tighter coupon enforcement and fixed return tracking.' },
  { img: 'd-arch', piece: 'G. P. Panini, Ancient Rome (detail), 1757', org: 'Juneberry', title: 'Website launch',
    body: 'Led the Juneberry launch end to end — first commit to live storefront.' },
].map((w, i) => ({ ...w, side: i % 2 ? 1 : -1, z: -52.3 - Math.floor(i / 2) * 10.6 }))

export const CENTREPIECE = {
  src: 'bust', aspect: 0.597, h: 2.6, piece: 'Portrait bust of Gaius, known as Caligula · 37–41 CE',
  kicker: 'The Rotunda', title: 'Toolkit',
  groups: [
    ['Languages', 'TypeScript · Python · Rust · Java · C++'],
    ['Frameworks', 'React · Next.js · NestJS · Node.js · GraphQL · Django'],
    ['Data & infra', 'PostgreSQL · MongoDB · Kafka · Docker · Kubernetes'],
    ['AI', 'LLMs · AI agents'],
  ],
}

// sculptures that stand guard without a label
export const DECOR = [
  { src: 'constantine', aspect: 0.595, h: 1.9, x: -2.5, z: -45.2 },
  { src: 'caracalla', aspect: 0.506, h: 1.9, x: 2.5, z: -45.2 },
  { src: 'verus', aspect: 0.645, h: 1.7, x: -3.8, z: -96.5 },
  { src: 'lion', aspect: 1.333, h: 1.9, x: 3.8, z: -96.5, wide: true },
]

export const ROTUNDA_Z = -112
export const WINGS = { career: 'Gallery I · The Career', works: 'Gallery II · The Works', rotunda: 'The Rotunda' }
