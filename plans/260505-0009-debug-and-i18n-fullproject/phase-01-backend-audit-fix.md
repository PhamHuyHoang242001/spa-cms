# Phase 01: Backend Audit & Bug Fixes

**Priority:** High | **Status:** Pending | **Est:** 0.5d

## Overview

Fix all backend bugs found during codebase audit. Focus on type safety, race conditions, timezone handling, and response consistency.

## Key Insights

- BookingStatus enum mismatch between backend schema and shared types
- Slot date parsing uses UTC instead of VN timezone
- Booking cancel/confirm responses missing `include` for full data
- `listMine()` doesn't include related entities

## Requirements

### Functional
- All API endpoints return correct, typed responses
- Booking transaction safe under concurrency
- Slot generation uses correct VN timezone
- Cancel/confirm/complete return full booking with relations

### Non-Functional
- Type consistency between Prisma schema and shared package
- Proper error codes and messages

## Related Code Files

### Files to Modify
- `packages/shared/src/schemas/booking-schemas.ts` — Add EXPIRED, NO_SHOW to status
- `apps/api/src/bookings/bookings.service.ts` — Fix includes, transaction, cancelReason
- `apps/api/src/slots/slots.service.ts` — Fix date parsing timezone
- `apps/api/src/auth/auth.service.ts` — Verify refresh token error differentiation

### Files to Verify
- `apps/api/prisma/schema.prisma` — Reference for enums
- `apps/api/src/bookings/bookings-cron.ts` — Verify cron logic
- `apps/api/src/doctors/doctors.service.ts` — Verify CRUD
- `apps/api/src/services/services.service.ts` — Verify CRUD
- `apps/api/src/articles/articles.service.ts` — Verify CRUD

## Implementation Steps

### Bug 1: Missing BookingStatus values (CRITICAL)
1. Open `packages/shared/src/schemas/booking-schemas.ts`
2. Add `EXPIRED` and `NO_SHOW` to BookingStatus enum/type
3. Verify enum matches `apps/api/prisma/schema.prisma` BookingStatus

### Bug 2: Slot date parsing timezone (MEDIUM)
1. Open `apps/api/src/slots/slots.service.ts`
2. Find date parsing: `new Date(\`${fromDate}T00:00:00.000Z\`)`
3. Change to: `new Date(\`${fromDate}T00:00:00+07:00\`)` (VN timezone)
4. Or use datetime-utils if available

### Bug 3: Booking responses missing includes (MEDIUM)
1. Open `apps/api/src/bookings/bookings.service.ts`
2. Ensure `cancel()` method uses `include: BOOKING_INCLUDE`
3. Ensure `confirm()`, `complete()`, `noShow()` use `include: BOOKING_INCLUDE`
4. Ensure `listMine()` uses `include: BOOKING_INCLUDE` for full relation data

### Bug 4: cancelReason enforcement (HIGH)
1. Review `cancel()` method — SUPERADMIN requires `cancelReason`
2. Make `cancelReason` optional for all roles (simplify logic)
3. Or keep required for SUPERADMIN but add clear error message

### Bug 5: Race condition in booking create (HIGH)
1. Review transaction in `create()` method
2. Ensure `SELECT FOR UPDATE` or equivalent Prisma lock on slot
3. Verify P2002 error handling catches all edge cases
4. Add explicit `slot.status === 'AVAILABLE'` check inside transaction

### Verification
1. Start API: `cd apps/api && pnpm dev`
2. Test with curl/httpie:
   - `POST /auth/login` with seed credentials
   - `GET /doctors`, `GET /services`, `GET /slots?doctorId=X&date=Y`
   - `POST /bookings` with valid data
   - `PATCH /bookings/:id/cancel`
   - `GET /articles`
3. Check no 500 errors, correct response shapes

## Todo List

- [ ] Fix BookingStatus enum in shared package
- [ ] Fix slot date parsing timezone
- [ ] Add `include: BOOKING_INCLUDE` to cancel/confirm/complete/noShow
- [ ] Add `include: BOOKING_INCLUDE` to listMine
- [ ] Review cancelReason logic
- [ ] Verify booking create transaction safety
- [ ] Test all endpoints manually
- [ ] Run `pnpm typecheck` in api

## Success Criteria

- `pnpm typecheck` passes in `apps/api`
- All endpoints return expected response shapes
- No 500 errors on valid requests
- Slot generation creates slots for correct VN dates

## Risk Assessment

- **Prisma transaction lock**: If `SELECT FOR UPDATE` not supported in Prisma's interactive transactions, use raw SQL
- **Timezone edge case**: Midnight VN time = previous day UTC — test boundary dates
