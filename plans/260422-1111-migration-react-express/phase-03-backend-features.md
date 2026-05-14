# Phase 03: Backend Feature Routes

**Priority:** High | **Status:** Pending | **Est:** 1d | **Depends:** Phase 02

## Overview

Migrate all 6 feature modules (Doctors, Services, Slots, Bookings, Articles, Health) from NestJS controllers/services to Express routes/services. Business logic stays nearly identical — main change is removing NestJS decorators and DI.

## Source → Target Mapping

| NestJS Module | Service LOC | Controller LOC | Express Route | Express Service |
|---------------|-------------|----------------|---------------|-----------------|
| DoctorsModule | ~120 | ~60 | `src/routes/doctors-routes.ts` | `src/services/doctors-service.ts` |
| ServicesModule | ~100 | ~50 | `src/routes/services-routes.ts` | `src/services/services-service.ts` |
| SlotsModule | ~80 | ~40 | `src/routes/slots-routes.ts` | `src/services/slots-service.ts` |
| BookingsModule | ~210 | ~84 | `src/routes/bookings-routes.ts` | `src/services/bookings-service.ts` |
| ArticlesModule | ~110 | ~60 | `src/routes/articles-routes.ts` | `src/services/articles-service.ts` |
| HealthModule | ~10 | ~10 | `src/routes/health-routes.ts` | (inline) |

## Migration Pattern (same for all modules)

### Service: Remove NestJS, keep logic
```typescript
// BEFORE (NestJS)
@Injectable()
export class FooService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll() { return this.prisma.foo.findMany(); }
}

// AFTER (Express)
import { prisma } from '../lib/prisma';
export async function findAll() { return prisma.foo.findMany(); }
```

### Route: Decorators → Express handlers
```typescript
// BEFORE (NestJS)
@Get(':id') @UseGuards(JwtAuthGuard) findOne(@Param('id') id: string) {}

// AFTER (Express)
router.get('/:id', auth, async (req, res, next) => {
  try { res.json(await svc.findOne(req.params.id)); } catch(e) { next(e); }
});
```

## Implementation Steps

### 1. Doctors (6 routes)

**Routes:**
| Method | Path | Auth | Roles | Source |
|--------|------|------|-------|--------|
| GET | `/doctors` | None | — | Public listing |
| GET | `/doctors/:id` | None | — | Public detail |
| POST | `/doctors` | JWT | SUPERADMIN | Create doctor + user account |
| PATCH | `/doctors/:id` | JWT | SUPERADMIN | Update doctor profile |
| DELETE | `/doctors/:id` | JWT | SUPERADMIN | Soft-delete (active=false) |

**Service key logic:**
- `create()`: Creates User (DOCTOR role) + DoctorProfile in transaction
- Includes bcrypt password hashing for doctor user account
- Bilingual fields: specialty, bio (JSON)

### 2. Services (5 routes)

**Routes:**
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | `/services` | None | — |
| GET | `/services/:slug` | None | — |
| POST | `/services` | JWT | SUPERADMIN |
| PATCH | `/services/:id` | JWT | SUPERADMIN |
| DELETE | `/services/:id` | JWT | SUPERADMIN |

**Service key logic:**
- Slug-based lookup for public routes
- Soft-delete via `active` flag
- Bilingual fields: name, description (JSON)

### 3. Slots (3 routes)

**Routes:**
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | `/slots` | None | — |
| POST | `/slots/generate` | JWT | SUPERADMIN, DOCTOR |
| PATCH | `/slots/:id/block` | JWT | SUPERADMIN, DOCTOR |

**Service key logic:**
- `generate()`: Creates 30-min blocks for date range
- Doctor can only generate/block their own slots
- Query filters: doctorId, date, status

### 4. Bookings (7 routes) — MOST COMPLEX

**Routes:**
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | `/bookings` | JWT | CUSTOMER |
| GET | `/bookings/me` | JWT | — |
| GET | `/bookings/:id` | JWT | — |
| PATCH | `/bookings/:id/cancel` | JWT | CUSTOMER, SUPERADMIN |
| PATCH | `/bookings/:id/confirm` | JWT | DOCTOR, SUPERADMIN |
| PATCH | `/bookings/:id/complete` | JWT | DOCTOR |
| PATCH | `/bookings/:id/no-show` | JWT | DOCTOR |

**Service key logic (MUST preserve exactly):**
- `create()`: Transaction — check active bookings → verify slot → mark BOOKED → create booking
- Catches P2002 (unique constraint) for concurrent booking attempts
- `cancel()`: Time-based validation (2hr buffer for CUSTOMER), frees slot
- `confirm()/complete()/noShow()`: Status transition with doctor ownership check
- `listMine()`: Supports 'active'/'history' filter groups
- `findById()`: Authorization check (owner OR doctor OR superadmin)

### 5. Articles (6 routes)

**Routes:**
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | `/articles` | None | — |
| GET | `/articles/:slug` | None | — |
| POST | `/articles` | JWT | SUPERADMIN, DOCTOR |
| PATCH | `/articles/:id` | JWT | SUPERADMIN, DOCTOR |
| PATCH | `/articles/:id/publish` | JWT | SUPERADMIN, DOCTOR |
| DELETE | `/articles/:id` | JWT | SUPERADMIN, DOCTOR |

**Service key logic:**
- Auto-slugify from title.vi (Vietnamese → ASCII)
- Pagination: page=1, limit=10
- Tag filtering via Prisma `has` operator
- Publish control via publishedAt timestamp

### 6. Health (1 route)

```typescript
router.get('/', (req, res) => res.json({ status: 'ok' }));
```

### 7. Mount all routes in `src/index.ts`

```typescript
import authRoutes from './routes/auth-routes';
import doctorsRoutes from './routes/doctors-routes';
import servicesRoutes from './routes/services-routes';
import slotsRoutes from './routes/slots-routes';
import bookingsRoutes from './routes/bookings-routes';
import articlesRoutes from './routes/articles-routes';
import healthRoutes from './routes/health-routes';

app.use('/auth', authRoutes);
app.use('/doctors', doctorsRoutes);
app.use('/services', servicesRoutes);
app.use('/slots', slotsRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/articles', articlesRoutes);
app.use('/health', healthRoutes);
```

## Todo

- [ ] Create doctors-service.ts + doctors-routes.ts (5 routes)
- [ ] Create services-service.ts + services-routes.ts (5 routes)
- [ ] Create slots-service.ts + slots-routes.ts (3 routes)
- [ ] Create bookings-service.ts + bookings-routes.ts (7 routes)
- [ ] Create articles-service.ts + articles-routes.ts (6 routes)
- [ ] Create health-routes.ts (1 route)
- [ ] Mount all routes in index.ts
- [ ] Manual curl test for each public endpoint
- [ ] Manual curl test for each protected endpoint

## Success Criteria

- All 27 feature routes respond correctly
- Public routes (GET services, doctors, articles) return seeded data
- Protected routes return 401 without JWT
- Role-restricted routes return 403 for wrong role
- Booking create uses transaction (no race conditions)
- Articles pagination works with page/tag query params
