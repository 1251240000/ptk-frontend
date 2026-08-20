import type { AppLocale } from '@partokens/i18n'

export type DocsGroupId = 'start' | 'account' | 'integrations' | 'api' | 'support'
export type DocsSectionId = 'docs-welcome' | 'docs-start' | 'docs-browse' | 'docs-reference' | 'docs-support' | 'docs-boundary'
export type DocsItemId =
  | 'welcome'
  | 'overview'
  | 'first-request'
  | 'clients'
  | 'api-keys'
  | 'billing'
  | 'models-pricing'
  | 'codex'
  | 'sdk'
  | 'image-studio'
  | 'api-basics'
  | 'chat-completions'
  | 'image-api'
  | 'models-api'
  | 'faq'
  | 'troubleshooting'
  | 'usage-logs'
  | 'contact-support'

export type DocsItemTarget = { type: 'document'; document: DocsItemId }

export const docsCatalog: Array<{ id: DocsGroupId; items: Array<{ id: DocsItemId; target: DocsItemTarget }> }> = [
  { id: 'start', items: [
    { id: 'welcome', target: { type: 'document', document: 'welcome' } },
    { id: 'overview', target: { type: 'document', document: 'overview' } },
    { id: 'first-request', target: { type: 'document', document: 'first-request' } },
    { id: 'clients', target: { type: 'document', document: 'clients' } },
  ] },
  { id: 'account', items: [
    { id: 'api-keys', target: { type: 'document', document: 'api-keys' } },
    { id: 'billing', target: { type: 'document', document: 'billing' } },
    { id: 'models-pricing', target: { type: 'document', document: 'models-pricing' } },
  ] },
  { id: 'integrations', items: [
    { id: 'codex', target: { type: 'document', document: 'codex' } },
    { id: 'sdk', target: { type: 'document', document: 'sdk' } },
    { id: 'image-studio', target: { type: 'document', document: 'image-studio' } },
  ] },
  { id: 'api', items: [
    { id: 'api-basics', target: { type: 'document', document: 'api-basics' } },
    { id: 'chat-completions', target: { type: 'document', document: 'chat-completions' } },
    { id: 'image-api', target: { type: 'document', document: 'image-api' } },
    { id: 'models-api', target: { type: 'document', document: 'models-api' } },
  ] },
  { id: 'support', items: [
    { id: 'faq', target: { type: 'document', document: 'faq' } },
    { id: 'troubleshooting', target: { type: 'document', document: 'troubleshooting' } },
    { id: 'usage-logs', target: { type: 'document', document: 'usage-logs' } },
    { id: 'contact-support', target: { type: 'document', document: 'contact-support' } },
  ] },
]

type DocsPageCopy = {
  searchPlaceholder: string
  searchLabel: string
  clearSearch: string
  noResults: string
  mobileNavigation: string
  closeNavigation: string
  home: string
  console: string
  contactSupport: string
  eyebrow: string
  title: string
  description: string
  startTitle: string
  startBody: string
  stepCreate: string
  stepModel: string
  stepRequest: string
  browseTitle: string
  browseBody: string
  referenceTitle: string
  referenceBody: string
  supportTitle: string
  supportBody: string
  boundaryTitle: string
  boundaryBody: string
  onThisPage: string
  groups: Record<DocsGroupId, { title: string; description: string }>
  items: Record<DocsItemId, string>
}

