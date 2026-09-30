import { expect, test } from '@playwright/test'
import { installMockApi } from './mock-api'

const backend = 'http://127.0.0.1:8091'
test.beforeEach(async ({ page }) => {
  await page.request.post(`${backend}/__test/reset`)
  await installMockApi(page, { role: 100 })
  await page.route('**/admin-api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/admin-api', '')
    const response = await route.fetch({ url: `${backend}${path}${new URL(route.request().url()).search}`, headers: { ...route.request().headers(), Authorization: 'Bearer root-token' } })
    await route.fulfill({ response })
  })
  await page.goto('/zh-CN/console/admin/monitoring')
  await expect(page.getByRole('heading', { name: '渠道监控', exact: true })).toBeVisible()
  await expect(page.getByRole('table', { name: '近期实际请求' }).getByRole('row')).toHaveCount(61)
})

test('channel, model and period filters read real admin traffic aggregates', async ({ page }) => {
  await expect(page.getByText('最近 60 条', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '近 6 小时', exact: true }).click()
  await expect(page.getByText('最近 14 条', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '查看 gpt-4o 的请求', exact: true }).click()
  await expect(page.getByRole('table', { name: '模型访问汇总' })).toHaveCount(0)
  await expect(page.getByText('最近 8 条', { exact: true })).toBeVisible()
  await expect(page.getByRole('table', { name: '近期实际请求' }).getByRole('row')).toHaveCount(9)
  await page.getByRole('button', { name: '近 7 天', exact: true }).click()
  await expect(page.getByText('最近 60 条', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: '渠道', exact: true }).click()
  await page.getByRole('option', { name: '停用渠道', exact: true }).click()
  await expect(page.getByText('所选渠道与模型在此周期内没有实际请求。')).toBeVisible()
  await expect(page.getByRole('table', { name: '模型访问汇总' })).toBeVisible()
  await page.getByRole('button', { name: '刷新', exact: true }).click()
  await expect(page.getByRole('button', { name: '刷新', exact: true })).toBeEnabled()
})

test('charts, long names and both themes fit desktop and mobile', async ({ page }) => {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => { document.documentElement.dataset.theme = value; document.documentElement.classList.toggle('dark', value === 'dark') }, theme)
      for (const name of ['首字延迟趋势图', '缓存命中率趋势图', '请求成功率趋势图']) {
        const chart = page.getByRole('img', { name, exact: true })
        await expect(chart).toBeVisible()
        expect(await chart.locator('circle').count()).toBeGreaterThan(0)
        const box = await chart.boundingBox()
        expect(box!.width).toBeGreaterThan(100)
        expect(box!.height).toBe(180)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      for (const label of ['渠道', '模型']) {
        expect((await page.getByRole('combobox', { name: label, exact: true }).boundingBox())!.width).toBeGreaterThan(100)
      }
      await page.screenshot({ path: `/tmp/partokens-channel-monitoring/monitoring-${width}-${theme}.png`, fullPage: true })
    }
  }
  await page.getByRole('combobox', { name: '渠道', exact: true }).click()
  await page.getByRole('option', { name: 'long-channel-name-'.repeat(4), exact: true }).click()
  await expect(page.getByText('所选渠道与模型在此周期内没有实际请求。')).toBeVisible()
  await page.getByRole('combobox', { name: '模型', exact: true }).click()
  await page.getByRole('option', { name: 'long-model-name-159', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: '/tmp/partokens-channel-monitoring/monitoring-long-names-mobile.png', fullPage: true })
})

test('errors are visible and retry restores actual traffic', async ({ page }) => {
  await page.route('**/admin-api/v1/monitor/channels/**', (route) => route.fulfill({ status: 502, json: { success: false, message: 'new-api request timed out' } }))
  await page.getByRole('button', { name: '近 6 小时', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: '渠道请求数据读取失败' })).toBeVisible()
  await page.unroute('**/admin-api/v1/monitor/channels/**')
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(page.getByText('最近 14 条', { exact: true })).toBeVisible()
})
