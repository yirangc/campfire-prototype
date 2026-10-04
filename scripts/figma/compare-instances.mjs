// Compares the per-size icon files with Figma renders of real instances at that size
// (scripts/figma/reference/instances/{name}-{size}@8x.png). Compares ink coverage only, because
// instances may override the stroke color. Usage: node scripts/figma/compare-instances.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'

const here = dirname(fileURLToPath(import.meta.url))
const refDir = join(here, 'reference/instances')
const iconDir = join(here, '../../src/assets/icons')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ deviceScaleFactor: 8, viewport: { width: 100, height: 100 } })
const ink = (png, i) => {
  const a = png.data[i + 3] / 255
  const lum = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3
  return a * (1 - lum / 255) // 0 = white/transparent, larger = darker coverage
}
for (const file of readdirSync(refDir).sort()) {
  const [, name, size] = file.match(/^(.+)-(\d+)@8x\.png$/)
  const ref = PNG.sync.read(readFileSync(join(refDir, file)))
  const svg = readFileSync(join(iconDir, `${name}-${size}.svg`), 'utf8')
  await page.setContent(`<style>html,body{margin:0;background:#fff;color:#727572}svg{display:block}</style>${svg}`)
  const shot = PNG.sync.read(await page.screenshot({ clip: { x: 0, y: 0, width: Number(size), height: Number(size) } }))
  let refInk = 0, both = 0, onlyOne = 0
  for (let i = 0; i < ref.data.length; i += 4) {
    const a = ink(ref, i) > 0.15, b = ink(shot, i) > 0.15
    if (a) refInk++
    if (a && b) both++
    else if (a || b) onlyOne++
  }
  console.log(`${name}-${size}: ${(onlyOne / refInk * 100).toFixed(1)}% of ${refInk} inked px differ`)
}
await browser.close()
