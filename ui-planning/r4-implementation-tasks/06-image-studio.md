# R4.6 Image Studio

Depends on: `00-scope-and-foundation.md`, R4.3 shared Console shell
Design baseline: active design-lab Image Studio screen plus R3.6 workflow/data contract
Server interaction: New API OpenAI-compatible image relay with an explicitly selected user key

## 1. Scope

Implement the design-lab Image Studio at:

- `/{locale}/console/studio`
- `/{locale}/console/studio/{projectId}`

Included capabilities:

- Browser-local projects, node graph, viewport, selection, connections, and assets.
- Prompt, reference/source image, generated result, and note nodes as approved by the active design.
- Project create/select/rename/delete, import/export, and local storage management.
- Model/group/settings selection, explicit API-key selection and reveal, image generation, image editing where supported, cancellation, retry, and local result materialization.
- Desktop canvas controls and approved mobile project/tool/settings layers.

## 2. Design lock

- Preserve the active design-lab shell, project rail, canvas, node dimensions, connector treatment, selection/drag states, toolbar, inspector/settings, generation controls, credential state, result grid, overlays, zoom controls, and mobile layers.
- Do not replace the node canvas with a form-and-gallery page.
- Do not frame the primary canvas in an additional decorative card.
- Stable node, toolbar, and canvas dimensions are required so loading/result/error content does not resize the workspace.
- Use the approved image assets for visual comparison; real results replace sample results only during API-state tests.

## 3. Security and data boundaries

```text
Project graph/assets -> IndexedDB and browser Blob storage, ownerNamespace = user:<id>
Key list            -> session-authenticated /api/token/
Selected key reveal -> session-authenticated /api/token/:id/key after explicit confirmation
Revealed key        -> memory only for the active Studio session
Generation/edit     -> Bearer key to /v1/images/generations or /v1/images/edits
```

There is no session-authenticated `/pg/images/*` contract. Do not imply that the key reveal has password/2FA step-up when New API does not provide it. The UI must disclose the actual session and memory boundary.

## 4. API and capability contracts

| Need | Source |
| --- | --- |
| Groups/models | authenticated user group/model endpoints |
| Optional pricing/capability hints | `GET /api/pricing`, treated as incomplete hints |
| Candidate keys | `GET /api/token/` |
| Explicit key reveal | `POST /api/token/:id/key` |
| Text-to-image | `POST /v1/images/generations` |
| Image edit | `POST /v1/images/edits` multipart |

1. Reuse `@partokens/studio` for credential memory and generation/capability adapters.
2. Maintain a model capability registry with safe defaults and reviewed overrides. Do not send every setting to every model.
3. Preserve explicit zero/false values and omit absent optional request fields.
4. Support response images returned as `url` or `b64_json`.
5. Materialize retained remote URLs into local Blobs promptly because upstream URLs may expire.
6. Treat pricing endpoint type metadata as advisory when it conflicts with authenticated model availability; show the uncertainty instead of hiding a valid configured model.
7. Surface upstream validation/capability errors on the relevant generation surface without exposing credentials or raw transport payloads.

## 5. Local repository and migration

1. Reuse/migrate the existing Studio Dexie schema and `ownerNamespace`; do not create a second production project database.
2. Preserve project, node, connection, settings, viewport, asset metadata, and schema version fields required by the approved design.
3. Migrate existing local projects transactionally and keep a recoverable export path before destructive schema changes.
4. Store retained image assets as Blobs/object references, revoke temporary object URLs, and handle missing/evicted assets without breaking canvas geometry.
5. Validate imported project type, schema, size, MIME, node bounds, connection references, and asset counts; regenerate IDs and owner namespace.
6. Sign-out and user changes hide previous namespaces and immediately clear the in-memory Studio credential.
7. Never inject design sample projects into an established production namespace.

## 6. Interaction subtasks

### 6.1 Project and canvas shell

1. Reproduce project create/select/rename/delete/import/export and desktop/mobile navigation.
2. Preserve viewport pan/zoom, fit/reset, selection, dragging, connection creation/removal, node create/duplicate/delete, and keyboard behavior defined by the approved design.
3. Keep pointer/touch interactions bounded so the page itself does not scroll or overflow unexpectedly.
4. Persist graph and viewport changes with a controlled debounce and flush important changes on route/page lifecycle events.

### 6.2 Nodes and assets

1. Implement prompt, source/reference, result, and note node states using approved node dimensions and internal layouts.
2. Validate file count, MIME, size, dimensions, and decode errors before persistence or upload.
3. Keep alt/name metadata localized where it is interface copy; retain user-provided names as user data.
4. Handle missing, failed, loading, generated, cancelled, and error assets without moving connectors or controls.

### 6.3 Credential flow

1. List only keys owned by the user and show enough restrictions to make a safe selection.
2. Require explicit confirmation before revealing a selected key and explain the real security boundary.
3. Validate that the selected key is active and plausibly compatible without claiming guarantees the backend cannot prove.
4. Keep the full key in module/session memory only; clear it on sign-out, user change, tab close lifecycle, route/session reset, or explicit lock.
5. Never silently fall back to an unrestricted key or reveal multiple keys.

### 6.4 Generation and editing

1. Validate prompt, selected model, count, size/aspect, model-specific settings, reference input, and credential before the request.
2. Disable duplicate generation and provide cancel via `AbortController`.
3. Map text-only requests to generations and eligible reference workflows to multipart edits.
4. Preserve design-lab idle, credential-required, validation, loading, progressive result, success, partial result, cancelled, error, and retry states.
5. Add result nodes deterministically and persist retained assets only after successful materialization.
6. Do not charge-estimate from unverified client assumptions; show server/pricing hints as estimates with clear unavailable states.

## 7. i18n, accessibility, and performance

- Merge all approved Studio copy into seven complete locales.
- Keep model names, prompt/user content, technical settings, and generated metadata semantically accurate.
- Name icon tools with localized tooltips and accessible labels.
- Canvas nodes, connections, selection, toolbars, settings, sheets, and dialogs must be keyboard discoverable; provide a non-pointer route for core creation/generation actions.
- Mobile layers manage focus, body scroll, Escape/back actions, and return focus.
- Reduced motion removes canvas/overlay animation that is not required for state comprehension.
- Large projects use bounded rendering/persistence work and do not leak object URLs or credentials.

## 8. File ownership and cleanup

Expected production areas:

```text
apps/web/src/pages/studio-page.tsx
apps/web/src/features/studio/*
apps/web/src/db.ts
packages/studio/src/*
packages/api-client/src/*
packages/i18n/src/*
packages/design-system/src/*
```

After migration, remove replaced Studio presentation, duplicate graph stores, sample generation branches, dead credential helpers, obsolete CSS, and any second local schema. Preserve required AGPL notices, modification records, and source-availability obligations for reused Studio code.

## 9. Acceptance

- The production Studio matches the active design-lab workspace at required viewports/themes, including fixed canvas/node/tool geometry and mobile layers.
- Existing local projects migrate without cross-user leakage or asset loss in supported cases.
- Credential reveal is explicit, memory-only, single-key, and fully cleared at all session boundaries.
- Generation/edit support real URL/base64 responses, cancellation, partial/failure states, model capability variation, and retained local assets.
- Invalid or oversized imports/assets fail safely and do not corrupt the active project.
- Seven locales, keyboard/focus, screen-reader naming, touch/pointer, reduced motion, and no page-level overflow pass.
- No key, bearer header, raw upstream payload, or sensitive image metadata enters persistence, logs, screenshots, or URLs.
- Old Studio presentation, sample-only branches, and duplicate stores are removed after cutover.
