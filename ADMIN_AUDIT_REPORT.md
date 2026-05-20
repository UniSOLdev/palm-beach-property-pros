# PBPP Admin Platform Audit Report

**Date:** May 20, 2026  
**Scope:** `/admin` routes and operational systems  
**Repo:** Palm Beach Property Pros (Next.js 15)

## Executive summary

The production marketing site existed in-repo, but **no `/admin` application was present** in this workspace at audit start. Supabase project `palm-beach-property-pros` already contained operational tables (clients, jobs, invoices, expenses, etc.) with **RLS enabled and zero policies**, which blocked all client reads/writes.

This sprint **built the admin platform**, fixed RLS, added missing tables (tasks, CMS, media), and wired mobile-first field UX.

---

## Findings by route

| Route | Severity | Issue | Root cause | Fix status |
|-------|----------|-------|------------|------------|
| `/admin` | **Critical** | Route missing | Never implemented in repo | **Fixed** — dashboard with live Supabase stats |
| `/admin/tasks` | **Critical** | Demo/mock data referenced in spec; no persistence | No `tasks` table or UI | **Fixed** — full CRUD, views, DnD, recurring |
| `/admin/jobs` | **High** | Route missing | Not in repo | **Fixed** — list + margin display |
| `/admin/expenses` | **High** | No receipt workflow | No UI; RLS blocked API | **Fixed** — categories, upload, reimburse flag |
| `/admin/supplies` | **Medium** | Route missing | Not in repo | **Fixed** — read list (CRUD forms: backlog) |
| `/admin/crew` | **Medium** | Route missing | Not in repo | **Fixed** — read list (CRUD forms: backlog) |
| `/admin/website` | **Critical** | Hardcoded homepage | Static `page.tsx` | **Partial** — Site Studio + CMS tables; hero/trust/gallery wired |
| `/admin/clients` | **Medium** | Route missing | Not in repo | **Fixed** — read list |
| `/admin/invoices` | **High** | No in-app invoice UI | External Linkr only | **Fixed** — list, draft builder, PDF print, share `/i/[id]` |
| `/admin/invoices/new` | **High** | Missing | Not in repo | **Fixed** |
| All admin | **Critical** | Supabase queries fail | RLS on, no policies | **Fixed** — `authenticated` admin policies |
| Public site | **Medium** | Placeholder gallery | Hardcoded gradients | **Partial** — CMS-driven when media populated |
| Auth | **High** | No admin gate | No middleware | **Fixed** — Supabase Auth + `/admin/login` |

---

## Severity definitions

- **Critical** — Blocks core operations or data integrity  
- **High** — Major feature broken or missing  
- **Medium** — Incomplete UX or missing polish  
- **Low** — Cosmetic / nice-to-have  

---

## Completed repairs (this sprint)

1. Supabase migration: `tasks`, `cms_*`, `media_*`, job costing columns, expense extensions, storage buckets, RLS policies  
2. Mobile admin shell: sticky bottom nav, FAB quick actions, 48px+ touch targets  
3. Task system: Today / Urgent / Week / Completed, priorities, recurring spawn, drag-sort  
4. Invoice template component + public share route  
5. Expense tracking with receipt upload to `receipts` bucket  
6. Site Studio JSON editor for homepage sections (seeded defaults)  
7. Media library with folder taxonomy (Estate Refresh, Pressure Washing, etc.)  
8. Marketing site route group preserved; production URLs unchanged  

---

## Recommended follow-ups

- Add create/edit forms for clients, crew, supplies, jobs (currently list + Supabase direct)  
- Drag-and-drop CMS section ordering (DB `sort_order` exists)  
- Stripe / Linkr payment sync for invoice `payment_status`  
- Admin user provisioning in Supabase Auth (invite-only)  
- E2E tests on iPhone Safari for upload flows  
- Tighten public invoice RLS (currently broad `anon` read — acceptable for share links but review)  
