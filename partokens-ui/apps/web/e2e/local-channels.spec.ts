import { expect, test } from '@playwright/test'
import { installMockApi } from './mock-api'

const api = 'http://127.0.0.1:8083'
const headers = { Authorization: 'Bearer root-token' }

test('edit credentials, rebuild routes, and keep secrets out of browser storage', async ({ page }) => {
  await page.request.post(`${api}/__test/reset`)
  await installMockApi(page, { role: 100 })
  await page.route('**/admin-api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/admin-api', '')
    const response = await route.fetch({ url: `${api}${path}`, headers: { ...route.request().headers(), ...headers } })
    await route.fulfill({ response })
  })
  await page.goto('/zh-CN/console/admin/channels')
  await expect(page.getByText('渠道 A', { exact: true }).first()).toBeVisible()
  await page.getByRole('row').filter({ has: page.getByText('渠道 A', { exact: true }) }).getByRole('button', { name: '编辑渠道', exact: true }).click()
  await page.getByLabel('API 密钥', { exact: true }).fill('fake-e2e-replacement-credential')
  await page.getByRole('button', { name: '保存配置', exact: true }).click()
  await expect(page.getByText('渠道配置已保存，请核对关联分组路由')).toBeVisible()
  const bootstrap = await page.request.get(`${api}/v1/bootstrap`, { headers })
  const body = await bootstrap.text()
  expect(body).not.toContain('fake-e2e-replacement-credential')
  expect(body).not.toContain('template_channel_id')
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))
  expect(storage).not.toContain('fake-e2e-replacement-credential')
  await page.goto('/zh-CN/console/admin/routes')
  await page.getByRole('button', { name: '配置 plus', exact: true }).click()
  await page.getByRole('button', { name: '重建执行渠道', exact: true }).click()
  await page.getByRole('button', { name: '确认保存', exact: true }).click()
  await expect(page.getByRole('button', { name: '完成', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '完成', exact: true }).click()
  await page.screenshot({ path: '/tmp/partokens-local-channels/routes-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '/tmp/partokens-local-channels/routes-mobile.png' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
})
