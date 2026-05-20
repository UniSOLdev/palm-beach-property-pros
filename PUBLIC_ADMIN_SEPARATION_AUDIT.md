# Public / Admin Separation Audit

*May 20, 2026 — homepage mismatch remediation*

## Root cause

The Vercel preview branch (`cursor/homepage-hero-pricing-cta-polish`) showed the **wrong homepage** because:

1. **Admin platform commit** (`1891ac9`) moved the homepage into `app/(site)/page.tsx` and wired **Supabase CMS** (`getHomeCmsSections()`).
2. **CMS / code defaults** used the light redesign copy: *"Palm Beach County Property Care — Done Right."* with cream/white hero and `BrandLogo` image header.
3. **Live production** at [palmbeachpropertypros.com](https://www.palmbeachpropertypros.com/) runs a **different build** (dark graphite nav, SVG wordmark, dark hero image card, *"Property Care for Palm Beach Living"*) that was **never committed** to this repository’s tracked branches.

There was no duplicate `app/page.tsx` conflict at build time — only `app/(site)/page.tsx` serves `/`. The mismatch was **design drift**: preview = branch code; production = unpublished premium homepage.

## Fix applied

| Change | Purpose |
|--------|---------|
| `components/marketing/premium-home-page.tsx` | Restored live-style homepage sections |
| `app/(site)/page.tsx` | Thin wrapper; locked production metadata |
| `components/site-header.tsx` | Dark graphite nav + `/brand/pbpp-wordmark-light.svg` |
| `public/brand/pbpp-wordmark-light.svg` | Production wordmark asset |
| `lib/cms/home.ts` | Production copy defaults (admin CMS only) |
| `tailwind.config.ts` | `graphite`, `aqua`, `silver`, `glow` shadow |
| `next.config.ts` | Unsplash `images.remotePatterns` |
| `app/(site)/layout.tsx` | Full-width main for hero bleed |
| `PUBLIC_SITE_PROTECTION.md` | Ongoing guardrails |

## Verification

| Check | Result |
|-------|--------|
| `npm run type-check` | Run after changes |
| `npm run build` | Run after changes |
| `/admin/*` | Unchanged; middleware still admin-only |
| Marketing routes | Still under `app/(site)/` |
| Homepage CMS override | Disabled for public render (premium component) |

## Files changed (this pass)

- `app/(site)/page.tsx`
- `app/(site)/layout.tsx`
- `components/marketing/premium-home-page.tsx` (new)
- `components/site-header.tsx`
- `lib/cms/home.ts`
- `tailwind.config.ts`
- `next.config.ts`
- `app/globals.css`
- `public/brand/pbpp-wordmark-light.svg` (new)
- `PUBLIC_SITE_PROTECTION.md` (new)
- `PUBLIC_ADMIN_SEPARATION_AUDIT.md` (this file)
- `UPDATED_REMAINING_ISSUES.md`
- `DEPLOYMENT_CHECKLIST.md`

## Admin impact

**None** on admin routes. `/admin`, tasks, jobs, invoices, and Supabase auth are untouched.

## Remaining gap

- Site Studio (`/admin/website`) edits `cms_sections` but **does not** change the public homepage until a deliberate CMS→public integration is designed with safeguards.
