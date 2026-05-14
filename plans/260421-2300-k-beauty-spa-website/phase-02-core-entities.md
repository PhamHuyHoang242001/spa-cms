# Phase 02 — Core Entities (Doctor, Service, TimeSlot) + Seed

**Priority:** High | **Status:** completed | **Est:** 1.5d | **Depends:** 01

## Overview
Models cho DoctorProfile (extends User), Service (gói chăm sóc), TimeSlot (khung giờ available per doctor). CRUD API (admin-only mutation, public read). Seed 7 K-beauty packages + 3 doctors.

## Data Model (Prisma)

```prisma
model DoctorProfile {
  id         String @id @default(cuid())
  userId     String @unique
  specialty  Json                  // { vi, ko }
  bio        Json                  // { vi, ko }
  avatarUrl  String?
  yearsExp   Int    @default(0)
  order      Int    @default(0)   // display order
  active     Boolean @default(true)

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  timeSlots  TimeSlot[]
  bookings   Booking[]
}

model Service {
  id          String  @id @default(cuid())
  slug        String  @unique
  name        Json                 // { vi, ko }
  description Json                 // { vi, ko }
  priceVnd    Int
  durationMin Int                  // 60/75/90
  coverUrl    String?
  gallery     String[]             // array URLs
  featured    Boolean @default(false)
  active      Boolean @default(true)
  order       Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bookings    Booking[]
}

enum SlotStatus { AVAILABLE BOOKED BLOCKED }

model TimeSlot {
  id        String     @id @default(cuid())
  doctorId  String
  date      DateTime   @db.Date        // VN local date
  startTime String                     // "09:00"
  endTime   String                     // "09:30"
  status    SlotStatus @default(AVAILABLE)
  createdAt DateTime   @default(now())

  doctor    DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  booking   Booking?

  @@unique([doctorId, date, startTime])
  @@index([date, status])
}
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/doctors` | public | List active doctors |
| GET | `/doctors/:id` | public | Detail |
| POST | `/doctors` | SUPERADMIN | Create (creates User with DOCTOR role + profile) |
| PATCH | `/doctors/:id` | SUPERADMIN | Update |
| DELETE | `/doctors/:id` | SUPERADMIN | Soft delete (active=false) |
| GET | `/services` | public | List active services |
| GET | `/services/:slug` | public | Detail |
| POST /PATCH /DELETE | `/services/*` | SUPERADMIN | CRUD |
| GET | `/slots?doctorId=&date=` | public | List AVAILABLE slots |
| POST | `/slots/generate` | SUPERADMIN/DOCTOR | Generate next 30d for doctor |
| PATCH | `/slots/:id/block` | DOCTOR/SUPERADMIN | Mark BLOCKED |

## Files to Create

- `apps/api/src/doctors/doctors.{module,controller,service}.ts`
- `apps/api/src/services/services.{module,controller,service}.ts`
- `apps/api/src/slots/slots.{module,controller,service}.ts`
- `apps/api/prisma/seed.ts` — seed script
- `packages/shared/src/schemas/{doctor,service,slot}.ts` — Zod
- `packages/shared/src/constants/packages.ts` — 7 K-beauty packages data

## Seed Data (packages)

From brainstorm §7 — 7 packages: Hydra-Glow, Aqua Peel, Gold Jelly Mask, Acne Clear, Whitening Vit C, MTS Micro-Needling, Couple/Bridal. Each with `{ vi, ko }` name + description, priceVnd, durationMin, slug.

Seed 3 doctors: Dr. Kim (specialty: anti-aging), Dr. Park (acne/problem skin), Dr. Nguyen (general). Email `doctor1@spa.local` etc., password `Doctor123!` (dev only).

Seed 1 superadmin: `admin@spa.local` / `Admin123!`.

## Implementation Steps

1. Extend Prisma schema; run migration `add_core_entities`.
2. DoctorsService: create user with DOCTOR role + profile trong transaction.
3. ServicesService: standard CRUD với Cloudinary URL validation.
4. SlotsService:
   - `generateForDoctor(doctorId, fromDate, days=30)`: loop từng ngày, tạo slot mỗi 30p cho 9-12 và 14-18 (12 slot/ngày), skip nếu đã tồn tại (unique constraint).
   - `listAvailable({doctorId, date})`: where status=AVAILABLE, order by startTime.
   - `block(slotId)`: flip status BLOCKED; reject nếu có Booking.
5. Public endpoints không dùng guard.
6. Write `seed.ts`: upsert superadmin + 3 doctors + 7 services + generate slots cho 14 ngày tới.
7. Add package.json script `db:seed` → `tsx prisma/seed.ts`, link vào `prisma.seed` field.
8. Test qua HTTP client (Postman/Bruno).

## Todo

- [x] Prisma models (Doctor, Service, TimeSlot) + migration
- [x] DoctorsModule with CRUD
- [x] ServicesModule with CRUD
- [x] SlotsModule với generate + list + block
- [x] Seed script (1 admin, 3 doctors, 7 services, 14d slots)
- [x] Shared Zod schemas
- [x] Public GET endpoints return expected shape (with i18n JSON)
- [x] Postman collection / HTTP file cho manual test

## Success Criteria

- `pnpm --filter api prisma db seed` populates DB without error.
- `GET /services` returns 7 items với cả vi/ko content.
- `GET /doctors` returns 3 doctors với avatar placeholder.
- `POST /slots/generate` cho mỗi doctor tạo 14 days × 12 slots = 168 slots.
- `GET /slots?doctorId=X&date=2026-04-22` returns 12 AVAILABLE.

## Risks

- `Json` column cho i18n → TS types phải cast; khuyến khích `z.object({vi,ko})` validate.
- Slot generation timezone confusion → chỉ dùng `DateOnly` cho `date` field, treat tất cả như VN local; không dùng `new Date()` trực tiếp trong loop.

## Next Steps

Phase 03 Booking logic dùng TimeSlot + Service + Doctor làm input.
