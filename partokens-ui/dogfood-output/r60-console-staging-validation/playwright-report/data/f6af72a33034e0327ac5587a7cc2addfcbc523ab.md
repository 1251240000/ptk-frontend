# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-model-operations.spec.ts >> discovered models require confirmation to update and removal ignores checkbox selection
- Location: e2e/admin-model-operations.spec.ts:178:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

Expected: ["retired", "timeout", "limited", "auth"]
Received: undefined
```

# Test source

```ts
  82  |   await expect(page.getByRole('button', { name: '取消测试', exact: true })).toBeVisible()
  83  |   mock.interrupt()
  84  |   await expect(page.getByText('已中断', { exact: true })).toBeVisible()
  85  |   await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '17')
  86  |   await expect(page.locator('[data-model-row="good"]')).toContainText('可用')
  87  |   const unfinished = page.locator('[data-model-row="retired"]')
  88  |   await expect(unfinished).toContainText('未测试')
  89  |   await expect(unfinished).toContainText('管理员服务重启，模型尚未完成测试')
  90  |   await expect(unfinished.getByRole('button').last()).toBeDisabled()
  91  |   await expect(page.getByText('测试进度：1/6 · 可用 1 · 异常 0')).toBeVisible()
  92  | })
  93  | 
  94  | test('model list supports inline tests, cancellation, confirmed removal and partial retry', async ({ page }) => {
  95  |   const mock = await setup(page)
  96  |   const row = (model: string) => page.locator(`[data-model-row="${model}"]`)
  97  |   await expect(row('good')).toContainText('0 ms')
  98  |   for (const model of ['retired', 'timeout', 'limited', 'auth']) await expect(page.getByRole('button', { name: `移除 ${model}`, exact: true })).toBeEnabled()
  99  |   for (const model of ['good', longModel]) await expect(row(model).getByRole('button').last()).toBeDisabled()
  100 |   await page.getByRole('button', { name: '获取模型', exact: true }).click()
  101 |   await expect(row('discovered')).toBeVisible()
  102 |   await page.getByRole('button', { name: `测试 ${longModel}`, exact: true }).click()
  103 |   expect(mock.requests.at(-1)?.body.models).toEqual([longModel])
  104 |   await expect(row(longModel)).toContainText('测试中')
  105 |   await page.getByRole('button', { name: '取消测试', exact: true }).click()
  106 |   await expect(page.getByText('取消测试失败', { exact: true })).toBeVisible()
  107 |   mock.allowCancel()
  108 |   await page.getByRole('button', { name: '取消测试', exact: true }).click()
  109 |   await expect(page.getByText('已取消', { exact: true })).toBeVisible()
  110 |   await page.getByRole('checkbox', { name: '选择当前筛选模型' }).uncheck()
  111 |   await page.getByRole('checkbox', { name: '选择 good', exact: true }).click()
  112 |   await page.getByRole('checkbox', { name: '选择 retired', exact: true }).click()
  113 |   await page.getByRole('button', { name: '批量测试 (2)', exact: true }).click()
  114 |   mock.finish()
  115 |   await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  116 |   await expect(row('retired')).toContainText('异常')
  117 |   await expect(page.getByRole('checkbox', { name: '选择 timeout', exact: true })).not.toBeChecked()
  118 |   await page.getByRole('button', { name: '重试 good', exact: true }).click()
  119 |   await expect(row('good')).toContainText('可用')
  120 |   await expect(page.getByRole('button', { name: '移除 retired', exact: true })).toBeEnabled()
  121 |   await page.getByRole('button', { name: '移除 retired', exact: true }).click()
  122 |   const dialog = page.getByRole('dialog', { name: '移除不可用模型', exact: true })
  123 |   await expect(dialog).toContainText('模型不存在或渠道不支持')
  124 |   await expect(dialog).toContainText('将移除 1 个')
  125 |   await dialog.getByRole('button', { name: '取消', exact: true }).click()
  126 |   expect(mock.requests.filter((item) => item.path.endsWith('/execute'))).toHaveLength(0)
  127 |   await page.getByRole('button', { name: '移除不可用模型 (4)' }).click()
  128 |   expect(mock.requests.filter((item) => item.path.endsWith('/remove/preview')).at(-1)?.body.models).toEqual(['retired', 'timeout', 'limited', 'auth'])
  129 |   await expect(dialog).toContainText('将移除 4 个，保留 2 个模型')
  130 |   mock.stale(true)
  131 |   await dialog.getByRole('button', { name: '确认移除' }).click()
  132 |   await expect(dialog.getByRole('alert')).toContainText('预览已过期')
  133 |   await expect(dialog.getByRole('button', { name: '确认移除' })).toBeDisabled()
  134 |   await dialog.getByRole('button', { name: '取消', exact: true }).click()
  135 |   mock.stale(false)
  136 |   await page.getByRole('button', { name: '移除不可用模型 (4)' }).click()
  137 |   await dialog.getByRole('button', { name: '确认移除' }).click()
  138 |   await expect(dialog.getByRole('status')).toContainText('移除部分完成')
  139 |   expect(mock.requests.filter((item) => item.path.endsWith('/execute')).at(-1)?.body.preview_token).toBe('a'.repeat(64))
  140 |   await expect(row('retired')).toHaveCount(1)
  141 |   await dialog.getByRole('button', { name: '取消', exact: true }).click()
  142 |   await page.keyboard.press('Escape')
  143 |   await expect(page.getByRole('button', { name: 'retired：异常，配置模型', exact: true })).toBeVisible()
  144 |   await page.locator('[data-model-status]').first().click()
  145 |   await page.getByRole('button', { name: '继续移除', exact: true }).click()
  146 |   mock.retry()
  147 |   await dialog.getByRole('button', { name: '重试未完成步骤' }).click()
  148 |   await expect(dialog).not.toBeVisible()
  149 |   expect(mock.requests.filter((item) => item.path.endsWith('/execute')).at(-1)?.body.change_id).toBe('chg_removal')
  150 |   await expect(row('retired')).toHaveCount(0)
  151 |   await page.keyboard.press('Escape')
  152 |   await expect(page.getByRole('button', { name: 'retired：异常，配置模型', exact: true })).toHaveCount(0)
  153 |   await expect(page.getByRole('button', { name: 'auth：异常，配置模型', exact: true })).toHaveCount(0)
  154 |   await expect(page.getByRole('button', { name: 'good：可用，配置模型', exact: true })).toBeVisible()
  155 | })
  156 | 
  157 | test('batch tests show submission, running filters, reopen progress and final states', async ({ page }) => {
  158 |   const mock = await setup(page, { delayStart: true })
  159 |   await page.getByRole('button', { name: `批量测试 (${models.length})`, exact: true }).click()
  160 |   await expect(page.getByText(`测试中 · 正在提交 ${models.length} 个模型`)).toBeVisible()
  161 |   for (const model of models) await expect(page.locator(`[data-model-row="${model}"]`)).toContainText('测试中')
  162 |   await expect(page.getByRole('button', { name: '取消测试', exact: true })).toBeVisible()
  163 |   await page.getByRole('combobox', { name: '模型状态筛选' }).click()
  164 |   await expect(page.getByRole('option')).toHaveText(['全部模型', '未测试', '测试中', '异常', '可用'])
  165 |   await page.getByRole('option', { name: '测试中', exact: true }).click()
  166 |   await expect(page.locator('[data-model-row]')).toHaveCount(models.length)
  167 |   await page.keyboard.press('Escape')
  168 |   await expect(page.getByRole('button', { name: 'good：测试中，配置模型', exact: true })).toBeVisible()
  169 |   await page.getByRole('button', { name: 'good：测试中，配置模型', exact: true }).click()
  170 |   await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  171 |   mock.finish()
  172 |   await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  173 |   await expect(page.locator('[data-model-row="good"]')).toContainText('可用')
  174 |   await expect(page.locator('[data-model-row="retired"]')).toContainText('异常')
  175 |   await expect(page.getByRole('button', { name: `批量测试 (${models.length})`, exact: true })).toBeEnabled()
  176 | })
  177 | 
  178 | test('discovered models require confirmation to update and removal ignores checkbox selection', async ({ page }) => {
  179 |   const mock = await setup(page)
  180 |   await page.getByRole('checkbox', { name: '选择当前筛选模型' }).uncheck()
  181 |   await page.getByRole('button', { name: '移除不可用模型 (4)', exact: true }).click()
> 182 |   expect(mock.requests.at(-1)?.body.models).toEqual(['retired', 'timeout', 'limited', 'auth'])
      |                                             ^ Error: expect(received).toEqual(expected) // deep equality
  183 |   await expect(page.getByRole('dialog', { name: '移除不可用模型', exact: true })).toBeVisible()
  184 |   await page.getByRole('dialog', { name: '移除不可用模型', exact: true }).getByRole('button', { name: '取消' }).click()
  185 |   await page.getByRole('button', { name: '获取模型', exact: true }).click()
  186 |   await page.getByRole('button', { name: '确认更新模型 (1)', exact: true }).click()
  187 |   const dialog = page.getByRole('dialog', { name: '确认更新模型', exact: true })
  188 |   await expect(dialog).toContainText('discovered')
  189 |   await dialog.getByRole('button', { name: '取消', exact: true }).click()
  190 |   expect(mock.requests.filter((item) => item.path.endsWith('/update/execute'))).toHaveLength(0)
  191 |   await page.getByRole('button', { name: '确认更新模型 (1)', exact: true }).click()
  192 |   await dialog.getByRole('button', { name: '确认更新', exact: true }).click()
  193 |   await expect(dialog).not.toBeVisible()
  194 |   await expect(page.locator('[data-model-row="discovered"]')).not.toContainText('未配置')
  195 |   await page.keyboard.press('Escape')
  196 |   await expect(page.getByRole('button', { name: 'discovered：未测试，配置模型', exact: true })).toBeVisible()
  197 | })
  198 | 
  199 | test('model checkboxes distinguish checked, mixed and unchecked states in both themes', async ({ page }) => {
  200 |   await setup(page)
  201 |   const all = page.getByRole('checkbox', { name: '选择当前筛选模型' })
  202 |   const first = page.getByRole('checkbox', { name: '选择 good', exact: true })
  203 |   for (const theme of ['light', 'dark']) {
  204 |     await page.evaluate((value) => { document.documentElement.dataset.theme = value }, theme)
  205 |     await all.check()
  206 |     await expect(all.locator('.lucide-check')).toBeVisible()
  207 |     await first.uncheck()
  208 |     await expect(all).toHaveAttribute('aria-checked', 'mixed')
  209 |     await expect(all.locator('.lucide-minus')).toBeVisible()
  210 |     await expect(all.locator('.lucide-check')).not.toBeVisible()
  211 |     await expect(first.locator('[data-slot="checkbox-indicator"]')).toHaveCount(0)
  212 |     const contrasts = await page.getByRole('table', { name: '模型配置列表' }).locator('[data-slot="checkbox"]:not([data-state="unchecked"])').evaluateAll((elements) => elements.map((element) => {
  213 |       const context = document.createElement('canvas').getContext('2d')!
  214 |       const luminance = (color: string) => {
  215 |         context.fillStyle = color
  216 |         context.fillRect(0, 0, 1, 1)
  217 |         const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map((channel) => {
  218 |           const value = channel / 255
  219 |           return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  220 |         })
  221 |         return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
  222 |       }
  223 |       const background = luminance(getComputedStyle(element).backgroundColor)
  224 |       const foreground = luminance(getComputedStyle(element.querySelector('[data-slot="checkbox-indicator"]')!).color)
  225 |       return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05)
  226 |     }))
  227 |     expect(contrasts.length).toBe(models.length)
  228 |     expect(contrasts.every((contrast) => contrast >= 3)).toBe(true)
  229 |     await all.click()
  230 |     await expect(first).toBeChecked()
  231 |     await all.uncheck()
  232 |     await expect(page.getByRole('table', { name: '模型配置列表' }).locator('[aria-checked="true"]')).toHaveCount(0)
  233 |   }
  234 | })
  235 | 
  236 | test('model list and confirmation fit desktop and narrow mobile in both themes', async ({ page }) => {
  237 |   await page.emulateMedia({ reducedMotion: 'reduce' })
  238 |   await setup(page)
  239 |   const root = process.env.PARTOKENS_E2E_OUTPUT_DIR || '../../dogfood-output/2026-09-10-channel-models'
  240 |   for (const width of [1440, 768, 390, 320]) {
  241 |     await page.setViewportSize({ width, height: width === 320 ? 568 : 900 })
  242 |     const backgrounds: string[] = []
  243 |     for (const theme of ['light', 'dark']) {
  244 |       await page.evaluate((value) => { document.documentElement.dataset.theme = value; document.documentElement.classList.toggle('dark', value === 'dark') }, theme)
  245 |       const panel = page.getByRole('dialog').first()
  246 |       await expect(panel).toBeVisible()
  247 |       await panel.evaluate(async (element) => {
  248 |         await Promise.all(element.getAnimations().map((animation) => animation.finished))
  249 |       })
  250 |       backgrounds.push(await panel.evaluate((element) => getComputedStyle(element).backgroundColor))
  251 |       expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  252 |       const bounds = await page.locator('[data-model-row]').evaluateAll((rows) => rows.map((row) => {
  253 |         const model = row.children[1]!.getBoundingClientRect()
  254 |         const actions = row.lastElementChild!.getBoundingClientRect()
  255 |         return model.right <= actions.left
  256 |       }))
  257 |       expect(bounds.every(Boolean)).toBe(true)
  258 |       await page.screenshot({ path: `${root}/models-${width}-${theme}.png` })
  259 |     }
  260 |     expect(backgrounds[0]).not.toBe(backgrounds[1])
  261 |     await page.getByRole('button', { name: '移除 retired', exact: true }).click()
  262 |     const confirmation = page.getByRole('dialog', { name: '移除不可用模型', exact: true })
  263 |     await confirmation.getByText('配置影响与执行步骤', { exact: true }).click()
  264 |     await expect(confirmation.getByRole('button', { name: '确认移除' })).toBeInViewport()
  265 |     const rect = await confirmation.boundingBox()
  266 |     expect(rect!.y).toBeGreaterThanOrEqual(0)
  267 |     expect(rect!.y + rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  268 |     expect(await confirmation.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  269 |     await page.screenshot({ path: `${root}/confirmation-${width}.png` })
  270 |     await confirmation.getByRole('button', { name: '取消', exact: true }).click()
  271 |   }
  272 | })
  273 | 
```