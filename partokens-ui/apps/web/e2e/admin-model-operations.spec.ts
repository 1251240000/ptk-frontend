import { expect, test, type Page } from '@playwright/test'
import type { AdminModelTestResult, AdminModelTestTask } from '@partokens/api-client'

import { installMockApi } from './mock-api'

const longModel = 'provider/very-long-model-name-with-a-2026-09-10-preview-version'
const models = ['good', 'retired', 'timeout', 'limited', 'auth', longModel]
const result = (model: string, status: AdminModelTestResult['status']): AdminModelTestResult => ({ model_id: model, name: model, status, latency_ms: status === 'available' ? 0 : null, tested_at: Date.now() / 1000, error: status === 'unavailable' ? '模型不存在或渠道不支持' : null })

async function setup(page: Page, options: { delayStart?: boolean } = {}) {
  await installMockApi(page, { role: 100 })
  let configured = [...models]
  let results = models.map((model, index) => result(model, (['available', 'unavailable', 'timeout', 'rate_limited', 'unauthorized', 'untested'] as const)[index]!))
  let task: AdminModelTestTask | null = null
  let serial = 0
  let finish = false
  let stale = false
  let failRemoval = true
  let failCancel = true
  let changes: Record<string, unknown>[] = []
  const requests: Array<{ path: string; body: Record<string, unknown> }> = []
  const preview = (removed: string[] = ['retired']) => ({
    logical_id: 'lc_models', logical_name: '模型测试渠道', remove_models: removed, retain_models: configured.filter((model) => !removed.includes(model)), latest_test_id: task?.id ?? 'mt_old', preview_token: 'a'.repeat(64),
    physical_records: [{ channel_id: 10, kind: 'template', name: '模型测试渠道', before_models: configured, after_models: configured.filter((model) => !removed.includes(model)), mapping_changed: true }],
    modifies_models: true, modifies_model_mapping: true, failure_reasons: removed.map((model) => ({ model, reason: results.find((item) => item.model_id === model)?.error || '模型测试异常' })), expected_steps: 2,
    steps: [{ action: 'update_models', label: '更新模型清单', payload: {}, status: 'pending' }, { action: 'verify_final', label: '重新读取并核对配置', payload: {}, status: 'pending' }],
  })
  await page.route('**/admin-api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const body = route.request().postData() ? route.request().postDataJSON() : {}
    if (route.request().method() === 'POST') requests.push({ path, body })
    let data: unknown = {}
    if (path.endsWith('/bootstrap')) data = {
      channels: [{ id: 'lc_models', name: '模型测试渠道', channel_type: 1, base_url: 'https://api.example.test', cost_ratio: 1.125, models: configured, masked_key: 'sk-abc.....abcd', enabled: true, state: 'active', status: 'partial', groups: 0, attempt_layers: 0, record_count: 1, physical_records: [], latest_model_results: results, latest_model_test: task }],
      routes: [], groups: ['default'], changes, monitor: null, retry_times: 2,
    }
    else if (path.endsWith('/models/discover')) data = { status: 'success', models: [...models, 'discovered'].map((id) => ({ id, name: id })), fetched_at: Date.now() / 1000 }
    else if (path.endsWith('/update/preview')) data = { ...preview(), add_models: body.models, remove_models: [], retain_models: [...configured, ...body.models], failure_reasons: [] }
    else if (path.endsWith('/update/execute')) {
      configured = [...new Set([...configured, ...body.models])]
      data = { id: 'chg_update', kind: 'model_update', status: 'success', target: 'lc_models', plan: {}, steps: [] }
    }
    else if (path.endsWith('/models/test')) {
      if (options.delayStart) await new Promise((resolve) => setTimeout(resolve, 1500))
      const requested = body.models as string[]
      task = { id: `mt_${++serial}`, logical_id: 'lc_models', status: 'running', total: requested.length, completed: 0, progress: 0, available_count: 0, failed_count: 0, cancel_requested: false, results: requested.map((model) => result(model, 'untested')), created_at: Date.now() / 1000, updated_at: Date.now() / 1000 }
      data = task
    } else if (path.endsWith('/cancel')) {
      if (failCancel) return route.fulfill({ status: 503, json: { success: false, message: '取消测试失败' } })
      task = { ...task!, status: 'cancelled', cancel_requested: true }
      data = task
    } else if (path.includes('/model-tests/')) {
      if (finish && task?.status === 'running') {
        const tested = task.results.map((item) => result(item.model_id, item.model_id === 'retired' ? 'unavailable' : 'available'))
        task = { ...task, status: tested.some((item) => item.status === 'unavailable') ? 'partial' : 'success', results: tested, completed: task.total, progress: 100, available_count: tested.filter((item) => item.status === 'available').length, failed_count: tested.filter((item) => item.status !== 'available').length }
        results = [...results.filter((item) => !tested.some((next) => next.model_id === item.model_id)), ...tested]
      }
      data = task
    } else if (path.endsWith('/remove/preview')) data = preview(body.models)
    else if (path.endsWith('/remove/execute')) {
      if (stale) return route.fulfill({ status: 409, json: { success: false, message: '移除预览已过期，请重新预览并确认' } })
      const plan = preview(body.models)
      const change = { id: 'chg_removal', kind: 'model_remove', target: 'lc_models', status: failRemoval ? 'partial' : 'success', plan, steps: plan.steps, error: failRemoval ? '渠道连接失败' : null }
      changes = [change]
      if (!failRemoval) configured = configured.filter((model) => !plan.remove_models.includes(model))
      data = change
    }
    await route.fulfill({ json: { success: true, data } })
  })
  await page.goto('/zh-CN/console/admin/channels')
  await page.locator('[data-model-status]').first().click()
  await expect(page.getByRole('table', { name: '模型配置列表' })).toBeVisible()
  return { requests, interrupt: () => {
    const tested = result(task!.results[0]!.model_id, 'available')
    task = { ...task!, status: 'partial', completed: 1, progress: Math.round(100 / task!.total), available_count: 1, failed_count: 0, results: [tested, ...task!.results.slice(1).map((item) => ({ ...item, status: 'untested' as const, tested_at: null, latency_ms: null, error: '管理员服务重启，模型尚未完成测试' }))] }
  }, finish: () => { finish = true }, stale: (value: boolean) => { stale = value }, retry: () => { failRemoval = false }, allowCancel: () => { failCancel = false } }
}

