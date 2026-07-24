# Partokens R2.1 设计系统冻结候选

状态：视觉修订与内部验收完成，等待产品负责人确认冻结  
版本：`R2.1`  
本地评审：`http://127.0.0.1:4180/#system`  
前置方向：`07-redesign-brief.md`

## 1. R2 边界

R2 只冻结视觉与交互语言，不重建业务页面、不接入生产路由，也不发布。

- 新 tokens 使用 `--pt-*` 命名空间。
- 新组件原语使用 `pt-*` class 命名空间。
- 当前 web/docs 使用的旧变量继续保留原值，避免在 R4 前发生视觉变化。
- `design-lab` 是本阶段唯一加载组件原语的应用。
- 完整七语言页面翻译属于 R3；R2 冻结字体、字形和长文本规则。

实现来源：

- `partokens-ui/packages/design-system/src/tokens.css`
- `partokens-ui/packages/design-system/src/primitives.css`
- `partokens-ui/packages/design-system/src/metadata.ts`
- `partokens-ui/apps/design-lab/#system`

## 2. 设计命题

主题：让调用有方向，让创作有回声。  
结构：公共页面使用真实产品窗口表达品牌；登录后的工作区使用数据带、分栏、表格和工具层组织任务。  
标志性模式：`Route Capsule`。近黑命令胶囊负责确定性行动，Relay Blue 圆形终点表示动作将继续推进；Prompt、Canvas、Result 色带描述提示、创作与结果阶段。

必须保持：

- 产品优先，中等信息密度。
- 清楚的页面节奏和可扫读的数据层级。
- Command Ink 负责主要命令，Relay Blue 只负责路由、终点、选中和焦点。
- Prompt Lilac、Canvas Mint、Result Coral 只用于对应工作流的大面积分区，不扩散到所有控件。
- 成功、警告、危险和图表拥有独立色义。

明确禁止：

- 渐变、玻璃拟态、霓虹发光和装饰性光斑。
- 大面积同色系、卡片嵌套和无意义悬浮面板。
- 超过 8px 的普通实体圆角。
- 用颜色作为状态或图表序列的唯一识别方式。
- 匿名页面伪造模型、价格、延迟或可用率数据。

## 3. 语义色

### 浅色

| 角色 | Token | 值 |
| --- | --- | --- |
| 页面背景 / Cloud | `--pt-color-bg-canvas` | `#F6F7FA` |
| 实体表面 | `--pt-color-bg-surface` | `#FFFFFF` |
| 次级表面 | `--pt-color-bg-subtle` | `#EFF1F5` |
| 品牌页脚 | `--pt-color-bg-footer` | `#111318` |
| 主文字 | `--pt-color-text-primary` | `#15171C` |
| 次文字 | `--pt-color-text-secondary` | `#5B606B` |
| 主要命令 / Command | `--pt-color-command-bg` | `#15171C` |
| 路由与焦点 / Relay | `--pt-color-action-primary` | `#3568FF` |
| Prompt 色带 | `--pt-color-band-lilac` | `#E8E2FF` |
| Canvas 色带 | `--pt-color-band-mint` | `#D9F3E9` |
| Result 色带 | `--pt-color-band-coral` | `#FFE2DB` |
| 成功信号 | `--pt-color-success-signal` | `#18A978` |
| 危险文字/行动 | `--pt-color-danger` | `#B42318` |
| 警告文字 | `--pt-color-warning` | `#8A580B` |

### 深色

| 角色 | Token | 值 |
| --- | --- | --- |
| 页面背景 / Cloud | `--pt-color-bg-canvas` | `#111318` |
| 实体表面 | `--pt-color-bg-surface` | `#1A1D23` |
| 次级表面 | `--pt-color-bg-subtle` | `#22262E` |
| 品牌页脚 | `--pt-color-bg-footer` | `#0D0F13` |
| 主文字 | `--pt-color-text-primary` | `#F3F5F7` |
| 次文字 | `--pt-color-text-secondary` | `#B6BEC9` |
| 主要命令 / Command | `--pt-color-command-bg` | `#F4F6F8` |
| 路由与焦点 / Relay | `--pt-color-action-primary` | `#90A9FF` |
| Prompt 色带 | `--pt-color-band-lilac` | `#242134` |
| Canvas 色带 | `--pt-color-band-mint` | `#182A25` |
| Result 色带 | `--pt-color-band-coral` | `#31221F` |
| 成功信号 | `--pt-color-success-signal` | `#3ACB98` |
| 危险文字/行动 | `--pt-color-danger` | `#FF9A93` |
| 警告文字 | `--pt-color-warning` | `#F2C66D` |

