import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import playwright from '../../node_modules/.bun/playwright@1.61.1/node_modules/playwright/index.js'

const { chromium } = playwright
const app = 'http://127.0.0.1:4180/'
const screenshots = new URL('./screenshots/', import.meta.url).pathname
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const checks = []

function pass(name, detail = '') {
  checks.push({ name, result: 'passed', detail })
}

function instrument(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  return errors
}

async function stubStatus(page) {
  await page.route('**/api/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{"version":"dogfood"}}' }))
}

const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] })
const page = await context.newPage()
const desktopErrors = instrument(page)
await stubStatus(page)
await page.goto(`${app}#console-playground`, { waitUntil: 'networkidle' })
await page.getByText('Local IndexedDB').first().waitFor()

await page.getByRole('button', { name: 'More Playground actions' }).click()
await page.getByRole('menuitem', { name: 'Local data' }).click()
await page.getByRole('button', { name: 'Clear all' }).click()
assert.equal(await page.locator('[role="dialog"]').count(), 1)
await page.getByRole('button', { name: 'Clear all' }).click()
await page.getByText('No conversations yet').waitFor()
await page.reload({ waitUntil: 'networkidle' })
await page.getByText('No conversations yet').waitFor()
assert.equal(await page.getByRole('button', { name: 'Send' }).isDisabled(), true)
await page.getByRole('button', { name: 'More Playground actions' }).click()
await page.getByRole('menuitem', { name: 'Local data' }).click()
assert.equal(await page.getByRole('button', { name: 'Export' }).isDisabled(), true)
await page.getByRole('button', { name: 'Close' }).last().click()
await page.locator('[role="dialog"]').waitFor({ state: 'detached' })
pass('Clear all persists after reload')
pass('Empty-input send and empty-data export are disabled')

await page.getByRole('button', { name: 'New chat' }).click()
await page.getByLabel('Model').click()
await page.getByRole('option', { name: 'claude-3.7-sonnet' }).click()
await page.getByLabel('Group').click()
await page.getByRole('option', { name: 'trial' }).click()
await page.getByRole('button', { name: 'Generation parameters' }).click()
await page.locator('#max-tokens').fill('2048')
await page.locator('#seed').fill('42')
await page.locator('#parameter-temperature').fill('0.4')
await page.getByRole('switch', { name: 'Streaming' }).click()
await page.getByRole('button', { name: 'Save parameters' }).click()
pass('Model, group, and parameters editable')

const composer = page.getByRole('textbox', { name: 'Message', exact: true })
await composer.fill('Line one')
await composer.press('Shift+Enter')
assert.ok((await composer.inputValue()).includes('\n'))
assert.equal(await page.locator('article').count(), 0)
await composer.fill('IME draft')
await composer.evaluate((element) => element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })))
assert.equal(await page.locator('article').count(), 0)
await composer.fill('Persistent launch plan')
await composer.press('Enter')
await page.waitForTimeout(100)
await page.reload({ waitUntil: 'networkidle' })
await page.locator('article').filter({ hasText: 'Persistent launch plan' }).waitFor()
await page.getByText('Stopped', { exact: true }).waitFor()
assert.equal(await page.getByLabel('Conversation name').inputValue(), 'Persistent launch plan')
assert.equal(await page.getByLabel('Model').textContent().then((text) => text?.includes('claude-3.7-sonnet')), true)
assert.equal(await page.getByLabel('Group').textContent().then((text) => text?.includes('trial')), true)
await page.getByRole('button', { name: 'Generation parameters' }).click()
assert.equal(await page.locator('#max-tokens').inputValue(), '2048')
assert.equal(await page.locator('#seed').inputValue(), '42')
assert.equal(await page.locator('#parameter-temperature').inputValue(), '0.4')
assert.equal(await page.getByRole('switch', { name: 'Streaming' }).getAttribute('data-state'), 'unchecked')
await page.getByRole('button', { name: 'Cancel' }).click()
await page.locator('[role="dialog"]').waitFor({ state: 'detached' })
pass('First message, automatic title, settings, and interrupted stream persist')
pass('Shift+Enter newline and IME composition do not submit')
await page.screenshot({ path: `${screenshots}stream-recovered.png`, fullPage: true })

await page.locator('article').filter({ hasText: 'Persistent launch plan' }).getByRole('button', { name: 'Copy message' }).click()
await page.getByText('Message copied').waitFor()
pass('Message copy with toast feedback')

