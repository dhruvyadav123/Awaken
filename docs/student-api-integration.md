# Public and student API integration

The existing public pages, student routes, authentication cookies, CSRF checks, role checks and visual layout are preserved. Sign-in preserves a safe internal return path to the selected checkout or resource, with role checks and external/unsafe targets rejected. Legacy cart, checkout, application and profile entry points now lead to the corresponding working flow. No administrator or facilitator management endpoints were added.

| Area | Connected API flow | Main corrections |
| --- | --- | --- |
| Shop and cart | Public products → GET cart → POST/PATCH/DELETE cart items | Variant availability and prices; current cart version in mutations; unavailable item messages; server totals. |
| Checkout | Addresses → POST checkout/quote → POST checkout → order details | Delivery only when required; variant IDs and quantities preserved; quote expiry; stable retry idempotency; no payment success inferred from a URL. |
| Addresses | List, detail, create, edit, default and delete | Pagination, fresh detail/version reads, mutation locks, validation, form reset and errors. |
| Orders | List, detail and cancel | Order/payment/fulfillment status, line items, delivery snapshot, totals, pagination and cancellation version. Existing payment/refund pages remain connected. |
| Classes | List, detail, registrations, cancel, join, recording | Registration version rather than class version; server join/access and recording flags; joining window explanation and refresh. |
| Sessions | Public types/slots → booking → detail → join/cancel/reschedule | Snapshot titles and slug, timezone display, real availability selection, versioned rescheduling/cancellation and join gating. |
| Learning | Courses → enrollment → lessons → access-link/files → progress | Enrollment/course IDs kept distinct; fresh protected media grants; progress and completion response fields. |
| Questions and reviews | Lesson question → list/detail/replies; course review → list/edit | Actual reply array and moderation status; prompt/body fields; versioned review edit and pagination. |
| Quizzes | List/detail → attempt → answer submission → result/history | `prompt`, question/option IDs, passing percentage, attempt limit, backend score/pass result and pagination. |
| Membership | Current nested membership, details, activate, renew, cancel, history and course discount | `membershipId` on history links, renewal eligibility and pricing, selected plan lookup, stable mutation keys and current period vs access expiry. |
| Meditations | List/detail → content → access-link → protected file | Conditional access, audio/video playback, expiry/refresh, pagination and explicit playback/API errors. |
| Profile | GET/PATCH profile | Only the tested mutable `name` field is submitted; other existing profile fields remain visible. |
| Application | User-owned draft create/edit, document upload/download/delete, submit/reopen/status | ISO dates normalized for date inputs; masked bank numbers never sent as account numbers; status-based edit controls and versioned operations. |
| Dashboard | GET me/dashboard?limit=5 and GET me/entitlements | Real summary, courses, sessions, orders and access data; existing sections remain available. |

Validation:

- `node --test tests/*.test.mjs`: 70 tests pass, including allowlisted lifecycle methods/bodies, CSRF/role checks, binary grants, cart versions, variants, checkout validation, incomplete responses and backend 403/409/422/429 responses.
- Production `next build`: passes.
- ESLint for changed application files: passes.
- `node tests/student-browser.mjs`: isolated browser checks for addresses, cart, quote expiry, checkout retries, order cancellation, class registration/cancellation, session rescheduling, enrollment, lesson playback/progress, questions/replies, reviews, quizzes, membership lifecycle/history, meditation playback, application upload/submit, profile, dashboard and mobile width. It additionally exercises the public session calendar through a test-only server fixture.
- `node tests/digital-library-browser.mjs`: previous digital-library pagination, details, fresh-grant download, error/access restrictions and mobile layout pass.

Limits and remaining external verification:

- Live read-only requests to public categories, courses and classes returned 200/success. Subsequent public catalogue requests returned 429 (`Too many requests. Try again later.`). Further live requests were stopped. These responses are surfaced as errors and are not treated as empty catalogues or missing sessions.
- Browser lifecycle tests intercept APIs or use an isolated test-server fixture. No test fixture is imported by production application code, and no live purchase/account mutation was performed. Live authenticated account, real payment-provider and complete live catalogue verification still require an available authenticated session and a backend without throttling.
- The unsupported wishlist remains an explicit unavailable state. Its existing page/route was preserved; no wishlist mutation was invented.
- The existing `public/videos/forest-mobile.mp4` is empty (0 bytes). Browser media checks generate a valid video in the isolated browser when this asset is empty. The production asset was preserved and requires restoration from the intended source separately.

Cart, blog and dashboard follow-up (2026-10-15):

- Cart renders actual product media, variant, final unit price and backend line totals. Summary uses server subtotal/discount/total without inferred arithmetic. Quantity/remove actions retain current cart versions, lock repeated clicks, surface failures and show success only after the refreshed server cart arrives. Failed mutations block checkout until resolved or refreshed.
- Blog listing, detail hero and related articles share the public media renderer, including loading/error/retry states. Public media paths resolve through the existing proxy; thumbnailUrl is recognized and full-height covers are no longer capped by compact preview CSS.
- Removed the promotional sidebar card from both workspaces and decorative welcome/quote banners. The create-course action remains in the facilitator toolbar. Real course/order/booking sections remain available. The legacy overview shows its session banner only when an actual upcoming session exists.
- Validation: 71 unit/contract checks, changed-file ESLint and production build pass. Extended isolated browser regression passes: cart image decoding, quantity 1-to-2 and line total 240-to-480, failed removal preserving the item, successful retry emptying the cart, and blog cover decoding with the normalized uploaded-media path.
- Live public blog detail and uploaded image were checked: 200 JSON and 200 image/png (4,499,463 bytes). Another returned article has featuredImageMediaId=null and no featuredImage; that article needs an image assigned in its source record. No live user cart was mutated.
