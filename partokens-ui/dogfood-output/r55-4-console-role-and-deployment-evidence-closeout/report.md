# R55.4 Console Role & Deployment Evidence Closeout

| 字段 | 结果 |
| --- | --- |
| 日期 | 2026-07-28 |
| 范围 | 真实 restricted/admin 角色与 deployed Foundation UI 证据 |
| Permission Gate | **FAILED / 未关闭** |
| R56 | **NOT APPROVED / 本轮不执行** |

## 修改前工作树基线

执行 `git status --short` 后记录如下；所有既存修改、未跟踪内容和 `* 2` 文件均保留：

```text
 M ../dev_user.txt
 M apps/web/e2e/console-foundation.spec.ts
 M apps/web/e2e/critical-flows.spec.ts
 M apps/web/e2e/mock-api.ts
 M apps/web/src/lib/api-contract.test.ts
 M apps/web/src/pages/auth-pages.tsx
 M apps/web/src/pages/console-foundation-keys-page.tsx
 M apps/web/src/pages/profile-page.tsx
 M apps/web/src/router.tsx
 M apps/web/src/stores/session.ts
 M packages/api-client/src/index.ts
?? ../new-api-docs-v1/
?? ../new-api/
?? "apps/design-lab/src/shadcn-connections-screen 2.tsx"
?? "apps/design-lab/src/shadcn-image-studio-screen 2.tsx"
?? "apps/design-lab/src/shadcn-notifications-screen 2.tsx"
?? "apps/design-lab/src/shadcn-overview-screen 2.tsx"
?? "apps/design-lab/src/shadcn-playground-screen 2.tsx"
?? "apps/design-lab/src/shadcn-profile-screen 2.tsx"
?? "apps/design-lab/src/shadcn-security-screen 2.tsx"
?? "apps/design-lab/src/shadcn-wallet-screen 2.tsx"
?? "apps/web/e2e/console-foundation.spec 2.ts"
?? "apps/web/e2e/r54-console-foundation-visual.spec 2.ts"
?? "apps/web/src/components/console-foundation/console-shell 2.tsx"
?? apps/web/src/lib/auth-session.test.ts
?? "apps/web/src/pages/console-foundation-analytics-page 2.tsx"
?? "apps/web/src/pages/console-foundation-keys-page 2.tsx"
?? "apps/web/src/pages/console-foundation-logs-page 2.tsx"
?? "apps/web/src/pages/console-foundation-logs-page.test 2.ts"
?? "apps/web/src/pages/console-foundation-page 2.tsx"
?? "dogfood-output/playwright-report/index 2.html"
?? "dogfood-output/r40-overview/report 2.md"
?? "dogfood-output/r41-playground/dogfood 2.mjs"
?? "dogfood-output/r41-playground/functional 2.mjs"
?? "dogfood-output/r41-playground/report 2.md"
?? "dogfood-output/r42-image-studio/report 2.md"
?? "dogfood-output/r43-wallet/report 2.md"
?? "dogfood-output/r44-profile/report 2.md"
?? "dogfood-output/r45-security/report 2.md"
?? "dogfood-output/r46-connections/report 2.md"
?? "dogfood-output/r47-notifications/report 2.md"
?? "dogfood-output/r48-console-closeout/report 2.md"
?? "dogfood-output/r49-console-production-foundation/report 2.md"
?? "dogfood-output/r50-console-overview-production/report 2.md"
?? "dogfood-output/r51-console-analytics-production/report 2.md"
?? "dogfood-output/r52-console-api-keys-production/report 2.md"
?? "dogfood-output/r53-console-usage-logs-production/report 2.md"
?? "dogfood-output/r54-console-foundation-rebuild/report 2.md"
?? dogfood-output/r55-1-console-permission-gate-closeout/
?? dogfood-output/r55-2-console-auth-contract-migration/
?? dogfood-output/r55-3-console-permission-matrix-closeout/
?? "dogfood-output/r55-console-authenticated-validation/report 2.md"
```

管理员补测前再次执行 `git status --short`。除用户新增的未跟踪 `../admin_user.txt` 外，初始工作树仍保持不变；该文件为空，未被读取为凭据或修改，继续原样保留。

## 结论

R55.4 仍无法关闭 Permission Gate。初始 closeout 时两个 production 账户均为普通账户；随后其中一个账户被真实提升为管理员，本次补测已完成管理员登录、旧版管理入口、只读管理页面、整页刷新与 logout 证据。管理员角色阻塞已关闭。

