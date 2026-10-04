// Builds src/assets/icons/*.svg from the geometry read out of the Figma icon components
// (scripts/figma/icon-geometry.json). Usage: node scripts/figma/build-icons.mjs
//
// Figma's own SVG export drops open sub-paths from these vectors (the inner lines of revenue, calendar,
// panel, settings, help and others), so the files are rebuilt from the vector data, following Figma's
// INSIDE stroke model:
// - a vector with a fill region clips all of its strokes to that region. Segments on the region's edge
//   get a double-width stroke, so the visible half sits inside; segments that run through the interior
//   keep the normal width, centred. Anything outside the region is clipped away.
// - a vector without a fill region (chevrons, x, plus, check, arrows, download) draws centred strokes,
//   and so does a vector whose strokeAlign is CENTER (wallet, calendar, trash, lock).
// - a filled vector (settings) is drawn from its fill geometry.
// - the component frame clips its content when clipsContent is true.
// Smaller sizes scale the geometry and keep the stroke weight, which is how Figma's own 16, 14 and 12 px
// instances of these components are drawn (they keep a 1.5 px stroke). Panel at 16 px is the exception:
// its instance (38:5739) overrides the stroke to 1 px.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '../../src/assets/icons')
const { icons } = JSON.parse(readFileSync(join(here, 'icon-geometry.json'), 'utf8'))

// color/text/secondary (#727572) is bound on every icon stroke. Files use currentColor and the Icon
// component sets that color, because some Figma instances override it (e.g. the green check, 28:8918).
const COLOR = "currentColor"
const SIZES = [24, 16, 14, 12, 10]
const STROKE_OVERRIDES = { 'panel@16': 1 }

const fmt = (n) => {
  const r = Math.round(n * 1000) / 1000
  return Object.is(r, -0) ? '0' : String(r)
}

/** Parse absolute M/L/C/Z path data into segments: { from, to, c1?, c2? } in canvas units. */
function segments(d, dx, dy) {
  const t = d.match(/[MLCZ]|-?[\d.]+(?:e-?\d+)?/g)
  const segs = []
  let start = null
  let cur = null
  for (let i = 0; i < t.length; ) {
    const cmd = t[i++]
    const pt = () => [Number(t[i++]) + dx, Number(t[i++]) + dy]
    if (cmd === 'M') start = cur = pt()
    else if (cmd === 'L') {
      const p = pt()
      segs.push({ from: cur, to: p })
      cur = p
    } else if (cmd === 'C') {
      const c1 = pt(), c2 = pt(), p = pt()
      segs.push({ from: cur, c1, c2, to: p })
      cur = p
    } else if (cmd === 'Z') {
      if (cur[0] !== start[0] || cur[1] !== start[1]) segs.push({ from: cur, to: start })
      cur = start
    } else throw new Error(`Unsupported path command ${cmd}`)
  }
  return segs
}

const bez = (s, u) => {
  if (!s.c1) return [s.from[0] + (s.to[0] - s.from[0]) * u, s.from[1] + (s.to[1] - s.from[1]) * u]
  const v = 1 - u
  const f = (a, b, c, e) => v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * e
  return [f(s.from[0], s.c1[0], s.c2[0], s.to[0]), f(s.from[1], s.c1[1], s.c2[1], s.to[1])]
}

/** Flatten a region path into a polygon for point-in-region tests. */
function polygon(d, dx, dy) {
  const pts = []
  for (const s of segments(d, dx, dy)) for (let k = 0; k < 16; k++) pts.push(bez(s, k / 16))
  return pts
}

function inside([x, y], poly) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** Point just either side of a segment at parameter u: both inside the region means interior. */
function interiorAt(s, u, poly) {
  const [mx, my] = bez(s, u)
  const [ax, ay] = bez(s, Math.max(0, u - 0.01)), [bx, by] = bez(s, Math.min(1, u + 0.01))
  let nx = -(by - ay), ny = bx - ax
  const len = Math.hypot(nx, ny) || 1
  nx = (nx / len) * 0.3
  ny = (ny / len) * 0.3
  return inside([mx + nx, my + ny], poly) && inside([mx - nx, my - ny], poly)
}

/** Sub-segment of s between parameters u0 and u1 (de Casteljau for curves). */
function slice(s, u0, u1) {
  if (!s.c1) return { from: bez(s, u0), to: bez(s, u1) }
  const split = (q, u) => {
    const lerp = (a, b) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
    const ab = lerp(q.from, q.c1), bc = lerp(q.c1, q.c2), cd = lerp(q.c2, q.to)
    const abc = lerp(ab, bc), bcd = lerp(bc, cd), m = lerp(abc, bcd)
    return [{ from: q.from, c1: ab, c2: abc, to: m }, { from: m, c1: bcd, c2: cd, to: q.to }]
  }
  const right = split(s, u0)[1]
  return split(right, (u1 - u0) / (1 - u0 || 1))[0]
}

