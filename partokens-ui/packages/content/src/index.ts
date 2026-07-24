import type { AppLocale } from '@partokens/i18n'

export const brandLogoUrl = 'https://oss.partokens.com/assets/icons/favicon-96x96.png'

export type ReviewState = 'draft' | 'reviewed'
export type LegalKind = 'user-agreement' | 'service-agreement' | 'privacy-policy'

export type LegalDocument = {
  kind: LegalKind
  title: string
  summary: string
  effectiveDate: string
  reviewState: ReviewState
  sections: Array<{ title: string; paragraphs: string[] }>
}

type LocaleContent = {
  aboutTitle: string
  aboutLead: string
  aboutBody: string
  noticeTitle: string
  noticeBody: string
  legal: Record<LegalKind, Omit<LegalDocument, 'kind' | 'effectiveDate' | 'reviewState'>>
}

const content: Record<AppLocale, LocaleContent> = {
  'zh-CN': {
    aboutTitle: '让模型调用变得可度量',
    aboutLead: 'Partokens 为开发者提供统一的模型访问入口，并把价格、状态、额度与调用记录放在同一个操作界面中。',
    aboutBody: '我们关注请求是否能够成功、实际消耗了多少，以及账户是否可以继续稳定运行。新用户端与 New API 管理后台相互独立，服务端仍负责认证、计费、额度与模型路由。',
    noticeTitle: '新版用户端正在独立构建',
    noticeBody: '第一阶段包含新的公开页面、认证流程和控制台基础体验。现有 API 服务不受影响。',
    legal: {
      'user-agreement': {
        title: '用户协议',
        summary: '本协议说明账户注册、安全责任以及使用 Partokens 时应遵守的基本规则。',
        sections: [
          { title: '账户与安全', paragraphs: ['你应提供真实、有效的注册信息，并妥善保管密码、API 密钥与其他访问凭证。账户下发生的操作视为账户持有人的行为。'] },
          { title: '合理使用', paragraphs: ['你不得利用服务实施违法活动、侵害他人权益、规避服务限制，或以未经授权的方式转售上游服务能力。'] },
          { title: '协议更新', paragraphs: ['重大变更会通过版本化通知发布。继续使用服务前，你可以查看新的生效日期与变更内容。'] },
        ],
      },
      'service-agreement': {
        title: '服务协议',
        summary: '本协议说明模型访问、计费、可用性与服务支持的边界。',
        sections: [
          { title: '服务范围', paragraphs: ['Partokens 提供统一 API 网关、账户额度管理、调用记录与相关用户工具。具体可用模型和能力以实时配置为准。'] },
          { title: '计费与充值', paragraphs: ['请求费用按实际路由、模型、倍率与用量计算。充值金额与折扣以支付确认页和服务端计算结果为准。'] },
          { title: '可用性', paragraphs: ['模型能力依赖上游提供商。平台会展示已知状态，但不承诺任何单一模型永久可用或完全无中断。'] },
        ],
      },
      'privacy-policy': {
        title: '隐私政策',
        summary: '本政策说明账户数据、调用数据和浏览器本地数据的处理方式。',
        sections: [
          { title: '账户与运行数据', paragraphs: ['为提供认证、计费、安全与审计能力，服务会处理账户资料、调用统计、网络与设备相关安全信息。'] },
          { title: '本地对话记录', paragraphs: ['游乐场的对话历史仅保存在当前浏览器中，Partokens 不存储你的对话记录。发送消息时，内容会通过网关传输至所选模型提供商。'] },
          { title: '你的选择', paragraphs: ['你可以管理资料、安全设置和本地对话数据，并可在符合适用规则的情况下申请删除账户。'] },
        ],
      },
    },
  },
  'zh-TW': {
    aboutTitle: '讓模型呼叫變得可衡量',
    aboutLead: 'Partokens 為開發者提供統一的模型存取入口，並將價格、狀態、額度與呼叫記錄放在同一個操作介面中。',
    aboutBody: '我們關注請求能否成功、實際消耗多少，以及帳戶能否持續穩定運作。新使用者端與 New API 管理後台彼此獨立，伺服器仍負責驗證、計費、額度與模型路由。',
    noticeTitle: '新版使用者端正在獨立建置',
    noticeBody: '第一階段包含新的公開頁面、驗證流程與控制台基礎體驗。現有 API 服務不受影響。',
    legal: {
      'user-agreement': { title: '使用者協議', summary: '本協議說明帳戶註冊、安全責任與使用 Partokens 時應遵守的基本規則。', sections: [
        { title: '帳戶與安全', paragraphs: ['你應提供真實有效的註冊資訊，並妥善保管密碼、API 金鑰與其他存取憑證。'] },
        { title: '合理使用', paragraphs: ['不得利用服務從事違法活動、侵害他人權益、規避服務限制或未經授權轉售上游能力。'] },
        { title: '協議更新', paragraphs: ['重大變更會透過版本化通知發布，並標示新的生效日期與變更內容。'] },
      ] },
      'service-agreement': { title: '服務協議', summary: '本協議說明模型存取、計費、可用性與服務支援的邊界。', sections: [
        { title: '服務範圍', paragraphs: ['Partokens 提供統一 API 閘道、帳戶額度管理、呼叫記錄與相關使用者工具。'] },
        { title: '計費與儲值', paragraphs: ['請求費用依實際路由、模型、倍率與用量計算，最終金額以伺服器計算為準。'] },
        { title: '可用性', paragraphs: ['模型能力依賴上游供應商，不承諾任何單一模型永久可用或完全不中斷。'] },
      ] },
      'privacy-policy': { title: '隱私權政策', summary: '本政策說明帳戶資料、呼叫資料與瀏覽器本機資料的處理方式。', sections: [
        { title: '帳戶與運行資料', paragraphs: ['為提供驗證、計費、安全與稽核能力，服務會處理必要的帳戶與呼叫統計資料。'] },
        { title: '本機對話記錄', paragraphs: ['對話歷史僅儲存在目前瀏覽器中。傳送訊息時，內容會經由閘道傳輸至所選模型供應商。'] },
        { title: '你的選擇', paragraphs: ['你可以管理個人資料、安全設定與本機對話資料，並依適用規則申請刪除帳戶。'] },
      ] },
    },
  },
  en: {
    aboutTitle: 'Model access you can measure',
    aboutLead: 'Partokens gives developers one model-access endpoint and puts price, status, quota, and request history in one operational surface.',
    aboutBody: 'The product centers on whether a request can succeed, what it actually consumed, and whether the account is ready to continue. The standalone user UI is independent from New API management; the server remains authoritative for authentication, billing, quota, and routing.',
    noticeTitle: 'The standalone user experience is in development',
    noticeBody: 'Phase one introduces new public pages, authentication flows, and the console foundation. Existing API service is unaffected.',
    legal: {
      'user-agreement': { title: 'User Agreement', summary: 'This agreement covers registration, account security, and the baseline rules for using Partokens.', sections: [
        { title: 'Account and security', paragraphs: ['Provide accurate registration information and protect passwords, API keys, and other credentials. Activity under an account is treated as activity of its holder.'] },
        { title: 'Acceptable use', paragraphs: ['Do not use the service for unlawful activity, infringement, circumvention of service limits, or unauthorized resale of upstream capabilities.'] },
        { title: 'Updates', paragraphs: ['Material changes are published as versioned notices with a new effective date and a readable description of the change.'] },
      ] },
      'service-agreement': { title: 'Terms of Service', summary: 'These terms describe the boundaries of model access, billing, availability, and support.', sections: [
        { title: 'Service scope', paragraphs: ['Partokens provides a unified API gateway, quota management, request records, and related user tools. Available models depend on live configuration.'] },
        { title: 'Billing and top-up', paragraphs: ['Request charges depend on actual routing, model, multipliers, and usage. Payment amounts are determined by the server confirmation result.'] },
        { title: 'Availability', paragraphs: ['Model capabilities depend on upstream providers. No individual model is guaranteed to remain permanently available or uninterrupted.'] },
      ] },
      'privacy-policy': { title: 'Privacy Policy', summary: 'This policy describes how account, request, and browser-local data are handled.', sections: [
        { title: 'Account and operational data', paragraphs: ['The service processes necessary account, usage, network, and security data for authentication, billing, safety, and audit functions.'] },
        { title: 'Local conversation history', paragraphs: ['Playground history stays in this browser and is not stored by Partokens. Submitted messages pass through the gateway to the selected model provider.'] },
        { title: 'Your choices', paragraphs: ['You can manage profile, security, and local conversation data and may request account deletion where applicable.'] },
      ] },
    },
  },
  ja: {
    aboutTitle: '測定できるモデルアクセス',
    aboutLead: 'Partokens はモデルへの統一された入口を提供し、料金、状態、割り当て、リクエスト履歴を一つの操作画面にまとめます。',
    aboutBody: 'リクエストが成功できるか、何を消費したか、アカウントが継続利用できるかを重視します。認証、課金、割り当て、ルーティングは引き続きサーバーが管理します。',
    noticeTitle: '新しいユーザー画面を独立して構築中です',
    noticeBody: '第1段階では公開ページ、認証フロー、コンソール基盤を導入します。既存の API サービスには影響しません。',
    legal: {
      'user-agreement': { title: 'ユーザー契約', summary: '登録、アカウントの安全、Partokens 利用時の基本ルールを定めます。', sections: [
        { title: 'アカウントと安全', paragraphs: ['正確な登録情報を提供し、パスワード、API キー、その他の認証情報を適切に管理してください。'] },
        { title: '適正利用', paragraphs: ['違法行為、権利侵害、制限回避、上流機能の無断再販にサービスを使用してはいけません。'] },
        { title: '更新', paragraphs: ['重要な変更は、新しい施行日と変更内容を含むバージョン付き通知として公開します。'] },
      ] },
      'service-agreement': { title: 'サービス契約', summary: 'モデルアクセス、課金、可用性、サポートの範囲を説明します。', sections: [
        { title: 'サービス範囲', paragraphs: ['統一 API ゲートウェイ、割り当て管理、リクエスト履歴、関連ツールを提供します。'] },
        { title: '課金とチャージ', paragraphs: ['料金は実際のルート、モデル、倍率、使用量に基づき、サーバーの確認結果が最終値です。'] },
        { title: '可用性', paragraphs: ['モデル機能は上流提供者に依存し、永続的または中断のない提供を保証しません。'] },
      ] },
      'privacy-policy': { title: 'プライバシーポリシー', summary: 'アカウント、リクエスト、ブラウザ内データの扱いを説明します。', sections: [
        { title: 'アカウントと運用データ', paragraphs: ['認証、課金、安全、監査に必要なアカウント情報と利用統計を処理します。'] },
        { title: 'ローカル会話履歴', paragraphs: ['履歴はこのブラウザにのみ保存されます。送信内容は選択したモデル提供者へ転送されます。'] },
        { title: '利用者の選択', paragraphs: ['プロフィール、安全設定、ローカル履歴を管理し、適用条件に従って削除を申請できます。'] },
      ] },
    },
  },
  ru: {
    aboutTitle: 'Измеримый доступ к моделям',
    aboutLead: 'Partokens объединяет доступ к моделям и показывает стоимость, состояние, квоту и историю запросов в одном рабочем интерфейсе.',
    aboutBody: 'В центре внимания успешность запроса, фактический расход и готовность аккаунта продолжать работу. Сервер остаётся источником истины для входа, оплаты, квот и маршрутизации.',
    noticeTitle: 'Новый пользовательский интерфейс разрабатывается отдельно',
    noticeBody: 'Первый этап включает публичные страницы, вход и основу консоли. Работа существующего API не изменяется.',
    legal: {
      'user-agreement': { title: 'Пользовательское соглашение', summary: 'Правила регистрации, безопасности аккаунта и использования Partokens.', sections: [
        { title: 'Аккаунт и безопасность', paragraphs: ['Указывайте достоверные данные и защищайте пароль, ключи API и другие учётные данные.'] },
        { title: 'Допустимое использование', paragraphs: ['Запрещены незаконные действия, нарушение прав, обход ограничений и несанкционированная перепродажа возможностей.'] },
        { title: 'Обновления', paragraphs: ['Существенные изменения публикуются с номером версии, новой датой вступления и описанием.'] },
      ] },
      'service-agreement': { title: 'Условия обслуживания', summary: 'Границы доступа к моделям, оплаты, доступности и поддержки.', sections: [
        { title: 'Состав сервиса', paragraphs: ['Partokens предоставляет единый шлюз API, управление квотами, журнал запросов и пользовательские инструменты.'] },
        { title: 'Оплата', paragraphs: ['Стоимость зависит от маршрута, модели, коэффициентов и использования; итог определяет сервер.'] },
        { title: 'Доступность', paragraphs: ['Возможности зависят от внешних поставщиков, поэтому постоянная бесперебойная доступность не гарантируется.'] },
      ] },
      'privacy-policy': { title: 'Политика конфиденциальности', summary: 'Обработка данных аккаунта, запросов и локальных данных браузера.', sections: [
        { title: 'Данные аккаунта и работы', paragraphs: ['Для входа, оплаты, безопасности и аудита обрабатываются необходимые данные аккаунта и статистика.'] },
        { title: 'Локальная история диалогов', paragraphs: ['История хранится только в браузере. Отправленные сообщения передаются выбранному поставщику модели.'] },
        { title: 'Ваш выбор', paragraphs: ['Можно управлять профилем, безопасностью и локальной историей, а также запросить удаление аккаунта.'] },
      ] },
    },
  },
  fr: {
    aboutTitle: 'Un accès aux modèles que vous pouvez mesurer',
    aboutLead: 'Partokens réunit l’accès aux modèles et affiche prix, état, quota et historique dans une même interface opérationnelle.',
    aboutBody: 'Nous mettons en avant la réussite d’une requête, sa consommation réelle et la capacité du compte à continuer. Le serveur reste l’autorité pour l’authentification, la facturation, les quotas et le routage.',
    noticeTitle: 'La nouvelle expérience utilisateur est développée indépendamment',
    noticeBody: 'La première phase apporte les pages publiques, l’authentification et la base de la console. Le service API existant reste inchangé.',
    legal: {
      'user-agreement': { title: 'Contrat utilisateur', summary: 'Règles d’inscription, de sécurité du compte et d’utilisation de Partokens.', sections: [
        { title: 'Compte et sécurité', paragraphs: ['Fournissez des informations exactes et protégez votre mot de passe, vos clés API et vos autres identifiants.'] },
        { title: 'Utilisation acceptable', paragraphs: ['Les activités illégales, les atteintes aux droits, le contournement des limites et la revente non autorisée sont interdits.'] },
        { title: 'Mises à jour', paragraphs: ['Les changements importants sont publiés avec une version, une date d’effet et une description lisible.'] },
      ] },
      'service-agreement': { title: 'Conditions de service', summary: 'Limites de l’accès aux modèles, de la facturation, de la disponibilité et du support.', sections: [
        { title: 'Périmètre du service', paragraphs: ['Partokens fournit une passerelle API, la gestion des quotas, l’historique des requêtes et des outils utilisateur.'] },
        { title: 'Facturation', paragraphs: ['Le coût dépend du routage, du modèle, des multiplicateurs et de l’usage ; le calcul du serveur fait foi.'] },
        { title: 'Disponibilité', paragraphs: ['Les capacités dépendent de fournisseurs externes et aucune disponibilité permanente sans interruption n’est garantie.'] },
      ] },
      'privacy-policy': { title: 'Politique de confidentialité', summary: 'Traitement des données du compte, des requêtes et des données locales du navigateur.', sections: [
        { title: 'Données du compte et d’exploitation', paragraphs: ['Les données nécessaires sont traitées pour l’authentification, la facturation, la sécurité et l’audit.'] },
        { title: 'Historique local', paragraphs: ['L’historique reste dans ce navigateur. Les messages envoyés sont transmis au fournisseur du modèle choisi.'] },
        { title: 'Vos choix', paragraphs: ['Vous pouvez gérer votre profil, la sécurité et l’historique local, et demander la suppression du compte selon les règles applicables.'] },
      ] },
    },
  },
  vi: {
    aboutTitle: 'Truy cập mô hình với số liệu rõ ràng',
    aboutLead: 'Partokens hợp nhất quyền truy cập mô hình và hiển thị giá, trạng thái, hạn mức cùng lịch sử yêu cầu trên một giao diện vận hành.',
    aboutBody: 'Sản phẩm tập trung vào khả năng thành công, mức tiêu thụ thực tế và khả năng tiếp tục của tài khoản. Máy chủ vẫn quyết định xác thực, tính phí, hạn mức và định tuyến.',
    noticeTitle: 'Trải nghiệm người dùng mới đang được xây dựng độc lập',
    noticeBody: 'Giai đoạn một gồm các trang công khai, luồng xác thực và nền tảng bảng điều khiển. Dịch vụ API hiện tại không bị ảnh hưởng.',
    legal: {
      'user-agreement': { title: 'Thỏa thuận người dùng', summary: 'Quy tắc đăng ký, bảo mật tài khoản và sử dụng Partokens.', sections: [
        { title: 'Tài khoản và bảo mật', paragraphs: ['Cung cấp thông tin chính xác và bảo vệ mật khẩu, khóa API cùng các thông tin truy cập khác.'] },
        { title: 'Sử dụng hợp lý', paragraphs: ['Không dùng dịch vụ cho hoạt động trái pháp luật, xâm phạm quyền, né giới hạn hoặc bán lại trái phép.'] },
        { title: 'Cập nhật', paragraphs: ['Thay đổi quan trọng được công bố theo phiên bản, kèm ngày hiệu lực và nội dung thay đổi.'] },
      ] },
      'service-agreement': { title: 'Điều khoản dịch vụ', summary: 'Phạm vi truy cập mô hình, tính phí, khả dụng và hỗ trợ.', sections: [
        { title: 'Phạm vi dịch vụ', paragraphs: ['Partokens cung cấp cổng API thống nhất, quản lý hạn mức, lịch sử yêu cầu và công cụ người dùng.'] },
        { title: 'Tính phí', paragraphs: ['Chi phí phụ thuộc định tuyến, mô hình, hệ số và mức dùng; kết quả máy chủ là giá trị cuối cùng.'] },
        { title: 'Khả dụng', paragraphs: ['Khả năng mô hình phụ thuộc nhà cung cấp bên ngoài và không được bảo đảm luôn liên tục.'] },
      ] },
      'privacy-policy': { title: 'Chính sách quyền riêng tư', summary: 'Cách xử lý dữ liệu tài khoản, yêu cầu và dữ liệu cục bộ trong trình duyệt.', sections: [
        { title: 'Dữ liệu tài khoản và vận hành', paragraphs: ['Dữ liệu cần thiết được xử lý cho xác thực, tính phí, an toàn và kiểm toán.'] },
        { title: 'Lịch sử trò chuyện cục bộ', paragraphs: ['Lịch sử chỉ nằm trong trình duyệt này. Tin nhắn gửi đi được chuyển đến nhà cung cấp mô hình đã chọn.'] },
        { title: 'Lựa chọn của bạn', paragraphs: ['Bạn có thể quản lý hồ sơ, bảo mật, lịch sử cục bộ và yêu cầu xóa tài khoản theo quy định.'] },
      ] },
    },
  },
}

export function getLocaleContent(locale: AppLocale): LocaleContent {
  return content[locale]
}

export function getLegalDocument(locale: AppLocale, kind: LegalKind): LegalDocument {
  return {
    kind,
    effectiveDate: '2026-07-20',
    reviewState: 'draft',
    ...content[locale].legal[kind],
  }
}

export function getCurrentNotice(locale: AppLocale) {
  const localeContent = content[locale]
  return {
    id: 'standalone-ui-phase-1',
    version: '2026-07-20.1',
    title: localeContent.noticeTitle,
    body: localeContent.noticeBody,
  }
}

