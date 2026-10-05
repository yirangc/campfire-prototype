// End-to-end check of the static build as GitHub Pages serves it, in Chromium, Firefox or WebKit (Safari's engine).
// 1. Both apps open directly, after a refresh and from the folder URL without its trailing slash, with every asset loaded.
// 2. The full reconciliation flow, ending at 21 Confirmed, 3 Outstanding and a $0.00 difference.
// Usage: node scripts/serve-pages.mjs & node scripts/e2e-pages.mjs [chromium|firefox|webkit] [siteUrl]
// The local Chromium is used unless PLAYWRIGHT_BROWSERS_PATH has Playwright's own builds (CI installs them).
import * as pw from 'playwright-core'
import { readFileSync } from 'node:fs'

const engine = process.argv[2] ?? 'chromium'
const site = (process.argv[3] ?? 'http://localhost:4174/campfire-prototype/').replace(/\/?$/, '/')
const localChromium = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await pw[engine].launch(engine === 'chromium' && !process.env.CI ? { executablePath: localChromium } : {})

let failures = 0
const check = (ok, label) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
  if (!ok) failures++
}

/** Opens a page that records console errors, page errors and failed or non-2xx/3xx requests. */
async function openPage(context) {
  const page = await context.newPage()
  page.problems = []
  page.on('console', (m) => m.type() === 'error' && page.problems.push(`console: ${m.text()}`))
  page.on('pageerror', (e) => page.problems.push(`page error: ${e.message}`))
  page.on('requestfailed', (r) => !r.url().startsWith('blob:') && page.problems.push(`failed: ${r.url()} ${r.failure()?.errorText}`))
  page.on('response', (r) => r.status() >= 400 && page.problems.push(`${r.status()}: ${r.url()}`))
  return page
}

const assetsLoaded = (page) =>
  page.evaluate(async () => {
    await document.fonts.ready
    const css = [...document.styleSheets].length
    const inter = [...document.fonts].some((f) => f.family.includes('Inter') && f.status === 'loaded')
    const images = [...document.images].every((i) => i.complete && i.naturalWidth > 0)
    return { css, inter, images }
  })

// ---------- 1. Both apps under the Pages subpath ----------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await openPage(context)
  for (const [name, path, heading] of [
    ['showcase', '', 'Campfire design system'],
    ['prototype', 'prototype/', 'Reconcile'],
  ]) {
    for (const [how, url] of [
      ['direct', site + path],
      ['without trailing slash', (site + path).replace(/\/$/, '')],
      ['index.html', site + path + 'index.html'],
    ]) {
      page.problems.length = 0
      const response = await page.goto(url, { waitUntil: 'networkidle' })
      const title = page.getByRole('heading', { level: 1, name: heading })
      check(response?.ok() && (await title.count()) > 0, `${name} opens (${how}) at ${page.url()}`)
    }
    await page.reload({ waitUntil: 'networkidle' })
    check((await page.getByRole('heading', { level: 1, name: heading }).count()) > 0, `${name} survives a refresh`)
    const assets = await assetsLoaded(page)
    check(assets.css > 0 && assets.inter && assets.images, `${name} loads CSS, Inter and images ${JSON.stringify(assets)}`)
    check(page.problems.length === 0, `${name} has no failed requests or errors${page.problems.length ? `: ${page.problems.join('; ')}` : ''}`)
  }
  await page.goto(site, { waitUntil: 'networkidle' })
  await page.locator('a[href="./prototype/"]').first().click()
  await page.waitForLoadState('networkidle')
  check(page.url() === site + 'prototype/', `showcase link opens the prototype (${page.url()})`)
  await context.close()
}

// ---------- 2. Reconciliation flow ----------
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
const page = await openPage(context)
await page.goto(site + 'prototype/', { waitUntil: 'networkidle' })

const tab = (name) => page.getByRole('tab', { name: new RegExp(`^${name} \\(\\d+\\)$`) })
const tabCount = async (name) => Number((await tab(name).textContent()).match(/\((\d+)\)/)[1])
const metric = (label) => page.getByRole('region', { name: 'Balances' }).getByRole('region', { name: label, exact: true })
// The card's text is its label, the info tip's definition, then the value.
const metricValue = async (label) => (await metric(label).textContent()).match(/-?\$[\d,]+\.\d\d$/)?.[0]
const metricHas = async (label, value) => (await metricValue(label)) === value
const row = (name) => page.getByRole('button', { name, exact: false }).and(page.locator('[aria-expanded]'))
// The open row's detail cell (one is open at a time).
const detail = () => page.locator('td[id^="case-"]')
const open = async (name) => {
  if ((await row(name).getAttribute('aria-expanded')) !== 'true') await row(name).click()
}
const pick = async (scope, label, option) => {
  await scope.getByRole('button', { name: new RegExp(label) }).click()
  await page.getByRole('option', { name: option }).click()
}

