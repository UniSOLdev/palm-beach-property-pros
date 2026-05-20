# Deployment Checklist

## Pre-deploy

- [ ] Confirm Supabase project `palm-beach-property-pros` is **ACTIVE**  
- [ ] Migrations applied: `admin_platform_tasks_cms_media_rls`, `seed_home_cms_sections`  
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
- [ ] `/admin` — dashboard stats load (not all zeros/errors)  
- [ ] `/admin/tasks` — create, complete, reorder  
- [ ] `/admin/expenses` — add row + receipt upload  
- [ ] `/admin/invoices/new` — save draft  
- [ ] `/i/{public_id}` — public invoice renders  
- [ ] `/admin/website` — save hero JSON, refresh homepage  

### Mobile (iPhone)
- [ ] Bottom nav + FAB do not overlap  
- [ ] Camera receipt capture  
- [ ] One-handed task complete  

## Rollback plan

- Revert Vercel deployment to previous marketing-only build  
- Admin routes are additive; removing deploy artifact removes `/admin` without affecting public URLs  
- DB migrations are forward-only; do not drop tables without backup  

## Monitoring

- Supabase Dashboard → Logs → API errors after launch  
- Run `get_advisors` security lint quarterly  
