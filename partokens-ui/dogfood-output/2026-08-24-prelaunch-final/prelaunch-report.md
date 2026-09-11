# Partokens UI 上线前最终检查

- 检查日期：2026-08-24
- 分支：`dev`
- 当前 HEAD：`40a761240a4105258595a66c3f498c0179d886a8`
- 结论：代码质量门禁通过；正式发布仍被来源元数据和真实环境验证条件阻断。

## 当前变更范围

1. 支付回跳：新增本地化回跳页面、标准与兼容路由、订单上下文、状态轮询、账单匹配和七语种文案。
2. 钱包充值：仅在 checkout URL 有效时保存回跳上下文，并兼容 `order_id`、`trade_no`、`out_trade_no` 和无标识 Stripe 回跳。
3. API Key：修复 reveal 响应延迟时切换标签或离开页面导致的复制失败，保留不支持延迟剪贴板时的本地化回退流程。
4. API 与部署：补充支付字段类型；Caddy 将支付回跳及上游默认回跳路径交给 SPA，并增加部署契约门禁。
5. 测试稳定性：认证视觉和多语言文档导航使用明确的页面就绪条件，消除对不稳定 `networkidle`/完整 `load` 的依赖。

## 已消除的上线风险

- 生产 Caddy 将支付回跳误转发到后端。
- Waffo/Creem/Pancake 返回字段与后端账单标识不一致。
- 支付状态只查询一次，无法从 pending 进入终态。
- 上一笔支付的 sessionStorage 上下文污染新订单。
- 易支付 `out_trade_no` 未被识别。
- Stripe 无订单号回跳可能猜错订单；现在只接受五分钟内、渠道一致且唯一的候选。
- 支付上下文永久残留；现在 24 小时过期并自动清理。
- 无效 checkout URL 仍写入支付上下文。
- API Key 延迟 reveal 在标签切换、路由离开后丢失用户手势。
- 支付回跳操作曾产生链接嵌套按钮；现在每个操作只有一个链接语义节点。

## 最终验证

- `bun run check`：通过。
- 类型检查：通过。
- 发布/部署契约：`12/12` 通过。
- 单元与业务契约：`203/203` 通过，32 个测试文件。
- E2E：`196/196` 通过，约 6.8 分钟。
- 支付回跳定向 E2E：服务端终态、持续轮询、旧路径兼容、无标识 Stripe 均通过。
- 生产构建与 bundle budgets：通过；entry 517,488 bytes，initial 1,337,415 bytes。
- New API 兼容性：commit `2d8e50bf36e94200b809dfb39e73624ec48b1e23`；73 个必需 method/path 合约匹配 298 个上游路由，58 个前端直接请求已注册。
- Caddy v2.11.4 原生配置校验：通过。
- `git diff --check`：通过。
- `agent-browser` 桌面 1440px、移动 390px 冒烟：页面错误和控制台错误为空，页面无横向溢出，嵌套交互节点为 0。
- 最终 release 包时间：`2026-08-24T06:08:34.057Z`。
- `dist/index.html` 与 `release/web/index.html` SHA-256：`7e52197663f8f4d44967339eeae396b1075b8b5e7bad4f4da7a73d102fa9b627`。

截图证据：

- `agent-browser/screenshots/payment-return-desktop-1440.png`
- `agent-browser/screenshots/payment-return-mobile-390.png`

## 正式发布阻断项

1. 当前工作树为 dirty，manifest 如实记录 `sourceTreeState: dirty`；HEAD 不包含本次变更。
2. `PUBLIC_PARTOKENS_SOURCE_URL` 尚未提供，manifest 为 `sourceCodeUrl: null`；`bun run release:verify` 按设计阻断。
3. 当前 release candidate 仍基于旧 HEAD `40a761240a41`，只能用于本地结构检查，不能作为正式制品发布。
4. 尚未使用真实生产支付渠道凭证和回调配置完成端到端支付；现有自动化和浏览器 smoke 使用模拟 API。
5. 上线代码、测试、截图/Playwright 报告、`new-api/`、`new-api-docs-v1/`、`ui-images/` 和 `ui-planning/` 必须分批处理，避免验证产物和独立输入混入发布提交。

## 发布执行清单

1. 只暂存本次业务代码与测试，排除 dogfood/Playwright 报告、截图和独立输入目录。
2. 创建干净提交，并确认准备部署的 New API 与兼容性基准一致。
3. 提供公开 HTTPS 源码 URL，且 URL 必须精确包含新提交的 40 位 commit SHA。
4. 在干净 checkout 中设置 `PUBLIC_PARTOKENS_SOURCE_URL`，重新执行 `bun run release`，不得复用当前 dirty 包。
5. 核对生产 `PARTOKENS_API_ORIGIN`、站点地址和各支付提供商成功/失败回调路径。
6. 先部署隔离 staging，至少验证登录、充值创建、成功/失败/取消回跳、账单终态、API Key reveal/copy 和移动端回跳。
7. 生产部署后检查 `/_ui/healthz`、`/_ui/release.json`、Caddy/API 日志、浏览器控制台，并执行小额真实支付 smoke。