// Ledger cards show the counterparty, not a match status (suggested and auto-matched pairs).
const ledgerCardShowsCounterparty = async (name, counterparty) => {
  await open(name)
  const text = await detail().textContent()
  return text.includes(`Counterparty${counterparty}`) && !text.includes('Match status')
}
check(await ledgerCardShowsCounterparty('Nov 03 · Stripe payout', 'Stripe'), 'Auto-matched ledger card shows Counterparty: Stripe, no Match status')
check(await ledgerCardShowsCounterparty('Nov 04 · ACH NORTH', 'Northstar Hosting'), 'Suggested ledger card shows Counterparty: Northstar Hosting, no Match status')

// Status pills explain themselves on hover and keyboard focus, and clicking one does not expand its row.
{
  const wire = row('Outgoing wire fee')
  const pill = wire.locator('xpath=ancestor::tr').locator('[data-tooltip-trigger]')
  const tip = page.getByRole('tooltip')
  await pill.hover()
  const hovered = (await tip.textContent()) === 'This transaction still needs a match or an explanation.'
  const box = await tip.boundingBox()
  const width = page.viewportSize().width
  await pill.click()
  check(hovered && box && box.x >= 0 && box.x + box.width <= width && (await wire.getAttribute('aria-expanded')) === 'false',
    'Unmatched pill shows its tooltip on hover, inside the viewport, and a click leaves the row collapsed')
  await page.mouse.move(0, 0)
  await row('Nov 03 · Stripe payout').focus()
  await page.keyboard.press('Tab')
  const focused = (await tip.textContent()) === 'The system found a match. Review the details to confirm it.'
  await page.keyboard.press('Escape')
  check(focused && (await tip.count()) === 0, 'Auto-matched pill shows its tooltip on keyboard focus and Escape hides it')
}

// Confirm a suggestion, Undo it, confirm it again.
await open('Nov 04 · ACH NORTH')
await detail().getByRole('button', { name: 'Confirm match' }).click()
check((await tabCount('Confirmed')) === 2 && (await metricHas('Cleared balance', '$97,600.00')), 'Confirm match moves ACH NORTH to Confirmed')
check((await page.getByRole('columnheader', { name: 'Action', exact: true }).count()) === 0, 'The table has no Action column')
await open('Nov 04 · ACH NORTH')
await detail().getByRole('button', { name: 'Undo' }).click()
check((await tabCount('Confirmed')) === 0 && (await metricHas('Cleared balance', '$100,000.00')), 'Undo in the expanded row reverses the match')
await open('Nov 04 · ACH NORTH')
await detail().getByRole('button', { name: 'Confirm match' }).click()
await open('Nov 12 · DELTA PAY')
await detail().getByRole('button', { name: 'Confirm match' }).click()

// Dismiss the wrong suggestion, then search for the right entries.
await open('Nov 18 · ALDER SUPPLY')
await detail().getByRole('button', { name: 'Dismiss suggestion' }).click()
check(await page.getByText('Suggestion dismissed', { exact: true }).isVisible(), 'Dismiss suggestion shows the dismissed notice')
const combo = detail().getByRole('combobox')
await combo.click()
check((await detail().getByRole('option').count()) === 10, 'Search lists all 10 still-unmatched ledger entries')
await combo.fill('12,500')
await combo.press('ArrowDown')
await combo.press('Enter')
await detail().getByRole('button', { name: 'Confirm match' }).click()
check((await detail().getByText(/amounts differ/).count()) > 0 && (await tabCount('Confirmed')) === 4, 'Confirm refuses an entry with a different amount')
await combo.click()
await combo.fill('alder')
await combo.press('ArrowDown')
await combo.press('Enter')
check(await page.getByText('Selected ledger entry', { exact: true }).isVisible(), 'Search by keyword selects GL-1107 with the keyboard')
await detail().getByRole('button', { name: 'Confirm match' }).click()
await open('Nov 20 · BIRCH STUDIO')
await detail().getByRole('combobox').fill('11/19')
check((await detail().getByRole('option').count()) === 1, 'Search by date finds GL-1108')
await detail().getByRole('combobox').fill('-450')
await page.getByRole('option', { name: /GL-1108/ }).click()
await detail().getByRole('button', { name: 'Confirm match' }).click()
check((await tabCount('Confirmed')) === 8, `Four matches confirmed (Confirmed ${await tabCount('Confirmed')})`)

// Save and reload mid-way.
await page.reload({ waitUntil: 'networkidle' })
check((await tabCount('Confirmed')) === 8 && (await tabCount('Suggested')) === 0, 'Progress survives a reload')

