# Phoenix Gaming Zone

Operator control center for the shop floor: start sessions, allocate PS5s and accessories, run live timers, bill by the hour, and see revenue from completed sessions.

## What you can do

- See which stations are free or in use
- Start a session as a named customer or a walk-in
- Pick a poster-style package (1–4 players, racing wheel, wheel + VR)
- Watch a timer that survives refresh — it is calculated from the start timestamp
- End a session, confirm the bill (min 1 hour, then +30 minutes), optionally override / comp
- Add asset types, units, and packages from Setup without changing code
- Soft-delete a customer or asset (history stays); restore them from the deleted list
- Review history and reports from stored charges, not running counters
- See accessories on the floor grouped by type with in-use / available counts

## Run locally

```bash
npm install
npm run dev
```

Opens on [http://127.0.0.1:43147](http://127.0.0.1:43147).

Demo logins (password for both is `phoenix`):

- Owner / Admin: `owner@phoenix.local` — full access
- Employee: `staff@phoenix.local` — floor, active, history, and view-only customers. Reports and Setup are hidden, including by URL.

Data is saved in this browser. Refresh and reopen keep active sessions.

## Install as an app (PWA)

After you deploy over HTTPS (or run `npm run build` then `npm run preview`), browsers can install Phoenix Zone to the home screen.

- Chrome / Edge: Install app in the address bar
- Safari (iPhone): Share → Add to Home Screen

The app shell and photos stay cached so the floor still opens offline. Session data is already stored in this browser. Dev mode (`npm run dev`) does not register the service worker.

## Billing

Default shop rule:

- Minimum **1 hour**
- Then increment **30 minutes**, rounded **up**

Example: 1h 25m at ₹250/hr bills 1h 30m → ₹375. Change this in **Setup → Business**. Rates live on packages, not in source code.

## Supabase

The UI talks to a local store today so the shop can run without cloud keys. Schema for a later cutover is in `supabase/migrations/0001_phoenix_zone.sql`.

When you have a project:

1. Run the migration in the Supabase SQL editor
2. Copy `.env.example` to `.env`
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Create operator users in Supabase Auth (email/password, no public signup)

## Deploy on Vercel

1. Import the repo
2. Framework preset: Vite
3. Add the two `VITE_SUPABASE_*` env vars when you are ready to leave local mode

## Brand

Product photos and the shop logo live in `public/images` (copies of `design-assets/`).
