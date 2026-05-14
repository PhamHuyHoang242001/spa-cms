# Phase 04: Backend Cron Job + Integration Tests

**Priority:** High | **Status:** Pending | **Est:** 0.5d | **Depends:** Phase 03

## Overview

1. Migrate booking expiry cron from @nestjs/schedule to node-cron
2. Write integration tests with supertest for all 35+ API endpoints

## Part A: Cron Job Migration

### Source → Target
| NestJS | Express |
|--------|---------|
| `bookings-cron.ts` with `@Cron('*/5 * * * *')` + `@Injectable()` | `src/cron/bookings-cron.ts` with `node-cron.schedule()` |

### Implementation
```typescript
// src/cron/bookings-cron.ts
import cron from 'node-cron';
import { prisma } from '../lib/prisma';

export function startBookingsCron() {
  cron.schedule('*/5 * * * *', async () => {
    const now = new Date();
    const overdue = await prisma.booking.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED'] }, endsAt: { lt: now } },
      select: { id: true, slotId: true },
    });
    for (const b of overdue) {
      const updated = await prisma.booking.updateMany({
        where: { id: b.id, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'EXPIRED' },
      });
      if (updated.count > 0) {
        await prisma.timeSlot.update({ where: { id: b.slotId }, data: { status: 'AVAILABLE' } });
      }
    }
    if (overdue.length > 0) console.log(`[CRON] Expired ${overdue.length} booking(s)`);
  });
}
```

Register in `src/index.ts`:
```typescript
import { startBookingsCron } from './cron/bookings-cron';
startBookingsCron();
```

## Part B: Integration Tests

### Setup
```bash
pnpm add -D vitest supertest @types/supertest
```

Test file structure:
```
spa-be/
├── tests/
│   ├── setup.ts              # Prisma cleanup, seed test data
│   ├── auth.test.ts          # 5 auth endpoint tests
│   ├── doctors.test.ts       # 5 doctor endpoint tests
│   ├── services.test.ts      # 5 service endpoint tests
│   ├── slots.test.ts         # 3 slot endpoint tests
│   ├── bookings.test.ts      # 7 booking endpoint tests
│   ├── articles.test.ts      # 6 article endpoint tests
│   └── health.test.ts        # 1 health endpoint test
```

### Test Categories

**Auth tests (5):**
- Register new user → 201 + tokens
- Login with valid credentials → 200 + tokens
- Refresh with valid token → 200 + new tokens
- Get /auth/me with valid JWT → 200 + user
- Get /auth/me without JWT → 401

**Feature CRUD tests (per module):**
- GET list → 200 + array
- GET by id/slug → 200 + object
- POST create (auth + role) → 201
- PATCH update (auth + role) → 200
- DELETE (auth + role) → 200/204

**Booking lifecycle tests:**
- Create booking → slot marked BOOKED
- Cancel booking → slot freed to AVAILABLE
- Confirm → status CONFIRMED
- Complete → status COMPLETED
- No-show → status NO_SHOW + slot freed
- Duplicate booking → 409 Conflict
- Cancel after 2hr deadline → 400

**Auth guard tests:**
- Request without JWT → 401
- Request with wrong role → 403
- Request with expired JWT → 401

### vitest.config.ts
```typescript
export default {
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    sequence: { sequential: true }, // Tests modify DB state
  },
};
```

## Todo

- [ ] Create bookings-cron.ts with node-cron
- [ ] Register cron in index.ts
- [ ] Setup vitest + supertest
- [ ] Write auth tests (5)
- [ ] Write doctors tests (5)
- [ ] Write services tests (5)
- [ ] Write slots tests (3)
- [ ] Write bookings tests (7)
- [ ] Write articles tests (6)
- [ ] Write health test (1)
- [ ] All tests pass

## Success Criteria

- Cron runs every 5 min, expires overdue bookings, frees slots
- All 32+ integration tests pass
- Auth guard and role checks verified via tests
- Booking transaction tested for race conditions
