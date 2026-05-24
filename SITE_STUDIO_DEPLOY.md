# Site Studio — Deployment Notes

## Fix: "Could not find the table public.website_pages in the schema cache"

This error means the Site Studio migration has **not been applied** to your Supabase project, or PostgREST has a stale schema cache.

### Step 1 — Apply migration

In **Supabase Dashboard → SQL Editor**, run the full contents of:

```
supabase/migrations/20260527120000_site_studio_complete.sql
```

This creates:
- `website_pages`
- `website_sections`
- `website_media`
- `website_revisions`
- `website_theme`
- `website-media` storage bucket
- RLS policies, triggers, homepage seed

Alternatively, with Supabase CLI linked:

```bash
npx supabase login
npx supabase link --project-ref pfojtrfkeoeymmtkvijo
npm run db:push
```

### Step 2 — Reload schema cache

Supabase Dashboard → **Project Settings → API** → click **Reload schema** (or restart the project).

The migration includes `NOTIFY pgrst, 'reload schema';` but manual reload may still be needed.

### Step 3 — Verify

1. Open `/admin/website` — should show Visual builder hub (no crash)
2. Click **Edit homepage** — builder loads with sections
3. `/admin/website/pages` — lists pages
4. Upload test image via `/admin/website/media`

### Required env vars (Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + RLS queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview/publish service reads |

### API routes (authenticated)

| Route | Methods |
|-------|---------|
| `/api/admin/website/pages` | GET, POST |
| `/api/admin/website/sections` | PUT, POST, DELETE, PATCH |
| `/api/admin/website/publish` | POST, PUT |
| `/api/admin/website/media` | GET, POST, DELETE |

### Do not re-run

- `20260524160000_quote_intake_production_repair.sql` on production with existing lead data (DROPs tables)
