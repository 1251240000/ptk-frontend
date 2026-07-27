import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Code2,
  Component,
  Copy,
  CreditCard,
  ExternalLink,
  Image as ImageIcon,
  Info,
  KeyRound,
  Languages,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ReceiptText,
  Route,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TerminalSquare,
  Trash2,
  Type,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { resolvePreferredLocale, type AppLocale } from '@partokens/i18n'
import { AuthPrototype, type AuthPrototypeScreen } from './auth-prototype'
import { PublicPrototype, type PublicPrototypeScreen } from './public-prototype'
import { ShadcnAnalyticsScreen } from './shadcn-analytics-screen'
import { ShadcnApiKeysScreen } from './shadcn-api-keys-screen'
import { ShadcnConnectionsScreen } from './shadcn-connections-screen'
import { ShadcnImageStudioScreen } from './shadcn-image-studio-screen'
import { ShadcnNotificationsScreen } from './shadcn-notifications-screen'
import { ShadcnOverviewScreen } from './shadcn-overview-screen'
import { ShadcnPlaygroundScreen } from './shadcn-playground-screen'
import { ShadcnProfileScreen } from './shadcn-profile-screen'
import { ShadcnSecurityScreen } from './shadcn-security-screen'
import { ShadcnSystemScreen } from './shadcn-system-screen'
import { ShadcnUsageLogsScreen } from './shadcn-usage-logs-screen'
import { ShadcnWalletScreen } from './shadcn-wallet-screen'
import type { ConsoleRoute } from './shadcn-console-shell'

type Screen = 'system' | PublicPrototypeScreen | AuthPrototypeScreen | ConsoleRoute
type Locale = 'zh-CN' | 'fr' | 'ru'
type Theme = 'light' | 'dark'
const publicScreens: PublicPrototypeScreen[] = ['home', 'models', 'docs', 'about', 'notices', 'legal-user', 'legal-service', 'legal-privacy']
const authScreens: AuthPrototypeScreen[] = ['signin', 'signup', 'verify-email', 'forgot-password', 'reset-password', 'oauth-callback', 'auth-otp']
const consoleScreens: ConsoleRoute[] = ['console', 'console-analytics', 'console-keys', 'console-logs', 'console-playground', 'console-studio', 'console-wallet', 'console-profile', 'console-security', 'console-connections', 'console-notifications']

function initialTheme(): Theme {
  const saved = window.localStorage.getItem('partokens-theme')
  return saved === 'dark' ? 'dark' : 'light'
}

const brandLogoUrl = 'https://oss.partokens.com/assets/icons/favicon-96x96.png'

const zh = {
  concept: 'R1 设计原型', models: '模型广场', docs: '使用文档', about: '关于', signIn: '登录', console: '控制台',
  serviceOnline: '服务可连接', serviceWaiting: '等待服务状态', version: '服务版本', theme: '切换主题', language: '语言', notices: '通知',
  heroEyebrow: '面向每一种 AI 工作', heroTitle: '你的 AI 工作区，从调用到创作。', heroBody: '在一个账户里对话、生图、管理 API 密钥，并清楚掌握每一次使用。', openConsole: '立即使用', viewDocs: '查看接入文档',
  heroNote: '登录后加载账户可用模型与价格', previewWorkspace: '对话工作区', previewNewChat: '新对话', previewModel: '登录后选择模型', previewQuestion: '帮我整理一份产品发布检查清单。', previewAnswer: '可以。我会按发布前验证、上线步骤和回滚准备三个部分整理。', previewPrompt: '输入消息，开始对话', localConversation: '对话记录仅保存在本地',
  endpoint: '接入点', modelRoute: '模型选择', signInForModels: '登录后选择可用模型',
  quickEntry: 'GET STARTED', workspaceChoice: '从你现在要做的事开始', getStartedBody: '无需先理解复杂的模型路由，选择工作方式即可进入对应页面。', startChat: '发起一次对话', startChatBody: '使用本地会话历史和流式响应。', createImage: '进入生图工作台', createImageBody: '在本地画布中生成、连接和整理图片。', createKey: '创建 API 密钥', createKeyBody: '按模型、额度和有效期限制访问。',
  featuresEyebrow: 'PRODUCT', featuresTitle: '一个账户，覆盖常用 AI 工作流', featuresBody: '从直接创作到 API 接入，每个功能都围绕真实任务组织。',
  chatFeatureKicker: '对话与思考', chatFeatureTitle: '让每次对话都能接着上次继续', chatFeatureBody: '新建对话、切换最近记录并使用流式响应。会话内容默认只保存在当前设备，不进入 Partokens 服务端。', chatFeatureNote: '本地会话', recentChats: '最近对话', today: '今天', chatDraft: '产品发布检查清单', chatResearch: '竞品信息整理',
  imageFeatureKicker: '图像工作台', imageFeatureTitle: '在画布里生成，也在画布里整理', imageFeatureBody: '复用无限画布的空间操作，把提示词、参考图和生成结果放进同一个可回看的创作过程。', imageFeatureNote: '可视化画布', canvasTitle: '未命名画布', promptNode: '提示词', promptSample: '雨后城市，电影感光线', resultNode: '生成结果', generate: '生成图片',
  controlFeatureKicker: '用量与接入', controlFeatureTitle: '密钥、余额和日志始终有据可查', controlFeatureBody: '创建受限密钥，查看账户范围内的模型与价格，并从使用日志追踪每次请求。匿名页面不展示私有价格。', controlFeatureNote: '账户数据', accountOverview: '账户概览', availableBalance: '可用余额', monthUsage: '本月用量', restrictedKey: '受限密钥', requestLog: '请求日志', accountRequired: '登录后读取',
  valuesEyebrow: 'WHY PARTOKENS', valuesTitle: '少一点切换，多一点确定', compatible: '兼容', compatibleBody: '使用熟悉的 OpenAI 兼容接口接入。', unified: '统一', unifiedBody: '对话、生图、密钥和用量集中管理。', transparent: '透明', transparentBody: '账户价格、余额与请求日志清楚可见。', localFirst: '本地', localFirstBody: '聊天记录默认留在你的当前设备。', controlled: '可控', controlledBody: '按模型、额度与有效期约束密钥。', multilingual: '多语言', multilingualBody: '产品界面与使用文档同步国际化。',
  faqEyebrow: 'FAQ', faqTitle: '开始之前，你可能想知道', faqBody: '关于模型、价格、隐私和 API 接入的常见问题。', faq1q: 'Partokens 可以直接开始聊天和生图吗？', faq1a: '可以。登录后从控制台进入对话或生图工作台，并选择当前账户可用的模型。', faq2q: '为什么首页不展示模型价格？', faq2a: '模型与价格会根据账户权限加载，匿名状态不提供完整价格数据。登录后可在模型广场查看。', faq3q: '聊天记录会上传到 Partokens 吗？', faq3a: '产品会明确标注本地会话。最近聊天记录默认存储在当前浏览器，Partokens 不保存这些会话记录。', faq4q: '现有 OpenAI SDK 可以继续使用吗？', faq4a: '可以使用兼容接口。创建 API 密钥后，按使用文档替换接入地址与密钥即可。', faq5q: '如何查看余额和每次调用？', faq5a: '控制台固定展示余额与用量；数据看板和使用日志提供更完整的请求记录。',
  footerBody: '把常用模型调用、创作和账户管理放进一个清楚的工作区。', product: '产品', resources: '资源', legal: '条款', contact: '联系', playgroundLink: '对话游乐场', studioLink: '生图工作台', statusLink: '服务状态', userAgreement: '用户协议', serviceAgreement: '服务协议', privacyPolicy: '隐私政策', emailSupport: '邮件支持', telegramSupport: 'Telegram 支持', copyright: 'Partokens. All rights reserved.',
  authTitle: '欢迎回来', authBody: '登录后继续你的对话、创作和 API 管理。', username: '用户名或邮箱', password: '密码', forgot: '忘记密码', showPassword: '显示密码', hidePassword: '隐藏密码', consent: '我已阅读并同意用户协议、服务协议和隐私政策。', continueWith: '或使用以下方式继续', createAccount: '创建账户', noAccount: '还没有账户？',
  routeReady: '回到你的 AI 工作区', routeBody: '对话、生图和 API 管理都在同一个账户中。可用模型与价格只在登录后加载。', secureSession: '会话边界清楚', secureBody: '登录信息仅用于建立账户会话；本地对话记录不会上传到 Partokens。',
  search: '搜索当前页面', goodMorning: '早上好，Mika', overviewBody: '先确认账户状态，再进入下一次模型调用。', newChat: '新对话', balance: '可用余额', usage30: '近 30 天用量', requests: '本月请求', activeKeys: '有效密钥', sampleData: '概念数据',
  nextAction: '下一步行动', connectionReady: '接入已就绪', keyReady: '默认密钥可用', firstRequest: '完成第一次请求', completed: '已完成', openPlayground: '打开 Playground',
  recentRequests: '最近请求', viewAll: '查看全部', time: '时间', model: '模型', status: '状态', cost: '费用', latency: '延迟', success: '成功', routeStatus: 'API 接入', connected: '已连接', baseUrl: '兼容入口', copy: '复制', copied: '已复制', usageTrend: '用量节奏', lastSevenDays: '最近 7 天',
  workspace: '工作区', chatGroup: '创作', generalGroup: '常规', accountGroup: '账户', playground: 'Playground', studio: '生图工作台', overview: '概览', analytics: '数据看板', apiKeys: 'API 密钥', logs: '使用日志', wallet: '钱包', profile: '个人资料', remaining: '余额', collapse: '收起侧栏', expand: '展开侧栏', menu: '打开导航', close: '关闭',
  prototypeNotice: '此操作将在全量原型阶段补充', google: 'Google', linuxdo: 'LinuxDO', github: 'GitHub',
} as const

