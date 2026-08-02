import type { AppLocale } from '@partokens/i18n'

export type HomePageTarget = 'console-playground' | 'console-studio' | 'console-keys' | 'docs'
export type HomePageTone = 'lilac' | 'mint' | 'coral'

type HomeAction = {
  id: string
  title: string
  body: string
  action: string
  ariaLabel: string
  target: HomePageTarget
  tone: HomePageTone
}

type HomeWorkflow = {
  id: string
  title: string
  body: string
  kicker: string
  boundary: string
  tone: HomePageTone
}

export type HomePageCopy = {
  hero: {
    eyebrow: string
    title: string
    body: string
    previewLabel: string
    actions: { primary: string; secondary: string }
    capabilities: Array<{ id: string; label: string }>
  }
  sections: {
    startedEyebrow: string
    workflowEyebrow: string
    trustEyebrow: string
    useCasesEyebrow: string
    faqEyebrow: string
  }
  started: { title: string; body: string; items: HomeAction[] }
  workflow: { title: string; body: string; items: HomeWorkflow[] }
  trust: {
    title: string
    body: string
    items: Array<{ id: string; title: string; body: string }>
  }
  useCases: { title: string; body: string; items: HomeAction[] }
  faq: {
    title: string
    body: string
    items: Array<{ id: string; question: string; answer: string }>
  }
  preview: {
    developerConsole: string
    workspace: string
    tabs: { chat: string; image: string; api: string }
    localHistory: string
    newChat: string
    imageStudio: string
    generate: string
    prompt: string
    result: string
    overview: string
    apiKeys: string
    signIn: string
    accountBalance: string
    periodUsage: string
    accountData: string
    baseUrl: string
    usageLogs: string
    today: string
    recentChats: string
    preferences: string
    createKey: string
    compatibleEndpoint: string
    compatibleEndpointBody: string
    restrictedKey: string
    restrictedKeyBody: string
    traceableUsage: string
    traceableUsageBody: string
    sendLabel: string
  }
  samples: {
    question: string
    answer: string
    composer: string
    chatTitle: string
    chatSecond: string
    imagePrompt: string
    studioAlt: string
  }
}

