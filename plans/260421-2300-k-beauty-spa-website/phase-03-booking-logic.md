# Phase 03 — Booking Logic (Core)

**Priority:** Critical | **Status:** completed | **Est:** 2.5d | **Depends:** 02

## Overview
Transactional booking creation (no double-book, 1 active/user), cron auto-expire, user cancel. Core business logic của toàn app.

## Data Model (Prisma)

```prisma
enum BookingStatus { PENDING CONFIRMED COMPLETED EXPIRED CANCELLED NO_SHOW }

model Booking {
  id          String        @id @default(cuid())
  userId      String
  doctorId    String
  serviceId   String
  slotId      String        @unique      // DB-level no double-book
  status      BookingStatus @default(PENDING)
  note        String?
  adminNote   String?                    // doctor's internal note
  startsAt    DateTime                   // denormalized từ slot
  endsAt      DateTime
  cancelledAt DateTime?
  cancelReason String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user    User          @relation(fields: [userId], references: [id])
  doctor  DoctorProfile @relation(fields: [doctorId], references: [id])
  service Service       @relation(fields: [serviceId], references: [id])
  slot    TimeSlot      @relation(fields: [slotId], references: [id])

  @@index([userId, status])
  @@index([doctorId, startsAt])
}
```

## Critical Postgres Constraint (raw SQL migration)

```sql
-- Enforce max 1 active booking per user
CREATE UNIQUE INDEX one_active_booking_per_user
  ON "Booking" ("userId")
  WHERE status IN ('PENDING','CONFIRMED');
```

Add via `prisma migrate` custom SQL file.

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/bookings` | CUSTOMER | Create booking với `{serviceId, doctorId, slotId, note?}` |
| GET | `/bookings/me` | any user | List own bookings (active + history tabs) |
| GET | `/bookings/:id` | owner or DOCTOR/SUPERADMIN | Detail |
| PATCH | `/bookings/:id/cancel` | owner (≥2h before) or SUPERADMIN | Cancel |
| PATCH | `/bookings/:id/confirm` | DOCTOR/SUPERADMIN | PENDING→CONFIRMED |
| PATCH | `/bookings/:id/complete` | DOCTOR | CONFIRMED→COMPLETED (sau treatment) |
| PATCH | `/bookings/:id/no-show` | DOCTOR | Mark NO_SHOW |

## Core Create Flow (Transactional)

```typescript
async create(userId: string, dto: CreateBookingDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Check user has no active booking
    const active = await tx.booking.findFirst({
      where: { userId, status: { in: ['PENDING','CONFIRMED'] } }
    });
    if (active) throw new ConflictException('ACTIVE_BOOKING_EXISTS');

    // 2. Lock + validate slot
    const [slot] = await tx.$queryRaw<Slot[]>`
      SELECT * FROM "TimeSlot"
      WHERE id = ${dto.slotId} AND "doctorId" = ${dto.doctorId}
      FOR UPDATE`;
    if (!slot || slot.status !== 'AVAILABLE')
      throw new ConflictException('SLOT_UNAVAILABLE');

    // 3. Compute startsAt/endsAt (Asia/Ho_Chi_Minh local → UTC)
    const startsAt = combineDateTime(slot.date, slot.startTime);
    const endsAt   = combineDateTime(slot.date, slot.endTime);

    // 4. Flip slot + create booking
    await tx.timeSlot.update({ where:{id:slot.id}, data:{status:'BOOKED'}});
    return tx.booking.create({
      data: { userId, doctorId: dto.doctorId, serviceId: dto.serviceId,
              slotId: slot.id, startsAt, endsAt, note: dto.note }
    });
  });
}
```

Relies on partial unique index + `@unique slotId` + FOR UPDATE for triple safety.

## Cron Expire Job

```typescript
@Cron('*/5 * * * *')  // every 5 minutes
async expireOverdueBookings() {
  const now = new Date();
  const toExpire = await this.prisma.booking.findMany({
    where: { status: { in: ['PENDING','CONFIRMED'] }, endsAt: { lt: now } }
  });
  for (const b of toExpire) {
    await this.prisma.$transaction([
      this.prisma.booking.update({ where:{id:b.id}, data:{status:'EXPIRED'}}),
      this.prisma.timeSlot.update({ where:{id:b.slotId}, data:{status:'AVAILABLE'}}),
    ]);
  }
  this.logger.log(`Expired ${toExpire.length} bookings`);
}
```

## Cancel Flow

- User cancel: check ownership + `startsAt - now > 2h` → flip status CANCELLED, slot → AVAILABLE.
- Admin cancel: skip 2h rule, require `cancelReason`.

## Files to Create

- `apps/api/src/bookings/bookings.{module,controller,service}.ts`
- `apps/api/src/bookings/bookings.cron.ts`
- `apps/api/src/bookings/dto/*.ts`
- `apps/api/prisma/migrations/xxx_booking_partial_unique/migration.sql` — raw SQL for partial index
- `apps/api/src/common/utils/datetime.ts` — `combineDateTime` helper using `date-fns-tz`, fixed TZ Asia/Ho_Chi_Minh
- `packages/shared/src/schemas/booking.ts`

## Implementation Steps

1. Prisma schema: Booking model + BookingStatus enum + migration.
2. Create raw SQL migration file cho partial unique index.
3. Install `@nestjs/schedule date-fns date-fns-tz`.
4. ScheduleModule.forRoot() trong AppModule.
5. BookingsService with create/list/cancel/confirm/complete methods.
6. BookingsCron with @Cron decorator.
7. Ownership guard: `@CurrentUser()` + check `booking.userId === user.id` hoặc role admin.
8. Write integration test (Jest + supertest): two concurrent creates cùng slotId → 1 success 1 fail.

## Todo

- [x] Booking model + enum + migration
- [x] Raw SQL partial unique index migration
- [x] BookingsModule + service + controller
- [x] Create booking transactional với FOR UPDATE
- [x] List /me với status filter (active | history)
- [x] Cancel with 2h rule
- [x] Admin confirm/complete/no-show
- [x] Cron expire job
- [x] datetime helper với fixed TZ
- [x] Concurrency test (2 parallel creates)
- [x] Manual test full flow via HTTP

## Security & Integrity

- **DB unique on slotId** — last line of defense.
- **Partial unique on userId+status** — enforces 1 active.
- **FOR UPDATE** — prevent TOCTOU race.
- **Cancel 2h rule** — server-side compute (không tin client time).

## Success Criteria

- 2 parallel POST /bookings same slot → 1 success, 1 ConflictException.
- 2 parallel POST /bookings same user different slots → 1 success, 1 ACTIVE_BOOKING_EXISTS.
- Cron expires booking có endsAt quá now → status EXPIRED, slot AVAILABLE lại.
- Cancel < 2h → 400; Cancel > 2h → 200 + slot freed.

## Risks

- Cron restart lost schedule → NestJS Schedule in-memory, OK vì job idempotent (compute-on-demand).
- Timezone bug when DST → VN không có DST, an toàn; nhưng tránh new Date() without TZ.

## Next Steps

Phase 04 landing + Phase 06 customer dashboard consume API này.
