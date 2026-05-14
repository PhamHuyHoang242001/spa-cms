---
phase: 03
title: "Admin Booking Management"
status: pending
priority: P1
effort: 1.5d
dependencies: [phase-02]
---

# Phase 03 — Admin Booking Management

## Context Links
- [Bookings controller](../../apps/api/src/bookings/bookings.controller.ts) — confirm/cancel/complete/no-show endpoints exist
- [Bookings service](../../apps/api/src/bookings/bookings.service.ts) — `BOOKING_INCLUDE` shape, cancel requires `cancelReason`
- [API types](../../apps/web/lib/api-types.ts) — `Booking`, `BookingStatus` types defined
- [Dashboard page](../../apps/web/app/admin/dashboard/page.tsx) — placeholder for recent bookings
- [Admin sidebar](../../apps/web/components/admin/admin-sidebar.tsx) — `NAV_ITEMS` array
- [AdminTable](../../apps/web/components/admin/admin-table.tsx) — generic table component
- Phase 02 provides `GET /bookings` with pagination + filters

## Overview

Create `/admin/bookings` page for SUPERADMIN to list all bookings with filters (status, doctor, date range), confirm pending bookings, cancel with reason. Also enhance dashboard with booking stats and recent bookings list.

## Key Insights

- Backend `GET /bookings` (from Phase 02) returns: `{ data: Booking[], meta: { total, page, limit, totalPages } }`
- Each booking includes nested `user`, `doctor.user`, `service`, `slot` via `BOOKING_INCLUDE` + user join
- Existing `PATCH /bookings/:id/confirm` requires DOCTOR or SUPERADMIN role
- Existing `PATCH /bookings/:id/cancel` requires CUSTOMER or SUPERADMIN; SUPERADMIN must provide `cancelReason`
- Booking statuses: PENDING, CONFIRMED, COMPLETED, EXPIRED, CANCELLED, NO_SHOW
- Status colors already defined in `api-types.ts` via `BookingStatus` type
- Dashboard currently counts services/doctors/articles — need to add booking count

## Requirements

### Functional
- **Bookings page**: filterable list with status, doctor, date range filters
- **Actions**: Confirm (PENDING only), Cancel with reason modal (PENDING/CONFIRMED)
- **Dashboard**: booking count stat card + recent 5 bookings list replacing placeholder
- **Sidebar**: "Dat lich" nav item for SUPERADMIN

### Non-functional
- Consistent with existing admin page patterns (AdminTable, AdminFormModal)
- Uses AdminPagination + AdminSearchBar from Phase 05 (or inline pagination if Phase 05 not yet done)

## Architecture

```
/admin/bookings → BookingsPage
  ├── Filter bar (status dropdown, doctor dropdown, date range inputs)
  ├── AdminTable (columns: customer, service, doctor, date/time, status, actions)
  └── Pagination controls

/admin/dashboard → DashboardPage (enhanced)
  ├── Stats grid (services, doctors, articles, + bookings count)
  └── Recent bookings list (replaces placeholder)
```

## Related Code Files

### Files to Create
- `apps/web/app/admin/bookings/page.tsx` — Booking management page

### Files to Modify
- `apps/web/components/admin/admin-sidebar.tsx` — Add "Dat lich" nav item
- `apps/web/app/admin/dashboard/page.tsx` — Add booking stats + recent bookings
- `apps/web/lib/api-types.ts` — Add `PaginatedResponse` generic type, `BookingAdmin` type with user field

## Implementation Steps

### Step 1: Update API Types

Add to `apps/web/lib/api-types.ts`:

```ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BookingAdmin extends Booking {
  user: { id: string; name: string; email: string };
}
```

### Step 2: Add Sidebar Nav Item

In `admin-sidebar.tsx`, add to `NAV_ITEMS` array (after "Lich hen" / slots):

```ts
{
  href: '/admin/bookings',
  label: 'Dat lich',
  icon: <CalendarCheck size={18} />,
  roles: ['SUPERADMIN'],
},
```

Import `CalendarCheck` from `lucide-react`.

### Step 3: Create Bookings Page

Create `apps/web/app/admin/bookings/page.tsx`:

1. **State**:
   - `bookings: BookingAdmin[]`, `meta: PaginationMeta | null`
   - Filter state: `statusFilter`, `doctorFilter`, `dateFrom`, `dateTo`
   - `page: number` (current page)
   - `doctors: { id: string; name: string }[]` for dropdown
   - `loading`, `error`

2. **Load function**:
   ```ts
   const params = new URLSearchParams();
   params.set('page', String(page));
   params.set('limit', '20');
   if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
   if (doctorFilter) params.set('doctorId', doctorFilter);
   if (dateFrom) params.set('from', dateFrom);
   if (dateTo) params.set('to', dateTo);
   const result = await apiGet<PaginatedResponse<BookingAdmin>>(`/bookings?${params}`);
   ```

