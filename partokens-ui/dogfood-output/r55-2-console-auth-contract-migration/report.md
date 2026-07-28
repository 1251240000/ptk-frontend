# R55.2 Console Authentication Contract Migration

日期：2026-07-28  
范围：只迁移 Console 登录认证契约；未修改 canonical `/$locale/console/*` 路由，未执行 R56 cutover。

## 结论

R55.2 的认证阻塞已关闭：production 普通用户可以从 4174 的真实登录页建立 access-token/session 会话，Foundation 四页可加载，整页刷新可通过 HttpOnly refresh cookie 恢复，主动退出后受保护路由回到本地化登录页。

认证实现具备严格响应解析、内存 bearer、到期前刷新、401 单次刷新与重试、refresh rotation、single-flight、SID/用户一致性校验、旧响应防覆盖和 logout/refresh 竞态保护。自动化和完整回归已通过。

R55.2 具备重新进入 Permission Gate Closeout 的认证前提，但仍缺少 staging tenant、受限账户和第二资源所有者证据，因此 R56 仍不批准。

## 证据来源

- 真实 production 响应与 4174 浏览器流程。
- 部署对齐源码：`new-api` 的 `origin/refactor/dashboard-stateless-auth`。
- 核心契约提交：`dbd60d61`、`99b84b7b`。
- 对齐源码的 `docs/authentication.md`、`controller/auth_session.go`、`controller/user.go`、`controller/twofa.go`、`controller/oauth.go`、`service/auth_session.go` 和 `router/api-router.go`。
- 本仓库单元、契约 E2E 和完整 Chromium E2E。

未确认或未实测的内容在下文单独标记，不以字段名推断。

## Production Auth 契约

### Password login

`POST /api/user/login`，成功 envelope：

```text
success: true
message: string
data:
  access_token: string
  token_type: "Bearer"
  access_expires_at: unix seconds
  user: nested user object
  session:
    sid: UUID
    current: true
    login_method: string
    ip: string
    user_agent: string
    created_at: unix seconds
    last_active_at: unix seconds
    expires_at: unix seconds
```

普通失败可由 HTTP 4xx envelope 或 HTTP 200 `success=false` 表达。客户端只从通过 zod 校验的 `data` 建立认证，失败 envelope 不进入 Store。

启用 2FA 时 password login 首步返回：

```text
success: true
data:
  require_2fa: true
  flow_token: string
  expires_at: unix seconds
```

`flow_token` 只保存在当前页面内存中。`POST /api/user/login/2fa` 使用 `{code, flow_token}`，最终成功返回与 password login 相同的 AuthBundle。

### OAuth

- `POST /api/oauth/state` 接收 `provider`、`intent` 和登录场景下的可选 `aff`，返回 `{flow_token, expires_at}`。
- 标准 OAuth callback 使用 `GET /api/oauth/:provider?code=...&state=...`。
- OAuth login 最终成功返回统一 AuthBundle。
- OAuth bind 最终返回 `{action: "bind"}`，不建立新登录会话。
- bind 使用 popup；popup 只把 provider/code/state 通过同源 `postMessage` 交给 opener，后端 bind 请求由持有内存 bearer 的 opener 发出。

### Refresh

- Endpoint：`POST /api/user/auth/refresh`。
- 冷启动时认证来自 refresh cookie；此时尚无内存 SID，可省略 `X-Auth-Session`。
- 已有内存 session 时，客户端发送 `X-Auth-Session: <session.sid>`。
- `X-Auth-Session` 的方向为浏览器到服务端，值来源仅为已验证 AuthBundle 的内存 SID，仅用于 refresh/logout。
- 成功 refresh 返回完整 AuthBundle，而不是只返回 token 字段。
- 每次成功 refresh 轮换 refresh credential，并签发新的短期 access token；SID 和用户身份保持不变。
- Access token 有效期 15 分钟；客户端在到期前 60 秒触发 refresh。
- 并发 refresh 由模块级 Promise single-flight 和 Web Locks 串行化。
- `AUTH_REFRESH_RACE` 最多按 80/200/500ms 重试；不存在无限重试。

### Refresh cookie

