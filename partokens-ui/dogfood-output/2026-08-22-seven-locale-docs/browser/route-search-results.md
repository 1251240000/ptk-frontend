# Real-browser route and search checks

Runtime: packaged Web release through Caddy at `http://127.0.0.1:8080`. Browser: agent-browser Chrome. Desktop viewport: 1280x900. Mobile viewport: 390x844.

| Locale | Docs home H1 | Deep document H1 | Localized search | Fallback | Page overflow |
| --- | --- | --- | --- | --- | --- |
| zh-CN | 欢迎使用 Partokens | 快速开始：完成首次接入 | `轮换` -> API 密钥管理 | 0 | false |
| zh-TW | 歡迎使用 Partokens | 快速開始：完成首次接入 | `輪替` -> API 金鑰管理 | 0 | false |
| en | Welcome to Partokens | Quick start: first integration | `rotate` -> API key management | 0 | false |
| ja | Partokens へようこそ | クイックスタート：初回接続 | `ローテーション` -> API キー管理 | 0 | false |
| ru | Добро пожаловать в Partokens | Быстрый старт: первое подключение | `чередуйте` -> Управление API-ключами | 0 | false |
| fr | Bienvenue sur Partokens | Démarrage rapide : première intégration | `révoquez` -> Gestion des clés API | 0 | false |
| vi | Chào mừng đến với Partokens | Bắt đầu nhanh: tích hợp đầu tiên | `xoay` -> Quản lý khóa API | 0 | false |

- Language menu: `/en/docs#docs/first-request` -> `/ja/docs#docs/first-request`; Japanese body loaded and the document hash was preserved.
- Legacy routes: `/ja/docs/guides/image-studio` -> `/ja/docs#docs/image-studio`; `/fr/docs/guides/usage-logs` -> `/fr/docs#docs/usage-logs`.
- Theme: dark and light modes both rendered; `partokens-theme=dark` survived reload on the French Usage Logs deep document.
- Mobile sidebar opened and closed, localized search returned Image Studio, and the page stayed 390 CSS pixels wide.
- Models API: table and code block were independently horizontally scrollable (242 px and 44 px), while the page itself had no horizontal overflow.
- Code tabs selected JavaScript; the code contained `chat.completions.create`; copy showed `Copied` even when Clipboard API permission was denied because the selection fallback ran.
