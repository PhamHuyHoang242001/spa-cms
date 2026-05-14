# Phase 03 Booking Logic — Implementation Report

## Phase
- Phase: phase-03-booking-logic
- Plan: /Users/phamhoang/Documents/work/spa-cms/plans/
- Status: completed

## Files Modified / Created

| File | Lines | Action |
|------|-------|--------|
| `apps/api/prisma/schema.prisma` | 143 | Added `BookingStatus` enum, `Booking` model, relations to User/DoctorProfile/Service/TimeSlot |
| `apps/api/prisma/migrations/20260422004112_add_booking/migration.sql` | auto | Prisma-generated |
| `apps/api/prisma/migrations/20260422004116_one_active_booking_per_user/migration.sql` | 2 | Partial unique index |
| `apps/api/src/common/utils/datetime-utils.ts` | 13 | combineDateTime helper (VN UTC+7) |
| `apps/api/src/bookings/bookings.service.ts` | 177 | Core booking logic: create, listMine, findById, cancel, confirm, complete, noShow |
| `apps/api/src/bookings/bookings.controller.ts` | 67 | 7 REST endpoints with role guards |
| `apps/api/src/bookings/bookings-cron.ts` | 35 | 5-min cron to expire overdue bookings |
| `apps/api/src/bookings/bookings.module.ts` | 14 | Module wiring |
| `apps/api/src/app.module.ts` | 33 | Added ScheduleModule.forRoot() + BookingsModule |
| `packages/shared/src/schemas/booking-schemas.ts` | 18 | createBookingSchema + cancelBookingSchema |
| `packages/shared/src/index.ts` | 7 | Export booking-schemas |

## Tasks Completed

- [x] Prisma schema: BookingStatus enum + Booking model + relations
- [x] Migration: add_booking (Prisma-managed)
- [x] Migration: one_active_booking_per_user (partial unique index)
- [x] DateTime helper: combineDateTime (VN UTC+7, no DST)
- [x] bookings.service.ts: create (transactional), listMine, findById, cancel, confirm, complete, noShow
- [x] bookings.controller.ts: 7 endpoints with correct role guards
- [x] bookings-cron.ts: expireOverdueBookings every 5 min
- [x] bookings.module.ts: wires service + controller + cron
- [x] app.module.ts: ScheduleModule.forRoot() + BookingsModule
- [x] @nestjs/schedule installed
- [x] Shared Zod schemas: createBookingSchema, cancelBookingSchema
- [x] Shared package rebuilt
- [x] pnpm turbo run typecheck: PASS (all 3 packages)
- [x] pnpm turbo run build: PASS (all 3 packages)

## Tests Status

- Typecheck: PASS (api, @spa/shared, web)
- Build: PASS (api nest build, shared tsc, web next build)
- Unit tests: not run (no test suite configured in api)

## Issues Encountered

- `prisma migrate dev` command must be run from `apps/api` directly (not via `pnpm --filter api npx`)
- After adding the Booking model and running `prisma migrate dev`, TypeScript incremental cache (`tsconfig.tsbuildinfo`) held stale type state causing "Property 'booking' does not exist on PrismaService" errors. Fixed by deleting the cache before typechecking. Root cause: Prisma 7 generates into the pnpm virtual store; the incremental cache had resolved types before regeneration.
- `Prisma.BookingInclude` is actually exported at top level of namespace (`Prisma { BookingInclude }`) — confirmed by checking the generated `.d.ts`. The error was purely stale cache, not a real type issue.

## Design Decisions

- `@unique` on `Booking.slotId` is the DB-level safety net against double booking (Prisma 7 doesn't easily support `SELECT FOR UPDATE` with the PrismaPg adapter in transactions)
- Partial unique index `one_active_booking_per_user` enforces one active booking per customer at the DB level
- `BOOKING_INCLUDE` constant defined as `satisfies Prisma.BookingInclude` to share the include shape across queries
- `BookingsCron` is a separate file from `BookingsService` to stay under 200-line limit

## Next Steps

- Phase 04 (if applicable): Admin booking list endpoint with filters by doctor/date/status
- Add e2e tests once test infrastructure is set up
