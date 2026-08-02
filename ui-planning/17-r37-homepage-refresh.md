# Partokens R3.7 主页视觉更新与图像资产规格

状态：方案与亮/暗图像素材已定稿，等待开始开发  
日期：2026-08-01  
图像定稿：2026-08-02  
开发入口：`http://127.0.0.1:4180/#home`

## 1. 目标与范围

本轮在 `partokens-ui/apps/design-lab` 内更新公开主页的内容、视觉层级和有限动效。页面继续采用已确认的 **AI Product Workspace** 方向：以真实的对话、图像工作台和 API 接入场景说明产品，不改造成营销长页或独立品牌站。

必须保留：

- 现有公开页壳层、主题切换、语言切换、移动菜单、页脚和路由行为。
- Hero 中的真实产品预览，以及“对话、图像、API”三种核心工作方式。
- `@partokens/design-system` 的 token、控制件、边界、圆角和克制的技术产品气质。
- 简体中文、繁体中文、英语、日语、俄语、法语、越南语七种 locale；亮色和暗色主题。

本轮不做：

- 增加后端能力、虚构模型价格/用量/客户评价、客户 Logo 墙或未经证实的指标。
- 修改正式 `apps/web`、`apps/docs`、Caddy 或上游 New API。
- 使用渐变、玻璃拟态、装饰球、全页氛围图或大面积阴影替代信息层级。

## 2. 设计决定

### 2.1 主方向：AI 工作路径

主页应被理解为一张可进入产品的“工作路径”：从开始对话，到在画布中创作，再到以 API 将能力接入应用。视觉焦点始终是可读的产品工作台，而不是抽象科技装饰。

- 背景保持 `canvas` / `surface` 的平面层级；路径感由真实的分隔线、功能色块和产品界面中的连接线表达。
- Relay Blue 只用于主行动、当前状态和路径重点；Prompt Lilac、Canvas Mint、Result Coral 分别服务于对话、创作和接入，不扩张为全页主色。
- 生成图片只作为 Image Studio 的真实产物出现在产品预览、画布节点和小型用例区域。不得作为覆盖全页正文的背景图。
- 标题继续使用显示字体，正文和界面使用既有界面字体。字号通过明确断点调整，不以视口宽度连续缩放。

### 2.2 页面结构

| 顺序 | 区块 | 内容与视觉 | 行为 |
| --- | --- | --- | --- |
| 1 | Hero | 品牌名、价值主张、主/次行动、三个可验证能力标签，以及全宽产品工作台预览。预览必须是首屏最大的视觉实体。 | 预览可切换对话、图像、API 三种模式；主行动去控制台，次行动去文档。 |
| 2 | 工作路径 | 将现有 Get started 组织为“对话 -> 创作 -> 接入”三条任务路径，保留三个实际入口和功能色。 | 指向对应控制台工作区或锚定至对应说明，不引入空操作。 |
| 3 | 连续工作流 | 三个交替的产品说明段：延续对话、画布创作、受控接入。每段包含文案、边界说明和真实 UI 模拟。 | 滚动进入时分层显现；图像工作台中的结果使用本规格的素材。 |
| 4 | 工作与信任边界 | 复用并重写现有六项价值主张，使其说明兼容性、本地对话、可追溯用量、权限控制和多语言。 | 保持为可扫描的 3 x 2 信息矩阵，非嵌套卡片。 |
| 5 | 典型任务 | 新增三个小型真实任务：发布检查、视觉探索、应用接入。每项只说明适用场景与可进入的工作区。 | 入口直接进入相应产品区；不显示虚构成效数字。 |
| 6 | FAQ 与页脚 | 继续回答隐私、账号和 API 问题；保持现有联系与法律入口。 | 首项默认展开，其余按原生 `details` 行为展开。 |

移动端顺序不变。Hero 在 390px 与 320px 宽度下先完整显示标题和主行动，再显示简化的产品预览，并在第一屏底部露出工作路径的开始。产品预览切换为图标 Tab，不能通过缩放文字来塞入桌面侧栏。

## 3. 交互与动效

动效只说明状态、层级和工作流，不作为装饰。

- 产品预览 Tab：内容以 `opacity` 和不超过 8px 的 `transform` 过渡，时长使用 `--pt-motion-slow`；切换时不改变预览容器高度。
- 区块进入：使用一次性、可撤销的 reveal 状态，文案、线索和产品视觉依次出现；不使用 scroll-jacking、持续视差或自动播放大场景。
- 图像工作台：提示词至结果节点之间允许极轻的连接线流动，仅在可见区域播放，且总时长不超过 500ms。
- 控件 hover、箭头位移和 FAQ 图标沿用现有 `--pt-motion-fast` / `--pt-motion-base`。
- `prefers-reduced-motion: reduce` 下关闭 reveal 位移、连接线流动和 Tab 过渡，只保留立即可读的状态变化。

键盘焦点、移动菜单的焦点约束、Escape、页面无横向溢出和图片加载失败的稳定占位必须保持现状。

## 4. 内容、i18N 与主题契约

### 4.1 文案组织

