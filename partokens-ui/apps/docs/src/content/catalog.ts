import type { DocsLocale } from '@/lib/locales'

export type PageId =
  | 'overview'
  | 'authentication'
  | 'first-request'
  | 'models-and-groups'
  | 'chat-guide'
  | 'image-guide'
  | 'errors-and-limits'
  | 'api-chat-completions'
  | 'api-responses'
  | 'api-embeddings'
  | 'api-image-generations'
  | 'api-image-edits'
  | 'api-audio-transcriptions'
  | 'api-models'

export type GuidePageId = Exclude<PageId, `api-${string}`>
export type ApiPageId = Extract<PageId, `api-${string}`>

export type PageDefinition = {
  id: PageId
  slug: string
  group: 'start' | 'guides' | 'api'
  kind: 'guide' | 'api'
}

export type GuideSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
  code?: string
  tone?: 'default' | 'note' | 'warning'
}

export type GuideCopy = {
  title: string
  description: string
  sections: GuideSection[]
}

export type DocsUiCopy = {
  brand: string
  home: string
  console: string
  models: string
  about: string
  sourceDraft: string
  sourceDraftDescription: string
  onThisPage: string
  method: string
  endpoint: string
  authentication: string
  bearerKey: string
  requestFields: string
  field: string
  type: string
  required: string
  description: string
  yes: string
  no: string
  exampleRequest: string
  exampleResponse: string
  responseNotes: string
  availabilityNote: string
  copy: string
  copied: string
  createKey: string
  openModels: string
  groupStart: string
  groupGuides: string
  groupApi: string
  previous: string
  next: string
  translationStatus: string
}

export const pageDefinitions: PageDefinition[] = [
  { id: 'overview', slug: '', group: 'start', kind: 'guide' },
  { id: 'authentication', slug: 'getting-started/authentication', group: 'start', kind: 'guide' },
  { id: 'first-request', slug: 'getting-started/first-request', group: 'start', kind: 'guide' },
  { id: 'models-and-groups', slug: 'guides/models-and-groups', group: 'guides', kind: 'guide' },
  { id: 'chat-guide', slug: 'guides/chat', group: 'guides', kind: 'guide' },
  { id: 'image-guide', slug: 'guides/images', group: 'guides', kind: 'guide' },
  { id: 'errors-and-limits', slug: 'guides/errors-and-limits', group: 'guides', kind: 'guide' },
  { id: 'api-chat-completions', slug: 'api/chat-completions', group: 'api', kind: 'api' },
  { id: 'api-responses', slug: 'api/responses', group: 'api', kind: 'api' },
  { id: 'api-embeddings', slug: 'api/embeddings', group: 'api', kind: 'api' },
  { id: 'api-image-generations', slug: 'api/image-generations', group: 'api', kind: 'api' },
  { id: 'api-image-edits', slug: 'api/image-edits', group: 'api', kind: 'api' },
  { id: 'api-audio-transcriptions', slug: 'api/audio-transcriptions', group: 'api', kind: 'api' },
  { id: 'api-models', slug: 'api/models', group: 'api', kind: 'api' },
]

export const uiCopy: Record<DocsLocale, DocsUiCopy> = {
  'zh-CN': {
    brand: 'Partokens 文档', home: '主页', console: '控制台', models: '模型广场', about: '关于',
    sourceDraft: '翻译待审核', sourceDraftDescription: '此版本由中文源稿翻译，等待产品负责人审核。', onThisPage: '本页内容',
    method: '方法', endpoint: '端点', authentication: '鉴权', bearerKey: 'Bearer API 密钥', requestFields: '请求字段',
    field: '字段', type: '类型', required: '必填', description: '说明', yes: '是', no: '否', exampleRequest: '请求示例',
    exampleResponse: '响应示例', responseNotes: '响应说明', availabilityNote: '模型与参数可用性以模型广场及账户分组实时配置为准。',
    copy: '复制代码', copied: '已复制', createKey: '创建 API 密钥', openModels: '查看可用模型', groupStart: '开始使用',
    groupGuides: '使用指南', groupApi: 'API 参考', previous: '上一页', next: '下一页', translationStatus: '内容状态：待审核',
  },
  'zh-TW': {
    brand: 'Partokens 文件', home: '首頁', console: '控制台', models: '模型廣場', about: '關於',
    sourceDraft: '翻譯待審核', sourceDraftDescription: '此版本由簡體中文源稿翻譯，等待產品負責人審核。', onThisPage: '本頁內容',
    method: '方法', endpoint: '端點', authentication: '驗證', bearerKey: 'Bearer API 金鑰', requestFields: '請求欄位',
    field: '欄位', type: '類型', required: '必填', description: '說明', yes: '是', no: '否', exampleRequest: '請求範例',
    exampleResponse: '回應範例', responseNotes: '回應說明', availabilityNote: '模型與參數可用性以模型廣場及帳戶群組的即時設定為準。',
    copy: '複製程式碼', copied: '已複製', createKey: '建立 API 金鑰', openModels: '查看可用模型', groupStart: '開始使用',
    groupGuides: '使用指南', groupApi: 'API 參考', previous: '上一頁', next: '下一頁', translationStatus: '內容狀態：待審核',
  },
  en: {
    brand: 'Partokens Docs', home: 'Home', console: 'Console', models: 'Models', about: 'About',
    sourceDraft: 'Translation pending review', sourceDraftDescription: 'This version was translated from the Simplified Chinese source and awaits product-owner review.', onThisPage: 'On this page',
    method: 'Method', endpoint: 'Endpoint', authentication: 'Authentication', bearerKey: 'Bearer API key', requestFields: 'Request fields',
    field: 'Field', type: 'Type', required: 'Required', description: 'Description', yes: 'Yes', no: 'No', exampleRequest: 'Example request',
    exampleResponse: 'Example response', responseNotes: 'Response notes', availabilityNote: 'Model and parameter availability follows the live model marketplace and account-group configuration.',
    copy: 'Copy code', copied: 'Copied', createKey: 'Create API key', openModels: 'View available models', groupStart: 'Get started',
    groupGuides: 'Guides', groupApi: 'API reference', previous: 'Previous', next: 'Next', translationStatus: 'Content status: pending review',
  },
  ja: {
    brand: 'Partokens ドキュメント', home: 'ホーム', console: 'コンソール', models: 'モデル', about: '概要',
    sourceDraft: '翻訳レビュー待ち', sourceDraftDescription: 'この版は簡体字中国語の原稿から翻訳され、プロダクト責任者のレビュー待ちです。', onThisPage: 'このページの内容',
    method: 'メソッド', endpoint: 'エンドポイント', authentication: '認証', bearerKey: 'Bearer API キー', requestFields: 'リクエストフィールド',
    field: 'フィールド', type: '型', required: '必須', description: '説明', yes: 'はい', no: 'いいえ', exampleRequest: 'リクエスト例',
    exampleResponse: 'レスポンス例', responseNotes: 'レスポンスの説明', availabilityNote: 'モデルとパラメータの利用可否は、モデル一覧とアカウントグループのリアルタイム設定に従います。',
    copy: 'コードをコピー', copied: 'コピーしました', createKey: 'API キーを作成', openModels: '利用可能なモデルを見る', groupStart: 'はじめに',
    groupGuides: '利用ガイド', groupApi: 'API リファレンス', previous: '前へ', next: '次へ', translationStatus: 'コンテンツ状態：レビュー待ち',
  },
  ru: {
    brand: 'Документация Partokens', home: 'Главная', console: 'Консоль', models: 'Модели', about: 'О сервисе',
    sourceDraft: 'Перевод ожидает проверки', sourceDraftDescription: 'Эта версия переведена с упрощенного китайского и ожидает проверки владельцем продукта.', onThisPage: 'На этой странице',
    method: 'Метод', endpoint: 'Эндпоинт', authentication: 'Аутентификация', bearerKey: 'API-ключ Bearer', requestFields: 'Поля запроса',
    field: 'Поле', type: 'Тип', required: 'Обязательно', description: 'Описание', yes: 'Да', no: 'Нет', exampleRequest: 'Пример запроса',
    exampleResponse: 'Пример ответа', responseNotes: 'Описание ответа', availabilityNote: 'Доступность моделей и параметров определяется текущими настройками каталога и группы аккаунта.',
    copy: 'Копировать код', copied: 'Скопировано', createKey: 'Создать API-ключ', openModels: 'Доступные модели', groupStart: 'Начало работы',
    groupGuides: 'Руководства', groupApi: 'Справочник API', previous: 'Назад', next: 'Далее', translationStatus: 'Статус: ожидает проверки',
  },
  fr: {
    brand: 'Documentation Partokens', home: 'Accueil', console: 'Console', models: 'Modèles', about: 'À propos',
    sourceDraft: 'Traduction en attente de validation', sourceDraftDescription: 'Cette version a été traduite depuis la source chinoise simplifiée et attend la validation du responsable produit.', onThisPage: 'Sur cette page',
    method: 'Méthode', endpoint: 'Point de terminaison', authentication: 'Authentification', bearerKey: 'Clé API Bearer', requestFields: 'Champs de requête',
    field: 'Champ', type: 'Type', required: 'Requis', description: 'Description', yes: 'Oui', no: 'Non', exampleRequest: 'Exemple de requête',
    exampleResponse: 'Exemple de réponse', responseNotes: 'Notes sur la réponse', availabilityNote: 'La disponibilité des modèles et paramètres dépend du catalogue et de la configuration du groupe de compte en temps réel.',
    copy: 'Copier le code', copied: 'Copié', createKey: 'Créer une clé API', openModels: 'Voir les modèles disponibles', groupStart: 'Bien démarrer',
    groupGuides: 'Guides', groupApi: 'Référence API', previous: 'Précédent', next: 'Suivant', translationStatus: 'État du contenu : en attente de validation',
  },
  vi: {
    brand: 'Tài liệu Partokens', home: 'Trang chủ', console: 'Bảng điều khiển', models: 'Mô hình', about: 'Giới thiệu',
    sourceDraft: 'Bản dịch đang chờ duyệt', sourceDraftDescription: 'Phiên bản này được dịch từ bản gốc tiếng Trung giản thể và đang chờ chủ sản phẩm duyệt.', onThisPage: 'Trong trang này',
    method: 'Phương thức', endpoint: 'Endpoint', authentication: 'Xác thực', bearerKey: 'Khóa API Bearer', requestFields: 'Trường yêu cầu',
    field: 'Trường', type: 'Kiểu', required: 'Bắt buộc', description: 'Mô tả', yes: 'Có', no: 'Không', exampleRequest: 'Ví dụ yêu cầu',
    exampleResponse: 'Ví dụ phản hồi', responseNotes: 'Ghi chú phản hồi', availabilityNote: 'Tính khả dụng của mô hình và tham số phụ thuộc vào cấu hình hiện tại trong quảng trường mô hình và nhóm tài khoản.',
    copy: 'Sao chép mã', copied: 'Đã sao chép', createKey: 'Tạo khóa API', openModels: 'Xem mô hình khả dụng', groupStart: 'Bắt đầu',
    groupGuides: 'Hướng dẫn', groupApi: 'Tham chiếu API', previous: 'Trang trước', next: 'Trang sau', translationStatus: 'Trạng thái nội dung: chờ duyệt',
  },
}

