# 使用 Codex 快速配置公开内容

本文用于让 Codex 安全、可重复地修改 Partokens 的公开内容配置，重点覆盖通知和协议的七语内容。

## 重要边界

- 配置目录是 `config/public-content/`。
- 前端已接入这些 JSON。开发服务从 `/public-content/` 读取源配置；构建产物和发布包也会携带完整配置目录。
- 普通内容维护任务不要修改 `apps/web/src/**`、`packages/content/src/**`、`apps/docs/**`、`deploy/**` 或 `../new-api/**`。接入机制变更应作为独立开发任务处理。
- 不要把密码、Token、SMTP 凭据、数据库地址、API Key 或其他秘密写入配置。
- 不要让 Codex 擅自润色用户提供的译文。协议机器译文只能保持 `reviewState: "draft"`，除非内容负责人明确确认已经审核。

支持语言固定为：

```text
zh-CN, zh-TW, en, ja, ru, fr, vi
```

## 推荐工作方式

向 Codex 提交任务时，应明确选择一种模式：

1. **精确录入模式**：你提供七种语言的最终文案。Codex 只能原样录入，不得翻译、润色、统一标点或改写。
2. **待审翻译模式**：你提供一种源语言并明确授权 Codex 翻译。Codex 生成其余六种语言，但必须报告这些内容尚待母语和法务审核；协议的 `reviewState` 保持 `draft`。

每次任务都应要求 Codex：

- 开始前读取 `PUBLIC_CONTENT.md`、本文、目标 JSON 和 `scripts/manage_content.py`。
- 检查并保留已有 Git 改动。
- 只修改本次指定的配置文件和 `manifest.json`。
- 保持 `schemaVersion: 1`、七种语言完整、UTF-8、2 空格缩进和文件末尾换行。
- 更新 `manifest.json` 的 `revision` 和带时区的 `updatedAt`。
- 运行只读校验、单元测试和 `git diff --check`。
- 最终列出修改的文件、版本、日期、翻译来源和待审核项。

## 通知配置

通知位于 `config/public-content/notices.json`。一条通知的结构如下：

```json
{
  "id": "unique-kebab-case-id",
  "version": "2026-08-19.1",
  "publishedAt": "2026-08-19",
  "releaseLabel": "R4.0",
  "enabled": true,
  "locales": {
    "zh-CN": {
      "title": "通知标题",
      "body": "通知正文",
      "highlights": ["重点一", "重点二"]
    }
  }
}
```

实际文件中的 `locales` 必须同时包含全部七种语言，并且每种语言都必须有非空的 `title`、`body` 和 `highlights`。

关键规则：

- `id` 使用小写 kebab-case，且在通知数组中唯一。
- `version` 必须是可识别的分段版本，例如 `2026-08-19.1`，不能写成 `draft`。
- `publishedAt` 必须是有效的 `YYYY-MM-DD` 日期。
- `currentNoticeId` 必须引用一条存在且 `enabled: true` 的通知。
- 新增历史通知时，不要删除旧通知；是否切换当前通知必须在任务中明确说明。
- `policy` 是通知发布规则的七语说明，不应随每条通知自动改写。

### 可直接使用：新增七语通知

将下面提示词中的占位内容替换后交给 Codex：

```text
请在 /Users/dj/Desktop/partokens/partokens-ui 中新增一条公开通知。

先阅读 PUBLIC_CONTENT.md、CODEX_PUBLIC_CONTENT_GUIDE.md、
config/public-content/notices.json 和 scripts/manage_content.py，并检查 git 状态。

采用精确录入模式：以下七语文案必须逐字写入，不得翻译、润色或统一标点。

通知元数据：
- id: <通知 ID>
- version: <版本，例如 2026-08-19.1>
- publishedAt: <YYYY-MM-DD>
- releaseLabel: <标签>
- enabled: true
- 设为当前通知: <是/否>

zh-CN:
- title: <内容>
- body: <内容>
- highlights: <逐条列出>

zh-TW:
- title: <内容>
- body: <内容>
- highlights: <逐条列出>

en:
- title: <内容>
- body: <内容>
- highlights: <逐条列出>

ja:
- title: <内容>
- body: <内容>
- highlights: <逐条列出>

ru:
- title: <内容>
- body: <内容>
- highlights: <逐条列出>

fr:
- title: <内容>
- body: <内容>
- highlights: <逐条列出>

vi:
- title: <内容>
- body: <内容>
- highlights: <逐条列出>

只修改 notices.json 和 manifest.json。更新 manifest revision/updatedAt，保持旧通知不变。
完成后运行：
python3 scripts/manage_content.py --validate
python3 -m unittest discover -s tests -p 'test_*.py'
git diff --check

检查 git diff，确认没有修改前端、packages/content、deploy 或 ../new-api。
```

