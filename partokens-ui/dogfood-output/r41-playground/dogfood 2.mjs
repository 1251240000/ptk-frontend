import playwright from '../../node_modules/.bun/playwright@1.61.1/node_modules/playwright/index.js'
import { mkdir } from 'node:fs/promises'

const { chromium } = playwright

const base = 'http://127.0.0.1:4180/#console-playground'
const output = new URL('./screenshots/', import.meta.url).pathname
await mkdir(output, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const results = []

for (const config of [
  { name: 'desktop-light', width: 1440, height: 1000 },
  { name: 'desktop-dark', width: 1440, height: 1000, theme: 'dark' },
  { name: 'tablet-light', width: 1024, height: 900 },
  { name: 'mobile-light', width: 390, height: 844 },
  { name: 'mobile-dark', width: 390, height: 844, theme: 'dark' },
  { name: 'mobile-320-light', width: 320, height: 760 },
]) {
  const context = await browser.newContext({ viewport: { width: config.width, height: config.height } })
  const page = await context.newPage()
  if (config.theme) await page.addInitScript((theme) => localStorage.setItem('partokens-theme', theme), config.theme)
  await page.route('**/api/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{"version":"dogfood"}}' }))
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.getByText('Local IndexedDB').first().waitFor({ timeout: 8000 }).catch(async () => {
    console.error(JSON.stringify({ config, errors, text: (await page.locator('body').innerText()).slice(0, 3000) }, null, 2))
    await page.screenshot({ path: `${output}${config.name}-load-failure.png`, fullPage: true })
    throw new Error(`Playground did not load at ${config.width}px`)
  })
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    bodyClass: document.body.className,
  }))
  await page.screenshot({ path: `${output}${config.name}.png`, fullPage: true })
  results.push({ ...config, ...metrics, errors })
  await context.close()
}

console.log(JSON.stringify(results, null, 2))
await browser.close()