export const homePageCopy = {
  'zh-CN': {
    hero: {
      eyebrow: '面向真实 AI 工作',
      title: '你的 AI 工作区，从对话到创作。',
      body: '在一个账户里继续对话、组织图像创作，再把兼容 API 接入自己的应用。',
      previewLabel: 'Partokens 产品工作区预览',
      actions: { primary: '前往控制台', secondary: '查看接入文档' },
      capabilities: [
        { id: 'local-chat', label: '本地会话记录' },
        { id: 'canvas-workflow', label: '可回看的图像画布' },
        { id: 'controlled-access', label: '受限密钥与用量记录' },
      ],
    },
    sections: { startedEyebrow: '工作路径', workflowEyebrow: '连续工作流', trustEyebrow: '工作与信任边界', useCasesEyebrow: '典型任务', faqEyebrow: '常见问题' },
    started: {
      title: '从当前任务出发，沿一条路径继续',
      body: '先对话，再在画布中创作，最后将能力接入应用。每一步都通向真实工作区。',
      items: [
        { id: 'start-chat', title: '对话', body: '用本地历史延续思路，并接收流式响应。', action: '打开对话', ariaLabel: '打开对话工作区', target: 'console-playground', tone: 'lilac' },
        { id: 'start-create', title: '创作', body: '把提示词、参考图与结果留在同一画布。', action: '进入图像工作台', ariaLabel: '进入图像工作台', target: 'console-studio', tone: 'mint' },
        { id: 'start-connect', title: '接入', body: '创建有范围的密钥，并从日志追踪请求。', action: '管理 API 密钥', ariaLabel: '前往 API 密钥管理', target: 'console-keys', tone: 'coral' },
      ],
    },
    workflow: {
      title: '一次工作，可以自然延伸到下一步',
      body: '三个工作区共享清晰的账户边界，让思考、生成与接入保持连续。',
      items: [
      { id: 'workflow-chat', kicker: '01 / 延续对话', title: '让上下文留在手边，而不是留在服务端', body: '创建新对话、切换最近记录并接收流式响应。最近会话默认保存在当前浏览器。', boundary: '边界：Partokens 不保存这些本地会话记录。', tone: 'lilac' },
      { id: 'workflow-image', kicker: '02 / 画布创作', title: '从提示词到结果，保留可回看的创作过程', body: '在同一画布连接提示词、参考素材和生成结果，让探索过程可以继续整理。', boundary: '边界：画布项目保存在当前设备，图片作为真实生成结果出现。', tone: 'mint' },
      { id: 'workflow-api', kicker: '03 / 受控接入', title: '把调用入口、密钥范围和使用记录放在一起', body: '使用 OpenAI 兼容地址接入，按模型、额度和有效期限制密钥，并在日志中核对请求。', boundary: '边界：可用模型、计费与路由始终以服务端结果为准。', tone: 'coral' },
      ],
    },
    trust: {
      title: '清楚知道什么能做，数据留在哪里', body: 'Partokens 把兼容接入、创作工具和账户控制集中起来，同时明确本地与服务端的职责。',
      items: [
        { id: 'compatible', title: '兼容接入', body: '使用熟悉的 OpenAI 兼容基础地址与 SDK。' },
        { id: 'unified', title: '连续工作', body: '对话、图像、密钥和用量沿同一工作路径组织。' },
        { id: 'traceable', title: '可追溯用量', body: '余额、用量与请求日志按账户清楚呈现。' },
        { id: 'local', title: '本地对话', body: '最近会话记录默认只留在当前浏览器。' },
        { id: 'controlled', title: '权限可控', body: '按模型、额度与有效期约束 API 密钥。' },
        { id: 'multilingual', title: '七种语言', body: '产品界面与使用文档保持同步国际化。' },
      ],
    },
    useCases: {
      title: '从三个常见任务直接进入', body: '不必先了解全部功能，选择与你当前工作最接近的入口。',
      items: [
        { id: 'release-check', title: '发布检查', body: '整理发布前验证、上线步骤和回滚准备。', action: '在对话中整理', ariaLabel: '在对话工作区整理发布检查', target: 'console-playground', tone: 'lilac' },
        { id: 'visual-explore', title: '视觉探索', body: '把提示、参考和生成结果组织成可继续调整的画布。', action: '进入图像工作台', ariaLabel: '进入图像工作台进行视觉探索', target: 'console-studio', tone: 'mint' },
        { id: 'app-connect', title: '应用接入', body: '创建受限密钥，并按文档替换基础地址完成接入。', action: '阅读接入文档', ariaLabel: '阅读应用 API 接入文档', target: 'docs', tone: 'coral' },
      ],
    },
    faq: {
      title: '开始之前，你可能想知道', body: '关于隐私、账户安全和 API 接入的常见问题。',
      items: [
        { id: 'direct-use', question: 'Partokens 可以直接开始聊天和生图吗？', answer: '可以。登录后从控制台进入对话或图像工作台即可开始。' },
        { id: 'chat-storage', question: '聊天记录会上传到 Partokens 吗？', answer: '最近聊天记录默认存储在当前浏览器，Partokens 不保存这些会话记录。' },
        { id: 'sdk', question: '现有 OpenAI SDK 可以继续使用吗？', answer: '可以。创建 API 密钥后，按使用文档替换基础地址与密钥即可。' },
        { id: 'usage', question: '如何查看余额和每次调用？', answer: '控制台展示余额与用量；数据看板和使用日志提供更完整的请求记录。' },
      ],
    },
    preview: { developerConsole: '开发者控制台', workspace: '工作区', tabs: { chat: '对话', image: '图像', api: 'API' }, localHistory: '本地记录', newChat: '新对话', imageStudio: '图像工作台', generate: '生成', prompt: '提示词', result: '结果', overview: '概览', apiKeys: 'API 密钥', signIn: '登录后可用', accountBalance: '账户余额', periodUsage: '30 天用量', accountData: '账户数据', baseUrl: '基础地址', usageLogs: '使用日志', today: '今天', recentChats: '最近对话', preferences: '图像设置', createKey: '创建密钥', compatibleEndpoint: '兼容接入地址', compatibleEndpointBody: '在支持自定义 OpenAI 基础地址的客户端中使用。', restrictedKey: '受限 API 密钥', restrictedKeyBody: '按模型、额度和有效期限制访问。', traceableUsage: '可追溯使用记录', traceableUsageBody: '按账户核对用量与每次请求。', sendLabel: '发送消息' },
    samples: { question: '帮我整理一份产品发布检查清单。', answer: '可以。我会按发布前验证、上线步骤和回滚准备三个部分整理。', composer: '输入消息，开始对话', chatTitle: '产品发布检查清单', chatSecond: '竞品信息整理', imagePrompt: '浅色石材展亭，鼠尾草玻璃与钴蓝结构', studioAlt: '由浅色石材、鼠尾草玻璃和钴蓝构件组成的建筑生成图' },
  },
  'zh-TW': {
    hero: { eyebrow: '面向真實 AI 工作', title: '你的 AI 工作區，從對話到創作。', body: '在一個帳戶中延續對話、整理圖像創作，再將相容 API 接入自己的應用。', previewLabel: 'Partokens 產品工作區預覽', actions: { primary: '前往控制台', secondary: '查看接入文件' }, capabilities: [{ id: 'local-chat', label: '本機對話記錄' }, { id: 'canvas-workflow', label: '可回看的圖像畫布' }, { id: 'controlled-access', label: '受限金鑰與用量記錄' }] },
    sections: { startedEyebrow: '工作路徑', workflowEyebrow: '連續工作流程', trustEyebrow: '工作與信任邊界', useCasesEyebrow: '典型任務', faqEyebrow: '常見問題' },
    started: { title: '從目前任務出發，沿一條路徑繼續', body: '先對話，再於畫布中創作，最後將能力接入應用。每一步都通往真實工作區。', items: [
      { id: 'start-chat', title: '對話', body: '用本機記錄延續想法並接收串流回應。', action: '開啟對話', ariaLabel: '開啟對話工作區', target: 'console-playground', tone: 'lilac' },
      { id: 'start-create', title: '創作', body: '把提示詞、參考圖與結果留在同一畫布。', action: '進入圖像工作台', ariaLabel: '進入圖像工作台', target: 'console-studio', tone: 'mint' },
      { id: 'start-connect', title: '接入', body: '建立有範圍的金鑰，並從記錄追蹤請求。', action: '管理 API 金鑰', ariaLabel: '前往 API 金鑰管理', target: 'console-keys', tone: 'coral' },
    ] },
    workflow: { title: '一次工作，可以自然延伸到下一步', body: '三個工作區共享清楚的帳戶邊界，讓思考、生成與接入保持連續。', items: [
      { id: 'workflow-chat', kicker: '01 / 延續對話', title: '讓上下文留在手邊，而不是留在伺服器', body: '建立新對話、切換最近記錄並接收串流回應。最近對話預設保存在目前瀏覽器。', boundary: '邊界：Partokens 不保存這些本機對話記錄。', tone: 'lilac' },
      { id: 'workflow-image', kicker: '02 / 畫布創作', title: '從提示詞到結果，保留可回看的創作過程', body: '在同一畫布連接提示詞、參考素材和生成結果，讓探索過程可以繼續整理。', boundary: '邊界：畫布專案保存在目前裝置，圖片作為真實生成結果出現。', tone: 'mint' },
      { id: 'workflow-api', kicker: '03 / 受控接入', title: '把呼叫入口、金鑰範圍和使用記錄放在一起', body: '使用 OpenAI 相容地址接入，依模型、額度和有效期限限制金鑰，並在記錄中核對請求。', boundary: '邊界：可用模型、計費與路由始終以伺服器結果為準。', tone: 'coral' },
    ] },
    trust: { title: '清楚知道什麼能做，資料留在哪裡', body: 'Partokens 將相容接入、創作工具和帳戶控制集中起來，同時明確本機與伺服器的職責。', items: [{ id: 'compatible', title: '相容接入', body: '使用熟悉的 OpenAI 相容基礎地址與 SDK。' }, { id: 'unified', title: '連續工作', body: '對話、圖像、金鑰和用量沿同一工作路徑組織。' }, { id: 'traceable', title: '可追溯用量', body: '餘額、用量與請求記錄依帳戶清楚呈現。' }, { id: 'local', title: '本機對話', body: '最近對話記錄預設只留在目前瀏覽器。' }, { id: 'controlled', title: '權限可控', body: '依模型、額度與有效期限限制 API 金鑰。' }, { id: 'multilingual', title: '七種語言', body: '產品介面與使用文件保持同步國際化。' }] },
    useCases: { title: '從三個常見任務直接進入', body: '不必先了解全部功能，選擇與目前工作最接近的入口。', items: [{ id: 'release-check', title: '發布檢查', body: '整理發布前驗證、上線步驟和回復準備。', action: '在對話中整理', ariaLabel: '在對話工作區整理發布檢查', target: 'console-playground', tone: 'lilac' }, { id: 'visual-explore', title: '視覺探索', body: '把提示、參考和生成結果組織成可繼續調整的畫布。', action: '進入圖像工作台', ariaLabel: '進入圖像工作台進行視覺探索', target: 'console-studio', tone: 'mint' }, { id: 'app-connect', title: '應用接入', body: '建立受限金鑰，並依文件替換基礎地址完成接入。', action: '閱讀接入文件', ariaLabel: '閱讀應用 API 接入文件', target: 'docs', tone: 'coral' }] },
    faq: { title: '開始之前，你可能想知道', body: '關於隱私、帳戶安全與 API 接入的常見問題。', items: [{ id: 'direct-use', question: 'Partokens 可以直接開始對話與生圖嗎？', answer: '可以。登入後從控制台進入對話或圖像工作台即可開始。' }, { id: 'chat-storage', question: '對話記錄會上傳到 Partokens 嗎？', answer: '最近對話預設儲存在目前瀏覽器，Partokens 不會保存這些對話記錄。' }, { id: 'sdk', question: '可以繼續使用現有的 OpenAI SDK 嗎？', answer: '可以。建立 API 金鑰後，依使用文件替換基礎地址與金鑰即可。' }, { id: 'usage', question: '如何查看餘額與每次呼叫？', answer: '控制台顯示餘額與用量；資料看板和使用記錄提供完整明細。' }] },
    preview: { developerConsole: '開發者控制台', workspace: '工作區', tabs: { chat: '對話', image: '圖像', api: 'API' }, localHistory: '本機記錄', newChat: '新對話', imageStudio: '圖像工作台', generate: '生成', prompt: '提示詞', result: '結果', overview: '概覽', apiKeys: 'API 金鑰', signIn: '登入後可用', accountBalance: '帳戶餘額', periodUsage: '30 天用量', accountData: '帳戶資料', baseUrl: '基礎地址', usageLogs: '使用記錄', today: '今天', recentChats: '最近對話', preferences: '圖像設定', createKey: '建立金鑰', compatibleEndpoint: '相容接入地址', compatibleEndpointBody: '在支援自訂 OpenAI 基礎地址的客戶端中使用。', restrictedKey: '受限 API 金鑰', restrictedKeyBody: '依模型、額度和有效期限限制存取。', traceableUsage: '可追溯使用記錄', traceableUsageBody: '依帳戶核對用量與每次請求。', sendLabel: '傳送訊息' },
    samples: { question: '幫我整理一份產品發布檢查清單。', answer: '可以。我會依發布前驗證、上線步驟與回復準備三部分整理。', composer: '輸入訊息，開始對話', chatTitle: '產品發布檢查清單', chatSecond: '競品資訊整理', imagePrompt: '淺色石材展亭、鼠尾草玻璃與鈷藍結構', studioAlt: '由淺色石材、鼠尾草玻璃和鈷藍構件組成的建築生成圖' },
  },
  en: {
    hero: { eyebrow: 'Built for real AI work', title: 'Your AI workspace, from conversation to creation.', body: 'Continue a conversation, shape visual work, then bring a compatible API into your own application from one account.', previewLabel: 'Partokens product workspace preview', actions: { primary: 'Go to console', secondary: 'Read integration docs' }, capabilities: [{ id: 'local-chat', label: 'Local conversation history' }, { id: 'canvas-workflow', label: 'Revisitable image canvas' }, { id: 'controlled-access', label: 'Restricted keys and usage logs' }] },
    sections: { startedEyebrow: 'Work path', workflowEyebrow: 'Continuous workflow', trustEyebrow: 'Work and trust boundaries', useCasesEyebrow: 'Typical tasks', faqEyebrow: 'Frequently asked questions' },
    started: { title: 'Start with the task at hand and keep moving', body: 'Talk first, create on a canvas, then connect the capability to an application. Every step opens a real workspace.', items: [
      { id: 'start-chat', title: 'Talk', body: 'Continue an idea with local history and streaming responses.', action: 'Open conversation', ariaLabel: 'Open the conversation workspace', target: 'console-playground', tone: 'lilac' },
      { id: 'start-create', title: 'Create', body: 'Keep prompts, references, and results on the same canvas.', action: 'Enter Image Studio', ariaLabel: 'Enter the image workspace', target: 'console-studio', tone: 'mint' },
      { id: 'start-connect', title: 'Connect', body: 'Create scoped keys and trace requests through usage logs.', action: 'Manage API keys', ariaLabel: 'Open API key management', target: 'console-keys', tone: 'coral' },
    ] },
    workflow: { title: 'One piece of work can lead naturally into the next', body: 'Three workspaces share clear account boundaries, keeping thought, generation, and integration connected.', items: [
      { id: 'workflow-chat', kicker: '01 / Continue the conversation', title: 'Keep context close at hand, not on the server', body: 'Create chats, switch between recent history, and receive streaming responses. Recent conversations stay in this browser by default.', boundary: 'Boundary: Partokens does not store this local conversation history.', tone: 'lilac' },
      { id: 'workflow-image', kicker: '02 / Create on canvas', title: 'Keep a revisitable process from prompt to result', body: 'Connect prompts, references, and generated results on one canvas so visual exploration remains organized and editable.', boundary: 'Boundary: Canvas projects stay on this device; images appear as actual generated results.', tone: 'mint' },
      { id: 'workflow-api', kicker: '03 / Connect with control', title: 'Put the endpoint, key scope, and usage record together', body: 'Use an OpenAI-compatible endpoint, restrict keys by model, quota, and expiry, then verify requests in usage logs.', boundary: 'Boundary: Available models, billing, and routing remain server-authoritative.', tone: 'coral' },
    ] },
    trust: { title: 'Know what the product does and where data stays', body: 'Partokens brings compatible access, creation tools, and account controls together while keeping local and server responsibilities explicit.', items: [{ id: 'compatible', title: 'Compatible access', body: 'Use a familiar OpenAI-compatible base URL and SDK.' }, { id: 'unified', title: 'Continuous work', body: 'Organize conversations, images, keys, and usage along one path.' }, { id: 'traceable', title: 'Traceable usage', body: 'Review balance, usage, and request logs by account.' }, { id: 'local', title: 'Local conversations', body: 'Recent conversation history stays in this browser by default.' }, { id: 'controlled', title: 'Controlled permissions', body: 'Restrict API keys by model, quota, and expiry.' }, { id: 'multilingual', title: 'Seven languages', body: 'Product UI and documentation evolve together internationally.' }] },
    useCases: { title: 'Enter through three common tasks', body: 'You do not need to learn every feature first. Choose the entry closest to the work in front of you.', items: [{ id: 'release-check', title: 'Release check', body: 'Organize pre-release validation, launch steps, and rollback preparation.', action: 'Plan in conversation', ariaLabel: 'Plan a release check in the conversation workspace', target: 'console-playground', tone: 'lilac' }, { id: 'visual-explore', title: 'Visual exploration', body: 'Arrange prompts, references, and generated results on an adjustable canvas.', action: 'Enter Image Studio', ariaLabel: 'Enter Image Studio for visual exploration', target: 'console-studio', tone: 'mint' }, { id: 'app-connect', title: 'Application integration', body: 'Create a restricted key and replace the base URL using the integration guide.', action: 'Read integration docs', ariaLabel: 'Read the application API integration guide', target: 'docs', tone: 'coral' }] },
    faq: { title: 'What you may want to know first', body: 'Common questions about privacy, account security, and API access.', items: [{ id: 'direct-use', question: 'Can I chat and create images directly in Partokens?', answer: 'Yes. After sign-in, open the conversation workspace or Image Studio to begin.' }, { id: 'chat-storage', question: 'Does Partokens store my conversation history?', answer: 'Recent conversations stay in this browser by default. Partokens does not store that conversation history.' }, { id: 'sdk', question: 'Can I keep using my current OpenAI SDK?', answer: 'Yes. Create an API key, then replace the base URL and key as shown in the documentation.' }, { id: 'usage', question: 'Where can I inspect balance and individual calls?', answer: 'Balance and usage are visible in the console, with more detail in analytics and usage logs.' }] },
    preview: { developerConsole: 'Developer console', workspace: 'Workspace', tabs: { chat: 'Conversation', image: 'Image', api: 'API' }, localHistory: 'Local history', newChat: 'New chat', imageStudio: 'Image Studio', generate: 'Generate', prompt: 'Prompt', result: 'Result', overview: 'Overview', apiKeys: 'API keys', signIn: 'Available after sign-in', accountBalance: 'Account balance', periodUsage: '30-day use', accountData: 'Account data', baseUrl: 'Base URL', usageLogs: 'Usage logs', today: 'Today', recentChats: 'Recent chats', preferences: 'Image settings', createKey: 'Create a key', compatibleEndpoint: 'Compatible endpoint', compatibleEndpointBody: 'Use it in clients that accept a custom OpenAI base URL.', restrictedKey: 'Restricted API key', restrictedKeyBody: 'Limit access by model, quota, and expiry.', traceableUsage: 'Traceable usage record', traceableUsageBody: 'Review usage and each request by account.', sendLabel: 'Send message' },
    samples: { question: 'Create a product release checklist for me.', answer: 'I will organize it into pre-release validation, launch steps, and rollback preparation.', composer: 'Write a message to start', chatTitle: 'Product release checklist', chatSecond: 'Competitor research', imagePrompt: 'Pale stone pavilion, sage glass, cobalt structure', studioAlt: 'Generated architectural image with pale stone, sage glass, and a cobalt structural element' },
  },
  ja: {
    hero: { eyebrow: '実際の AI ワークのために', title: '会話から創作まで、一つの AI ワークスペースで。', body: '一つのアカウントで会話を続け、画像制作を整理し、互換 API を自分のアプリへ接続できます。', previewLabel: 'Partokens 製品ワークスペースのプレビュー', actions: { primary: 'コンソールへ', secondary: '接続ドキュメントを見る' }, capabilities: [{ id: 'local-chat', label: 'ローカル会話履歴' }, { id: 'canvas-workflow', label: '振り返れる画像キャンバス' }, { id: 'controlled-access', label: '制限付きキーと利用ログ' }] },
    sections: { startedEyebrow: '作業パス', workflowEyebrow: '連続したワークフロー', trustEyebrow: '作業と信頼の境界', useCasesEyebrow: '代表的なタスク', faqEyebrow: 'よくある質問' },
    started: { title: '目の前のタスクから始め、そのまま次へ', body: 'まず会話し、キャンバスで制作し、最後に機能をアプリへ接続します。各段階から実際の作業画面へ進めます。', items: [
      { id: 'start-chat', title: '会話', body: 'ローカル履歴とストリーミング応答で考えを続けます。', action: '会話を開く', ariaLabel: '会話ワークスペースを開く', target: 'console-playground', tone: 'lilac' },
      { id: 'start-create', title: '創作', body: 'プロンプト、参照画像、結果を同じキャンバスに残します。', action: '画像ワークスペースへ', ariaLabel: '画像ワークスペースを開く', target: 'console-studio', tone: 'mint' },
      { id: 'start-connect', title: '接続', body: '範囲付きキーを作成し、利用ログからリクエストを追跡します。', action: 'API キーを管理', ariaLabel: 'API キー管理を開く', target: 'console-keys', tone: 'coral' },
    ] },
    workflow: { title: '一つの作業から、自然に次の段階へ', body: '三つのワークスペースが明確なアカウント境界を共有し、思考、生成、接続を連続させます。', items: [
      { id: 'workflow-chat', kicker: '01 / 会話を続ける', title: 'コンテキストをサーバーではなく手元に', body: '新しい会話を作成し、最近の履歴を切り替え、ストリーミング応答を受け取れます。履歴は既定でこのブラウザに残ります。', boundary: '境界：Partokens はこのローカル会話履歴を保存しません。', tone: 'lilac' },
      { id: 'workflow-image', kicker: '02 / キャンバスで創作', title: 'プロンプトから結果まで振り返れる過程を残す', body: '一つのキャンバスでプロンプト、参照素材、生成結果を接続し、視覚探索を整理して続けられます。', boundary: '境界：キャンバスはこの端末に保存され、画像は実際の生成結果として表示されます。', tone: 'mint' },
      { id: 'workflow-api', kicker: '03 / 制御して接続', title: '接続先、キー範囲、利用記録を一か所に', body: 'OpenAI 互換エンドポイントを使い、モデル、割り当て、有効期限でキーを制限し、ログでリクエストを確認します。', boundary: '境界：利用可能なモデル、課金、ルーティングはサーバーの結果が優先されます。', tone: 'coral' },
    ] },
    trust: { title: 'できることと、データの保存場所を明確に', body: '互換接続、制作ツール、アカウント制御をまとめながら、端末とサーバーの役割を明示します。', items: [{ id: 'compatible', title: '互換接続', body: '使い慣れた OpenAI 互換 URL と SDK を利用できます。' }, { id: 'unified', title: '連続した作業', body: '会話、画像、キー、利用状況を一つのパスで整理します。' }, { id: 'traceable', title: '追跡できる利用状況', body: '残高、利用状況、リクエストログをアカウント別に確認します。' }, { id: 'local', title: 'ローカル会話', body: '最近の会話履歴は既定でこのブラウザに残ります。' }, { id: 'controlled', title: '権限制御', body: 'モデル、割り当て、有効期限で API キーを制限します。' }, { id: 'multilingual', title: '七言語', body: '製品画面とドキュメントを同時に国際化します。' }] },
    useCases: { title: '三つの代表的なタスクから直接開始', body: 'すべての機能を先に覚える必要はありません。現在の作業に近い入口を選べます。', items: [{ id: 'release-check', title: 'リリース確認', body: '公開前の検証、公開手順、ロールバック準備を整理します。', action: '会話で整理', ariaLabel: '会話でリリース確認を整理する', target: 'console-playground', tone: 'lilac' }, { id: 'visual-explore', title: '視覚探索', body: 'プロンプト、参照素材、生成結果を調整可能なキャンバスにまとめます。', action: '画像ワークスペースへ', ariaLabel: '画像ワークスペースで視覚探索を始める', target: 'console-studio', tone: 'mint' }, { id: 'app-connect', title: 'アプリ接続', body: '制限付きキーを作成し、ガイドに従って基礎 URL を置き換えます。', action: '接続ガイドを読む', ariaLabel: 'アプリ API 接続ガイドを読む', target: 'docs', tone: 'coral' }] },
    faq: { title: '始める前に知っておきたいこと', body: 'プライバシー、アカウントの安全性、API 接続についてのよくある質問です。', items: [{ id: 'direct-use', question: 'Partokens で会話や画像生成をすぐ始められますか？', answer: 'はい。ログイン後、会話ワークスペースまたは画像ワークスペースを開いて開始できます。' }, { id: 'chat-storage', question: '会話履歴は Partokens に保存されますか？', answer: '最近の会話は既定でこのブラウザに保存され、Partokens はその履歴を保存しません。' }, { id: 'sdk', question: '現在の OpenAI SDK を使い続けられますか？', answer: 'はい。API キーを作成し、ドキュメントに従って基礎 URL とキーを置き換えます。' }, { id: 'usage', question: '残高と個別の呼び出しはどこで確認できますか？', answer: '残高と利用状況はコンソールに表示され、分析と利用ログで詳細を確認できます。' }] },
    preview: { developerConsole: '開発者コンソール', workspace: 'ワークスペース', tabs: { chat: '会話', image: '画像', api: 'API' }, localHistory: 'ローカル履歴', newChat: '新しい会話', imageStudio: '画像ワークスペース', generate: '生成', prompt: 'プロンプト', result: '結果', overview: '概要', apiKeys: 'API キー', signIn: 'ログイン後に利用可能', accountBalance: 'アカウント残高', periodUsage: '30 日間の利用', accountData: 'アカウントデータ', baseUrl: '基礎 URL', usageLogs: '利用ログ', today: '今日', recentChats: '最近の会話', preferences: '画像設定', createKey: 'キーを作成', compatibleEndpoint: '互換エンドポイント', compatibleEndpointBody: 'OpenAI の基礎 URL を変更できるクライアントで利用します。', restrictedKey: '制限付き API キー', restrictedKeyBody: 'モデル、割り当て、有効期限でアクセスを制限します。', traceableUsage: '追跡できる利用記録', traceableUsageBody: 'アカウント別に利用状況と各リクエストを確認します。', sendLabel: 'メッセージを送信' },
    samples: { question: '製品リリースのチェックリストを作ってください。', answer: '公開前の確認、公開手順、ロールバック準備の三つに分けて整理します。', composer: 'メッセージを入力して開始', chatTitle: '製品リリースの確認', chatSecond: '競合情報の整理', imagePrompt: '淡い石のパビリオン、セージ色のガラス、コバルトの構造', studioAlt: '淡い石、セージ色のガラス、コバルトの構造要素を使った生成建築画像' },
  },
  ru: {
    hero: { eyebrow: 'Для реальной работы с ИИ', title: 'Ваше пространство ИИ: от диалога до творчества.', body: 'Продолжайте диалог, организуйте визуальную работу и подключайте совместимый API к своему приложению в одном аккаунте.', previewLabel: 'Предпросмотр рабочего пространства Partokens', actions: { primary: 'Перейти в консоль', secondary: 'Открыть руководство по API' }, capabilities: [{ id: 'local-chat', label: 'Локальная история диалогов' }, { id: 'canvas-workflow', label: 'Холст с историей работы' }, { id: 'controlled-access', label: 'Ограниченные ключи и журналы' }] },
    sections: { startedEyebrow: 'Рабочий путь', workflowEyebrow: 'Непрерывный процесс', trustEyebrow: 'Границы работы и доверия', useCasesEyebrow: 'Типовые задачи', faqEyebrow: 'Частые вопросы' },
    started: { title: 'Начните с текущей задачи и двигайтесь дальше', body: 'Сначала диалог, затем работа на холсте и подключение к приложению. Каждый шаг ведёт в реальное рабочее пространство.', items: [
      { id: 'start-chat', title: 'Диалог', body: 'Продолжайте мысль с локальной историей и потоковыми ответами.', action: 'Открыть диалог', ariaLabel: 'Открыть рабочее пространство диалогов', target: 'console-playground', tone: 'lilac' },
      { id: 'start-create', title: 'Творчество', body: 'Храните запросы, референсы и результаты на одном холсте.', action: 'Открыть студию', ariaLabel: 'Открыть студию изображений', target: 'console-studio', tone: 'mint' },
      { id: 'start-connect', title: 'Подключение', body: 'Создавайте ключи с заданными рамками и отслеживайте запросы.', action: 'Управлять API-ключами', ariaLabel: 'Открыть управление API-ключами', target: 'console-keys', tone: 'coral' },
    ] },
    workflow: { title: 'Одна работа естественно переходит в следующую', body: 'Три пространства используют ясные границы аккаунта, сохраняя связь между идеей, генерацией и подключением.', items: [
      { id: 'workflow-chat', kicker: '01 / Продолжить диалог', title: 'Храните контекст под рукой, а не на сервере', body: 'Создавайте чаты, открывайте недавние и получайте потоковые ответы. По умолчанию история остаётся в этом браузере.', boundary: 'Граница: Partokens не хранит локальную историю этих диалогов.', tone: 'lilac' },
      { id: 'workflow-image', kicker: '02 / Творчество на холсте', title: 'Сохраняйте весь путь от запроса до результата', body: 'Связывайте запросы, референсы и созданные изображения на одном холсте, чтобы продолжать и упорядочивать поиск.', boundary: 'Граница: проекты холста остаются на этом устройстве, изображения показаны как реальные результаты.', tone: 'mint' },
      { id: 'workflow-api', kicker: '03 / Контролируемое подключение', title: 'Объедините адрес, рамки ключа и историю использования', body: 'Подключайтесь через OpenAI-совместимый адрес, ограничивайте ключи по модели, квоте и сроку, проверяйте запросы в журнале.', boundary: 'Граница: модели, тарификация и маршрутизация определяются сервером.', tone: 'coral' },
    ] },
    trust: { title: 'Понимайте возможности продукта и место хранения данных', body: 'Partokens объединяет совместимый доступ, инструменты создания и управление аккаунтом, чётко разделяя роли устройства и сервера.', items: [{ id: 'compatible', title: 'Совместимый доступ', body: 'Используйте привычный OpenAI-совместимый адрес и SDK.' }, { id: 'unified', title: 'Непрерывная работа', body: 'Диалоги, изображения, ключи и расход организованы в одном пути.' }, { id: 'traceable', title: 'Отслеживаемый расход', body: 'Проверяйте баланс, использование и запросы по аккаунту.' }, { id: 'local', title: 'Локальные диалоги', body: 'Недавняя история по умолчанию остаётся в этом браузере.' }, { id: 'controlled', title: 'Контроль прав', body: 'Ограничивайте API-ключи по модели, квоте и сроку.' }, { id: 'multilingual', title: 'Семь языков', body: 'Интерфейс и документация развиваются синхронно.' }] },
    useCases: { title: 'Начните с одной из трёх частых задач', body: 'Не нужно заранее изучать все функции. Выберите вход, близкий к вашей текущей работе.', items: [{ id: 'release-check', title: 'Проверка выпуска', body: 'Соберите проверку перед релизом, шаги запуска и план отката.', action: 'Подготовить в диалоге', ariaLabel: 'Подготовить проверку выпуска в диалоге', target: 'console-playground', tone: 'lilac' }, { id: 'visual-explore', title: 'Визуальный поиск', body: 'Разместите запросы, референсы и результаты на редактируемом холсте.', action: 'Открыть студию', ariaLabel: 'Открыть студию для визуального поиска', target: 'console-studio', tone: 'mint' }, { id: 'app-connect', title: 'Подключение приложения', body: 'Создайте ограниченный ключ и замените базовый адрес по руководству.', action: 'Открыть руководство', ariaLabel: 'Открыть руководство по подключению API', target: 'docs', tone: 'coral' }] },
    faq: { title: 'Что важно знать перед началом', body: 'Ответы о приватности, безопасности аккаунта и API.', items: [{ id: 'direct-use', question: 'Можно сразу использовать чат и генерацию изображений?', answer: 'Да. После входа откройте пространство диалогов или студию изображений.' }, { id: 'chat-storage', question: 'Partokens хранит мои диалоги?', answer: 'Недавние диалоги по умолчанию сохраняются в этом браузере. Partokens не хранит эту историю.' }, { id: 'sdk', question: 'Можно продолжить использовать OpenAI SDK?', answer: 'Да. Создайте API-ключ и замените базовый адрес и ключ согласно документации.' }, { id: 'usage', question: 'Где смотреть баланс и отдельные вызовы?', answer: 'Баланс и расход видны в консоли, подробности доступны в аналитике и журналах.' }] },
    preview: { developerConsole: 'Консоль разработчика', workspace: 'Рабочее пространство', tabs: { chat: 'Диалог', image: 'Изображения', api: 'API' }, localHistory: 'Локальная история', newChat: 'Новый диалог', imageStudio: 'Студия изображений', generate: 'Создать', prompt: 'Запрос', result: 'Результат', overview: 'Обзор', apiKeys: 'API-ключи', signIn: 'Доступно после входа', accountBalance: 'Баланс аккаунта', periodUsage: 'Расход за 30 дней', accountData: 'Данные аккаунта', baseUrl: 'Базовый адрес', usageLogs: 'Журналы', today: 'Сегодня', recentChats: 'Недавние диалоги', preferences: 'Настройки изображения', createKey: 'Создать ключ', compatibleEndpoint: 'Совместимый адрес', compatibleEndpointBody: 'Используйте в клиентах с настраиваемым базовым адресом OpenAI.', restrictedKey: 'Ограниченный API-ключ', restrictedKeyBody: 'Ограничьте доступ по модели, квоте и сроку.', traceableUsage: 'Отслеживаемая история', traceableUsageBody: 'Проверяйте расход и каждый запрос по аккаунту.', sendLabel: 'Отправить сообщение' },
    samples: { question: 'Составь список проверок перед выпуском продукта.', answer: 'Разделю его на проверку перед релизом, запуск и подготовку отката.', composer: 'Введите сообщение, чтобы начать', chatTitle: 'Проверка выпуска продукта', chatSecond: 'Анализ конкурентов', imagePrompt: 'Павильон из светлого камня, шалфейное стекло, кобальтовая конструкция', studioAlt: 'Созданное архитектурное изображение со светлым камнем, шалфейным стеклом и кобальтовой конструкцией' },
  },
  fr: {
    hero: { eyebrow: 'Pour le travail IA réel', title: 'Votre espace IA, de la conversation à la création.', body: 'Poursuivez une conversation, organisez un travail visuel, puis intégrez une API compatible à votre application depuis un seul compte.', previewLabel: 'Aperçu de l’espace produit Partokens', actions: { primary: 'Accéder à la console', secondary: 'Lire le guide d’intégration' }, capabilities: [{ id: 'local-chat', label: 'Historique local des conversations' }, { id: 'canvas-workflow', label: 'Canevas visuel consultable' }, { id: 'controlled-access', label: 'Clés limitées et journaux d’usage' }] },
    sections: { startedEyebrow: 'Parcours de travail', workflowEyebrow: 'Flux de travail continu', trustEyebrow: 'Limites de travail et de confiance', useCasesEyebrow: 'Tâches courantes', faqEyebrow: 'Questions fréquentes' },
    started: { title: 'Commencez par la tâche présente et poursuivez le parcours', body: 'Discutez, créez sur un canevas, puis connectez la capacité à une application. Chaque étape ouvre un véritable espace de travail.', items: [
      { id: 'start-chat', title: 'Dialoguer', body: 'Poursuivez une idée avec un historique local et des réponses en streaming.', action: 'Ouvrir la conversation', ariaLabel: 'Ouvrir l’espace de conversation', target: 'console-playground', tone: 'lilac' },
      { id: 'start-create', title: 'Créer', body: 'Conservez prompts, références et résultats sur le même canevas.', action: 'Ouvrir le studio d’images', ariaLabel: 'Ouvrir le studio d’images', target: 'console-studio', tone: 'mint' },
      { id: 'start-connect', title: 'Connecter', body: 'Créez des clés limitées et retracez les requêtes dans les journaux.', action: 'Gérer les clés API', ariaLabel: 'Ouvrir la gestion des clés API', target: 'console-keys', tone: 'coral' },
    ] },
    workflow: { title: 'Une tâche peut mener naturellement à la suivante', body: 'Trois espaces partagent des limites de compte claires pour relier réflexion, génération et intégration.', items: [
      { id: 'workflow-chat', kicker: '01 / Poursuivre la conversation', title: 'Gardez le contexte à portée de main, pas sur le serveur', body: 'Créez des discussions, retrouvez les plus récentes et recevez des réponses en streaming. L’historique reste par défaut dans ce navigateur.', boundary: 'Limite : Partokens ne conserve pas cet historique local de conversation.', tone: 'lilac' },
      { id: 'workflow-image', kicker: '02 / Créer sur le canevas', title: 'Conservez un processus consultable du prompt au résultat', body: 'Reliez prompts, références et résultats générés sur un seul canevas pour organiser et poursuivre l’exploration visuelle.', boundary: 'Limite : les projets restent sur cet appareil ; les images sont de véritables résultats générés.', tone: 'mint' },
      { id: 'workflow-api', kicker: '03 / Intégrer avec contrôle', title: 'Réunissez le point d’accès, la portée de la clé et le suivi', body: 'Utilisez un point d’accès compatible OpenAI, limitez les clés par modèle, quota et durée, puis vérifiez les requêtes dans les journaux.', boundary: 'Limite : les modèles, la facturation et le routage restent déterminés par le serveur.', tone: 'coral' },
    ] },
    trust: { title: 'Sachez ce que fait le produit et où restent les données', body: 'Partokens réunit accès compatible, outils de création et contrôles du compte tout en distinguant clairement appareil et serveur.', items: [{ id: 'compatible', title: 'Accès compatible', body: 'Utilisez une URL de base et un SDK compatibles OpenAI.' }, { id: 'unified', title: 'Travail continu', body: 'Organisez conversations, images, clés et usage dans un même parcours.' }, { id: 'traceable', title: 'Usage traçable', body: 'Consultez solde, usage et requêtes pour chaque compte.' }, { id: 'local', title: 'Conversations locales', body: 'L’historique récent reste par défaut dans ce navigateur.' }, { id: 'controlled', title: 'Autorisations maîtrisées', body: 'Limitez les clés API par modèle, quota et durée.' }, { id: 'multilingual', title: 'Sept langues', body: 'L’interface et la documentation évoluent ensemble.' }] },
    useCases: { title: 'Accédez directement par trois tâches courantes', body: 'Nul besoin de connaître toutes les fonctions. Choisissez l’entrée la plus proche de votre travail actuel.', items: [{ id: 'release-check', title: 'Vérification de lancement', body: 'Organisez validation préalable, étapes de mise en ligne et retour arrière.', action: 'Préparer dans la conversation', ariaLabel: 'Préparer une vérification de lancement dans la conversation', target: 'console-playground', tone: 'lilac' }, { id: 'visual-explore', title: 'Exploration visuelle', body: 'Réunissez prompts, références et résultats sur un canevas ajustable.', action: 'Ouvrir le studio d’images', ariaLabel: 'Ouvrir le studio pour une exploration visuelle', target: 'console-studio', tone: 'mint' }, { id: 'app-connect', title: 'Intégration applicative', body: 'Créez une clé limitée et remplacez l’URL de base en suivant le guide.', action: 'Lire le guide d’intégration', ariaLabel: 'Lire le guide d’intégration API pour une application', target: 'docs', tone: 'coral' }] },
    faq: { title: 'Ce qu’il faut savoir avant de commencer', body: 'Réponses sur la confidentialité, la sécurité du compte et l’accès API.', items: [{ id: 'direct-use', question: 'Puis-je discuter et générer des images directement ?', answer: 'Oui. Après connexion, ouvrez l’espace de conversation ou le studio d’images.' }, { id: 'chat-storage', question: 'Partokens conserve-t-il mes conversations ?', answer: 'Les conversations récentes restent par défaut dans ce navigateur. Partokens ne conserve pas cet historique.' }, { id: 'sdk', question: 'Puis-je garder mon SDK OpenAI actuel ?', answer: 'Oui. Créez une clé API puis remplacez l’URL de base et la clé selon la documentation.' }, { id: 'usage', question: 'Où suivre le solde et chaque appel ?', answer: 'Le solde et l’usage sont visibles dans la console ; les analyses et journaux donnent le détail.' }] },
    preview: { developerConsole: 'Console développeur', workspace: 'Espace de travail', tabs: { chat: 'Conversation', image: 'Image', api: 'API' }, localHistory: 'Historique local', newChat: 'Nouvelle conversation', imageStudio: 'Studio d’images', generate: 'Générer', prompt: 'Prompt', result: 'Résultat', overview: 'Vue d’ensemble', apiKeys: 'Clés API', signIn: 'Disponible après connexion', accountBalance: 'Solde du compte', periodUsage: 'Usage sur 30 jours', accountData: 'Données du compte', baseUrl: 'URL de base', usageLogs: 'Journaux d’usage', today: 'Aujourd’hui', recentChats: 'Conversations récentes', preferences: 'Réglages de l’image', createKey: 'Créer une clé', compatibleEndpoint: 'Point d’accès compatible', compatibleEndpointBody: 'Utilisez-le dans les clients acceptant une URL de base OpenAI personnalisée.', restrictedKey: 'Clé API limitée', restrictedKeyBody: 'Limitez l’accès par modèle, quota et durée.', traceableUsage: 'Historique d’usage traçable', traceableUsageBody: 'Vérifiez l’usage et chaque requête par compte.', sendLabel: 'Envoyer le message' },
    samples: { question: 'Prépare une checklist pour le lancement d’un produit.', answer: 'Je vais l’organiser en validation, mise en ligne et préparation du retour arrière.', composer: 'Écrivez un message pour commencer', chatTitle: 'Checklist de lancement', chatSecond: 'Analyse des concurrents', imagePrompt: 'Pavillon en pierre claire, verre sauge, structure cobalt', studioAlt: 'Image architecturale générée avec pierre claire, verre sauge et élément structurel cobalt' },
  },
  vi: {
    hero: { eyebrow: 'Cho công việc AI thực tế', title: 'Không gian AI của bạn, từ hội thoại đến sáng tạo.', body: 'Tiếp tục hội thoại, tổ chức công việc hình ảnh rồi tích hợp API tương thích vào ứng dụng của bạn trong một tài khoản.', previewLabel: 'Bản xem trước không gian sản phẩm Partokens', actions: { primary: 'Mở bảng điều khiển', secondary: 'Đọc hướng dẫn tích hợp' }, capabilities: [{ id: 'local-chat', label: 'Lịch sử hội thoại cục bộ' }, { id: 'canvas-workflow', label: 'Canvas hình ảnh có thể xem lại' }, { id: 'controlled-access', label: 'Khóa giới hạn và nhật ký sử dụng' }] },
    sections: { startedEyebrow: 'Lộ trình làm việc', workflowEyebrow: 'Quy trình liên tục', trustEyebrow: 'Ranh giới công việc và tin cậy', useCasesEyebrow: 'Tác vụ điển hình', faqEyebrow: 'Câu hỏi thường gặp' },
    started: { title: 'Bắt đầu từ việc trước mắt và tiếp tục theo lộ trình', body: 'Trò chuyện, sáng tạo trên canvas rồi kết nối năng lực vào ứng dụng. Mỗi bước mở một không gian làm việc thật.', items: [
      { id: 'start-chat', title: 'Trò chuyện', body: 'Tiếp tục ý tưởng với lịch sử cục bộ và phản hồi trực tuyến.', action: 'Mở hội thoại', ariaLabel: 'Mở không gian hội thoại', target: 'console-playground', tone: 'lilac' },
      { id: 'start-create', title: 'Sáng tạo', body: 'Giữ prompt, ảnh tham chiếu và kết quả trên cùng canvas.', action: 'Mở studio hình ảnh', ariaLabel: 'Mở studio hình ảnh', target: 'console-studio', tone: 'mint' },
      { id: 'start-connect', title: 'Kết nối', body: 'Tạo khóa có phạm vi và theo dõi yêu cầu qua nhật ký.', action: 'Quản lý khóa API', ariaLabel: 'Mở quản lý khóa API', target: 'console-keys', tone: 'coral' },
    ] },
    workflow: { title: 'Một công việc có thể tự nhiên dẫn sang bước tiếp theo', body: 'Ba không gian dùng chung ranh giới tài khoản rõ ràng, giữ suy nghĩ, tạo nội dung và tích hợp luôn kết nối.', items: [
      { id: 'workflow-chat', kicker: '01 / Tiếp tục hội thoại', title: 'Giữ ngữ cảnh bên bạn, không để trên máy chủ', body: 'Tạo hội thoại, chuyển giữa lịch sử gần đây và nhận phản hồi trực tuyến. Lịch sử mặc định ở trong trình duyệt này.', boundary: 'Ranh giới: Partokens không lưu lịch sử hội thoại cục bộ này.', tone: 'lilac' },
      { id: 'workflow-image', kicker: '02 / Sáng tạo trên canvas', title: 'Giữ lại quá trình có thể xem lại từ prompt đến kết quả', body: 'Kết nối prompt, ảnh tham chiếu và kết quả tạo trên một canvas để tiếp tục tổ chức hoạt động khám phá.', boundary: 'Ranh giới: dự án canvas ở trên thiết bị này; hình ảnh là kết quả tạo thực tế.', tone: 'mint' },
      { id: 'workflow-api', kicker: '03 / Tích hợp có kiểm soát', title: 'Đặt địa chỉ, phạm vi khóa và lịch sử sử dụng cùng nhau', body: 'Dùng địa chỉ tương thích OpenAI, giới hạn khóa theo mô hình, hạn mức và thời hạn, rồi kiểm tra yêu cầu trong nhật ký.', boundary: 'Ranh giới: mô hình, tính phí và định tuyến luôn do máy chủ quyết định.', tone: 'coral' },
    ] },
    trust: { title: 'Biết rõ sản phẩm làm gì và dữ liệu được giữ ở đâu', body: 'Partokens kết hợp truy cập tương thích, công cụ sáng tạo và kiểm soát tài khoản, đồng thời phân định rõ thiết bị với máy chủ.', items: [{ id: 'compatible', title: 'Truy cập tương thích', body: 'Dùng URL cơ sở và SDK tương thích OpenAI quen thuộc.' }, { id: 'unified', title: 'Công việc liên tục', body: 'Tổ chức hội thoại, hình ảnh, khóa và mức dùng theo một lộ trình.' }, { id: 'traceable', title: 'Mức dùng có thể truy vết', body: 'Xem số dư, mức dùng và yêu cầu theo tài khoản.' }, { id: 'local', title: 'Hội thoại cục bộ', body: 'Lịch sử gần đây mặc định ở trong trình duyệt này.' }, { id: 'controlled', title: 'Quyền được kiểm soát', body: 'Giới hạn khóa API theo mô hình, hạn mức và thời hạn.' }, { id: 'multilingual', title: 'Bảy ngôn ngữ', body: 'Giao diện và tài liệu phát triển đồng bộ.' }] },
    useCases: { title: 'Đi thẳng vào ba tác vụ thường gặp', body: 'Bạn không cần tìm hiểu mọi tính năng trước. Hãy chọn lối vào gần với công việc hiện tại.', items: [{ id: 'release-check', title: 'Kiểm tra phát hành', body: 'Sắp xếp xác minh trước phát hành, bước triển khai và chuẩn bị quay lui.', action: 'Lập kế hoạch trong hội thoại', ariaLabel: 'Lập kế hoạch kiểm tra phát hành trong hội thoại', target: 'console-playground', tone: 'lilac' }, { id: 'visual-explore', title: 'Khám phá hình ảnh', body: 'Sắp xếp prompt, ảnh tham chiếu và kết quả trên canvas có thể điều chỉnh.', action: 'Mở studio hình ảnh', ariaLabel: 'Mở studio để khám phá hình ảnh', target: 'console-studio', tone: 'mint' }, { id: 'app-connect', title: 'Tích hợp ứng dụng', body: 'Tạo khóa giới hạn và thay URL cơ sở theo hướng dẫn.', action: 'Đọc hướng dẫn tích hợp', ariaLabel: 'Đọc hướng dẫn tích hợp API cho ứng dụng', target: 'docs', tone: 'coral' }] },
    faq: { title: 'Điều bạn có thể muốn biết trước', body: 'Các câu hỏi về quyền riêng tư, bảo mật tài khoản và truy cập API.', items: [{ id: 'direct-use', question: 'Tôi có thể trò chuyện và tạo ảnh trực tiếp không?', answer: 'Có. Sau khi đăng nhập, mở không gian hội thoại hoặc studio hình ảnh để bắt đầu.' }, { id: 'chat-storage', question: 'Partokens có lưu lịch sử hội thoại không?', answer: 'Hội thoại gần đây mặc định ở trong trình duyệt này. Partokens không lưu lịch sử đó.' }, { id: 'sdk', question: 'Tôi có thể tiếp tục dùng OpenAI SDK hiện tại không?', answer: 'Có. Tạo khóa API rồi thay URL cơ sở và khóa theo tài liệu.' }, { id: 'usage', question: 'Tôi xem số dư và từng lượt gọi ở đâu?', answer: 'Số dư và mức dùng hiển thị trong bảng điều khiển; phần phân tích và nhật ký cung cấp chi tiết.' }] },
    preview: { developerConsole: 'Bảng điều khiển nhà phát triển', workspace: 'Không gian làm việc', tabs: { chat: 'Hội thoại', image: 'Hình ảnh', api: 'API' }, localHistory: 'Lịch sử cục bộ', newChat: 'Hội thoại mới', imageStudio: 'Studio hình ảnh', generate: 'Tạo', prompt: 'Prompt', result: 'Kết quả', overview: 'Tổng quan', apiKeys: 'Khóa API', signIn: 'Có sau khi đăng nhập', accountBalance: 'Số dư tài khoản', periodUsage: 'Mức dùng 30 ngày', accountData: 'Dữ liệu tài khoản', baseUrl: 'URL cơ sở', usageLogs: 'Nhật ký sử dụng', today: 'Hôm nay', recentChats: 'Hội thoại gần đây', preferences: 'Cài đặt hình ảnh', createKey: 'Tạo khóa', compatibleEndpoint: 'Địa chỉ tương thích', compatibleEndpointBody: 'Dùng trong ứng dụng hỗ trợ URL cơ sở OpenAI tùy chỉnh.', restrictedKey: 'Khóa API giới hạn', restrictedKeyBody: 'Giới hạn quyền theo mô hình, hạn mức và thời hạn.', traceableUsage: 'Lịch sử có thể truy vết', traceableUsageBody: 'Kiểm tra mức dùng và từng yêu cầu theo tài khoản.', sendLabel: 'Gửi tin nhắn' },
    samples: { question: 'Hãy tạo danh sách kiểm tra phát hành sản phẩm.', answer: 'Tôi sẽ chia thành xác minh trước phát hành, triển khai và chuẩn bị quay lui.', composer: 'Nhập tin nhắn để bắt đầu', chatTitle: 'Kiểm tra phát hành', chatSecond: 'Nghiên cứu đối thủ', imagePrompt: 'Gian nhà đá sáng, kính xanh xô thơm, cấu trúc xanh cobalt', studioAlt: 'Hình kiến trúc được tạo với đá sáng, kính xanh xô thơm và cấu trúc xanh cobalt' },
  },
} satisfies Record<AppLocale, HomePageCopy>