type Copy = Record<keyof typeof zh, string>

const fr: Copy = {
  ...zh,
  concept: 'CONCEPT R1', models: 'Modèles', docs: 'Documentation', about: 'À propos', signIn: 'Se connecter', console: 'Console', serviceOnline: 'Service accessible', serviceWaiting: 'État du service en attente', version: 'Version du service', theme: 'Changer de thème', language: 'Langue', notices: 'Notifications',
  heroEyebrow: 'POUR CHAQUE USAGE DE L’IA', heroTitle: 'Votre espace IA, de l’appel API à la création.', heroBody: 'Discutez, créez des images, gérez vos clés API et suivez chaque utilisation depuis un seul compte.', openConsole: 'Commencer maintenant', viewDocs: 'Voir la documentation', heroNote: 'Les modèles et tarifs de votre compte sont chargés après connexion', previewWorkspace: 'Espace de discussion', previewNewChat: 'Nouvelle discussion', previewModel: 'Choisir un modèle après connexion', previewQuestion: 'Prépare une checklist pour le lancement d’un produit.', previewAnswer: 'Bien sûr. Je vais l’organiser en trois parties : validation, mise en ligne et préparation du retour arrière.', previewPrompt: 'Écrivez un message pour commencer', localConversation: 'Les conversations restent sur cet appareil',
  endpoint: 'Point d’accès', modelRoute: 'Sélection du modèle', signInForModels: 'Connectez-vous pour choisir un modèle',
  quickEntry: 'GET STARTED', workspaceChoice: 'Commencez par ce que vous voulez faire', getStartedBody: 'Pas besoin de comprendre un routage complexe : choisissez simplement votre espace de travail.', startChat: 'Démarrer une discussion', startChatBody: 'Historique local et réponses en streaming.', createImage: 'Ouvrir le studio d’images', createImageBody: 'Générez et organisez des images sur un canevas local.', createKey: 'Créer une clé API', createKeyBody: 'Limitez les modèles, le quota et la durée.',
  featuresEyebrow: 'PRODUIT', featuresTitle: 'Un compte pour vos flux de travail IA essentiels', featuresBody: 'De la création directe à l’intégration API, chaque fonction suit une tâche réelle.', chatFeatureKicker: 'DISCUSSION ET RÉFLEXION', chatFeatureTitle: 'Reprenez chaque conversation là où vous l’avez laissée', chatFeatureBody: 'Créez une discussion, retrouvez les plus récentes et recevez les réponses en streaming. Le contenu reste par défaut sur cet appareil.', chatFeatureNote: 'Conversations locales', recentChats: 'Discussions récentes', today: 'Aujourd’hui', chatDraft: 'Checklist de lancement', chatResearch: 'Analyse des concurrents', imageFeatureKicker: 'STUDIO D’IMAGES', imageFeatureTitle: 'Générez et organisez sur le même canevas', imageFeatureBody: 'Placez prompts, références et résultats dans un espace visuel infini qui conserve le fil de votre création.', imageFeatureNote: 'Canevas visuel', canvasTitle: 'Canevas sans titre', promptNode: 'Prompt', promptSample: 'Ville après la pluie, lumière cinéma', resultNode: 'Résultat généré', generate: 'Générer', controlFeatureKicker: 'USAGE ET ACCÈS', controlFeatureTitle: 'Clés, solde et journaux restent vérifiables', controlFeatureBody: 'Créez des clés limitées, consultez les modèles et tarifs de votre compte, puis retracez chaque requête. Les tarifs privés ne sont pas publics.', controlFeatureNote: 'Données du compte', accountOverview: 'Vue du compte', availableBalance: 'Solde disponible', monthUsage: 'Usage du mois', restrictedKey: 'Clé limitée', requestLog: 'Journal des requêtes', accountRequired: 'Disponible après connexion',
  valuesEyebrow: 'POURQUOI PARTOKENS', valuesTitle: 'Moins de changements, plus de clarté', compatible: 'Compatible', compatibleBody: 'Connectez vos outils via une API compatible OpenAI.', unified: 'Unifié', unifiedBody: 'Discussions, images, clés et usage au même endroit.', transparent: 'Transparent', transparentBody: 'Tarifs, solde et requêtes clairement visibles.', localFirst: 'Local', localFirstBody: 'Les conversations restent par défaut sur votre appareil.', controlled: 'Maîtrisé', controlledBody: 'Limitez une clé par modèle, quota et durée.', multilingual: 'Multilingue', multilingualBody: 'Interface et documentation évoluent ensemble.', faqEyebrow: 'FAQ', faqTitle: 'Ce qu’il faut savoir avant de commencer', faqBody: 'Réponses sur les modèles, les tarifs, la confidentialité et l’API.', faq1q: 'Puis-je discuter et générer des images directement ?', faq1a: 'Oui. Après connexion, ouvrez l’espace de discussion ou le studio d’images et choisissez un modèle disponible pour votre compte.', faq2q: 'Pourquoi les tarifs ne sont-ils pas visibles sur l’accueil ?', faq2a: 'Les modèles et tarifs dépendent des droits du compte. La liste complète est disponible dans la galerie après connexion.', faq3q: 'Partokens conserve-t-il mes conversations ?', faq3a: 'Les conversations marquées comme locales sont enregistrées dans le navigateur courant. Partokens ne conserve pas cet historique.', faq4q: 'Puis-je garder mon SDK OpenAI actuel ?', faq4a: 'Oui. Créez une clé API puis remplacez l’adresse et la clé selon la documentation.', faq5q: 'Où suivre le solde et les appels ?', faq5a: 'Le solde et l’usage restent visibles dans la console ; le tableau de bord et les journaux donnent le détail.', footerBody: 'Réunissez appels de modèles, création et gestion de compte dans un espace clair.', product: 'Produit', resources: 'Ressources', legal: 'Conditions', contact: 'Contact', playgroundLink: 'Espace de discussion', studioLink: 'Studio d’images', statusLink: 'État du service', userAgreement: 'Contrat utilisateur', serviceAgreement: 'Conditions de service', privacyPolicy: 'Confidentialité', emailSupport: 'Support par e-mail', telegramSupport: 'Support Telegram', copyright: 'Partokens. Tous droits réservés.',
  authTitle: 'Heureux de vous revoir', authBody: 'Retrouvez vos discussions, créations et accès API après connexion.', username: 'Nom d’utilisateur ou e-mail', password: 'Mot de passe', forgot: 'Mot de passe oublié', showPassword: 'Afficher le mot de passe', hidePassword: 'Masquer le mot de passe', consent: 'J’accepte le Contrat utilisateur, les Conditions de service et la Politique de confidentialité.', continueWith: 'Ou continuer avec', createAccount: 'Créer un compte', noAccount: 'Vous n’avez pas de compte ?', routeReady: 'Retrouvez votre espace de travail IA', routeBody: 'Discussion, image et API vivent dans le même compte. Les modèles et tarifs ne sont chargés qu’après connexion.', secureSession: 'Une frontière claire', secureBody: 'Vos identifiants servent uniquement à ouvrir la session ; les conversations locales ne sont pas envoyées à Partokens.',
  search: 'Rechercher sur cette page', goodMorning: 'Bonjour, Mika', overviewBody: 'Vérifiez le compte avant votre prochain appel de modèle.', newChat: 'Nouvelle discussion', balance: 'Solde disponible', usage30: 'Utilisation sur 30 jours', requests: 'Requêtes ce mois-ci', activeKeys: 'Clés actives', sampleData: 'Données conceptuelles', nextAction: 'Prochaine action', connectionReady: 'Accès configuré', keyReady: 'Clé par défaut disponible', firstRequest: 'Première requête terminée', completed: 'Terminé', openPlayground: 'Ouvrir Playground', recentRequests: 'Requêtes récentes', viewAll: 'Tout afficher', time: 'Heure', model: 'Modèle', status: 'État', cost: 'Coût', latency: 'Latence', success: 'Réussie', routeStatus: 'Accès API', connected: 'Connecté', baseUrl: 'Point d’accès compatible', copy: 'Copier', copied: 'Copié', usageTrend: 'Rythme d’utilisation', lastSevenDays: '7 derniers jours',
  workspace: 'Espace de travail', chatGroup: 'Création', generalGroup: 'Général', accountGroup: 'Compte', playground: 'Playground', studio: 'Studio d’images', overview: 'Vue d’ensemble', analytics: 'Analyses', apiKeys: 'Clés API', logs: 'Journaux d’utilisation', wallet: 'Portefeuille', profile: 'Profil', remaining: 'Solde', collapse: 'Réduire la barre latérale', expand: 'Développer la barre latérale', menu: 'Ouvrir la navigation', close: 'Fermer', prototypeNotice: 'Cette action sera ajoutée au prototype complet', google: 'Google', linuxdo: 'LinuxDO', github: 'GitHub',
}