test('interrupted batch preserves untested models and incomplete progress', async ({ page }) => {
  const mock = await setup(page)
  await page.getByRole('button', { name: '批量测试 (6)', exact: true }).click()
  await expect(page.getByRole('button', { name: '取消测试', exact: true })).toBeVisible()
  mock.interrupt()
  await expect(page.getByText('已中断', { exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '17')
  await expect(page.locator('[data-model-row="good"]')).toContainText('可用')
  const unfinished = page.locator('[data-model-row="retired"]')
  await expect(unfinished).toContainText('未测试')
  await expect(unfinished).toContainText('管理员服务重启，模型尚未完成测试')
  await expect(unfinished.getByRole('button').last()).toBeDisabled()
  await expect(page.getByText('测试进度：1/6 · 可用 1 · 异常 0')).toBeVisible()
})

test('model list supports inline tests, cancellation, confirmed removal and partial retry', async ({ page }) => {
  const mock = await setup(page)
  const row = (model: string) => page.locator(`[data-model-row="${model}"]`)
  await expect(row('good')).toContainText('0 ms')
  for (const model of ['retired', 'timeout', 'limited', 'auth']) await expect(page.getByRole('button', { name: `移除 ${model}`, exact: true })).toBeEnabled()
  for (const model of ['good', longModel]) await expect(row(model).getByRole('button').last()).toBeDisabled()
  await page.getByRole('button', { name: '获取模型', exact: true }).click()
  await expect(row('discovered')).toBeVisible()
  await page.getByRole('button', { name: `测试 ${longModel}`, exact: true }).click()
  expect(mock.requests.at(-1)?.body.models).toEqual([longModel])
  await expect(row(longModel)).toContainText('测试中')
  await page.getByRole('button', { name: '取消测试', exact: true }).click()
  await expect(page.getByText('取消测试失败', { exact: true })).toBeVisible()
  mock.allowCancel()
  await page.getByRole('button', { name: '取消测试', exact: true }).click()
  await expect(page.getByText('已取消', { exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: '选择当前筛选模型' }).uncheck()
  await page.getByRole('checkbox', { name: '选择 good', exact: true }).click()
  await page.getByRole('checkbox', { name: '选择 retired', exact: true }).click()
  await page.getByRole('button', { name: '批量测试 (2)', exact: true }).click()
  mock.finish()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  await expect(row('retired')).toContainText('异常')
  await expect(page.getByRole('checkbox', { name: '选择 timeout', exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: '重试 good', exact: true }).click()
  await expect(row('good')).toContainText('可用')
  await expect(page.getByRole('button', { name: '移除 retired', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '移除 retired', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '移除不可用模型', exact: true })
  await expect(dialog).toContainText('模型不存在或渠道不支持')
  await expect(dialog).toContainText('将移除 1 个')
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  expect(mock.requests.filter((item) => item.path.endsWith('/execute'))).toHaveLength(0)
  await page.getByRole('button', { name: '移除不可用模型 (4)' }).click()
  expect(mock.requests.filter((item) => item.path.endsWith('/remove/preview')).at(-1)?.body.models).toEqual(['retired', 'timeout', 'limited', 'auth'])
  await expect(dialog).toContainText('将移除 4 个，保留 2 个模型')
  mock.stale(true)
  await dialog.getByRole('button', { name: '确认移除' }).click()
  await expect(dialog.getByRole('alert')).toContainText('预览已过期')
  await expect(dialog.getByRole('button', { name: '确认移除' })).toBeDisabled()
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  mock.stale(false)
  await page.getByRole('button', { name: '移除不可用模型 (4)' }).click()
  await dialog.getByRole('button', { name: '确认移除' }).click()
  await expect(dialog.getByRole('status')).toContainText('移除部分完成')
  expect(mock.requests.filter((item) => item.path.endsWith('/execute')).at(-1)?.body.preview_token).toBe('a'.repeat(64))
  await expect(row('retired')).toHaveCount(1)
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'retired：异常，配置模型', exact: true })).toBeVisible()
  await page.locator('[data-model-status]').first().click()
  await page.getByRole('button', { name: '继续移除', exact: true }).click()
  mock.retry()
  await dialog.getByRole('button', { name: '重试未完成步骤' }).click()
  await expect(dialog).not.toBeVisible()
  expect(mock.requests.filter((item) => item.path.endsWith('/execute')).at(-1)?.body.change_id).toBe('chg_removal')
  await expect(row('retired')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'retired：异常，配置模型', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'auth：异常，配置模型', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'good：可用，配置模型', exact: true })).toBeVisible()
})

