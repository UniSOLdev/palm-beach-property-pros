# Public Site Protection

*Palm Beach Property Pros — marketing vs admin separation*

## Core rules

1. **Public marketing is production-protected.** Do not edit protected paths unless the user explicitly requests a marketing or homepage change.
2. **`app/(site)/**` changes require explicit approval** before merge or deploy (homepage, header, footer, service pages).
3. **Site Studio (`/admin/website`) does not affect the public homepage** at runtime. There is no publish-to-site flow yet—edits stay in Supabase `cms_sections` for admin preview only.
4. **Admin work stays in admin paths** (`app/admin/**`, `components/admin/**`, `lib/admin/**`).

---

## Public-site protection checklist (before merging admin work)

- [ ] No edits under protected directories (see below) unless marketing was requested
- [ ] `app/(site)/page.tsx` still renders `<PremiumHomePage />` only (no `getHomeCmsSections()`)
- [ ] `components/marketing/premium-home-page.tsx` has no Supabase/CMS imports
- [ ] `components/site-header.tsx` still uses dark graphite nav + `/brand/pbpp-wordmark-light.svg`
- [ ] Run `npm run verify:public-homepage` (must pass)
- [ ] Run `npm run type-check` and `npm run build`
- [ ] Visually spot-check `/` on preview: dark hero, not light “Done Right” layout

---

## Protected public files and directories (do not change casually)

```
app/(site)/
  page.tsx                    ← locked homepage entry
  layout.tsx
  services/**
  pricing/page.tsx
  quote/**
  service-area/page.tsx
  privacy/page.tsx

components/marketing/
  premium-home-page.tsx       ← production homepage (source of truth)

components/site-header.tsx
components/site-footer.tsx
components/brand-logo.tsx     ← footer/legacy; header uses wordmark SVG
components/faq-accordion.tsx
components/mobile-cta-bar.tsx
components/json-ld.tsx
components/invoice/             ← public invoice template (/i/*)

lib/services.ts
lib/faq.ts
lib/site.ts
lib/linkr.ts
lib/home-service-summaries.ts

public/brand/
public/logo.png

tailwind.config.ts              ← brand colors (graphite, aqua, navy, etc.)
app/globals.css                 ← marketing utilities (.glass-panel, .btn-primary-lg, etc.)
next.config.ts                  ← e.g. Unsplash image domains for hero
```

### Homepage lock (critical)

| File | Role |
|------|------|
| `app/(site)/page.tsx` | Must only import and render `PremiumHomePage` |
| `components/marketing/premium-home-page.tsx` | Hard-coded production layout and copy |

**Do not** wire `getHomeCmsSections()` back into the public homepage without a designed, reviewed publish flow.

---

## Admin-safe files and directories (extend freely)

```
app/admin/**
components/admin/**
lib/admin/**
  actions/**
  (task, job, invoice, expense, cms, etc.)

app/i/**                        ← public invoice route (admin data, separate template)
middleware.ts                   ← matcher: /admin/:path* only
lib/supabase/**                 ← SSR auth (no service role in browser)

supabase/migrations/**          ← admin schema only; do not drop RLS
```

Site Studio (safe, isolated):

- `app/admin/website/page.tsx` — reads `cms_sections` + `HOME_CMS_DEFAULTS`
- `components/admin/cms-studio.tsx`
- `lib/admin/actions/cms.ts`

---

## Shared files (manual review required)

| File | Why it is shared | Review before changing |
|------|------------------|-------------------------|
| `app/layout.tsx` | Root HTML, fonts, default metadata | Affects all routes |
| `app/globals.css` | Admin + marketing CSS | Keep `.admin-*` and marketing button utilities |
| `next.config.ts` | Build + `images.remotePatterns` | Re-test homepage images after edits |
| `lib/cms/home.ts` | `HOME_CMS_DEFAULTS` + `getHomeCmsSections()` | **Admin/Site Studio only**—must not be imported from `app/(site)/page.tsx` |

---

## Safe admin development workflow

1. **Branch** — Use a feature branch; avoid drive-by edits under `app/(site)/` or `components/marketing/`.
2. **Scope** — Limit PRs to `app/admin/**`, `components/admin/**`, `lib/admin/**` when doing ops work.
3. **Verify** — Run `npm run verify:public-homepage` before opening a PR with any shared-file touches.
4. **Build** — Run `npm run type-check` and `npm run build`.
5. **Preview** — Open `/` on the Vercel preview URL and confirm the **dark premium homepage** (not cream/light hero).
6. **Deploy** — Follow `DEPLOYMENT_CHECKLIST.md` pre-deploy and post-deploy sections.

---

## Do not

- Replace homepage with CMS-driven or light hero layout without explicit approval
- Change `SiteHeader` to light/cream nav during admin work
- Move admin routes into `app/(site)/`
- Import `getHomeCmsSections()` from any `app/(site)/**` page
- Expose `SUPABASE_SERVICE_ROLE_KEY` in client code (`NEXT_PUBLIC_*`)

---

## Automated check

```bash
npm run verify:public-homepage
```

Fails if the public homepage is re-coupled to CMS or loses the `PremiumHomePage` lock.

---

## Future: gated publish flow

When Site Studio should update the live site, implement an explicit **Publish to homepage** action that:

- Requires confirmation
- Updates only approved section keys
- Is documented in this file and tested in `DEPLOYMENT_CHECKLIST.md`

Until then, `PremiumHomePage` remains the public source of truth.
