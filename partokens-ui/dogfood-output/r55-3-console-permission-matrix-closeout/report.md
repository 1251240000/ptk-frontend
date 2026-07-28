# R55.3 Console Permission Matrix Closeout

| 字段 | 结果 |
| --- | --- |
| 日期 | 2026-07-28 |
| 范围 | `/$locale/console-foundation/{overview,analytics,keys,logs}` 权限矩阵 |
| 环境 | 4174 Web 同源代理 + production API；production 匿名页面复核 |
| 账户能力 | 两个独立普通 production 账户 A/B；无 staging、受限 C、真实管理员登录账户 |
| Permission Gate | **FAILED / 未关闭** |
| R56 | **NOT APPROVED / 不批准** |

## 结论

R55.3 补齐了 R55.1 最关键的双账户资源所有权证据。A 创建一个最小化的 `R55-3-` Key；B 的列表看不到该资源，对已知 ID 的 detail、update、status、reveal、delete 和 batch 均不能读取或修改 A 的资源；非自有资源与缺失资源在同一操作上的 production 响应完全一致，没有泄漏资源存在性或敏感字段。A 的 owner detail、update、disable、enable、reveal 契约和 delete 均成功，测试资源最终残留为 0。

Gate 仍不能关闭。当前没有具备明确功能限制的真实账户 C，因此无法得到 Overview、Analytics、Keys、Logs 各底层接口的真实功能级 403；也没有真实管理员登录账户或本轮可独立复核的管理员会话。staging 仍不可用。受限角色和管理员跳转只完成契约自动化，不得当作真实账户证据。

本轮没有修改 canonical 路由，没有执行 R56 cutover。

## 环境与账户能力

| 项目 | 结果 |
| --- | --- |
| 4174 Web | 可用；A/B 均从真实本地化登录页建立 production 会话，没有 bearer、cookie 或额外 header 注入浏览器。 |
| 4180 Design Lab | 完整 E2E 全程可用。 |
| Production API | 通过 4174 同源 `/api` 代理和只输出安全摘要的直接权限探针验证。 |
| Production Foundation URL | `https://partokens.com/en/console-foundation/overview` 传输层返回 HTTP 200，但匿名浏览器显示本地化 404 页面；不是已部署 Foundation 的可验收证据。 |
| Staging | `staging.partokens.com`、`api-staging.partokens.com`、`staging-api.partokens.com`、`test.partokens.com` 均无 A/AAAA 地址；工作区也没有 staging tenant/session。 |
| A | 普通资源所有者，`role < 10`；可真实创建和管理自己的 Key。 |
| B | 第二个独立普通资源所有者，`role < 10`；其列表不包含 A 的测试 Key。 |
| C | 缺失；没有具备明确功能限制的真实账户。 |
| 管理员 | 缺失真实登录账户；A/B 对管理员日志边界的 HTTP 403 为真实证据。 |

身份、用户名、邮箱、密码、用户 ID、cookie、SID、bearer、完整 Key、原始日志和 metadata 均未写入报告或测试产物。

## 完整权限矩阵