- 名称：`new_api_refresh`。
- `HttpOnly=true`。
- `SameSite=Strict`。
- Path：`/api/user/auth`。
- 有效期不超过登录 session，默认最长 30 天。
- `Secure` 由部署的 `SESSION_COOKIE_SECURE` 决定，不在客户端猜测或覆盖。
- Secure 模式由服务端对 refresh/logout 执行精确 Origin 校验；非 Secure 本地模式关闭该 OriginGuard。
- 4174 通过同源 `/api` 代理访问 production；浏览器带 cookie，但 JavaScript 不读取 cookie。未采用跨站 refresh 方案。

### Logout

- Endpoint：`POST /api/user/auth/logout`。
- 携带内存 bearer；存在内存 SID 时同时携带 `X-Auth-Session`。
- Bearer 分支成功可返回 `{revoked_sid, cookie_cleared}`；cookie-only/无 cookie 分支也可返回不带 `data` 的 success envelope。
- 服务端撤销 session 并清除 refresh cookie。
- 无论服务端成功、失败或网络异常，客户端 `finally` 都清理内存认证和 Studio 临时 credential；本地退出不会因 revocation 请求失败而卡住。

### `New-Api-User`

新 dashboard session 契约不再需要 `New-Api-User`。客户端已移除该 legacy header；普通请求只使用同源 bearer。PAT 的兼容语义属于后端调用契约，不进入本轮浏览器 Store。

## 安全解析与状态投影

- Login、2FA、OAuth 和 refresh envelope 使用 zod 解析。
- `token_type` 必须为 `Bearer`；access/session 到期时间必须有效。
- Session 必须 `current=true`，SID 必须为 UUID，时间顺序必须有效。
- Nested user 只投影到现有最小 `CurrentUser` 字段。
- AuthBundle、user 和 session 的未知字段被剥离，不会直接进入 Store。
- malformed、partial、expired 或身份不一致的成功响应按认证失败处理。
- 错误消息固定为安全的契约错误，不包含 token、cookie 或完整原始响应。

## 认证状态机

| 当前状态 | 事件 | 结果 |
| --- | --- | --- |
| unresolved | 应用启动 | 单次 refresh；成功进入 authenticated，确认无效进入 anonymous |
| anonymous | password/OAuth/2FA 最终成功 | 原子安装 user、session、access token 和 expiry |
| password pending | `require_2fa=true` | 只保留内存 `flow_token`，进入 OTP 页面 |
| authenticated | access 即将到期 | single-flight refresh，成功 rotation |
| authenticated | 普通 API 首次 401 | refresh 一次，原请求重试一次 |
| authenticated | 重试仍为 401 | 原子清空并进入本地化登录页 |
| authenticated | 403 | 保留会话，由功能页面显示权限错误，不 refresh |
| authenticated | HTTP 200 `success=false` | 保留会话，按业务失败处理，不 refresh |
| refreshing | 新登录/新 refresh/logout 改变 revision | 旧响应标记 superseded，禁止覆盖新状态 |
| refreshing | SID/user 不一致或异常 bundle | 原子清空并进入登录页 |
| authenticated | logout | 请求结束后始终清空内存状态与 Studio credential |

## 内存与所有权边界

| 数据 | 所有者 | 存储位置 | 持久化 |
| --- | --- | --- | --- |
| Access token | `useSessionStore` / API runtime | JavaScript 内存 | 否 |
| Access expiry | `useSessionStore` | JavaScript 内存 | 否 |
| 安全投影 user | `useSessionStore` | JavaScript 内存 | 否 |
| Session SID/视图 | `useSessionStore` | JavaScript 内存 | 否 |
| Refresh credential | production server/browser cookie jar | HttpOnly cookie | 仅服务端管理 |
| 2FA flow token | 当前 SPA 状态 | JavaScript 内存 | 否 |
| OAuth locale/intent/return | OAuth 跳转辅助状态 | localStorage | 不含 token、SID 或用户对象 |
| Studio 临时 key | 既有 Studio 边界 | 既有内存机制 | logout 时继续清理 |

`useSessionStore` 未使用 Zustand persist。Access token 不进入 localStorage、sessionStorage、IndexedDB、URL、console、错误字符串、快照或测试产物；页面卸载后只剩服务端 HttpOnly refresh cookie。

## API Client 行为