const ru: Copy = {
  ...zh,
  concept: 'КОНЦЕПТ R1', models: 'Модели', docs: 'Документация', about: 'О сервисе', signIn: 'Войти', console: 'Консоль', serviceOnline: 'Сервис доступен', serviceWaiting: 'Ожидание состояния сервиса', version: 'Версия сервиса', theme: 'Сменить тему', language: 'Язык', notices: 'Уведомления',
  heroEyebrow: 'ДЛЯ ЛЮБОЙ РАБОТЫ С ИИ', heroTitle: 'Ваше пространство ИИ: от API до творчества.', heroBody: 'Общайтесь, создавайте изображения, управляйте API-ключами и отслеживайте использование в одном аккаунте.', openConsole: 'Начать сейчас', viewDocs: 'Открыть документацию', heroNote: 'Модели и цены аккаунта загружаются после входа', previewWorkspace: 'Пространство чата', previewNewChat: 'Новый чат', previewModel: 'Выбор модели после входа', previewQuestion: 'Составь список проверок перед запуском продукта.', previewAnswer: 'Конечно. Разделю его на проверку перед релизом, запуск и подготовку отката.', previewPrompt: 'Введите сообщение, чтобы начать', localConversation: 'История хранится только на этом устройстве',
  endpoint: 'Точка доступа', modelRoute: 'Выбор модели', signInForModels: 'Войдите, чтобы выбрать модель',
  quickEntry: 'GET STARTED', workspaceChoice: 'Начните с того, что хотите сделать', getStartedBody: 'Не нужно разбираться в сложной маршрутизации — просто выберите рабочий режим.', startChat: 'Начать новый чат', startChatBody: 'Локальная история и потоковые ответы.', createImage: 'Открыть студию изображений', createImageBody: 'Создавайте и организуйте изображения на локальном холсте.', createKey: 'Создать ключ API', createKeyBody: 'Ограничьте модели, квоту и срок действия.',
  featuresEyebrow: 'ПРОДУКТ', featuresTitle: 'Один аккаунт для основных задач с ИИ', featuresBody: 'От непосредственного творчества до API — каждая функция выстроена вокруг реальной задачи.', chatFeatureKicker: 'ЧАТ И РАБОТА С ИДЕЯМИ', chatFeatureTitle: 'Продолжайте разговор с того же места', chatFeatureBody: 'Создавайте чаты, открывайте недавние и получайте потоковые ответы. По умолчанию история остаётся на текущем устройстве.', chatFeatureNote: 'Локальные чаты', recentChats: 'Недавние чаты', today: 'Сегодня', chatDraft: 'Проверки перед запуском', chatResearch: 'Анализ конкурентов', imageFeatureKicker: 'СТУДИЯ ИЗОБРАЖЕНИЙ', imageFeatureTitle: 'Создавайте и организуйте на одном холсте', imageFeatureBody: 'Размещайте запросы, референсы и результаты на бесконечном холсте, сохраняя весь процесс работы.', imageFeatureNote: 'Визуальный холст', canvasTitle: 'Новый холст', promptNode: 'Запрос', promptSample: 'Город после дождя, кинематографичный свет', resultNode: 'Результат', generate: 'Создать', controlFeatureKicker: 'ИСПОЛЬЗОВАНИЕ И ДОСТУП', controlFeatureTitle: 'Ключи, баланс и журналы легко проверить', controlFeatureBody: 'Создавайте ключи с ограничениями, просматривайте модели и цены аккаунта и отслеживайте запросы. Частные цены не публикуются.', controlFeatureNote: 'Данные аккаунта', accountOverview: 'Обзор аккаунта', availableBalance: 'Доступный баланс', monthUsage: 'Расход за месяц', restrictedKey: 'Ключ с лимитом', requestLog: 'Журнал запросов', accountRequired: 'Доступно после входа',
  valuesEyebrow: 'ПОЧЕМУ PARTOKENS', valuesTitle: 'Меньше переключений, больше ясности', compatible: 'Совместимо', compatibleBody: 'Подключайтесь через знакомый OpenAI-совместимый API.', unified: 'Едино', unifiedBody: 'Чаты, изображения, ключи и расход в одном месте.', transparent: 'Прозрачно', transparentBody: 'Цены аккаунта, баланс и запросы всегда видны.', localFirst: 'Локально', localFirstBody: 'История чатов остаётся на вашем устройстве.', controlled: 'Управляемо', controlledBody: 'Ограничивайте ключ по моделям, квоте и сроку.', multilingual: 'Мультиязычно', multilingualBody: 'Интерфейс и документация переводятся вместе.', faqEyebrow: 'FAQ', faqTitle: 'Что важно знать перед началом', faqBody: 'Ответы о моделях, ценах, приватности и API.', faq1q: 'Можно сразу использовать чат и генерацию изображений?', faq1a: 'Да. После входа откройте чат или студию изображений и выберите модель, доступную вашему аккаунту.', faq2q: 'Почему на главной нет цен на модели?', faq2a: 'Модели и цены зависят от прав аккаунта. Полный список доступен в каталоге после входа.', faq3q: 'Partokens хранит мои чаты?', faq3a: 'Локальные чаты сохраняются в текущем браузере. Partokens не хранит эту историю разговоров.', faq4q: 'Можно продолжить использовать OpenAI SDK?', faq4a: 'Да. Создайте API-ключ и замените адрес и ключ согласно документации.', faq5q: 'Где смотреть баланс и вызовы?', faq5a: 'Баланс и расход закреплены в консоли, а подробности доступны в аналитике и журналах.', footerBody: 'Объедините вызовы моделей, творчество и управление аккаунтом в ясном рабочем пространстве.', product: 'Продукт', resources: 'Ресурсы', legal: 'Условия', contact: 'Контакты', playgroundLink: 'Чат', studioLink: 'Студия изображений', statusLink: 'Состояние сервиса', userAgreement: 'Пользовательское соглашение', serviceAgreement: 'Условия обслуживания', privacyPolicy: 'Политика конфиденциальности', emailSupport: 'Поддержка по почте', telegramSupport: 'Поддержка в Telegram', copyright: 'Partokens. Все права защищены.',
  authTitle: 'С возвращением', authBody: 'После входа продолжайте чаты, творчество и управление API.', username: 'Имя пользователя или почта', password: 'Пароль', forgot: 'Забыли пароль', showPassword: 'Показать пароль', hidePassword: 'Скрыть пароль', consent: 'Я принимаю Пользовательское соглашение, Условия обслуживания и Политику конфиденциальности.', continueWith: 'Или продолжить через', createAccount: 'Создать аккаунт', noAccount: 'Нет аккаунта?', routeReady: 'Вернитесь в рабочее пространство ИИ', routeBody: 'Чат, изображения и API доступны в одном аккаунте. Модели и цены загружаются только после входа.', secureSession: 'Понятные границы сессии', secureBody: 'Данные входа нужны только для сессии аккаунта; локальные чаты не отправляются в Partokens.',
  search: 'Поиск на текущей странице', goodMorning: 'Доброе утро, Mika', overviewBody: 'Проверьте аккаунт перед следующим вызовом модели.', newChat: 'Новый чат', balance: 'Доступный баланс', usage30: 'Расход за 30 дней', requests: 'Запросы за месяц', activeKeys: 'Активные ключи', sampleData: 'Данные концепта', nextAction: 'Следующее действие', connectionReady: 'Доступ настроен', keyReady: 'Основной ключ доступен', firstRequest: 'Первый запрос выполнен', completed: 'Готово', openPlayground: 'Открыть Playground', recentRequests: 'Недавние запросы', viewAll: 'Показать все', time: 'Время', model: 'Модель', status: 'Статус', cost: 'Стоимость', latency: 'Задержка', success: 'Успешно', routeStatus: 'Доступ к API', connected: 'Подключено', baseUrl: 'Совместимая точка доступа', copy: 'Копировать', copied: 'Скопировано', usageTrend: 'Динамика расхода', lastSevenDays: 'Последние 7 дней',
  workspace: 'Рабочее пространство', chatGroup: 'Создание', generalGroup: 'Основное', accountGroup: 'Аккаунт', playground: 'Playground', studio: 'Студия изображений', overview: 'Обзор', analytics: 'Аналитика', apiKeys: 'Ключи API', logs: 'Журнал использования', wallet: 'Кошелёк', profile: 'Профиль', remaining: 'Баланс', collapse: 'Свернуть боковую панель', expand: 'Развернуть боковую панель', menu: 'Открыть навигацию', close: 'Закрыть', prototypeNotice: 'Это действие появится в полном прототипе', google: 'Google', linuxdo: 'LinuxDO', github: 'GitHub',
}

