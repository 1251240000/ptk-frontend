# 管理员渠道运营台原型实施提示词

基于以下权威文档，在现有 Partokens 控制台内实现管理员渠道运营台交互原型：

- `ui-planning/18-admin-channel-operations-product-design.md`
- `ui-planning/07-redesign-brief.md`
- `ui-planning/README.md`

## 实现位置与集成方式

- 原型代码放在 `partokens-ui/apps/design-lab`。
- 必须复用现有 `ConsoleShell`、控制台侧栏、顶栏、主题、语言入口和移动端导航行为。
- 在现有控制台导航中增加仅 Root 可见的“管理员”分组，包含渠道、分组路由、监控和变更记录。
- 必须复用 `@partokens/design-system/components` 中的 Button、Input、Select、Table、Sheet、Dialog、Tabs、Badge、Tooltip 等组件。
- 不得创建第二套应用壳、侧栏、顶栏、主题 token、全局样式系统或大段页面专属 CSS。
- 不修改 `apps/web` 正式路由；不修改 `new-api` 或 `new-api-docs-v1`。

## 原型边界

- 仅使用本地示例状态，不接生产 API，不实现正式业务逻辑。
- API 密钥只表现为遮罩、已登记或待登记状态；不得出现真实或仿真的完整密钥值。
- 不使用 localStorage、日志、URL 或截图保存密钥。
- 成本倍率只标注“展示参考”，不参与计费、路由或毛利计算。
- 非标准渠道只展示基本属性，不提供编辑、测试、启停或绑定操作。

## 页面与交互

- 渠道：搜索、状态/类型筛选、桌面表格、移动信息行、详情 Sheet、新建/编辑 Sheet、敏感状态、非标准只读详情。
- 分组路由：plus/pro 切换、尝试层、相对整数权重、归一化百分比、添加/移除渠道、跨层重复排除、模型覆盖校验、变更预览。
- 监控：问题队列、逻辑渠道与底层执行记录健康、24h 尝试成功率及“暂无数据”、路由就绪矩阵。
- 变更记录：进行中、成功、部分失败、继续执行、重新核对和底层 ID。

示例数据固定为：A/B `0.08x`、C `0.09x`、D `0.12x`、E `0.16x`；plus 为 `A/B -> C`，pro 为 `C -> D`。同层是候选池，不承诺同层渠道之间的固定先后顺序。

## 视觉与验证

- 延续现有 Partokens 中等密度控制台；使用工具栏、数据带、表格、分隔线、Sheet 和 Dialog。
- 不使用营销 Hero、渐变、玻璃拟态、装饰光斑、嵌套卡片或自造插图。
- 同时支持浅色、深色、桌面和 390px 移动端。
- 完成后启动 design-lab，使用 agent-browser 逐项点击验证并截图；检查页面级横向溢出、文字遮挡、主题、空白页面和控制台错误。
- 运行 design-lab 的 typecheck 和 build。