| Actor / 资源 | Surface | 真实结果 | Refresh | 结论 |
| --- | --- | --- | --- | --- |
| Anonymous | `GET /api/user/self` | HTTP 401，`success=false`，无 `data` | 不适用 | 通过 |
| Anonymous | Key list | HTTP 401，`success=false`，无 `data` | 不适用 | 通过 |
| Invalid bearer | `GET /api/user/self` | HTTP 401，`success=false`，无 `data` | 直接契约探针不执行 refresh | 通过 |
| 已退出 A/B | 受保护 Overview | logout HTTP 200；随后 refresh HTTP 401，回到带安全 `redirect` 的本地化登录页 | 一次 refresh，失败后回登录 | 通过 |
| A/B 普通用户 | `GET /api/user/self` | HTTP 200，`success=true`，确认 `role < 10` | 无权限型 refresh | 通过 |
| A/B 普通用户 | 管理员日志边界 | HTTP 403，`success=false`，无 `data` | 真实 API 摘要；自动化证明 403 no-refresh | 通过 |
| A owner | Create/detail/update/disable/enable/reveal/delete | HTTP 200，均为预期 success；delete 可无 `data` | 无权限型 refresh | 通过 |
| B non-owner | List | B 列表不含 A 资源 | 无 | 通过 |
| B non-owner | Detail/update/status/reveal/delete | HTTP 200，`success=false`，无 `data` | 自动化证明 200-false no-refresh | 通过 |
| B non-owner | Batch | HTTP 200，`success=true`，数字结果；没有匹配到 B 可删除的 A 资源 | 自动化证明业务响应 no-refresh | 通过 |
| Missing resource | Detail/update/status/reveal/delete | HTTP 200，`success=false`，无 `data` | 自动化证明 200-false no-refresh | 通过 |
| Missing resource | Batch | HTTP 200，`success=true`，数字结果 | 无 | 通过 |
| Unknown API route | 不存在的路由 | HTTP 404，`success=false`，无 `data` | 自动化证明 404 no-refresh | 通过 |
| A/B | Logs list/stat | HTTP 200，`success=true`；仅调用 `/api/log/self` 和 `/api/log/self/stat` | 页面冷启动 refresh 正常；无权限型 refresh | 通过 |
| A/B | Analytics usage/flow | HTTP 200，`success=true`；仅调用 `/api/data/self` 和 `/api/data/flow/self` | 页面冷启动 refresh 正常；无权限型 refresh | 通过 |
| A | 31 天单次 Analytics 范围 | HTTP 200，`success=false`，无 `data` | 自动化证明 200-false no-refresh | 通过 |
| Restricted C | Overview/Analytics/Keys/Logs | 无真实账户；仅完成四页 403/no-refresh 契约 E2E | 无真实证据 | **Blocked** |
| Admin | 真实登录与管理入口 | 无真实账户；仅有普通用户 admin 403 和管理员跳转 E2E | 无真实证据 | **Blocked** |

## Owner / Non-owner / Missing Resource

本轮 production 只创建 1 个必要 Key，名称使用 `R55-3-` 前缀，零配额，不保存完整 Key。

| 操作 | A owner | B non-owner | Missing | 存在性泄漏 |
| --- | --- | --- | --- | --- |
| List | A 可见 | B 不可见 A 资源 | 不适用 | 无 |
| Detail | HTTP 200 success | HTTP 200 `success=false`，无 `data` | 与 non-owner 完全一致 | 无 |
| Update | HTTP 200 success，名称变更可复核 | HTTP 200 `success=false`，无 `data` | 与 non-owner 完全一致 | 无 |
| Status | Disable/enable 均 HTTP 200 success | HTTP 200 `success=false`，无 `data` | 与 non-owner 完全一致 | 无 |
| Reveal | HTTP 200 success；只计算合法字符串形态，值未显示、输出或保存 | HTTP 200 `success=false`，无 `data` | 与 non-owner 完全一致 | 无 |
| Delete | HTTP 200 success | HTTP 200 `success=false`，无 `data` | 与 non-owner 完全一致 | 无 |
| Batch | 为减少 production 数据，没有另建第二个 owner Key；owner batch 由自动化覆盖 | HTTP 200 success + 数字结果 | 与 non-owner 完全一致 | 无 |

B 完成全部拒绝操作后，A 再次读取 detail，确认名称和启用状态仍是 A 的预期值，说明 B 的 update/status/delete/batch 没有改变资源。

production 对非自有和缺失 Key 不使用传输层 403/404，而使用 HTTP 200 业务失败隐藏资源。只有普通用户访问明确的管理员边界时返回真实 HTTP 403；不存在的 API 路由返回 HTTP 404。

## Restricted 与 Admin

### Restricted

没有真实受限账户 C。新增 Chromium 契约 E2E 将 Overview token/log/stat、Analytics usage/flow、Keys list、Logs list/stat 分别返回 HTTP 403，并确认：

