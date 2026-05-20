# Database Structure Report

**Project:** `palm-beach-property-pros` (`pfojtrfkeoeymmtkvijo`)  
**Region:** us-west-1  

## Existing core tables (pre-sprint)

| Table | Purpose |
|-------|---------|
| `business_settings` | Branding, terms, payment methods |
| `clients` | CRM |
| `crew_members` | Crew roster + pay rates |
| `jobs` | Field jobs, photos, revenue |
| `quotes` / `quote_items` | Quoting |
| `invoices` / `invoice_items` | Billing |
| `expenses` | Operating costs |
| `crew_payouts` | Labor payouts per job |
| `supplies` | Inventory |
| `sop_templates` / `sop_checklists` | SOPs |

## Added this sprint

### `tasks`
- Status: `open`, `in_progress`, `completed`, `cancelled`  
- Priority: `low`, `normal`, `high`, `urgent`  
- `due_date`, `assigned_crew_ids[]`, `job_id`, `recurring_rule`, `recurring_parent_id`, `sort_order`  

### CMS
- `cms_sections` — `page_key`, `section_key`, `content` (jsonb)  
- `cms_navigation` — header links  
- `cms_seo` — per-page SEO  

### Media
- `media_folders` — slug taxonomy (estate-refresh, pressure-washing, …)  
- `media_assets` — url, tags, featured, before/after grouping  

### Column extensions
- `invoices.document_status` — `draft` \| `sent` \| `void`  
- `expenses.crew_member_id`, `is_recurring`, `recurring_interval`  
- `jobs.estimated_labor_cost`, `estimated_materials_cost`, `fuel_cost`, `dump_fee_cost`, `truck_rental_cost`, `equipment_cost`  

## Storage buckets

| Bucket | Public | Use |
|--------|--------|-----|
| `receipts` | No | Expense receipts |
| `job-media` | No | Before/after job photos |
| `cms-media` | Yes | Site Studio assets |
| `media-library` | Yes | Gallery / reels |

## RLS

- **Authenticated:** full access on all operational + CMS + media tables (`admin_all` policy)  
- **Anon:** read `invoices` + `invoice_items` for public share links  
- **Storage:** authenticated write; public read on cms/media buckets  

## Migrations applied (remote)

1. `admin_platform_tasks_cms_media_rls`  
2. `seed_home_cms_sections`  

## Type generation

Run when connected:

```bash
npx supabase gen types typescript --project-id pfojtrfkeoeymmtkvijo > lib/database.types.ts
```