公开主页新增或调整的每一处可见文字都进入 `apps/design-lab/src/public-home-copy.ts`。通用壳层文案继续由 `@partokens/i18n` 提供；主页叙事内容只从 `homePageCopy` 读取，避免混合来源。

新增文案至少包含：

- `hero.actions.secondary`、`hero.capabilities[]`、`hero.previewLabel`。
- `sections.startedEyebrow`、`sections.workflowEyebrow`、`sections.trustEyebrow`、`sections.useCasesEyebrow`、`sections.faqEyebrow`。
- 三条工作路径、三项典型任务的 `id`、标题、正文、目标路由和无障碍标签。
- 图像的本地化 `alt`；纯装饰或重复结果图使用空 `alt`。

现有硬编码的 `GET STARTED`、`PRODUCT`、`FAQ`、`Developer console` 等文字必须迁移。列表 React key 必须使用稳定的 `id`，不得使用翻译后的标题。图片中不得出现任何需要翻译的文字、Logo、伪 UI、按钮或水印。

每个语言版本必须独立校对长文案，特别是法语、俄语和日语。布局允许自然换行，不允许靠截断、缩小字体或 CSS 伪元素补文案。切换语言后保持当前页面、主题和可操作状态。

### 4.2 亮色与暗色主题

所有页面表面、边框、遮罩、文字和交互状态必须使用既有 `--pt-*` token。仅在 `.r3-home-page` 范围内新增组合变量；除非全局组件确有缺口，不修改基础 token 色板。

- 亮色：保持 Cloud / Surface 的纸面感，图片以低饱和浅矿物、鼠尾草绿和少量钴蓝为主。
- 暗色：保持 Carbon / Graphite 的层级，图片不是简单压暗；须保留材质细节、暖中性色高光和可辨识的薄荷/钴蓝重点。
- 图片组件显式接收 `theme` 或从稳定主题状态选择资源，文件名必须清楚区分 `-light` 与 `-dark`。切换主题时不闪白、不重排。
- 生成图与正文对比失败时，先调整图片或增加 token 驱动的实体遮罩，不在图片上叠加难以阅读的长文案。

## 5. 开发顺序与文件边界

1. 在 `public-home-copy.ts` 定义完整的主页内容模型，并先补齐七种语言的占位文案和稳定 id。
2. 在 `public-prototype.tsx` 重组 `HomePage`、Hero 预览与工作路径；保留公开页壳层、路由和既有真实产品状态。
3. 在 `public-prototype.css` 以现有 token 重建主页节奏、响应式规则和动效。不要触碰无关的 Console / Auth 样式。
4. 在 `apps/design-lab/public/home/` 接入本规格的 WebP 图片和显式的亮暗资源映射。现有 `public/image-studio/architecture-*.webp` 在替换确认前继续可用。
5. 执行 typecheck、production build 和浏览器截图验收；若新增 reveal JavaScript，补充不启用 JavaScript 或资源加载失败时的静态可读性检查。

主要修改文件：

```text
apps/design-lab/src/public-home-copy.ts
apps/design-lab/src/public-prototype.tsx
apps/design-lab/src/public-prototype.css
apps/design-lab/public/home/*
```

## 6. 图像资产清单

没有专用的全页背景图。页面背景由设计系统 token 和实体分隔线组成；以下图片作为 Image Studio 中可被用户理解为“生成结果”的素材。

| 优先级 | 文件名 | 使用位置 | 导出尺寸 | 比例与裁切 |
| --- | --- | --- | --- | --- |
| P0 | `home-studio-atlas-light.webp` | Hero 的图像模式、图像工作台结果节点、典型任务的视觉探索项 | 1448 x 1086 px | 4:3；主体保留在中部 80%，四边各留 10% 裁切安全区。 |
| P0 | `home-studio-atlas-dark.webp` | 上述位置的暗色主题版本 | 1448 x 1086 px | 与浅色版构图、主体位置和镜头完全一致。 |
| P1 | `home-studio-detail-light.webp` | Hero 图像模式的第二张小图、图像工作台中的次级素材 | 1254 x 1254 px | 1:1；主体偏中右，预留左下角缩略图裁切。 |
| P1 | `home-studio-detail-dark.webp` | 上述位置的暗色主题版本 | 1254 x 1254 px | 与浅色版构图、主体位置和镜头完全一致。 |

### 6.1 已定稿的亮色与暗色参考

| 目标资源 | 定稿源文件 | 实际尺寸 | 选择理由 |
| --- | --- | --- | --- |
| `home-studio-atlas-light.webp` | `ui-images/image-1 (3).png` | 1448 x 1086 px | 钴蓝立柱位于安全裁切区内，半透明薄荷玻璃和水面提供层次；在方形结果节点居中裁切后仍保留清楚的空间关系。 |
| `home-studio-atlas-dark.webp` | `ui-images/image-3 (2).png` | 1448 x 1086 px | 保留了浅色版构图，薄荷玻璃、钴蓝立柱和石材暗部仍可分辨；暖光克制，不会在暗色 UI 内形成偏黄的大面积焦点。 |
| `home-studio-detail-light.webp` | `ui-images/image-3 (1).png` | 1254 x 1254 px | 石材、金属、玻璃和钴蓝连接件有明确材质层次，左下有足够安静留白，适合缩略图和叠放节点。 |
| `home-studio-detail-dark.webp` | `ui-images/image-1 (5).png` | 1254 x 1254 px | 四类材质和蓝色连接件在缩略尺寸下仍有分离度；局部暖金属高光提供焦点，但没有破坏整体冷静的暗色环境。 |