- 只为与 `window.location.origin` 相同的 Axios/fetch 目标附加 bearer。
- 外部 absolute origin 不附加 bearer，也不附加 legacy user header。
- Axios request interceptor 负责 bearer 和到期前 refresh。
- Axios response interceptor 只处理真实 HTTP 401；最多一次 refresh 和一次 `authRetry`。
- 403 与 HTTP 200 `success=false` 不触发 refresh。
- Playground 原生 fetch 使用同一 bearer、到期前 refresh、401 refresh/单次重试和二次 401 清理逻辑。
- Refresh/login/logout 的特殊请求通过显式 flags 避免 interceptor 递归。

## 并发与竞态

- 同一 JS context 的并发调用共享一个 refresh Promise。
- 支持 Web Locks 时，以 `partokens:auth-refresh` 跨标签页串行 refresh。
- 每次 install/clear 增加 revision；refresh 在发出前和响应后检查 revision。
- 新 login 安装后，旧 refresh 响应返回 superseded，不能覆盖新 bearer。
- logout 在 `finally` 清理并增加 revision；晚到 refresh 不能恢复已退出会话。
- Refresh 成功必须保持现有 SID 和 user id；不一致立即失效。
- 401 retry 标记保存在单次 Axios config；重试仍 401 直接清理，不进入循环。

## 自动化覆盖

新增/扩充认证测试覆盖：

- AuthBundle 正常解析、未知字段剥离、malformed/partial/expired 拒绝。
- Password login 原子安装与同源 bearer。
- 冷启动 refresh 恢复。
- 到期前 refresh。
- Axios 401 refresh 和单次重试、二次 401 清理。
- Native fetch 401 refresh 和单次重试、二次 401 清理。
- Refresh rotation 与 `X-Auth-Session`。
- 并发 single-flight。
- Refresh HTTP 401/403、HTTP 200 business failure、malformed envelope。
- Invalid/expired/revoked session。
- SID/user 不一致。
- 新 login 与旧 refresh 竞态、logout 与 refresh 竞态。
- Logout 服务端失败仍完成本地清理。
- Axios/fetch 外部 origin 不携带 bearer。
- 2FA 最终 bundle、OAuth login bundle、OAuth bind popup origin/source/provider/state 校验。
- 管理员和普通用户跳转。
- Access token 不进入持久化存储、URL 或 console。

## 2FA / OAuth / Turnstile 覆盖

| 流程 | Production 实测 | 契约/自动化 |
| --- | --- | --- |
| Password login | 是 | 是 |
| 2FA challenge/final bundle | 否，缺少可用 2FA 账户 | zod、unit、Chromium E2E |
| OAuth login callback/final bundle | 否，未使用真实 provider 账户 | zod、unit、Chromium E2E |
| OAuth bind popup | 否，未改动 production 账户绑定 | unit 覆盖 origin/source/provider/state 和失败关闭 |
| Admin redirect | 否，未使用 production admin 登录 | Chromium E2E |
| Turnstile | 本次 production 登录未要求 challenge | 既有页面逻辑和 E2E 保持 |

2FA/OAuth 未标记为 production 实测。部署源码确认 password、2FA 与 OAuth login 最终均通过统一 `setupLogin` AuthBundle 出口。

## Production 浏览器验收

验收使用 4174 真实登录页和既有普通用户安全输入。未使用 bearer 注入、额外 header 注入、mock 或保存的 auth state；未创建 production Key 或其他数据。

| 检查 | 结果 |
| --- | --- |
| Password login 建立会话 | 通过，跳转 `/en/console-foundation/overview` |
| Bearer `/api/user/self` | HTTP 200，确认 bearer 有效 |
| Overview | 通过，无页面级 alert |
| Analytics | 通过，validated summary 区域存在，无页面级 alert |
| API Keys | 通过，无页面级 alert；账户当前空列表为正常状态 |
| Usage Logs | 通过，真实列表加载，无页面级 alert |
| 整页刷新恢复 | 通过，refresh cookie 恢复 Overview |
| 连续全页导航/rotation | 通过，Overview/Analytics/Keys/Logs 均可恢复 |
| 主动退出 | 通过，返回 `/en/auth/sign-in` |
| 退出后受保护路由 | 通过，回到带安全 `redirect` 的本地化登录页 |
| 退出后 refresh | 已确认 HTTP 401，cookie 不再恢复会话 |

