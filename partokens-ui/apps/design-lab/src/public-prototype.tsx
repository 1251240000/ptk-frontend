import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  CircleDollarSign,
  Clipboard,
  Code2,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Languages,
  LockKeyhole,
  Menu,
  MessageSquare,
  Moon,
  Network,
  Plus,
  Route,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TerminalSquare,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'

import {
  Button,
} from '@partokens/design-system/components'
import {
  getCurrentNotice,
  getLegalDocument,
  getLocaleContent,
  type LegalKind,
} from '@partokens/content'
import { localeLabels, locales, resources, type AppLocale } from '@partokens/i18n'
import { InterfaceLanguageMenu, InterfaceThemeMenu } from './interface-tool-menus'
import { homePageCopy, type HomePageCopy, type HomePageTarget } from './public-home-copy'

export type PublicPrototypeScreen =
  | 'home'
  | 'models'
  | 'docs'
  | 'about'
  | 'notices'
  | 'legal-user'
  | 'legal-service'
  | 'legal-privacy'

type PublicTarget = PublicPrototypeScreen | 'signin' | 'console' | HomePageTarget
type Theme = 'light' | 'dark'

type PublicPrototypeProps = {
  screen: PublicPrototypeScreen
  locale: AppLocale
  theme: Theme
  online: boolean | null
  version?: string
  onLocale: (locale: AppLocale) => void
  onTheme: () => void
  go: (target: PublicTarget) => void
}

const requestExample = `curl https://partokens.com/v1/chat/completions \\
  -H "Authorization: Bearer $PARTOKENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-model","messages":[{"role":"user","content":"Hello"}]}'`

const sdkExamples = {
  shell: requestExample,
  javascript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.PARTOKENS_API_KEY,
  baseURL: "https://partokens.com/v1",
});`,
  python: `from openai import OpenAI