export const publicDocsCopy: Record<AppLocale, DocsPageCopy> = {
  'zh-CN': {
    searchPlaceholder: '搜索文档', searchLabel: '搜索文档', clearSearch: '清除搜索', noResults: '没有匹配的文档', mobileNavigation: '打开文档导航', closeNavigation: '关闭文档导航',
    home: '返回主站', console: '进入控制台', contactSupport: '联系支持', eyebrow: 'PARTOKENS 文档', title: '欢迎使用 Partokens', description: '了解文档结构，找到从创建密钥到完成首次调用的最短路径。',
    startTitle: '从这里开始', startBody: '第一次接入时，按顺序完成下面三步，验证账户、路由和模型是否可用。', stepCreate: '创建 API 密钥', stepModel: '确认可用模型', stepRequest: '发送首次请求',
    browseTitle: '按任务浏览', browseBody: '选择当前要完成的事情，直接进入对应的操作指南。', referenceTitle: '先完成一次兼容调用', referenceBody: 'Partokens 使用统一的 OpenAI 兼容入口。选择一种调用方式，替换模型名后即可验证接入。',
    supportTitle: '排查从可观测信息开始', supportBody: '保留请求时间、模型、状态和请求标识，并在使用日志中核对费用与延迟。', boundaryTitle: '文档范围', boundaryBody: '文档说明 Partokens 的接入方式、账户工具和兼容 API。模型、价格、参数与可用性始终以账户实时配置和服务端结果为准。', onThisPage: '本页内容',
    groups: { start: { title: '快速开始', description: '认识服务并完成首次调用。' }, account: { title: '账户与额度', description: '管理密钥、余额和模型价格。' }, integrations: { title: '接入与配置', description: '配置常用客户端、SDK 与工作台。' }, api: { title: 'API 参考', description: '查找端点、请求字段与示例。' }, support: { title: '常见问题与排查', description: '定位调用失败并获得人工帮助。' } },
    items: { welcome: '欢迎使用 Partokens', overview: 'Partokens 是什么', 'first-request': '快速开始：完成首次接入', clients: '支持的客户端总览', 'api-keys': 'API 密钥管理', billing: '余额、套餐与额度', 'models-pricing': '模型与定价', codex: 'Codex 与 CLI 配置', sdk: 'SDK 配置', 'image-studio': '生图工作台', 'api-basics': 'API 基础', 'chat-completions': '聊天补全 API', 'image-api': '图像生成 API', 'models-api': '模型列表 API', faq: '常见问题', troubleshooting: '连接、限额与重试', 'usage-logs': '使用日志', 'contact-support': '联系支持' },
  },
  'zh-TW': {
    searchPlaceholder: '搜尋文件', searchLabel: '搜尋文件', clearSearch: '清除搜尋', noResults: '沒有相符的文件', mobileNavigation: '開啟文件導覽', closeNavigation: '關閉文件導覽',
    home: '返回主站', console: '進入控制台', contactSupport: '聯絡支援', eyebrow: 'PARTOKENS 文件', title: '歡迎使用 Partokens', description: '了解文件結構，找到從建立金鑰到完成首次呼叫的最短路徑。',
    startTitle: '從這裡開始', startBody: '第一次接入時，請依序完成以下三步，驗證帳戶、路由與模型是否可用。', stepCreate: '建立 API 金鑰', stepModel: '確認可用模型', stepRequest: '送出首次請求',
    browseTitle: '依任務瀏覽', browseBody: '選擇目前要完成的事情，直接進入對應的操作指南。', referenceTitle: '先完成一次相容呼叫', referenceBody: 'Partokens 使用統一的 OpenAI 相容入口。選擇一種呼叫方式，替換模型名稱後即可驗證接入。',
    supportTitle: '從可觀測資訊開始排查', supportBody: '保留請求時間、模型、狀態與請求識別碼，並在使用記錄中核對費用與延遲。', boundaryTitle: '文件範圍', boundaryBody: '文件說明 Partokens 的接入方式、帳戶工具與相容 API。模型、價格、參數與可用性一律以帳戶即時設定和伺服器結果為準。', onThisPage: '本頁內容',
    groups: { start: { title: '快速開始', description: '認識服務並完成首次呼叫。' }, account: { title: '帳戶與額度', description: '管理金鑰、餘額與模型價格。' }, integrations: { title: '接入與設定', description: '設定常用客戶端、SDK 與工作台。' }, api: { title: 'API 參考', description: '查找端點、請求欄位與範例。' }, support: { title: '常見問題與排查', description: '定位呼叫失敗並取得人工協助。' } },
    items: { welcome: '歡迎使用 Partokens', overview: 'Partokens 是什麼', 'first-request': '快速開始：完成首次接入', clients: '支援的客戶端總覽', 'api-keys': 'API 金鑰管理', billing: '餘額、方案與額度', 'models-pricing': '模型與定價', codex: 'Codex 與 CLI 設定', sdk: 'SDK 設定', 'image-studio': '生圖工作台', 'api-basics': 'API 基礎', 'chat-completions': '聊天補全 API', 'image-api': '圖像生成 API', 'models-api': '模型清單 API', faq: '常見問題', troubleshooting: '連線、限額與重試', 'usage-logs': '使用記錄', 'contact-support': '聯絡支援' },
  },
  en: {
    searchPlaceholder: 'Search documentation', searchLabel: 'Search documentation', clearSearch: 'Clear search', noResults: 'No matching documentation', mobileNavigation: 'Open documentation navigation', closeNavigation: 'Close documentation navigation',
    home: 'Back to site', console: 'Open console', contactSupport: 'Contact support', eyebrow: 'PARTOKENS DOCS', title: 'Welcome to Partokens', description: 'Understand the documentation structure and find the shortest path from creating a key to completing your first call.',
    startTitle: 'Start here', startBody: 'For a first integration, complete these three steps in order to verify the account, route, and model.', stepCreate: 'Create an API key', stepModel: 'Confirm an available model', stepRequest: 'Send the first request',
    browseTitle: 'Browse by task', browseBody: 'Choose what you need to do and open the matching guide.', referenceTitle: 'Complete one compatible call', referenceBody: 'Partokens provides one OpenAI-compatible entry point. Choose a client, replace the model name, and verify the integration.',
    supportTitle: 'Troubleshoot from observable data', supportBody: 'Keep the request time, model, status, and request identifier, then check cost and latency in Usage logs.', boundaryTitle: 'Documentation scope', boundaryBody: 'These docs cover Partokens integration, account tools, and compatible APIs. Live account configuration and server results remain authoritative for models, prices, parameters, and availability.', onThisPage: 'On this page',
    groups: { start: { title: 'Quick start', description: 'Understand the service and complete a first call.' }, account: { title: 'Account and quota', description: 'Manage keys, balance, and model prices.' }, integrations: { title: 'Integration and setup', description: 'Configure clients, SDKs, and workspaces.' }, api: { title: 'API reference', description: 'Find endpoints, request fields, and examples.' }, support: { title: 'FAQ and troubleshooting', description: 'Diagnose failed calls and reach support.' } },
    items: { welcome: 'Welcome to Partokens', overview: 'What is Partokens?', 'first-request': 'Quick start: first integration', clients: 'Supported clients', 'api-keys': 'API key management', billing: 'Balance, plans, and quota', 'models-pricing': 'Models and pricing', codex: 'Codex and CLI setup', sdk: 'SDK setup', 'image-studio': 'Image Studio', 'api-basics': 'API basics', 'chat-completions': 'Chat Completions API', 'image-api': 'Image generation API', 'models-api': 'Models API', faq: 'Frequently asked questions', troubleshooting: 'Connection, limits, and retries', 'usage-logs': 'Usage logs', 'contact-support': 'Contact support' },
  },
  ja: {
    searchPlaceholder: 'ドキュメントを検索', searchLabel: 'ドキュメントを検索', clearSearch: '検索を消去', noResults: '一致するドキュメントはありません', mobileNavigation: 'ドキュメントナビゲーションを開く', closeNavigation: 'ドキュメントナビゲーションを閉じる',
    home: 'サイトに戻る', console: 'コンソールを開く', contactSupport: 'サポートに連絡', eyebrow: 'PARTOKENS ドキュメント', title: 'Partokens へようこそ', description: 'ドキュメントの構成を把握し、キー作成から最初の呼び出しまでの最短手順を見つけます。',
    startTitle: 'ここから始める', startBody: '初めて接続する場合は、次の三手順を順に完了してアカウント、ルート、モデルを確認します。', stepCreate: 'API キーを作成', stepModel: '利用可能なモデルを確認', stepRequest: '最初のリクエストを送信',
    browseTitle: 'タスクから探す', browseBody: '行いたい作業を選び、対応するガイドを開きます。', referenceTitle: '互換リクエストを一度完了する', referenceBody: 'Partokens は統一された OpenAI 互換入口を提供します。呼び出し方法を選び、モデル名を置き換えて接続を確認します。',
    supportTitle: '観測できる情報から調査する', supportBody: '時刻、モデル、状態、リクエスト ID を残し、使用ログで料金と遅延を確認します。', boundaryTitle: 'ドキュメントの範囲', boundaryBody: 'Partokens の接続方法、アカウントツール、互換 API を説明します。モデル、価格、パラメータ、可用性はアカウントの現在設定とサーバー結果が優先されます。', onThisPage: 'このページの内容',
    groups: { start: { title: 'クイックスタート', description: 'サービスを理解し、最初の呼び出しを完了します。' }, account: { title: 'アカウントと割り当て', description: 'キー、残高、モデル価格を管理します。' }, integrations: { title: '接続と設定', description: 'クライアント、SDK、ワークスペースを設定します。' }, api: { title: 'API リファレンス', description: 'エンドポイント、フィールド、例を確認します。' }, support: { title: 'FAQ とトラブルシューティング', description: '失敗を調査し、サポートへ連絡します。' } },
    items: { welcome: 'Partokens へようこそ', overview: 'Partokens とは', 'first-request': 'クイックスタート：初回接続', clients: '対応クライアント', 'api-keys': 'API キー管理', billing: '残高、プラン、割り当て', 'models-pricing': 'モデルと料金', codex: 'Codex と CLI の設定', sdk: 'SDK の設定', 'image-studio': '画像スタジオ', 'api-basics': 'API の基本', 'chat-completions': 'Chat Completions API', 'image-api': '画像生成 API', 'models-api': 'モデル API', faq: 'よくある質問', troubleshooting: '接続、上限、再試行', 'usage-logs': '使用ログ', 'contact-support': 'サポートに連絡' },
  },
  ru: {
    searchPlaceholder: 'Поиск по документации', searchLabel: 'Поиск по документации', clearSearch: 'Очистить поиск', noResults: 'Ничего не найдено', mobileNavigation: 'Открыть навигацию', closeNavigation: 'Закрыть навигацию',
    home: 'Вернуться на сайт', console: 'Открыть консоль', contactSupport: 'Связаться с поддержкой', eyebrow: 'ДОКУМЕНТАЦИЯ PARTOKENS', title: 'Добро пожаловать в Partokens', description: 'Изучите структуру документации и кратчайший путь от создания ключа до первого вызова.',
    startTitle: 'Начните здесь', startBody: 'При первом подключении выполните три шага по порядку, чтобы проверить аккаунт, маршрут и модель.', stepCreate: 'Создать API-ключ', stepModel: 'Проверить доступную модель', stepRequest: 'Отправить первый запрос',
    browseTitle: 'Поиск по задаче', browseBody: 'Выберите задачу и откройте соответствующее руководство.', referenceTitle: 'Выполните один совместимый вызов', referenceBody: 'Partokens предоставляет единую OpenAI-совместимую точку входа. Выберите способ вызова, замените модель и проверьте подключение.',
    supportTitle: 'Начните диагностику с данных', supportBody: 'Сохраните время, модель, статус и ID запроса, затем проверьте стоимость и задержку в журнале.', boundaryTitle: 'Границы документации', boundaryBody: 'Документация описывает подключение, инструменты аккаунта и совместимые API. Для моделей, цен, параметров и доступности приоритетны текущая конфигурация аккаунта и ответ сервера.', onThisPage: 'На этой странице',
    groups: { start: { title: 'Быстрый старт', description: 'Изучите сервис и выполните первый вызов.' }, account: { title: 'Аккаунт и квота', description: 'Управляйте ключами, балансом и ценами.' }, integrations: { title: 'Подключение и настройка', description: 'Настройте клиенты, SDK и рабочие области.' }, api: { title: 'Справочник API', description: 'Найдите эндпоинты, поля и примеры.' }, support: { title: 'FAQ и диагностика', description: 'Разберите ошибки и обратитесь в поддержку.' } },
    items: { welcome: 'Добро пожаловать в Partokens', overview: 'Что такое Partokens', 'first-request': 'Быстрый старт: первое подключение', clients: 'Поддерживаемые клиенты', 'api-keys': 'Управление API-ключами', billing: 'Баланс, планы и квота', 'models-pricing': 'Модели и цены', codex: 'Настройка Codex и CLI', sdk: 'Настройка SDK', 'image-studio': 'Студия изображений', 'api-basics': 'Основы API', 'chat-completions': 'API Chat Completions', 'image-api': 'API генерации изображений', 'models-api': 'API моделей', faq: 'Частые вопросы', troubleshooting: 'Подключение, лимиты и повторы', 'usage-logs': 'Журнал использования', 'contact-support': 'Связаться с поддержкой' },
  },
  fr: {
    searchPlaceholder: 'Rechercher dans la documentation', searchLabel: 'Rechercher dans la documentation', clearSearch: 'Effacer la recherche', noResults: 'Aucun document correspondant', mobileNavigation: 'Ouvrir la navigation', closeNavigation: 'Fermer la navigation',
    home: 'Retour au site', console: 'Ouvrir la console', contactSupport: 'Contacter le support', eyebrow: 'DOCUMENTATION PARTOKENS', title: 'Bienvenue sur Partokens', description: 'Comprenez la structure et trouvez le chemin le plus court entre la création d’une clé et votre premier appel.',
    startTitle: 'Commencer ici', startBody: 'Pour une première intégration, suivez ces trois étapes afin de vérifier le compte, le routage et le modèle.', stepCreate: 'Créer une clé API', stepModel: 'Confirmer un modèle disponible', stepRequest: 'Envoyer la première requête',
    browseTitle: 'Parcourir par tâche', browseBody: 'Choisissez une tâche et ouvrez le guide correspondant.', referenceTitle: 'Effectuer un appel compatible', referenceBody: 'Partokens fournit un point d’entrée compatible OpenAI. Choisissez une méthode, remplacez le modèle et vérifiez l’intégration.',
    supportTitle: 'Diagnostiquer avec les données visibles', supportBody: 'Conservez l’heure, le modèle, l’état et l’identifiant, puis vérifiez le coût et la latence dans les journaux.', boundaryTitle: 'Périmètre de la documentation', boundaryBody: 'La documentation couvre l’intégration, les outils de compte et les API compatibles. La configuration actuelle du compte et les résultats du serveur font foi pour les modèles, prix, paramètres et disponibilité.', onThisPage: 'Sur cette page',
    groups: { start: { title: 'Démarrage rapide', description: 'Comprendre le service et réussir un premier appel.' }, account: { title: 'Compte et quota', description: 'Gérer les clés, le solde et les prix.' }, integrations: { title: 'Intégration et configuration', description: 'Configurer les clients, SDK et espaces.' }, api: { title: 'Référence API', description: 'Trouver les points, champs et exemples.' }, support: { title: 'FAQ et dépannage', description: 'Diagnostiquer les échecs et contacter le support.' } },
    items: { welcome: 'Bienvenue sur Partokens', overview: 'Qu’est-ce que Partokens ?', 'first-request': 'Démarrage rapide : première intégration', clients: 'Clients pris en charge', 'api-keys': 'Gestion des clés API', billing: 'Solde, offres et quota', 'models-pricing': 'Modèles et tarifs', codex: 'Configuration Codex et CLI', sdk: 'Configuration SDK', 'image-studio': 'Studio d’images', 'api-basics': 'Bases de l’API', 'chat-completions': 'API Chat Completions', 'image-api': 'API de génération d’images', 'models-api': 'API des modèles', faq: 'Questions fréquentes', troubleshooting: 'Connexion, limites et reprises', 'usage-logs': 'Journaux d’utilisation', 'contact-support': 'Contacter le support' },
  },
  vi: {
    searchPlaceholder: 'Tìm trong tài liệu', searchLabel: 'Tìm trong tài liệu', clearSearch: 'Xóa tìm kiếm', noResults: 'Không có tài liệu phù hợp', mobileNavigation: 'Mở điều hướng tài liệu', closeNavigation: 'Đóng điều hướng tài liệu',
    home: 'Về trang chính', console: 'Mở bảng điều khiển', contactSupport: 'Liên hệ hỗ trợ', eyebrow: 'TÀI LIỆU PARTOKENS', title: 'Chào mừng đến với Partokens', description: 'Hiểu cấu trúc tài liệu và tìm đường ngắn nhất từ tạo khóa đến hoàn tất yêu cầu đầu tiên.',
    startTitle: 'Bắt đầu tại đây', startBody: 'Nếu đây là lần tích hợp đầu tiên, hãy hoàn thành ba bước theo thứ tự để kiểm tra tài khoản, tuyến và mô hình.', stepCreate: 'Tạo khóa API', stepModel: 'Xác nhận mô hình khả dụng', stepRequest: 'Gửi yêu cầu đầu tiên',
    browseTitle: 'Duyệt theo công việc', browseBody: 'Chọn việc cần làm và mở hướng dẫn tương ứng.', referenceTitle: 'Hoàn tất một yêu cầu tương thích', referenceBody: 'Partokens cung cấp một điểm vào tương thích OpenAI. Chọn cách gọi, thay tên mô hình và xác minh kết nối.',
    supportTitle: 'Bắt đầu xử lý từ dữ liệu quan sát được', supportBody: 'Giữ thời gian, mô hình, trạng thái và mã yêu cầu, sau đó kiểm tra chi phí cùng độ trễ trong nhật ký.', boundaryTitle: 'Phạm vi tài liệu', boundaryBody: 'Tài liệu mô tả tích hợp, công cụ tài khoản và API tương thích. Cấu hình tài khoản hiện tại cùng kết quả máy chủ là nguồn quyết định cho mô hình, giá, tham số và khả dụng.', onThisPage: 'Trong trang này',
    groups: { start: { title: 'Bắt đầu nhanh', description: 'Hiểu dịch vụ và hoàn tất yêu cầu đầu tiên.' }, account: { title: 'Tài khoản và hạn mức', description: 'Quản lý khóa, số dư và giá mô hình.' }, integrations: { title: 'Tích hợp và cấu hình', description: 'Thiết lập ứng dụng, SDK và không gian làm việc.' }, api: { title: 'Tham chiếu API', description: 'Tìm endpoint, trường yêu cầu và ví dụ.' }, support: { title: 'FAQ và xử lý sự cố', description: 'Chẩn đoán lỗi và liên hệ hỗ trợ.' } },
    items: { welcome: 'Chào mừng đến với Partokens', overview: 'Partokens là gì?', 'first-request': 'Bắt đầu nhanh: tích hợp đầu tiên', clients: 'Ứng dụng được hỗ trợ', 'api-keys': 'Quản lý khóa API', billing: 'Số dư, gói và hạn mức', 'models-pricing': 'Mô hình và giá', codex: 'Cấu hình Codex và CLI', sdk: 'Cấu hình SDK', 'image-studio': 'Xưởng tạo ảnh', 'api-basics': 'API cơ bản', 'chat-completions': 'API Chat Completions', 'image-api': 'API tạo ảnh', 'models-api': 'API mô hình', faq: 'Câu hỏi thường gặp', troubleshooting: 'Kết nối, giới hạn và thử lại', 'usage-logs': 'Nhật ký sử dụng', 'contact-support': 'Liên hệ hỗ trợ' },
  },
}