关键文字、命令和终点与对应背景的实测对比度为 `4.59:1` 至 `17.93:1`。正文必须达到 `4.5:1`，大字和非文字控件必须达到 `3:1`。

### 数据色板

图表使用 `--pt-color-data-1` 至 `--pt-color-data-6`。序列必须同时提供标签、顺序、形状或表格替代；品牌色不重复承担全部序列。

## 4. 字体与排版

| 职责 | 字体 | 使用范围 |
| --- | --- | --- |
| Display | Geologica 500-700 | 品牌标题、首页章节标题、关键数字 |
| Interface Latin/Cyrillic | Source Sans 3 400-700 | 英语、法语、俄语、越南语界面与正文 |
| Interface CJK | Noto Sans SC / TC / JP | 简中、繁中、日语界面与正文 |
| Data | IBM Plex Mono 400-600 | 密钥、代码、请求 ID、费用、延迟和小型标签 |

七语言字形基线：

| Locale | 文字系统 | 首选字体 |
| --- | --- | --- |
| `zh-CN` | Hans | Noto Sans SC |
| `zh-TW` | Hant | Noto Sans TC |
| `en` | Latin | Source Sans 3 |
| `ja` | Jpan | Noto Sans JP |
| `ru` | Cyrl | Source Sans 3 |
| `fr` | Latin | Source Sans 3 |
| `vi` | Latin | Source Sans 3 |

字号固定为 `11 / 12 / 13 / 15 / 17 / 20 / 24 / 32 / 44px`，不随视口连续缩放。紧凑工具面不使用展示级字号。

## 5. 间距、几何与层级

- 基础间距单位：`4px`。
- 常用节奏：`8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96px`。
- 控件高度：紧凑 `32px`，常规与方形工具 `40px`，主要命令和输入槽 `42px`，移动命令 `44px`。
- 普通控件圆角：`6px`。
- 紧凑元素圆角：`4px`。
- 实体表面、菜单、抽屉和对话框：最多 `8px`。
- 阴影只表示真实层级：菜单、拖动节点、抽屉、对话框和 Toast。
- 公共内容最大宽度：`1180px`。
- 数据工作区最大宽度：`1480px`。
- 阅读内容最大宽度：`752px`。
- 控制台侧栏：`236px`，收起 `68px`。
- 顶栏：`68px`；移动底栏：`64px`。

## 6. 响应式规则

断点按照任务变化命名，不按照设备品牌命名。

| 基准 | 名称 | 规则 |
| --- | --- | --- |
| `320px` | Minimum | 单列、紧凑工具栏，禁止页面级横向滚动 |
| `390px` | Compact | 移动基准，底部导航与全宽表单 |
| `768px` | Navigation | 桌面侧栏切换为抽屉或底部导航 |
| `1024px` | Workspace | 两栏工作区，隐藏次要顶栏工具 |
| `1440px` | Expanded | 完整侧栏、数据带和双栏工作区 |

表格在窄屏优先转换为信息行和详情抽屉；无法转换的开发者数据表只允许组件内部横向滚动，不能造成页面横向溢出。

## 7. 组件状态合同

| 家族 | 必须状态 |
| --- | --- |
| Button / Icon button | default、hover、focus、active、disabled、loading、danger |
| Input / Select | default、focus、filled、disabled、error、help |
| Checkbox / Switch / Segmented | selected 与未选、focus、disabled |
| Tag / Status | neutral、info、success、warning、danger |
| Menu | open、keyboard focus、danger item、Escape close |
| Table | loading、empty、error、filled、overflow、row action |
| Drawer | open、focus entry、focus loop、Escape、backdrop、mobile full height |
| Dialog | native modal、focus trap、Escape、cancel、destructive confirm |
| Feedback | inline、toast、loading、empty、error、success |

