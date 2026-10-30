# Reusable Media Picker

`src/components/common/dashboard/MediaPicker.jsx` is a controlled image picker.
Single-image fields use a string; galleries use an array of strings. Selection,
replacement, removal, URL fallback, upload and immediate preview share this
component. Removing a draft selection never deletes the library record.

`mediaBinding` in `src/lib/dashboard/media.js` maps confirmed request fields and
checks that they actually exist in the operation schema before showing a picker.
`MutationDialog` uses this mapping and validates permanent URLs before saving.
The custom course preview uses the same picker.

## Confirmed form support

| Form | Existing mutation | Saved field |
| --- | --- | --- |
| Course create | POST facilitator/courses | thumbnail (string) |
| Class/workshop create | POST facilitator/classes | thumbnail (URL) or thumbnailMediaId (Media Library ID) |
| Product create | POST facilitator/products | images (string array) |

The checked-in `operations.json` and `docs/atlas-api-inventory.json` do not
establish image mutation fields for Category, Blog, Meditation, facilitator
profile, lessons or separate video-thumbnail settings. Category mutations accept
name/reason/version; Blog and Meditation have public/learner read and playback
flows but no facilitator authoring contracts in this project. Existing
course/class/product PATCH examples also omit thumbnail/images. Their saved
images remain visible in edit dialogs, but replacement cannot be submitted
there without a documented PATCH field. Class create supports the mutually
exclusive `thumbnail` URL and `thumbnailMediaId` Media Library alternatives;
the UI omits the unused one.

## Media transport and permissions

- Library: GET media?page=...&limit=20, then GET media/:id before selection.
- Upload: existing POST media/uploads/IMAGE multipart file/title flow.
- Private preview: POST media/:id/access-link with {}, followed by the matching
  authenticated file proxy; expiresAt and expiresIn bound the grant lifetime.
- Private images cannot be saved into public URL fields. The explicit
  "Make public & select image" button fetches the latest record/version and calls
  PATCH media/:id with {version, title, visibility: "PUBLIC"}. It selects only
  the permanent publicPath actually returned by the successful response. The
  UI explains that making an image public permits anyone to view it.
- Form state retains the permanent backend path. `permanentMediaHref` resolves
  /api/v1/public/media/:id/file to the existing /api/public/files/media/:id/file
  proxy for previews, matching the public site's existing RecordMedia renderer.
- CSRF, HttpOnly session authentication, facilitator verification, range
  streaming and backend ownership checks continue through the existing proxy.
- Signed links are held in preview state only and cannot become form image URLs.

## Verification

Run `npm.cmd test`, `npm.cmd run build`, then `npm.cmd run test:media-browser`.
The browser test uses installed headless Edge, intercepted account requests and
a local public API fixture server that reads the saved test records. Test data
exists only in the test process; no live account/database/storage writes occur.

Coverage includes uploads, secure private previews, versioned media updates,
Course/Class/Product selection and immediate preview, draft replacement/removal,
create payloads, list/detail/reload/public website rendering, explicit private
image publication, saved edit previews, learner permission boundaries and mobile
layout. A screenshot of the course live preview is written to
`artifacts/media-flow/course-picker-preview.png`.

Live backend persistence and public availability must still be verified against
an authenticated test account. Fixture-based end-to-end checks do not establish
undocumented backend fields or image update support.