真实契约探测还确认连续 refresh 会轮换 credential，且 rotation 前后 SID/user 保持一致。验收结束已退出并关闭浏览器 session，未保存 auth state。

一次浏览器探针等待了不可见的 aria-label 文本并超时；对应 Analytics 区域随后通过 DOM 区域计数确认存在，且无 alert。这是验收定位器选择问题，不是产品失败。

## 回归结果

最终结果：

- `npm run typecheck`：通过（web、docs）。
- `npm run test`：通过；web 74/74，docs 3/3。
- `npm run build`：通过；web 和 docs production build 均成功。
- 定向 auth unit：38/38。
- 定向 Foundation E2E：24/24。
- 完整 `npm run test:e2e`：Chromium 93/93，无 Playwright retry（配置 `retries=0`）。

首次失败与修复记录：

- Auth unit 首轮缺少 jsdom；补充测试环境后继续。
- Auth unit 第二轮 15/23，通过重写 deferred 竞态测试消除同步等待超时；随后 23/23，本轮扩展后 38/38。
- 一次定向 Vitest 命令误传 monorepo 路径，报告 `No test files found`；改用 app 内路径后 32/32，当时不是测试断言失败。
- 首次完整 E2E 为 53/93：5 条旧 401 局部错误语义与新全局 refresh 状态机冲突；其余 35 条因预存 4174/4180 服务会话中途退出产生连接拒绝。
- 启动由当前会话托管的 4174/4180 后，将 401 用例迁移为 refresh/单次重试语义。
- 首次定向 Foundation 复跑 22/24；2 条实际页面状态正确，但定位器命中隐藏 option/错误文本。改为语义区域和 table row 后 24/24。
- 最终完整 E2E 93/93，无失败、无重试。

## 修改文件

- `packages/api-client/src/index.ts`：auth schema、runtime、refresh/logout、Axios/fetch bearer 与 retry。
- `apps/web/src/stores/session.ts`：唯一认证 Store、bootstrap、内存状态、logout 与 invalidation。
- `apps/web/src/pages/auth-pages.tsx`：password/2FA/OAuth bundle 流程、角色跳转、bind popup。
- `apps/web/src/pages/profile-page.tsx`：OAuth bind 完成反馈与 refetch。
- `apps/web/src/router.tsx`：refresh bootstrap、localized redirect；canonical 路由定义未切换。
- `apps/web/src/lib/auth-session.test.ts`：38 条认证解析、生命周期、安全与竞态测试。
- `apps/web/e2e/mock-api.ts`：当前 AuthBundle/refresh/logout mock 契约。
- `apps/web/e2e/critical-flows.spec.ts`：登录、2FA、OAuth 跳转契约。
- `apps/web/e2e/console-foundation.spec.ts`：新 refresh 语义；保留原有管理员轮询和移动端焦点稳定性修改。

所有完整 E2E 生成的历史截图和 HTML 报告修改已恢复，未作为代码变更保留。既有未跟踪文件与所有 `* 2` 文件未删除或清理。

## 安全检查

- 真实用户名和密码未进入 diff、报告或仓库文件。
- 未记录密码、cookie、access token、完整 API key、原始日志、metadata 或完整生产响应。
- Credential diff scan：通过。
- Auth persistence scan：通过。
- 外部 origin bearer 隔离：unit 通过。
- Web Storage/IndexedDB/URL/console 无 access token：unit 与 E2E 通过。
- `git diff --check`：通过。

## 剩余阻塞

- 无 staging tenant/session。
- 无第二资源所有者账户，不能验证真实非自有资源。
- 无受限账户，不能验证 Foundation 各功能级真实 403。
- Production Foundation URL 仍返回原生 404。
- 本地后端源码与 production 的部分权限状态码仍不一致。
- Canonical `/$locale/console/*` 仍由 `LegacyConsoleShell` 承载，本轮未修改。
- 2FA、OAuth、OAuth bind 和 production admin 登录缺少真实账户实测。

## Gate 判断

R55.2 authentication gate：通过。  
重新进入 R55.3 Permission Gate Closeout 的认证前提：具备。  
R56 canonical cutover：不批准；必须先补齐 staging、受限账户和双账户非自有资源权限矩阵证据。
