# Partokens 文档 SPA 架构收敛验收报告

日期：2026-08-22
工作区：`/Users/dj/Desktop/partokens/partokens-ui`

## 结论

独立 Next.js/Fumadocs 文档运行时已删除。开发和发布均只保留一个 Web SPA 前端；七种语言的 `/{locale}/docs`、Models、About、Home、Auth 与 Console 路由共用同一套 TanStack Router、Web 导航、主题和静态制品。`packages/docs-sync` 作为只读上游兼容性检查工具保留。

功能、类型、单元测试、受影响 E2E、构建、打包、release verify、production-mode smoke 和真实浏览器验收均通过。代码与制品达到技术验收标准，但尚不应直接上线：当前 Git 远端推导的候选源码地址 `https://github.com/1251240000/ptk-frontend` 匿名访问返回 HTTP 404，运营方必须先提供匿名可读且固定到完整提交 `271e4be1f5815320214221a5dfbc38ff6da75d5e` 的 `PUBLIC_PARTOKENS_SOURCE_URL`，并从审核后的干净提交重新构建。

## 双服务根因

仓库同时保留了两套文档实现：`apps/docs` 的 Next.js/Fumadocs standalone 应用和 Web SPA 的 `PublicDocsRoute`。Caddy、根命令、锁文件、release manifest、打包与 smoke 契约仍把 locale docs 路由指向端口 3001 和 `.next/standalone`，使 Web 已有文档内容无法成为唯一运行时。与此同时，当前提交遗漏了 Web 的 Models/About 路由，且五个未翻译 locale 被错误回退到简体中文。

## 删除与修改

- 删除整个 `apps/docs`（178 个已跟踪文件）；没有保留空壳、Node server、Fumadocs 样式或端口 3001 契约。
- 更新根 `package.json` 与 `bun.lock`，移除 `dev:docs`、`docs:generate` 和 Next/Fumadocs workspace 依赖；`dev/build/typecheck/test` 只面向 Web 与适用的 release contract。
- 更新 `apps/web/src/router.tsx`，恢复 Models/About，保留所有既有入口，并为 15 个旧 docs 深链建立明确的 SPA hash 重定向。
- 更新 Web 文档正文选择、fallback 提示、Models API 表格、7-locale 单测和 E2E。
- 更新 `Caddyfile.dev`、`deploy/Caddyfile`，移除 `/_docs`、docs origin 和 3001 proxy；Web 静态资源及所有 locale UI 路由统一归属 Web。
- 更新 package/verify/smoke/release contract，使发布包只含 Web 静态制品与部署配置。
- 更新 README、部署环境示例和公共内容指南，删除独立 docs server/PORT 说明。

## 语言策略

- `zh-CN` 使用人工中文正文，`hasLocalizedDocsDocument()` 返回 `true`。
- `en` 使用人工英文正文，`hasLocalizedDocsDocument()` 返回 `true`。
- `zh-TW`、`ja`、`ru`、`fr`、`vi` 使用英文正文，`hasLocalizedDocsDocument()` 返回 `false`，因此显示各自本地化的“当前显示英文版本”提示。
- 五个 fallback locale 的导航、搜索、按钮、文档标题和提示仍保持本地化，不会显示简体中文正文。

## 自动验证

| 命令 | 结果 |
| --- | --- |
| `bun install` | 通过；417 installs / 539 packages，无额外变更 |
| `bun run typecheck` | 通过 |
| `bun run test` | 通过；release contract 5/5，Web 31 files / 186 tests |
| `bun run build` | 通过；bundle budgets 通过 |
| 受影响 Web E2E | 通过；Critical Flows 17/17，Public Content 11/11，共 28/28 |
| `bun run release:package` | 通过 |
| `bun run release:verify` | 通过 |
| `bun run release:smoke` | 通过；production mode 10/10 |
| `git diff --check` | 通过 |

Smoke 覆盖 28 个 Console locale/deep-link 组合、7 个 docs locale、2 个旧 docs 深链、Web health、CSP、COOP/CORP 等安全头、no-store/immutable 缓存、后端 404、原生管理员路由、静态资源和 4 个 lazy Console chunks。

## 浏览器验收

按要求使用 `agent-browser`，并在操作前完整读取技能说明及执行 `agent-browser skills get core`。

- 七个 locale 的 `/docs` 均加载 Web shell；`zh-TW/ja/ru/fr/vi` 显示英文正文和本地化 fallback 提示。
- `/{locale}/`、`/models`、`/about`、`/docs` 正常；匿名 `/console/overview` 跳转登录并保留 redirect。
- Image Studio、Usage Logs 等旧 docs 深链进入对应 SPA 文档 hash，无 404、空白 200 或旧页面。
- 文档返回主页、Console 链接、跨文档导航、语言切换和 hash 保持正常。
- 浅色/深色切换及刷新持久化正常。
- 1280px 桌面和 390x844 移动端无页面级横向溢出；代码块和表格仅在自身容器内滚动。
- 移动侧栏、搜索/清除、代码语言 tabs、复制代码和表格均通过手工浏览器与自动 E2E 检查。
- 浏览器 console messages 和 page errors 均为空。
- 桌面/移动、明/暗截图已人工检查，视觉与现有 Web 应用一致。

## 发布包

最终制品约 3.8 MB，仅包含：

```text
release/
  deploy/
    Caddyfile
    README.md
    environment.example
    staging.environment.example
  release-manifest.json
  web/
    index.html
    manifest.json
    _ui/
    auth/
    brand/
    home/
    public-content/
```

不存在 `release/docs`、`.next/standalone`、`entrypoints.docs`、`docsOrigin` 或 `PARTOKENS_DOCS_ORIGIN`。最终运行时只有 Caddy `:8080`；验收时无 `:3001`、Next 或第二个 docs 进程。

## 上线前人工项

1. 提供匿名可访问、固定到完整 Git 提交的公开源码 URL。当前 SSH remote 为 `git@github.com:1251240000/ptk-frontend.git`，对应 HTTPS 仓库匿名访问返回 404，无法认定为公开来源。
2. 将本任务和用户保留的其他改动审阅、提交后，从干净提交用正式 URL 重建；本地 smoke 为验证脏工作树而显式使用了仅限 loopback 的 `PARTOKENS_SMOKE_ALLOW_DIRTY_LOCAL=true`。
3. 完成以上两项后，重新执行 release preflight/package/verify/smoke，再部署正式制品。