/**
 * Figma splits strokes where they cross the region edge. Walk each segment in small steps and return
 * runs classified as interior (normal width) or edge/outside (double width, clipped).
 */
function classify(segs, poly) {
  const edge = [], inner = []
  const N = 48
  for (const s of segs) {
    let u0 = 0
    let cls = interiorAt(s, 0.5 / N, poly)
    for (let k = 1; k <= N; k++) {
      const next = k < N ? interiorAt(s, (k + 0.5) / N, poly) : !cls
      if (next !== cls) {
        ;(cls ? inner : edge).push(slice(s, u0, k / N))
        u0 = k / N
        cls = next
      }
    }
  }
  return { edge, inner }
}

const segPath = (s, k) => {
  const p = (q) => `${fmt(q[0] * k)} ${fmt(q[1] * k)}`
  return s.c1 ? `M${p(s.from)} C${p(s.c1)} ${p(s.c2)} ${p(s.to)}` : `M${p(s.from)} L${p(s.to)}`
}

/** The path as drawn, moved and scaled, with its sub-paths and joins intact. */
function placePath(d, dx, dy, k) {
  const t = d.match(/[MLCZ]|-?[\d.]+(?:e-?\d+)?/g)
  let axis = 0
  return t
    .map((v) => {
      if (/[MLCZ]/.test(v)) {
        axis = 0
        return v
      }
      const n = (Number(v) + (axis++ % 2 === 0 ? dx : dy)) * k
      return fmt(n)
    })
    .join(' ')
}

/** Region path, keeping each sub-path (a fill with a hole, like settings, has two). */
function regionPath(d, dx, dy, k) {
  return d
    .split(/(?=M)/)
    .filter((sub) => sub.trim())
    .map((sub) => segments(sub, dx, dy).map((s, i) => (i === 0 ? segPath(s, k) : segPath(s, k).replace(/^M\S+ \S+ /, ''))).join(' ') + ' Z')
    .join(' ')
}

function build(name, icon, size, nodeId) {
  const k = size / 24
  const w = STROKE_OVERRIDES[`${name}@${size}`] ?? 1.5
  const filled = icon.parts.every((p) => p.paint === 'FILL')
  const defs = []
  const groups = []
  icon.parts.forEach((part, pi) => {
    const segs = segments(part.d, part.dx, part.dy)
    if (part.paint === 'FILL') {
      // Filled vector (settings): scale the fill geometry; there is no stroke to keep.
      groups.push(`<path d="${regionPath(part.d, part.dx, part.dy, k)}" fill="${COLOR}" fill-rule="nonzero"/>`)
      return
    }
    const cap = part.cap === 'NONE' ? 'butt' : 'round'
    const join = (part.join ?? 'MITER').toLowerCase()
    const attrs = `stroke="${COLOR}" stroke-linecap="${cap}" stroke-linejoin="${join}" fill="none"`
    // CENTER-aligned strokes are not clipped to the fill region.
    if (!part.fill || part.align === 'CENTER') {
      groups.push(`<path d="${placePath(part.d, part.dx, part.dy, k)}" stroke-width="${fmt(w)}" ${attrs}/>`)
      return
    }
    const poly = polygon(part.fill, part.dx, part.dy)
    const { edge, inner } = classify(segs, poly)
    const id = `${name}-${size}-r${pi}`
    defs.push(`<clipPath id="${id}"><path d="${regionPath(part.fill, part.dx, part.dy, k)}"/></clipPath>`)
    let g = ''
    if (edge.length) g += `<path d="${edge.map((s) => segPath(s, k)).join(' ')}" stroke-width="${fmt(w * 2)}" ${attrs}/>`
    if (inner.length) g += `<path d="${inner.map((s) => segPath(s, k)).join(' ')}" stroke-width="${fmt(w)}" ${attrs}/>`
    groups.push(`<g clip-path="url(#${id})">${g}</g>`)
  })
  let content = groups.join('')
  if (icon.clip) {
    defs.push(`<clipPath id="${name}-${size}-frame"><rect width="${size}" height="${size}"/></clipPath>`)
    content = `<g clip-path="url(#${name}-${size}-frame)">${content}</g>`
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">` +
    `<!-- Campfire/Icon/${name} (Figma ${nodeId}), reconstruction, ${size}px, ${filled ? 'filled' : `${fmt(w)}px stroke`} -->` +
    (defs.length ? `<defs>${defs.join('')}</defs>` : '') +
    content +
    `</svg>\n`
  )
}

mkdirSync(out, { recursive: true })
let n = 0
for (const [name, icon] of Object.entries(icons)) {
  const nodeId = icon.nodeId
  for (const size of SIZES) {
    const file = size === 24 ? `${name}.svg` : `${name}-${size}.svg`
    writeFileSync(join(out, file), build(name, icon, size, nodeId))
    n++
  }
}
console.log(`Wrote ${n} icon files to src/assets/icons`)
