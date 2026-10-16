# Facilitator media integration — 14 October 2026

## Source review and boundaries

Reviewed the existing teaching route registry, workspace role verification, protected endpoint allowlist, client cookie/CSRF transport, streaming proxy, mutation schemas, version refresh, resource create/edit dialogs, category dependencies, curriculum/lesson workflows, product variants/inventory, facilitator profile and application document flows. The supplied `docs/atlas-api-inventory.json` defines the existing API requests; the user's examples supply media response fields.

Also read the neighboring `C:/Users/DELL/Desktop/awaken_admin/admin` media library, media adapter, authenticated API transport, ResourceManager serialization, course/class/product forms, course learning source and media audit for context. That client has URL-based media controls; its admin PATCH fields do not establish facilitator permissions or schemas. No admin files were changed.

No backend repository, storage configuration, database models or authoritative expanded resource schemas were found in this workspace. The inventory's historical `Desktop/aweken` path does not exist. Backend source and test credentials were requested during implementation. Client schemas and examples are insufficient to certify provider writes, ownership enforcement or undocumented attachment mutations.

## Placement decisions

| Existing module | Evidence | Implemented behavior / gap |
| --- | --- | --- |
| MediaLibrary | Existing multipart upload and access-link UI; GET `/media` missing from proxy allowlist | Added dedicated `/dashboard/facilitator/media` route/navigation. IMAGE, VIDEO, AUDIO, DOCUMENT upload; local selected-file preview; progress/cancel; list/search/type filter/pagination; GET detail; authorized preview/download; PATCH title; DELETE with current version/reason. |
| Course create | Existing `thumbnail` string field | Public image selection/upload panel in the existing create form. Reuse only ACTIVE/PUBLIC/IMAGE records with a permanent public path. Existing URL entry retained. |
| Workshop create | Existing `thumbnail` string field | Same public image control. Meeting/schedule fields retain their existing behavior. |
| Product create | Existing `images` string array | Multiple public image reuse, deduplication, selection removal/replacement before save; existing URL entry retained. |
| Course/workshop/product edit | Current PATCH examples contain title, meetingUrl or shortDescription, plus version/reason, without image fields | Previously saved thumbnail/images are displayed when editing. No guessed media PATCH field added. Persisted replace/remove remains a schema gap. |
| Curriculum | Lesson POST has courseVersion/sectionId/title/contentType; PATCH has courseVersion/sectionId | Existing teaching library remains available; existing lesson-file route unchanged. No guessed mediaId or lesson binding endpoint. |
| Facilitator profile/account | Facilitator profile PATCH contains version/displayName | No photo/cover upload added without a supported mutation. |
| Facilitator application | Separate versioned documents upload/download/delete lifecycle | Retained the dedicated application API. General media IDs do not establish private application-document references. |
| Categories, language/level setup, session types, availability, bookings, registrations, students, reviews/Q&A/quizzes, announcements, earnings/payouts, analytics and settings | No media reference fields in current mutation definitions | No unnecessary upload controls. |
| Public CMS/blog/meditation/testimonial pages | Public read routes, without corresponding facilitator editing modules/contracts | No unrelated controls or redesign. |

## Existing APIs used

- POST `/media/uploads/{kind}` with multipart `file` and `title`; IMAGE is covered by the existing generic kind route and the user's example.
- GET `/media?page=...&limit=20`; restored its exact facilitator allowlist entry.
- GET `/media/{id}`; PATCH `/media/{id}` with latest numeric version/title.
- DELETE `/media/{id}` with latest version/reason from the supplied collection.
- POST `/media/{id}/access-link` with `{}`; GET `/media/{id}/file?token=...` through the existing protected streaming proxy.
- Existing facilitator resource POST requests retain documented URL fields. No duplicate storage API, local media database, demo application records or new backend endpoint was created.

## Security and persistence

