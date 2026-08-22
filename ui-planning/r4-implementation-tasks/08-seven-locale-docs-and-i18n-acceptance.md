# R4.8 seven-locale documentation and i18n acceptance

Depends on: R4.7 cross-page i18n completion
Scope: the 18 published documentation articles in Web and the independent documentation build
Primary source: `packages/content/src/public-docs-content.ts` through `getDocsDocument()`

## 1. Objective

Publish complete, editorially reviewed documentation bodies for `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, and `vi` without locale fallback.

Current verified state:

- The documentation shell and navigation are localized in all seven locales.
- `zh-CN` and `en` have published article bodies.
- `zh-TW`, `ja`, `ru`, `fr`, and `vi` currently show a localized notice and the Simplified Chinese body.
- This fallback is honest but does not satisfy seven-locale launch completion.

Do not replace the notice with unreviewed machine translation and call the task complete.

## 2. Included documents

Complete all seven locales for exactly these 18 document IDs:

```text
welcome
overview
first-request
clients
api-keys
billing
models-pricing
codex
sdk
image-studio
api-basics
chat-completions
image-api
models-api
faq
troubleshooting
usage-logs
contact-support
```

Do not add, remove, rename, or reorder navigation entries in this task.

## 3. Published-content source of truth

1. Read every currently published `zh-CN` and `en` article through `getDocsDocument()` before editing.
2. Treat `getDocsDocument(id, locale)` as the Web publication contract. Source literals, drafts, and generated files are not evidence unless the accessor returns them.
3. Verify the corresponding independent docs page for the same locale and document ID.
4. Keep both publication surfaces semantically synchronized. Prefer shared structured content; if a renderer-specific projection remains necessary, add a test that detects divergence.
5. Update `hasLocalizedDocsDocument()` so it returns `true` only when that locale has a complete published body.
6. Keep a defensive fallback for unexpected incomplete data if required, but no included locale/document route may exercise it in tests or browser acceptance.

## 4. Translation and editorial rules

- Translate meaning, not sentence shape. Use concise formal product language appropriate to each locale.
- Preserve task intent, prerequisites, warnings, links, endpoint paths, HTTP methods, status codes, request fields, and code samples exactly where they are contractual.
- Keep `<YOUR_PARTOKENS_API_KEY>` and `<YOUR_MODEL_ID>` unchanged in every locale.
- Do not translate product names, API paths, header names, JSON keys, environment variable names, model IDs returned by the account, or code-language names.
- Do not introduce fixed model names, prices, amounts, quotas, validity periods, reset cycles, log-retention periods, or response-time promises.
- Do not add internal architecture, source-code, implementation, routing-layer, DTO, controller, middleware, mock-state, or future-roadmap language.
- Do not turn assumptions into support commitments. Service scope, supported parameters, models, prices, limits, and endpoints remain subject to the current account and actual response.
- Legal, billing, privacy, and support wording requires named human review evidence before the locale is marked approved.
- Record reviewer, review date, source revision, and locale status outside user-visible article prose. Do not invent review approval.

## 5. Structural parity

For every document and locale:

1. Preserve the same section IDs and section order as the approved canonical article.
2. Preserve block count and block type per section unless a documented locale-specific accessibility reason requires a reviewed exception.
3. Keep heading levels, list semantics, FAQ question/answer grouping, links, code blocks, and callout tone equivalent.
4. Keep code independently horizontally scrollable and keep the page itself free of horizontal overflow.
5. Do not introduce `table` blocks into the six launch articles: `welcome`, `overview`, `faq`, `troubleshooting`, `usage-logs`, and `contact-support`.
6. Keep the six launch articles at exactly four main sections with no more than two blocks per section.

## 6. Required content checks

- Console paths and control names must match the current production interface in the same locale.
- Public API behavior must match the current published contract and executable response shape.
- Support routes must include only publicly confirmed Email and Telegram destinations.
- Troubleshooting must distinguish connection failures, `400`, `401`, `403`, `429`, `5xx`, cancellation, and timeout without exposing internal error mappings.
- Usage-log guidance must name only filters and fields currently visible in the console.
- Contact guidance must prohibit keys, passwords, verification codes, session tokens, personal information, complete prompts, and private files.
- Search text must come from the selected locale; it must not silently index the Simplified Chinese fallback.

## 7. Automated acceptance

Extend tests to prove:

1. `18 documents x 7 locales` resolve through `getDocsDocument()` without fallback.
2. Every localized document has a non-empty title, summary, prerequisites, and sections.
3. Section IDs/order and block types match the canonical structure.
4. The six launch articles satisfy their four-section, two-block, and no-table constraints.
5. Placeholders, base URL, environment-variable assignment, endpoints, methods, status codes, support destinations, and prohibited terms remain valid.
6. No non-English locale body is byte-identical to the Simplified Chinese or English article, except reviewed code, paths, identifiers, and links.
7. Web hash-doc routes and independent docs routes expose equivalent titles, section IDs, code, links, and safety statements.
8. The fallback notice is absent for all 126 included locale/document combinations.
9. Translation metadata contains an actual approved reviewer record before release completion is reported.

## 8. Browser acceptance

Use the actual local Web service on `5173` and the independent docs service on its configured port.

Check every article in all seven locales at:

- Desktop: `1280x900`.
- Mobile: `390x844`.

For each page verify:

- Correct URL locale and `document.lang`.
- Correct localized title, summary, section headings, controls, and accessibility names.
- Exactly one main landmark and the expected section structure.
- No fallback notice, page-level horizontal overflow, clipped text, overlap, or wide table.
- Long code blocks scroll independently.
- Navigation, previous/next links, search results, copy controls, and language switching preserve the selected locale.
- Page errors and error-level console messages are empty.

Capture representative evidence for Traditional Chinese, Japanese, Russian, French, and Vietnamese long copy on both viewports.

## 9. Verification commands

Run and report:

```text
Web documentation/content tests
Web full test suite
Docs full test suite
Root TypeScript check
Root production build
Independent docs build
```

Do not raise the existing bundle budget. If the root build remains blocked by the entry budget, report raw and gzip actual/limit/overage values and confirm whether document content remains in an independent async chunk.

## 10. Definition of done

- All 126 locale/document bodies are published and returned by `getDocsDocument()`.
- No required locale depends on the Simplified Chinese or English fallback.
- A real editorial reviewer has approved each newly added locale and the evidence is recorded.
- Web and independent docs are semantically synchronized and protected by tests.
- All structural, contract, safety, search, accessibility, desktop, mobile, test, typecheck, and build gates have reported results.
- No unrelated navigation, visual design, console behavior, API implementation, reference project, or bundle budget was changed.
