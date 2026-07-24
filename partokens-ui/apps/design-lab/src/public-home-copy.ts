import type { AppLocale } from '@partokens/i18n'

export type HomePageCopy = {
  hero: { eyebrow: string; title: string; body: string; note: string }
  started: { title: string; body: string; actionBodies: [string, string, string] }
  features: {
    title: string
    body: string
    chat: { kicker: string; title: string; body: string }
    image: { kicker: string; title: string; body: string }
    control: { kicker: string; title: string; body: string }
  }
  values: { eyebrow: string; title: string; items: Array<{ title: string; body: string }> }
  faq: { title: string; body: string; items: Array<[string, string]> }
  samples: { question: string; answer: string; composer: string; chatTitle: string; chatSecond: string; imagePrompt: string }
}

export const homePageCopy = {
  'zh-CN': {
    hero: { eyebrow: '面向每一种 AI 工作', title: '你的 AI 工作区，从调用到创作。', body: '在一个账户里对话、生图、管理 API 密钥，并清楚掌握每一次使用。', note: '登录后加载账户可用模型与价格' },
    started: { title: '从你现在要做的事开始', body: '无需先理解复杂的模型路由，选择工作方式即可进入对应页面。', actionBodies: ['使用本地会话历史和流式响应。', '在本地画布中生成、连接和整理图片。', '按模型、额度和有效期限制访问。'] },
    features: {
      title: '一个账户，覆盖常用 AI 工作流', body: '从直接创作到 API 接入，每个功能都围绕真实任务组织。',
      chat: { kicker: '对话与思考', title: '让每次对话都能接着上次继续', body: '新建对话、切换最近记录并使用流式响应。会话内容默认只保存在当前设备，不进入 Partokens 服务端。' },
      image: { kicker: '图像工作台', title: '在画布里生成，也在画布里整理', body: '把提示词、参考图和生成结果放进同一个可回看的创作过程。' },
      control: { kicker: '用量与接入', title: '密钥、余额和日志始终有据可查', body: '创建受限密钥，查看账户范围内的模型与价格，并从使用日志追踪每次请求。匿名页面不展示私有价格。' },
    },
    values: { eyebrow: '为什么选择 PARTOKENS', title: '少一点切换，多一点确定', items: [
      { title: '兼容', body: '使用熟悉的 OpenAI 兼容接口接入。' }, { title: '统一', body: '对话、生图、密钥和用量集中管理。' }, { title: '透明', body: '账户价格、余额与请求日志清楚可见。' }, { title: '本地', body: '聊天记录默认留在你的当前设备。' }, { title: '可控', body: '按模型、额度与有效期约束密钥。' }, { title: '多语言', body: '产品界面与使用文档同步国际化。' },
    ] },
    faq: { title: '开始之前，你可能想知道', body: '关于模型、价格、隐私和 API 接入的常见问题。', items: [
      ['Partokens 可以直接开始聊天和生图吗？', '可以。登录后从控制台进入对话或生图工作台，并选择当前账户可用的模型。'],
      ['为什么首页不展示模型价格？', '模型与价格会根据账户权限加载，匿名状态不提供完整价格数据。登录后可在模型广场查看。'],
      ['聊天记录会上传到 Partokens 吗？', '最近聊天记录默认存储在当前浏览器，Partokens 不保存这些会话记录。'],
      ['现有 OpenAI SDK 可以继续使用吗？', '可以。创建 API 密钥后，按使用文档替换接入地址与密钥即可。'],
      ['如何查看余额和每次调用？', '控制台固定展示余额与用量；数据看板和使用日志提供更完整的请求记录。'],
    ] },
    samples: { question: '帮我整理一份产品发布检查清单。', answer: '可以。我会按发布前验证、上线步骤和回滚准备三个部分整理。', composer: '输入消息，开始对话', chatTitle: '产品发布检查清单', chatSecond: '竞品信息整理', imagePrompt: '雨后城市，电影感光线' },
  },
  'zh-TW': {
    hero: { eyebrow: '適合每一種 AI 工作', title: '你的 AI 工作區，從呼叫到創作。', body: '在同一個帳戶中對話、生成圖片、管理 API 金鑰，並清楚掌握每一次使用。', note: '登入後載入帳戶可用模型與價格' },
    started: { title: '從你現在要做的事開始', body: '不必先理解複雜的模型路由，選擇工作方式即可進入對應頁面。', actionBodies: ['使用本機對話記錄與串流回應。', '在本機畫布中生成、連接與整理圖片。', '依模型、額度與有效期限限制存取。'] },
    features: {
      title: '一個帳戶，涵蓋常用 AI 工作流程', body: '從直接創作到 API 接入，每項功能都圍繞實際工作組織。',
      chat: { kicker: '對話與思考', title: '讓每次對話都能從上次繼續', body: '建立對話、切換最近記錄並接收串流回應。內容預設只保存在目前裝置，不會進入 Partokens 伺服器。' },
      image: { kicker: '圖像工作台', title: '在畫布中生成，也在畫布中整理', body: '把提示詞、參考圖與生成結果放進同一個可回看的創作過程。' },
      control: { kicker: '用量與接入', title: '金鑰、餘額與記錄都有跡可循', body: '建立受限金鑰，查看帳戶模型與價格，並從使用記錄追蹤每次請求。匿名頁面不顯示私有價格。' },
    },
    values: { eyebrow: '為什麼選擇 PARTOKENS', title: '少一點切換，多一點確定', items: [
      { title: '相容', body: '使用熟悉的 OpenAI 相容介面接入。' }, { title: '統一', body: '對話、圖片、金鑰與用量集中管理。' }, { title: '透明', body: '帳戶價格、餘額與請求記錄清楚可見。' }, { title: '本機', body: '對話記錄預設留在目前裝置。' }, { title: '可控', body: '依模型、額度與有效期限限制金鑰。' }, { title: '多語言', body: '產品介面與使用文件同步國際化。' },
    ] },
    faq: { title: '開始之前，你可能想知道', body: '關於模型、價格、隱私與 API 接入的常見問題。', items: [
      ['Partokens 可以直接開始對話與生圖嗎？', '可以。登入後從控制台進入對話或生圖工作台，並選擇帳戶可用的模型。'],
      ['為什麼首頁不顯示模型價格？', '模型與價格會依帳戶權限載入，匿名狀態不提供完整價格。登入後可在模型廣場查看。'],
      ['對話記錄會上傳到 Partokens 嗎？', '最近對話預設儲存在目前瀏覽器，Partokens 不會保存這些對話記錄。'],
      ['可以繼續使用現有的 OpenAI SDK 嗎？', '可以。建立 API 金鑰後，依使用文件替換接入位址與金鑰即可。'],
      ['如何查看餘額與每次呼叫？', '控制台固定顯示餘額與用量；資料看板和使用記錄提供完整明細。'],
    ] },
    samples: { question: '幫我整理一份產品發布檢查清單。', answer: '可以。我會依發布前驗證、上線步驟與回復準備三個部分整理。', composer: '輸入訊息，開始對話', chatTitle: '產品發布檢查清單', chatSecond: '競品資訊整理', imagePrompt: '雨後城市，電影感光線' },
  },
  en: {
    hero: { eyebrow: 'For every kind of AI work', title: 'Your AI workspace, from model calls to creation.', body: 'Chat, create images, manage API keys, and understand every request from one account.', note: 'Account models and pricing load after sign-in' },
    started: { title: 'Start with the work in front of you', body: 'You do not need to learn the routing layer first. Choose a workspace and move directly into the task.', actionBodies: ['Use local conversation history with streaming responses.', 'Generate, connect, and organize images on a local canvas.', 'Limit access by model, quota, and expiry.'] },
    features: {
      title: 'One account for the AI workflows you use', body: 'From direct creation to API integration, each area is organized around a real task.',
      chat: { kicker: 'Conversation and reasoning', title: 'Continue each conversation where you left it', body: 'Create chats, switch between recent history, and receive streaming responses. Content stays on this device by default and is not stored by Partokens.' },
      image: { kicker: 'Image workspace', title: 'Generate and organize on the same canvas', body: 'Keep prompts, references, and generated results in one creative process you can revisit.' },
      control: { kicker: 'Usage and access', title: 'Keys, balance, and logs stay traceable', body: 'Create restricted keys, inspect account models and pricing, and trace each request in usage logs. Private pricing is never shown anonymously.' },
    },
    values: { eyebrow: 'WHY PARTOKENS', title: 'Less switching, more certainty', items: [
      { title: 'Compatible', body: 'Connect through a familiar OpenAI-compatible API.' }, { title: 'Unified', body: 'Manage chat, images, keys, and usage together.' }, { title: 'Visible', body: 'See account pricing, balance, and request history clearly.' }, { title: 'Local', body: 'Conversation history stays on your current device by default.' }, { title: 'Controlled', body: 'Restrict keys by model, quota, and expiry.' }, { title: 'Multilingual', body: 'Product UI and documentation evolve in seven languages.' },
    ] },
    faq: { title: 'What you may want to know first', body: 'Common questions about models, pricing, privacy, and API access.', items: [
      ['Can I chat and create images directly in Partokens?', 'Yes. After sign-in, open Playground or Image Studio and choose a model available to your account.'],
      ['Why is model pricing not shown on the homepage?', 'Models and pricing depend on account access. The complete account catalog is available after sign-in.'],
      ['Does Partokens store my conversation history?', 'Recent conversations stay in this browser by default. Partokens does not store that conversation history.'],
      ['Can I keep using my current OpenAI SDK?', 'Yes. Create an API key, then replace the base URL and key as shown in the documentation.'],
      ['Where can I inspect balance and individual calls?', 'Balance and usage stay visible in the console, with full detail in analytics and usage logs.'],
    ] },
    samples: { question: 'Create a product release checklist for me.', answer: 'I will organize it into pre-release validation, launch steps, and rollback preparation.', composer: 'Write a message to start', chatTitle: 'Product release checklist', chatSecond: 'Competitor research', imagePrompt: 'City after rain, cinematic light' },
  },
  ja: {
    hero: { eyebrow: 'あらゆる AI ワークのために', title: 'モデル呼び出しから創作まで、一つの AI ワークスペースで。', body: '一つのアカウントで会話、画像生成、API キー管理を行い、すべての利用状況を把握できます。', note: 'ログイン後に利用可能なモデルと料金を読み込みます' },
    started: { title: '今やりたいことから始める', body: '複雑なルーティングを先に理解する必要はありません。作業方法を選んで目的の画面へ進めます。', actionBodies: ['ローカル履歴とストリーミング応答を利用します。', 'ローカルキャンバスで画像を生成、接続、整理します。', 'モデル、割り当て、有効期限でアクセスを制限します。'] },
    features: {
      title: '一つのアカウントで主要な AI ワークフローを', body: '直接の創作から API 接続まで、各機能を実際の作業に沿って整理しています。',
      chat: { kicker: '会話と思考', title: '前回の続きから会話を再開', body: '新しい会話を作成し、最近の履歴を切り替え、ストリーミング応答を受け取れます。内容は既定でこの端末だけに保存されます。' },
      image: { kicker: '画像ワークスペース', title: '生成も整理も同じキャンバスで', body: 'プロンプト、参照画像、生成結果を、あとから確認できる一つの制作過程にまとめます。' },
      control: { kicker: '利用状況とアクセス', title: 'キー、残高、ログをいつでも確認', body: '制限付きキーを作成し、アカウントのモデルと料金を確認し、利用ログから各リクエストを追跡します。匿名画面には非公開料金を表示しません。' },
    },
    values: { eyebrow: 'PARTOKENS を選ぶ理由', title: '切り替えを減らし、確実性を高める', items: [
      { title: '互換', body: '使い慣れた OpenAI 互換 API で接続できます。' }, { title: '統合', body: '会話、画像、キー、利用状況をまとめて管理します。' }, { title: '明確', body: '料金、残高、リクエスト履歴を確認できます。' }, { title: 'ローカル', body: '会話履歴は既定で現在の端末に保存されます。' }, { title: '制御', body: 'モデル、割り当て、有効期限でキーを制限します。' }, { title: '多言語', body: '製品画面とドキュメントを七言語で提供します。' },
    ] },
    faq: { title: '始める前に知っておきたいこと', body: 'モデル、料金、プライバシー、API 接続についてのよくある質問です。', items: [
      ['Partokens で会話や画像生成をすぐ始められますか？', 'はい。ログイン後、Playground または画像ワークスペースを開き、利用可能なモデルを選択します。'],
      ['ホームページにモデル料金がないのはなぜですか？', 'モデルと料金はアカウント権限によって異なります。完全な一覧はログイン後に確認できます。'],
      ['会話履歴は Partokens に保存されますか？', '最近の会話は既定で現在のブラウザに保存され、Partokens はその履歴を保存しません。'],
      ['現在の OpenAI SDK を使い続けられますか？', 'はい。API キーを作成し、ドキュメントに従って接続先とキーを置き換えます。'],
      ['残高と個別の呼び出しはどこで確認できますか？', '残高と利用状況はコンソールに表示され、分析と利用ログで詳細を確認できます。'],
    ] },
    samples: { question: '製品リリースのチェックリストを作ってください。', answer: 'リリース前の確認、公開手順、ロールバック準備の三つに分けて整理します。', composer: 'メッセージを入力して開始', chatTitle: '製品リリースの確認', chatSecond: '競合情報の整理', imagePrompt: '雨上がりの都市、映画的な光' },
  },
  ru: {
    hero: { eyebrow: 'Для любой работы с ИИ', title: 'Ваше пространство ИИ: от вызова модели до творчества.', body: 'Общайтесь, создавайте изображения, управляйте API-ключами и отслеживайте каждый запрос в одном аккаунте.', note: 'Модели и цены аккаунта загружаются после входа' },
    started: { title: 'Начните с текущей задачи', body: 'Не нужно заранее разбираться в маршрутизации моделей. Выберите рабочий режим и переходите к делу.', actionBodies: ['Локальная история и потоковые ответы.', 'Создание, соединение и организация изображений на локальном холсте.', 'Ограничение доступа по модели, квоте и сроку.'] },
    features: {
      title: 'Один аккаунт для основных задач с ИИ', body: 'От непосредственного творчества до API — каждая функция выстроена вокруг реальной работы.',
      chat: { kicker: 'Диалог и размышление', title: 'Продолжайте разговор с того же места', body: 'Создавайте чаты, открывайте недавние и получайте потоковые ответы. По умолчанию история остаётся на текущем устройстве и не сохраняется Partokens.' },
      image: { kicker: 'Работа с изображениями', title: 'Создавайте и организуйте на одном холсте', body: 'Храните запросы, референсы и результаты в едином творческом процессе, к которому можно вернуться.' },
      control: { kicker: 'Использование и доступ', title: 'Ключи, баланс и журналы легко проверить', body: 'Создавайте ключи с ограничениями, просматривайте модели и цены аккаунта и отслеживайте запросы. Частные цены не публикуются.' },
    },
    values: { eyebrow: 'ПОЧЕМУ PARTOKENS', title: 'Меньше переключений, больше ясности', items: [
      { title: 'Совместимо', body: 'Подключайтесь через знакомый OpenAI-совместимый API.' }, { title: 'Едино', body: 'Чаты, изображения, ключи и расход в одном месте.' }, { title: 'Прозрачно', body: 'Цены аккаунта, баланс и запросы всегда видны.' }, { title: 'Локально', body: 'История чатов остаётся на текущем устройстве.' }, { title: 'Управляемо', body: 'Ограничивайте ключ по моделям, квоте и сроку.' }, { title: 'Мультиязычно', body: 'Интерфейс и документация доступны на семи языках.' },
    ] },
    faq: { title: 'Что важно знать перед началом', body: 'Ответы о моделях, ценах, приватности и API.', items: [
      ['Можно сразу использовать чат и генерацию изображений?', 'Да. После входа откройте чат или студию изображений и выберите модель, доступную аккаунту.'],
      ['Почему на главной нет цен на модели?', 'Модели и цены зависят от прав аккаунта. Полный список доступен после входа.'],
      ['Partokens хранит мои чаты?', 'Недавние чаты по умолчанию сохраняются в текущем браузере. Partokens не хранит эту историю.'],
      ['Можно продолжить использовать OpenAI SDK?', 'Да. Создайте API-ключ и замените адрес и ключ согласно документации.'],
      ['Где смотреть баланс и отдельные вызовы?', 'Баланс и расход видны в консоли, а подробности доступны в аналитике и журналах.'],
    ] },
    samples: { question: 'Составь список проверок перед выпуском продукта.', answer: 'Разделю его на проверку перед релизом, запуск и подготовку отката.', composer: 'Введите сообщение, чтобы начать', chatTitle: 'Проверки перед выпуском', chatSecond: 'Анализ конкурентов', imagePrompt: 'Город после дождя, кинематографичный свет' },
  },
  fr: {
    hero: { eyebrow: 'Pour chaque usage de l’IA', title: 'Votre espace IA, de l’appel de modèle à la création.', body: 'Discutez, créez des images, gérez vos clés API et suivez chaque requête depuis un seul compte.', note: 'Les modèles et tarifs du compte sont chargés après connexion' },
    started: { title: 'Commencez par la tâche à accomplir', body: 'Pas besoin de comprendre le routage des modèles au préalable. Choisissez un espace et passez directement à l’action.', actionBodies: ['Historique local et réponses en streaming.', 'Générez, reliez et organisez des images sur un canevas local.', 'Limitez l’accès par modèle, quota et durée.'] },
    features: {
      title: 'Un compte pour vos principaux flux de travail IA', body: 'De la création directe à l’intégration API, chaque fonction suit une tâche réelle.',
      chat: { kicker: 'Discussion et réflexion', title: 'Reprenez chaque conversation là où vous l’avez laissée', body: 'Créez des discussions, retrouvez les plus récentes et recevez les réponses en streaming. Le contenu reste par défaut sur cet appareil et n’est pas conservé par Partokens.' },
      image: { kicker: 'Espace image', title: 'Générez et organisez sur le même canevas', body: 'Réunissez prompts, références et résultats dans un processus créatif que vous pouvez retrouver.' },
      control: { kicker: 'Usage et accès', title: 'Clés, solde et journaux restent vérifiables', body: 'Créez des clés limitées, consultez les modèles et tarifs de votre compte, puis retracez chaque requête. Les tarifs privés ne sont pas publics.' },
    },
    values: { eyebrow: 'POURQUOI PARTOKENS', title: 'Moins de changements, plus de clarté', items: [
      { title: 'Compatible', body: 'Connectez vos outils via une API compatible OpenAI.' }, { title: 'Unifié', body: 'Discussions, images, clés et usage au même endroit.' }, { title: 'Transparent', body: 'Tarifs, solde et requêtes clairement visibles.' }, { title: 'Local', body: 'Les conversations restent par défaut sur votre appareil.' }, { title: 'Maîtrisé', body: 'Limitez une clé par modèle, quota et durée.' }, { title: 'Multilingue', body: 'Interface et documentation sont disponibles en sept langues.' },
    ] },
    faq: { title: 'Ce qu’il faut savoir avant de commencer', body: 'Réponses sur les modèles, les tarifs, la confidentialité et l’API.', items: [
      ['Puis-je discuter et générer des images directement ?', 'Oui. Après connexion, ouvrez l’espace de discussion ou le studio d’images et choisissez un modèle disponible.'],
      ['Pourquoi les tarifs ne sont-ils pas visibles sur l’accueil ?', 'Les modèles et tarifs dépendent des droits du compte. La liste complète est disponible après connexion.'],
      ['Partokens conserve-t-il mes conversations ?', 'Les conversations récentes restent par défaut dans ce navigateur. Partokens ne conserve pas cet historique.'],
      ['Puis-je garder mon SDK OpenAI actuel ?', 'Oui. Créez une clé API puis remplacez l’adresse et la clé selon la documentation.'],
      ['Où suivre le solde et chaque appel ?', 'Le solde et l’usage restent visibles dans la console ; les analyses et journaux donnent le détail.'],
    ] },
    samples: { question: 'Prépare une checklist pour le lancement d’un produit.', answer: 'Je vais l’organiser en validation, mise en ligne et préparation du retour arrière.', composer: 'Écrivez un message pour commencer', chatTitle: 'Checklist de lancement', chatSecond: 'Analyse des concurrents', imagePrompt: 'Ville après la pluie, lumière cinéma' },
  },
  vi: {
    hero: { eyebrow: 'Cho mọi công việc AI', title: 'Không gian AI của bạn, từ gọi mô hình đến sáng tạo.', body: 'Trò chuyện, tạo ảnh, quản lý khóa API và theo dõi từng yêu cầu trong một tài khoản.', note: 'Mô hình và giá của tài khoản được tải sau khi đăng nhập' },
    started: { title: 'Bắt đầu từ công việc trước mắt', body: 'Bạn không cần hiểu lớp định tuyến trước. Chọn không gian làm việc và đi thẳng vào nhiệm vụ.', actionBodies: ['Dùng lịch sử hội thoại cục bộ và phản hồi trực tuyến.', 'Tạo, kết nối và sắp xếp ảnh trên canvas cục bộ.', 'Giới hạn quyền truy cập theo mô hình, hạn mức và thời hạn.'] },
    features: {
      title: 'Một tài khoản cho các quy trình AI thường dùng', body: 'Từ sáng tạo trực tiếp đến tích hợp API, mỗi khu vực đều xoay quanh công việc thực tế.',
      chat: { kicker: 'Trò chuyện và suy luận', title: 'Tiếp tục mỗi cuộc trò chuyện từ chỗ đã dừng', body: 'Tạo cuộc trò chuyện, chuyển giữa lịch sử gần đây và nhận phản hồi trực tuyến. Nội dung mặc định chỉ ở thiết bị này và không được Partokens lưu trữ.' },
      image: { kicker: 'Không gian hình ảnh', title: 'Tạo và sắp xếp trên cùng một canvas', body: 'Giữ prompt, ảnh tham chiếu và kết quả trong một quy trình sáng tạo có thể xem lại.' },
      control: { kicker: 'Mức dùng và quyền truy cập', title: 'Khóa, số dư và nhật ký luôn truy vết được', body: 'Tạo khóa giới hạn, xem mô hình và giá của tài khoản, rồi theo dõi từng yêu cầu trong nhật ký. Giá riêng tư không hiển thị ẩn danh.' },
    },
    values: { eyebrow: 'VÌ SAO CHỌN PARTOKENS', title: 'Ít chuyển đổi hơn, rõ ràng hơn', items: [
      { title: 'Tương thích', body: 'Kết nối qua API tương thích OpenAI quen thuộc.' }, { title: 'Thống nhất', body: 'Quản lý trò chuyện, hình ảnh, khóa và mức dùng cùng nhau.' }, { title: 'Minh bạch', body: 'Xem rõ giá tài khoản, số dư và lịch sử yêu cầu.' }, { title: 'Cục bộ', body: 'Lịch sử trò chuyện mặc định ở trên thiết bị hiện tại.' }, { title: 'Kiểm soát', body: 'Giới hạn khóa theo mô hình, hạn mức và thời hạn.' }, { title: 'Đa ngôn ngữ', body: 'Giao diện và tài liệu có sẵn bằng bảy ngôn ngữ.' },
    ] },
    faq: { title: 'Điều bạn có thể muốn biết trước', body: 'Các câu hỏi thường gặp về mô hình, giá, quyền riêng tư và API.', items: [
      ['Tôi có thể trò chuyện và tạo ảnh trực tiếp không?', 'Có. Sau khi đăng nhập, mở Playground hoặc không gian hình ảnh và chọn mô hình khả dụng.'],
      ['Vì sao trang chủ không hiển thị giá mô hình?', 'Mô hình và giá phụ thuộc vào quyền của tài khoản. Danh mục đầy đủ có sau khi đăng nhập.'],
      ['Partokens có lưu lịch sử trò chuyện không?', 'Các cuộc trò chuyện gần đây mặc định ở trong trình duyệt này. Partokens không lưu lịch sử đó.'],
      ['Tôi có thể tiếp tục dùng OpenAI SDK hiện tại không?', 'Có. Tạo khóa API rồi thay địa chỉ và khóa theo tài liệu sử dụng.'],
      ['Tôi xem số dư và từng lượt gọi ở đâu?', 'Số dư và mức dùng luôn hiển thị trong bảng điều khiển; phân tích và nhật ký cung cấp chi tiết.'],
    ] },
    samples: { question: 'Hãy tạo danh sách kiểm tra phát hành sản phẩm.', answer: 'Tôi sẽ chia thành xác minh trước phát hành, các bước triển khai và chuẩn bị quay lui.', composer: 'Nhập tin nhắn để bắt đầu', chatTitle: 'Kiểm tra phát hành', chatSecond: 'Nghiên cứu đối thủ', imagePrompt: 'Thành phố sau mưa, ánh sáng điện ảnh' },
  },
} satisfies Record<AppLocale, HomePageCopy>