导出要求：sRGB、无 alpha、WebP 质量约 82、单个文件不超过 350 KB。保留无损源文件供后续裁切，但不要将源文件提交至公开静态目录。最终 WebP 保持上述源图尺寸，不放大到预估尺寸。每张图不得包含文字、Logo、界面边框、水印、可识别人物或品牌元素。

## 7. 浅色优先的生成提示词

本轮已按以下流程完成素材定稿：先生成并选定两张浅色主图，在构图、主体、材质和裁切安全区通过检查后，再以浅色成图为唯一参考生成暗色版本。以下提示词作为生成记录和未来重新生成素材时的约束；不要脱离浅色参考图单独重做暗色图。

### 7.1 P0：主页图像工作台主画面

生成文件：`home-studio-atlas-light.webp`  
尺寸：1448 x 1086 px，4:3

```text
Editorial architectural image for an AI image-generation workspace.
A contemporary public pavilion built from pale limestone, translucent sage glass,
brushed aluminum, and one restrained cobalt-blue structural element. Calm morning
daylight, precise geometric composition, a broad central volume with generous
negative space around it, high-end design magazine photography, tactile material
detail, believable scale, quiet and optimistic.

No people, no faces, no text, no typography, no logo, no UI, no dashboard,
no watermark, no gradients, no neon, no purple-dominant palette, no sci-fi city.
4:3 aspect ratio. Keep the meaningful subject inside the central 80 percent of
the frame and leave a clean crop-safe border on all sides.
```

暗色调整提示词。操作时上传已定稿的 `ui-images/image-1 (3).png` 作为参考图；若工具提供参考强度，使用约 70% 至 80%。

```text
Use the supplied light reference image as the exact composition reference.
Preserve the camera angle, crop, pavilion geometry, object placement, proportions,
and negative space. Convert only the lighting and material mood to refined blue hour:
charcoal limestone, deep graphite shadows, softly illuminated sage glass, warm
off-white interior highlights, and the same restrained cobalt-blue structural detail.
Keep clear material separation and realistic contrast; this is not a black overlay
or a simple darkened filter.

No people, no faces, no text, no typography, no logo, no UI, no watermark,
no gradients, no neon, no purple-dominant palette. Output must remain 4:3 and
compositionally identical to the supplied reference.
```

### 7.2 P1：画布次级细节图

生成文件：`home-studio-detail-light.webp`  
尺寸：1254 x 1254 px，1:1

```text
Editorial architectural material study from the same visual world as a calm AI
image studio. A close composition of pale limestone planes, translucent sage glass,
brushed aluminum, and a small cobalt-blue joint; strong but quiet sunlight, refined
shadows, carefully balanced square composition, high-end architecture photography,
tactile surface detail, substantial negative space in the lower-left quadrant.

No people, no faces, no text, no typography, no logo, no UI, no watermark,
no gradients, no neon, no purple-dominant palette, no product mockup.
1:1 aspect ratio. Keep all important material details away from the outer 10 percent
crop-safe border.
```

暗色调整提示词。操作时上传已定稿的 `ui-images/image-3 (1).png` 作为参考图；若工具提供参考强度，使用约 70% 至 80%。

```text
Use the supplied light reference image as the exact composition reference.
Keep every plane, glass edge, metal joint, crop, scale, and lower-left negative-space
area in the same location. Change only the environment to a controlled blue-hour
material study: graphite stone shadows, darkened but transparent sage glass, soft
warm reflected light on aluminum, and the same small cobalt-blue joint.
Preserve fine texture and tonal separation instead of applying a uniform dark filter.

No people, no faces, no text, no typography, no logo, no UI, no watermark,
no gradients, no neon, no purple-dominant palette. Output must remain square and
compositionally identical to the supplied reference.
```

## 8. 验收清单

- 首页在 `1440 x 900`、`1024 x 768`、`768 x 900`、`390 x 844` 和 `320 x 720` 无横向溢出，且首屏均露出下一工作路径。
- 七种 locale 中无英文漏词、文字重叠、不可读截断或图中文字依赖；语言切换不改变当前路由。
- 亮色与暗色均只使用对应主题资源，主题切换后产品预览尺寸不变、图片不闪白。
- 图片在网络失败时具有稳定空间和正确 alt 策略；不影响主行动和页面阅读。
- 所有 CTA 去往实际存在的页面或锚点；没有虚构数字、模型或服务状态。
- 动效、焦点、移动菜单、FAQ 和 Tab 在键盘和 `prefers-reduced-motion` 下保持可用。
- `bun run --filter @partokens/design-lab typecheck` 与 `bun run --filter @partokens/design-lab build` 通过，并完成亮/暗、桌面/移动的截图检查。