- 当前 session 保留。
- 四个区域显示功能级安全权限文案。
- 后端敏感 message/data 不渲染。
- 不触发额外 refresh。
- 普通用户页面不请求 `/api/log/` 管理员日志路由。

以上是契约自动化，不是 production 受限角色证据。

### Admin

A/B 真实访问管理员日志边界均为 HTTP 403。管理员登录、管理员管理入口和管理员资源权限没有真实账户验收；现有 Chromium E2E 继续覆盖 `role >= 10` 跳转 `/channels`，但不能替代真实管理员证据。

## HTTP 与 Refresh 语义

| 语义 | Production | 前端行为证据 |
| --- | --- | --- |
| 401 anonymous/invalid | HTTP 401，failure envelope，无 `data` | R55.2 状态机和本轮回归覆盖单次 refresh/单次 retry；失败清空并回登录。 |
| 403 role/feature | 普通用户 admin boundary 为 HTTP 403 | E2E 证明保留 session、显示权限错误、0 次额外 refresh。 |
| 404 route/resource | Unknown route 为 HTTP 404；Key missing/non-owner 实际为 HTTP 200 business failure | Key 页面新增资源级 404 安全文案；unit/E2E 证明 404 no-refresh。 |
| HTTP 200 `success=false` | Key missing/non-owner 和 31 天 Analytics 范围均真实出现 | 继续按业务失败处理，不投影 `data`，不 refresh。 |

Key 的 403、404 和 200-false 自动化响应都故意包含模拟敏感 detail/resource data；页面只显示固定安全投影，Web Storage 和 IndexedDB 扫描均未发现响应 marker。

## 真实浏览器验收

| 检查 | A | B |
| --- | --- | --- |
| 从 4174 真实登录页登录 | 通过 | 通过 |
| Overview | 通过，0 alert | 通过，0 alert |
| Analytics | 通过，0 alert；仅 self routes | 通过，0 alert；仅 self routes |
| API Keys | 通过，0 alert | 通过，0 alert |
| Usage Logs | 通过，0 alert；仅 self routes | 通过，0 alert；仅 self routes |
| 全页加载后的 refresh cookie 恢复 | 通过 | 通过 |
| Logout | HTTP 200 | HTTP 200 |
| Logout 后保护路由 | refresh HTTP 401，回登录 | refresh HTTP 401，回登录 |
| Session 清理 | 已关闭 | 已关闭 |

浏览器使用两个隔离的 `agent-browser` session。没有保存 auth state，没有导出 HAR，没有为真实账户截图、录屏或 trace，也没有把 bearer/cookie/header 注入浏览器。

UI 没有提供输入任意非自有 Key ID 的入口。跨账户 ID 级操作因此在真实浏览器登录建立会话后，使用该会话的短时访问凭据执行进程内 production API 权限探针；凭据未输出、未写文件、未进入浏览器持久化，也没有被用于伪造角色。报告将这部分标记为 API 权限证据，不伪装成 UI 点击证据。

## 资源清理

| 项目 | 结果 |
| --- | --- |
| 创建数量 | 1 |
| 前缀 | `R55-3-` |
| 完整 Key | 未显示、未输出、未保存；只验证 reveal shape |
| 清理方式 | A owner delete |
| 清理结果 | HTTP 200 success |
| 最终残留检查 | A 列表中 `R55-3-` 前缀数量为 0 |

## 自动化与回归

新增或加强的覆盖：

- 受限角色对 Overview、Analytics、Keys、Logs 底层接口的 403/no-refresh/self-scope。
- Key owner CRUD/status/reveal/batch route 契约。
- Key detail/update/status/reveal/delete/batch 的 403、404、HTTP 200 business failure。
- 404 资源缺失/不可见安全文案。
- 401 refresh、403 no-refresh、404 no-refresh、200-false no-refresh。
- 后端敏感 detail/resource data 不渲染、不写 localStorage、sessionStorage 或 IndexedDB。
- Anonymous、invalid token、ordinary、restricted-contract、admin-contract 和角色跳转。
- Logs/Analytics 只使用 self routes。

