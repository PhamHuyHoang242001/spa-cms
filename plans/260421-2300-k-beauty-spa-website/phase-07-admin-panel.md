# Phase 07 — Admin Panel (Doctor View + Superadmin CRUDs)

**Priority:** High | **Status:** completed | **Est:** 3d | **Depends:** 03, 05

## Overview
Admin panel tại `/admin/*` với sidebar, RBAC. Doctor thấy lịch của mình; superadmin CRUD toàn bộ.

## Layout

```
/admin              → redirect theo role
/admin/dashboard    → KPIs (superadmin only)
/admin/my-schedule  → doctor view (own bookings)
/admin/bookings     → superadmin all bookings
/admin/doctors      → superadmin CRUD
/admin/services     → superadmin CRUD
/admin/articles     → superadmin CRUD + Tiptap editor
/admin/users        → superadmin list customers
/admin/slots        → regenerate/block slots
```

## Doctor View (`/admin/my-schedule`)

- **Today panel**: list bookings hôm nay theo thời gian, mỗi item: time, customer name+phone, service, status, quick actions (Confirm / Complete / No-show).
- **Week calendar**: grid 7 ngày x 12 slots, visual booked/available/blocked.
- **Block time off**: chọn ngày + khoảng giờ → mark slots BLOCKED.
- **Booking detail drawer**: customer info, service, add/edit treatment note.

## Superadmin Dashboard (`/admin/dashboard`)

- KPI cards: Total bookings (7d/30d), No-show rate, Top 3 services by booking count, Active customers (30d).
- Recent bookings table (10 rows).
- Quick links tới CRUD.

## CRUD Screens Pattern

Standard layout per resource:
- Header: title + "Create" button.
- DataTable (shadcn) với columns, search, pagination, sort.
- Row actions: Edit (dialog/drawer), Delete (confirm), toggle Active.
- Create/Edit form trong Dialog hoặc dedicated page `/admin/services/new`.

### `/admin/services`
Form fields: slug, name.vi, name.ko, description.vi, description.ko (textarea), priceVnd, durationMin (9/30/60/75/90), coverUrl (Cloudinary picker), gallery multi, featured, active, order.

### `/admin/doctors`
Form: email, password (only on create), name, phone, specialty.vi/ko, bio.vi/ko (textarea), avatarUrl, yearsExp, order, active.

### `/admin/articles`
Full-page editor route `/admin/articles/[id]`:
- Left pane: meta (slug, cover upload, tags, featured, publish toggle).
- Right pane: Tabs VN/KR, Tiptap editor.
- Actions: Save draft / Publish / Unpublish / Delete.

### `/admin/bookings`
- Filter: date range, doctor, status.
- Row actions: Confirm, Complete, Cancel, No-show.
- Click row → detail drawer với full info.

### `/admin/users`
- Read-only list customers: email, phone, name, active bookings count, total bookings, createdAt.
- Detail page with booking history.

### `/admin/slots`
- Button "Generate next 30 days for all doctors".
- Per-doctor: calendar overview, block/unblock.

## Files to Create

- `apps/web/app/[locale]/admin/layout.tsx` — sidebar, role check, redirect
- `apps/web/components/admin/sidebar.tsx` — role-based menu items
- `apps/web/components/admin/data-table.tsx` — reusable shadcn DataTable
- `apps/web/components/admin/cloudinary-uploader.tsx` — signed upload widget
- `apps/web/app/[locale]/admin/dashboard/page.tsx`
- `apps/web/app/[locale]/admin/my-schedule/page.tsx`
- `apps/web/app/[locale]/admin/bookings/page.tsx`
- `apps/web/app/[locale]/admin/doctors/page.tsx` + `[id]/page.tsx`
- `apps/web/app/[locale]/admin/services/page.tsx` + `[id]/page.tsx`
- `apps/web/app/[locale]/admin/articles/page.tsx` + `[id]/page.tsx`
- `apps/web/app/[locale]/admin/users/page.tsx`
- `apps/web/app/[locale]/admin/slots/page.tsx`

**API additions:**
- `/uploads/sign` endpoint → returns Cloudinary signed params cho client upload direct.
- `/dashboard/kpis` aggregate stats.

## Implementation Steps

1. AdminLayout server-side check role (redirect `/login` hoặc `/` nếu CUSTOMER).
2. Sidebar: items filtered by role.
3. Build DataTable component (shadcn) với generic props.
4. Cloudinary signed upload: API sign `{folder, public_id, timestamp}` → FE uses `cloudinary-core` or fetch widget.
5. Services CRUD first (simplest, template cho rest).
6. Doctors CRUD: tạo User+DoctorProfile trong transaction API side.
7. Articles full editor với Tiptap, autosave every 30s (debounced).
8. My-schedule doctor view: fetch `/bookings?doctorId=me`, render calendar + list.
9. Dashboard KPIs: API aggregates (Prisma groupBy).
10. RBAC polish: hide menu items + server-side guard double-check.

## Todo

- [x] AdminLayout + sidebar
- [x] RBAC route guards (server + client)
- [x] DataTable generic component
- [x] Cloudinary signed upload API + FE widget
- [x] Services CRUD (list + form + delete)
- [x] Doctors CRUD (User+Profile transactional)
- [x] Articles list + Tiptap editor page
- [x] Articles publish/unpublish
- [x] Bookings admin list + status actions
- [x] Users read-only list + detail
- [x] Slots generation UI
- [x] My-schedule doctor page
- [x] Dashboard KPIs
- [x] Admin uses vi UI only (KR for content, not admin UI)

## Success Criteria

- Superadmin can create doctor → doctor can login → see `/admin/my-schedule`.
- Superadmin create service với ảnh → hiển thị `/services/[slug]` immediately.
- Doctor block slot → slot không available cho customer booking.
- Tiptap article publish → public blog page reflects trong 1 phút.
- CUSTOMER cannot access `/admin` (redirect).

## Risks

- Tiptap SSR hydration quirks → `editable={isMounted}` pattern hoặc load via dynamic import ssr:false.
- Cloudinary free tier bandwidth → use `f_auto,q_auto` transforms to minimize.
- DataTable perf với 1000+ rows → server-side pagination from day 1.

## Next Steps

Phase 08 polish animation + a11y trước khi deploy.