const copies: Record<Locale, Copy> = { 'zh-CN': zh, fr, ru }
const localeLabels: Record<Locale, string> = { 'zh-CN': '简体中文', fr: 'Français', ru: 'Русский' }

function screenFromHash(): Screen {
  const value = window.location.hash.replace('#', '')
  const screens: Screen[] = ['home', 'system', 'models', 'docs', 'about', 'notices', 'legal-user', 'legal-service', 'legal-privacy', ...authScreens, ...consoleScreens]
  return screens.includes(value as Screen) ? value as Screen : 'home'
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand-lockup"><span className="brand-mark"><img src={brandLogoUrl} alt="" /></span>{compact ? null : <span>Partokens</span>}</span>
}

function IconButton({ label, onClick, children, className = '' }: { label: string; onClick?: () => void; children: React.ReactNode; className?: string }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick}>{children}</button>
}

function LocaleControl({ locale, onChange, label }: { locale: Locale; onChange: (locale: Locale) => void; label: string }) {
  return <label className="locale-control"><Languages size={17} /><span className="sr-only">{label}</span><select aria-label={label} value={locale} onChange={(event) => onChange(event.target.value as Locale)}>{(Object.keys(localeLabels) as Locale[]).map((item) => <option key={item} value={item}>{localeLabels[item]}</option>)}</select></label>
}