仍没有真实 restricted 账户或 staging tenant/session。剩余普通账户可正常进入 Overview、Analytics、Keys、Logs，四页均为 0 个权限 alert，不能当作 restricted 账户。

Production 的四个 Foundation 路径均为 HTTP 200，但真实浏览器页面 H1 均为 `404`。Overview 截图经过人工检查，明确是本地化 404 页面，不是 deployed Foundation UI。候选 staging host 仍没有 A/AAAA 地址。

本轮没有创建、修改或删除 production Key 或其他业务资源；测试资源创建数量为 0、残留为 0。全部回归通过，但 restricted 和部署证据仍缺失，因此 **R56 继续不批准，canonical `/$locale/console/*` 未修改且不得 cutover**。

## 环境与账户能力

| 项目 | 真实结果 | Gate 状态 |
| --- | --- | --- |
| Production API | 通过 4174 Web 的既有同源 `/api` production 代理可用 | 可用 |
| Staging | `staging.partokens.com`、`api-staging.partokens.com`、`staging-api.partokens.com`、`test.partokens.com` 无 A/AAAA 地址；无 staging tenant/session | **Blocked** |
| 普通账户 | 真实登录后进入 Foundation；四区域均加载，0 个权限 alert | 普通用户边界保留 |
| Restricted | 没有可用真实账户，无法执行四区域功能级 403 | **Blocked** |
| Admin | 真实登录触发旧版管理跳转；production `/channels` 与只读 `/users` 正常加载，刷新和 logout 通过 | **Passed** |

所有账户均使用独立 `agent-browser` session，从环境真实登录页输入凭据。没有 bearer、cookie 或 header 注入，没有保存 auth state，没有 HAR、录屏或 credentialed screenshot。账户身份和响应内容没有写入终端摘要或产物。

一次登录后页面上下文使用原生 `fetch('/api/user/self')` 得到 HTTP 401，因为该原生调用没有经过应用的内存 bearer client。该结果不代表登录失败或角色边界，已明确排除，不作为任何 Gate 证据。账户能力只按正常页面导航和渲染状态判定。

## Restricted 证据

真实 restricted 验证未执行，原因是没有具备明确功能限制的真实账户。不能用以下内容替代：

- 现有普通账户；它可正常进入全部四个 Foundation 区域。
- 已提升的管理员账户；管理员能力不能替代 restricted 功能级 403。
- R55.3 的 HTTP 403 fixture/契约 E2E；它仍证明 UI 在模拟 403 下保留 session、显示安全权限错误、过滤敏感字段且不 refresh，但不是环境证据。
- bearer、cookie、header 注入，角色字段改写或网络 mock；本轮均未使用。

因此以下退出条件仍未满足：Overview token/log/stat、Analytics usage/flow、Keys list、Logs list/stat 的真实功能级 403，以及这些真实 403 下的 session 保留、安全错误投影和 0 refresh。

## Admin 证据

真实管理员补测已完成，使用提升后的 production 账户和两个不共享状态的 browser session：

1. 从 4174 本地化真实登录页登录后，浏览器实际请求 `GET /channels`，证明当前 Foundation 登录分支识别管理员角色并执行旧版管理跳转。4174 开发服务器将未知旧版路由以 HTTP 200 回退到本地 `/en/`，因此该本地页面不被当作 deployed 管理 UI 证据。
2. Production 的 `/en/auth/sign-in` 是 404；从 production 首页自身提供的“登录”入口进入真实 `/sign-in`，没有猜测或注入登录路由。
3. Production 登录成功后进入旧版 `/dashboard/overview`，不是 404、登录循环或 Foundation。页面提供 `/channels`、`/users`、`/system-settings/site` 和管理员日志等管理导航。
4. 点击真实 `/channels` 入口后页面正常加载，存在渠道管理 surface 和交互控件；无 404、登录页或浏览器错误。
5. 点击只读 `/users` 入口后页面正常加载，存在用户管理 surface 和 14 个 row-like 元素；未读取、输出或截图任何用户字段。整页刷新后仍停留 `/users`，页面继续可用且无浏览器错误。
6. Production 和 4174 session 均执行同源 cookie-only logout，HTTP 200。再次访问 production `/users` 后回到 `/sign-in?redirect=%2Fusers`，随后两个 session 均关闭。

R55.3 的普通用户管理员边界真实 HTTP 403 继续作为普通用户侧证据。本次真实管理员侧证据与其组合后，普通用户/管理员边界已闭合。没有执行任何管理员写操作。

## Deployed Foundation

