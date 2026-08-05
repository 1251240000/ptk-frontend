import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
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
  House,
  Image as ImageIcon,
  Info,
  KeyRound,
  Languages,
  LockKeyhole,
  Menu,
  MessageSquare,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Route,
  Search,
  Send,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'

import {
  Button,
} from '@partokens/design-system/components'
import {
  getCurrentNotice,
  getLegalDocument,
  getLocaleContent,
  completedDocsOrder,
  docsCatalog,
  getDocsDocument,
  getDocsSearchText,
  homePageCopy,
  publicDocsCopy,
  type LegalKind,
  type DocsCodeSample,
  type DocsContentBlock,
  type DocsDocument,
  type DocsItemId,
  type DocsItemTarget,
  type HomePageCopy,
  type HomePageTarget,
} from '@partokens/content/public'
import { localeLabels, locales, resources, type AppLocale } from '@partokens/i18n'
import type { PartokensStatus, PublicPricingModel } from '@partokens/api-client'
import { InterfaceLanguageMenu, InterfaceThemeMenu } from './interface-tool-menus'
import { PartokensMark } from './partokens-mark'
import { isNoticeSeen, markNoticeSeen, subscribeNoticeRead } from './notice-read-state'

export type PublicPrototypeScreen =
  | 'home'
  | 'models'
  | 'docs'
  | 'about'
  | 'notices'
  | 'status'
  | 'legal-user'
  | 'legal-service'
  | 'legal-privacy'

export type PublicTarget = PublicPrototypeScreen | 'signin' | 'console' | HomePageTarget
type Theme = 'light' | 'dark'