### 可直接使用：从中文生成待审七语通知

```text
请在 /Users/dj/Desktop/partokens/partokens-ui 中新增一条公开通知。
按照 CODEX_PUBLIC_CONTENT_GUIDE.md 的“待审翻译模式”执行。

源语言是 zh-CN：
- id: <通知 ID>
- version: <版本>
- publishedAt: <YYYY-MM-DD>
- releaseLabel: <标签>
- title: <中文标题>
- body: <中文正文>
- highlights: <中文重点列表>
- 设为当前通知: <是/否>

请生成 zh-TW、en、ja、ru、fr、vi 译文。保留产品名、API、模型名和版本号，
不要增加源文没有的承诺、期限、价格、法律结论或功能。只修改 notices.json 和
manifest.json，并在最终回复中把所有新增译文标记为“待母语审核”。

完成后运行配置校验、Python 单元测试和 git diff --check，并确认未修改前端。
```

## 协议配置

三类协议分别位于：

- `config/public-content/legal/user-agreement.json`
- `config/public-content/legal/service-agreement.json`
- `config/public-content/legal/privacy-policy.json`

每个文件的核心结构为：

```json
{
  "schemaVersion": 1,
  "kind": "user-agreement",
  "version": "2026-08-19.1",
  "effectiveDate": "2026-08-19",
  "reviewState": "draft",
  "locales": {
    "zh-CN": {
      "title": "用户协议",
      "summary": "协议摘要",
      "sections": [
        {
          "title": "章节标题",
          "paragraphs": ["第一段", "第二段"]
        }
      ]
    }
  }
}
```

协议规则：

- 文件名与 `kind` 必须严格一致，不能互换。
- `version` 与 `effectiveDate` 是整份协议的公共元数据，不放在单个语言内。
- 七种语言的章节数量可以因现有原文而不同，Codex 不得为了“统一结构”删除或补写内容。
- 精确录入时，章节顺序、段落边界、邮箱、专有名词、数字和标点均按用户提供内容保存。
- 机器翻译、未完成翻译或尚未经过负责人确认的版本必须使用 `reviewState: "draft"`。
- 只有用户明确说明“七语内容已经完成法务/负责人审核”时，才能改成 `reviewed`。
- 协议变更可能具有法律影响；Codex 的结构校验不能替代法律审查。

### 可直接使用：更新单个协议的七语内容

```text
请在 /Users/dj/Desktop/partokens/partokens-ui 更新 <用户协议/服务协议/隐私政策>。

先阅读 PUBLIC_CONTENT.md、CODEX_PUBLIC_CONTENT_GUIDE.md、目标 legal JSON 和
scripts/manage_content.py，并检查 git 状态。只修改目标协议文件和 manifest.json。

采用精确录入模式。以下内容必须逐字写入，不得润色、补写、删节、调整章节顺序或
统一不同语言的段落结构：

- kind: <user-agreement/service-agreement/privacy-policy>
- version: <版本>
- effectiveDate: <YYYY-MM-DD>
- reviewState: <draft/reviewed；仅在已明确审核时使用 reviewed>

zh-CN:
- title: <标题>
- summary: <摘要>
- sections: <按章节列出 title 和 paragraphs>

zh-TW:
<完整内容>

en:
<完整内容>

ja:
<完整内容>

ru:
<完整内容>

fr:
<完整内容>

vi:
<完整内容>

更新 manifest revision/updatedAt。完成后运行：
python3 scripts/manage_content.py --validate
python3 -m unittest discover -s tests -p 'test_*.py'
git diff --check

另外用脚本或结构化比较确认七种语言都存在、所有章节和段落非空、kind 与文件一致。
最终说明 reviewState、翻译来源和仍需人工审核的语言，不要修改前端。
```

### 可直接使用：从中文协议生成待审译文

```text
请在 /Users/dj/Desktop/partokens/partokens-ui 更新 <协议类型>，按照
CODEX_PUBLIC_CONTENT_GUIDE.md 的“待审翻译模式”执行。

我提供的 zh-CN 内容如下：
<粘贴完整 title、summary、sections 和 paragraphs>

元数据：
- version: <版本>
- effectiveDate: <YYYY-MM-DD>
- reviewState: draft

保留 zh-CN 原文不变，生成 zh-TW、en、ja、ru、fr、vi。翻译必须保持章节和段落映射，
不得增加法律承诺、例外、权利、义务、地区、期限或退款条件。保留 Partokens、New API、
API Key、模型名、邮箱、数字和 URL 的准确性。

只修改目标协议 JSON 和 manifest.json。运行配置校验、Python 单元测试及 git diff --check。
最终逐项列出机器翻译的语言，并明确它们需要母语及法务审核；不得设置 reviewed。
```