3. **Filter bar** (above table):
   - Status: `<select>` with ALL + each `BookingStatus` value
   - Doctor: `<select>` populated from `GET /doctors` on mount
   - Date range: two `<input type="date">` (from / to)
   - Filters trigger reload via `useEffect` deps

4. **Table columns**:
   - Khach hang (customer): `booking.user.name`
   - Dich vu (service): `booking.service.name.vi`
   - Bac si (doctor): `booking.doctor.user.name`
   - Ngay/gio: `booking.slot.date` + `booking.slot.startTime`
   - Trang thai: status badge with color map
   - Hanh dong: Confirm button (if PENDING), Cancel button (if PENDING/CONFIRMED)

5. **Status badge color map**:
   ```ts
   const STATUS_COLORS: Record<BookingStatus, string> = {
     PENDING: 'bg-amber-100 text-amber-700',
     CONFIRMED: 'bg-blue-100 text-blue-700',
     COMPLETED: 'bg-green-100 text-green-700',
     EXPIRED: 'bg-gray-100 text-gray-500',
     CANCELLED: 'bg-red-100 text-red-600',
     NO_SHOW: 'bg-orange-100 text-orange-700',
   };
   ```

   ```ts
   const STATUS_LABELS: Record<BookingStatus, string> = {
     PENDING: 'Cho xac nhan',
     CONFIRMED: 'Da xac nhan',
     COMPLETED: 'Hoan thanh',
     EXPIRED: 'Het han',
     CANCELLED: 'Da huy',
     NO_SHOW: 'Vang mat',
   };
   ```

6. **Confirm action**:
   ```ts
   await apiPatch(`/bookings/${id}/confirm`, {});
   await load();
   ```

7. **Cancel action** — open AdminFormModal with reason textarea:
   ```ts
   await apiPatch(`/bookings/${id}/cancel`, { cancelReason });
   await load();
   ```

8. **Inline pagination** (bottom of table):
   - Prev/Next buttons, page X of Y display
   - Disable prev on page 1, next on last page

### Step 4: Enhance Dashboard

Modify `apps/web/app/admin/dashboard/page.tsx`:

1. Add booking count to stats fetch:
   ```ts
   const bookingsResult = await apiGet<PaginatedResponse<BookingAdmin>>('/bookings?page=1&limit=5');
   ```
   
2. Add StatCard for bookings:
   ```tsx
   <StatCard
     label="Dat lich"
     value={stats.bookings}
     icon={<CalendarCheck size={22} className="text-[#c97d3e]" />}
     color="bg-[#fdf4e8]"
   />
   ```

3. Change grid from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4`.

4. Replace placeholder with recent bookings list:
   ```tsx
   <div className="space-y-3">
     {recentBookings.map(booking => (
       <div key={booking.id} className="bg-white rounded-xl border border-[#ede4de] p-4 flex justify-between items-center">
         <div>
           <p className="text-sm font-medium text-[#3d2b25]">{booking.user.name}</p>
           <p className="text-xs text-[#8a6a62]">{booking.service.name.vi} - {booking.slot.date} {booking.slot.startTime}</p>
         </div>
         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
           {STATUS_LABELS[booking.status]}
         </span>
       </div>
     ))}
   </div>
   ```

5. Add "Xem tat ca" link to `/admin/bookings`.

## Todo List

- [ ] Add `PaginatedResponse` and `BookingAdmin` types to `api-types.ts`
- [ ] Add "Dat lich" nav item to admin sidebar
- [ ] Create bookings page with filter bar
- [ ] Implement booking table with status badges
- [ ] Add confirm action (PENDING -> CONFIRMED)
- [ ] Add cancel action with reason modal
- [ ] Add inline pagination controls
- [ ] Enhance dashboard: add booking count stat card
- [ ] Enhance dashboard: replace placeholder with recent bookings list
- [ ] Test filter combinations (status + doctor + date range)
- [ ] Test confirm/cancel actions update list

## Success Criteria

- `/admin/bookings` shows all bookings with working filters
- Confirm converts PENDING to CONFIRMED, refreshes list
- Cancel opens modal, requires reason, changes status to CANCELLED
- Dashboard shows 4 stat cards including bookings
- Dashboard shows 5 most recent bookings with status badges
- Pagination works (prev/next, page indicator)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Phase 02 not complete (no `GET /bookings`) | Blocking | Phase 02 is prerequisite; cannot start without it |
| Cancel modal state conflicts with filter state | Low | Separate state variables for modal |
| Date filter timezone mismatch | Medium | Backend handles VN timezone conversion; send YYYY-MM-DD strings |

## Security Considerations

- All data access via `GET /bookings` (SUPERADMIN guard on backend)
- Cancel sends `cancelReason` — required field validated server-side
- No direct DB access from frontend