type PublicPrototypeProps = {
  screen: PublicPrototypeScreen
  locale: AppLocale
  theme: Theme
  online: boolean | null
  version?: string
  startTime?: number
  statusCheckedAt?: number
  statusChecking?: boolean
  authenticated?: boolean
  pricingModels?: PublicPricingModel[]
  pricingLoading?: boolean
  pricingError?: boolean
  pricingPartial?: boolean
  onPricingRetry?: () => void
  refreshStatus?: () => Promise<{ success: boolean; data?: PartokensStatus }>
  onLocale: (locale: AppLocale) => void
  onTheme: () => void
  go: (target: PublicTarget) => void
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

type StatusPageCopy = {
  eyebrow: string
  title: string
  description: string
  currentStatus: string
  operational: string
  operationalBody: string
  unavailable: string
  unavailableBody: string
  checking: string
  checkingBody: string
  apiService: string
  available: string
  unreachable: string
  checkPending: string
  deployedVersion: string
  startedAt: string
  checkedAt: string
  notAvailable: string
  waiting: string
  refresh: string
  refreshing: string
  scopeTitle: string
  scopeBody: string
}

const statusPageCopy: Record<AppLocale, StatusPageCopy> = {
  'zh-CN': {
    eyebrow: '服务运行状况', title: '服务状态', description: '查看 Partokens API 当前可用性与部署信息。', currentStatus: '当前状态',
    operational: 'API 服务运行正常', operationalBody: '状态接口响应正常，Partokens API 当前可连接。', unavailable: '暂时无法确认服务状态', unavailableBody: '状态检查未成功。请稍后重试；这不代表所有 API 请求都不可用。', checking: '正在检查服务状态', checkingBody: '正在连接 Partokens 状态接口。',
    apiService: 'API 服务', available: '可用', unreachable: '无法确认', checkPending: '检查中', deployedVersion: '部署版本', startedAt: '本次服务启动时间', checkedAt: '最近检查', notAvailable: '暂未返回', waiting: '等待首次检查', refresh: '重新检查', refreshing: '检查中',
    scopeTitle: '状态范围', scopeBody: '此页面只展示状态接口可确认的当前可用性、部署版本和启动时间；接口未提供历史可用率、事故记录或单个模型状态。',
  },
  'zh-TW': {
    eyebrow: '服務運行狀況', title: '服務狀態', description: '查看 Partokens API 目前的可用性與部署資訊。', currentStatus: '目前狀態',
    operational: 'API 服務運行正常', operationalBody: '狀態介面回應正常，Partokens API 目前可連線。', unavailable: '暫時無法確認服務狀態', unavailableBody: '狀態檢查未成功。請稍後重試；這不代表所有 API 請求都無法使用。', checking: '正在檢查服務狀態', checkingBody: '正在連線 Partokens 狀態介面。',
    apiService: 'API 服務', available: '可用', unreachable: '無法確認', checkPending: '檢查中', deployedVersion: '部署版本', startedAt: '本次服務啟動時間', checkedAt: '最近檢查', notAvailable: '暫未回傳', waiting: '等待首次檢查', refresh: '重新檢查', refreshing: '檢查中',
    scopeTitle: '狀態範圍', scopeBody: '此頁面只顯示狀態介面可確認的目前可用性、部署版本與啟動時間；介面未提供歷史可用率、事故記錄或單一模型狀態。',
  },
  en: {
    eyebrow: 'SERVICE HEALTH', title: 'Service status', description: 'Check the current availability and deployment details of the Partokens API.', currentStatus: 'Current status',
    operational: 'API service is operational', operationalBody: 'The status endpoint is responding and the Partokens API is currently reachable.', unavailable: 'Service status cannot be confirmed', unavailableBody: 'The status check did not succeed. Try again later; this does not prove that every API request is unavailable.', checking: 'Checking service status', checkingBody: 'Connecting to the Partokens status endpoint.',
    apiService: 'API service', available: 'Available', unreachable: 'Unconfirmed', checkPending: 'Checking', deployedVersion: 'Deployed version', startedAt: 'Current service start', checkedAt: 'Last checked', notAvailable: 'Not returned', waiting: 'Waiting for first check', refresh: 'Check again', refreshing: 'Checking',
    scopeTitle: 'Status scope', scopeBody: 'This page only reports current availability, deployment version, and start time confirmed by the status endpoint. It does not provide availability history, incident records, or individual model status.',
  },
  ja: {
    eyebrow: 'サービス稼働状況', title: 'サービス状態', description: 'Partokens API の現在の可用性とデプロイ情報を確認します。', currentStatus: '現在の状態',
    operational: 'API サービスは正常に稼働中', operationalBody: 'ステータスエンドポイントが応答しており、Partokens API に接続できます。', unavailable: 'サービス状態を確認できません', unavailableBody: '状態確認に成功しませんでした。時間をおいて再試行してください。すべての API リクエストが利用できないことを示すものではありません。', checking: 'サービス状態を確認中', checkingBody: 'Partokens のステータスエンドポイントに接続しています。',
    apiService: 'API サービス', available: '利用可能', unreachable: '未確認', checkPending: '確認中', deployedVersion: 'デプロイ版', startedAt: '現在のサービス起動時刻', checkedAt: '最終確認', notAvailable: '未取得', waiting: '初回確認待ち', refresh: '再確認', refreshing: '確認中',
    scopeTitle: '状態の範囲', scopeBody: 'このページには、ステータスエンドポイントで確認できる現在の可用性、デプロイ版、起動時刻のみを表示します。可用性履歴、障害記録、個別モデルの状態は提供されません。',
  },
  ru: {
    eyebrow: 'СОСТОЯНИЕ СЕРВИСА', title: 'Статус сервиса', description: 'Проверьте текущую доступность и данные развертывания API Partokens.', currentStatus: 'Текущее состояние',
    operational: 'API работает нормально', operationalBody: 'Эндпоинт статуса отвечает, API Partokens сейчас доступен.', unavailable: 'Не удалось подтвердить состояние', unavailableBody: 'Проверка статуса не выполнена. Повторите попытку позже; это не означает, что недоступны все API-запросы.', checking: 'Проверяем состояние сервиса', checkingBody: 'Подключаемся к эндпоинту статуса Partokens.',
    apiService: 'API-сервис', available: 'Доступен', unreachable: 'Не подтверждено', checkPending: 'Проверка', deployedVersion: 'Версия развертывания', startedAt: 'Текущий запуск сервиса', checkedAt: 'Последняя проверка', notAvailable: 'Нет данных', waiting: 'Ожидание первой проверки', refresh: 'Проверить снова', refreshing: 'Проверка',
    scopeTitle: 'Границы статуса', scopeBody: 'Страница показывает только текущую доступность, версию развертывания и время запуска, подтвержденные эндпоинтом статуса. История доступности, инциденты и состояние отдельных моделей не предоставляются.',
  },
  fr: {
    eyebrow: 'ÉTAT DU SERVICE', title: 'État du service', description: 'Consultez la disponibilité actuelle et les informations de déploiement de l’API Partokens.', currentStatus: 'État actuel',
    operational: 'Le service API fonctionne normalement', operationalBody: 'Le point d’état répond et l’API Partokens est actuellement accessible.', unavailable: 'Impossible de confirmer l’état du service', unavailableBody: 'La vérification n’a pas abouti. Réessayez plus tard ; cela ne signifie pas que toutes les requêtes API sont indisponibles.', checking: 'Vérification de l’état du service', checkingBody: 'Connexion au point d’état Partokens.',
    apiService: 'Service API', available: 'Disponible', unreachable: 'Non confirmé', checkPending: 'Vérification', deployedVersion: 'Version déployée', startedAt: 'Démarrage actuel du service', checkedAt: 'Dernière vérification', notAvailable: 'Non communiqué', waiting: 'En attente de la première vérification', refresh: 'Vérifier à nouveau', refreshing: 'Vérification',
    scopeTitle: 'Périmètre de l’état', scopeBody: 'Cette page affiche uniquement la disponibilité actuelle, la version déployée et l’heure de démarrage confirmées par le point d’état. Elle ne fournit ni historique de disponibilité, ni incidents, ni état de chaque modèle.',
  },
  vi: {
    eyebrow: 'TÌNH TRẠNG DỊCH VỤ', title: 'Trạng thái dịch vụ', description: 'Kiểm tra khả năng truy cập hiện tại và thông tin triển khai của API Partokens.', currentStatus: 'Trạng thái hiện tại',
    operational: 'Dịch vụ API đang hoạt động', operationalBody: 'Endpoint trạng thái đang phản hồi và API Partokens hiện có thể truy cập.', unavailable: 'Chưa thể xác nhận trạng thái dịch vụ', unavailableBody: 'Lần kiểm tra trạng thái không thành công. Hãy thử lại sau; điều này không có nghĩa là mọi yêu cầu API đều không khả dụng.', checking: 'Đang kiểm tra trạng thái dịch vụ', checkingBody: 'Đang kết nối đến endpoint trạng thái Partokens.',
    apiService: 'Dịch vụ API', available: 'Khả dụng', unreachable: 'Chưa xác nhận', checkPending: 'Đang kiểm tra', deployedVersion: 'Phiên bản triển khai', startedAt: 'Lần khởi động dịch vụ hiện tại', checkedAt: 'Kiểm tra gần nhất', notAvailable: 'Chưa có dữ liệu', waiting: 'Đang chờ lần kiểm tra đầu tiên', refresh: 'Kiểm tra lại', refreshing: 'Đang kiểm tra',
    scopeTitle: 'Phạm vi trạng thái', scopeBody: 'Trang này chỉ hiển thị khả năng truy cập hiện tại, phiên bản triển khai và thời gian khởi động được endpoint trạng thái xác nhận. Trang không cung cấp lịch sử khả dụng, sự cố hoặc trạng thái từng mô hình.',
  },
}

function translate(locale: AppLocale, key: string) {
  return r3Translations[locale][key] ?? (resources[locale].translation as Record<string, string>)[key] ?? key
}

function Brand() {
  return <span className="r3-brand"><span><PartokensMark size={17} /></span><strong>Partokens</strong></span>
}

function RouteButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="pt-button" data-variant="primary" onClick={onClick}><span>{children}</span><span className="pt-button-endcap"><ArrowRight size={16} /></span></button>
}

