// dev helper: prints the scroll position (0..1) at the middle of each stop / wing title
import { film } from './src/path.js'
import { FILM_END } from './src/data.js'

const label = f => (f.stop ? f.stop.kind + (f.stop.i ?? '') : f.wing ? 'wing-' + f.wing : null)
const runs = []
let cur = null
for (let u = 0; u <= 1; u += 0.0005) {
  const k = label(film(u))
  if (k !== cur?.k) { if (cur?.k) runs.push(cur); cur = { k, a: u, b: u } } else cur.b = u
}
if (cur?.k) runs.push(cur)
console.log(runs.map(r => `${r.k}=${(((r.a + r.b) / 2) * FILM_END).toFixed(4)}`).join(' '))
