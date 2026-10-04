// Screenshots the showcase with the pre-installed Chromium. Usage: node scripts/screenshot.mjs <url> <outDir>
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:4173/'
const out = process.argv[3] ?? 'screenshots'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', ignoreDefaultArgs: ['--hide-scrollbars'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)

for (const id of ['foundations', 'assets', 'navigation', 'controls', 'reporting', 'allocation', 'reconciliation', 'flags']) {
  await page.locator(`#${id}`).screenshot({ path: `${out}/${id}.png` })
}
console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors')
await browser.close()
