# PBPP Ops — Next Steps

Prioritized follow-ups after the premium platform upgrade. None block current production use.

---

## High priority

### 1. Wire CMS publish → live site
`getPublishedPage()` exists but has no public route caller. When ready:
- Add `app/(site)/[slug]/page.tsx` for CMS pages (exclude `home` — keep lock)
- Or add env flag `CMS_HOMEPAGE_ENABLED=true` to swap `PremiumHomePage` for published snapshot

### 2. Deploy to Vercel
Push branch and deploy with env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (health checks + preview)

### 3. Connect CMS navigation → public header
`cms_navigation` saves from Site Studio but `SiteHeader` is still hardcoded. Load nav items server-side when CMS publish is wired.

---

## Medium priority

### 4. Theme tokens → section renderers
CSS vars are injected (`--cms-primary`, etc.) but section components still use Tailwind palette. Migrate `HeroView`, `CtaView` to consume theme vars for true instant theming.

### 5. Rich text WYSIWYG
`rich_text` sections use plain textarea. Consider Tiptap or similar when editorial content grows.

### 6. Notification center
Command palette covers navigation; add persistent notification inbox when Supabase Realtime is needed for leads/quotes.

### 7. Scheduled publish UI
DB supports `published_at`; add date picker in builder publish flow.

---

## Lower priority

### 8. Image compression on upload
Add client-side resize before Supabase upload in `MediaLibraryPro` for large hero images.

### 9. Section templates library
Save/reuse section configurations across pages (wow factor extension).

### 10. Lead heatmap
Visual pipeline board on dashboard using existing `quote_requests` data.

---

## Quick wins (under 1 hour each)

- Seed default `cms_navigation` rows in migration if table is empty
- Add favicon/logo upload to theme panel (reuse media picker)
- Default sections when creating new pages (currently empty)
- Merge `website_media` and `media_assets` pickers into unified library

---

## Verify after deploy

1. `/admin/website` — Site Studio hub loads without readiness error
2. `/admin/website/builder/{homepage-id}` — builder toolbar, SEO score, health panel
3. `/admin` — dashboard analytics cards + chart
4. ⌘K — command palette opens and navigates
5. `/` — homepage scroll animations + mobile CTA bar
6. `/sitemap.xml` — includes static + published CMS pages
7. `/preview/{token}` — draft preview with new section types