test('batch tests show submission, running filters, reopen progress and final states', async ({ page }) => {
  const mock = await setup(page, { delayStart: true })
  await page.getByRole('button', { name: `批量测试 (${models.length})`, exact: true }).click()
  await expect(page.getByText(`测试中 · 正在提交 ${models.length} 个模型`)).toBeVisible()
  for (const model of models) await expect(page.locator(`[data-model-row="${model}"]`)).toContainText('测试中')
  await expect(page.getByRole('button', { name: '取消测试', exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: '模型状态筛选' }).click()
  await expect(page.getByRole('option')).toHaveText(['全部模型', '未测试', '测试中', '异常', '可用'])
  await page.getByRole('option', { name: '测试中', exact: true }).click()
  await expect(page.locator('[data-model-row]')).toHaveCount(models.length)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'good：测试中，配置模型', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'good：测试中，配置模型', exact: true }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  mock.finish()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  await expect(page.locator('[data-model-row="good"]')).toContainText('可用')
  await expect(page.locator('[data-model-row="retired"]')).toContainText('异常')
  await expect(page.getByRole('button', { name: `批量测试 (${models.length})`, exact: true })).toBeEnabled()
})

test('discovered models require confirmation to update and removal ignores checkbox selection', async ({ page }) => {
  const mock = await setup(page)
  await page.getByRole('checkbox', { name: '选择当前筛选模型' }).uncheck()
  await page.getByRole('button', { name: '移除不可用模型 (4)', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '移除不可用模型', exact: true })).toBeVisible()
  expect(mock.requests.at(-1)?.body.models).toEqual(['retired', 'timeout', 'limited', 'auth'])
  await page.getByRole('dialog', { name: '移除不可用模型', exact: true }).getByRole('button', { name: '取消' }).click()
  await page.getByRole('button', { name: '获取模型', exact: true }).click()
  await page.getByRole('button', { name: '确认更新模型 (1)', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '确认更新模型', exact: true })
  await expect(dialog).toContainText('discovered')
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  expect(mock.requests.filter((item) => item.path.endsWith('/update/execute'))).toHaveLength(0)
  await page.getByRole('button', { name: '确认更新模型 (1)', exact: true }).click()
  await dialog.getByRole('button', { name: '确认更新', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('[data-model-row="discovered"]')).not.toContainText('未配置')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'discovered：未测试，配置模型', exact: true })).toBeVisible()
})

