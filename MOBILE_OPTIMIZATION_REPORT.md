# Mobile Field Ops Optimization Report

## Goals

Optimize PBPP admin for **iPhone field use**: large touch targets, minimal scrolling, fast capture workflows.

## Implemented

### Navigation
- **Sticky bottom tab bar** (5 primary routes): Home, Tasks, Jobs, Expenses, Invoices  
- **“More” menu** for Supplies, Crew, Clients, Site Studio, Media Library  
- Safe-area padding (`pb-safe`) for home indicator  

### Quick actions (FAB)
Floating `+` button opens:
- New Invoice  
- Upload Receipt  
- Add Expense  
- Add Task  
- Job Note (routes to jobs)  
- Before/After (routes to jobs)  

### Touch & layout
- Minimum **48px** control height on buttons/inputs (`admin-btn`, `admin-input`)  
- Single-column cards instead of tables on all list views  
- Max width `3xl` centered content for thumb reach  
- Receipt and media inputs use `capture="environment"` for camera  

### Uploads
- Receipts → `receipts` bucket with preview before save  
- Job/media → `job-media` bucket (schema ready on `jobs.before_photo_urls`)  
- CMS / gallery → `cms-media`, `media-library` buckets  

## Remaining mobile gaps

- Job detail page with inline photo upload not yet built (`/admin/jobs/[id]`)  
- Offline queue for poor cell service  
- Haptic feedback on task complete  
- Pull-to-refresh on lists  

## Verification checklist

- [ ] iPhone Safari: sign in at `/admin/login`  
- [ ] FAB opens all six actions without overlap with bottom nav  
- [ ] Expense receipt upload from camera roll  
- [ ] Task quick-complete and drag-sort with one hand  
- [ ] Invoice PDF via Share → Print from `/admin/invoices/[id]`  
