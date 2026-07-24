# Dogfood Report: Partokens UI Phase 5

## Session

| Field | Value |
| --- | --- |
| Date | 2026-07-21 |
| Target | `http://127.0.0.1:8080/{locale}/console/playground` with mocked user/model and chat-completion APIs |
| Session | `partokens-phase5`, `partokens-phase5-final`, `partokens-phase5-verify` |
| Viewports | 1440x900 desktop, 390x844 mobile |
| Scope | Local-first Playground streaming, conversation management, per-conversation parameters, data portability, cross-tab synchronization, error handling, localization, and responsive behavior |

## Summary

Phase-five implementation and local acceptance are complete. Four issues were found and fixed: one medium-severity title-preservation defect and three low-severity accessibility, empty-state, and localization defects. No open critical, high, medium, or low issue remains in the tested surface.

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 3 |
| **Total** | **4** |

No real model request was made: all completion, streaming, abort, and error-state checks used local response mocks.

## Automated Checks

- Web tests: 27 passed across 7 files.
- Documentation tests: 3 passed across 1 file.
- Web and documentation TypeScript checks passed.
- Web and documentation production builds passed; 98 localized documentation pages and 102 Next routes were generated.
- Playground remains a route-level asynchronous chunk at 23.8 kB, 7.5 kB gzip.
- All seven locale dictionaries contain 526 keys with zero missing English-reference keys.
- Upstream documentation drift passed at commit `f7d8f97338f8db84c61c54da84b0b967e5ea179b`, with 102 tracked files and no changes.
- Development and production Caddy configurations validated.
- Development route smoke passed all 9 web, docs, backend, administrator, asset, health, and security-header checks against `http://127.0.0.1:8080`.
- `new-api` and `new-api-docs-v1` remain unchanged.

## Browser Acceptance

- Standard SSE parsing passed with fragmented reasoning, content, and `[DONE]` events; retry and assistant regeneration completed correctly.
- An instrumented slow stream received its `AbortSignal`, stopped before later content, and persisted the assistant message as stopped.
- Message edit-and-regenerate, delete, copy, conversation rename, search, delete, and clear-all flows passed.
- Model, group, streaming, temperature, token, and seed settings stayed independent per conversation and survived a full reload.
- Export produced a portable JSON file with no account namespace or user identifier; clear and import restored all conversations with new local identifiers.
- `BroadcastChannel` synchronized a renamed conversation across two same-context browser tabs.
- Quota, unavailable-model, HTTP 429, and HTTP 401 conditions showed the intended localized handling; 401 cleared the session and navigated to sign-in.
- A raw IndexedDB `streaming` message normalized to stopped after reload while retaining its partial content.
- French dark mode and Russian light mode passed at 390x844, including the mobile conversation sheet, modal focus isolation, full localized navigation labels, and zero horizontal overflow.
- Final browser inspection reported no runtime page errors; console output was limited to development-server and React DevTools information.

## Findings

### ISSUE-001: Hidden import control was exposed without an accessible name

**Severity:** Low  
**Area:** Local conversation data import

The visually hidden file input remained in the accessibility tree as a contextless “Choose file” control, even though imports are initiated by the labeled “Import conversations” button. This added a duplicate, unexplained action for assistive-technology users. Verification of the original state: [exposed file input](screenshots/phase5-issue-001-file-input.png).

The native input now uses the HTML `hidden` attribute. The visible labeled button still opens the picker programmatically, while the duplicate control is removed from the accessibility tree. Retesting exposes only the labeled export, import, and clear actions, with no duplicate file control. Verification: [fixed local-data dialog](screenshots/phase5-issue-001-fixed.png).

### ISSUE-002: Clearing all conversations left the previous title visible

**Severity:** Low  
**Area:** Local conversation data management  
**Repro video:** N/A; the local recording backend could not produce a video because `ffmpeg` is not installed. Step-by-step screenshots are included.

After clearing all browser-local conversations, the list and storage count correctly returned to empty, but the disabled conversation-title field still displayed the title of the deleted conversation. The same stale state can affect deleting the final conversation.

1. Import or create one or more local conversations. [Before clearing](screenshots/phase5-issue-002-step-1.png)
2. Open Local data and choose Clear all. [Clear action](screenshots/phase5-issue-002-step-2.png)
3. Confirm the browser prompt. The conversation list is empty while the previous title remains visible. [Stale title result](screenshots/phase5-issue-002-result.png)

The shared current-conversation synchronization path now clears the title draft whenever no conversation is selected, covering both bulk-clear and last-conversation deletion. A browser retest repeated the import-and-clear sequence without a reload; the title field is empty after the list returns to zero. Verification: [fixed empty state](screenshots/phase5-issue-002-fixed-final.png).

### ISSUE-003: The first message overwrote a manually renamed empty conversation

**Severity:** Medium  
**Area:** Conversation naming  
**Repro video:** N/A; `ffmpeg` is unavailable in the local acceptance environment.

Renaming an empty conversation succeeded and synchronized to another tab, but submitting its first message replaced the manual title with the first 72 characters of that message. Renaming after the first message was a workaround, but the saved user choice should take precedence.

1. Create an empty conversation and rename it to a custom title. [Manual title before sending](screenshots/phase5-issue-003-before-fixed-flow.png)
2. Send the first message.
3. Observe that the custom title is replaced by the message content.

Automatic first-message naming is now restricted to conversations whose title still exactly matches the localized “New conversation” label. A pure contract test covers unnamed, manually named, and existing-message cases. Browser retesting confirms that the custom title remains after a complete streamed response. Verification: [fixed title preservation](screenshots/phase5-issue-003-fixed.png).

### ISSUE-004: Russian mobile navigation truncated the Image Studio label

**Severity:** Low  
**Area:** Mobile localization and navigation

At 390x844, the Russian label “Студия изображений” was forced onto one line and truncated with an ellipsis in the fixed bottom navigation. Other navigation remained usable and the page had no horizontal overflow, but a primary destination name was incomplete. Verification of the original state: [Russian mobile light mode](screenshots/phase5-ru-mobile-light.png).

The bottom-navigation label track now uses a fixed-height, centered two-line area, keeping long localized labels readable without moving icons or increasing the navigation height. Retesting at 390x844 shows the full Russian label on two lines and a 390 px document width. Verification: [fixed Russian mobile navigation](screenshots/phase5-issue-004-fixed.png).

## Release Gate

- Phase-five implementation and local acceptance: **passed**.
- Public release preflight: **waiting for operator input**. `PUBLIC_PARTOKENS_SOURCE_URL` must be the real HTTPS location of the complete corresponding source; the check intentionally rejects a missing value.
