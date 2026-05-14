# Code Review: Phase 02 Core Entities

**Date:** 2026-04-22
**Reviewer:** code-reviewer
**Scope:** DoctorProfile, Service, TimeSlot modules + Prisma schema + seed + shared schemas

## Scope

- **Files:** 15 files (schema, seed, 3 modules x 3 files, 3 shared schemas, app.module, shared index)
- **LOC:** ~550 total
- **Focus:** Security, data integrity, slot generation correctness, NestJS patterns

## Overall Assessment

Solid Phase 02 implementation. Clean NestJS patterns, consistent service/controller separation, proper role guards on mutations, public reads. Zod validation in services before DB operations. All files well under 200-line limit. A few medium issues around DRY violations and one security edge case worth addressing.

---

## Critical Issues

None.

---

## High Priority

### H1. DOCTOR role can generate/block ANY doctor's slots (authorization gap)

**File:** `apps/api/src/slots/slots.controller.ts:30-34, 37-41`

Slots controller allows `DOCTOR` role to generate and block slots, but no ownership check verifies the requesting doctor owns the target slots/profile. A DOCTOR user could generate slots for or block slots of another doctor.

**Fix:** Add ownership check in `SlotsService.generateForDoctor()` and `block()` — compare `req.user.doctorProfileId` (or look up via `userId`) against the target `doctorId`. Alternatively, restrict these endpoints to SUPERADMIN only and add separate `/my-slots` endpoints for doctors.

### H2. Phone uniqueness race condition on doctor update

**File:** `apps/api/src/doctors/doctors.service.ts:88-95`

`User.phone` has `@unique` constraint in schema. When updating a doctor's phone, no uniqueness pre-check is done. Prisma will throw a raw P2002 error to the client with internal field names.

**Fix:** Catch `Prisma.PrismaClientKnownRequestError` with code `P2002` and return a friendly `BadRequestException('Phone already in use')`.

### H3. BCRYPT_ROUNDS duplicated across modules

**Files:** `apps/api/src/doctors/doctors.service.ts:12`, `apps/api/src/auth/auth.service.ts:16`, `apps/api/prisma/seed.ts:8`

The constant `BCRYPT_ROUNDS = 12` is defined in 3 places. If changed in one place and not others, password verification breaks silently.

**Fix:** Extract to shared constant, e.g. `apps/api/src/common/constants.ts` or add to `@spa/shared`.

---

## Medium Priority

### M1. Duplicated `i18nTextSchema` across shared schemas

**Files:** `packages/shared/src/schemas/doctor-schemas.ts:4-7`, `packages/shared/src/schemas/service-schemas.ts:4-7`

Identical Zod schema defined twice. Violates DRY.

**Fix:** Extract to `packages/shared/src/schemas/common-schemas.ts` and import in both.

### M2. Duplicated `addThirtyMin()` + slot time constants

**Files:** `apps/api/src/slots/slots.service.ts:11-24`, `apps/api/prisma/seed.ts:11-23`

Same function and same `MORNING_SLOTS`/`AFTERNOON_SLOTS` arrays duplicated between service and seed.

**Fix:** Move to a shared utility in `apps/api/src/common/` or `@spa/shared` and import in both places.

### M3. Seed `update: {}` means re-seeding never updates existing data

**File:** `apps/api/prisma/seed.ts:33-42, 87-112`

Upserts use empty `update: {}` — re-running seed on updated seed data (e.g., changed bio text) has no effect. This is acceptable for idempotent seeding but should be documented as intentional.

### M4. No pagination on list endpoints

**Files:** `doctors.service.ts:21`, `services.service.ts:17`, `slots.service.ts:80`

All `findMany` calls return all records. Fine for MVP but will degrade with scale.

### M5. Slot date handling — UTC vs VN timezone

**Files:** `slots.service.ts:45`, `seed.ts:212-213`

