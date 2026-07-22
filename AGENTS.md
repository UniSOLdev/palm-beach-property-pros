# AGENTS.md

## Cursor Cloud specific instructions

Palm Beach Property Pros is a single Next.js 15 (App Router) app that bundles a public
marketing site, an auth-gated admin CMS/back-office, and tokenized public document flows
(quotes/invoices/e-signature). Standard commands live in `package.json` (`dev`, `build`,
`lint`, `type-check`, `db:push`, plus `media:*`/`verify:*` scripts).

### Running / verifying
- Dev server: `npm run dev` (Next.js on `http://localhost:3000`). This is the primary run command.
- Lint: `npm run lint`. Types: `npm run type-check`. Prod build: `npm run build`.
- The public marketing site (`/`, `/services/*`, `/projects`, `/quote`, `/service-area/*`)
  renders fully WITHOUT any Supabase env vars. Every `lib/site-content` query catches the
  "missing env" throw and falls back to static content + the filesystem media manifest, so
  `npm run dev` boots and serves the homepage with zero configuration.

### Gotcha: never run `next build` while `next dev` is running
Both share the `.next/` directory. Running `npm run build` concurrently with (or interleaved
with) a live `npm run dev` corrupts the dev server's client chunks, producing 404s on
`/_next/static/*` assets and breaking React hydration/interactivity (e.g. conditional form
fields silently stop working) even though pages still return HTTP 200. If interactivity
breaks this way: stop the dev server, `rm -rf .next`, and restart `npm run dev`.

### Supabase (required only for admin + dynamic features)
- No local database/`supabase start` stack is configured. The app connects to a REMOTE hosted
  Supabase project (ref `pfojtrfkeoeymmtkvijo` per `supabase/config.toml` / `.env.example`).
- Admin routes (`/admin/*`, gated by `middleware.ts`), quote-request persistence, invoices,
  e-signature, media library, and DB-backed CMS content require these env vars (set as Cloud
  secrets, not committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` (server-only, for lead photo uploads). Without them, `/quote`
  submission returns a "config" error by design and admin data reads fail.
- `OPENAI_API_KEY` is optional — only the admin receipt/expense OCR and AI copy use it, and
  they degrade gracefully when it is absent.
- `npm run db:push` applies `supabase/migrations/*.sql` to the remote project via the Supabase
  CLI (invoked through `npx`); it needs `SUPABASE_ACCESS_TOKEN` for non-interactive link/push.
  After schema changes, assign an owner via `user_roles` before admin login works (see
  `IMPLEMENTATION_SUMMARY.md`).