const stoppedAssistant = page.locator('article').filter({ hasText: 'Stopped' })
await stoppedAssistant.getByRole('button', { name: 'Regenerate response' }).click()
await page.locator('article').filter({ hasText: 'Start with three gates' }).getByText('Complete', { exact: true }).waitFor()
pass('Regenerate stopped response')

const userMessage = page.locator('article').filter({ hasText: 'Persistent launch plan' })
await userMessage.getByRole('button', { name: 'Edit and regenerate' }).click()
await page.getByRole('textbox', { name: 'Message', exact: true }).last().fill('Edited launch plan')
await page.getByRole('button', { name: 'Save and regenerate' }).click()
await page.getByText('Edited launch plan', { exact: true }).waitFor()
await page.waitForTimeout(800)
pass('Edit and regenerate replaces following branch')

await page.getByRole('button', { name: 'Generation parameters' }).click()
await page.getByRole('switch', { name: 'Streaming' }).click()
await page.getByRole('button', { name: 'Save parameters' }).click()
await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Stop this generation')
await page.getByRole('textbox', { name: 'Message', exact: true }).press('Enter')
await page.getByRole('button', { name: 'Stop' }).click()
await page.getByText('Generation stopped').waitFor()
assert.ok(await page.getByText('Stopped', { exact: true }).count())
pass('Streaming can be stopped immediately')

const editedArticle = page.locator('article').filter({ hasText: 'Edited launch plan' })
await editedArticle.getByRole('button', { name: 'Delete message' }).click()
await page.getByRole('button', { name: 'Delete', exact: true }).click()
assert.equal(await page.getByText('Edited launch plan', { exact: true }).count(), 0)
pass('Message deletion')

await page.getByPlaceholder('Search conversations').fill('no-such-conversation')
await page.getByText('No matching conversations').waitFor()
await page.screenshot({ path: `${screenshots}search-empty.png`, fullPage: true })
await page.getByPlaceholder('Search conversations').fill('')
pass('Search no-results state')

await page.getByLabel('Conversation name').fill('Renamed durable chat')
await page.getByLabel('Conversation name').press('Enter')
await page.getByText('Conversation renamed').waitFor()
await page.reload({ waitUntil: 'networkidle' })
assert.equal(await page.getByLabel('Conversation name').inputValue(), 'Renamed durable chat')
pass('Rename persists after reload')

await page.getByRole('button', { name: 'More Playground actions' }).click()
await page.getByRole('menuitem', { name: 'Local data' }).click()
const downloadPromise = page.waitForEvent('download')
await page.getByRole('button', { name: 'Export' }).click()
const download = await downloadPromise
const downloadPath = await download.path()
assert.ok(downloadPath && existsSync(downloadPath))
await page.locator('input[type="file"]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad json') })
await page.getByText('This file does not contain valid Partokens conversations').waitFor()
await page.locator('input[type="file"]').setInputFiles(downloadPath)
await page.getByText('Import complete').waitFor()
await page.locator('[role="dialog"]').waitFor({ state: 'detached' })
pass('JSON export, valid import, and invalid import feedback')

await page.getByRole('button', { name: 'New chat' }).click()
await page.getByRole('button', { name: /^Delete New conversation/ }).click()
await page.getByRole('button', { name: 'Delete', exact: true }).click()
await page.waitForFunction(() => (document.querySelector('[aria-label="Conversation name"]'))?.value === 'Renamed durable chat')
assert.equal(await page.getByLabel('Conversation name').inputValue(), 'Renamed durable chat')
pass('Deleting the current conversation selects a recent fallback')

await page.getByRole('button', { name: 'More Playground actions' }).click()
await page.getByRole('menuitem', { name: 'Loading' }).click()
await page.getByLabel('Loading conversations').waitFor()
await page.screenshot({ path: `${screenshots}loading.png`, fullPage: true })
await page.getByRole('button', { name: 'More Playground actions' }).click()
await page.getByRole('menuitem', { name: 'Storage error' }).click()
await page.getByRole('alert').getByText('Could not read local conversations').waitFor()
await page.screenshot({ path: `${screenshots}storage-error.png`, fullPage: true })
await page.getByRole('button', { name: 'Retry' }).click()
await page.getByText('Local IndexedDB').first().waitFor()
pass('Loading and storage error with Retry')