const requestExample = `curl https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-model","messages":[{"role":"user","content":"Hello"}]}'`

export const guideCopy: Record<DocsLocale, Record<GuidePageId, GuideCopy>> = {
  'zh-CN': {
    overview: { title: '从一个可控请求开始', description: '创建密钥、确认模型，然后发送第一条 OpenAI 兼容请求。', sections: [
      { id: 'path', title: '最短调用路径', paragraphs: ['Partokens 使用统一的 OpenAI 兼容入口。完成下面三个步骤即可验证账户、路由和模型是否可用。'], bullets: ['在控制台创建有限额度、有限模型范围的 API 密钥。', '在模型广场确认当前账户分组可用的模型名。', '向 https://partokens.com/v1 发送带 Bearer 密钥的请求。'] },
      { id: 'boundary', title: '先理解服务边界', paragraphs: ['密钥用于识别调用方并结算用量。请求内容会经过 Partokens 网关并发送给所选模型提供商；请不要在请求中放入不必要的敏感信息。'], tone: 'note' },
      { id: 'first', title: '验证第一条请求', paragraphs: ['成功响应后，在控制台的使用日志中核对模型、令牌、费用与延迟。'], code: requestExample },
    ] },
    authentication: { title: '鉴权与密钥安全', description: '用范围受限的 Bearer 密钥调用 API，并避免凭证泄露。', sections: [
      { id: 'bearer', title: '发送 Bearer 密钥', paragraphs: ['每个 API 请求都应包含 Authorization 请求头，值为 Bearer 后跟完整 API 密钥。'] },
      { id: 'scope', title: '缩小密钥范围', paragraphs: ['为不同应用创建独立密钥，并设置额度、过期时间、模型白名单、分组与 IP 限制。密钥只在创建或明确确认揭示时显示。'] },
      { id: 'storage', title: '不要把密钥放入客户端', paragraphs: ['不要把密钥写进浏览器代码、移动应用包、URL、日志或公开仓库。服务端环境变量或专用密钥管理器是更合适的存放位置。'], tone: 'warning' },
    ] },
    'first-request': { title: '发送第一条请求', description: '用 curl 完成调用，并从日志验证计费结果。', sections: [
      { id: 'prepare', title: '准备模型与密钥', paragraphs: ['先从模型广场复制准确的模型名，再从控制台创建只允许该模型的测试密钥。'] },
      { id: 'send', title: '发送请求', paragraphs: ['将 your-model 替换为实际模型名，并在当前终端设置 PARTOKENS_API_KEY。'], code: requestExample },
      { id: 'verify', title: '检查响应与日志', paragraphs: ['HTTP 200 表示网关已完成请求。打开使用日志核对请求时间、模型、令牌消耗、费用和延迟；失败请求也会提供可用于排查的信息。'] },
    ] },
    'models-and-groups': { title: '模型、分组与能力', description: '根据账户实时配置选择可用模型和计费分组。', sections: [
      { id: 'model-name', title: '使用准确的模型名', paragraphs: ['请求中的 model 必须与模型广场显示的名称一致。相似名称可能指向不同提供商、版本或能力。'] },
      { id: 'groups', title: '理解分组', paragraphs: ['分组决定可用路由与倍率。控制台只展示当前账户可用分组，不应在客户端假设固定分组名。'] },
      { id: 'capabilities', title: '按能力发送参数', paragraphs: ['图像尺寸、质量、背景、流式输出和工具调用等参数并非所有模型都支持。先查看模型说明，只发送需要且明确支持的字段。'], tone: 'note' },
    ] },
    'chat-guide': { title: '聊天与流式输出', description: '选择 Chat Completions 或 Responses，并正确处理增量事件。', sections: [
      { id: 'choose', title: '选择接口', paragraphs: ['已有 OpenAI Chat Completions 客户端时可直接使用 /v1/chat/completions。新集成可在模型支持时使用 /v1/responses。'] },
      { id: 'stream', title: '处理流式响应', paragraphs: ['stream=true 时，客户端应逐条处理服务端事件，合并文本增量，并在结束标记后关闭连接。用户取消时同时中止网络请求。'] },
      { id: 'history', title: '只发送必要上下文', paragraphs: ['模型不会自动记住之前的请求。需要连续对话时，由应用选择并发送相关历史，同时控制上下文长度与隐私范围。'] },
    ] },
    'image-guide': { title: '图像生成与编辑', description: '在模型能力允许时使用生成或 multipart 编辑接口。', sections: [
      { id: 'generate', title: '从提示词生成', paragraphs: ['向 /v1/images/generations 发送 JSON。常用字段包括 model、prompt、n、size 与 quality。'] },
      { id: 'edit', title: '编辑源图', paragraphs: ['编辑请求使用 multipart/form-data，并上传 image、prompt 与 model。掩膜及额外字段仅在目标模型明确支持时发送。'] },
      { id: 'retain', title: '及时保存结果', paragraphs: ['响应可能返回临时 URL 或 base64。需要长期保留时应尽快下载到你控制的存储；生图工作台保存的项目和图片只在当前浏览器。'], tone: 'note' },
    ] },
    'errors-and-limits': { title: '错误、限额与重试', description: '区分可修复输入、鉴权、额度与上游故障。', sections: [
      { id: 'status', title: '先看 HTTP 状态', paragraphs: ['400 通常表示字段或模型不兼容，401 表示密钥无效，403 表示权限或策略限制，429 表示速率或额度限制，5xx 表示网关或上游暂时不可用。'] },
      { id: 'request-id', title: '保留请求信息', paragraphs: ['排查时记录时间、模型、HTTP 状态与响应中的请求标识，但不要记录完整密钥或敏感提示词。控制台使用日志可提供计费与路由上下文。'] },
      { id: 'retry', title: '只重试暂时性失败', paragraphs: ['对 429 和部分 5xx 使用带抖动的指数退避，并设置最大次数。不要自动重试无效参数、鉴权失败或可能造成重复副作用的请求。'], tone: 'warning' },
    ] },
  },
  'zh-TW': {
    overview: { title: '從一個可控請求開始', description: '建立金鑰、確認模型，然後送出第一個 OpenAI 相容請求。', sections: [
      { id: 'path', title: '最短呼叫路徑', paragraphs: ['Partokens 使用統一的 OpenAI 相容入口。完成以下三步即可驗證帳戶、路由與模型。'], bullets: ['在控制台建立有限額度及模型範圍的 API 金鑰。', '在模型廣場確認目前帳戶群組可用的模型名稱。', '向 https://partokens.com/v1 送出帶有 Bearer 金鑰的請求。'] },
      { id: 'boundary', title: '先理解服務邊界', paragraphs: ['金鑰用於識別呼叫者並計算用量。請求內容會經過 Partokens 閘道並傳送給所選模型供應商；請勿放入不必要的敏感資料。'], tone: 'note' },
      { id: 'first', title: '驗證第一個請求', paragraphs: ['成功回應後，請在控制台的使用記錄中核對模型、Token、費用與延遲。'], code: requestExample },
    ] },
    authentication: { title: '驗證與金鑰安全', description: '使用範圍受限的 Bearer 金鑰呼叫 API，並避免憑證外洩。', sections: [
      { id: 'bearer', title: '傳送 Bearer 金鑰', paragraphs: ['每個 API 請求都應包含 Authorization 標頭，其值為 Bearer 加上完整 API 金鑰。'] },
      { id: 'scope', title: '縮小金鑰範圍', paragraphs: ['為不同應用建立獨立金鑰，並設定額度、到期時間、模型白名單、群組與 IP 限制。金鑰只會在建立或明確確認揭示時顯示。'] },
      { id: 'storage', title: '不要把金鑰放在客戶端', paragraphs: ['不要把金鑰寫入瀏覽器程式碼、行動應用套件、URL、記錄或公開儲存庫。應使用伺服器環境變數或專用金鑰管理器。'], tone: 'warning' },
    ] },
    'first-request': { title: '送出第一個請求', description: '使用 curl 完成呼叫，並從記錄驗證計費結果。', sections: [
      { id: 'prepare', title: '準備模型與金鑰', paragraphs: ['先從模型廣場複製正確的模型名稱，再從控制台建立只允許該模型的測試金鑰。'] },
      { id: 'send', title: '送出請求', paragraphs: ['將 your-model 替換為實際模型名稱，並在目前終端設定 PARTOKENS_API_KEY。'], code: requestExample },
      { id: 'verify', title: '檢查回應與記錄', paragraphs: ['HTTP 200 表示閘道已完成請求。開啟使用記錄核對時間、模型、Token 用量、費用和延遲。'] },
    ] },
    'models-and-groups': { title: '模型、群組與能力', description: '依帳戶即時設定選擇可用模型與計費群組。', sections: [
      { id: 'model-name', title: '使用正確的模型名稱', paragraphs: ['請求中的 model 必須與模型廣場顯示的名稱一致。相似名稱可能指向不同供應商、版本或能力。'] },
      { id: 'groups', title: '理解群組', paragraphs: ['群組決定可用路由與倍率。控制台只顯示目前帳戶可用群組，客戶端不應假設固定群組名稱。'] },
      { id: 'capabilities', title: '依能力傳送參數', paragraphs: ['圖像尺寸、品質、背景、串流輸出和工具呼叫等參數並非所有模型都支援。只傳送明確支援且必要的欄位。'], tone: 'note' },
    ] },
    'chat-guide': { title: '聊天與串流輸出', description: '選擇 Chat Completions 或 Responses，並正確處理增量事件。', sections: [
      { id: 'choose', title: '選擇介面', paragraphs: ['既有 OpenAI Chat Completions 用戶端可直接使用 /v1/chat/completions。新整合可在模型支援時使用 /v1/responses。'] },
      { id: 'stream', title: '處理串流回應', paragraphs: ['stream=true 時，客戶端應逐項處理伺服器事件、合併文字增量，並在結束標記後關閉連線。取消時也要中止網路請求。'] },
      { id: 'history', title: '只傳送必要內容', paragraphs: ['模型不會自動記住先前請求。連續對話時由應用選擇並傳送相關歷史，同時控制內容長度與隱私範圍。'] },
    ] },
    'image-guide': { title: '圖像生成與編輯', description: '在模型能力允許時使用生成或 multipart 編輯介面。', sections: [
      { id: 'generate', title: '從提示詞生成', paragraphs: ['向 /v1/images/generations 傳送 JSON。常用欄位包括 model、prompt、n、size 與 quality。'] },
      { id: 'edit', title: '編輯來源圖像', paragraphs: ['編輯請求使用 multipart/form-data，並上傳 image、prompt 與 model。遮罩及額外欄位只在目標模型明確支援時傳送。'] },
      { id: 'retain', title: '及時保存結果', paragraphs: ['回應可能包含臨時 URL 或 base64。需要長期保存時應立即下載到自行管理的儲存空間；生圖工作台資料只保存在目前瀏覽器。'], tone: 'note' },
    ] },
    'errors-and-limits': { title: '錯誤、限額與重試', description: '區分可修復輸入、驗證、額度與上游故障。', sections: [
      { id: 'status', title: '先看 HTTP 狀態', paragraphs: ['400 通常表示欄位或模型不相容，401 表示金鑰無效，403 表示權限或政策限制，429 表示速率或額度限制，5xx 表示閘道或上游暫時不可用。'] },
      { id: 'request-id', title: '保留請求資訊', paragraphs: ['排查時記錄時間、模型、HTTP 狀態與請求識別碼，但不要記錄完整金鑰或敏感提示詞。使用記錄可提供計費與路由資訊。'] },
      { id: 'retry', title: '只重試暫時性失敗', paragraphs: ['對 429 和部分 5xx 使用帶抖動的指數退避並限制次數。不要自動重試無效參數、驗證失敗或可能造成重複副作用的請求。'], tone: 'warning' },
    ] },
  },
  en: {
    overview: { title: 'Start with one controlled request', description: 'Create a key, confirm a model, and send your first OpenAI-compatible request.', sections: [
      { id: 'path', title: 'The shortest request path', paragraphs: ['Partokens provides one OpenAI-compatible entry point. These three steps verify your account, route, and model.'], bullets: ['Create an API key with a finite quota and model scope.', 'Confirm the exact model name available to your account group.', 'Send a Bearer-authenticated request to https://partokens.com/v1.'] },
      { id: 'boundary', title: 'Understand the service boundary', paragraphs: ['The key identifies the caller and meters usage. Request content passes through the Partokens gateway to the selected model provider, so avoid unnecessary sensitive data.'], tone: 'note' },
      { id: 'first', title: 'Verify the first request', paragraphs: ['After a successful response, check the model, tokens, cost, and latency in Usage logs.'], code: requestExample },
    ] },
    authentication: { title: 'Authentication and key safety', description: 'Call the API with a scoped Bearer key without exposing credentials.', sections: [
      { id: 'bearer', title: 'Send a Bearer key', paragraphs: ['Every API request must include an Authorization header whose value is Bearer followed by the complete API key.'] },
      { id: 'scope', title: 'Keep the scope narrow', paragraphs: ['Create a separate key for each application and set quota, expiry, model allowlist, group, and IP restrictions. Keys appear only at creation or after an explicit reveal confirmation.'] },
      { id: 'storage', title: 'Keep keys out of clients', paragraphs: ['Do not put keys in browser code, mobile bundles, URLs, logs, or public repositories. Use server-side environment variables or a dedicated secret manager.'], tone: 'warning' },
    ] },
    'first-request': { title: 'Send your first request', description: 'Make a curl call and verify the billing result in Usage logs.', sections: [
      { id: 'prepare', title: 'Prepare a model and key', paragraphs: ['Copy the exact model name from the model marketplace, then create a test key restricted to that model.'] },
      { id: 'send', title: 'Send the request', paragraphs: ['Replace your-model with the real model name and set PARTOKENS_API_KEY in the current terminal.'], code: requestExample },
      { id: 'verify', title: 'Check the response and log', paragraphs: ['HTTP 200 means the gateway completed the request. Check request time, model, token use, cost, and latency in Usage logs.'] },
    ] },
    'models-and-groups': { title: 'Models, groups, and capabilities', description: 'Choose models and billing groups from live account configuration.', sections: [
      { id: 'model-name', title: 'Use the exact model name', paragraphs: ['The model field must match the model marketplace. Similar names can represent different providers, versions, or capabilities.'] },
      { id: 'groups', title: 'Understand groups', paragraphs: ['Groups determine available routes and multipliers. The console shows only groups available to the current account; clients must not assume fixed group names.'] },
      { id: 'capabilities', title: 'Send capability-aware fields', paragraphs: ['Image size, quality, background, streaming, and tool calling are not supported by every model. Send only fields that the target model explicitly supports.'], tone: 'note' },
    ] },
    'chat-guide': { title: 'Chat and streaming', description: 'Choose Chat Completions or Responses and process incremental events correctly.', sections: [
      { id: 'choose', title: 'Choose an interface', paragraphs: ['Existing OpenAI Chat Completions clients can use /v1/chat/completions. New integrations can use /v1/responses when the selected model supports it.'] },
      { id: 'stream', title: 'Process streaming responses', paragraphs: ['With stream=true, process server events in order, merge text deltas, and close after the completion marker. Abort the network request when the user cancels.'] },
      { id: 'history', title: 'Send only relevant context', paragraphs: ['Models do not automatically remember earlier requests. Your application selects and sends relevant history while controlling context length and privacy.'] },
    ] },
    'image-guide': { title: 'Image generation and editing', description: 'Use JSON generation or multipart editing when supported by the model.', sections: [
      { id: 'generate', title: 'Generate from a prompt', paragraphs: ['Send JSON to /v1/images/generations. Common fields are model, prompt, n, size, and quality.'] },
      { id: 'edit', title: 'Edit a source image', paragraphs: ['Editing uses multipart/form-data with image, prompt, and model. Send masks and extra fields only when the target model supports them.'] },
      { id: 'retain', title: 'Keep results promptly', paragraphs: ['Responses may contain a temporary URL or base64. Download retained results into storage you control. Image Studio projects and images remain only in the current browser.'], tone: 'note' },
    ] },
    'errors-and-limits': { title: 'Errors, limits, and retries', description: 'Separate fixable input and auth failures from quota and upstream incidents.', sections: [
      { id: 'status', title: 'Start with the HTTP status', paragraphs: ['400 usually means incompatible fields or model, 401 an invalid key, 403 a policy or permission restriction, 429 a rate or quota limit, and 5xx a temporary gateway or provider failure.'] },
      { id: 'request-id', title: 'Keep request context', paragraphs: ['Record time, model, HTTP status, and request identifier for diagnosis, but never the full key or sensitive prompt. Usage logs provide billing and routing context.'] },
      { id: 'retry', title: 'Retry only temporary failures', paragraphs: ['Use jittered exponential backoff with a maximum attempt count for 429 and selected 5xx responses. Do not retry invalid input, authentication failures, or operations that could duplicate side effects.'], tone: 'warning' },
    ] },
  },
  ja: {
    overview: { title: '制御できる一つのリクエストから始める', description: 'キーを作成し、モデルを確認して、最初の OpenAI 互換リクエストを送信します。', sections: [
      { id: 'path', title: '最短の呼び出し手順', paragraphs: ['Partokens は統一された OpenAI 互換エントリーポイントを提供します。次の三手順でアカウント、ルート、モデルを確認できます。'], bullets: ['有限のクォータとモデル範囲を持つ API キーを作成する。', 'アカウントグループで利用できる正確なモデル名を確認する。', 'https://partokens.com/v1 に Bearer 認証付きリクエストを送信する。'] },
      { id: 'boundary', title: 'サービス境界を理解する', paragraphs: ['キーは呼び出し元の識別と使用量計測に使われます。内容は Partokens ゲートウェイから選択したモデルプロバイダーへ送信されるため、不要な機密情報は含めないでください。'], tone: 'note' },
      { id: 'first', title: '最初のリクエストを検証する', paragraphs: ['成功後、使用ログでモデル、トークン、料金、レイテンシーを確認します。'], code: requestExample },
    ] },
    authentication: { title: '認証とキーの安全性', description: '範囲を限定した Bearer キーで API を呼び出し、認証情報の漏えいを防ぎます。', sections: [
      { id: 'bearer', title: 'Bearer キーを送信する', paragraphs: ['各 API リクエストには、Bearer と完全な API キーを値に持つ Authorization ヘッダーが必要です。'] },
      { id: 'scope', title: 'キーの範囲を絞る', paragraphs: ['アプリごとにキーを分け、クォータ、有効期限、モデル許可リスト、グループ、IP 制限を設定します。キーは作成時または明示的な確認後のみ表示されます。'] },
      { id: 'storage', title: 'クライアントにキーを置かない', paragraphs: ['ブラウザーコード、モバイルアプリ、URL、ログ、公開リポジトリにキーを書かないでください。サーバー環境変数またはシークレット管理を使用します。'], tone: 'warning' },
    ] },
    'first-request': { title: '最初のリクエストを送る', description: 'curl で呼び出し、使用ログで課金結果を確認します。', sections: [
      { id: 'prepare', title: 'モデルとキーを準備する', paragraphs: ['モデル一覧から正確な名前をコピーし、そのモデルだけを許可するテストキーを作成します。'] },
      { id: 'send', title: 'リクエストを送信する', paragraphs: ['your-model を実際のモデル名に置き換え、現在の端末で PARTOKENS_API_KEY を設定します。'], code: requestExample },
      { id: 'verify', title: '応答とログを確認する', paragraphs: ['HTTP 200 はゲートウェイがリクエストを完了したことを示します。使用ログで時刻、モデル、トークン、料金、レイテンシーを確認します。'] },
    ] },
    'models-and-groups': { title: 'モデル、グループ、機能', description: 'アカウントのリアルタイム設定からモデルと課金グループを選択します。', sections: [
      { id: 'model-name', title: '正確なモデル名を使う', paragraphs: ['model フィールドはモデル一覧の表示と一致させます。似た名前でもプロバイダー、版、機能が異なる場合があります。'] },
      { id: 'groups', title: 'グループを理解する', paragraphs: ['グループは利用可能なルートと倍率を決めます。クライアント側で固定のグループ名を仮定しないでください。'] },
      { id: 'capabilities', title: '機能に合うフィールドだけ送る', paragraphs: ['画像サイズ、品質、背景、ストリーミング、ツール呼び出しは全モデル共通ではありません。明示的に対応する項目だけを送ります。'], tone: 'note' },
    ] },
    'chat-guide': { title: 'チャットとストリーミング', description: 'Chat Completions または Responses を選び、増分イベントを正しく処理します。', sections: [
      { id: 'choose', title: 'インターフェースを選ぶ', paragraphs: ['既存の Chat Completions クライアントは /v1/chat/completions を利用できます。新規統合では対応モデルなら /v1/responses も選べます。'] },
      { id: 'stream', title: 'ストリーミング応答を処理する', paragraphs: ['stream=true ではイベントを順に処理してテキスト差分を結合し、終了マーカー後に接続を閉じます。ユーザーが中止したら通信も中止します。'] },
      { id: 'history', title: '必要な文脈だけ送る', paragraphs: ['モデルは過去のリクエストを自動では記憶しません。アプリが必要な履歴を選び、長さとプライバシーを管理します。'] },
    ] },
    'image-guide': { title: '画像生成と編集', description: 'モデル対応時に JSON 生成または multipart 編集を使用します。', sections: [
      { id: 'generate', title: 'プロンプトから生成する', paragraphs: ['/v1/images/generations に JSON を送信します。主なフィールドは model、prompt、n、size、quality です。'] },
      { id: 'edit', title: '元画像を編集する', paragraphs: ['編集は multipart/form-data で image、prompt、model を送ります。マスクなどは対象モデルが明示的に対応する場合だけ追加します。'] },
      { id: 'retain', title: '結果をすぐ保存する', paragraphs: ['応答は一時 URL または base64 の場合があります。必要な結果は管理下の保存先へ取得してください。画像スタジオのデータは現在のブラウザーだけに保存されます。'], tone: 'note' },
    ] },
    'errors-and-limits': { title: 'エラー、上限、再試行', description: '入力・認証の問題と、クォータ・上流障害を区別します。', sections: [
      { id: 'status', title: 'HTTP ステータスから確認する', paragraphs: ['400 は通常フィールドやモデルの不一致、401 は無効なキー、403 は権限やポリシー、429 は速度またはクォータ上限、5xx はゲートウェイまたは上流の一時障害です。'] },
      { id: 'request-id', title: 'リクエスト情報を保持する', paragraphs: ['調査には時刻、モデル、HTTP 状態、リクエスト識別子を記録します。完全なキーや機密プロンプトは記録しないでください。'] },
      { id: 'retry', title: '一時障害だけ再試行する', paragraphs: ['429 と一部 5xx にはジッター付き指数バックオフと最大回数を設定します。無効な入力や認証失敗を自動再試行しないでください。'], tone: 'warning' },
    ] },
  },
  ru: {
    overview: { title: 'Начните с одного контролируемого запроса', description: 'Создайте ключ, проверьте модель и отправьте первый OpenAI-совместимый запрос.', sections: [
      { id: 'path', title: 'Кратчайший путь запроса', paragraphs: ['Partokens предоставляет единую OpenAI-совместимую точку входа. Три шага проверяют аккаунт, маршрут и модель.'], bullets: ['Создайте API-ключ с ограниченной квотой и списком моделей.', 'Уточните точное имя модели, доступной группе аккаунта.', 'Отправьте Bearer-запрос на https://partokens.com/v1.'] },
      { id: 'boundary', title: 'Учитывайте границы сервиса', paragraphs: ['Ключ идентифицирует вызывающую сторону и учитывает расход. Содержимое проходит через шлюз Partokens к выбранному поставщику модели, поэтому не передавайте лишние конфиденциальные данные.'], tone: 'note' },
      { id: 'first', title: 'Проверьте первый запрос', paragraphs: ['После успешного ответа проверьте модель, токены, стоимость и задержку в журнале использования.'], code: requestExample },
    ] },
    authentication: { title: 'Аутентификация и безопасность ключей', description: 'Используйте ограниченный Bearer-ключ и не раскрывайте учетные данные.', sections: [
      { id: 'bearer', title: 'Передавайте Bearer-ключ', paragraphs: ['Каждый API-запрос должен содержать заголовок Authorization со значением Bearer и полным API-ключом.'] },
      { id: 'scope', title: 'Ограничьте область ключа', paragraphs: ['Создавайте отдельный ключ для каждого приложения и задавайте квоту, срок, разрешенные модели, группу и IP. Ключ показывается только при создании или после явного подтверждения.'] },
      { id: 'storage', title: 'Не храните ключи в клиентах', paragraphs: ['Не помещайте ключи в браузерный код, мобильные пакеты, URL, журналы или открытые репозитории. Используйте серверные переменные или хранилище секретов.'], tone: 'warning' },
    ] },
    'first-request': { title: 'Отправьте первый запрос', description: 'Выполните вызов curl и проверьте списание в журнале.', sections: [
      { id: 'prepare', title: 'Подготовьте модель и ключ', paragraphs: ['Скопируйте точное имя модели из каталога и создайте тестовый ключ, разрешающий только эту модель.'] },
      { id: 'send', title: 'Отправьте запрос', paragraphs: ['Замените your-model реальным именем и задайте PARTOKENS_API_KEY в текущем терминале.'], code: requestExample },
      { id: 'verify', title: 'Проверьте ответ и журнал', paragraphs: ['HTTP 200 означает, что шлюз завершил запрос. Проверьте время, модель, токены, стоимость и задержку.'] },
    ] },
    'models-and-groups': { title: 'Модели, группы и возможности', description: 'Выбирайте модели и тарифные группы из текущей конфигурации аккаунта.', sections: [
      { id: 'model-name', title: 'Используйте точное имя модели', paragraphs: ['Поле model должно совпадать с каталогом. Похожие имена могут означать разных поставщиков, версии или возможности.'] },
      { id: 'groups', title: 'Учитывайте группы', paragraphs: ['Группа определяет маршруты и множители. Не закладывайте фиксированные названия групп в клиент.'] },
      { id: 'capabilities', title: 'Передавайте только поддерживаемые поля', paragraphs: ['Размер и качество изображения, фон, потоковый режим и инструменты поддерживаются не всеми моделями.'], tone: 'note' },
    ] },
    'chat-guide': { title: 'Чат и потоковые ответы', description: 'Выберите Chat Completions или Responses и корректно обрабатывайте события.', sections: [
      { id: 'choose', title: 'Выберите интерфейс', paragraphs: ['Существующие клиенты используют /v1/chat/completions. Для новых интеграций доступен /v1/responses, если модель его поддерживает.'] },
      { id: 'stream', title: 'Обрабатывайте поток', paragraphs: ['При stream=true обрабатывайте события по порядку, объединяйте фрагменты текста и закрывайте соединение после маркера завершения. При отмене прерывайте сеть.'] },
      { id: 'history', title: 'Передавайте только нужный контекст', paragraphs: ['Модель не помнит прошлые запросы автоматически. Приложение выбирает историю и контролирует длину и приватность.'] },
    ] },
    'image-guide': { title: 'Генерация и редактирование изображений', description: 'Используйте JSON-генерацию или multipart-редактирование, если модель поддерживает их.', sections: [
      { id: 'generate', title: 'Генерация по описанию', paragraphs: ['Отправьте JSON на /v1/images/generations. Основные поля: model, prompt, n, size и quality.'] },
      { id: 'edit', title: 'Редактирование исходника', paragraphs: ['Используйте multipart/form-data с image, prompt и model. Маску и дополнительные поля передавайте только при явной поддержке.'] },
      { id: 'retain', title: 'Сохраняйте результат сразу', paragraphs: ['Ответ может содержать временный URL или base64. Скачайте нужные результаты в свое хранилище. Проекты студии остаются только в текущем браузере.'], tone: 'note' },
    ] },
    'errors-and-limits': { title: 'Ошибки, ограничения и повторы', description: 'Отличайте ошибки ввода и ключа от квот и сбоев поставщика.', sections: [
      { id: 'status', title: 'Начните с HTTP-статуса', paragraphs: ['400 обычно означает несовместимые поля, 401 — неверный ключ, 403 — ограничение доступа, 429 — лимит скорости или квоты, 5xx — временный сбой шлюза или поставщика.'] },
      { id: 'request-id', title: 'Сохраняйте контекст', paragraphs: ['Запишите время, модель, статус и идентификатор запроса, но не полный ключ и не конфиденциальный prompt.'] },
      { id: 'retry', title: 'Повторяйте только временные ошибки', paragraphs: ['Для 429 и отдельных 5xx используйте экспоненциальную задержку с джиттером и пределом попыток. Не повторяйте ошибки ввода и аутентификации.'], tone: 'warning' },
    ] },
  },
  fr: {
    overview: { title: 'Commencer par une requête maîtrisée', description: 'Créez une clé, confirmez un modèle et envoyez votre première requête compatible OpenAI.', sections: [
      { id: 'path', title: 'Le chemin le plus court', paragraphs: ['Partokens fournit un point d’entrée unique compatible OpenAI. Trois étapes vérifient le compte, le routage et le modèle.'], bullets: ['Créez une clé API avec un quota et une portée de modèles limités.', 'Confirmez le nom exact du modèle disponible pour votre groupe.', 'Envoyez une requête Bearer vers https://partokens.com/v1.'] },
      { id: 'boundary', title: 'Comprendre la limite du service', paragraphs: ['La clé identifie l’appelant et mesure l’usage. Le contenu transite par la passerelle Partokens vers le fournisseur choisi ; évitez les données sensibles inutiles.'], tone: 'note' },
      { id: 'first', title: 'Vérifier la première requête', paragraphs: ['Après une réponse réussie, vérifiez le modèle, les jetons, le coût et la latence dans les journaux.'], code: requestExample },
    ] },
    authentication: { title: 'Authentification et sécurité des clés', description: 'Appelez l’API avec une clé Bearer limitée sans exposer vos identifiants.', sections: [
      { id: 'bearer', title: 'Envoyer une clé Bearer', paragraphs: ['Chaque requête doit inclure un en-tête Authorization contenant Bearer suivi de la clé API complète.'] },
      { id: 'scope', title: 'Réduire la portée', paragraphs: ['Créez une clé par application et définissez quota, expiration, modèles autorisés, groupe et IP. La clé n’apparaît qu’à la création ou après confirmation explicite.'] },
      { id: 'storage', title: 'Ne pas placer de clé dans un client', paragraphs: ['N’intégrez pas la clé au code navigateur, à une application mobile, une URL, un journal ou un dépôt public. Utilisez une variable serveur ou un gestionnaire de secrets.'], tone: 'warning' },
    ] },
    'first-request': { title: 'Envoyer la première requête', description: 'Effectuez un appel curl et vérifiez la facturation dans les journaux.', sections: [
      { id: 'prepare', title: 'Préparer le modèle et la clé', paragraphs: ['Copiez le nom exact depuis le catalogue, puis créez une clé de test limitée à ce modèle.'] },
      { id: 'send', title: 'Envoyer la requête', paragraphs: ['Remplacez your-model par le nom réel et définissez PARTOKENS_API_KEY dans le terminal courant.'], code: requestExample },
      { id: 'verify', title: 'Vérifier la réponse et le journal', paragraphs: ['HTTP 200 indique que la passerelle a terminé la requête. Vérifiez l’heure, le modèle, les jetons, le coût et la latence.'] },
    ] },
    'models-and-groups': { title: 'Modèles, groupes et capacités', description: 'Choisissez selon la configuration en temps réel du compte.', sections: [
      { id: 'model-name', title: 'Utiliser le nom exact', paragraphs: ['Le champ model doit correspondre au catalogue. Des noms proches peuvent désigner des fournisseurs, versions ou capacités différents.'] },
      { id: 'groups', title: 'Comprendre les groupes', paragraphs: ['Le groupe détermine les routes et multiplicateurs. Ne supposez pas un nom de groupe fixe dans le client.'] },
      { id: 'capabilities', title: 'Respecter les capacités', paragraphs: ['Taille, qualité, arrière-plan, streaming et outils ne sont pas disponibles sur tous les modèles. Envoyez uniquement les champs pris en charge.'], tone: 'note' },
    ] },
    'chat-guide': { title: 'Chat et réponses en streaming', description: 'Choisissez Chat Completions ou Responses et traitez correctement les événements.', sections: [
      { id: 'choose', title: 'Choisir une interface', paragraphs: ['Les clients existants utilisent /v1/chat/completions. Les nouvelles intégrations peuvent utiliser /v1/responses si le modèle le permet.'] },
      { id: 'stream', title: 'Traiter le flux', paragraphs: ['Avec stream=true, traitez les événements dans l’ordre, fusionnez les fragments et fermez après le marqueur final. Annulez aussi la requête réseau si l’utilisateur arrête.'] },
      { id: 'history', title: 'Limiter le contexte', paragraphs: ['Le modèle ne mémorise pas automatiquement les requêtes précédentes. L’application choisit l’historique utile et maîtrise longueur et confidentialité.'] },
    ] },
    'image-guide': { title: 'Génération et retouche d’images', description: 'Utilisez la génération JSON ou la retouche multipart selon le modèle.', sections: [
      { id: 'generate', title: 'Générer depuis une consigne', paragraphs: ['Envoyez du JSON à /v1/images/generations avec notamment model, prompt, n, size et quality.'] },
      { id: 'edit', title: 'Retoucher une image source', paragraphs: ['Utilisez multipart/form-data avec image, prompt et model. N’ajoutez masque et options que si le modèle les prend en charge.'] },
      { id: 'retain', title: 'Conserver rapidement le résultat', paragraphs: ['La réponse peut contenir une URL temporaire ou du base64. Téléchargez les résultats dans votre stockage. Les projets du studio restent dans ce navigateur.'], tone: 'note' },
    ] },
    'errors-and-limits': { title: 'Erreurs, limites et nouvelles tentatives', description: 'Distinguez les entrées invalides des limites et incidents fournisseur.', sections: [
      { id: 'status', title: 'Commencer par le statut HTTP', paragraphs: ['400 indique souvent des champs incompatibles, 401 une clé invalide, 403 une restriction, 429 une limite de débit ou de quota, et 5xx un incident temporaire.'] },
      { id: 'request-id', title: 'Conserver le contexte', paragraphs: ['Notez heure, modèle, statut et identifiant de requête, jamais la clé complète ni une consigne sensible.'] },
      { id: 'retry', title: 'Réessayer uniquement les pannes temporaires', paragraphs: ['Pour 429 et certains 5xx, utilisez un recul exponentiel avec gigue et un nombre maximal. Ne réessayez pas les erreurs d’entrée ou d’authentification.'], tone: 'warning' },
    ] },
  },
  vi: {
    overview: { title: 'Bắt đầu bằng một yêu cầu có kiểm soát', description: 'Tạo khóa, xác nhận mô hình và gửi yêu cầu tương thích OpenAI đầu tiên.', sections: [
      { id: 'path', title: 'Đường gọi ngắn nhất', paragraphs: ['Partokens cung cấp một điểm vào tương thích OpenAI. Ba bước sau kiểm tra tài khoản, tuyến và mô hình.'], bullets: ['Tạo khóa API có hạn mức và phạm vi mô hình hữu hạn.', 'Xác nhận đúng tên mô hình dành cho nhóm tài khoản.', 'Gửi yêu cầu Bearer đến https://partokens.com/v1.'] },
      { id: 'boundary', title: 'Hiểu ranh giới dịch vụ', paragraphs: ['Khóa nhận diện bên gọi và đo mức sử dụng. Nội dung đi qua cổng Partokens tới nhà cung cấp mô hình đã chọn, vì vậy hãy tránh dữ liệu nhạy cảm không cần thiết.'], tone: 'note' },
      { id: 'first', title: 'Kiểm tra yêu cầu đầu tiên', paragraphs: ['Sau khi thành công, kiểm tra mô hình, token, chi phí và độ trễ trong nhật ký sử dụng.'], code: requestExample },
    ] },
    authentication: { title: 'Xác thực và an toàn khóa', description: 'Gọi API bằng khóa Bearer có giới hạn mà không làm lộ thông tin xác thực.', sections: [
      { id: 'bearer', title: 'Gửi khóa Bearer', paragraphs: ['Mỗi yêu cầu API phải có header Authorization với giá trị Bearer theo sau bởi khóa API đầy đủ.'] },
      { id: 'scope', title: 'Thu hẹp phạm vi khóa', paragraphs: ['Tạo khóa riêng cho từng ứng dụng và đặt hạn mức, thời hạn, danh sách mô hình, nhóm và IP. Khóa chỉ hiện khi tạo hoặc sau xác nhận rõ ràng.'] },
      { id: 'storage', title: 'Không đặt khóa trong ứng dụng khách', paragraphs: ['Không ghi khóa vào mã trình duyệt, gói di động, URL, nhật ký hoặc kho công khai. Hãy dùng biến môi trường máy chủ hoặc trình quản lý bí mật.'], tone: 'warning' },
    ] },
    'first-request': { title: 'Gửi yêu cầu đầu tiên', description: 'Gọi bằng curl và xác nhận tính phí trong nhật ký.', sections: [
      { id: 'prepare', title: 'Chuẩn bị mô hình và khóa', paragraphs: ['Sao chép đúng tên trong quảng trường mô hình rồi tạo khóa thử nghiệm chỉ cho phép mô hình đó.'] },
      { id: 'send', title: 'Gửi yêu cầu', paragraphs: ['Thay your-model bằng tên thật và đặt PARTOKENS_API_KEY trong terminal hiện tại.'], code: requestExample },
      { id: 'verify', title: 'Kiểm tra phản hồi và nhật ký', paragraphs: ['HTTP 200 nghĩa là cổng đã hoàn tất yêu cầu. Kiểm tra thời gian, mô hình, token, chi phí và độ trễ.'] },
    ] },
    'models-and-groups': { title: 'Mô hình, nhóm và khả năng', description: 'Chọn theo cấu hình thời gian thực của tài khoản.', sections: [
      { id: 'model-name', title: 'Dùng đúng tên mô hình', paragraphs: ['Trường model phải khớp quảng trường mô hình. Tên gần giống có thể là nhà cung cấp, phiên bản hoặc khả năng khác nhau.'] },
      { id: 'groups', title: 'Hiểu nhóm', paragraphs: ['Nhóm quyết định tuyến và hệ số. Không giả định tên nhóm cố định trong ứng dụng khách.'] },
      { id: 'capabilities', title: 'Chỉ gửi trường được hỗ trợ', paragraphs: ['Kích thước, chất lượng, nền, streaming và gọi công cụ không có trên mọi mô hình.'], tone: 'note' },
    ] },
    'chat-guide': { title: 'Trò chuyện và streaming', description: 'Chọn Chat Completions hoặc Responses và xử lý đúng sự kiện tăng dần.', sections: [
      { id: 'choose', title: 'Chọn giao diện', paragraphs: ['Ứng dụng hiện có dùng /v1/chat/completions. Tích hợp mới có thể dùng /v1/responses khi mô hình hỗ trợ.'] },
      { id: 'stream', title: 'Xử lý phản hồi luồng', paragraphs: ['Với stream=true, xử lý sự kiện theo thứ tự, ghép phần văn bản và đóng kết nối sau dấu kết thúc. Khi người dùng hủy, hãy hủy cả yêu cầu mạng.'] },
      { id: 'history', title: 'Chỉ gửi ngữ cảnh cần thiết', paragraphs: ['Mô hình không tự nhớ yêu cầu cũ. Ứng dụng chọn lịch sử liên quan và kiểm soát độ dài cùng quyền riêng tư.'] },
    ] },
    'image-guide': { title: 'Tạo và chỉnh sửa hình ảnh', description: 'Dùng tạo JSON hoặc chỉnh sửa multipart khi mô hình hỗ trợ.', sections: [
      { id: 'generate', title: 'Tạo từ prompt', paragraphs: ['Gửi JSON đến /v1/images/generations. Các trường thường dùng là model, prompt, n, size và quality.'] },
      { id: 'edit', title: 'Chỉnh sửa ảnh nguồn', paragraphs: ['Dùng multipart/form-data với image, prompt và model. Chỉ gửi mask và trường bổ sung khi mô hình hỗ trợ rõ ràng.'] },
      { id: 'retain', title: 'Lưu kết quả kịp thời', paragraphs: ['Phản hồi có thể là URL tạm thời hoặc base64. Hãy tải kết quả cần giữ vào kho của bạn. Dự án Studio chỉ nằm trong trình duyệt hiện tại.'], tone: 'note' },
    ] },
    'errors-and-limits': { title: 'Lỗi, giới hạn và thử lại', description: 'Phân biệt lỗi đầu vào hoặc khóa với hạn mức và sự cố thượng nguồn.', sections: [
      { id: 'status', title: 'Bắt đầu từ trạng thái HTTP', paragraphs: ['400 thường là trường không tương thích, 401 là khóa sai, 403 là hạn chế, 429 là giới hạn tốc độ hoặc hạn mức, 5xx là lỗi tạm thời của cổng hoặc nhà cung cấp.'] },
      { id: 'request-id', title: 'Giữ ngữ cảnh yêu cầu', paragraphs: ['Ghi thời gian, mô hình, trạng thái và mã yêu cầu, nhưng không ghi khóa đầy đủ hoặc prompt nhạy cảm.'] },
      { id: 'retry', title: 'Chỉ thử lại lỗi tạm thời', paragraphs: ['Với 429 và một số 5xx, dùng exponential backoff có jitter và giới hạn số lần. Không thử lại lỗi đầu vào hay xác thực.'], tone: 'warning' },
    ] },
  },
}