| 命令 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过；web、docs，98 个本地化文档页面，0 文件更新 |
| `npm run test` | 通过；web 11 files / 74 tests，docs 1 file / 3 tests |
| `npm run build` | 通过；web、docs，docs 102 个静态页面 |
| 定向 permission E2E | 2/2 通过 |
| `npm run test:e2e` | Chromium 95/95，1 worker，2.6 分钟，`retries=0` |

首次失败与稳定性记录：

1. 第一条定向 E2E 命令在收集阶段因新增测试中的多层箭头表达式语法解析失败，0 条测试执行；改为显式函数体。
2. 第二次定向运行 1/2：Analytics 同时存在两个正确权限 alert，严格定位器命中 2 个；限定到第一个权限状态后 2/2。
3. 完整 95 条 E2E 首次运行即全部通过，无 Playwright retry、无 flaky 重跑、无 4174/4180 服务中断。
4. 完整 E2E 重写的历史视觉截图和 HTML report 均恢复到本轮初始状态；没有保留无关二进制 churn。

## 修改文件

- `apps/web/src/pages/console-foundation-keys-page.tsx`：资源级 HTTP 404 投影为缺失/不可见安全文案。
- `apps/web/src/lib/auth-session.test.ts`：403/404/200-false no-refresh 和失败数据不持久化；该文件是 R55.2 已有未跟踪测试文件，本轮没有覆盖其认证迁移内容。
- `apps/web/src/lib/api-contract.test.ts`：补充 Key status endpoint 契约。
- `apps/web/e2e/console-foundation.spec.ts`：补充 restricted 四页和 Key 权限矩阵、安全投影、持久化覆盖；保留 R55.1/R55.2 稳定性与认证改动。
- `dogfood-output/r55-3-console-permission-matrix-closeout/report.md`：本报告。

`apps/web/src/router.tsx` 和 canonical route 本轮未修改。所有初始工作树修改、未跟踪内容和 `* 2` 文件均保留。

## 安全检查

- 两组真实安全输入值在本轮修改文件中的精确匹配扫描：通过。
- JWT、长 `sk-`、PEM private key 模式扫描：通过。
- Access token Web Storage/IndexedDB source scan：通过。
- Legacy `New-Api-User` source scan：通过。
- Key permission failure localStorage/sessionStorage/IndexedDB E2E：通过。
- 后端敏感 detail 不渲染：通过。
- `git diff --check`：通过。
- 真实 `agent-browser` session：全部 logout 并关闭；无 active session。
- 4174/4180：完整回归后仍在监听。

## 仍缺失的证据

1. 没有 staging tenant/session，候选 staging host 仍无地址记录。
2. 没有真实受限账户 C，Foundation 四区域的真实功能级 403 未完成。
3. 没有真实管理员登录账户；管理员登录、入口和管理员资源权限只完成契约覆盖。
4. Production Foundation URL 虽为 HTTP 200，但实际显示本地化 404 页面，未形成 deployed Foundation UI 验收证据。
5. 没有明确的跨 tenant 模型或 tenant 标识；本轮关闭的是两个独立用户 owner/non-owner 资源边界，不扩大为跨租户结论。
6. 本地后端源码与 production 对部分权限失败的 HTTP 状态仍不一致；production Key 非自有/缺失继续使用 HTTP 200 业务失败。
7. 2FA、OAuth、OAuth bind 和管理员登录仍没有真实账户验收。

## Gate 与 R56 判断

**Permission Gate：FAILED / 未真正通过。**

已关闭：双普通账户 owner/non-owner、missing-resource 等价性、普通用户 admin 403、匿名/invalid 401、Logs/Analytics self scope、资源清理、前端 401/403/404/200-false 分类与完整回归。

未关闭：staging、真实受限账户四区域 403、真实管理员登录/入口、deployed Foundation UI。

**R56 canonical cutover：NOT APPROVED。** `/$locale/console/*` 必须继续由 `LegacyConsoleShell` 承载。本轮不得执行 R56；只有补齐上述真实角色和部署证据后才能重新评估。