await page.getByRole('button', { name: 'Change theme' }).click()
await page.getByRole('menuitem', { name: /^Dark/ }).click()
await page.locator('[role="menu"]').waitFor({ state: 'detached' })
await page.screenshot({ path: `${screenshots}desktop-dark.png`, fullPage: true })
pass('Desktop dark theme')
assert.deepEqual(desktopErrors, [])
pass('Desktop browser console', '0 errors')
await context.close()

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const mobile = await mobileContext.newPage()
const mobileErrors = instrument(mobile)
await stubStatus(mobile)
await mobile.goto(`${app}#console-playground`, { waitUntil: 'networkidle' })
await mobile.getByText('Local IndexedDB').first().waitFor()
const historyButton = mobile.getByRole('button', { name: 'Open conversation history' })
await historyButton.click()
assert.equal(await mobile.locator('[role="dialog"]').count(), 1)
assert.ok(await mobile.locator('[role="dialog"]').evaluate((dialog) => dialog.contains(document.activeElement)))
await mobile.keyboard.press('Escape')
await mobile.locator('[role="dialog"]').waitFor({ state: 'detached' })
assert.equal(await historyButton.evaluate((button) => button === document.activeElement), true)
pass('Mobile History Sheet Escape, focus trap, and focus return')

await historyButton.click()
await mobile.getByRole('button', { name: /^Delete API launch checklist/ }).click()
await mobile.waitForTimeout(100)
assert.ok(await mobile.locator('[role="dialog"]').count() <= 1)
await mobile.getByRole('dialog').getByText('Delete conversation').waitFor()
assert.equal(await mobile.locator('[role="dialog"]').count(), 1)
assert.ok(await mobile.getByRole('dialog').evaluate((dialog) => dialog.contains(document.activeElement)))
await mobile.waitForTimeout(400)
await mobile.screenshot({ path: `${screenshots}mobile-delete-handoff.png`, fullPage: true })
await mobile.keyboard.press('Escape')
await mobile.getByRole('dialog').waitFor({ state: 'detached' })
assert.equal(await historyButton.evaluate((button) => button === document.activeElement), true)
pass('Mobile Sheet-to-delete handoff keeps one modal and returns focus')

await mobile.getByRole('button', { name: 'Generation parameters' }).click()
assert.ok(await mobile.getByRole('dialog').getAttribute('data-slot') === 'sheet-content')
await mobile.waitForFunction(() => {
  const dialog = document.querySelector('[role="dialog"]')
  return dialog?.contains(document.activeElement)
})
await mobile.keyboard.press('Escape')
await mobile.getByRole('dialog').waitFor({ state: 'detached' })
assert.equal(await mobile.getByRole('button', { name: 'Generation parameters' }).evaluate((button) => button === document.activeElement), true)
pass('Mobile complex overlay uses Sheet with focus return')

await mobile.getByRole('button', { name: 'Change theme' }).click()
await mobile.getByRole('menuitem', { name: /^Dark/ }).click()
await mobile.locator('[role="menu"]').waitFor({ state: 'detached' })
await mobile.screenshot({ path: `${screenshots}mobile-dark.png`, fullPage: true })
const mobileMetrics = await mobile.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
assert.equal(mobileMetrics.scrollWidth, mobileMetrics.width)
assert.deepEqual(mobileErrors, [])
pass('390px mobile dark, no horizontal overflow, console 0 errors')
await mobileContext.close()

const routes = [
  ['system', 'Components'],
  ['console', 'Overview'],
  ['console-analytics', 'Analytics'],
  ['console-keys', 'API keys'],
  ['console-logs', 'Usage logs'],
  ['console-studio', null],
  ['console-wallet', null],
  ['home', 'Partokens'],
]
const routeContext = await browser.newContext({ viewport: { width: 1024, height: 800 } })
const routePage = await routeContext.newPage()
const routeErrors = instrument(routePage)
await stubStatus(routePage)
for (const [hash, expected] of routes) {
  await routePage.goto(`${app}#${hash}`, { waitUntil: 'networkidle' })
  const bodyText = await routePage.locator('body').innerText()
  assert.ok(bodyText.trim().length > 100, `${hash} rendered an empty page`)
  if (expected) assert.ok(bodyText.includes(expected), `${hash} did not render ${expected}`)
  assert.equal(routePage.url().endsWith(`#${hash}`), true)
}
assert.deepEqual(routeErrors, [])
pass('Required hash route regressions', routes.map(([hash]) => `#${hash}`).join(', '))
await routeContext.close()

await browser.close()
console.log(JSON.stringify(checks, null, 2))
