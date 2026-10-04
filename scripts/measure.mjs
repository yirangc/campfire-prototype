// Measures rendered component boxes in the showcase and compares them with Figma frame sizes.
// Usage: node scripts/measure.mjs [url]   (expects `npm run preview` or another static server)
import { chromium } from 'playwright-core'

const url = process.argv[2] ?? 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', ignoreDefaultArgs: ['--hide-scrollbars'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)

const controls = page.locator('#controls')
const reporting = page.locator('#reporting')
const allocation = page.locator('#allocation')
const nav = page.locator('#navigation')

// [name, locator, figma width (null = fluid), figma height, Figma node]
const checks = [
  ['Button primary "Save"', controls.getByRole('button', { name: 'Save', exact: true }), 52, 36, '12:12176'],
  ['Button secondary "Cancel"', controls.getByRole('button', { name: 'Cancel' }).first(), 64, 36, '12:12177'],
  ['Button secondary "Add Line"', controls.getByRole('button', { name: 'Add Line' }), 75, 36, '12:12178'],
  ['Button icon-only save', controls.getByRole('button', { name: 'Save report' }), 36, 36, '12:12179'],
  ['Button "Expand All"', controls.getByRole('button', { name: 'Expand All' }), 109, 36, '12:12182'],
  ['Button "Download"', reporting.getByRole('button', { name: 'Download' }), 82, 36, '12:12142'],
  ['Field labelled (Number)', controls.locator('div:has(> div > input[value="12345"])').first(), 280, 62, '12:12183'],
  ['Dropdown Cadence trigger', controls.getByRole('button', { name: /Cadence/ }).first(), 160, 36, '12:12133'],
  ['Dropdown Date Range trigger', controls.getByRole('button', { name: /Date Range \/ reporting/ }), 300, 36, '12:12136'],
  ['Metric card', controls.locator('section[aria-labelledby]').first(), 252, 100, '12:12191'],
  ['Trend badge', controls.locator('section[aria-labelledby]').first().locator('span').filter({ hasText: '11%' }).first(), 45, 22, '12:12195'],
  ['Nav item default (Home)', nav.getByRole('link', { name: 'Home' }).nth(2), 196, 36, '12:12138'],
  ['Side panel', nav.locator('nav[aria-label="Reporting navigation example"]'), 224, null, '12:12172'],
  ['Breadcrumbs dashboard', nav.locator('nav[aria-label="Breadcrumb"]').nth(0), 282, 32, '12:12173'],
  ['Breadcrumbs reporting', nav.locator('nav[aria-label="Breadcrumb"]').nth(1), 192, 32, '12:12175'],
  ['Breadcrumbs reporting header', reporting.locator('nav[aria-label="Breadcrumb"] ol').first(), 173, 24, '12:11632'],
  ['Income Statement table', reporting.locator('table').first().locator('xpath=..'), 1056, 362, '12:12196'],
  ['Financial header row', reporting.locator('thead tr').first(), null, 42, '12:11679'],
  ['Financial body row', reporting.locator('tbody tr').first(), null, 40, '12:11685'],
  ['Allocation table', allocation.locator('table').first().locator('xpath=../..'), 1104, 214, '12:12197'],
  ['Allocation header row', allocation.locator('thead tr').first(), null, 36, '12:11798'],
  ['Allocation body row', allocation.locator('tbody tr').first(), null, 44, '12:11810'],
  ['Allocation total row', allocation.locator('tfoot tr').first(), null, 38, '12:11894'],
  ['Dropdown cell specimen', allocation.getByRole('button', { name: 'Tag', exact: true }).locator('xpath=../../..'), 300, 44, '12:12188'],
]

let failures = 0
for (const [name, loc, fw, fh, node] of checks) {
  const box = await loc.boundingBox()
  if (!box) {
    console.log(`MISSING  ${name}`)
    failures++
    continue
  }
  const w = Math.round(box.width * 100) / 100
  const h = Math.round(box.height * 100) / 100
  const okW = fw == null || Math.abs(w - fw) <= 1
  const okH = fh == null || Math.abs(h - fh) <= 1
  if (!okW || !okH) failures++
  console.log(`${okW && okH ? 'OK      ' : 'DIFF    '} ${name.padEnd(32)} ${w} × ${h}   Figma ${fw ?? 'fluid'} × ${fh ?? 'fluid'} (${node})`)
}

// Open menu (proposed) height: 3 options × 36 + 2 × 4 inset = 116 (+2 border)
await controls.getByRole('button', { name: /Cadence/ }).first().click()
const menu = await page.getByRole('listbox').boundingBox()
console.log(`${menu && Math.abs(menu.height - 116) <= 2 ? 'OK      ' : 'DIFF    '} Open menu height                 ${menu?.height}   Figma 116 (12:12185)`)
await page.keyboard.press('Escape')

console.log(failures ? `\n${failures} difference(s)` : '\nAll measured boxes within 1 px of Figma')
await browser.close()