client = OpenAI(
    api_key=os.environ["PARTOKENS_API_KEY"],
    base_url="https://partokens.com/v1",
)`,
}

const r3Translations: Record<AppLocale, Record<string, string>> = {
  'zh-CN': {
    Product: '产品', Resources: '资源', Legal: '条款', Contact: '联系', 'Account data': '账户数据', Embeddings: '向量嵌入', Copied: '已复制', Today: '今天', Generate: '生成',
    'Go to console': '前往控制台',
    'Available models depend on live configuration.': '可用模型以服务端实时配置为准。',
    'The server remains authoritative for billing and routing.': '计费与路由结果始终以服务端为准。',
    'Existing API service is unaffected.': '现有 API 服务不受影响。',
    'Versioned notices': '版本化通知',
    'Material changes are published as versioned notices with a new effective date and a readable description of the change.': '重大变更会以版本化通知发布，并提供新的生效日期与清晰的变更说明。',
  },
  'zh-TW': {
    Product: '產品', Resources: '資源', Legal: '條款', Contact: '聯絡', 'Account data': '帳戶資料', Embeddings: '向量嵌入', Copied: '已複製', Today: '今天', Generate: '生成',
    'Go to console': '前往控制台',
    'Available models depend on live configuration.': '可用模型以伺服器即時設定為準。',
    'The server remains authoritative for billing and routing.': '計費與路由結果始終以伺服器為準。',
    'Existing API service is unaffected.': '現有 API 服務不受影響。',
    'Versioned notices': '版本化通知',
    'Material changes are published as versioned notices with a new effective date and a readable description of the change.': '重大變更會以版本化通知發布，並提供新的生效日期與清楚的變更說明。',
  },
  en: {
    Product: 'Product', Resources: 'Resources', Legal: 'Legal', Contact: 'Contact', 'Account data': 'Account data', Embeddings: 'Embeddings', Copied: 'Copied', Today: 'Today', Generate: 'Generate',
    'Go to console': 'Go to console',
    'Available models depend on live configuration.': 'Available models depend on live configuration.',
    'The server remains authoritative for billing and routing.': 'The server remains authoritative for billing and routing.',
    'Existing API service is unaffected.': 'Existing API service is unaffected.',
    'Versioned notices': 'Versioned notices',
    'Material changes are published as versioned notices with a new effective date and a readable description of the change.': 'Material changes are published as versioned notices with a new effective date and a readable description of the change.',
  },
  ja: {
    Product: '製品', Resources: 'リソース', Legal: '法的情報', Contact: 'お問い合わせ', 'Account data': 'アカウントデータ', Embeddings: '埋め込み', Copied: 'コピーしました', Today: '今日', Generate: '生成',
    'Go to console': 'コンソールへ',
    'Available models depend on live configuration.': '利用可能なモデルはサーバーの現在の設定に基づきます。',
    'The server remains authoritative for billing and routing.': '課金とルーティングは常にサーバーの結果が優先されます。',
    'Existing API service is unaffected.': '既存の API サービスには影響しません。',
    'Versioned notices': 'バージョン付き通知',
    'Material changes are published as versioned notices with a new effective date and a readable description of the change.': '重要な変更は、新しい施行日と分かりやすい変更内容を含むバージョン付き通知として公開します。',
  },
  ru: {
    Product: 'Продукт', Resources: 'Ресурсы', Legal: 'Документы', Contact: 'Контакты', 'Account data': 'Данные аккаунта', Embeddings: 'Эмбеддинги', Copied: 'Скопировано', Today: 'Сегодня', Generate: 'Создать',
    'Go to console': 'Перейти в консоль',
    'Available models depend on live configuration.': 'Доступные модели определяются текущей конфигурацией сервера.',
    'The server remains authoritative for billing and routing.': 'Итоговые данные оплаты и маршрутизации определяет сервер.',
    'Existing API service is unaffected.': 'Существующий API продолжает работать без изменений.',
    'Versioned notices': 'Версионные уведомления',
    'Material changes are published as versioned notices with a new effective date and a readable description of the change.': 'Существенные изменения публикуются как версионные уведомления с новой датой вступления и понятным описанием.',
  },
  fr: {
    Product: 'Produit', Resources: 'Ressources', Legal: 'Mentions légales', Contact: 'Contact', 'Account data': 'Données du compte', Embeddings: 'Embeddings', Copied: 'Copié', Today: 'Aujourd’hui', Generate: 'Générer',
    'Go to console': 'Accéder à la console',
    'Available models depend on live configuration.': 'Les modèles disponibles dépendent de la configuration actuelle du serveur.',
    'The server remains authoritative for billing and routing.': 'Le serveur reste la référence pour la facturation et le routage.',
    'Existing API service is unaffected.': 'Le service API existant reste inchangé.',
    'Versioned notices': 'Avis versionnés',
    'Material changes are published as versioned notices with a new effective date and a readable description of the change.': 'Les changements importants sont publiés dans des avis versionnés avec une nouvelle date d’effet et une description claire.',
  },
  vi: {
    Product: 'Sản phẩm', Resources: 'Tài nguyên', Legal: 'Pháp lý', Contact: 'Liên hệ', 'Account data': 'Dữ liệu tài khoản', Embeddings: 'Vector nhúng', Copied: 'Đã sao chép', Today: 'Hôm nay', Generate: 'Tạo',
    'Go to console': 'Mở bảng điều khiển',
    'Available models depend on live configuration.': 'Mô hình khả dụng phụ thuộc vào cấu hình hiện tại của máy chủ.',
    'The server remains authoritative for billing and routing.': 'Máy chủ luôn là nguồn quyết định cho việc tính phí và định tuyến.',
    'Existing API service is unaffected.': 'Dịch vụ API hiện tại không bị ảnh hưởng.',
    'Versioned notices': 'Thông báo theo phiên bản',
    'Material changes are published as versioned notices with a new effective date and a readable description of the change.': 'Các thay đổi quan trọng được công bố bằng thông báo theo phiên bản, kèm ngày hiệu lực mới và mô tả rõ ràng.',
  },
}

function translate(locale: AppLocale, key: string) {
  return r3Translations[locale][key] ?? (resources[locale].translation as Record<string, string>)[key] ?? key
}

function Brand() {
  return <span className="r3-brand"><span><KeyRound size={17} /></span><strong>Partokens</strong></span>
}

function RouteButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="pt-button" data-variant="primary" onClick={onClick}><span>{children}</span><span className="pt-button-endcap"><ArrowRight size={16} /></span></button>
}

function PublicShell({ children, ...props }: PublicPrototypeProps & { children: ReactNode }) {
  const { locale, theme, screen, onLocale, onTheme, go } = props
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const mobileCloseRef = useRef<HTMLButtonElement>(null)
  const t = (key: string) => translate(locale, key)
  const navigate = (target: PublicTarget) => {
    setMobileOpen(false)
    go(target)
  }
  useEffect(() => {
    const body = document.body
    body.classList.add('shadcn-admin-portal', theme)
    return () => body.classList.remove('shadcn-admin-portal', 'light', 'dark')
  }, [theme])

  useEffect(() => {
    if (!mobileOpen) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    mobileCloseRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(mobileNavRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), a[href]') ?? [])
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [mobileOpen])

  return <div className={`r3-public-screen shadcn-admin public-shadcn ${theme}`}>
    <header className={`r3-public-header${screen === 'home' ? ' r37-home-header' : ''}`}>
      <button type="button" className="r3-brand-button" onClick={() => navigate('home')} aria-label="Partokens"><Brand /></button>
      <div className="r3-header-tools">
        <Button type="button" variant="ghost" size="icon" className={`r3-public-tool-button rounded-full${screen === 'notices' ? ' bg-accent text-accent-foreground' : ''}`} aria-label={t('Notices')} title={t('Notices')} onClick={() => navigate('notices')}><Bell /></Button>
        <InterfaceLanguageMenu locale={locale} onLocale={onLocale} t={t} buttonClassName="r3-public-tool-button" />
        <InterfaceThemeMenu theme={theme} onTheme={onTheme} t={t} buttonClassName="r3-public-tool-button" />
        <button type="button" className="r3-console-link" onClick={() => navigate('console')}><span>{t('Go to console')}</span><ArrowRight size={16} /></button>
        <button type="button" className="pt-icon-button r3-mobile-menu-button" aria-label={t('Menu')} title={t('Menu')} onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
      </div>
    </header>

    {mobileOpen ? <div ref={mobileNavRef} className="r3-mobile-nav" role="dialog" aria-modal="true" aria-label={t('Menu')}>
      <header><Brand /><button ref={mobileCloseRef} type="button" className="pt-icon-button" aria-label={t('Close')} title={t('Close')} onClick={() => setMobileOpen(false)}><X size={18} /></button></header>
      <nav><button type="button" aria-current={screen === 'notices' ? 'page' : undefined} onClick={() => navigate('notices')}>{t('Notices')}<ChevronRight size={18} /></button></nav>
      <div className="r3-mobile-nav-footer">
        <label className="r3-locale-control"><Globe2 size={17} /><select value={locale} aria-label={t('Language')} onChange={(event) => onLocale(event.target.value as AppLocale)}>{locales.map((item) => <option value={item} key={item}>{localeLabels[item]}</option>)}</select></label>
        <button type="button" className="pt-icon-button" aria-label={t(theme === 'dark' ? 'Light mode' : 'Dark mode')} title={t(theme === 'dark' ? 'Light mode' : 'Dark mode')} onClick={onTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button type="button" className="r3-console-link" onClick={() => navigate('console')}><span>{t('Go to console')}</span><ArrowRight size={16} /></button>
      </div>
    </div> : null}

    {children}

    <footer className="r3-public-footer">
      <div className="r3-footer-main">
        <div className="r3-footer-brand"><Brand /><p>{getLocaleContent(locale).aboutLead}</p></div>
        <div className="r3-footer-links">
          <div><strong>{t('Product')}</strong><button type="button" onClick={() => navigate('console')}>{t('Playground')}</button><button type="button" onClick={() => navigate('console')}>{t('Image studio')}</button></div>
          <div><strong>{t('Resources')}</strong><button type="button" onClick={() => navigate('notices')}>{t('Notices')}</button><a href="https://partokens.com/api/status" target="_blank" rel="noreferrer">{t('Status')}<ExternalLink size={13} /></a></div>
          <div><strong>{t('Legal')}</strong><button type="button" onClick={() => navigate('legal-user')}>{t('User Agreement')}</button><button type="button" onClick={() => navigate('legal-service')}>{t('Terms of Service')}</button><button type="button" onClick={() => navigate('legal-privacy')}>{t('Privacy Policy')}</button></div>
          <div><strong>{t('Contact')}</strong><a href="mailto:admin@partokens.com">admin@partokens.com</a><a href="https://t.me/PartokensSupportBot" target="_blank" rel="noreferrer">Telegram<ExternalLink size={13} /></a></div>
        </div>
      </div>
      <div className="r3-footer-bottom"><span>© {new Date().getFullYear()} Partokens</span><span>admin@partokens.com</span></div>
    </footer>
  </div>
}

function PageIntro({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="r3-page-intro"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</header>
}

function HomeSectionHeading({ eyebrow, title, body, id }: { eyebrow: string; title: string; body?: string; id?: string }) {
  return <div className="r3-home-section-heading"><span>{eyebrow}</span><h2 id={id}>{title}</h2>{body ? <p>{body}</p> : null}</div>
}

const homeStudioAssets = {
  light: { atlas: '/home/home-studio-atlas-light.webp', detail: '/home/home-studio-detail-light.webp' },
  dark: { atlas: '/home/home-studio-atlas-dark.webp', detail: '/home/home-studio-detail-dark.webp' },
} as const

function HomeThemeImage({ theme, variant, alt, className, eager = false }: { theme: Theme; variant: 'atlas' | 'detail'; alt: string; className?: string; eager?: boolean }) {
  const dimensions = variant === 'atlas' ? { width: 1448, height: 1086 } : { width: 1254, height: 1254 }
  return <img
    className={className}
    src={homeStudioAssets[theme][variant]}
    width={dimensions.width}
    height={dimensions.height}
    alt={alt}
    loading={eager ? 'eager' : 'lazy'}
    fetchPriority={eager ? 'high' : 'auto'}
    decoding="async"
    draggable={false}
  />
}

type HomePreviewMode = 'chat' | 'image' | 'api'

function HomeProductPreview({ locale, theme }: Pick<PublicPrototypeProps, 'locale' | 'theme'>) {
  const copy = homePageCopy[locale]
  const [mode, setMode] = useState<HomePreviewMode>('chat')
  const modes = [
    { id: 'chat' as const, label: copy.preview.tabs.chat, icon: MessageSquare },
    { id: 'image' as const, label: copy.preview.tabs.image, icon: ImageIcon },
    { id: 'api' as const, label: copy.preview.tabs.api, icon: KeyRound },
  ]
  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % modes.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + modes.length) % modes.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = modes.length - 1
    else return
    event.preventDefault()
    const nextMode = modes[nextIndex]!
    setMode(nextMode.id)
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs?.[nextIndex]?.focus()
  }

  return <div className="r3-product-preview r37-product-preview" aria-label={copy.hero.previewLabel}>
    <div className="r37-preview-label"><span>{copy.hero.previewLabel}</span><span aria-hidden="true"><i /><i /><i /></span></div>
    <div className="r3-preview-mobile-tabs" role="tablist" aria-label={copy.preview.workspace}>
      {modes.map(({ id, label, icon: Icon }, index) => <button type="button" key={id} role="tab" aria-label={label} title={label} aria-selected={mode === id} aria-controls="r37-preview-panel" tabIndex={mode === id ? 0 : -1} onKeyDown={(event) => onTabKeyDown(event, index)} onClick={() => setMode(id)}><Icon size={17} /><span>{label}</span></button>)}
    </div>
    <div className="r3-preview-shell">
      <aside>
        <div className="r3-preview-brand"><span><KeyRound size={15} /></span><p><strong>Partokens</strong><small>{copy.preview.developerConsole}</small></p></div>
        <nav role="tablist" aria-label={copy.preview.workspace}>
          <small>{copy.preview.workspace}</small>
          {modes.map(({ id, label, icon: Icon }, index) => <button type="button" key={id} role="tab" aria-selected={mode === id} aria-controls="r37-preview-panel" tabIndex={mode === id ? 0 : -1} onKeyDown={(event) => onTabKeyDown(event, index)} onClick={() => setMode(id)}><Icon size={16} /><span>{label}</span></button>)}
        </nav>
        <div className="r3-preview-account"><span>PT</span><p><strong>Partokens</strong><small>{copy.preview.accountData}</small></p></div>
      </aside>

      <section id="r37-preview-panel" className="r3-preview-panel" role="tabpanel" aria-label={modes.find((item) => item.id === mode)?.label} data-preview={mode} key={mode}>
        {mode === 'chat' ? <>
          <header><div><span>{copy.preview.tabs.chat}</span><strong>{copy.preview.newChat}</strong></div><span><ShieldCheck size={14} />{copy.preview.localHistory}</span></header>
          <div className="r3-preview-messages"><div className="r3-preview-user"><p>{copy.samples.question}</p><CircleUserRound size={22} /></div><div className="r3-preview-assistant"><span><Bot size={16} /></span><p>{copy.samples.answer}</p></div></div>
          <div className="r3-preview-composer"><span>{copy.samples.composer}</span><button type="button" aria-label={copy.preview.sendLabel} title={copy.preview.sendLabel}><Send size={15} /></button></div>
          <small><ShieldCheck size={14} />{copy.preview.localHistory}</small>
        </> : null}

        {mode === 'image' ? <>
          <header><div><span>{copy.preview.workspace}</span><strong>{copy.preview.imageStudio}</strong></div><button type="button" className="r3-preview-generate"><Sparkles size={14} />{copy.preview.generate}</button></header>
          <div className="r3-preview-canvas">
            <article className="r3-preview-prompt"><span><MessageSquare size={13} />{copy.preview.prompt}</span><p>{copy.samples.imagePrompt}</p></article>
            <article className="r3-preview-image"><span><ImageIcon size={13} />{copy.preview.result}</span><HomeThemeImage theme={theme} variant="atlas" alt={copy.samples.studioAlt} eager /></article>
            <article className="r3-preview-image is-secondary" aria-hidden="true"><HomeThemeImage theme={theme} variant="detail" alt="" eager /></article>
            <span className="r3-preview-connector" aria-hidden="true"><i /><ArrowRight size={16} /></span>
            <small aria-hidden="true">− &nbsp; 76% &nbsp; +</small>
          </div>
        </> : null}

        {mode === 'api' ? <>
          <header><div><span>{copy.preview.overview}</span><strong>{copy.preview.apiKeys}</strong></div><span><LockKeyhole size={14} />{copy.preview.signIn}</span></header>
          <div className="r37-preview-api">
            <div className="r3-preview-endpoint"><span><Globe2 size={14} />{copy.preview.baseUrl}</span><code>https://partokens.com/v1</code><CheckCircle2 size={16} /></div>
            <div className="r37-preview-api-list">
              <article><span><Route size={16} /></span><p><strong>{copy.preview.compatibleEndpoint}</strong><small>{copy.preview.compatibleEndpointBody}</small></p></article>
              <article><span><KeyRound size={16} /></span><p><strong>{copy.preview.restrictedKey}</strong><small>{copy.preview.restrictedKeyBody}</small></p></article>
              <article><span><Activity size={16} /></span><p><strong>{copy.preview.traceableUsage}</strong><small>{copy.preview.traceableUsageBody}</small></p></article>
            </div>
          </div>
        </> : null}
      </section>
    </div>
  </div>
}

function HomeFeatureCopy({ item, icon: Icon }: { item: HomePageCopy['workflow']['items'][number]; icon: typeof MessageSquare }) {
  return <div className="r3-home-feature-copy"><span>{item.kicker}</span><h3>{item.title}</h3><p>{item.body}</p><small><Icon size={16} />{item.boundary}</small></div>
}

function HomeChatVisual({ copy }: { copy: HomePageCopy }) {
  return <div className="r3-home-product-frame r3-home-chat-visual">
    <aside><header><strong>{copy.preview.recentChats}</strong><Plus size={16} /></header><small>{copy.preview.today}</small><span className="is-active"><MessageSquare size={15} />{copy.samples.chatTitle}</span><span><MessageSquare size={15} />{copy.samples.chatSecond}</span><footer><ShieldCheck size={14} />{copy.preview.localHistory}</footer></aside>
    <section><header><strong>{copy.samples.chatTitle}</strong><span><ShieldCheck size={14} />{copy.preview.localHistory}</span></header><div><p>{copy.samples.question}</p><span><Bot size={15} /></span><p>{copy.samples.answer}</p></div><footer><span>{copy.samples.composer}</span><Send size={15} /></footer></section>
  </div>
}

function HomeImageVisual({ copy, theme }: { copy: HomePageCopy; theme: Theme }) {
  return <div className="r3-home-product-frame r3-home-image-visual">
    <header><strong><ImageIcon size={17} />{copy.preview.imageStudio}</strong><div><button type="button" aria-label={copy.preview.preferences} title={copy.preview.preferences}><SlidersHorizontal size={15} /></button><span><Sparkles size={15} />{copy.preview.generate}</span></div></header>
    <div><article className="r3-home-prompt-node"><span><MessageSquare size={14} />{copy.preview.prompt}</span><p>{copy.samples.imagePrompt}</p></article><span className="r3-home-canvas-link" aria-hidden="true"><i /><ArrowRight size={18} /></span><article className="r3-home-result-node"><span><ImageIcon size={14} />{copy.preview.result}</span><HomeThemeImage theme={theme} variant="atlas" alt={copy.samples.studioAlt} /></article><article className="r37-home-detail-node" aria-hidden="true"><HomeThemeImage theme={theme} variant="detail" alt="" /></article><small aria-hidden="true">− &nbsp; 78% &nbsp; +</small></div>
  </div>
}

function HomeControlVisual({ copy }: { copy: HomePageCopy }) {
  return <div className="r3-home-product-frame r3-home-control-visual">
    <header><strong><Activity size={17} />{copy.preview.overview}</strong><span><LockKeyhole size={14} />{copy.preview.signIn}</span></header>
    <div className="r37-control-endpoint"><span><Globe2 size={15} />{copy.preview.baseUrl}</span><code>https://partokens.com/v1</code></div>
    <div><article><span><KeyRound size={16} /></span><p><strong>{copy.preview.restrictedKey}</strong><small>{copy.preview.restrictedKeyBody}</small></p><ChevronRight size={16} /></article><article><span><Activity size={16} /></span><p><strong>{copy.preview.traceableUsage}</strong><small>{copy.preview.traceableUsageBody}</small></p><ChevronRight size={16} /></article></div>
  </div>
}

function HomePage({ locale, theme, go }: Pick<PublicPrototypeProps, 'locale' | 'theme' | 'go'>) {
  const copy = homePageCopy[locale]
  const rootRef = useRef<HTMLElement>(null)
  const pathIcons = [MessageSquare, ImageIcon, Code2]
  const workflowIcons = [ShieldCheck, ImageIcon, KeyRound]
  const trustIcons = [Code2, Route, Activity, ShieldCheck, SlidersHorizontal, Languages]
  const useCaseIcons = [FileCheck2, ImageIcon, Network]

  useEffect(() => {
    Object.values(homeStudioAssets).flatMap((assets) => Object.values(assets)).forEach((src) => { const image = new Image(); image.src = src })
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-home-reveal]'))
    const showAll = () => items.forEach((item) => item.classList.add('is-visible'))
    root.classList.add('r37-reveal-ready')
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll()
      return () => root.classList.remove('r37-reveal-ready')
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    items.forEach((item) => observer.observe(item))
    return () => { observer.disconnect(); root.classList.remove('r37-reveal-ready') }
  }, [locale])

  return <main ref={rootRef} className="r3-home-page">
    <section className="r3-home-hero" aria-labelledby="r37-home-title">
      <div className="r3-home-hero-copy"><span>{copy.hero.eyebrow}</span><h1 id="r37-home-title">Partokens</h1><h2>{copy.hero.title}</h2><p>{copy.hero.body}</p><div className="r37-hero-actions"><RouteButton onClick={() => go('console')}>{copy.hero.actions.primary}</RouteButton><button type="button" className="r37-secondary-action" onClick={() => go('docs')}><BookOpen size={17} /><span>{copy.hero.actions.secondary}</span></button></div><ul className="r37-hero-capabilities">{copy.hero.capabilities.map((item) => <li key={item.id}><Check size={14} />{item.label}</li>)}</ul></div>
      <HomeProductPreview locale={locale} theme={theme} />
    </section>

    <section id="work-path" className="r3-home-started" aria-labelledby="r37-started-title">
      <HomeSectionHeading id="r37-started-title" eyebrow={copy.sections.startedEyebrow} title={copy.started.title} body={copy.started.body} />
      <div className="r37-path-list">{copy.started.items.map((item, index) => { const Icon = pathIcons[index] ?? Route; return <button type="button" key={item.id} data-tone={item.tone} aria-label={item.ariaLabel} onClick={() => go(item.target)}><span><Icon size={19} /></span><p><em>0{index + 1}</em><strong>{item.title}</strong><small>{item.body}</small><b>{item.action}</b></p><ArrowRight size={17} /></button> })}</div>
    </section>

    <section className="r3-home-features" aria-labelledby="r37-workflow-title">
      <div data-home-reveal><HomeSectionHeading id="r37-workflow-title" eyebrow={copy.sections.workflowEyebrow} title={copy.workflow.title} body={copy.workflow.body} /></div>
      {copy.workflow.items.map((item, index) => <article key={item.id} className={index % 2 === 1 ? 'is-reversed' : undefined} data-tone={item.tone} data-home-reveal>
        <HomeFeatureCopy item={item} icon={workflowIcons[index] ?? Route} />
        {item.id === 'workflow-chat' ? <HomeChatVisual copy={copy} /> : item.id === 'workflow-image' ? <HomeImageVisual copy={copy} theme={theme} /> : <HomeControlVisual copy={copy} />}
      </article>)}
    </section>

    <section className="r3-home-values" aria-labelledby="r37-trust-title">
      <div data-home-reveal><HomeSectionHeading id="r37-trust-title" eyebrow={copy.sections.trustEyebrow} title={copy.trust.title} body={copy.trust.body} /></div>
      <div data-home-reveal>{copy.trust.items.map((item, index) => { const Icon = trustIcons[index] ?? Route; return <article key={item.id}><span><Icon size={19} /></span><h3>{item.title}</h3><p>{item.body}</p></article> })}</div>
    </section>

    <section className="r37-home-use-cases" aria-labelledby="r37-use-cases-title">
      <div data-home-reveal><HomeSectionHeading id="r37-use-cases-title" eyebrow={copy.sections.useCasesEyebrow} title={copy.useCases.title} body={copy.useCases.body} /></div>
      <div className="r37-use-case-list">{copy.useCases.items.map((item, index) => { const Icon = useCaseIcons[index] ?? Route; return <article key={item.id} data-tone={item.tone} data-home-reveal>{item.id === 'visual-explore' ? <div className="r37-use-case-image"><HomeThemeImage theme={theme} variant="detail" alt={copy.samples.studioAlt} /></div> : <span className="r37-use-case-icon"><Icon size={22} /></span>}<div><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p><button type="button" aria-label={item.ariaLabel} onClick={() => go(item.target)}>{item.action}<ArrowRight size={16} /></button></div></article> })}</div>
    </section>

    <section className="r3-home-faq" aria-labelledby="r37-faq-title">
      <div data-home-reveal><HomeSectionHeading id="r37-faq-title" eyebrow={copy.sections.faqEyebrow} title={copy.faq.title} body={copy.faq.body} /></div>
      <div data-home-reveal>{copy.faq.items.map((item, index) => <details key={item.id} open={index === 0}><summary><span>{item.question}</span><ChevronDown size={19} /></summary><p>{item.answer}</p></details>)}</div>
    </section>
  </main>
}

function ModelsPage({ locale, go }: Pick<PublicPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const endpoints = [
    { icon: MessageSquare, label: t('Chat completions'), path: '/v1/chat/completions', tone: 'lilac' },
    { icon: ImageIcon, label: t('Images'), path: '/v1/images/generations', tone: 'mint' },
    { icon: Network, label: t('Embeddings'), path: '/v1/embeddings', tone: 'coral' },
  ]
  return <main className="r3-page r3-models-page">
    <PageIntro eyebrow={t('Model catalog')} title={t('Models')} description={t('Compare available model routes, capabilities, and billing modes.')}>
      <span className="r3-truth-note"><ShieldCheck size={16} />{t('This deployment requires an account before showing model pricing.')}</span>
    </PageIntro>

    <section className="r3-route-overview" aria-labelledby="route-overview-title">
      <div className="r3-section-copy"><span>API ROUTES</span><h2 id="route-overview-title">{t('Compatible access')}</h2><p>{t('Use the Partokens compatible endpoint in clients that support a custom OpenAI base URL.')}</p><code>https://partokens.com/v1</code></div>
      <div className="r3-endpoint-list">
        {endpoints.map(({ icon: Icon, label, path, tone }) => <article key={path} data-tone={tone}><span><Icon size={18} /></span><div><strong>{label}</strong><code>{path}</code></div><Route size={18} /></article>)}
      </div>
    </section>

    <section className="r3-model-gate">
      <div className="r3-gate-visual" aria-hidden="true">
        <div><span /><span /><span /></div>
        <Route size={22} />
        <div><span /><span /><span /></div>
      </div>
      <div className="r3-gate-copy"><span><LockKeyhole size={15} />{t('Account data')}</span><h2>{t('Sign in to view model pricing')}</h2><p>{t('This deployment requires an account before showing model pricing.')}</p><ul><li><CheckCircle2 size={15} />{t('Available models depend on live configuration.')}</li><li><CheckCircle2 size={15} />{t('Model pricing and multipliers in context.')}</li><li><CheckCircle2 size={15} />{t('The server remains authoritative for billing and routing.')}</li></ul><RouteButton onClick={() => go('signin')}>{t('Sign in')}</RouteButton></div>
    </section>
  </main>
}

function CodeBlock({ code, label, copyLabel, copiedLabel }: { code: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard?.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }
  return <div className="r3-code-block"><header><span>{label}</span><button type="button" className="pt-icon-button" data-size="small" aria-label={copyLabel} title={copyLabel} onClick={() => void copy()}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></header><pre><code>{code}</code></pre><span className="sr-only" role="status">{copied ? copiedLabel : ''}</span></div>
}

function DocsPage({ locale, go }: Pick<PublicPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const [sdk, setSdk] = useState<keyof typeof sdkExamples>('shell')
  const steps = [
    { href: '#base-url', label: t('Base URL') },
    { href: '#authentication', label: t('Authentication') },
    { href: '#first-request', label: t('First request') },
    { href: '#sdk', label: 'SDK' },
    { href: '#reference', label: t('API reference') },
  ]
  return <main className="r3-page r3-docs-page">
    <aside className="r3-docs-index"><span>{t('Quick start')}</span><nav>{steps.map((step, index) => <a key={step.href} href={step.href}><code>0{index + 1}</code>{step.label}</a>)}</nav><button type="button" onClick={() => go('console')}><KeyRound size={16} />{t('Create a key')}<ChevronRight size={15} /></button></aside>
    <article className="r3-docs-article">
      <PageIntro eyebrow="PARTOKENS API" title={t('Docs')} description={t('Start with an API key and one compatible request.')} />
      <section id="base-url" className="r3-docs-section"><span>01</span><div><h2>{t('Base URL')}</h2><p>{t('Use the Partokens compatible endpoint in clients that support a custom OpenAI base URL.')}</p><div className="r3-inline-endpoint"><Globe2 size={16} /><code>https://partokens.com/v1</code></div></div></section>
      <section id="authentication" className="r3-docs-section"><span>02</span><div><h2>{t('Authentication')}</h2><p>{t('Create a scoped API key in the console and send it as a Bearer token.')}</p><button type="button" className="r3-text-link" onClick={() => go('console')}><KeyRound size={15} />{t('Create a key')}<ArrowRight size={14} /></button></div></section>
      <section id="first-request" className="r3-docs-section"><span>03</span><div><h2>{t('First request')}</h2><p>{t('Replace the model name with one available to your account group.')}</p><CodeBlock code={requestExample} label="cURL" copyLabel={t('Copy request')} copiedLabel={t('Copied')} /></div></section>
      <section id="sdk" className="r3-docs-section"><span>04</span><div><h2>SDK</h2><p>{t('Use the OpenAI-compatible endpoint in your CLI or SDK. The full key is never stored in this browser.')}</p><div className="pt-segmented r3-sdk-tabs" aria-label="SDK"><button type="button" aria-pressed={sdk === 'shell'} onClick={() => setSdk('shell')}>Shell</button><button type="button" aria-pressed={sdk === 'javascript'} onClick={() => setSdk('javascript')}>JavaScript</button><button type="button" aria-pressed={sdk === 'python'} onClick={() => setSdk('python')}>Python</button></div><CodeBlock code={sdkExamples[sdk]} label={sdk === 'shell' ? 'cURL' : sdk === 'javascript' ? 'JavaScript' : 'Python'} copyLabel={t('Copy request')} copiedLabel={t('Copied')} /></div></section>
      <section id="reference" className="r3-docs-reference"><TerminalSquare size={22} /><div><h2>{t('Full reference')}</h2><p>{t('API response fields follow the OpenAI-compatible schema for each endpoint.')}</p></div><button type="button" className="pt-button" data-variant="secondary"><BookOpen size={16} />{t('API reference')}</button></section>
    </article>
  </main>
}

function AboutPage({ locale }: Pick<PublicPrototypeProps, 'locale'>) {
  const t = (key: string) => translate(locale, key)
  const content = getLocaleContent(locale)
  const principles = [
    { icon: Route, title: t('Visible state'), body: t('Availability, quota, and billing belong beside the action they affect.') },
    { icon: Code2, title: t('Compatible access'), body: t('Existing clients work through one consistent API boundary.') },
    { icon: ShieldCheck, title: t('Independent UI'), body: t('User experience can evolve without modifying the New API source.') },
  ]
  return <main className="r3-page r3-about-page">
    <PageIntro eyebrow={t('About Partokens')} title={content.aboutTitle} description={content.aboutLead} />
    <section className="r3-about-statement"><span>PARTOKENS / ROUTE</span><p>{content.aboutBody}</p><div aria-hidden="true"><span>Prompt</span><ArrowRight size={18} /><span>Route</span><ArrowRight size={18} /><span>Result</span></div></section>
    <section className="r3-principles">{principles.map(({ icon: Icon, title, body }, index) => <article key={title}><code>0{index + 1}</code><Icon size={21} /><h2>{title}</h2><p>{body}</p></article>)}</section>
    <section className="r3-service-boundary"><div><span>SERVICE BOUNDARY</span><h2>{t('Independent UI')}</h2></div><div><strong>Partokens UI</strong><ArrowRight size={19} /><strong>New API</strong><ArrowRight size={19} /><strong>{t('Provider route')}</strong></div></section>
  </main>
}

function LegalPage({ locale, screen, go }: Pick<PublicPrototypeProps, 'locale' | 'screen' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const kindByScreen: Record<'legal-user' | 'legal-service' | 'legal-privacy', LegalKind> = {
    'legal-user': 'user-agreement',
    'legal-service': 'service-agreement',
    'legal-privacy': 'privacy-policy',
  }
  const kind = kindByScreen[screen as keyof typeof kindByScreen] ?? 'service-agreement'
  const document = getLegalDocument(locale, kind)
  const legalLinks: Array<{ target: PublicPrototypeScreen; kind: LegalKind }> = [
    { target: 'legal-user', kind: 'user-agreement' },
    { target: 'legal-service', kind: 'service-agreement' },
    { target: 'legal-privacy', kind: 'privacy-policy' },
  ]
  return <main className="r3-page r3-legal-layout">
    <aside className="r3-legal-index"><span>{t('Legal')}</span><nav>{legalLinks.map((link) => { const item = getLegalDocument(locale, link.kind); return <button type="button" key={link.kind} aria-current={kind === link.kind ? 'page' : undefined} onClick={() => go(link.target)}><FileText size={16} />{item.title}</button> })}</nav><div><FileCheck2 size={16} /><span>{t('Draft content')}<small>{t('Owner review required')}</small></span></div></aside>
    <article className="r3-legal-document">
      <PageIntro eyebrow={t('Legal draft')} title={document.title} description={document.summary} />
      <div className="r3-legal-meta"><span><FileCheck2 size={15} />{t('Draft content')}</span><span>{t('Effective date')}: <code>{document.effectiveDate}</code></span><span>{t('Owner review required')}</span></div>
      <div className="r3-legal-body">{document.sections.map((section, index) => <section key={section.title}><span>0{index + 1}</span><div><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div>
    </article>
  </main>
}

function NoticesPage({ locale, version }: Pick<PublicPrototypeProps, 'locale' | 'version'>) {
  const t = (key: string) => translate(locale, key)
  const notice = getCurrentNotice(locale)
  return <main className="r3-page r3-notices-page">
    <PageIntro eyebrow="RELEASE NOTES" title={t('Notices')} description={notice.title} />
    <section className="r3-notice-entry">
      <aside><span>CURRENT</span><code>{notice.version}</code><small>{version ? `${t('Status')} / ${version}` : t('Draft content')}</small></aside>
      <article><header><span className="r3-release-badge"><Bell size={15} />R3.1</span><time dateTime="2026-07-20">2026-07-20</time></header><h2>{notice.title}</h2><p>{notice.body}</p><div><span><CheckCircle2 size={16} />{t('Existing API service is unaffected.')}</span><span><ShieldCheck size={16} />{t('User experience can evolve without modifying the New API source.')}</span></div></article>
    </section>
    <section className="r3-notice-policy"><CircleDollarSign size={20} /><div><h2>{t('Versioned notices')}</h2><p>{t('Material changes are published as versioned notices with a new effective date and a readable description of the change.')}</p></div></section>
  </main>
}

export function PublicPrototype(props: PublicPrototypeProps) {
  let page: ReactNode
  if (props.screen === 'home') page = <HomePage locale={props.locale} theme={props.theme} go={props.go} />
  else if (props.screen === 'models') page = <ModelsPage locale={props.locale} go={props.go} />
  else if (props.screen === 'docs') page = <DocsPage locale={props.locale} go={props.go} />
  else if (props.screen === 'about') page = <AboutPage locale={props.locale} />
  else if (props.screen === 'notices') page = <NoticesPage locale={props.locale} version={props.version} />
  else page = <LegalPage locale={props.locale} screen={props.screen} go={props.go} />

  return <PublicShell {...props}>{page}</PublicShell>
}
