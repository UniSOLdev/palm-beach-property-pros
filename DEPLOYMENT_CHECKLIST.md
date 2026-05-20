# Deployment Checklist

## Pre-deploy (required)

### Environment and database

- [ ] Confirm Supabase project `palm-beach-property-pros` is **ACTIVE**
- [ ] Migrations applied: `admin_platform_tasks_cms_media_rls`, `seed_home_cms_sections`, `job_photos_table`, `tasks_operational_fields`
- [ ] Create at least one **Supabase Auth** user (email/password) for admin access
- [ ] Verify RLS: authenticated user can `select` from `tasks`, `invoices`, `jobs`

### Vercel environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://pfojtrfkeoeymmtkvijo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
# Optional for future server automations:
SUPABASE_SERVICE_ROLE_KEY=<server only — never NEXT_PUBLIC>
```

### Build and homepage lock (run locally or in CI)

```bash
npm run verify:public-homepage
npm run type-check
npm run build
```

- [ ] `npm run verify:public-homepage` passes (homepage not CMS-coupled)
- [ ] `npm run type-check` passes
- [ ] `npm run build` passes

### Pre-deploy visual and route checks (preview URL)

- [ ] **Homepage visually matches production:** dark graphite nav, SVG wordmark, “Premium Property Operations”, “Property Care for Palm Beach Living”, hero chips, **Get Free Quote** + **Call or Text** CTAs, **One secure operations link**
- [ ] Homepage is **not** the light “Done Right” / cream hero layout
- [ ] `/admin/login` works (minimal layout, no bottom nav)
- [ ] `/admin` works after login (dashboard + tasks hub)
- [ ] `/admin/jobs/[id]` works (job command center)
- [ ] `/admin/tasks` works
- [ ] `/i/[publicId]` works (public invoice)
- [ ] **Middleware only protects `/admin/*`** — `/`, `/quote`, `/services`, `/i/*` load without auth redirect

---

## Post-deploy smoke tests

### Public site (must not regress)

- [ ] https://www.palmbeachpropertypros.com/ loads
- [ ] Preview/production homepage: dark nav, wordmark, premium hero (see pre-deploy visual list)
- [ ] Quote CTAs → Linkr or `/quote` as designed
- [ ] Mobile sticky CTA bar

### Admin

- [ ] `/admin/login` — sign in works
- [ ] `/admin` — dashboard stats + task hub (today, urgent, overdue) load
- [ ] `/admin/tasks` — create, edit, complete, archive, reorder, filters
- [ ] `/admin/jobs/[id]` — job task panel, optional checklist, quick-add
- [ ] `/admin/invoices/[id]` — invoice follow-up task + shortcuts (unpaid)
- [ ] Quick-add from clients, expenses, or website pages
- [ ] `/admin/expenses` — add row + receipt upload
- [ ] `/admin/invoices/new` — save draft
- [ ] `/i/{public_id}` — public invoice renders
- [ ] `/admin/website` — Site Studio saves section JSON (**does not change public homepage**)
- [ ] `/admin/jobs` — open a job → detail page loads
- [ ] `/admin/jobs/[id]` — upload before/after photo, add job expense, create invoice
- [ ] `/admin/jobs/[id]/edit` — save status/revenue/cost fields

### Mobile (iPhone) — see `QA_RESULTS.md`

- [ ] Login page has no bottom nav/FAB
- [ ] Bottom nav + FAB do not overlap main content
- [ ] FAB → Add Task opens modal; Upload Receipt focuses expense form
- [ ] Camera receipt capture
- [ ] One-handed task complete
- [ ] Job detail sticky action bar clears bottom nav (no overlap)
- [ ] Job photo capture from camera on site

---

## Rollback plan

- Revert Vercel deployment to previous known-good build
- Admin routes are additive; removing deploy artifact removes `/admin` without affecting public URLs
- DB migrations are forward-only; do not drop tables without backup

---

## Monitoring

- Supabase Dashboard → Logs → API errors after launch
- Run `get_advisors` security lint quarterly

---

## Reference

- Public/admin separation: `PUBLIC_SITE_PROTECTION.md`
- Homepage incident: `PUBLIC_ADMIN_SEPARATION_AUDIT.md`
- iPhone QA steps: `QA_RESULTS.md`
