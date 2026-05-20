# QA Results

*Palm Beach Property Pros admin — May 20, 2026*

## Automated checks

| Command | Result |
|---------|--------|
| `npm run type-check` | Pass |
| `npm run build` | Pass (includes lint) |

## Code audit summary

| Area | Automated | Manual (iPhone) |
|------|-----------|-----------------|
| Routes / auth | Pass | Required |
| Mobile UX | Pass (fixes applied) | Required |
| RLS / security | Pass with notes | Required |
| Tasks | Pass | Required |
| Jobs | Pass | Required |
| Invoices | Pass | Required |
| CMS / marketing | Pass | Required |

---

## What passed (this pass)

- All admin routes compile and build
- Login isolated from ops chrome
- Crew list loads from `crew_members`
- FAB deep-links open task modal or expense form
- Error messages on save failures (tasks, expenses, invoices, CMS)
- Public invoice shows message on load failure (not white screen)
- Marketing routes still static/SSG

---

## What was fixed

| Issue | Fix |
|-------|-----|
| Crew page empty/wrong table | Query `crew_members` |
| Login showed bottom nav | Conditional shell |
| Open redirect on `?next=` | `safeAdminRedirectPath` |
| FAB links did nothing | Query param handlers |
| Silent CMS/expense/invoice failures | Inline red errors |
| Job list expense total stale | Sync `job_expense_total` on add |

---

## What still needs manual iPhone testing

Clayton should run through the checklist below on Safari (or Add to Home Screen) while signed in.

---

## iPhone smoke test — Clayton

### Auth
1. Open `/admin` while logged out → redirects to `/admin/login`
2. Sign in → lands on dashboard (not external URL)
3. Confirm login page has **no** bottom nav or FAB
4. Sign out → returns to login

### Dashboard & tasks
5. Dashboard shows Today / Urgent / Overdue sections
6. Tap **+ Add task** → modal opens, save a task
7. Go to **Tasks** → complete a task, archive one
8. Switch filters: Today, Urgent, Overdue, Week, Completed
9. FAB → **Add Task** → modal opens (`/admin/tasks?new=1`)

### Jobs
10. **Jobs** → open a job
11. **Job tasks** → add task; optional **Create job checklist** (8 tasks only when tapped)
12. Upload before + after photo (camera)
13. Add job expense → confirm margin updates on detail
14. **Create invoice** (or view existing)
15. Sticky bar: Edit, Photos, Print — nothing hidden behind bottom nav
16. Print summary → preview looks correct

### Invoices & clients
17. **Invoices** → new invoice (if client exists)
18. Open invoice → **Add follow-up task** (unpaid)
19. Open `/i/{public_id}` in private tab → invoice renders
20. **Clients** → **+ Task** on a client

### Expenses & website
21. FAB → **Upload Receipt** → expense form scrolls, receipt input focused
22. Save expense → success or visible error
23. **Site Studio** → edit hero JSON → Save (valid JSON)
24. Visit homepage → content loads (CMS or defaults)

### Marketing (must not regress)
25. Homepage `/` loads, quote CTA works
26. `/services`, `/pricing` load

---

## Failures to report

If any step fails, note: route, action, screenshot, and any red error text.
