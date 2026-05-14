# Code Review: Phase 03 — Booking Logic

**Date:** 2026-04-22 | **Reviewer:** code-reviewer | **Status:** Complete

## Scope

- Files: 9 (service, controller, cron, module, schema, migrations, datetime-utils, booking-schemas, app.module)
- LOC: ~280 (excluding migrations/schema)
- Focus: Concurrency, business rules, security, cron, datetime

## Overall Assessment

Solid implementation. Clean separation, good use of Zod validation, proper transaction boundaries. Several issues found — two critical (concurrency race, doctor ownership), one high (cron non-atomicity).

---

## Critical Issues

### C1. Race Condition — No Row-Level Lock on Slot in `create()`

**File:** `bookings.service.ts` L46

The `findUnique` inside the transaction does NOT acquire a row-level lock. Two concurrent requests for the same slot can both read `AVAILABLE`, then both attempt to create. The `@unique` constraint on `slotId` will reject the second insert, but:

- The error surfaces as an unhandled Prisma `P2002` unique constraint error, not a clean `400`
- The slot is already marked BOOKED by the first txn; the second txn's slot update may also succeed before the booking insert fails, leaving inconsistent state

**Fix:** Use raw `SELECT ... FOR UPDATE` on the slot row inside the transaction:

```typescript
// Replace L46
const [slot] = await tx.$queryRaw<TimeSlot[]>`
  SELECT * FROM "TimeSlot" WHERE id = ${slotId} FOR UPDATE`;
if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);
```

Alternatively, catch `P2002` on the booking create and throw a clean `BadRequestException('Slot already booked')`.

### C2. No Doctor Ownership Check on `confirm()`, `complete()`, `noShow()`

**File:** `bookings.service.ts` L145-177, `bookings.controller.ts` L63-81

Any doctor (not just the assigned one) can confirm/complete/no-show ANY booking. The controller passes no `userId`, and the service does not verify `booking.doctorId` matches the requesting doctor's profile.

A DOCTOR role user can manipulate bookings belonging to other doctors.

**Fix:** Pass `userId` and `role` to these methods. For DOCTOR role, verify the booking's `doctorId` matches the doctor profile linked to `userId`:

```typescript
async confirm(id: string, userId: string, role: string) {
  const booking = await this.prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new NotFoundException();
  if (role === 'DOCTOR') {
    const profile = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (!profile || booking.doctorId !== profile.id)
      throw new ForbiddenException('Not your booking');
  }
  // ... status check + update
}
```

---

## High Priority

### H1. Cron: Non-Atomic Read-Then-Write per Booking

**File:** `bookings-cron.ts` L16-27

The cron reads all overdue bookings outside a transaction, then updates each in separate transactions. If the cron runs twice concurrently (unlikely at 5min, but possible with horizontal scaling), the same booking could be expired twice. While idempotent for the booking status, the slot update to AVAILABLE is also idempotent, so actual data corruption is unlikely — but it's wasteful.

More importantly, between the `findMany` and the loop, a booking could be cancelled by a user, and the cron would overwrite `CANCELLED` with `EXPIRED`.

**Fix:** Add a `status` check in the update WHERE clause:

```typescript
await this.prisma.booking.updateMany({
  where: { id: b.id, status: { in: ['PENDING', 'CONFIRMED'] } },
  data: { status: 'EXPIRED' },
});
```

Or batch with a single `updateMany` + raw SQL to release slots atomically.

### H2. `cancel()` Not Wrapped in Transaction with Status Re-check

**File:** `bookings.service.ts` L114-141

The booking is read at L114, status checked at L117, then updated at L134. Between the read and the update, a concurrent confirm/complete could change the status. The batched transaction at L134 does not re-verify status.

**Fix:** Use an interactive transaction with a `status` guard in the `WHERE`:

```typescript
return this.prisma.$transaction(async (tx) => {
  const booking = await tx.booking.findUnique({ where: { id } });
  // ... checks ...
  const updated = await tx.booking.update({
    where: { id, status: { in: ACTIVE_STATUSES } },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason },
  });
  await tx.timeSlot.update({ where: { id: booking.slotId }, data: { status: 'AVAILABLE' } });
  return updated;
});
```

### H3. `noShow()` and `complete()` Same TOCTOU Pattern

**File:** `bookings.service.ts` L156-177

Same read-then-write gap as cancel. Lower risk since only DOCTOR role can call, but still a correctness concern under concurrent access.

---

## Medium Priority

### M1. Partial Unique Index Exists but App-Level Check Is Redundant-ish

The `one_active_booking_per_user` partial unique index (migration) is an excellent DB-level safety net. The app-level `findFirst` at L38 duplicates this check. This is fine for clean error messaging, but:

- The `P2002` error from the index should also be caught and surfaced cleanly as a fallback

### M2. `filter` Query Param Not Validated

**File:** `bookings.controller.ts` L38

The `filter` param accepts any string. Values other than `'active'` or `'history'` silently return all bookings (no filter applied). Should validate with Zod or a NestJS `ParseEnumPipe`.

### M3. Missing `@db.Timestamptz` on `startsAt`/`endsAt`

**File:** `schema.prisma` L128-129

`DateTime` maps to `timestamp(3)` (without timezone). Since `combineDateTime` produces UTC-equivalent values from `+07:00`, this works — but adding `@db.Timestamptz` would make the intent explicit and prevent bugs if the DB timezone config changes.

### M4. Schema IDs Use `z.string().min(1)` Instead of CUID Validation

**File:** `booking-schemas.ts` L6-8

No format validation on IDs. Passing arbitrary strings will fail at the DB level but not at validation. Consider `z.string().cuid()` for early rejection.

---

## Low Priority

### L1. `combineDateTime` — Defensive Validation

**File:** `datetime-utils.ts`

No validation that `time` matches `HH:MM` format. Malformed time strings produce `Invalid Date` silently.

### L2. No Pagination on `listMine()`

**File:** `bookings.service.ts` L77

Returns all bookings for a user. Fine for MVP but will degrade for power users.

---

## Positive Observations

- Clean file organization, all files under 200 LOC
- Kebab-case naming followed
- `@unique` on `slotId` is a solid DB-level double-book prevention
- Partial unique index for one-active-booking is excellent defensive design
- Proper use of Zod for input validation at shared package level
- Transaction used in `create()` — correct boundary
- `BOOKING_INCLUDE` constant avoids repetition (DRY)
- `ScheduleModule` properly registered in `app.module.ts`
- VN timezone handling in `combineDateTime` is correct (fixed UTC+7, no DST ambiguity)

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Add `FOR UPDATE` lock or catch `P2002` on slot in `create()`
2. **[CRITICAL]** Add doctor ownership verification to `confirm()`, `complete()`, `noShow()`
3. **[HIGH]** Add status guard in cron update WHERE clause
4. **[HIGH]** Wrap `cancel()` in interactive transaction with status re-check
5. **[MEDIUM]** Validate `filter` query param
6. **[MEDIUM]** Add CUID validation to booking schemas

## Unresolved Questions

- Is horizontal scaling planned? If yes, C1 and H1 become urgent
- Should SUPERADMIN also be able to complete/no-show, or only DOCTOR?
- Is there a plan for booking history pagination?
