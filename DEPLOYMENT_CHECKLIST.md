# Deployment Checklist

## Pre-deploy

- [ ] Confirm Supabase project `palm-beach-property-pros` is **ACTIVE**  
- [ ] Migrations applied: `admin_platform_tasks_cms_media_rls`, `seed_home_cms_sections`, `job_photos_table`, `tasks_operational_fields`  
- [ ] Create at least one **Supabase Auth** user (email/password) for admin access  
- [ ] Verify RLS: authenticated user can `select` from `tasks`, `invoices`, `jobs`  

## Vercel environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://pfojtrfkeoeymmtkvijo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
# Optional for future server automations:
SUPABASE_SERVICE_ROLE_KEY=<server only — never NEXT_PUBLIC>
```

## Build verification

```bash
npm run build
npm run type-check
```

## Post-deploy smoke tests

### Public site (must not regress)
- [ ] https://www.palmbeachpropertypros.com/ loads  
- [ ] Hero copy renders (CMS or defaults)  
- [ ] Quote CTAs → Linkr  
- [ ] Mobile sticky CTA bar  

### Admin
- [ ] `/admin/login` — sign in works  
- [ ] `/admin` — dashboard stats + task hub (today, urgent, overdue) load  
- [ ] `/admin/tasks` — create, edit, complete, archive, reorder, filters (Today/Urgent/Week/Completed)  
- [ ] `/admin/jobs/[id]` — job task panel, optional checklist, quick-add  
- [ ] `/admin/invoices/[id]` — invoice follow-up task + shortcuts (unpaid)  
- [ ] Quick-add from clients, expenses, or website pages  
- [ ] `/admin/expenses` — add row + receipt upload  
- [ ] `/admin/invoices/new` — save draft  
- [ ] `/i/{public_id}` — public invoice renders  
- [ ] `/admin/website` — save hero JSON, refresh homepage  
- [ ] `/admin/jobs` — open a job → detail page loads  
- [ ] `/admin/jobs/[id]` — upload before/after photo, add job expense, create invoice  
- [ ] `/admin/jobs/[id]/edit` — save status/revenue/cost fields  

### Mobile (iPhone)
- [ ] Bottom nav + FAB do not overlap  
- [ ] Camera receipt capture  
- [ ] One-handed task complete  
- [ ] Job detail sticky action bar clears bottom nav (no overlap)  
- [ ] Job photo capture from camera on site  

## Rollback plan

- Revert Vercel deployment to previous marketing-only build  
- Admin routes are additive; removing deploy artifact removes `/admin` without affecting public URLs  
- DB migrations are forward-only; do not drop tables without backup  

## Monitoring

- Supabase Dashboard → Logs → API errors after launch  
- Run `get_advisors` security lint quarterly  
