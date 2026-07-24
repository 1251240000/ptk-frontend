# R1 产品工作区原型评审单

状态：R1 已完成并由产品负责人确认，R2 已启动  
本地入口：`http://127.0.0.1:4180/`

## 页面入口

| 页面 | 地址 |
| --- | --- |
| 首页 | `http://127.0.0.1:4180/#home` |
| 登录 | `http://127.0.0.1:4180/#signin` |
| 控制台概览 | `http://127.0.0.1:4180/#console` |

原型独立位于 `partokens-ui/apps/design-lab/`，不属于正式应用构建、路由或 Caddy 配置。

## 可评审交互

- 首页按 Hero、Get started、功能介绍、价值关键词、FAQ、外链/联系的顺序组织。
- Hero 直接展示对话产品实景；模型和价格在访客态不加载，并引导用户登录。
- Get started 提供对话、生图工作台和 API 密钥三条明确入口。
- 功能介绍分别展示本地对话、无限画布和账户数据管理的界面形态。
- 首页、登录和控制台之间可以互相进入。
- 登录页产品窗口展示登录后真实可进入的对话、生图和 API 密钥去向，同时呈现服务状态与本地会话边界。
- 登录页协议勾选会启用登录和 OAuth 行动；原型不会提交账户信息。
- 控制台使用连续指标带，并按“用量与下一步行动 -> 最近请求与 API 接入”的层级组织概览。
- 控制台支持侧栏收起、移动端导航、主题切换、语言切换和接入点复制反馈；移动导航内也可使用语言和主题工具。
- `/api/status` 通过独立开发代理读取真实服务状态和版本。

## 语言与主题

R1 提供简体中文、法语和俄语，用于验证 CJK、西里尔文字和长拉丁文本。完整七语言只在设计系统方向通过后扩展，避免在被否决的视觉方向上重复翻译原型文案。

浅色和深色主题均已实现；主题变化覆盖公共页面、表单、控制台、菜单、状态和图表。

## 浏览器证据

- 首页，简体中文，1440x900，浅色：`partokens-ui/dogfood-output/screenshots/redesign-r1-home-zh-desktop-light-v2.png`
- 首页完整长页，简体中文，1440px，浅色：`partokens-ui/dogfood-output/screenshots/redesign-r1-home-zh-desktop-light-v2-full.png`
- 登录，简体中文，1440x900，浅色：`partokens-ui/dogfood-output/screenshots/redesign-r1-signin-zh-desktop-light-v2.png`
- 控制台，简体中文，1440x900，浅色：`partokens-ui/dogfood-output/screenshots/redesign-r1-console-zh-desktop-light-v2.png`
- 首页，法语，390x844，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-home-fr-mobile-dark-v2.png`
- 首页完整长页，法语，390px，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-home-fr-mobile-dark-v2-full.png`
- 登录，法语，390x844，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-signin-fr-mobile-dark-v2.png`
- 登录完整长页，法语，390px，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-signin-fr-mobile-dark-v2-full.png`
- 控制台，法语，390x844，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-console-fr-mobile-dark-v2.png`
- 控制台完整长页，法语，390px，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-console-fr-mobile-dark-v2-full.png`
- 控制台移动导航，法语，390x844，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-console-fr-mobile-sidebar-dark-v2.png`
- 控制台，俄语，1440x900，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-console-ru-desktop-dark-v2.png`
- 控制台移动导航，俄语，深色：`partokens-ui/dogfood-output/screenshots/redesign-r1-console-ru-mobile-sidebar-dark-v2.png`

检查结果：`1440x900`、`1024x768`、`390x844` 和 `320x720` 下均无横向溢出、页面异常或控制台脚本错误；类型检查和生产构建通过。完整结果见 `partokens-ui/dogfood-output/r1-closeout-report.md`。

## 评审重点

1. Hero 是否能在第一屏同时讲清 Partokens、立即使用入口和真实产品形态。
2. Get started 到功能介绍的阅读顺序是否符合用户决策过程。
3. 三组产品实景是否准确表达对话、生图和 API 管理的核心能力。
4. 关键词和 FAQ 是否覆盖首页需要回答的关键信任问题。
5. 登录页是否在品牌表现和操作效率之间达到合适平衡。
6. 控制台中等密度、信息层级和侧栏结构是否适合长期使用。
7. 色彩、字体、按钮和面板是否可以进入 R2 设计系统冻结。

## 当前限制

- 指标、请求记录和账户姓名是明确标注的概念数据。
- 原型不发起真实登录、OAuth、密钥、聊天或生图请求。
- 模型和价格不会匿名加载，符合已确认的生产权限。
- 模型广场、文档、关于等按钮暂时只显示“后续原型补充”的反馈。

## R1 结论与下一步

R1 已完成实现、响应式检查、长文本压力测试、关键交互检查和构建验证，目前没有未关闭的 R1 验收问题。产品负责人已于 2026-07-22 确认当前方向并进入 R2；R2 结果见 `10-r2-design-system.md`。