function ThemeButton({ theme, onChange, label }: { theme: Theme; onChange: () => void; label: string }) {
  return <IconButton label={label} onClick={onChange}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</IconButton>
}

function PrototypeBadge({ text }: { text: string }) {
  return <span className="prototype-badge"><span />{text}</span>
}

function PublicHeader({ t, locale, theme, onLocale, onTheme, go, onNotice }: { t: Copy; locale: Locale; theme: Theme; onLocale: (locale: Locale) => void; onTheme: () => void; go: (screen: Screen) => void; onNotice: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return <>
    <header className="public-header">
      <button className="brand-button" onClick={() => go('home')} aria-label="Partokens"><Brand /></button>
      <nav className="public-nav" aria-label="Primary">
        <button onClick={() => go('models')}>{t.models}</button><button onClick={() => go('docs')}>{t.docs}</button><button onClick={() => go('about')}>{t.about}</button>
      </nav>
      <div className="header-actions">
        <PrototypeBadge text={t.concept} />
        <IconButton label={t.notices} onClick={() => go('notices')}><Bell size={18} /></IconButton>
        <LocaleControl locale={locale} onChange={onLocale} label={t.language} />
        <ThemeButton theme={theme} onChange={onTheme} label={t.theme} />
        <button className="text-action" onClick={() => go('signin')}>{t.signIn}</button>
        <button className="primary-button compact-button" onClick={() => go('console')}>{t.console}<ArrowRight size={16} /></button>
        <IconButton label={t.menu} className="mobile-menu-button" onClick={() => setMobileOpen(true)}><Menu size={20} /></IconButton>
      </div>
    </header>
    {mobileOpen ? <div className="mobile-nav-sheet"><div className="mobile-nav-head"><Brand /><IconButton label={t.close} onClick={() => setMobileOpen(false)}><X size={20} /></IconButton></div><nav><button onClick={() => go('models')}>{t.models}</button><button onClick={() => go('docs')}>{t.docs}</button><button onClick={() => go('about')}>{t.about}</button><button onClick={() => go('notices')}>{t.notices}</button><button onClick={() => go('signin')}>{t.signIn}</button><button className="primary-button" onClick={() => go('console')}>{t.console}<ArrowRight size={16} /></button></nav><div className="mobile-nav-tools"><LocaleControl locale={locale} onChange={onLocale} label={t.language} /><ThemeButton theme={theme} onChange={onTheme} label={t.theme} /></div></div> : null}
  </>
}

function ProductPreview({ t, online, version }: { t: Copy; online: boolean | null; version?: string }) {
  return <div className="product-preview" aria-label={t.previewWorkspace}>
    <div className="preview-window-bar">
      <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
      <strong>{t.previewWorkspace}</strong>
      <span className={online ? 'live-status online' : 'live-status'}><i />{online ? t.serviceOnline : t.serviceWaiting}{version ? ` / ${version}` : ''}</span>
    </div>
    <div className="preview-app-shell">
      <aside className="preview-rail" aria-hidden="true"><span className="mini-brand"><img src={brandLogoUrl} alt="" /></span><MessageSquare className="active" size={18} /><ImageIcon size={18} /><KeyRound size={18} /><LayoutDashboard size={18} /></aside>
      <section className="preview-chat">
        <header><div><span>{t.previewWorkspace}</span><strong>{t.previewNewChat}</strong></div><span className="preview-model-control"><Sparkles size={15} />{t.previewModel}<ChevronDown size={14} /></span></header>
        <div className="preview-messages">
          <div className="preview-message user-message"><span>{t.previewQuestion}</span><CircleUserRound size={22} /></div>
          <div className="preview-message assistant-message"><span className="assistant-avatar"><Bot size={16} /></span><p>{t.previewAnswer}</p></div>
        </div>
        <div className="preview-composer"><span>{t.previewPrompt}</span><span className="preview-send"><Send size={16} /></span></div>
        <div className="preview-local-note"><ShieldCheck size={14} />{t.localConversation}</div>
      </section>
    </div>
  </div>
}

function FeatureCopy({ kicker, title, body, note, icon: Icon }: { kicker: string; title: string; body: string; note: string; icon: LucideIcon }) {
  return <div className="feature-copy"><span className="section-kicker">{kicker}</span><h3>{title}</h3><p>{body}</p><span className="feature-note"><Icon size={16} />{note}</span></div>
}

function ChatFeatureVisual({ t }: { t: Copy }) {
  return <div className="feature-product-frame chat-feature-ui">
    <aside><header><span>{t.recentChats}</span><Plus size={16} /></header><small>{t.today}</small><div className="chat-history-item active"><MessageSquare size={15} />{t.chatDraft}</div><div className="chat-history-item"><MessageSquare size={15} />{t.chatResearch}</div><div className="local-data-label"><ShieldCheck size={14} />{t.localConversation}</div></aside>
    <section><header><strong>{t.chatDraft}</strong><span><Sparkles size={14} />{t.previewModel}</span></header><div className="mini-conversation"><p className="mini-user">{t.previewQuestion}</p><div><span><Bot size={15} /></span><p>{t.previewAnswer}</p></div></div><div className="mini-composer"><span>{t.previewPrompt}</span><Send size={15} /></div></section>
  </div>
}

function ImageFeatureVisual({ t }: { t: Copy }) {
  return <div className="feature-product-frame studio-feature-ui">
    <header><div><ImageIcon size={17} /><strong>{t.canvasTitle}</strong></div><div><span className="studio-tool" title={t.controlled}><SlidersHorizontal size={15} /></span><span className="studio-tool generate-button"><Sparkles size={15} />{t.generate}</span></div></header>
    <div className="studio-canvas">
      <div className="canvas-node prompt-canvas-node"><span><MessageSquare size={14} />{t.promptNode}</span><p>{t.promptSample}</p></div>
      <div className="canvas-link" aria-hidden="true"><i /><ArrowRight size={18} /></div>
      <div className="canvas-node result-canvas-node"><span><ImageIcon size={14} />{t.resultNode}</span><div className="generated-image" aria-hidden="true"><i /><i /><i /><i /></div></div>
      <div className="canvas-controls" aria-hidden="true"><span className="canvas-zoom-button">−</span><span>78%</span><span className="canvas-zoom-button">+</span></div>
    </div>
  </div>
}

function ControlFeatureVisual({ t }: { t: Copy }) {
  return <div className="feature-product-frame control-feature-ui">
    <header><div><LayoutDashboard size={17} /><strong>{t.accountOverview}</strong></div><span><LockKeyhole size={14} />{t.accountRequired}</span></header>
    <div className="account-metrics"><div><span>{t.availableBalance}</span><strong>—</strong></div><div><span>{t.monthUsage}</span><strong>—</strong></div></div>
    <div className="access-list"><div><span className="access-icon key"><KeyRound size={16} /></span><p><strong>{t.restrictedKey}</strong><small>{t.createKeyBody}</small></p><ChevronRight size={16} /></div><div><span className="access-icon log"><Activity size={16} /></span><p><strong>{t.requestLog}</strong><small>{t.accountRequired}</small></p><ChevronRight size={16} /></div></div>
  </div>
}

function HomeScreen({ t, locale, theme, onLocale, onTheme, go, online, version, onNotice }: CommonScreenProps & { online: boolean | null; version?: string }) {
  const entries = [
    { icon: MessageSquare, title: t.startChat, body: t.startChatBody },
    { icon: ImageIcon, title: t.createImage, body: t.createImageBody },
    { icon: KeyRound, title: t.createKey, body: t.createKeyBody },
  ]
  const values = [
    { icon: Code2, title: t.compatible, body: t.compatibleBody },
    { icon: Layers3, title: t.unified, body: t.unifiedBody },
    { icon: Activity, title: t.transparent, body: t.transparentBody },
    { icon: ShieldCheck, title: t.localFirst, body: t.localFirstBody },
    { icon: SlidersHorizontal, title: t.controlled, body: t.controlledBody },
    { icon: Languages, title: t.multilingual, body: t.multilingualBody },
  ]
  const faqs = [[t.faq1q, t.faq1a], [t.faq2q, t.faq2a], [t.faq3q, t.faq3a], [t.faq4q, t.faq4a], [t.faq5q, t.faq5a]]
  return <div className="home-screen">
    <PublicHeader {...{ t, locale, theme, onLocale, onTheme, go, onNotice }} />
    <main>
      <section className="hero-section">
        <div className="hero-copy"><span className="section-kicker">{t.heroEyebrow}</span><h1>Partokens</h1><h2>{t.heroTitle}</h2><p>{t.heroBody}</p><div className="hero-actions"><button className="primary-button" onClick={() => go('console')}>{t.openConsole}<ArrowRight size={17} /></button><button className="secondary-button" onClick={() => go('docs')}><BookOpen size={17} />{t.viewDocs}</button></div><small className="hero-note"><LockKeyhole size={14} />{t.heroNote}</small></div>
        <ProductPreview {...{ t, online, version }} />
      </section>

      <section className="get-started-section">
        <div className="section-heading"><span className="section-kicker">{t.quickEntry}</span><h2>{t.workspaceChoice}</h2><p>{t.getStartedBody}</p></div>
        <div className="entry-grid">{entries.map(({ icon: Icon, title, body }) => <button key={title} onClick={() => go('console')}><Icon size={22} /><span><strong>{title}</strong><small>{body}</small></span><ArrowRight size={17} /></button>)}</div>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading centered-heading"><span className="section-kicker">{t.featuresEyebrow}</span><h2>{t.featuresTitle}</h2><p>{t.featuresBody}</p></div>
        <div className="feature-row"><FeatureCopy kicker={t.chatFeatureKicker} title={t.chatFeatureTitle} body={t.chatFeatureBody} note={t.chatFeatureNote} icon={ShieldCheck} /><ChatFeatureVisual t={t} /></div>
        <div className="feature-row reversed"><FeatureCopy kicker={t.imageFeatureKicker} title={t.imageFeatureTitle} body={t.imageFeatureBody} note={t.imageFeatureNote} icon={ImageIcon} /><ImageFeatureVisual t={t} /></div>
        <div className="feature-row"><FeatureCopy kicker={t.controlFeatureKicker} title={t.controlFeatureTitle} body={t.controlFeatureBody} note={t.controlFeatureNote} icon={KeyRound} /><ControlFeatureVisual t={t} /></div>
      </section>

      <section className="values-section">
        <div className="section-heading"><span className="section-kicker">{t.valuesEyebrow}</span><h2>{t.valuesTitle}</h2></div>
        <div className="value-grid">{values.map(({ icon: Icon, title, body }, index) => <article key={title}><span>0{index + 1}</span><Icon size={20} /><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading"><span className="section-kicker">{t.faqEyebrow}</span><h2>{t.faqTitle}</h2><p>{t.faqBody}</p></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{question}</span><ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div>
      </section>
    </main>

    <footer className="home-footer">
      <div className="footer-main"><div className="footer-brand"><Brand /><p>{t.footerBody}</p><span className={online ? 'live-status online' : 'live-status'}><i />{online ? t.serviceOnline : t.serviceWaiting}</span></div><div className="footer-links"><div><strong>{t.product}</strong><button onClick={() => go('console')}>{t.playgroundLink}</button><button onClick={() => go('console')}>{t.studioLink}</button><button onClick={() => go('models')}>{t.models}</button></div><div><strong>{t.resources}</strong><button onClick={() => go('docs')}>{t.docs}</button><a href="https://partokens.com/api/status" target="_blank" rel="noreferrer">{t.statusLink}<ExternalLink size={13} /></a><button onClick={() => go('about')}>{t.about}</button></div><div><strong>{t.legal}</strong><button onClick={() => go('legal-user')}>{t.userAgreement}</button><button onClick={() => go('legal-service')}>{t.serviceAgreement}</button><button onClick={() => go('legal-privacy')}>{t.privacyPolicy}</button></div><div><strong>{t.contact}</strong><a href="mailto:admin@partokens.com"><Mail size={14} />{t.emailSupport}</a><a href="https://t.me/PartokensSupportBot" target="_blank" rel="noreferrer"><MessageSquare size={14} />{t.telegramSupport}</a></div></div></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {t.copyright}</span><span>admin@partokens.com</span></div>
    </footer>
  </div>
}

type CommonScreenProps = { t: Copy; locale: Locale; theme: Theme; onLocale: (locale: Locale) => void; onTheme: () => void; go: (screen: Screen) => void; onNotice: () => void }

const consoleGroups: Array<{ label: keyof Copy; items: Array<{ label: keyof Copy; icon: LucideIcon }> }> = [
  { label: 'chatGroup', items: [{ label: 'playground', icon: MessageSquare }, { label: 'studio', icon: ImageIcon }] },
  { label: 'generalGroup', items: [{ label: 'overview', icon: LayoutDashboard }, { label: 'analytics', icon: BarChart3 }, { label: 'apiKeys', icon: KeyRound }, { label: 'logs', icon: ReceiptText }] },
  { label: 'accountGroup', items: [{ label: 'wallet', icon: WalletCards }, { label: 'profile', icon: UserRound }] },
]

function ConsoleScreen({ t, locale, theme, onLocale, onTheme, go, online, onNotice }: CommonScreenProps & { online: boolean | null }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyEndpoint = async () => { await navigator.clipboard?.writeText(`${window.location.origin}/v1`); setCopied(true); window.setTimeout(() => setCopied(false), 1200) }
  return <div className={`console-screen ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
    <header className="console-topbar">
      <button className="brand-button" onClick={() => go('home')}><Brand compact={collapsed} /></button>
      <div className="workspace-name"><span>{t.workspace}</span><strong>Partokens Cloud</strong></div>
      <label className="console-search"><Search size={17} /><input aria-label={t.search} placeholder={t.search} /></label>
      <div className="console-tools"><PrototypeBadge text={t.concept} /><span className={online ? 'live-status online' : 'live-status'}><i />{online ? t.serviceOnline : t.serviceWaiting}</span><LocaleControl locale={locale} onChange={onLocale} label={t.language} /><ThemeButton theme={theme} onChange={onTheme} label={t.theme} /><IconButton label={t.notices} onClick={onNotice}><Bell size={18} /><b className="notification-dot" /></IconButton><button className="user-menu" onClick={onNotice}><CircleUserRound size={20} /><span>Mika Chen</span><ChevronRight size={15} /></button><IconButton className="console-mobile-menu" label={t.menu} onClick={() => setMobileOpen(true)}><Menu size={20} /></IconButton></div>
    </header>
    <aside className={`console-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="mobile-sidebar-head"><Brand /><IconButton label={t.close} onClick={() => setMobileOpen(false)}><X size={20} /></IconButton></div>
      <nav>{consoleGroups.map((group) => <div className="nav-group" key={group.label}><span>{t[group.label]}</span>{group.items.map((item) => { const Icon = item.icon; return <button className={item.label === 'overview' ? 'active' : ''} key={item.label} onClick={item.label === 'overview' ? undefined : onNotice}><Icon size={18} /><strong>{t[item.label]}</strong></button> })}</div>)}</nav>
      <div className="mobile-sidebar-tools"><LocaleControl locale={locale} onChange={onLocale} label={t.language} /><ThemeButton theme={theme} onChange={onTheme} label={t.theme} /></div>
      <div className="sidebar-usage"><div><span>{t.remaining}</span><strong>$82.40</strong></div><div><span>{t.usage30}</span><strong>$9.18</strong></div></div>
      <IconButton label={collapsed ? t.expand : t.collapse} className="collapse-control" onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</IconButton>
    </aside>
    <main className="console-main">
      <section className="overview-heading"><div><span className="section-label">{t.console} / {t.overview}</span><h1>{t.goodMorning}</h1><p>{t.overviewBody}</p></div><div><span className="sample-label">{t.sampleData}</span><button className="secondary-button" onClick={onNotice}><KeyRound size={17} />{t.createKey}</button><button className="primary-button" onClick={onNotice}><Plus size={17} />{t.newChat}</button></div></section>
      <section className="metric-belt"><div><span>{t.balance}</span><strong>$82.40</strong><small>USD</small></div><div><span>{t.usage30}</span><strong>$9.18</strong><small>11.1%</small></div><div><span>{t.requests}</span><strong>1,284</strong><small>+14.2%</small></div><div><span>{t.activeKeys}</span><strong>3</strong><small>1 default</small></div></section>
      <div className="overview-workspace">
        <section className="work-panel next-actions-panel"><header><div><span className="section-label">READY</span><h2>{t.nextAction}</h2></div><span className="completion-count">3/3</span></header><div className="action-steps">{[{ label: t.connectionReady, icon: Route }, { label: t.keyReady, icon: KeyRound }, { label: t.firstRequest, icon: Check }].map(({ label, icon: Icon }) => <div key={label}><span><Icon size={18} /></span><strong>{label}</strong><small>{t.completed}</small><Check size={16} /></div>)}</div><button className="primary-button" onClick={onNotice}>{t.openPlayground}<ArrowRight size={16} /></button></section>
        <section className="work-panel recent-panel"><header><div><span className="section-label">REQUESTS</span><h2>{t.recentRequests}</h2></div><button onClick={onNotice}>{t.viewAll}<ArrowRight size={14} /></button></header><div className="request-table"><div className="request-head"><span>{t.time}</span><span>{t.model}</span><span>{t.status}</span><span>{t.cost}</span><span>{t.latency}</span></div>{[['10:42', 'gpt-4.1-mini', '$0.018', '842 ms'], ['10:31', 'claude-3.7-sonnet', '$0.064', '1.2 s'], ['09:58', 'gemini-2.5-flash', '$0.009', '684 ms']].map((row) => <div className="request-row" key={row[0]}><span className="mono">{row[0]}</span><strong>{row[1]}</strong><span className="request-success"><i />{t.success}</span><span className="mono">{row[2]}</span><span className="mono">{row[3]}</span></div>)}</div></section>
        <section className="work-panel route-panel"><header><div><span className="section-label">ACCESS</span><h2>{t.routeStatus}</h2></div><span className="connected-badge"><i />{t.connected}</span></header><div className="route-map"><div><TerminalSquare size={18} /><span><small>{t.baseUrl}</small><code>/v1</code></span></div><ArrowRight size={17} /><div><Sparkles size={18} /><span><small>{t.modelRoute}</small><strong>Auto / default</strong></span></div></div><button className="copy-endpoint" onClick={() => void copyEndpoint()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? t.copied : t.copy}</button></section>
        <section className="work-panel usage-panel"><header><div><span className="section-label">USAGE</span><h2>{t.usageTrend}</h2></div><span>{t.lastSevenDays}</span></header><div className="usage-bars" aria-label={t.usageTrend}>{[38, 54, 42, 72, 61, 88, 68].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{index + 1}</small></div>)}</div></section>
      </div>
    </main>
    <nav className="mobile-bottom-nav">{[{ label: t.overview, icon: LayoutDashboard }, { label: t.playground, icon: MessageSquare }, { label: t.studio, icon: ImageIcon }, { label: t.wallet, icon: CreditCard }, { label: t.menu, icon: Menu }].map(({ label, icon: Icon }, index) => <button className={index === 0 ? 'active' : ''} key={label} onClick={index === 4 ? () => setMobileOpen(true) : onNotice}><Icon size={19} /><span>{label}</span></button>)}</nav>
  </div>
}

export function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash)
  const [locale, setLocale] = useState<Locale>('zh-CN')
  const [publicLocale, setPublicLocale] = useState<AppLocale>(resolvePreferredLocale)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [online, setOnline] = useState<boolean | null>(null)
  const [version, setVersion] = useState<string>()
  const [notice, setNotice] = useState('')
  const t = copies[locale]
  const isPublicPrototype = publicScreens.includes(screen as PublicPrototypeScreen)
  const isAuthPrototype = authScreens.includes(screen as AuthPrototypeScreen)
  const isShadcnAnalytics = screen === 'console-analytics'
  const isShadcnApiKeys = screen === 'console-keys'
  const isShadcnConnections = screen === 'console-connections'
  const isShadcnNotifications = screen === 'console-notifications'
  const isShadcnOverview = screen === 'console'
  const isShadcnPlayground = screen === 'console-playground'
  const isShadcnProfile = screen === 'console-profile'
  const isShadcnSecurity = screen === 'console-security'
  const isShadcnStudio = screen === 'console-studio'
  const isShadcnUsageLogs = screen === 'console-logs'
  const isShadcnWallet = screen === 'console-wallet'
  const usesSharedLocale = isPublicPrototype || isAuthPrototype

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = usesSharedLocale ? publicLocale : locale
    window.localStorage.setItem('partokens-locale', usesSharedLocale ? publicLocale : locale)
    window.localStorage.setItem('partokens-theme', theme)
  }, [theme, locale, publicLocale, usesSharedLocale])

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    void fetch('/api/status').then(async (response) => {
      const body = await response.json() as { success?: boolean; data?: { version?: string } }
      setOnline(Boolean(response.ok && body.success))
      setVersion(body.data?.version)
    }).catch(() => setOnline(false))
  }, [])

  const go = (target: Screen) => { window.location.hash = target; setScreen(target); window.scrollTo({ top: 0 }) }
  const onLegacyLocale = (nextLocale: Locale) => { setLocale(nextLocale); setPublicLocale(nextLocale) }
  const common = useMemo<CommonScreenProps>(() => ({ t, locale, theme, onLocale: onLegacyLocale, onTheme: () => setTheme((value) => value === 'light' ? 'dark' : 'light'), go, onNotice: () => setNotice(t.prototypeNotice) }), [t, locale, theme])

  return <>
    {isAuthPrototype ? <AuthPrototype screen={screen as AuthPrototypeScreen} locale={publicLocale} theme={theme} online={online} version={version} onLocale={setPublicLocale} onTheme={common.onTheme} go={go} /> : null}
    {isShadcnOverview ? <ShadcnOverviewScreen theme={theme} online={online} version={version} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnConnections ? <ShadcnConnectionsScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnNotifications ? <ShadcnNotificationsScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnPlayground ? <ShadcnPlaygroundScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnProfile ? <ShadcnProfileScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnSecurity ? <ShadcnSecurityScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnStudio ? <ShadcnImageStudioScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnAnalytics ? <ShadcnAnalyticsScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnApiKeys ? <ShadcnApiKeysScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnUsageLogs ? <ShadcnUsageLogsScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {isShadcnWallet ? <ShadcnWalletScreen theme={theme} onTheme={common.onTheme} onNavigate={(target) => go(target)} /> : null}
    {screen === 'system' ? <ShadcnSystemScreen theme={theme} onTheme={common.onTheme} onExit={() => go('home')} /> : null}
    {isPublicPrototype ? <PublicPrototype screen={screen as PublicPrototypeScreen} locale={publicLocale} theme={theme} online={online} version={version} onLocale={setPublicLocale} onTheme={common.onTheme} go={go} /> : null}
    {notice ? <div className="prototype-toast" role="status"><CircleHelp size={17} /><span>{notice}</span><IconButton label={t.close} onClick={() => setNotice('')}><X size={16} /></IconButton></div> : null}
  </>
}