function PublicShell({ children, ...props }: PublicPrototypeProps & { children: ReactNode }) {
  const { locale, theme, screen, onLocale, onTheme, go } = props
  const [mobileOpen, setMobileOpen] = useState(false)
  const notice = getCurrentNotice(locale)
  const [noticeUnread, setNoticeUnread] = useState(() => !isNoticeSeen(notice))
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const mobileCloseRef = useRef<HTMLButtonElement>(null)
  const t = (key: string) => translate(locale, key)
  const navigate = (target: PublicTarget) => {
    if (target === 'notices') markNoticeSeen(notice)
    setMobileOpen(false)
    go(target)
  }
  useEffect(() => {
    const update = () => setNoticeUnread(!isNoticeSeen(notice))
    update()
    return subscribeNoticeRead(update)
  }, [notice.id, notice.version])
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
        <Button type="button" variant="ghost" size="icon" className={`r3-public-tool-button rounded-full${screen === 'notices' ? ' bg-accent text-accent-foreground' : ''}`} aria-label={t('Notices')} title={t('Notices')} onClick={() => navigate('notices')}><Bell />{noticeUnread ? <span className="r3-notice-dot" aria-hidden="true" /> : null}</Button>
        <Button type="button" variant="ghost" size="icon" className={`r3-public-tool-button rounded-full${screen === 'docs' ? ' bg-accent text-accent-foreground' : ''}`} aria-label={t('Docs')} title={t('Docs')} onClick={() => navigate('docs')}><BookOpen /></Button>
        <InterfaceLanguageMenu locale={locale} onLocale={onLocale} t={t} buttonClassName="r3-public-tool-button" />
        <InterfaceThemeMenu theme={theme} onTheme={onTheme} t={t} buttonClassName="r3-public-tool-button" />
        <button type="button" className="r3-console-link" onClick={() => navigate('console')}><span>{t('Go to console')}</span><ArrowRight size={16} /></button>
        <button type="button" className="pt-icon-button r3-mobile-menu-button" aria-label={t('Menu')} title={t('Menu')} onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
      </div>
    </header>

    {mobileOpen ? <div ref={mobileNavRef} className="r3-mobile-nav" role="dialog" aria-modal="true" aria-label={t('Menu')}>
      <header><Brand /><button ref={mobileCloseRef} type="button" className="pt-icon-button" aria-label={t('Close')} title={t('Close')} onClick={() => setMobileOpen(false)}><X size={18} /></button></header>
      <nav><button type="button" aria-current={screen === 'notices' ? 'page' : undefined} onClick={() => navigate('notices')}>{t('Notices')}<ChevronRight size={18} /></button><button type="button" aria-current={screen === 'docs' ? 'page' : undefined} onClick={() => navigate('docs')}>{t('Docs')}<ChevronRight size={18} /></button></nav>
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
          <div><strong>{t('Resources')}</strong><button type="button" onClick={() => navigate('notices')}>{t('Notices')}</button><button type="button" onClick={() => navigate('status')}>{t('Status')}</button></div>
          <div><strong>{t('Legal')}</strong><button type="button" onClick={() => navigate('legal-user')}>{t('User Agreement')}</button><button type="button" onClick={() => navigate('legal-service')}>{t('Terms of Service')}</button><button type="button" onClick={() => navigate('legal-privacy')}>{t('Privacy Policy')}</button></div>
          <div><strong>{t('Contact')}</strong><a href="mailto:support@partokens.com">Email</a><a href="https://t.me/PartokensSupportBot" target="_blank" rel="noreferrer">Telegram<ExternalLink size={13} /></a></div>
        </div>
      </div>
      <div className="r3-footer-bottom"><span>© {new Date().getFullYear()} Partokens</span></div>
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

const homeHeroAssets = {
  light: '/home/home-hero-routing-light.avif',
  dark: '/home/home-hero-routing-dark.avif',
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
        <div className="r3-preview-brand"><span><PartokensMark size={15} /></span><p><strong>Partokens</strong><small>{copy.preview.developerConsole}</small></p></div>
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
    const sources = [
      ...Object.values(homeHeroAssets),
      ...Object.values(homeStudioAssets).flatMap((assets) => Object.values(assets)),
    ]
    sources.forEach((src) => { const image = new Image(); image.src = src })
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
      <img className="r37-hero-background" src={homeHeroAssets[theme]} width={3840} height={2160} alt="" aria-hidden="true" fetchPriority="high" />
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

function ModelsPage({ locale, go, authenticated, pricingModels = [], pricingLoading = false, pricingError = false, pricingPartial = false, onPricingRetry }: Pick<PublicPrototypeProps, 'locale' | 'go' | 'authenticated' | 'pricingModels' | 'pricingLoading' | 'pricingError' | 'pricingPartial' | 'onPricingRetry'>) {
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

    {!authenticated ? <section className="r3-model-gate">
      <div className="r3-gate-visual" aria-hidden="true">
        <div><span /><span /><span /></div>
        <Route size={22} />
        <div><span /><span /><span /></div>
      </div>
      <div className="r3-gate-copy"><span><LockKeyhole size={15} />{t('Account data')}</span><h2>{t('Sign in to view model pricing')}</h2><p>{t('This deployment requires an account before showing model pricing.')}</p><ul><li><CheckCircle2 size={15} />{t('Available models depend on live configuration.')}</li><li><CheckCircle2 size={15} />{t('Model pricing and multipliers in context.')}</li><li><CheckCircle2 size={15} />{t('The server remains authoritative for billing and routing.')}</li></ul><RouteButton onClick={() => go('signin')}>{t('Sign in')}</RouteButton></div>
    </section> : <section className="r3-model-catalog" aria-live="polite">
      {pricingLoading ? <div className="r3-public-state" role="status"><Activity className="is-spinning" size={18} />{t('Loading model pricing')}</div> : pricingError ? <div className="r3-public-state" role="alert"><AlertTriangle size={18} /><span>{t('Model pricing is unavailable')}</span><button type="button" className="pt-button" data-variant="secondary" onClick={onPricingRetry}>{t('Try again')}</button></div> : pricingModels.length === 0 ? <div className="r3-public-state" role="status"><Info size={18} />{t('No models are available for this account.')}</div> : <>
        {pricingPartial ? <p className="r3-public-partial" role="status"><Info size={15} />{t('Some model records were incomplete. Only validated fields are shown.')}</p> : null}
        <div className="r3-model-list">{pricingModels.map((model) => <article className="r3-model-row" key={model.model_name}>
          <span className="r3-model-row-icon"><Route size={18} /></span><div><h2>{model.model_name}</h2><p>{model.vendor_name || t('Provider route')}</p></div>
          <div><small>{t('Billing')}</small><strong>{model.quota_type === undefined ? t('Not returned') : model.quota_type === 1 ? t('Per call') : t('Token based')}</strong></div>
          <div><small>{t('Ratio')}</small><strong>{model.model_ratio ?? model.model_price ?? t('Not returned')}</strong></div>
          <div><small>{t('Endpoints')}</small><strong>{model.supported_endpoint_types?.join(', ') || t('Not returned')}</strong></div>
        </article>)}</div>
      </>}
    </section>}
  </main>
}

function CodeBlock({ code, label, copyLabel, copiedLabel }: { code: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code)
    else {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }
  return <div className="r3-code-block"><header><span>{label}</span><button type="button" className="pt-icon-button" data-size="small" aria-label={copyLabel} title={copyLabel} onClick={() => void copy()}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></header><pre><code>{code}</code></pre><span className="sr-only" role="status">{copied ? copiedLabel : ''}</span></div>
}

type DocsDetailLabels = {
  prerequisites: string
  onThisPage: string
  previous: string
  next: string
  copyCode: string
  copied: string
  directory: string
  fallback: string
  pendingTitle: string
  pendingSummary: string
  pendingBody: string
}

const docsDetailLabels: Record<AppLocale, DocsDetailLabels> = {
  'zh-CN': { prerequisites: '前置条件', onThisPage: '本页内容', previous: '上一篇', next: '下一篇', copyCode: '复制代码', copied: '已复制', directory: '文档目录', fallback: '本页正文暂未翻译，当前显示简体中文版本。', pendingTitle: '内容待补充', pendingSummary: '该主题已经进入文档目录，详细内容将在后续批次补充。', pendingBody: '本页尚未发布可执行说明。具体能力、配置和限制仍需产品或后端确认，请勿将此占位页视为功能承诺。' },
  'zh-TW': { prerequisites: '前置條件', onThisPage: '本頁內容', previous: '上一篇', next: '下一篇', copyCode: '複製程式碼', copied: '已複製', directory: '文件目錄', fallback: '本頁正文暫未翻譯，目前顯示簡體中文版本。', pendingTitle: '內容待補充', pendingSummary: '此主題已加入文件目錄，詳細內容會在後續批次補充。', pendingBody: '本頁尚未發布可執行說明。具體能力、設定與限制仍需產品或後端確認。' },
  en: { prerequisites: 'Prerequisites', onThisPage: 'On this page', previous: 'Previous', next: 'Next', copyCode: 'Copy code', copied: 'Copied', directory: 'Documentation index', fallback: 'This article is not translated yet. The Simplified Chinese source is shown below.', pendingTitle: 'Content pending', pendingSummary: 'This topic is in the documentation index and will be completed in a later batch.', pendingBody: 'No implementation guidance is published here yet. Product or backend confirmation is still required.' },
  ja: { prerequisites: '前提条件', onThisPage: 'このページ', previous: '前へ', next: '次へ', copyCode: 'コードをコピー', copied: 'コピーしました', directory: 'ドキュメント一覧', fallback: 'この記事は未翻訳のため、簡体字中国語の原文を表示しています。', pendingTitle: '内容は準備中です', pendingSummary: 'このトピックはドキュメント一覧に追加済みで、今後の更新で完成します。', pendingBody: '実装ガイドはまだ公開されていません。製品またはバックエンドの確認が必要です。' },
  ru: { prerequisites: 'Предварительные условия', onThisPage: 'На этой странице', previous: 'Назад', next: 'Далее', copyCode: 'Копировать код', copied: 'Скопировано', directory: 'Содержание документации', fallback: 'Перевод пока недоступен. Ниже показана версия на упрощенном китайском.', pendingTitle: 'Материал готовится', pendingSummary: 'Тема добавлена в документацию и будет дополнена в следующей редакции.', pendingBody: 'Инструкции еще не опубликованы. Требуется подтверждение продукта или бэкенда.' },
  fr: { prerequisites: 'Prérequis', onThisPage: 'Sur cette page', previous: 'Précédent', next: 'Suivant', copyCode: 'Copier le code', copied: 'Copié', directory: 'Sommaire', fallback: 'Cet article n’est pas encore traduit. La version source en chinois simplifié est affichée.', pendingTitle: 'Contenu à venir', pendingSummary: 'Ce sujet figure dans la documentation et sera complété lors d’une prochaine édition.', pendingBody: 'Aucune procédure n’est encore publiée. Une confirmation produit ou backend reste nécessaire.' },
  vi: { prerequisites: 'Điều kiện tiên quyết', onThisPage: 'Trong trang này', previous: 'Trước', next: 'Tiếp', copyCode: 'Sao chép mã', copied: 'Đã sao chép', directory: 'Mục lục tài liệu', fallback: 'Bài viết chưa được dịch. Phiên bản tiếng Trung giản thể được hiển thị bên dưới.', pendingTitle: 'Nội dung đang hoàn thiện', pendingSummary: 'Chủ đề đã có trong mục lục và sẽ được hoàn thiện ở đợt sau.', pendingBody: 'Hướng dẫn triển khai chưa được xuất bản. Vẫn cần xác nhận từ sản phẩm hoặc backend.' },
}

const docsItems = docsCatalog.flatMap((group) => group.items)
const docsItemIds = docsItems.map((item) => item.id)

function docsItemFromHash(): DocsItemId {
  const [root, item] = window.location.hash.replace(/^#/, '').split('/')
  if (root === 'docs' && docsItemIds.includes(item as DocsItemId)) return item as DocsItemId
  return 'welcome'
}

function DocsInlineText({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, index) => part.startsWith('`') && part.endsWith('`') ? <code key={`${part}-${index}`}>{part.slice(1, -1)}</code> : part)}</>
}

function DocsCodeSamples({ samples, labels }: { samples: DocsCodeSample[]; labels: DocsDetailLabels }) {
  const [language, setLanguage] = useState(samples[0]?.language ?? 'shell')
  const selected = samples.find((sample) => sample.language === language) ?? samples[0]
  if (!selected) return null
  return <div className="r3-docs-code-samples">
    {samples.length > 1 ? <div className="pt-segmented r3-sdk-tabs" aria-label="Code language">{samples.map((sample) => <button type="button" key={sample.language} aria-pressed={selected.language === sample.language} onClick={() => setLanguage(sample.language)}>{sample.language === 'shell' ? 'Shell' : sample.language === 'javascript' ? 'JavaScript' : 'Python'}</button>)}</div> : null}
    <CodeBlock code={selected.code} label={selected.label} copyLabel={`${labels.copyCode}: ${selected.label}`} copiedLabel={labels.copied} />
  </div>
}

function DocsContent({ block, labels }: { block: DocsContentBlock; labels: DocsDetailLabels }) {
  if (block.type === 'paragraph') return <p className="r3-docs-paragraph"><DocsInlineText text={block.text} /></p>
  if (block.type === 'list') {
    const List = block.ordered ? 'ol' : 'ul'
    return <List className="r3-docs-list">{block.items.map((item) => <li key={item}><DocsInlineText text={item} /></li>)}</List>
  }
  if (block.type === 'steps') return <ol className="r3-docs-steps">{block.items.map((item, index) => <li key={item.title}><code>{String(index + 1).padStart(2, '0')}</code><div><strong>{item.title}</strong><p><DocsInlineText text={item.body} /></p></div></li>)}</ol>
  if (block.type === 'callout') {
    const Icon = block.tone === 'warning' ? AlertTriangle : block.tone === 'success' ? CheckCircle2 : Info
    return <aside className="r3-docs-callout" data-tone={block.tone}><Icon size={19} /><div><strong>{block.title}</strong><p><DocsInlineText text={block.body} /></p></div></aside>
  }
  if (block.type === 'endpoint') return <div className="r3-docs-detail-endpoint"><span>{block.method ? <code>{block.method}</code> : <Globe2 size={16} />}{block.label}</span><code>{block.path}</code><CheckCircle2 size={16} /></div>
  if (block.type === 'links') return <div className="r3-docs-links">{block.items.map((item) => {
    const external = item.href.startsWith('https://')
    return <a key={item.href} href={item.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}><span>{item.label}</span><code>{item.href.replace(/^mailto:/, '')}</code>{external ? <ExternalLink size={15} /> : <MessageSquare size={15} />}</a>
  })}</div>
  if (block.type === 'code-samples') return <DocsCodeSamples samples={block.samples} labels={labels} />
  if (block.type === 'table') return <div className="r3-docs-table-wrap"><table><thead><tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}><DocsInlineText text={cell} /></td>)}</tr>)}</tbody></table></div>
  return <div className="r3-docs-faq-list">{block.items.map((item, index) => <details key={item.question} open={index === 0}><summary><span>{item.question}</span><ChevronDown size={18} /></summary><p><DocsInlineText text={item.answer} /></p></details>)}</div>
}

