# Brainstorm: Admin Site Completion & Full Site Polish

**Date:** 2026-05-05 | **Type:** Brainstorm Report | **Status:** Agreed

## Problem Statement

K-Beauty Spa CMS MVP (phases 00-09) is functionally complete but the admin site has critical gaps:
- No dedicated admin login (`/admin/login`) — shares `/login` with customers
- No booking management page — dashboard shows placeholder
- No user management
- No search/filter/pagination on admin CRUD tables
- Articles use plaintext textarea (no rich text editor)
- Dashboard stats incomplete (no booking data)
- Public site has orphaned deleted files from i18n migration

## Requirements (User-Confirmed)

1. **Admin Login**: Dedicated `/admin/login` page, DOCTOR/SUPERADMIN only, reject CUSTOMER
2. **Booking Management**: `/admin/bookings` page — list all, filter by status/date/doctor, confirm/cancel actions
3. **User Management**: `/admin/users` — list, create, edit, role changes (SUPERADMIN only)
4. **Dashboard Enhancement**: Booking count stat, recent bookings list, basic revenue summary
5. **Search & Pagination**: All admin CRUD pages (services, doctors, articles, slots, bookings, users)
6. **Tiptap WYSIWYG**: Rich text editor for article content (vi + ko)
7. **Scope**: Full — admin + public site fix/polish

## Evaluated Approaches

### A. Admin Login Strategy

**Option 1: Separate `/admin/login` route (Chosen)**
- New page at `apps/web/app/admin/login/page.tsx` excluded from admin layout guard
- Backend uses same `/auth/login` endpoint — frontend checks role after login
- If role is CUSTOMER → show error, clear tokens, don't enter admin
- Pros: Simple, reuses existing auth API, no backend changes needed
- Cons: Login call succeeds for CUSTOMER before being rejected on frontend

**Option 2: New backend endpoint `/auth/admin-login`**
- Backend rejects CUSTOMER at login time
- Pros: Cleaner security — never issues tokens to wrong role
- Cons: Duplicated auth logic, tight coupling

**Decision:** Option 1 — reuse existing `/auth/login`, validate role client-side. If CUSTOMER logs in at `/admin/login`, immediately logout + show error. No backend changes needed.

### B. Booking Management

**Backend:** Need new endpoint `GET /bookings` (SUPERADMIN only) with query params:
- `?status=PENDING,CONFIRMED` — filter by status
- `?doctorId=xxx` — filter by doctor
- `?from=2026-05-01&to=2026-05-07` — date range
- `?page=1&limit=20` — pagination

**Frontend:** `/admin/bookings` page with:
- Filter bar (status dropdown, doctor dropdown, date range)
- AdminTable with booking data
- Action buttons: confirm, cancel, view detail
- Pagination controls

### C. User Management

**Backend:** Need new `UsersController` with SUPERADMIN endpoints:
- `GET /users?role=CUSTOMER&page=1&limit=20` — list with filter/pagination
- `PATCH /users/:id` — update name, role, active status
- No user creation via admin (keep register flow)

**Frontend:** `/admin/users` page with:
- Filter by role
- Edit modal (name, role change)
- User count stats

### D. Search & Pagination

**Backend:** Add `?search=&page=&limit=` support to existing endpoints:
- `GET /services?search=&page=1&limit=20`
- `GET /doctors?search=&page=1&limit=20`
- `GET /articles?search=&page=1&limit=20`

Return format: `{ data: T[], total: number, page: number, limit: number }`

**Frontend:** Reusable components:
- `AdminSearchBar` — debounced search input
- `AdminPagination` — page navigation controls
- Update all admin pages to use paginated API

### E. Tiptap Editor

Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`.
Create `TiptapEditor` component for article content.vi + content.ko fields.
Store as HTML string in DB (article content JSON field).

### F. Public Site

- Delete orphaned non-locale pages (already moved to `[locale]/`)
- Verify all `[locale]/` pages render correctly
- Ensure booking flow, blog, services, doctors pages work end-to-end

## Recommended Solution

### Architecture

```
Admin Site Changes:
├── /admin/login        → NEW: Dedicated admin login page
├── /admin/dashboard    → ENHANCE: +booking stats, +recent bookings list
├── /admin/bookings     → NEW: Full booking management
├── /admin/users        → NEW: User management
├── /admin/services     → ENHANCE: +search, +pagination
├── /admin/doctors      → ENHANCE: +search, +pagination
├── /admin/articles     → ENHANCE: +search, +pagination, +Tiptap editor
├── /admin/slots        → ENHANCE: +search, +pagination
└── /admin/layout.tsx   → UPDATE: redirect to /admin/login instead of /login

Backend API Changes:
├── GET /bookings       → NEW: List all bookings (SUPERADMIN, paginated)
├── GET /users          → NEW: List users (SUPERADMIN, paginated)
├── PATCH /users/:id    → NEW: Update user (SUPERADMIN)
├── GET /services       → ENHANCE: +search, +pagination
├── GET /doctors        → ENHANCE: +search, +pagination
├── GET /articles       → ENHANCE: +search, +pagination
└── Shared pagination   → NEW: Reusable pagination utility

Frontend Shared:
├── AdminSearchBar      → NEW: Debounced search input component
├── AdminPagination     → NEW: Pagination controls component
└── TiptapEditor        → NEW: Rich text editor component
```

### Phase Breakdown (Recommended Order)

1. **Phase 1 — Admin Auth** (Small): `/admin/login` page + layout redirect fix
2. **Phase 2 — Backend Pagination** (Medium): Add search/pagination to all list endpoints + new bookings/users endpoints
3. **Phase 3 — Booking Management** (Medium): `/admin/bookings` page + dashboard enhancement
4. **Phase 4 — User Management** (Small): `/admin/users` page
5. **Phase 5 — Search & Pagination UI** (Medium): Reusable components + update all admin pages
6. **Phase 6 — Tiptap Editor** (Medium): Install + integrate into articles page
7. **Phase 7 — Public Site Polish** (Small): Clean deleted files, verify all pages
8. **Phase 8 — Testing & QA** (Medium): End-to-end testing, fix regressions

## Implementation Considerations

### Risks
- **Tiptap bundle size**: ~50-80KB gzipped — acceptable for admin-only pages
- **Pagination breaking changes**: Existing endpoints return arrays; changing to `{data, total}` format will break existing frontend consumers
  - **Mitigation**: Use optional query params — if no `page` param, return array as before (backward compatible)
- **Article content migration**: Existing plaintext content needs to work in Tiptap
  - **Mitigation**: Treat existing content as `<p>` blocks on first load

### Security
- Admin login page must not leak user existence (keep generic error messages)
- User management: prevent SUPERADMIN from demoting themselves
- Booking management: ensure SUPERADMIN has `cancelReason` for admin cancellations

### Performance
- Paginated queries use DB-level `skip/take` — no memory issues
- Search uses `ILIKE` on relevant fields — add DB indexes if needed later
- Tiptap lazy-loaded only on articles page

## Success Metrics

- [ ] `/admin/login` works independently, rejects CUSTOMER role
- [ ] All admin CRUD pages have search + pagination
- [ ] `/admin/bookings` lists all bookings with filters + actions
- [ ] `/admin/users` lists users with role filter + edit
- [ ] Dashboard shows booking count + recent bookings
- [ ] Articles use Tiptap editor for vi/ko content
- [ ] All public pages render correctly under `[locale]/` routing
- [ ] No regressions in existing functionality

## Next Steps

Create detailed implementation plan with phase files if approved.
