# Phase 02: Frontend Audit & Bug Fixes

**Priority:** High | **Status:** Pending | **Est:** 0.5d | **Depends:** Phase 01

## Overview

Fix all frontend bugs: type mismatches, missing status handling, auth refresh edge cases, and UI issues. Stabilize before i18n refactor.

## Key Insights

- `BookingStatus` type in `api-types.ts` missing EXPIRED/NO_SHOW
- `STATUS_CONFIG` in my-bookings page missing entries for EXPIRED/NO_SHOW
- Auth refresh clears tokens on any error (should only on 401)
- `Article.content` typed as `string` but API returns `{ vi, ko }` JSON
- Booking doctor type expects flat structure but API returns nested `user` object

## Requirements

### Functional
- All booking statuses display correctly in dashboard
- Auth refresh only clears tokens on 401 (not 500/network)
- Article content renders correctly (Tiptap JSON)
- Booking list shows correct doctor/service info

### Non-Functional
- TypeScript types match actual API responses
- No runtime errors from type mismatches

## Related Code Files

### Files to Modify
- `apps/web/lib/api-types.ts` — Fix BookingStatus, Article content type, Booking doctor type
- `apps/web/app/me/bookings/page.tsx` — Add EXPIRED/NO_SHOW to STATUS_CONFIG
- `apps/web/lib/auth-context.tsx` — Differentiate 401 vs 5xx in refresh
- `apps/web/components/booking/step-confirm.tsx` — Add double-submit prevention

### Files to Verify
- `apps/web/app/page.tsx` — Home page API fetch error handling
- `apps/web/app/services/page.tsx` — Services list rendering
- `apps/web/app/services/[slug]/page.tsx` — Service detail
- `apps/web/app/blog/page.tsx` — Blog list
- `apps/web/app/blog/[slug]/page.tsx` — Article detail rendering
- `apps/web/components/booking/step-service.tsx` — Prefill slug handling
- `apps/web/components/booking/step-slot.tsx` — Slot selection
- `apps/web/app/admin/*` — Admin CRUD pages

## Implementation Steps

### Bug 1: BookingStatus type (CRITICAL)
1. Open `apps/web/lib/api-types.ts`
2. Add `'EXPIRED' | 'NO_SHOW'` to `BookingStatus` type
3. Update `Booking` interface if needed

### Bug 2: STATUS_CONFIG missing entries (CRITICAL)
1. Open `apps/web/app/me/bookings/page.tsx`
2. Add STATUS_CONFIG entries:
   ```ts
   EXPIRED: { label: 'Hết hạn', color: 'text-gray-500', bg: 'bg-gray-100' },
   NO_SHOW: { label: 'Không đến', color: 'text-red-600', bg: 'bg-red-50' },
   ```
3. Update tab filtering to include these statuses in "History" tab

### Bug 3: Auth refresh error handling (HIGH)
1. Open `apps/web/lib/auth-context.tsx`
2. Find session restore catch block (`.catch(() => clearTokens())`)
3. Replace with:
   ```ts
   .catch((err) => {
     if (err?.status === 401) clearTokens();
     // else: transient error, keep tokens, user can retry
   })
   ```

### Bug 4: Article content type (LOW)
1. Open `apps/web/lib/api-types.ts`
2. Change `content: string` to `content: { vi: any; ko: any } | string`
3. Update article rendering to handle Tiptap JSON

### Bug 5: Booking doctor type mismatch (MEDIUM)
1. Check actual API response shape from `GET /bookings`
2. Update `Booking` interface to match nested `doctor: { user: { name, id } }` if needed
3. Or flatten in backend service (preferred)

### Bug 6: Double-submit prevention (MEDIUM)
1. Open `apps/web/components/booking/step-confirm.tsx`
2. Add `submittedRef` to prevent double confirm:
   ```ts
   const submittedRef = useRef(false);
   const handleConfirm = async () => {
     if (submittedRef.current) return;
     submittedRef.current = true;
     // ...existing logic
   };
   ```

### Verification
1. Start web: `cd apps/web && pnpm dev`
2. Test pages:
   - Home page loads with services/doctors
   - Services list and detail pages
   - Blog list and article detail
   - Login → booking flow → my bookings
   - Admin panel CRUD
3. Check browser console for errors
4. Run `pnpm typecheck` in web

## Todo List

- [ ] Fix BookingStatus type in api-types.ts
- [ ] Add EXPIRED/NO_SHOW to STATUS_CONFIG
- [ ] Fix auth refresh error differentiation
- [ ] Fix Article content type
- [ ] Fix Booking doctor type or flatten backend
- [ ] Add double-submit prevention to booking confirm
- [ ] Verify all pages render correctly
- [ ] Run `pnpm typecheck` in web

## Success Criteria

- `pnpm typecheck` passes in `apps/web`
- All pages render without console errors
- My Bookings shows all statuses correctly
- Auth refresh doesn't logout on 500 errors
- Booking confirm prevents double submission

## Risk Assessment

- **Type changes cascade**: Changing api-types.ts may break multiple components — run typecheck after each change
- **Tiptap content rendering**: May need `@tiptap/html` to convert JSON to HTML for display
