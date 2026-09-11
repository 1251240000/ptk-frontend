# Confirmed Decision Record

Status: confirmed by product owner on 2026-07-20  
Scope: baseline for prototype, scaffolding, implementation, and acceptance

The filename is retained so existing planning links remain stable. There are no remaining blocking product decisions in this document.

## Channel model operations

- Reuse new-api channel HTTP endpoints; Partokens does not call arbitrary
  provider URLs and does not retrieve channel keys.
- Persist discovery snapshots and model-test results in the administrator
  SQLite database. One process remains the deployment requirement.
- Use four concurrent tests, a ten-second model timeout, at most 100 models,
  and one retry only for timeout/connection failures.
- Only `unavailable` is eligible for one-click removal. Transient and
  channel-wide failures remain configured and do not auto-disable channels.
- Update all Partokens-managed physical mirrors (`template`, `route`, and
  `archive`) and retain before-state in the resumable change audit.

## 1. Email Verification Code

Email verification codes are used for registration and account binding only. The sign-in page does not show an email-code login mode because the current backend cannot create a session from email plus code.

Registration remains in scope and uses `/api/verification` when email verification is enabled by `/api/status`.

## 2. Independent Legal Documents

The standalone UI owns three separately maintained documents:

- User Agreement
- Terms of Service
- Privacy Policy

They use canonical localized routes under `/{locale}/legal/*`. There are no compatibility redirects from the old New API legal pages. Existing production HTML and `/api/user-agreement` or `/api/privacy-policy` responses are reference material only and are not runtime content sources.

## 3. Locale-Prefixed User UI And Root Channel Operations

The standalone user UI uses BCP-47 locale prefixes:

- `/zh-CN/*`
- `/zh-TW/*`
- `/en/*`
- `/ja/*`
- `/ru/*`
- `/fr/*`
- `/vi/*`

Use `zh-CN`, not the ambiguous `zh`, because Simplified and Traditional Chinese are both first-class locales. User console routes follow `/{locale}/console/*`, for example `/zh-CN/console/overview`.

Root (`role === 100`) uses Partokens-owned channel operations at `/{locale}/console/admin/*` and lands on `admin/channels` after authentication when no validated return path exists. Role 10 lands on the ordinary Partokens overview and has no Partokens administrator navigation.

Other management capabilities remain in the current official New API `web/default` UI at native unprefixed paths. The Root sidebar links to models, users, redemption codes, subscriptions, system information, and system settings. The native `/channels` route remains reachable for diagnosis but is not the normal management surface.

Two unprefixed technical entries remain owned by the standalone UI because current backend/provider links depend on them: `/oauth/:provider` and `/user/reset`. They restore the saved locale before continuing the flow.

## 4. Image Studio Base

Use a controlled, separately buildable fork of `basketikun/infinite-canvas` under AGPL-3.0 obligations. Limit P0 to image workflows, replace persistent API-key storage with an in-memory credential provider, remove unrelated agent/plugin/audio/video features, and preserve attribution, modification notices, and source availability.

## 5. Studio API Key Experience

Users may either select an existing key or explicitly confirm creation of a dedicated finite-quota, image-model-only key. The selected key is revealed into memory only for the active studio session.

The UI must disclose that the current reveal endpoint is session-authenticated and rate-limited but has no password/2FA step-up. It never silently selects or reuses an unrestricted key.

## 6. Documentation Locales

Both quick-start and full reference documentation ship in all seven locales. English fallback is not the launch definition of done.

`new-api-docs-v1/` remains read-only. A Partokens-owned docs app imports a pinned source snapshot and maintains locale overlays with translation-completeness checks.

## 7. Translation And Review

Simplified Chinese is the drafting source for Partokens-owned product, legal, and notice content. Codex provides the initial translations for all six other locales. Translation metadata distinguishes draft and owner-reviewed content.

The product owner reviews the translations after development and before production publication. Legal text is not marked approved until that review is complete.

## 8. Independent Public Content

Homepage, About, legal documents, and platform notices are versioned with the standalone frontend. Administrator-configured HTML is deprecated for the new experience.

The new UI does not render runtime HTML from `/api/home_page_content`, `/api/about`, `/api/user-agreement`, `/api/privacy-policy`, or `/api/notice`. Those endpoints remain untouched in New API and may be used only during research or migration comparison.

## 9. Registration

Registration, password reset, OAuth callback, Passkey, and 2FA support flows are in scope. Registration visibility remains driven by `/api/status`.

## 10. Wallet Completeness

Retain every wallet subsection enabled by the backend: subscriptions, online top-up, redemption, order history, referral earnings, and transfer to balance. Custom amount input is the only removal.

Only values returned in `amount_options` are selectable. An empty array disables preset top-up rather than authorizing generated or custom values.

## 11. Local Chat Retention And Disclosure

Conversation history remains in the current browser until the user deletes it or browser storage pressure evicts it. Provide storage usage, export, delete-one, and clear-all controls. There is no cross-device synchronization.

Display a persistent, localized disclosure near conversation history settings:

> Conversation history is stored only in this browser. Partokens does not store your conversation history.

Also explain that a message is transmitted through the Partokens gateway and to the selected model provider when the user sends it.

## 12. Global Search

Do not build top-navigation search in P0. Feature-specific search for keys, logs, models, and local conversations remains in scope.

## 13. Homepage Live Status

Use real public uptime, model availability, pricing, and performance data. When live monitoring is unavailable, show a truthful unavailable state or static product view; never fabricate status percentages.

## 14. Notice Read State

Notices are versioned, localized frontend content. Seen/unseen state is a local content/version hash, not a per-user server inbox.

## 15. License

Use an AGPL-3.0-compatible license for the new frontend, with `AGPL-3.0-only` as the implementation default unless repository ownership review requires another compatible choice. Preserve all third-party notices and publish the modified studio source as required.

## 16. Lightweight Administrator Service

Create `partokens-admin-api` as a sibling project using Python 3.11+, FastAPI, httpx, and stdlib SQLite. It manages one New API instance through HTTP APIs only; it does not modify New API or connect directly to its PostgreSQL database.

The service owns logical-channel metadata, route revisions, execution steps, and monitoring snapshots. New API remains authoritative for authentication, physical channels, routing, tests, logs, and billing. Partokens metadata copied into New API is a compatibility mirror, not the primary store.

Route changes are explicitly non-atomic. Every step is persisted before execution, uses read-back verification, and can continue after a partial failure. Continuous monitoring uses an optional dedicated Root Personal Access Token for read-only polling. SQLite restricts the first release to one service process/replica.

The first administrator UI ships in Simplified Chinese with a copy-resolver seam for later i18n.

## Implementation Can Begin When Requested

The discovery phase has no remaining blocking product decisions. The next authorized phase is low-fidelity route/layout prototypes followed by the independent `partokens-ui/` scaffold; neither upstream repository is modified.
