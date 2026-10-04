// Renders each generated 24 px icon at 4x in Chromium and compares it with the Figma render of the
// component (scripts/figma/reference/{name}@4x.png, from node.screenshot({ scale: 4 })).
// Usage: node scripts/figma/compare-icons.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const here = dirname(fileURLToPath(import.meta.url))
const refDir = join(here, 'reference')
const iconDir = join(here, '../../src/assets/icons')
const diffDir = join(here, '../../screenshots/icon-diff')
mkdirSync(diffDir, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ deviceScaleFactor: 4, viewport: { width: 200, height: 200 } })

/** Composite onto white and return greyscale coverage 0..1 per pixel. */
const flatten = (png) => {
  const out = Buffer.alloc(png.width * png.height * 4)
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(png.data[i + c] * a + 255 * (1 - a))
    out[i + 3] = 255
  }
  return out
}

let worst = 0
const rows = []
for (const file of readdirSync(refDir).filter((f) => f.endsWith('@4x.png')).sort()) {
  const name = file.replace('@4x.png', '')
  const raw = PNG.sync.read(readFileSync(join(refDir, file)))
  // Icons that draw outside their frame (download) render larger than 96 px; pad to whole CSS pixels.
  const box = Math.ceil(raw.width / 4)
  const ref = new PNG({ width: box * 4, height: box * 4 })
  PNG.bitblt(raw, ref, 0, 0, raw.width, raw.height, (ref.width - raw.width) / 2, (ref.height - raw.height) / 2)
  const offset = (box - 24) / 2
  const svg = readFileSync(join(iconDir, `${name}.svg`), 'utf8')
  await page.setContent(
    `<style>html,body{margin:0;background:#fff;color:#727572}#b{position:relative;width:${box}px;height:${box}px}` +
      `#b svg{position:absolute;left:${offset}px;top:${offset}px;overflow:visible}</style><div id="b">${svg}</div>`,
  )
  const shot = PNG.sync.read(await page.screenshot({ clip: { x: 0, y: 0, width: box, height: box } }))
  const a = flatten(ref), b = flatten(shot)
  const diff = new PNG({ width: ref.width, height: ref.height })
  const changed = pixelmatch(a, b, diff.data, ref.width, ref.height, { threshold: 0.2 })
  let ink = 0
  for (let i = 0; i < a.length; i += 4) if (a[i] < 200) ink++
  const pct = (changed / Math.max(ink, 1)) * 100
  worst = Math.max(worst, pct)
  writeFileSync(join(diffDir, `${name}.png`), PNG.sync.write(diff))
  rows.push(`${pct < 5 ? 'OK  ' : 'DIFF'} ${name.padEnd(18)} ${changed} px differ (${pct.toFixed(1)}% of ${ink} inked px)`)
}
console.log(rows.join('\n'))
console.log(`\nWorst: ${worst.toFixed(1)}%. Diff images in screenshots/icon-diff/`)
await browser.close()