function DocsPage({ locale, go }: Pick<PublicPrototypeProps, 'locale' | 'go'>) {
  const t = (key: string) => translate(locale, key)
  const copy = publicDocsCopy[locale]
  const labels = docsDetailLabels[locale]
  const [query, setQuery] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<DocsItemId>(docsItemFromHash)
  const [activeSection, setActiveSection] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const sourceDocument = getDocsDocument(activeItem)
  const documentContent = useMemo<DocsDocument>(() => sourceDocument ?? {
    id: activeItem,
    summary: labels.pendingSummary,
    sections: [{ id: 'pending', title: labels.pendingTitle, blocks: [{ type: 'callout', tone: 'warning', title: labels.pendingTitle, body: labels.pendingBody }] }],
  }, [activeItem, labels, sourceDocument])
  const activeGroup = docsCatalog.find((group) => group.items.some((item) => item.id === activeItem))
  const navigationOrder = completedDocsOrder.includes(activeItem) ? completedDocsOrder : docsItemIds
  const navigationIndex = navigationOrder.indexOf(activeItem)
  const previousItem = navigationIndex > 0 ? navigationOrder[navigationIndex - 1] : undefined
  const nextItem = navigationIndex >= 0 ? navigationOrder[navigationIndex + 1] : undefined

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale)
    if (!normalized) return docsCatalog
    return docsCatalog.map((group) => ({
      ...group,
      items: group.items.filter((item) => `${copy.items[item.id]} ${getDocsSearchText(item.id)}`.toLocaleLowerCase(locale).includes(normalized)),
    })).filter((group) => group.items.length > 0 || copy.groups[group.id].title.toLocaleLowerCase(locale).includes(normalized))
  }, [copy, locale, query])

  const scrollToSection = (section: string) => {
    document.getElementById(`docs-section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(section)
  }

  const openDocument = (id: DocsItemId) => {
    setActiveItem(id)
    setActiveSection('')
    setQuery('')
    setMobileNavOpen(false)
    window.location.hash = `docs/${id}`
    window.scrollTo({ top: 0 })
  }

  const openItem = (target: DocsItemTarget) => openDocument(target.document)

  useEffect(() => {
    const onHashChange = () => {
      setActiveItem(docsItemFromHash())
      setActiveSection('')
      setMobileNavOpen(false)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const firstSection = documentContent.sections[0]?.id ?? ''
    setActiveSection(firstSection)
    const sections = documentContent.sections
      .map((section) => document.getElementById(`docs-section-${section.id}`))
      .filter((element): element is HTMLElement => element !== null)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActiveSection(visible.target.id.replace('docs-section-', ''))
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [documentContent])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setMobileNavOpen(true)
        window.requestAnimationFrame(() => searchRef.current?.focus())
      } else if (event.key === 'Escape') {
        setMobileNavOpen(false)
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return <main className="r3-page r3-docs-page">
    <button type="button" className="r3-docs-mobile-trigger" aria-label={mobileNavOpen ? copy.closeNavigation : copy.mobileNavigation} title={mobileNavOpen ? copy.closeNavigation : copy.mobileNavigation} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>{mobileNavOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}<span>{labels.directory}</span></button>

    <aside className="r3-docs-index" data-open={mobileNavOpen} aria-label={copy.mobileNavigation}>
      <div className="r3-docs-index-head"><span>{copy.eyebrow}</span><button type="button" aria-label={copy.closeNavigation} title={copy.closeNavigation} onClick={() => setMobileNavOpen(false)}><PanelLeftClose size={17} /></button></div>
      <label className="r3-docs-search"><Search size={16} /><span className="sr-only">{copy.searchLabel}</span><input ref={searchRef} type="search" value={query} placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} onChange={(event) => setQuery(event.target.value)} />{query ? <button type="button" aria-label={copy.clearSearch} title={copy.clearSearch} onClick={() => { setQuery(''); searchRef.current?.focus() }}><X size={14} /></button> : null}</label>
      <nav className="r3-docs-utility" aria-label={copy.eyebrow}>
        <button type="button" onClick={() => go('home')}><House size={15} />{copy.home}</button>
        <button type="button" onClick={() => go('console')}><Route size={15} />{copy.console}</button>
        <a href="mailto:support@partokens.com"><MessageSquare size={15} />{copy.contactSupport}</a>
      </nav>
      <nav className="r3-docs-tree" aria-label={t('Docs')}>
        {filteredCatalog.map((group) => <section key={group.id}>
          <h2>{copy.groups[group.id].title}</h2>
          {group.items.map((item) => <button type="button" key={item.id} aria-current={activeItem === item.id ? 'page' : undefined} onClick={() => openItem(item.target)}>{copy.items[item.id]}</button>)}
        </section>)}
        {filteredCatalog.length === 0 ? <p className="r3-docs-empty"><Search size={16} />{copy.noResults}</p> : null}
      </nav>
    </aside>

    <article className="r3-docs-article" key={activeItem}>
      <header className="r3-docs-hero">
        <span>{activeGroup ? copy.groups[activeGroup.id].title : copy.eyebrow}</span>
        <h1>{copy.items[activeItem]}</h1>
        <p>{documentContent.summary}</p>
        {documentContent.prerequisites?.length ? <div className="r3-docs-prerequisites"><strong><FileCheck2 size={16} />{labels.prerequisites}</strong><ul>{documentContent.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
      </header>

      {locale !== 'zh-CN' && sourceDocument ? <aside className="r3-docs-language-fallback"><Languages size={17} /><p>{labels.fallback}</p></aside> : null}

      <div className="r3-docs-detail-body">{documentContent.sections.map((section) => <section id={`docs-section-${section.id}`} key={section.id} data-doc-section><h2>{section.title}</h2><div>{section.blocks.map((block, index) => <DocsContent key={`${section.id}-${block.type}-${index}`} block={block} labels={labels} />)}</div></section>)}</div>

      <nav className="r3-docs-pagination" aria-label={`${labels.previous} / ${labels.next}`}>
        {previousItem ? <button type="button" data-direction="previous" onClick={() => openDocument(previousItem)}><ChevronRight size={17} /><span><small>{labels.previous}</small><strong>{copy.items[previousItem]}</strong></span></button> : <span />}
        {nextItem ? <button type="button" data-direction="next" onClick={() => openDocument(nextItem)}><span><small>{labels.next}</small><strong>{copy.items[nextItem]}</strong></span><ChevronRight size={17} /></button> : <span />}
      </nav>
    </article>

    <aside className="r3-docs-toc" aria-label={labels.onThisPage}>
      <span>{labels.onThisPage}</span>
      {documentContent.sections.map((section) => <button type="button" key={section.id} aria-current={activeSection === section.id ? 'location' : undefined} onClick={() => scrollToSection(section.id)}>{section.title}</button>)}
    </aside>
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
    <aside className="r3-legal-index"><span>{t('Legal')}</span><nav>{legalLinks.map((link) => { const item = getLegalDocument(locale, link.kind); return <button type="button" key={link.kind} aria-current={kind === link.kind ? 'page' : undefined} onClick={() => go(link.target)}><FileText size={16} />{item.title}</button> })}</nav></aside>
    <article className="r3-legal-document">
      <PageIntro eyebrow={t('Legal')} title={document.title} description={document.summary} />
      <div className="r3-legal-meta"><span><FileCheck2 size={15} />{document.reviewState === 'reviewed' ? t('Reviewed content') : t('Draft content')}</span><span>{t('Effective date')}: <time dateTime={document.effectiveDate}>{document.effectiveDate}</time></span>{document.reviewState === 'draft' ? <span>{t('Owner review required')}</span> : null}</div>
      <div className="r3-legal-body">{document.sections.map((section, index) => <section key={section.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div>
    </article>
  </main>
}

function NoticesPage({ locale, version }: Pick<PublicPrototypeProps, 'locale' | 'version'>) {
  const t = (key: string) => translate(locale, key)
  const notice = getCurrentNotice(locale)
  useEffect(() => markNoticeSeen(notice), [notice.id, notice.version])
  return <main className="r3-page r3-notices-page">
    <PageIntro eyebrow="RELEASE NOTES" title={t('Notices')} description={notice.title} />
    <section className="r3-notice-entry">
      <aside><span>CURRENT</span><code>{notice.version}</code><small>{version ? `${t('Status')} / ${version}` : t('Draft content')}</small></aside>
      <article><header><span className="r3-release-badge"><Bell size={15} />R3.1</span><time dateTime="2026-07-20">2026-07-20</time></header><h2>{notice.title}</h2><p>{notice.body}</p><div><span><CheckCircle2 size={16} />{t('Existing API service is unaffected.')}</span><span><ShieldCheck size={16} />{t('User experience can evolve without modifying the New API source.')}</span></div></article>
    </section>
    <section className="r3-notice-policy"><CircleDollarSign size={20} /><div><h2>{t('Versioned notices')}</h2><p>{t('Material changes are published as versioned notices with a new effective date and a readable description of the change.')}</p></div></section>
  </main>
}

type ServiceState = 'checking' | 'available' | 'unavailable'

function StatusPage({ locale, online, version, startTime, statusCheckedAt, statusChecking, refreshStatus }: Pick<PublicPrototypeProps, 'locale' | 'online' | 'version' | 'startTime' | 'statusCheckedAt' | 'statusChecking' | 'refreshStatus'>) {
  const copy = statusPageCopy[locale]
  const [state, setState] = useState<ServiceState>(online === null ? 'checking' : online ? 'available' : 'unavailable')
  const [serviceVersion, setServiceVersion] = useState(version)
  const [startedAt, setStartedAt] = useState<Date | null>(() => typeof startTime === 'number' ? new Date(startTime * 1000) : null)
  const [checkedAt, setCheckedAt] = useState<Date | null>(() => statusCheckedAt ? new Date(statusCheckedAt) : null)
  const [checking, setChecking] = useState(false)

  const formatDate = (value: Date | null, fallback: string) => value
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' }).format(value)
    : fallback

  const checkStatus = async () => {
    setChecking(true)
    try {
      if (!refreshStatus) throw new Error('Status refresh is unavailable')
      const body = await refreshStatus()
      if (!body.success) throw new Error('Status endpoint did not confirm availability')
      setState('available')
      setServiceVersion(body.data?.version)
      setStartedAt(typeof body.data?.start_time === 'number' ? new Date(body.data.start_time * 1000) : null)
    } catch {
      setState('unavailable')
    } finally {
      setCheckedAt(new Date())
      setChecking(false)
    }
  }

  useEffect(() => {
    setState(online === null ? 'checking' : online ? 'available' : 'unavailable')
    setServiceVersion(version)
    setStartedAt(typeof startTime === 'number' ? new Date(startTime * 1000) : null)
    if (statusCheckedAt) setCheckedAt(new Date(statusCheckedAt))
  }, [online, startTime, statusCheckedAt, version])

  const stateCopy = state === 'available'
    ? { label: copy.operational, body: copy.operationalBody, value: copy.available }
    : state === 'unavailable'
      ? { label: copy.unavailable, body: copy.unavailableBody, value: copy.unreachable }
      : { label: copy.checking, body: copy.checkingBody, value: copy.checkPending }
  const StateIcon = state === 'available' ? CheckCircle2 : state === 'unavailable' ? AlertTriangle : Activity

  return <main className="r3-page r3-status-page">
    <PageIntro eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
      <span className="r3-status-pill" data-state={state} role="status"><i />{stateCopy.value}</span>
    </PageIntro>
    <section className="r3-status-overview" aria-labelledby="service-status-title">
      <article className="r3-status-current" aria-live="polite">
        <span data-state={state}><StateIcon size={22} /></span>
        <div><small>{copy.currentStatus}</small><h2 id="service-status-title">{stateCopy.label}</h2><p>{stateCopy.body}</p></div>
        <button type="button" className="pt-button r3-status-refresh" data-variant="secondary" disabled={checking || statusChecking} onClick={() => void checkStatus()}><RefreshCw className={checking || statusChecking ? 'is-spinning' : ''} size={16} />{checking || statusChecking ? copy.refreshing : copy.refresh}</button>
      </article>
      <dl className="r3-status-facts">
        <div><dt><Server size={15} />{copy.apiService}</dt><dd><strong data-state={state}>{stateCopy.value}</strong><small>GET /api/status</small></dd></div>
        <div><dt>{copy.deployedVersion}</dt><dd><code>{serviceVersion ?? copy.notAvailable}</code></dd></div>
        <div><dt>{copy.startedAt}</dt><dd><time dateTime={startedAt?.toISOString()}>{formatDate(startedAt, copy.notAvailable)}</time></dd></div>
        <div><dt>{copy.checkedAt}</dt><dd><time dateTime={checkedAt?.toISOString()}>{formatDate(checkedAt, copy.waiting)}</time></dd></div>
      </dl>
    </section>
    <section className="r3-status-scope"><ShieldCheck size={21} /><div><h2>{copy.scopeTitle}</h2><p>{copy.scopeBody}</p></div></section>
  </main>
}

export function PublicPrototype(props: PublicPrototypeProps) {
  let page: ReactNode
  if (props.screen === 'home') page = <HomePage locale={props.locale} theme={props.theme} go={props.go} />
  else if (props.screen === 'models') page = <ModelsPage locale={props.locale} go={props.go} authenticated={props.authenticated} pricingModels={props.pricingModels} pricingLoading={props.pricingLoading} pricingError={props.pricingError} pricingPartial={props.pricingPartial} onPricingRetry={props.onPricingRetry} />
  else if (props.screen === 'docs') page = <DocsPage locale={props.locale} go={props.go} />
  else if (props.screen === 'about') page = <AboutPage locale={props.locale} />
  else if (props.screen === 'notices') page = <NoticesPage locale={props.locale} version={props.version} />
  else if (props.screen === 'status') page = <StatusPage locale={props.locale} online={props.online} version={props.version} startTime={props.startTime} statusCheckedAt={props.statusCheckedAt} statusChecking={props.statusChecking} refreshStatus={props.refreshStatus} />
  else page = <LegalPage locale={props.locale} screen={props.screen} go={props.go} />

  return <PublicShell {...props}>{page}</PublicShell>
}