The workspace and proxy independently verify FACILITATOR identity. Bearer tokens remain in HttpOnly cookies. Multipart requests preserve browser-generated boundaries, same-origin credentials, CSRF headers and the existing refresh/retry behavior. Range streaming and `private, no-store` responses remain intact. Private preview grants are held only in component memory and normalized to the matching local protected file route; arbitrary returned hosts do not receive bearer tokens. Image/audio/video native previews support range requests. PDF documents open through authorized file links.

Progress measures browser bytes sent to the existing proxy, then waits for the backend response before marking completion. Local blob previews are released on replacement/unmount. Client validation checks kind, MIME/extension, nonempty files and a configurable client cap (`NEXT_PUBLIC_MEDIA_MAX_BYTES`, default 10 MiB). The exact provider/backend cap and MIME policy remain unconfirmed; server validation is authoritative. Client-supported formats are deliberately limited and exclude SVG/HTML.

Uploaded examples are PRIVATE with `publicPath: null`. They remain private and can be previewed in the library. They cannot populate public URL fields. Expiring token links, private proxy links and unsafe URL schemes are rejected before saving image fields. Public image selection re-fetches media details before using its permanent path. Clearing a selection detaches the draft field and never deletes shared media. Resource save continues through the existing documented mutation; edit preview uses the fresh detail response after reload.

The requested media-ID persistence and complete upload → attach → save → reload → replace/remove workflow require confirmed backend reference fields. They cannot be implemented safely by placing private IDs or expiring links into URL fields. Metadata PATCH does not document visibility changes, so no automatic PUBLIC conversion is performed. Replacing file bytes in an existing media record is also not documented: upload a new record, then change a supported reference once the resource contract is available.

## Changed files

- `src/lib/dashboard/contracts.json`: GET media allowlist correction.
- `src/lib/dashboard/navigation.js`, `src/components/dashboard/DashboardPage.jsx`: media page within existing dynamic teaching routes.
- `src/lib/client-account.js`: cancellable XHR multipart progress using the existing authentication/error/refresh handling.
- `src/lib/dashboard/media.js`: validation, permanent public URL suitability, private grant normalization and explicit contract-based field bindings.
- `src/components/dashboard/MediaLibrary.jsx`: media management lifecycle.
- `src/components/dashboard/MediaControls.jsx`, `media.css`: shared previews, upload and public image reuse controls matching workspace styles.
- `src/components/dashboard/MutationDialog.jsx`: supported create fields, URL validation, saving/closing guards during uploads, and saved-image display in edit forms.
- `tests/media.test.mjs`, `tests/dashboard-contracts.test.mjs`, `tests/media-browser.mjs`: isolated validation, transport/security and browser lifecycle checks.
- `package.json`: repeatable unit and media-browser test scripts; no dependency changes.

## Verification

- `node --test tests/*.test.mjs`: 47 tests passed, including 9 added media/security checks.
- Scoped ESLint: passed without errors or warnings after documenting native private/local preview images.
- `node node_modules/next/dist/bin/next build --webpack`: passed, 58 static pages generated. First attempt could not fetch the existing Google Fonts under restricted networking; retry with authorized network access succeeded.
- `node tests/media-browser.mjs`: passed in headless Edge with intercepted account responses. Covered all four upload kinds, multipart boundaries/CSRF, private image and document access, freshly versioned rename/reload, denying private image selection, public image reuse/create save/reload/edit display, draft selection removal without deleting shared media, versioned delete, visible upload permission errors and USER workspace denial. Desktop/mobile screenshots are saved under `artifacts/media-flow/`; the mobile page fits a 390px viewport.

Repeat with `npm.cmd test`, scoped ESLint, `npm.cmd run build -- --webpack`, then `npm.cmd run test:media-browser`. Browser tests require a completed production build and the installed Microsoft Edge executable; all account requests are intercepted. Saved-resource image replacement/removal and private media-ID attachment cannot be exercised because those facilitator mutation contracts are absent.

Live authenticated backend/storage/database verification remains pending. Browser and service fixtures are confined to tests and do not establish live provider storage, backend attachment support or production authorization.