## About 和系统配置

About 内容位于 `about.json`，每种语言包含 `title`、`lead`、`body`。系统公开配置位于 `system.json`，仅允许品牌名、Logo、默认语言、支持语言和内容回退语言。

对这两类内容也应沿用精确录入或待审翻译模式。不要迁移首页文案、普通 UI 翻译或文档目录。

## 当前配置快照

以下内容根据当前 `config/public-content/` 整理，更新时间以
`config/public-content/manifest.json` 为准。JSON 文件是可发布正文的唯一事实源；本节用于
快速了解当前配置，不替代对目标 JSON 的读取。

### 全局与系统

- `schemaVersion`: `1`
- `manifest.revision`: `2026-07-20.1`
- `manifest.updatedAt`: `2026-08-19T14:13:50+08:00`
- 品牌名：`Partokens`
- Logo：`https://oss.partokens.com/assets/icons/favicon-96x96.png`
- 默认语言：`en`
- 内容回退语言：`en`
- 支持语言（固定顺序）：`zh-CN`、`zh-TW`、`en`、`ja`、`ru`、`fr`、`vi`
- 当前阶段：About、通知和协议页面已接入这些 JSON；普通 UI 翻译和文档内容仍使用各自现有来源。

### About 当前文案

| 语言 | 标题 | 导语 | 正文 |
| --- | --- | --- | --- |
| `zh-CN` | 让模型调用变得可度量 | Partokens 为开发者提供统一的模型访问入口，并把价格、状态、额度与调用记录放在同一个操作界面中。 | 我们关注请求是否能够成功、实际消耗了多少，以及账户是否可以继续稳定运行。新用户端与 New API 管理后台相互独立，服务端仍负责认证、计费、额度与模型路由。 |
| `zh-TW` | 讓模型呼叫變得可衡量 | Partokens 為開發者提供統一的模型存取入口，並將價格、狀態、額度與呼叫記錄放在同一個操作介面中。 | 我們關注請求能否成功、實際消耗多少，以及帳戶能否持續穩定運作。新使用者端與 New API 管理後台彼此獨立，伺服器仍負責驗證、計費、額度與模型路由。 |
| `en` | Model access you can measure | Partokens gives developers one model-access endpoint and puts price, status, quota, and request history in one operational surface. | The product centers on whether a request can succeed, what it actually consumed, and whether the account is ready to continue. The standalone user UI is independent from New API management; the server remains authoritative for authentication, billing, quota, and routing. |
| `ja` | 測定できるモデルアクセス | Partokens はモデルへの統一された入口を提供し、料金、状態、割り当て、リクエスト履歴を一つの操作画面にまとめます。 | リクエストが成功できるか、何を消費したか、アカウントが継続利用できるかを重視します。認証、課金、割り当て、ルーティングは引き続きサーバーが管理します。 |
| `ru` | Измеримый доступ к моделям | Partokens объединяет доступ к моделям и показывает стоимость, состояние, квоту и историю запросов в одном рабочем интерфейсе. | В центре внимания успешность запроса, фактический расход и готовность аккаунта продолжать работу. Сервер остаётся источником истины для входа, оплаты, квот и маршрутизации. |
| `fr` | Un accès aux modèles que vous pouvez mesurer | Partokens réunit l’accès aux modèles et affiche prix, état, quota et historique dans une même interface opérationnelle. | Nous mettons en avant la réussite d’une requête, sa consommation réelle et la capacité du compte à continuer. Le serveur reste l’autorité pour l’authentification, la facturation, les quotas et le routage. |
| `vi` | Truy cập mô hình với số liệu rõ ràng | Partokens hợp nhất quyền truy cập mô hình và hiển thị giá, trạng thái, hạn mức cùng lịch sử yêu cầu trên một giao diện vận hành. | Sản phẩm tập trung vào khả năng thành công, mức tiêu thụ thực tế và khả năng tiếp tục của tài khoản. Máy chủ vẫn quyết định xác thực, tính phí, hạn mức và định tuyến. |

### 当前通知

- 当前通知 ID：`standalone-ui-phase-1`
- 版本：`2026-07-20.1`
- 发布日期：`2026-07-20`
- 发布标签：`R3.1`
- 状态：`enabled: true`
- 七语文案：

