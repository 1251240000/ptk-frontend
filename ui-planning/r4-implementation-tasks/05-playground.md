# R4.5 Playground

Depends on: `00-scope-and-foundation.md`, R4.3 shared Console shell
Design baseline: active design-lab Playground screen plus the approved R3.5 workflow/data contract
Server interaction: session-authenticated New API Playground completion

## 1. Scope

Implement the design-lab full-height Playground workspace at:

- `/{locale}/console/playground`
- `/{locale}/console/playground/{chatId}`

Included capabilities:

- Browser-local multi-conversation history with user namespace isolation.
- New, select, rename, search, delete, clear, import, and export.
- Continuous message document, copy, edit-and-regenerate, delete, stop, and regenerate.
- Model, group, streaming, temperature, top-p, max-token, penalty, and seed controls.
- Local storage usage and explicit persistence/transport disclosures.
- Desktop conversation rail and approved mobile history drawer.

## 2. Design lock

- Preserve the active design-lab Playground composition, heights, desktop rail, mobile toolbar/drawer, header controls, Message Route, message rows, assistant accent rail, parameter surface, composer, and empty/loading/stream states.
- Do not convert messages into chat bubbles or wrap the workspace in decorative cards.
- Preserve stable composer and message geometry while sending, streaming, stopped, failed, or complete.
- Keep the approved mobile bottom navigation and Console shell relationship.
- The Message Route must continue to distinguish local persistence from network transport.

## 3. Data boundaries

```text
Conversation metadata/messages -> IndexedDB, ownerNamespace = user:<id>
Submitted prompt/context       -> /pg/chat/completions -> selected provider
Model/group availability       -> authenticated user model/group APIs
Revealed API keys              -> never used by Playground
```

The backend does not persist the local conversation library. The UI must not claim that messages remain local after submission; it must state that submitted content passes through Partokens to the selected model provider.

## 4. API contract

| Need | Source |
| --- | --- |
| Model options | `GET /api/user/models?group=` |
| Group options | `GET /api/user/self/groups` |
| Non-stream/stream completion | `POST /pg/chat/completions` through existing Playground API client helpers |
| Authentication/session refresh | existing shared auth runtime |

1. Reuse the current completion and SSE parsing adapters rather than calling `fetch` from page components.
2. Preserve OpenAI-compatible message ordering and only send parameters supported by the established adapter.
3. Treat explicit zero/false parameter values as intentional and distinguish them from absent values.
4. Cancel the active stream with `AbortController` without deleting already received content.
5. Normalize server/provider errors into localized categories without showing raw payloads.
6. On session expiry, preserve the local draft/conversation and route through sign-in return handling.

## 5. Local repository contract

1. Reuse or migrate the existing Dexie repository; do not create a second persistent conversation database for the new view.
2. Keep `ownerNamespace = user:<id>` isolation and test two ordinary users in one browser profile.
3. Preserve stable schema versioning and an explicit migration path for existing production conversations.
4. Normalize interrupted `streaming` messages to `stopped` on reload while retaining generated text.
5. Rebuild imported conversation/message IDs, rewrite owner namespace, validate schema and size, and normalize transient states.
6. Delete/clear actions affect only the active namespace and require approved confirmation.
7. Do not inject design sample conversations into a real user's library.
8. Account sign-out hides the prior namespace without leaking titles or messages to the next user.

## 6. Interaction subtasks

### 6.1 Conversation rail

1. Implement design-lab time grouping, active state, search, create, rename, delete, and local-data entry.
2. Preserve current route when renaming and navigate deterministically when deleting the active conversation.
3. Keep loading and storage operations from changing rail width or toolbar placement.
4. Reproduce mobile drawer focus, body-lock, Escape, and trigger-focus restoration.

### 6.2 Message workspace

1. Load the URL conversation or redirect to a deterministic valid/new route.
2. Save the first user message synchronously with conversation creation to avoid React state timing loss.
3. Render Markdown/code using existing safe components or a reviewed structured renderer; never inject raw model HTML.
4. Keep copy/edit/delete/regenerate controls aligned with the approved message row.
5. When editing, truncate or branch according to the existing confirmed behavior; document the exact choice in tests.
6. Announce streaming progress without re-announcing the full response on every token.

### 6.3 Model and parameters

1. Map real group/model results into the approved controls without hard-coded options.
2. Preserve a selected option only while it remains valid for the current user/group.
3. Validate parameter ranges locally and let the server remain authoritative.
4. Keep saved per-conversation parameters in IndexedDB and exclude unrelated UI preferences.
5. Do not send empty, unsupported, or invalid numeric fields.

### 6.4 Local data management

1. Reproduce storage usage, export, import, delete-one, and clear-all surfaces.
2. Export a versioned, non-sensitive JSON format.
3. Reject malformed, incompatible, oversized, or cross-type imports with localized actionable feedback.
4. Keep destructive actions explicit and scoped to the signed-in namespace.

## 7. i18n and accessibility

- Move approved Playground copy into all seven permanent locales.
- Keep the two persistence/transport disclosures complete in every locale.
- Long conversation titles truncate only in the rail's approved single-line title slot and remain available to assistive technology/tooltips.
- Composer, message actions, drawers, dialogs, switches, numeric inputs, and streaming status are fully named.
- Keyboard users can reach rail, workspace, parameters, composer, message actions, and overlays in a predictable order.
- Reduced motion disables nonessential message/overlay transitions without delaying content.

## 8. File ownership and cleanup

Expected production areas:

```text
apps/web/src/pages/workbench-pages.tsx
apps/web/src/features/playground/*
apps/web/src/db.ts
apps/web/src/lib/playground.ts
packages/api-client/src/*
packages/i18n/src/*
packages/design-system/src/*
```

After migration, remove the replaced Playground page markup/styles, duplicate local repositories, obsolete sample fixtures, and dead parameter/message helpers. Keep one schema and one canonical route implementation.

## 9. Acceptance

- Production Playground matches the active design-lab page at all required viewports/themes and retains the full-height workspace without page overflow.
- Model/group loading, empty, permission, partial, and failure states stay within the approved control layout.
- Streaming, stop, failure, retry, edit/regenerate, refresh interruption, and session expiry preserve local content correctly.
- Two users cannot see or mutate each other's local conversations.
- Import/export and schema migration preserve supported data and reject unsafe input.
- No API key is created, selected, revealed, or stored for Playground.
- Seven locales, long conversation content, keyboard/focus, screen-reader status, and reduced motion pass.
- Old Playground presentation and duplicate persistence code are removed after cutover.