test('model checkboxes distinguish checked, mixed and unchecked states in both themes', async ({ page }) => {
  await setup(page)
  const all = page.getByRole('checkbox', { name: '选择当前筛选模型' })
  const first = page.getByRole('checkbox', { name: '选择 good', exact: true })
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value }, theme)
    await all.check()
    await expect(all.locator('.lucide-check')).toBeVisible()
    await first.uncheck()
    await expect(all).toHaveAttribute('aria-checked', 'mixed')
    await expect(all.locator('.lucide-minus')).toBeVisible()
    await expect(all.locator('.lucide-check')).not.toBeVisible()
    await expect(first.locator('[data-slot="checkbox-indicator"]')).toHaveCount(0)
    const contrasts = await page.getByRole('table', { name: '模型配置列表' }).locator('[data-slot="checkbox"]:not([data-state="unchecked"])').evaluateAll((elements) => elements.map((element) => {
      const context = document.createElement('canvas').getContext('2d')!
      const luminance = (color: string) => {
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
        const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map((channel) => {
          const value = channel / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
      }
      const background = luminance(getComputedStyle(element).backgroundColor)
      const foreground = luminance(getComputedStyle(element.querySelector('[data-slot="checkbox-indicator"]')!).color)
      return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05)
    }))
    expect(contrasts.length).toBe(models.length)
    expect(contrasts.every((contrast) => contrast >= 3)).toBe(true)
    await all.click()
    await expect(first).toBeChecked()
    await all.uncheck()
    await expect(page.getByRole('table', { name: '模型配置列表' }).locator('[aria-checked="true"]')).toHaveCount(0)
  }
})

test('model list and confirmation fit desktop and narrow mobile in both themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await setup(page)
  const root = process.env.PARTOKENS_E2E_OUTPUT_DIR || '../../dogfood-output/2026-09-10-channel-models'
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 })
    const backgrounds: string[] = []
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => { document.documentElement.dataset.theme = value; document.documentElement.classList.toggle('dark', value === 'dark') }, theme)
      const panel = page.getByRole('dialog').first()
      await expect(panel).toBeVisible()
      await panel.evaluate(async (element) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished))
      })
      backgrounds.push(await panel.evaluate((element) => getComputedStyle(element).backgroundColor))
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      const bounds = await page.locator('[data-model-row]').evaluateAll((rows) => rows.map((row) => {
        const model = row.children[1]!.getBoundingClientRect()
        const actions = row.lastElementChild!.getBoundingClientRect()
        return model.right <= actions.left
      }))
      expect(bounds.every(Boolean)).toBe(true)
      await page.screenshot({ path: `${root}/models-${width}-${theme}.png` })
    }
    expect(backgrounds[0]).not.toBe(backgrounds[1])
    await page.getByRole('button', { name: '移除 retired', exact: true }).click()
    const confirmation = page.getByRole('dialog', { name: '移除不可用模型', exact: true })
    await confirmation.getByText('配置影响与执行步骤', { exact: true }).click()
    await expect(confirmation.getByRole('button', { name: '确认移除' })).toBeInViewport()
    const rect = await confirmation.boundingBox()
    expect(rect!.y).toBeGreaterThanOrEqual(0)
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
    expect(await confirmation.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.screenshot({ path: `${root}/confirmation-${width}.png` })
    await confirmation.getByRole('button', { name: '取消', exact: true }).click()
  }
})
