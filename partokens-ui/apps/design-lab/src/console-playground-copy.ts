import type { AppLocale } from '@partokens/i18n'

const zhCN = {
  Today: '今天',
  'Previous 7 days': '过去 7 天',
  'Message route': '消息路径',
  'Saved in this browser': '保存在当前浏览器',
  'Sent through Partokens': '经 Partokens 发送',
  'Selected model provider': '所选模型提供商',
  'API launch checklist': 'API 发布检查清单',
  'Model cost comparison': '模型成本对比',
  'French release notes': '法语发布说明',
  'Draft a pre-launch checklist for an AI API product.': '为一个 AI API 产品整理上线前检查清单。',
  'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.': '先设置三道关口：访问与额度、请求可靠性，以及明确负责人和路径的回滚方案。切换流量前逐项确认。',
  'I grouped the checks by the decision they unlock instead of by engineering team.': '我按检查项能够解锁的决策分组，而不是按工程团队分组。',
  'Plan a model rollout': '规划模型上线',
  'Compare prompt costs': '比较提示词成本',
  'Draft an incident update': '起草故障更新',
  'Draft saved': '草稿已保存',
  Copied: '已复制',
  'Conversation deleted': '对话已删除',
  'All conversations cleared': '全部本地对话已清空',
  'Parameters saved': '生成参数已保存',
  'Local IndexedDB': '本地 IndexedDB',
  'Stored on this device': '保存在此设备',
  'Transported when sent': '仅在发送时传输',
  'Response returns here': '响应返回当前对话',
  'New answer streaming': '正在生成新回答',
  'No matching conversations': '没有匹配的对话',
  'Import complete': '导入完成',
  'This file does not contain valid Partokens conversations.': '此文件不包含有效的 Partokens 对话。',
} as const

type PlaygroundCopyKey = keyof typeof zhCN