| 语言 | 标题 | 正文 | 重点 |
| --- | --- | --- | --- |
| `zh-CN` | 新版用户端正在独立构建 | 第一阶段包含新的公开页面、认证流程和统一控制台体验。现有 API 服务不受影响。 | 现有 API 服务不受影响。<br>无需修改 New API 源码即可持续改进用户体验。 |
| `zh-TW` | 新版使用者端正在獨立建置 | 第一階段包含新的公開頁面、驗證流程與統一控制台體驗。現有 API 服務不受影響。 | 現有 API 服務不受影響。<br>無需修改 New API 原始碼即可持續改進使用者體驗。 |
| `en` | The standalone user experience is in development | Phase one introduces new public pages, authentication flows, and a unified Console experience. Existing API service is unaffected. | Existing API service is unaffected.<br>User experience can evolve without modifying the New API source. |
| `ja` | 新しいユーザー画面を独立して構築中です | 第1段階では公開ページ、認証フロー、統合されたコンソール体験を導入します。既存の API サービスには影響しません。 | 既存の API サービスには影響しません。<br>New API のソースを変更せずにユーザー体験を改善できます。 |
| `ru` | Новый пользовательский интерфейс разрабатывается отдельно | Первый этап включает публичные страницы, вход и единую консоль. Работа существующего API не изменяется. | Существующий API продолжает работать без изменений.<br>Интерфейс может развиваться без изменения New API. |
| `fr` | La nouvelle expérience utilisateur est développée indépendamment | La première phase apporte les pages publiques, l’authentification et une expérience Console unifiée. Le service API existant reste inchangé. | Le service API existant reste inchangé.<br>L’expérience utilisateur évolue sans modifier le code de New API. |
| `vi` | Trải nghiệm người dùng mới đang được xây dựng độc lập | Giai đoạn một gồm các trang công khai, luồng xác thực và trải nghiệm Console thống nhất. Dịch vụ API hiện tại không bị ảnh hưởng. | Dịch vụ API hiện tại không bị ảnh hưởng.<br>Trải nghiệm người dùng có thể phát triển mà không sửa nguồn New API. |

通知发布规则也已配置七语版本，主题为“版本化通知”，要求重大变更带有新的生效日期和清晰的变更说明。
逐语原文以 [`notices.json`](config/public-content/notices.json) 为准。

### 法律文档状态

三份法律文档的公共元数据均为：`schemaVersion: 1`、版本 `2026-07-20.1`、生效日期
`2026-07-20`、`reviewState: draft`。`draft` 表示内容仍需内容负责人、母语人员和适当的法律审核，
不能当作已审核发布版本。

| 文件 | `zh-CN` 当前内容 | 其他六语当前内容 |
| --- | --- | --- |
| [`user-agreement.json`](config/public-content/legal/user-agreement.json) | 14 节、33 段；包含适用范围、地区、账号与凭据、客户内容、可接受使用、费用退款、可用性、终止、知识产权、隐私、责任限制、争议和联系信息。 | 每种语言 3 节、3 段，属于精简待审版本。 |
| [`service-agreement.json`](config/public-content/legal/service-agreement.json) | 13 节、34 段；包含服务交付、上游依赖、API Key、路由、计费结算、充值退款、可用性、安全、数据、支持和协议关系。 | 每种语言 3 节、3 段，属于精简待审版本。 |
| [`privacy-policy.json`](config/public-content/legal/privacy-policy.json) | 5 节、12 段；包含收集信息、使用方式、存储保护、共享处理、权利选择。 | 每种语言 3 节、3 段，属于精简待审版本。 |

当前没有任何法律文档可以标记为 `reviewed`。更新法律正文时必须保留文件名与 `kind` 一致，
并在最终结果中列明译文来源和仍待审核的语言。

### 当前配置检查结果

在当前快照上已执行：

```text
python3 scripts/manage_content.py --validate  -> 配置校验通过
python3 -m unittest discover -s tests -p 'test_*.py' -> 9 tests, OK
```

若修改配置，仍需重新执行上述命令、`git diff --check` 和 `git status --short`；不要仅凭本节
快照判断发布状态。

## 验收命令

在项目根目录运行：

```bash
python3 scripts/manage_content.py --validate
python3 -m unittest discover -s tests -p 'test_*.py'
git diff --check
git status --short
```

校验成功只说明 JSON 结构、日期、版本、语言、引用和必填字段满足约束。发布通知或协议前，仍需检查：

- 七语内容是否来自明确来源。
- 机器译文是否完成母语审核。
- 协议是否完成适当的法律和内容负责人审核。
- `currentNoticeId`、`enabled`、版本和日期是否符合本次发布意图。
- Git diff 是否仅包含预期的配置文件和 `manifest.json`。

## 当前阶段的发布提醒

本地开发服务会直接读取 `config/public-content/`。生产发布时，构建会生成 `apps/web/dist/public-content/`，发布打包会复制到 `release/web/public-content/`，Caddy 以 `Cache-Control: no-store` 提供这些文件。内容变更应通过完整的版本化发布候选原子部署，不要只覆盖线上 `current` 目录中的单个 JSON；回滚时也必须回滚整套配置。
