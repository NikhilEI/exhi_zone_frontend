# Exhibitor Zone — Frontend

Standalone Next.js app for the Exhibitor Zone portal (login/register, exhibitor
dashboard, cart/orders/passes, mandatory forms, admin panel). Extracted from
the Wellness India Expo frontend (`src/app/exhibitor-zone`) so it can be
integrated into other projects independently — same UI, same components,
same routes.

`/` redirects to `/exhibitor-zone`, which is the actual app (own root layout,
own design system in `ez-globals.css`, unrelated to any other project's
Bootstrap/marketing styles).

## Setup

```
npm install
npm run dev
```

Runs on port 3020. Talks to the backend via `NEXT_PUBLIC_API_BASE_URL`
(`.env.local`, defaults to `http://localhost:4020/api`) — see `../backend`.