type FieldDescriptionId =
  | 'model' | 'messages' | 'input' | 'stream' | 'temperature' | 'maxTokens' | 'tools'
  | 'prompt' | 'count' | 'size' | 'quality' | 'background' | 'image' | 'mask'
  | 'dimensions' | 'encoding' | 'file' | 'language' | 'responseFormat'

type ApiField = {
  name: string
  type: string
  required: boolean
  descriptionId: FieldDescriptionId
}

type LocalizedText = Record<DocsLocale, string>

export type ApiDefinition = {
  id: ApiPageId
  title: LocalizedText
  summary: LocalizedText
  responseNotes: LocalizedText
  method: 'GET' | 'POST'
  path: string
  contentType: 'application/json' | 'multipart/form-data'
  fields: ApiField[]
  requestExample: string
  responseExample: string
}

const fieldDescriptions: Record<DocsLocale, Record<FieldDescriptionId, string>> = {
  'zh-CN': {
    model: '模型广场中可用的准确模型名称。', messages: '按顺序排列的角色与消息内容数组。', input: '输入文本、内容项或字符串数组，具体形式取决于端点。',
    stream: '是否以服务端事件流返回增量结果。', temperature: '采样随机性；仅在目标模型支持时发送。', maxTokens: '允许生成的最大输出令牌数。', tools: '模型可调用的工具定义；仅适用于支持工具调用的模型。',
    prompt: '描述目标输出或编辑要求的提示词。', count: '期望生成的结果数量；受模型和账户限制。', size: '目标图像尺寸，例如 1024x1024；可选值因模型而异。',
    quality: '目标质量档位；仅发送模型明确支持的值。', background: '背景模式，例如 transparent、opaque 或 auto。', image: '要编辑的源图文件。', mask: '可选掩膜文件，用于指定可修改区域。',
    dimensions: '可选向量维度，仅适用于支持自定义维度的嵌入模型。', encoding: '向量编码格式，通常为 float 或 base64。', file: '待转写的音频文件。',
    language: '可选输入语言代码，用于改善识别效果。', responseFormat: '响应格式，例如 json、text、srt 或 verbose_json。',
  },
  'zh-TW': {
    model: '模型廣場中可用的正確模型名稱。', messages: '依順序排列的角色與訊息內容陣列。', input: '輸入文字、內容項目或字串陣列，形式依端點而定。',
    stream: '是否以伺服器事件流回傳增量結果。', temperature: '取樣隨機性；僅在目標模型支援時傳送。', maxTokens: '允許生成的最大輸出 Token 數。', tools: '模型可呼叫的工具定義；僅適用支援工具呼叫的模型。',
    prompt: '描述目標輸出或編輯要求的提示詞。', count: '預期生成的結果數量；受模型和帳戶限制。', size: '目標圖像尺寸，例如 1024x1024；選項依模型而異。',
    quality: '目標品質等級；只傳送模型明確支援的值。', background: '背景模式，例如 transparent、opaque 或 auto。', image: '要編輯的來源圖像檔案。', mask: '選用遮罩檔案，用於指定可修改區域。',
    dimensions: '選用向量維度，只適用支援自訂維度的嵌入模型。', encoding: '向量編碼格式，通常為 float 或 base64。', file: '要轉錄的音訊檔案。',
    language: '選用輸入語言代碼，可改善辨識效果。', responseFormat: '回應格式，例如 json、text、srt 或 verbose_json。',
  },
  en: {
    model: 'The exact model name available in the model marketplace.', messages: 'An ordered array of roles and message content.', input: 'Input text, content items, or an array of strings, depending on the endpoint.',
    stream: 'Whether to return incremental results as server-sent events.', temperature: 'Sampling randomness; send only when the target model supports it.', maxTokens: 'The maximum number of output tokens the model may generate.', tools: 'Tool definitions available to models that support tool calling.',
    prompt: 'Instructions describing the desired output or edit.', count: 'The requested result count, subject to model and account limits.', size: 'Target image dimensions such as 1024x1024; allowed values vary by model.',
    quality: 'Requested quality tier; send only values the model supports.', background: 'Background mode such as transparent, opaque, or auto.', image: 'The source image file to edit.', mask: 'An optional mask that identifies editable areas.',
    dimensions: 'Optional vector dimensions for embedding models that support them.', encoding: 'Vector encoding, typically float or base64.', file: 'The audio file to transcribe.',
    language: 'Optional input language code that can improve recognition.', responseFormat: 'Response format such as json, text, srt, or verbose_json.',
  },
  ja: {
    model: 'モデル一覧で利用できる正確なモデル名。', messages: '役割とメッセージ内容を順に並べた配列。', input: 'エンドポイントに応じた入力テキスト、内容項目、または文字列配列。',
    stream: 'サーバーイベントで増分結果を返すかどうか。', temperature: 'サンプリングのランダム性。対象モデルが対応する場合のみ送信します。', maxTokens: '生成可能な最大出力トークン数。', tools: 'ツール呼び出し対応モデルに提供するツール定義。',
    prompt: '希望する出力または編集内容を記述する指示。', count: '希望する結果数。モデルとアカウントの制限を受けます。', size: '1024x1024 などの画像サイズ。許可値はモデルごとに異なります。',
    quality: '希望する品質。モデルが対応する値だけを送ります。', background: 'transparent、opaque、auto などの背景モード。', image: '編集対象の元画像ファイル。', mask: '編集可能な領域を示す任意のマスク。',
    dimensions: '対応する埋め込みモデル向けの任意ベクトル次元。', encoding: '通常 float または base64 のベクトル形式。', file: '文字起こしする音声ファイル。',
    language: '認識を改善できる任意の入力言語コード。', responseFormat: 'json、text、srt、verbose_json などの応答形式。',
  },
  ru: {
    model: 'Точное имя модели из каталога.', messages: 'Упорядоченный массив ролей и сообщений.', input: 'Входной текст, элементы содержимого или массив строк в зависимости от метода.',
    stream: 'Возвращать ли результат частями через серверные события.', temperature: 'Случайность выборки; передавайте только для поддерживаемых моделей.', maxTokens: 'Максимальное число генерируемых выходных токенов.', tools: 'Определения инструментов для моделей с поддержкой их вызова.',
    prompt: 'Инструкция с описанием требуемого результата или изменения.', count: 'Число результатов с учетом ограничений модели и аккаунта.', size: 'Размер изображения, например 1024x1024; значения зависят от модели.',
    quality: 'Уровень качества; передавайте только поддерживаемые значения.', background: 'Режим фона: transparent, opaque или auto.', image: 'Исходный файл изображения для редактирования.', mask: 'Необязательная маска редактируемой области.',
    dimensions: 'Необязательная размерность вектора для поддерживаемых моделей.', encoding: 'Формат вектора, обычно float или base64.', file: 'Аудиофайл для распознавания.',
    language: 'Необязательный код языка для улучшения распознавания.', responseFormat: 'Формат ответа: json, text, srt или verbose_json.',
  },
  fr: {
    model: 'Nom exact du modèle disponible dans le catalogue.', messages: 'Tableau ordonné des rôles et contenus de messages.', input: 'Texte, éléments de contenu ou tableau de chaînes selon le point de terminaison.',
    stream: 'Indique si le résultat est envoyé progressivement par événements serveur.', temperature: 'Aléa d’échantillonnage ; uniquement pour les modèles compatibles.', maxTokens: 'Nombre maximal de jetons de sortie générés.', tools: 'Définitions d’outils pour les modèles prenant en charge leur appel.',
    prompt: 'Instruction décrivant le résultat ou la modification souhaitée.', count: 'Nombre de résultats demandé, selon les limites du modèle et du compte.', size: 'Dimensions telles que 1024x1024 ; les valeurs dépendent du modèle.',
    quality: 'Niveau de qualité demandé ; uniquement une valeur prise en charge.', background: 'Mode d’arrière-plan : transparent, opaque ou auto.', image: 'Fichier image source à retoucher.', mask: 'Masque facultatif identifiant les zones modifiables.',
    dimensions: 'Dimensions vectorielles facultatives pour les modèles compatibles.', encoding: 'Encodage du vecteur, généralement float ou base64.', file: 'Fichier audio à transcrire.',
    language: 'Code de langue facultatif pour améliorer la reconnaissance.', responseFormat: 'Format de réponse : json, text, srt ou verbose_json.',
  },
  vi: {
    model: 'Tên chính xác của mô hình trong quảng trường mô hình.', messages: 'Mảng vai trò và nội dung tin nhắn theo đúng thứ tự.', input: 'Văn bản, mục nội dung hoặc mảng chuỗi tùy endpoint.',
    stream: 'Có trả kết quả tăng dần qua sự kiện máy chủ hay không.', temperature: 'Độ ngẫu nhiên lấy mẫu; chỉ gửi khi mô hình hỗ trợ.', maxTokens: 'Số token đầu ra tối đa mô hình được tạo.', tools: 'Định nghĩa công cụ cho mô hình hỗ trợ gọi công cụ.',
    prompt: 'Chỉ dẫn mô tả đầu ra hoặc chỉnh sửa mong muốn.', count: 'Số kết quả yêu cầu, chịu giới hạn mô hình và tài khoản.', size: 'Kích thước ảnh như 1024x1024; giá trị tùy mô hình.',
    quality: 'Mức chất lượng; chỉ gửi giá trị được hỗ trợ.', background: 'Chế độ nền như transparent, opaque hoặc auto.', image: 'Tệp ảnh nguồn cần chỉnh sửa.', mask: 'Tệp mask tùy chọn xác định vùng có thể sửa.',
    dimensions: 'Số chiều vector tùy chọn cho mô hình hỗ trợ.', encoding: 'Định dạng vector, thường là float hoặc base64.', file: 'Tệp âm thanh cần chép lời.',
    language: 'Mã ngôn ngữ đầu vào tùy chọn để cải thiện nhận dạng.', responseFormat: 'Định dạng phản hồi như json, text, srt hoặc verbose_json.',
  },
}

