# Public Site Protection

*Palm Beach Property Pros — marketing vs admin separation*

## Rule

**The public marketing site is production-protected.** Do not change files listed below unless the user explicitly requests a marketing or homepage update.

Admin and operations work must stay in admin paths only.

---

## Public site (protected)

| Area | Path |
|------|------|
| Homepage (premium, locked) | `app/(site)/page.tsx`, `components/marketing/premium-home-page.tsx` |
| Site layout | `app/(site)/layout.tsx` |
| Marketing pages | `app/(site)/services/**`, `pricing`, `quote`, `service-area`, `privacy` |
| Public header/footer | `components/site-header.tsx`, `components/site-footer.tsx`, `components/brand-logo.tsx` |
| Public components | `components/faq-accordion.tsx`, `components/mobile-cta-bar.tsx`, `components/json-ld.tsx` |
| Marketing copy/data | `lib/services.ts`, `lib/faq.ts`, `lib/site.ts`, `lib/linkr.ts`, `lib/home-service-summaries.ts` |
| Brand assets | `public/brand/**`, `public/logo.png` |
| Public styles (shared) | `app/globals.css` (marketing utility classes), `tailwind.config.ts` (brand colors) |

### Homepage note

The live homepage is rendered by `PremiumHomePage` — **not** driven by Supabase CMS at runtime. CMS defaults in `lib/cms/home.ts` are for Site Studio reference only until a future gated CMS→public pipeline is built.

---

## Admin (safe to extend)

| Area | Path |
|------|------|
| Admin app | `app/admin/**` |
| Admin components | `components/admin/**` |
| Admin server logic | `lib/admin/**` |
| Auth middleware | `middleware.ts`, `lib/supabase/**` |
| Public invoices | `app/i/**` |

---

## Shared files (caution)

| File | Risk |
|------|------|
| `app/layout.tsx` | Root metadata/fonts — affects all routes |
| `app/globals.css` | Admin + marketing classes — avoid removing marketing tokens |
| `next.config.ts` | Image domains, build — test marketing after changes |
| `lib/cms/home.ts` | Admin CMS editor only for homepage today |

---

## Do not

- Replace homepage with CMS-driven light hero without explicit approval
- Change `SiteHeader` to light/cream nav during admin work
- Move admin routes into `app/(site)/`
- Expose `SUPABASE_SERVICE_ROLE_KEY` in client code