Dates constructed as `new Date('2026-01-15T00:00:00.000Z')` — this is UTC midnight. For Vietnam (UTC+7), a user requesting "2026-01-15" slots at 11 PM VN time is still on the same calendar day. This works only because the `@db.Date` column strips time. However, if any future query compares with `DateTime` instead of `Date`, timezone bugs will emerge. Document the assumption that all dates are UTC calendar dates.

---

## Low Priority

### L1. `as CreateDoctorInput` cast after safeParse

**File:** `apps/api/src/doctors/doctors.service.ts:48`

After `safeParse`, `parsed.data` already has the correct type. The `as` cast is redundant. Same pattern on line 82 with `UpdateDoctorInput`.

### L2. Missing `createdAt`/`updatedAt` on DoctorProfile

**File:** `apps/api/prisma/schema.prisma:56-68`

`Service` and `User` have `createdAt`/`updatedAt`, but `DoctorProfile` does not. Consider adding for audit consistency.

---

## Edge Cases Found by Scout

1. **Slot generation for past dates** — `generateSlotsSchema` accepts any valid `YYYY-MM-DD`, including past dates. Should validate `fromDate >= today`.
2. **Empty update body** — `updateDoctorSchema` and `updateServiceSchema` have all optional fields. An empty `{}` body passes validation and triggers a DB write that changes nothing. Consider `.refine()` to require at least one field.
3. **Slot unblock missing** — There is a `block` endpoint but no `unblock`. Blocked slots cannot be returned to AVAILABLE via API.
4. **Soft-deleted doctors still queryable by ID** — `findById()` does not filter by `active: true`, so soft-deleted doctors are still accessible via `GET /doctors/:id`. This may be intentional for admin, but public API should not expose deactivated profiles.
5. **Service `GET :slug` route conflict** — If a slug looks like a CUID (e.g., starts with `c`), `GET /services/cjld2...` could be ambiguous with a hypothetical `GET /services/:id` route. Currently no conflict exists since lookup is by slug only — but worth noting for future.

---

## Positive Observations

- Clean module separation — each domain (doctors, services, slots) is self-contained
- Zod validation at service layer, not controller — good pattern for reusability
- Proper use of `@@unique` composite index on TimeSlot for slot deduplication
- `@@index([date, status])` on TimeSlot — good for query performance
- Consistent soft-delete pattern across entities
- Guards properly applied: public reads, SUPERADMIN for mutations
- Transaction usage in `DoctorsService.create()` and `update()` for cross-table consistency
- `skipDuplicates: true` on `createMany` makes slot generation idempotent
- All files well under 200-line limit
- Kebab-case file naming followed

---

## Recommended Actions (prioritized)

1. **[H1]** Add ownership check for DOCTOR role on slot generate/block endpoints
2. **[H2]** Handle Prisma P2002 unique constraint error on phone update gracefully
3. **[H3]** Extract `BCRYPT_ROUNDS` to single shared constant
4. **[M1]** Extract `i18nTextSchema` to common schemas file
5. **[M2]** Extract `addThirtyMin()` and slot time constants to shared utility
6. **[Edge]** Add `fromDate >= today` validation in `generateSlotsSchema`
7. **[Edge]** Add `unblock` endpoint for slots
8. **[Edge]** Filter `active: true` in public `findById()` or add separate admin endpoint

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 15 |
| Total LOC | ~550 |
| Max file LOC | 123 (doctors.service.ts) |
| Type coverage | Good — Zod inferred types used |
| Security guards | Correct on all mutation endpoints |
| DRY violations | 3 (BCRYPT_ROUNDS, i18nTextSchema, addThirtyMin) |
| Linting issues | 0 apparent |

---

## Unresolved Questions

1. Should DOCTOR role be allowed to manage their own slots, or should slot management be SUPERADMIN-only?
2. Is the soft-deleted doctor being accessible via `GET /doctors/:id` intentional for admin use?
3. Will pagination be needed before the next phase, or is it deferred to a later iteration?