const localized = (
  zhCN: string,
  zhTW: string,
  en: string,
  ja: string,
  ru: string,
  fr: string,
  vi: string,
): LocalizedText => ({ 'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, ru, fr, vi })

const jsonRequest = (path: string, payload: string) => `curl https://partokens.com${path} \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${payload}'`

export const apiDefinitions: Record<ApiPageId, ApiDefinition> = {
  'api-chat-completions': {
    id: 'api-chat-completions', method: 'POST', path: '/v1/chat/completions', contentType: 'application/json',
    title: localized('聊天补全', '聊天補全', 'Chat completions', 'チャット補完', 'Ответы чата', 'Complétions de chat', 'Hoàn thành trò chuyện'),
    summary: localized('根据消息历史生成模型响应，支持普通与流式输出。', '依訊息歷史生成模型回應，支援一般與串流輸出。', 'Generate a model response from ordered messages, with standard or streaming output.', 'メッセージ履歴から通常またはストリーミングの応答を生成します。', 'Создает ответ модели по истории сообщений в обычном или потоковом режиме.', 'Génère une réponse à partir des messages, en mode normal ou streaming.', 'Tạo phản hồi từ lịch sử tin nhắn ở chế độ thường hoặc streaming.'),
    responseNotes: localized('非流式响应在 choices 中返回消息；流式响应通过 data 事件发送增量。', '非串流回應在 choices 中回傳訊息；串流回應透過 data 事件傳送增量。', 'Non-streaming responses return messages in choices; streaming responses emit deltas in data events.', '通常応答は choices にメッセージを返し、ストリーミングでは data イベントで差分を返します。', 'Обычный ответ содержит сообщения в choices; потоковый передает части в событиях data.', 'La réponse normale contient les messages dans choices ; le streaming émet des fragments dans les événements data.', 'Phản hồi thường trả tin nhắn trong choices; streaming phát phần tăng dần qua sự kiện data.'),
    fields: [
      { name: 'model', type: 'string', required: true, descriptionId: 'model' },
      { name: 'messages', type: 'array', required: true, descriptionId: 'messages' },
      { name: 'stream', type: 'boolean', required: false, descriptionId: 'stream' },
      { name: 'temperature', type: 'number', required: false, descriptionId: 'temperature' },
      { name: 'max_tokens', type: 'integer', required: false, descriptionId: 'maxTokens' },
      { name: 'tools', type: 'array', required: false, descriptionId: 'tools' },
    ],
    requestExample: jsonRequest('/v1/chat/completions', '{"model":"your-model","messages":[{"role":"user","content":"Hello"}]}'),
    responseExample: `{"id":"chatcmpl_...","choices":[{"message":{"role":"assistant","content":"Hello."},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":3,"total_tokens":11}}`,
  },
  'api-responses': {
    id: 'api-responses', method: 'POST', path: '/v1/responses', contentType: 'application/json',
    title: localized('Responses 接口', 'Responses 介面', 'Responses', 'Responses', 'Responses', 'Responses', 'Responses'),
    summary: localized('用统一输入项生成文本、工具调用或多模态响应。', '使用統一輸入項目生成文字、工具呼叫或多模態回應。', 'Generate text, tool calls, or multimodal output through a unified input format.', '統一入力形式からテキスト、ツール呼び出し、マルチモーダル出力を生成します。', 'Создает текст, вызовы инструментов или мультимодальный результат в едином формате.', 'Génère texte, appels d’outils ou sortie multimodale dans un format unifié.', 'Tạo văn bản, lệnh gọi công cụ hoặc đầu ra đa phương thức qua định dạng thống nhất.'),
    responseNotes: localized('响应的 output 数组包含按类型区分的内容项；流式模式发送具名事件。', '回應的 output 陣列包含依類型區分的內容項目；串流模式傳送具名事件。', 'The output array contains typed content items; streaming mode emits named events.', 'output 配列には型付き項目が含まれ、ストリーミングでは名前付きイベントを返します。', 'Массив output содержит типизированные элементы; потоковый режим передает именованные события.', 'Le tableau output contient des éléments typés ; le streaming émet des événements nommés.', 'Mảng output chứa mục có kiểu; chế độ streaming phát các sự kiện có tên.'),
    fields: [
      { name: 'model', type: 'string', required: true, descriptionId: 'model' },
      { name: 'input', type: 'string | array', required: true, descriptionId: 'input' },
      { name: 'stream', type: 'boolean', required: false, descriptionId: 'stream' },
      { name: 'max_output_tokens', type: 'integer', required: false, descriptionId: 'maxTokens' },
      { name: 'tools', type: 'array', required: false, descriptionId: 'tools' },
    ],
    requestExample: jsonRequest('/v1/responses', '{"model":"your-model","input":"Explain the result in one sentence."}'),
    responseExample: `{"id":"resp_...","status":"completed","output":[{"type":"message","role":"assistant","content":[{"type":"output_text","text":"..."}]}],"usage":{"input_tokens":9,"output_tokens":12}}`,
  },
  'api-embeddings': {
    id: 'api-embeddings', method: 'POST', path: '/v1/embeddings', contentType: 'application/json',
    title: localized('文本嵌入', '文字嵌入', 'Embeddings', '埋め込み', 'Эмбеддинги', 'Embeddings', 'Embedding'),
    summary: localized('把一段或多段文本转换为向量表示。', '將一段或多段文字轉換為向量表示。', 'Convert one or more text inputs into vector representations.', '一つ以上のテキストをベクトル表現に変換します。', 'Преобразует один или несколько текстов в векторы.', 'Convertit un ou plusieurs textes en représentations vectorielles.', 'Chuyển một hoặc nhiều văn bản thành biểu diễn vector.'),
    responseNotes: localized('data 数组按输入顺序返回向量；usage 提供计费相关令牌统计。', 'data 陣列依輸入順序回傳向量；usage 提供計費相關 Token 統計。', 'The data array returns vectors in input order; usage reports metered token counts.', 'data 配列は入力順にベクトルを返し、usage はトークン数を示します。', 'Массив data возвращает векторы по порядку, usage содержит число токенов.', 'Le tableau data renvoie les vecteurs dans l’ordre ; usage indique les jetons mesurés.', 'Mảng data trả vector theo thứ tự đầu vào; usage cho biết số token.'),
    fields: [
      { name: 'model', type: 'string', required: true, descriptionId: 'model' },
      { name: 'input', type: 'string | string[]', required: true, descriptionId: 'input' },
      { name: 'dimensions', type: 'integer', required: false, descriptionId: 'dimensions' },
      { name: 'encoding_format', type: 'string', required: false, descriptionId: 'encoding' },
    ],
    requestExample: jsonRequest('/v1/embeddings', '{"model":"your-embedding-model","input":["first text","second text"]}'),
    responseExample: `{"object":"list","data":[{"object":"embedding","index":0,"embedding":[0.012,-0.031]}],"usage":{"prompt_tokens":4,"total_tokens":4}}`,
  },
  'api-image-generations': {
    id: 'api-image-generations', method: 'POST', path: '/v1/images/generations', contentType: 'application/json',
    title: localized('图像生成', '圖像生成', 'Image generations', '画像生成', 'Генерация изображений', 'Génération d’images', 'Tạo hình ảnh'),
    summary: localized('根据提示词生成一张或多张图像。', '依提示詞生成一張或多張圖像。', 'Generate one or more images from a text prompt.', 'テキストプロンプトから一つ以上の画像を生成します。', 'Создает одно или несколько изображений по текстовому описанию.', 'Génère une ou plusieurs images à partir d’une consigne.', 'Tạo một hoặc nhiều hình ảnh từ prompt văn bản.'),
    responseNotes: localized('data 项可能包含 url 或 b64_json。临时 URL 应尽快下载。', 'data 項目可能包含 url 或 b64_json。臨時 URL 應儘快下載。', 'Each data item may contain url or b64_json. Download temporary URLs promptly.', 'data 項目は url または b64_json を含みます。一時 URL はすぐ取得してください。', 'Элемент data содержит url или b64_json. Временный URL нужно скачать сразу.', 'Chaque élément data contient url ou b64_json. Téléchargez rapidement toute URL temporaire.', 'Mỗi mục data có thể chứa url hoặc b64_json. Hãy tải URL tạm thời sớm.'),
    fields: [
      { name: 'model', type: 'string', required: true, descriptionId: 'model' },
      { name: 'prompt', type: 'string', required: true, descriptionId: 'prompt' },
      { name: 'n', type: 'integer', required: false, descriptionId: 'count' },
      { name: 'size', type: 'string', required: false, descriptionId: 'size' },
      { name: 'quality', type: 'string', required: false, descriptionId: 'quality' },
      { name: 'background', type: 'string', required: false, descriptionId: 'background' },
    ],
    requestExample: jsonRequest('/v1/images/generations', '{"model":"your-image-model","prompt":"A precise product photograph","size":"1024x1024"}'),
    responseExample: `{"created":1750000000,"data":[{"url":"https://temporary.example/image.png"}],"usage":{"total_tokens":1200}}`,
  },
  'api-image-edits': {
    id: 'api-image-edits', method: 'POST', path: '/v1/images/edits', contentType: 'multipart/form-data',
    title: localized('图像编辑', '圖像編輯', 'Image edits', '画像編集', 'Редактирование изображений', 'Retouche d’images', 'Chỉnh sửa hình ảnh'),
    summary: localized('根据提示词编辑上传的源图，模型支持时可带掩膜。', '依提示詞編輯上傳的來源圖，模型支援時可帶遮罩。', 'Edit an uploaded source image from a prompt, optionally with a supported mask.', 'アップロード画像をプロンプトに従って編集し、対応時はマスクも使えます。', 'Редактирует загруженное изображение по описанию, при поддержке — с маской.', 'Retouche une image envoyée selon une consigne, avec masque si pris en charge.', 'Chỉnh sửa ảnh đã tải lên theo prompt, có thể kèm mask nếu được hỗ trợ.'),
    responseNotes: localized('响应结构与图像生成一致；文件大小和格式限制由目标模型决定。', '回應結構與圖像生成一致；檔案大小與格式限制由目標模型決定。', 'The response matches image generation; file size and format limits depend on the model.', '応答は画像生成と同様で、ファイル制限はモデルに依存します。', 'Ответ совпадает с генерацией; ограничения файла зависят от модели.', 'La réponse suit la génération ; les limites de fichier dépendent du modèle.', 'Phản hồi giống tạo ảnh; giới hạn tệp tùy mô hình.'),
    fields: [
      { name: 'model', type: 'string', required: true, descriptionId: 'model' },
      { name: 'image', type: 'file', required: true, descriptionId: 'image' },
      { name: 'prompt', type: 'string', required: true, descriptionId: 'prompt' },
      { name: 'mask', type: 'file', required: false, descriptionId: 'mask' },
      { name: 'n', type: 'integer', required: false, descriptionId: 'count' },
      { name: 'size', type: 'string', required: false, descriptionId: 'size' },
      { name: 'quality', type: 'string', required: false, descriptionId: 'quality' },
    ],
    requestExample: `curl https://partokens.com/v1/images/edits \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -F "model=your-image-model" \\
  -F "image=@source.png" \\
  -F "prompt=Replace the background with a clean studio wall"`,
    responseExample: `{"created":1750000000,"data":[{"b64_json":"iVBORw0KGgo..."}]}`,
  },
  'api-audio-transcriptions': {
    id: 'api-audio-transcriptions', method: 'POST', path: '/v1/audio/transcriptions', contentType: 'multipart/form-data',
    title: localized('音频转写', '音訊轉錄', 'Audio transcriptions', '音声文字起こし', 'Распознавание аудио', 'Transcription audio', 'Chép lời âm thanh'),
    summary: localized('把上传的音频转换为文本或带时间信息的格式。', '將上傳的音訊轉換為文字或帶時間資訊的格式。', 'Convert an uploaded audio file into text or a timestamped format.', 'アップロード音声をテキストまたはタイムスタンプ付き形式に変換します。', 'Преобразует аудиофайл в текст или формат с временными метками.', 'Convertit un fichier audio en texte ou format horodaté.', 'Chuyển tệp âm thanh thành văn bản hoặc định dạng có dấu thời gian.'),
    responseNotes: localized('具体响应由 response_format 决定；大文件应遵循模型的时长和大小限制。', '具體回應由 response_format 決定；大型檔案需遵循模型限制。', 'The response follows response_format; large files must stay within model duration and size limits.', '応答は response_format に従い、大きなファイルはモデル制限内に収めます。', 'Ответ зависит от response_format; соблюдайте лимиты длительности и размера.', 'La réponse dépend de response_format ; respectez les limites de durée et taille.', 'Phản hồi theo response_format; tệp lớn phải trong giới hạn thời lượng và kích thước.'),
    fields: [
      { name: 'file', type: 'file', required: true, descriptionId: 'file' },
      { name: 'model', type: 'string', required: true, descriptionId: 'model' },
      { name: 'language', type: 'string', required: false, descriptionId: 'language' },
      { name: 'prompt', type: 'string', required: false, descriptionId: 'prompt' },
      { name: 'response_format', type: 'string', required: false, descriptionId: 'responseFormat' },
    ],
    requestExample: `curl https://partokens.com/v1/audio/transcriptions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -F "model=your-audio-model" \\
  -F "file=@recording.mp3" \\
  -F "response_format=json"`,
    responseExample: `{"text":"Transcribed audio content."}`,
  },
  'api-models': {
    id: 'api-models', method: 'GET', path: '/v1/models', contentType: 'application/json',
    title: localized('模型列表', '模型清單', 'List models', 'モデル一覧', 'Список моделей', 'Liste des modèles', 'Danh sách mô hình'),
    summary: localized('列出当前 API 密钥可访问的模型标识。', '列出目前 API 金鑰可存取的模型識別碼。', 'List model identifiers available to the current API key.', '現在の API キーで利用できるモデル識別子を一覧表示します。', 'Возвращает модели, доступные текущему API-ключу.', 'Liste les modèles accessibles avec la clé API actuelle.', 'Liệt kê mô hình mà khóa API hiện tại có thể truy cập.'),
    responseNotes: localized('返回值用于发现模型，但价格、能力和分组说明应以模型广场为准。', '回傳值可用於探索模型，但價格、能力與群組說明以模型廣場為準。', 'Use the result for discovery; consult the model marketplace for pricing, capabilities, and group details.', '結果はモデル発見に使い、価格や機能はモデル一覧で確認します。', 'Результат подходит для обнаружения; цены и возможности смотрите в каталоге.', 'Le résultat sert à la découverte ; consultez le catalogue pour prix et capacités.', 'Dùng kết quả để khám phá; xem quảng trường mô hình cho giá và khả năng.'),
    fields: [],
    requestExample: `curl https://partokens.com/v1/models \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY"`,
    responseExample: `{"object":"list","data":[{"id":"model-name","object":"model","owned_by":"provider"}]}`,
  },
}

export function getPageCopy(locale: DocsLocale, id: PageId): GuideCopy {
  if (id.startsWith('api-')) {
    const api = apiDefinitions[id as ApiPageId]
    return { title: api.title[locale], description: api.summary[locale], sections: [] }
  }
  return guideCopy[locale][id as GuidePageId]
}

export function getFieldDescription(locale: DocsLocale, id: FieldDescriptionId): string {
  return fieldDescriptions[locale][id]
}

export function getPageDefinition(id: PageId): PageDefinition {
  const page = pageDefinitions.find((candidate) => candidate.id === id)
  if (!page) throw new Error(`Unknown documentation page: ${id}`)
  return page
}
