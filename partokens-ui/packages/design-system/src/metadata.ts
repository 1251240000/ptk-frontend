export const designSystemVersion = 'R3' as const

export const semanticColors = [
  { name: 'Cloud', variable: '--pt-color-bg-canvas', role: '页面与连续工作区' },
  { name: 'Surface', variable: '--pt-color-bg-surface', role: '控件、菜单与内容表面' },
  { name: 'Relay', variable: '--pt-color-action-primary', role: '主要命令、焦点和选中' },
  { name: 'Prompt', variable: '--pt-color-accent-lilac', role: '提示与 AI 协作' },
  { name: 'Canvas', variable: '--pt-color-accent-mint', role: '本地画布与创作过程' },
  { name: 'Result', variable: '--pt-color-accent-coral', role: '生成结果与关键回声' },
] as const

export const dataColors = [
  { name: 'Series 1', variable: '--pt-color-data-1' },
  { name: 'Series 2', variable: '--pt-color-data-2' },
  { name: 'Series 3', variable: '--pt-color-data-3' },
  { name: 'Series 4', variable: '--pt-color-data-4' },
  { name: 'Series 5', variable: '--pt-color-data-5' },
  { name: 'Series 6', variable: '--pt-color-data-6' },
] as const

export const localeTypography = [
  { locale: 'zh-CN', label: '简体中文', script: 'Hans', font: 'Noto Sans SC', sample: '账户已连接，可以开始一次对话。' },
  { locale: 'zh-TW', label: '繁體中文', script: 'Hant', font: 'Noto Sans TC', sample: '帳戶已連線，可以開始一次對話。' },
  { locale: 'en', label: 'English', script: 'Latin', font: 'Source Sans 3', sample: 'Your account is ready for a new conversation.' },
  { locale: 'ja', label: '日本語', script: 'Jpan', font: 'Noto Sans JP', sample: 'アカウントの準備ができました。会話を始められます。' },
  { locale: 'ru', label: 'Русский', script: 'Cyrl', font: 'Source Sans 3', sample: 'Аккаунт готов, можно начать новый диалог.' },
  { locale: 'fr', label: 'Français', script: 'Latin', font: 'Source Sans 3', sample: 'Votre compte est prêt pour une nouvelle discussion.' },
  { locale: 'vi', label: 'Tiếng Việt', script: 'Latin', font: 'Source Sans 3', sample: 'Tài khoản đã sẵn sàng để bắt đầu cuộc trò chuyện.' },
] as const

export const responsiveBreakpoints = [
  { width: 320, name: 'Minimum', rule: '单列、紧凑工具栏，禁止页面横向滚动' },
  { width: 390, name: 'Compact', rule: '移动基准，底部导航与全宽表单' },
  { width: 768, name: 'Navigation', rule: '桌面侧栏切换为抽屉或底部导航' },
  { width: 1024, name: 'Workspace', rule: '两栏工作区，隐藏次要顶栏工具' },
  { width: 1440, name: 'Expanded', rule: '完整侧栏、数据带和双栏工作区' },
] as const

export const componentFamilies = [
  { name: 'Commands', contents: '按钮、图标按钮、分段控件、开关' },
  { name: 'Inputs', contents: '文本、选择、复选、校验与帮助文本' },
  { name: 'Data', contents: '状态、标签、表格、指标与图表替代表' },
  { name: 'Overlays', contents: '菜单、抽屉、对话框、Toast' },
  { name: 'States', contents: '加载、空状态、错误、禁用与成功反馈' },
] as const