| 路径 | Transport | 真实浏览器 H1 | 判定 |
| --- | --- | --- | --- |
| `/en/console-foundation/overview` | HTTP 200 | `404` | 未部署 |
| `/en/console-foundation/analytics` | HTTP 200 | `404` | 未部署 |
| `/en/console-foundation/keys` | HTTP 200 | `404` | 未部署 |
| `/en/console-foundation/logs` | HTTP 200 | `404` | 未部署 |

浏览器停留在请求路径，页面 title 为 `Partokens`，但页面主体明确显示 `404` 和“页面未找到”。Overview 视觉证据：![Production Foundation 404](screenshots/production-foundation-overview.png)。匿名 deployed 验收结束后浏览器 session 已关闭。

## Session 与资源清理

| 检查 | 结果 |
| --- | --- |
| 隔离 session | 初始普通账户验收与管理员补测均使用独立 session；管理员 local/production session 不共享状态 |
| 登出 | 所有真实登录 session 均完成同源 cookie-only logout，HTTP 200；随后关闭 |
| Admin logout 后边界 | Production `/users` 回到 `/sign-in?redirect=%2Fusers` |
| Active browser session | `agent-browser session list` 为 0 |
| Auth state / HAR / trace | 未创建 |
| Production 业务资源 | 创建 0、修改 0、删除 0、残留 0 |
| 本地服务 | 4174 Web 与 4180 Design Lab 在回归结束后仍监听，无中断 |

cookie-only logout 仅用于清理真实登录建立的 session，没有注入 cookie、bearer 或额外 header。

## 自动化与回归

| 命令 | 最终结果 |
| --- | --- |
| `npm run typecheck` | 通过；web、docs，98 个本地化文档页面，0 文件更新 |
| `npm run test` | 通过；web 11 files / 74 tests，docs 1 file / 3 tests |
| `npm run build` | 通过；web、docs，docs 102 个静态页面 |
| `npm run test:e2e` | Chromium 95/95，1 worker，2.6 分钟，`retries=0` |

本轮 typecheck、unit、build 和完整 E2E 都是首次运行即通过，没有测试断言失败、Playwright retry 或 4174/4180 服务中断。Unit 输出一次既有 `--localstorage-file` 路径 warning；docs build 输出 `baseline-browser-mapping` 数据过期 warning，均未导致失败。

管理员补测发生在上述完整回归之后，只改变了远端账户角色，没有修改应用或测试代码，因此未重复运行同一套自动化；管理员 production 浏览器验收本身全部通过。

完整 E2E 会重写历史 screenshot 与 HTML report；回归完成后，这些明确由本轮生成的 tracked artifact churn 已恢复到运行前状态。Reporter 清理的既有未跟踪 `dogfood-output/playwright-report/index 2.html` 已用 tracked baseline 报告恢复。最终 `git status --short` 与初始基线相比仅增加用户在管理员补测前提供的空 `../admin_user.txt` 和本 R55.4 目录。

## 修改范围

- `dogfood-output/r55-4-console-role-and-deployment-evidence-closeout/report.md`：本报告。
- `dogfood-output/r55-4-console-role-and-deployment-evidence-closeout/screenshots/production-foundation-overview.png`：匿名 production 404 视觉证据。

没有修改应用源码、测试源码或 canonical route。R55.3 双账户 owner/non-owner 矩阵没有重做。所有初始修改、未跟踪目录和 `* 2` 文件均保留。

## 安全检查

- R55.4 两个产物文件对四条现有安全输入精确匹配：0。
- JWT、长 `sk-`、PEM private key 模式：0。
- `git diff --check` 与未跟踪报告的 `--no-index --check`：通过，无 whitespace error。
- 凭据、cookie、SID、bearer、完整 Key、原始日志、metadata、HAR、auth state、敏感响应：均未写入产物。
- Credentialed 页面没有截图或录屏；唯一截图是匿名 production 404。
- 管理员页面只记录路径、状态、控件/row-like 数量和安全布尔摘要；没有记录用户列表、账户身份或管理响应正文。

## Gate 与 R56 判断

**Permission Gate：FAILED / 未关闭。**

已完成：环境与账户库存复核、普通账户真实登录能力、真实管理员登录与旧版管理入口、普通用户/管理员边界、production 四条 Foundation 路由的 200/404 反证、session 清理、零测试资源、完整回归。

仍缺失：真实 restricted 四区域功能级 403 与 no-refresh/session 保留、可用 staging 或 deployed Foundation UI。

**R56 canonical cutover：NOT APPROVED。** 本轮没有执行 R56。只有上述真实角色与部署证据完整后，才可重新评估 Permission Gate。
