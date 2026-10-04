// Screenshots named showcase sections for before-and-after comparisons in pull requests.
// Usage: node scripts/compare-sections.mjs <url> <outDir> "Section title" ["Section title" ...]
// A section that does not exist at that URL is skipped and reported.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const [url, out, ...titles] = process.argv.slice(2)
if (!url || !out || !titles.length) throw new Error('Usage: node scripts/compare-sections.mjs <url> <outDir> "Section title" ...')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
for (const title of titles) {
  const section = page.locator('h3', { hasText: new RegExp(`^${title}$`) }).first().locator('xpath=../..')
  const file = `${out}/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  if (!(await section.count())) {
    console.log(`missing: ${title}`)
    continue
  }
  await section.screenshot({ path: file })
  console.log(`saved: ${file}`)
}
await browser.close()
