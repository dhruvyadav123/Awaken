# AwakenWithMeheck source structure

The app is organized by ownership without changing public URLs:

- `app/(website)` contains public website routes such as courses, meditations, workshops, blog, shop and facilitator profiles.
- `app/(user)` contains learner routes such as auth, profile, cart and checkout.
- `app/dashboard/(user)` and `app/dashboard/(facilitator)` keep the existing `/dashboard/user` and `/dashboard/facilitator` URLs while making workspace ownership explicit.
- `components/website` contains public-page UI; `components/user` contains learner UI; `components/common` contains shared UI and the dashboard workspace shell.
- `lib` and `data` remain shared application services and content sources.

`app/page.js` and `app/[...segments]/page.js` stay at the app root because Next.js treats the home and legacy CMS fallback as shared entry routes. The small files in `components/account` and `components/dashboard` are compatibility re-exports for existing imports; their implementations live under `components/user/profile` and `components/common/dashboard`.
