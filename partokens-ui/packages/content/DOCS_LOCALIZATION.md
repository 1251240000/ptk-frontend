# Documentation localization

The published Web documentation has complete bodies for `zh-CN`, `zh-TW`, `en`, `ja`, `ru`, `fr`, and `vi`.

## Source layout

- `src/public-docs-copy.ts` owns the dynamic catalog and localized navigation labels.
- `src/public-docs-content.ts` owns the stable content types, locale loaders, retry-safe cache, search extraction, and English-only defensive fallback.
- `src/docs-locales/<locale>.ts` owns every summary, prerequisite, section title, paragraph, list, step, callout, FAQ, table, endpoint label, and code-sample label for one locale.

The docs route loads only its requested locale chunk. English is fetched in addition only if the requested module is missing a catalog document. A normal published build must never display `.r3-docs-language-fallback`.

## Terminology

Use these concepts consistently. Grammar and capitalization may follow the target language, but do not switch synonyms within one locale.

| Concept | zh-CN | zh-TW | ja | ru | fr | vi |
| --- | --- | --- | --- | --- | --- | --- |
| API key | API 密钥 | API 金鑰 | API キー | ключ API | clé API | khóa API |
| quota | 额度 | 額度 | クォータ | квота | quota | hạn ngạch |
| usage log | 使用日志 | 使用記錄 | 使用状況ログ | журнал использования | journaux d’utilisation | nhật ký sử dụng |
| model | 模型 | 模型 | モデル | модель | modèle | mô hình |
| request | 请求 | 請求 | リクエスト | запрос | requête | yêu cầu |
| response | 响应 | 回應 | レスポンス | ответ | réponse | phản hồi |
| retry | 重试 | 重試 | 再試行 | повторная попытка | nouvelle tentative | thử lại |

## Protected literals

Do not translate or rewrite Partokens, OpenAI, Codex, SDK, API, CLI, HTTP, JSON, cURL, URLs, endpoint paths, HTTP methods, header names, JSON fields, identifiers, environment variables, placeholders, `DocsItemId`, section ids, hashes, routes, model IDs, error codes, or command-line arguments. Code behavior and request examples must remain structurally identical across locales. Human-readable labels may be translated.

## Update gate

Adding a catalog item or changing English semantics requires the same change in all seven locale modules in one release. The content tests derive IDs from `docsCatalog`, reject missing locale documents, compare section/block/endpoint/code structure against English, and exercise the English fallback with an injected missing-content case. Build and release checks require seven independent `docs-<locale>` chunks.

Engineering translations must be reported as not yet reviewed by native-language reviewers. Do not claim human review unless it was actually completed.