const packs: Record<AppLocale, Record<PlaygroundCopyKey, string>> = {
  'zh-CN': zhCN,
  'zh-TW': {
    Today: '今天', 'Previous 7 days': '過去 7 天', 'Message route': '訊息路徑', 'Saved in this browser': '儲存在目前瀏覽器', 'Sent through Partokens': '經由 Partokens 傳送', 'Selected model provider': '所選模型供應商',
    'API launch checklist': 'API 發佈檢查清單', 'Model cost comparison': '模型成本比較', 'French release notes': '法文發佈說明', 'Draft a pre-launch checklist for an AI API product.': '為一個 AI API 產品整理上線前檢查清單。',
    'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.': '先設定三道關卡：存取與額度、請求可靠性，以及有明確負責人與路徑的回復方案。切換流量前逐項確認。',
    'I grouped the checks by the decision they unlock instead of by engineering team.': '我按照檢查項目能解鎖的決策分組，而不是按照工程團隊分組。',
    'Plan a model rollout': '規劃模型上線', 'Compare prompt costs': '比較提示詞成本', 'Draft an incident update': '起草事故更新', 'Draft saved': '草稿已儲存', Copied: '已複製', 'Conversation deleted': '對話已刪除', 'All conversations cleared': '所有本機對話已清除', 'Parameters saved': '生成參數已儲存', 'Local IndexedDB': '本機 IndexedDB', 'Stored on this device': '儲存在此裝置', 'Transported when sent': '僅在傳送時傳輸', 'Response returns here': '回應返回目前對話', 'New answer streaming': '正在生成新回應', 'No matching conversations': '沒有符合的對話', 'Import complete': '匯入完成', 'This file does not contain valid Partokens conversations.': '此檔案不包含有效的 Partokens 對話。',
  },
  en: {
    Today: 'Today', 'Previous 7 days': 'Previous 7 days', 'Message route': 'Message route', 'Saved in this browser': 'Saved in this browser', 'Sent through Partokens': 'Sent through Partokens', 'Selected model provider': 'Selected model provider',
    'API launch checklist': 'API launch checklist', 'Model cost comparison': 'Model cost comparison', 'French release notes': 'French release notes', 'Draft a pre-launch checklist for an AI API product.': 'Draft a pre-launch checklist for an AI API product.',
    'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.': 'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.',
    'I grouped the checks by the decision they unlock instead of by engineering team.': 'I grouped the checks by the decision they unlock instead of by engineering team.',
    'Plan a model rollout': 'Plan a model rollout', 'Compare prompt costs': 'Compare prompt costs', 'Draft an incident update': 'Draft an incident update', 'Draft saved': 'Draft saved', Copied: 'Copied', 'Conversation deleted': 'Conversation deleted', 'All conversations cleared': 'All conversations cleared', 'Parameters saved': 'Parameters saved', 'Local IndexedDB': 'Local IndexedDB', 'Stored on this device': 'Stored on this device', 'Transported when sent': 'Transported when sent', 'Response returns here': 'Response returns here', 'New answer streaming': 'New answer streaming', 'No matching conversations': 'No matching conversations', 'Import complete': 'Import complete', 'This file does not contain valid Partokens conversations.': 'This file does not contain valid Partokens conversations.',
  },
  ja: {
    Today: '今日', 'Previous 7 days': '過去 7 日間', 'Message route': 'メッセージ経路', 'Saved in this browser': 'このブラウザに保存', 'Sent through Partokens': 'Partokens 経由で送信', 'Selected model provider': '選択したモデル提供者',
    'API launch checklist': 'API 公開チェックリスト', 'Model cost comparison': 'モデル費用の比較', 'French release notes': 'フランス語リリースノート', 'Draft a pre-launch checklist for an AI API product.': 'AI API 製品の公開前チェックリストを作成してください。',
    'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.': 'アクセスとクォータ、リクエストの信頼性、担当者と手順が明確なロールバックという 3 つのゲートから始めます。トラフィックを移す前にすべて確認します。',
    'I grouped the checks by the decision they unlock instead of by engineering team.': 'エンジニアリングチーム別ではなく、各確認が可能にする判断別に整理しました。',
    'Plan a model rollout': 'モデル公開を計画', 'Compare prompt costs': 'プロンプト費用を比較', 'Draft an incident update': '障害報告を作成', 'Draft saved': '下書きを保存しました', Copied: 'コピーしました', 'Conversation deleted': '会話を削除しました', 'All conversations cleared': 'すべてのローカル会話を削除しました', 'Parameters saved': '生成パラメーターを保存しました', 'Local IndexedDB': 'ローカル IndexedDB', 'Stored on this device': 'この端末に保存', 'Transported when sent': '送信時のみ転送', 'Response returns here': '応答はこの会話に戻ります', 'New answer streaming': '新しい回答を生成中', 'No matching conversations': '一致する会話はありません', 'Import complete': '読み込み完了', 'This file does not contain valid Partokens conversations.': 'このファイルには有効な Partokens 会話がありません。',
  },
  ru: {
    Today: 'Сегодня', 'Previous 7 days': 'Предыдущие 7 дней', 'Message route': 'Маршрут сообщения', 'Saved in this browser': 'Сохранено в этом браузере', 'Sent through Partokens': 'Отправлено через Partokens', 'Selected model provider': 'Выбранный поставщик модели',
    'API launch checklist': 'Проверки перед запуском API', 'Model cost comparison': 'Сравнение стоимости моделей', 'French release notes': 'Примечания к выпуску на французском', 'Draft a pre-launch checklist for an AI API product.': 'Составь список проверок перед запуском продукта с API для ИИ.',
    'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.': 'Начните с трёх рубежей: доступ и квота, надёжность запросов и закреплённый план отката. Проверьте каждый рубеж до переключения трафика.',
    'I grouped the checks by the decision they unlock instead of by engineering team.': 'Проверки сгруппированы по решениям, которые они разрешают принять, а не по инженерным командам.',
    'Plan a model rollout': 'Спланировать запуск модели', 'Compare prompt costs': 'Сравнить стоимость промптов', 'Draft an incident update': 'Подготовить отчёт об инциденте', 'Draft saved': 'Черновик сохранён', Copied: 'Скопировано', 'Conversation deleted': 'Диалог удалён', 'All conversations cleared': 'Все локальные диалоги удалены', 'Parameters saved': 'Параметры сохранены', 'Local IndexedDB': 'Локальная IndexedDB', 'Stored on this device': 'Сохранено на этом устройстве', 'Transported when sent': 'Передаётся только при отправке', 'Response returns here': 'Ответ возвращается в этот диалог', 'New answer streaming': 'Создаётся новый ответ', 'No matching conversations': 'Подходящих диалогов нет', 'Import complete': 'Импорт завершён', 'This file does not contain valid Partokens conversations.': 'Файл не содержит корректных диалогов Partokens.',
  },
  fr: {
    Today: 'Aujourd’hui', 'Previous 7 days': '7 derniers jours', 'Message route': 'Parcours du message', 'Saved in this browser': 'Enregistré dans ce navigateur', 'Sent through Partokens': 'Envoyé via Partokens', 'Selected model provider': 'Fournisseur du modèle choisi',
    'API launch checklist': 'Checklist de lancement API', 'Model cost comparison': 'Comparaison du coût des modèles', 'French release notes': 'Notes de version en français', 'Draft a pre-launch checklist for an AI API product.': 'Rédige une checklist avant le lancement d’un produit API d’IA.',
    'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.': 'Commencez par trois validations : accès et quota, fiabilité des requêtes, puis procédure de retour arrière avec un responsable. Vérifiez-les avant de déplacer le trafic.',
    'I grouped the checks by the decision they unlock instead of by engineering team.': 'J’ai regroupé les contrôles selon la décision qu’ils permettent, plutôt que par équipe technique.',
    'Plan a model rollout': 'Planifier le déploiement d’un modèle', 'Compare prompt costs': 'Comparer le coût des prompts', 'Draft an incident update': 'Rédiger un point d’incident', 'Draft saved': 'Brouillon enregistré', Copied: 'Copié', 'Conversation deleted': 'Conversation supprimée', 'All conversations cleared': 'Toutes les conversations locales ont été effacées', 'Parameters saved': 'Paramètres enregistrés', 'Local IndexedDB': 'IndexedDB locale', 'Stored on this device': 'Enregistré sur cet appareil', 'Transported when sent': 'Transmis uniquement à l’envoi', 'Response returns here': 'La réponse revient ici', 'New answer streaming': 'Nouvelle réponse en cours', 'No matching conversations': 'Aucune conversation correspondante', 'Import complete': 'Importation terminée', 'This file does not contain valid Partokens conversations.': 'Ce fichier ne contient aucune conversation Partokens valide.',
  },
  vi: {
    Today: 'Hôm nay', 'Previous 7 days': '7 ngày trước', 'Message route': 'Luồng tin nhắn', 'Saved in this browser': 'Lưu trong trình duyệt này', 'Sent through Partokens': 'Gửi qua Partokens', 'Selected model provider': 'Nhà cung cấp mô hình đã chọn',
    'API launch checklist': 'Danh sách kiểm tra ra mắt API', 'Model cost comparison': 'So sánh chi phí mô hình', 'French release notes': 'Ghi chú phát hành tiếng Pháp', 'Draft a pre-launch checklist for an AI API product.': 'Soạn danh sách kiểm tra trước khi ra mắt sản phẩm API AI.',
    'Start with three gates: access and quota, request reliability, and an owned rollback path. Verify each gate before traffic moves.': 'Bắt đầu với ba cổng: quyền truy cập và hạn mức, độ tin cậy của yêu cầu, cùng phương án hoàn tác có người phụ trách. Xác minh từng cổng trước khi chuyển lưu lượng.',
    'I grouped the checks by the decision they unlock instead of by engineering team.': 'Tôi nhóm các bước kiểm tra theo quyết định mà chúng mở khóa, thay vì theo nhóm kỹ thuật.',
    'Plan a model rollout': 'Lập kế hoạch triển khai mô hình', 'Compare prompt costs': 'So sánh chi phí prompt', 'Draft an incident update': 'Soạn cập nhật sự cố', 'Draft saved': 'Đã lưu bản nháp', Copied: 'Đã sao chép', 'Conversation deleted': 'Đã xóa cuộc trò chuyện', 'All conversations cleared': 'Đã xóa mọi cuộc trò chuyện cục bộ', 'Parameters saved': 'Đã lưu tham số', 'Local IndexedDB': 'IndexedDB cục bộ', 'Stored on this device': 'Được lưu trên thiết bị này', 'Transported when sent': 'Chỉ truyền khi gửi', 'Response returns here': 'Phản hồi trở lại đây', 'New answer streaming': 'Đang tạo phản hồi mới', 'No matching conversations': 'Không có cuộc trò chuyện phù hợp', 'Import complete': 'Đã nhập xong', 'This file does not contain valid Partokens conversations.': 'Tệp này không chứa cuộc trò chuyện Partokens hợp lệ.',
  },
}

export function translateConsolePlayground(locale: AppLocale, key: string) {
  return packs[locale][key as PlaygroundCopyKey] ?? key
}
