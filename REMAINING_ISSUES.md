# Remaining Issues

## High priority

1. **Admin auth users** — Create Supabase Auth user(s) for operators; without login, middleware redirects all `/admin` routes.  
2. ~~**Job detail + photo upload UI**~~ — **Done.** See `JOB_DETAIL_REPORT.md`. Legacy array photos still read-only in UI.  
3. **Public invoice RLS** — Anon can read non-archived invoices; tighten to `public_id` match via RPC if stricter security required.  
4. **Service role for server-only ops** — Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel for future server jobs; not required for current client flows.  

## Medium priority

5. **Client / crew / supplies CRUD forms** — List views only; edits require Supabase dashboard or SQL.  
6. **CMS visual editor** — Site Studio uses JSON textarea; no drag-and-drop block UI yet.  
7. **Navigation + SEO admin screens** — Tables exist; no dedicated UI routes.  
8. **Quote → invoice conversion UI** — DB links exist; no button flow in admin.  
9. **Recurring expense automation** — `is_recurring` column added; no scheduler.  
10. **Crew payout calculator UI** — `crew_payouts` table unused in admin.  

## Low priority

11. **SOP checklist runner** — Templates in DB; no mobile checklist UI.  
12. **Duplicate component audit** — Marketing `btn-*` vs admin `admin-btn` (intentional separation).  
13. **npm audit** — 3 dependency advisories from `npm install`.  
14. **Ops branch merge** — `origin/cursor/internal-walkthrough-fe71` has sample-data `/ops` dashboard; superseded by `/admin`.  

## Production safety notes

- Marketing routes unchanged (`/`, `/services`, `/pricing`, etc.).  
- Do not deploy without setting `NEXT_PUBLIC_SUPABASE_*` env vars on Vercel.  
- Test invoice share links before sending to clients.  
