# Seven-locale content matrix

The IDs below are derived from `docsCatalog`. Unit tests loaded every locale module and checked `hasLocalizedDocsDocument(id, locale) === true` for all 126 combinations.

| DocsItemId | zh-CN | zh-TW | en | ja | ru | fr | vi |
| --- | --- | --- | --- | --- | --- | --- | --- |
| welcome | localized | localized | localized | localized | localized | localized | localized |
| overview | localized | localized | localized | localized | localized | localized | localized |
| first-request | localized | localized | localized | localized | localized | localized | localized |
| clients | localized | localized | localized | localized | localized | localized | localized |
| api-keys | localized | localized | localized | localized | localized | localized | localized |
| billing | localized | localized | localized | localized | localized | localized | localized |
| models-pricing | localized | localized | localized | localized | localized | localized | localized |
| codex | localized | localized | localized | localized | localized | localized | localized |
| sdk | localized | localized | localized | localized | localized | localized | localized |
| image-studio | localized | localized | localized | localized | localized | localized | localized |
| api-basics | localized | localized | localized | localized | localized | localized | localized |
| chat-completions | localized | localized | localized | localized | localized | localized | localized |
| image-api | localized | localized | localized | localized | localized | localized | localized |
| models-api | localized | localized | localized | localized | localized | localized | localized |
| faq | localized | localized | localized | localized | localized | localized | localized |
| troubleshooting | localized | localized | localized | localized | localized | localized | localized |
| usage-logs | localized | localized | localized | localized | localized | localized | localized |
| contact-support | localized | localized | localized | localized | localized | localized | localized |

Additional contract checks passed for locale-owned object identity, summary/prerequisite coverage, section IDs, block types, endpoint methods and paths, link targets, code behavior, inline technical literals, human-readable code labels, and locale-specific search text. The injected missing-French case returned the English object and `hasLocalizedDocsDocument=false`, proving the defensive fallback remains operational.