组件文案使用主动语态并保持动作名称一致，例如“删除密钥”之后反馈“密钥已删除”。图标按钮必须有 `aria-label` 和 tooltip/title。

主要行动优先使用 `Route Capsule`；次要行动使用柔和填充而不是描边按钮；图标工具保持 `40px` 方形和 `8px` 圆角。危险行动不添加蓝色终点，避免与推进型命令混淆。输入统一使用软底输入槽、左侧语义图标与路由焦点边，错误状态以危险色边和文字共同表达。

## 8. 数据可视化

- 图表先显示结论和时间范围，再显示序列。
- 所有图表提供可访问数据表或等价文本摘要。
- 状态点必须配文字标签。
- 费用、请求和延迟使用等宽数字。
- 真实页面不得把概念数据描述为线上实时数据。
- 多序列颜色必须来自 data tokens，不复用状态色表达不同系列。

## 9. 动效与无障碍

| Token | 时长 | 用途 |
| --- | --- | --- |
| `--pt-motion-fast` | `120ms` | hover、focus、轻量状态 |
| `--pt-motion-base` | `160ms` | 菜单、选择、侧栏变化 |
| `--pt-motion-slow` | `240ms` | 抽屉、对话框、画布工具层 |

`prefers-reduced-motion: reduce` 下三种 token 都降为 `0.01ms`，非必要旋转和位移动画关闭。

冻结门槛：

- 所有核心命令可键盘到达。
- 焦点环可见且不只依赖颜色。
- 抽屉和对话框限制焦点，Escape 可关闭。
- 表单拥有可读标签、帮助和错误关联。
- 动态反馈使用 `role=status`、`role=alert` 或 `aria-live`。
- 图表拥有数据表替代。
- 明暗主题均满足 WCAG 2.1 AA 对比度门槛。

## 10. R3/R4 使用规则

- R3 页面原型只允许使用本文件冻结的 tokens、Route Capsule 和组件状态。
- 页面级新色值必须先提升为语义 token，禁止在业务组件内散落十六进制颜色。
- R3.1 新增稳定的品牌页脚背景与文字语义 token，避免误用会随主题反转的命令按钮 token。
- R3 可补充业务复合组件，但不能改变基础组件的高度、焦点、错误和禁用规则。
- `packages/design-system` 是正式页面的唯一视觉事实来源，统一维护 tokens、基础原语和共享复合组件。
- `apps/web` 与 `apps/docs` 只在应用根入口引用设计系统；页面样式只负责业务布局和页面特有组合，不复制按钮、输入、主题或状态规则。
- 全局颜色、字号、控件尺寸、焦点和状态调整必须回到设计系统包完成；只有特定页面的结构变化才在页面层修改。
- R4 才把当前 web/docs 的旧变量迁移到 `--pt-*`，迁移必须分 Wave 回归。
- R4 迁移完成前不得删除旧 tokens 兼容层。
- New API 接口、认证、钱包、密钥和本地存储契约不由设计系统改变。

## 11. 内部验收

- R2.1 类型检查和生产构建通过。
- `1440x900`、`1024x768`、`768x900`、`390x844`、`320x720` 无页面级横向溢出。
- 浅色和深色评审页均通过视觉检查。
- 七种目标语言字形均在评审页渲染。
- 菜单、开关、分段控件、Toast、抽屉和原生模态框通过交互检查。
- 抽屉首尾 Tab 循环、Escape、背景滚动恢复通过。
- 原生模态框 `:modal`、初始焦点和 Escape 关闭通过。
- reduced motion 媒体模拟通过。
- 浏览器无运行时错误。

完整结果：`partokens-ui/dogfood-output/r21-closeout-report.md`

## 12. 产品评审重点

1. `Route Capsule` 是否形成 Partokens 自己的主要命令识别。
2. 浅色与深色工作流色带是否可以冻结，且不会被误用于所有控件。
3. 三类字体职责和七语言字形是否可以冻结。
4. 42px 主要命令、40px 常规工具与 44px 移动命令是否适合长期使用。
5. 菜单、抽屉、对话框和反馈层级是否清楚。
6. 五个响应式基准是否足以进入全页面高保真原型。
7. 是否批准 R2.1 冻结并进入 R3。