// Create the three missing expenses; the first submit is rejected without a category.
const expenses = [
  ['Monthly bank service fee', 'GL-1115'],
  ['Outgoing wire fee', 'GL-1116'],
  ['Account service charge', 'GL-1117'],
]
for (const [i, [name, entry]] of expenses.entries()) {
  await open(name)
  await detail().getByRole('button', { name: 'Create entry…' }).click()
  if (i === 0) {
    await detail().getByRole('button', { name: 'Create and match' }).click()
    check(await detail().getByText('Choose the expense category that records this cost.', { exact: true }).isVisible(), 'Create without a category shows a field error')
  }
  await pick(detail(), 'Expense category', 'Bank Fees')
  await detail().getByRole('button', { name: 'Create and match' }).click()
  check((await page.getByText(entry).count()) > 0, `Create expense: ${name} → ${entry}`)
}
check(await metricHas('Book balance', '$109,850.00'), 'Book balance drops to $109,850.00')

// Document the three outstanding items; unrelated evidence is rejected first.
const outstanding = [
  ['Check 1042 · Riverside Janitorial', 'Outstanding check', /CHECK 1042 PAID/],
  ['Deposit DEP-1130', 'Deposit in transit', /DEPOSIT DEP-1130/],
  ['Transfer TR-1130', 'Outstanding transfer or withdrawal', /TR-1130/],
]
for (const [i, [name, category, evidence]] of outstanding.entries()) {
  await open(name)
  const d = detail()
  await pick(d, 'Timing category', category)
  if (i === 0) {
    await pick(d, 'Evidence: later bank activity', /CHECK 1047 PAID/)
    await d.getByLabel('Explanation').fill('Check mailed Nov 28, cleared in December.')
    await d.getByRole('button', { name: 'Document as outstanding' }).last().click()
    check((await tabCount('Outstanding')) === 0, 'Unrelated evidence (CHECK 1047) is rejected')
  }
  await pick(d, 'Evidence: later bank activity', evidence)
  await d.getByLabel('Explanation').fill('Cleared in early December; timing difference only.')
  await d.getByRole('button', { name: 'Document as outstanding' }).last().click()
  check((await tabCount('Outstanding')) === i + 1, `Outstanding evidence: ${name}`)
}

// Review the auto-matched pairs.
await tab('Auto-matched').click()
for (const name of ['Nov 03 · Stripe payout', 'Nov 08 · Acme payment', 'Nov 10 · AWS', 'Nov 15 · Gusto payroll', 'Nov 22 · Figma subscription']) {
  await open(name)
  await detail().getByRole('button', { name: 'Confirm match' }).click()
}
await tab('All').click()

// Complete, export, reopen, reload.
const final = async () =>
  (await tabCount('Confirmed')) === 21 &&
  (await tabCount('Outstanding')) === 3 &&
  (await tabCount('Unmatched')) === 0 &&
  (await metricHas('Cleared balance', '$109,650.00')) &&
  (await metricHas('Remaining difference', '$0.00'))
check(await final(), `Before completing: ${await tabCount('Confirmed')} Confirmed, ${await tabCount('Outstanding')} Outstanding, difference ${await metricValue('Remaining difference')}`)
await page.getByRole('button', { name: 'Complete reconciliation' }).click()
check(await page.getByText('Completed', { exact: true }).isVisible(), 'Complete reconciliation shows Completed')
const summary = page.getByRole('region', { name: 'Reconciliation summary' })
check((await summary.textContent()).includes('21 of 24 records') && (await summary.textContent()).includes('3 of 24 records'), 'Summary lists 21 Confirmed and 3 Outstanding')
const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download summary' }).click()])
const csv = readFileSync(await download.path(), 'utf8')
check(
  download.suggestedFilename() === 'campfire-reconciliation-2025-11.csv' &&
    csv.includes('Remaining difference,0.00') &&
    csv.includes('Confirmed records,21') &&
    csv.includes('Outstanding records,3') &&
    csv.includes('Status: Completed'),
  `CSV export ${download.suggestedFilename()} has 21 / 3 / 0.00`,
)
await page.reload({ waitUntil: 'networkidle' })
check(await page.getByText('Completed', { exact: true }).isVisible(), 'Completed state survives a reload')
await page.getByRole('button', { name: 'Reopen reconciliation' }).click()
check((await page.getByText('In progress', { exact: true }).isVisible()) && (await final()), 'Reopen keeps 21 / 3 / $0.00 and allows editing')
await page.getByRole('button', { name: 'Complete reconciliation' }).click()
check(await final(), 'Completed again: 21 Confirmed, 3 Outstanding, $0.00 difference')

// Reset.
await page.getByRole('button', { name: 'Reset demo' }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Reset demo' }).click()
check((await tabCount('Confirmed')) === 0 && (await tabCount('Unmatched')) === 8 && (await metricHas('Remaining difference', '$320.00')), 'Reset demo restores the original data')
await page.reload({ waitUntil: 'networkidle' })
check((await tabCount('Confirmed')) === 0, 'Reset survives a reload')
check(page.problems.length === 0, `No errors during the flow${page.problems.length ? `: ${page.problems.join('; ')}` : ''}`)

const version = browser.version()
await browser.close()
console.log(`\n${engine} ${version}: ${failures ? `${failures} check(s) failed` : 'all checks passed'}`)
process.exit(failures ? 1 : 0)
