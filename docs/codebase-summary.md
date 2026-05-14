# Codebase Summary — K-Beauty Spa CMS

**Generated:** 2026-04-22 | **Phase:** 02-Core Entities Completed | **Total Files:** 110+

## Project Statistics

| Metric | Value |
|--------|-------|
| **Total Tokens** | 48,447 |
| **Total Characters** | 176,814 |
| **Source Files** | 94 |
| **Largest File** | tester-260422-0015-phase-01-auth.md (3,323 tokens) |
| **Languages** | TypeScript, TSX, YAML, JSON, Markdown |

## Core Architecture

**Monorepo:** Turborepo (pnpm workspaces)

```
spa-cms/
├── apps/
│   ├── api/              (NestJS 11 backend)
│   └── web/              (Next.js 16 frontend)
├── packages/
│   ├── shared/           (Zod schemas, types)
│   └── tsconfig/         (Shared TS config)
├── plans/                (Development phases & reports)
├── docs/                 (Documentation)
└── [config files]        (turbo.json, pnpm-workspace.yaml, etc.)
```

## Backend (apps/api) — NestJS 11

### Directory Structure (Phase 01-02)
```
apps/api/
├── src/
│   ├── auth/                       (Authentication & JWT)
│   │   ├── auth.controller.ts      (5 endpoints: register, login, refresh, logout, me)
│   │   ├── auth.service.ts         (Business logic: hashing, token generation)
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts     (Passport JWT validation)
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts   (Protect routes with JWT)
│   │   │   └── roles.guard.ts      (Role-based access control)
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/                      (User management)
│   │   ├── users.service.ts        (Create, find by email/id)
│   │   └── users.module.ts
│   ├── doctors/                    (Phase 02 — Doctor profiles)
│   │   ├── doctors.controller.ts   (List, detail, create, update, delete)
│   │   ├── doctors.service.ts      (DoctorProfile CRUD)
│   │   └── doctors.module.ts
│   ├── services/                   (Phase 02 — K-Beauty service catalog)
│   │   ├── services.controller.ts  (List, detail by slug, create, update, delete)
│   │   ├── services.service.ts     (Service CRUD)
│   │   └── services.module.ts
│   ├── slots/                      (Phase 02 — Doctor availability slots)
│   │   ├── slots.controller.ts     (List available, generate, block)
│   │   ├── slots.service.ts        (TimeSlot CRUD, generation, ownership validation)
│   │   └── slots.module.ts
│   ├── prisma/                     (Database abstraction)
│   │   ├── prisma.service.ts       (PrismaClient wrapper)
│   │   └── prisma.module.ts        (Global module)
│   ├── app.module.ts               (Root module: imports all 6 modules)
│   ├── app.controller.ts           (Health check)
│   └── main.ts                     (Bootstrap)
├── prisma/
│   ├── schema.prisma               (User, RefreshToken, DoctorProfile, Service, TimeSlot models)
│   ├── migrations/                 (DB migration history)
│   └── seed.ts                     (Phase 02: seed 1 admin, 3 doctors, 7 services, 588 slots)
├── test/                           (E2E tests)
└── [config files]                  (nest-cli.json, tsconfig.json, etc.)
```

### Key Classes & Services

**AuthService** (`auth.service.ts`)
- `register(body)` — Hash password, create user, generate tokens
- `login(body)` — Validate credentials, generate tokens
- `refresh(body)` — Validate refresh token hash, rotate tokens
- `logout(body)` — Revoke refresh token
- `generateTokens()` — Create JWT + random refresh token
- `sha256()` — Hash refresh token for DB storage

**UsersService** (`users/users.service.ts`)
- `create(data)` — Create new user
- `findByEmail(email)` — Query user by email
- `findById(id)` — Query user by ID

**JwtStrategy** (`strategies/jwt.strategy.ts`)
- Extends PassportStrategy(Strategy)
- Validates Bearer token, extracts payload
- Checks user exists in DB
- Attaches user to request object

### API Endpoints (Phase 01-02)

**Authentication (Phase 01):**
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/auth/register` | — | `{email, password, name, phone?}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/login` | — | `{email, password}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/refresh` | — | `{refreshToken}` | `{accessToken, refreshToken}` |
| POST | `/auth/logout` | — | `{refreshToken}` | — |
| GET | `/auth/me` | Bearer | — | `{user}` |

**Doctors (Phase 02):**
| Method | Path | Guard | Body | Response |
|--------|------|-------|------|----------|
| GET | `/doctors` | — | — | `[DoctorProfile]` (active only) |
| GET | `/doctors/:id` | — | — | `DoctorProfile` details |
| POST | `/doctors` | SUPERADMIN | `{email, password, name, specialty, bio, yearsExp, ...}` | `{user, doctorProfile}` |
| PATCH | `/doctors/:id` | SUPERADMIN | `{name?, specialty?, bio?, yearsExp?, active?, ...}` | Updated profile |
| DELETE | `/doctors/:id` | SUPERADMIN | — | Soft-delete (active: false) |

**Services (Phase 02):**
| Method | Path | Guard | Body | Response |
|--------|------|-------|------|----------|
| GET | `/services` | — | — | `[Service]` (active only) |
| GET | `/services/:slug` | — | — | `Service` details by slug |
| POST | `/services` | SUPERADMIN | `{slug, name, description, priceVnd, durationMin, ...}` | Created service |
| PATCH | `/services/:id` | SUPERADMIN | `{slug?, name?, description?, priceVnd?, active?, ...}` | Updated service |
| DELETE | `/services/:id` | SUPERADMIN | — | Soft-delete (active: false) |

**Time Slots (Phase 02):**
| Method | Path | Guard | Query/Body | Response |
|--------|------|-------|-----------|----------|
| GET | `/slots` | — | `?doctorId=X&date=YYYY-MM-DD` | `[TimeSlot]` available/blocked |
| POST | `/slots/generate` | DOCTOR, SUPERADMIN | `{doctorId, fromDate, days?}` | `{generated: N}` |
| PATCH | `/slots/:id/block` | DOCTOR, SUPERADMIN | — | Updated slot status |

**Note:** Doctors can only manage own slots (service validates doctorId ownership)

### Dependencies (Key)

```json
{
  "@nestjs/common": "11.0.1",
  "@nestjs/core": "11.0.1",
  "@nestjs/jwt": "11.0.2",
  "@nestjs/passport": "11.0.5",
  "@nestjs/throttler": "6.5.0",
  "@prisma/client": "7.7.0",
  "@spa/shared": "workspace:*",
  "bcrypt": "6.0.0",
  "passport": "0.7.0",
  "passport-jwt": "4.0.1"
}
```

## Frontend (apps/web) — Next.js 16

### Directory Structure
```
apps/web/
├── app/
│   ├── [locale]/                   (Locale-aware routing wrapper)
│   │   ├── login/
│   │   │   └── page.tsx            (Locale-aware login page)
│   │   ├── register/
│   │   │   └── page.tsx            (Locale-aware register page)
│   │   ├── services/
│   │   ├── blog/
│   │   ├── me/
│   │   ├── admin/
│   │   ├── layout.tsx              (Locale layout, injects locale context)
│   │   └── page.tsx                (Locale-aware home)
│   ├── admin/                      (Admin pages - outside [locale] wrapper)
│   ├── i18n.ts                     (i18n config & routing rules)
│   ├── layout.tsx                  (Root layout)
│   └── request.ts                  (Request context for locale handling)
├── messages/                       (Translation files)
│   ├── vi.json                     (Vietnamese strings)
│   └── ko.json                     (Korean strings)
├── lib/
│   ├── api-client.ts               (Fetch wrapper with JWT & auto-refresh)
│   ├── auth-context.tsx            (React Context for auth state)
│   ├── locale-content.ts           (Utility for i18n JSON field access)
│   └── locale-switcher.tsx         (Language toggle component)
├── middleware.ts                   (i18n proxy - locale detection)
├── components/                     (Reusable components)
├── public/                         (Static assets)
└── [config files]                  (next.config.ts, tailwind.config.ts, etc.)
```

### Key Components

**api-client.ts**
- `apiPost<T>(url, body)` — POST with JWT header + auto-refresh
- `apiGet<T>(url)` — GET with JWT header
- `setTokens(access, refresh)` — Store in localStorage
- `getAccessToken()` — Retrieve from localStorage
- `clearTokens()` — Remove from localStorage
- Auto-refresh on 401: calls `/auth/refresh` and retries

**auth-context.tsx** (React Context)
- `AuthProvider` — Context provider wrapper
- `AuthContext` — Provides `{user, isLoading, login, register, logout}`
- `useAuth()` — Hook to consume auth state
- On mount: attempts session restore via stored refresh token

**Login Page** (`app/login/page.tsx`)
- Form with email + password inputs
- Calls `login()` from auth context
- Zod validation via shared schema
- Toast notifications on success/error

**Register Page** (`app/register/page.tsx`)
- Form with email + password + name + phone (optional)
- Calls `register()` from auth context
- Zod validation via shared schema
- Password ≥8 chars, email valid format

### Frontend i18n Setup (next-intl v4)

**Configuration Files:**
- `i18n.ts` — next-intl routing config, locale routing strategy (`localePrefix: 'as-needed'`)
- `middleware.ts` — Locale detection from URL/headers/cookies
- `request.ts` — Request context for accessing user locale

**Locale Routing:**
- Default locale: Vietnamese (vi) → `/services`, `/blog`, etc.
- Korean (ko) → `/ko/services`, `/ko/blog`, etc.
- Strategy: `as-needed` (no prefix for default, prefix for others)
- Admin pages outside locale wrapper → `/admin/*` (Vietnamese only)

**Translation Files** (`messages/`):
- `vi.json` → 150+ Vietnamese UI strings (navigation, forms, buttons, errors)
- `ko.json` → 150+ Korean UI strings (same keys as vi.json)

**Locale Persistence:**
- Cookie: `NEXT_LOCALE` (1-year maxAge)
- Stored on locale switch via locale-switcher component
- Retrieved on page load and set in routing context

**Dynamic Content (i18n JSON Fields):**
- DoctorProfile: `specialty` & `bio` → `{ vi: string, ko: string }`
- Service: `name` & `description` → `{ vi: string, ko: string }`
- Frontend access via `locale-content.ts` utility: `getLocalizedField(field, locale)`

**Locale Switcher Component** (`lib/locale-switcher.tsx`):
- Dropdown/button to toggle vi ↔ ko
- Updates `NEXT_LOCALE` cookie
- Navigates to localized URL path
- Persistent across login/logout

### Dependencies (Key)

```json
{
  "next": "16.2.4",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "next-intl": "4.11.0",
  "@spa/shared": "workspace:*",
  "tailwindcss": "4"
}
```

## Shared Package (packages/shared)

### Directory Structure
```
packages/shared/
├── src/
│   ├── schemas/
│   │   └── auth-schemas.ts         (Zod validators for auth)
│   ├── types/                      (TypeScript types - future)
│   └── index.ts                    (Public exports)
└── [config files]
```

### Schemas

**auth-schemas.ts**
```typescript
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
```

**Usage:**
- Backend: `registerSchema.safeParse(body)` → validation error handling
- Frontend: `zodResolver(registerSchema)` → form validation

## Database Schema (Prisma — Phase 01-02)

### Models

**User**
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  phone        String?  @unique
  passwordHash String
  name         String
  role         Role     @default(CUSTOMER)
  locale       String   @default("vi")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  refreshTokens RefreshToken[]
  doctorProfile DoctorProfile?  # Phase 02
}

enum Role {
  CUSTOMER
  DOCTOR
  SUPERADMIN
}
```

**RefreshToken**
```prisma
model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**DoctorProfile (Phase 02)**
```prisma
model DoctorProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  specialty Json     # { vi: string, ko: string }
  bio       Json     # { vi: string, ko: string }
  avatarUrl String?
  yearsExp  Int      @default(0)
  order     Int      @default(0)
  active    Boolean  @default(true)

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  timeSlots TimeSlot[]
}
```

**Service (Phase 02)**
```prisma
model Service {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        Json     # { vi: string, ko: string }
  description Json     # { vi: string, ko: string }
  priceVnd    Int
  durationMin Int
  coverUrl    String?
  gallery     String[]
  featured    Boolean  @default(false)
  active      Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**TimeSlot (Phase 02)**
```prisma
model TimeSlot {
  id        String     @id @default(cuid())
  doctorId  String
  date      DateTime   @db.Date
  startTime String     # "09:00"
  endTime   String     # "09:30"
  status    SlotStatus @default(AVAILABLE)
  createdAt DateTime   @default(now())

  doctor DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date, startTime])
  @@index([date, status])
}

enum SlotStatus {
  AVAILABLE
  BOOKED
  BLOCKED
}
```

## Development Plans & Reports

### Plans Directory (`plans/`)
```
260421-2300-k-beauty-spa-website/
├── plan.md                         (Overview of all phases)
├── phase-00-setup-monorepo.md      (✓ Completed)
├── phase-01-auth-system.md         (✓ Completed)
├── phase-02-core-entities.md       (✓ Completed)
├── phase-03-booking-logic.md       (Next)
├── ... (more phases)
└── reports/
    ├── brainstormer-*.md           (Planning notes)
    ├── fullstack-260422-0002-phase-01-auth-*.md
    ├── code-review-260422-0002-phase-01-auth.md
    ├── tester-260422-0015-phase-01-auth.md
    ├── fullstack-260422-XXXX-phase-02-core-entities-*.md
    ├── code-review-260422-XXXX-phase-02-core-entities.md
    └── tester-260422-XXXX-phase-02-core-entities.md
```

### Key Reports
- **Phase 01:** Auth service, JWT, password hashing, login/register pages
- **Phase 02:** Doctor profiles, service catalog, time slot management, seed data

## Configuration Files

### Root
- `turbo.json` — Turborepo build pipeline definition
- `pnpm-workspace.yaml` — Monorepo workspace roots
- `package.json` — Root scripts (dev, build, lint, test, db:up/down)
- `.npmrc` — pnpm configuration
- `.prettierrc` — Code formatting rules
- `.gitignore` — Git exclusions
- `README.md` — Quick start guide

### Backend (apps/api)
- `nest-cli.json` — NestJS CLI config
- `tsconfig.json` — TypeScript config
- `jest.config.js` — Test runner config
- `eslint.config.mjs` — Linting rules
- `.env.example` — Environment template
- `docker-compose.yml` — PostgreSQL container
- `Dockerfile` — API container image (future)

### Frontend (apps/web)
- `next.config.ts` — Next.js config
- `tsconfig.json` — TypeScript config
- `tailwind.config.ts` — Tailwind CSS config
- `eslint.config.mjs` — Linting rules
- `.env.example` — Environment template

### Shared
- `tsconfig.json` — Shared TS base config

## Build & Development Scripts

### Root Level
```bash
pnpm dev              # Run all apps in dev mode (Turbo)
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm typecheck        # Type-check all apps
pnpm test             # Run all tests
pnpm db:up            # Start Postgres container
pnpm db:down          # Stop Postgres container
```

### Backend Specific
```bash
pnpm --filter api dev              # Dev mode with watch
pnpm --filter api build            # Production build
pnpm --filter api start:prod       # Run production build
pnpm --filter api test             # Run unit tests
pnpm --filter api test:e2e         # Run E2E tests
pnpm --filter api lint             # Lint backend
pnpm --filter api typecheck        # Type-check backend
```

### Frontend Specific
```bash
pnpm --filter web dev              # Dev mode (http://localhost:3000)
pnpm --filter web build            # Production build
pnpm --filter web start            # Run production build
pnpm --filter web lint             # Lint frontend
pnpm --filter web typecheck        # Type-check frontend
```

## Security Features Implemented

### Phase 01-02
- ✓ bcrypt password hashing (cost 12, via `BCRYPT_ROUNDS` constant)
- ✓ JWT access tokens (15 min TTL)
- ✓ JWT refresh tokens (7 day TTL, hashed in DB)
- ✓ Token rotation on refresh (revoke old token)
- ✓ SHA-256 hashing for refresh token DB storage
- ✓ JwtAuthGuard for protected routes
- ✓ RolesGuard for role-based access (SUPERADMIN, DOCTOR, CUSTOMER)
- ✓ Zod input validation (auth, doctor, service, slot schemas)
- ✓ Rate limiting (10 req/min on `/auth/*`)
- ✓ No password exposure in API responses
- ✓ Doctor slot ownership validation (DOCTOR can only modify own slots)
- ✓ Soft-delete pattern (active flag for DoctorProfile & Service)
- ✓ i18n support (vi, ko) for Doctor specialty/bio and Service name/description

### Not Yet Implemented (Future)
- [ ] HTTPS/TLS enforcement
- [ ] CORS configuration
- [ ] Helmet.js security headers (added to imports, not fully configured)
- [ ] CSRF protection
- [ ] SQL injection protection (via Prisma ORM)
- [ ] XSS protection (CSP headers)
- [ ] Refresh token reuse detection
- [ ] Login audit logs
- [ ] Rate limiting per user
- [ ] Image upload/storage for avatars and galleries

## Testing Coverage (Phase 01-02)

### Unit Tests
- `AuthService` — register, login, refresh, logout logic
- `UsersService` — CRUD operations
- `JwtStrategy` — Token validation
- `DoctorsService` — CRUD, soft-delete, listing active
- `ServicesService` — CRUD, slug lookup, soft-delete
- `SlotsService` — Generation, availability query, blocking, ownership validation

### Integration Tests
- Auth endpoints with valid/invalid inputs
- Guards and decorators
- Doctor/Service CRUD with role guards
- Slot generation and blocking with ownership checks

### E2E Tests
- Full auth workflow: register → login → /me → refresh → logout
- Doctor admin flow: create → update → list → soft-delete
- Service admin flow: create → update → list by slug → soft-delete
- Slot workflow: generate → query available → block own slot
- Error scenarios: invalid credentials, expired token, rate limit, role violations

## Known Limitations & Trade-offs

### Token Storage
- Access token in-memory: Fast, but vulnerable to XSS
- Refresh token in localStorage: Survives page reload, but susceptible to XSS
- Alternative: HttpOnly cookie (requires same-domain or BFF)

### Refresh Token Hashing
- Using SHA-256 instead of bcrypt for O(1) DB lookup
- Safe because refresh tokens are high-entropy random strings
- Alternative: bcrypt for comparison (slower)

### Scalability
- Refresh tokens stored in relational DB (not Redis)
- Works for Phase 01-02 scale
- Future optimization: Redis cache for token revocation

### Error Messages
- Generic "Invalid credentials" to prevent user enumeration
- Trade-off: Less helpful for legitimate users
- Future: Detailed errors in logs/admin panel

## File Size & Complexity

### Largest Backend Files
1. `auth.service.ts` — ~148 lines (token generation, bcrypt, validation)
2. `auth.controller.ts` — ~50 lines (5 endpoints)
3. `app.module.ts` — ~25 lines (module wiring)

### Largest Frontend Files
1. `auth-context.tsx` — ~150 lines (context, hooks, session restore)
2. `api-client.ts` — ~100 lines (fetch wrapper, token management)

### Complexity Analysis
- All files follow single responsibility principle
- No circular dependencies detected
- Clear separation of concerns (controller → service → repository)

## Dependencies & Versions

### Core Framework Versions
- **NestJS:** 11.0.1 (latest stable)
- **Next.js:** 16.2.4 (latest stable)
- **Prisma:** 7.7.0 (latest stable)
- **Node:** 20+ required
- **pnpm:** 10.33.0

### Security-Relevant Versions
- **bcrypt:** 6.0.0 (password hashing)
- **passport:** 0.7.0 (auth strategy framework)
- **passport-jwt:** 4.0.1 (JWT validation)
- **Zod:** latest (input validation)

### No Known Security Issues
- All dependencies up-to-date as of 2026-04-22
- No critical vulnerabilities detected

## Code Quality Metrics

| Metric | Status |
|--------|--------|
| Linting | ✓ Configured (ESLint) |
| Type Safety | ✓ Strict mode enabled |
| Testing | ✓ Jest + E2E configured |
| Code Coverage | ⚠ Not tracked yet |
| Documentation | ✓ Inline comments present |

## Phase 02 Summary

**Implemented:**
- ✓ DoctorProfile model (1:1 with User, i18n specialty/bio, soft-delete)
- ✓ Service model (i18n name/description, slug-based lookup, soft-delete)
- ✓ TimeSlot model (30-min blocks, AVAILABLE/BOOKED/BLOCKED status, doctor ownership)
- ✓ Doctors module: CRUD endpoints with SUPERADMIN guard
- ✓ Services module: CRUD endpoints with soft-delete pattern
- ✓ Slots module: List available, generate, block with DOCTOR/SUPERADMIN guards
- ✓ Seed script: 1 admin, 3 doctors (10/8/6 years exp), 7 services, 588 slots (14 days x 3 doctors)
- ✓ Shared schemas: doctor-schemas, service-schemas, slot-schemas
- ✓ Shared constant: BCRYPT_ROUNDS = 12

**Architecture Decisions:**
- i18n JSON fields for multilingual content (vi, ko)
- Soft-delete via `active` boolean flag (no hard deletes)
- Slot generation: 30-min blocks, 09:00-12:00 + 14:00-18:00
- Doctor ownership validation: DOCTOR role can only modify own profile/slots

## Phase i18n Summary (next-intl v4)

**Implemented:**
- ✓ next-intl v4.11.0 installed, configured with locale routing
- ✓ `localePrefix: 'as-needed'` strategy (vi default, ko prefixed)
- ✓ Locale routing: all pages moved to `app/[locale]/` wrapper
- ✓ Admin pages outside locale wrapper (Vietnamese only)
- ✓ Locale detection via proxy (middleware.ts equivalent for Next.js 16)
- ✓ Locale persistence via `NEXT_LOCALE` cookie (1-year maxAge)
- ✓ Translation files: messages/vi.json, messages/ko.json (~150+ keys)
- ✓ All UI strings translated (navigation, forms, errors, buttons)
- ✓ Dynamic content rendering: Doctor specialty/bio, Service name/description
- ✓ Locale switcher component for vi ↔ ko toggle
- ✓ SEO metadata (meta tags) per locale
- ✓ Production build: 28/28 pages (all static-optimized)
- ✓ TypeScript strict mode: all types correct

**Architecture Decisions:**
- Locale routing via `[locale]` directory (Next.js App Router pattern)
- Cookie-based persistence (survives browser close, follows user login)
- DB JSON fields (`{ vi, ko }`) for content, frontend renders by locale
- Static translation files (next-intl messages) for UI strings
- Admin outside locale wrapper to keep Vietnamese-only interface

## Completed Phases Beyond Core

**Phase 03 — Booking Logic (Completed):**
- ✓ Booking model (User + Service + Doctor + TimeSlot)
- ✓ Booking creation with slot availability checking
- ✓ Booking cancellation and rescheduling
- ✓ Availability constraints and conflict detection
- ✓ Booking status tracking (CONFIRMED, CANCELLED, COMPLETED, EXPIRED, NO_SHOW)

**Phase 04-09 — Additional Phases (Completed):**
- ✓ Landing & marketing pages (hero, services grid, doctors showcase)
- ✓ Blog system (articles, slug routing, featured posts)
- ✓ Customer dashboard (bookings, profile management)
- ✓ Admin panel (CRUD for services, doctors, bookings, articles)
- ✓ Polish & optimization (TypeScript strict, performance, mobile)
- ✓ Debug & audit (all endpoints fixed, auth refresh, timezone handling)
- ✓ i18n setup (Vietnamese-Korean language switching)

**Current Status:** MVP complete with full i18n support, all phases debugged and tested

## Deployment Readiness Checklist

### Phase 01 Complete
- ✓ Auth system fully functional
- ✓ Error handling comprehensive
- ✓ Input validation in place
- ✓ Database migrations manageable
- ✓ Environment config template provided

### Before Production (Phase 09)
- [ ] Environment secrets configured
- [ ] Database backup/restore tested
- [ ] HTTPS/TLS enabled
- [ ] CORS whitelist configured
- [ ] Rate limiting tuned
- [ ] Error tracking (Sentry/similar)
- [ ] Performance monitoring
- [ ] Log aggregation
- [ ] Health checks implemented
- [ ] Graceful shutdown handling

## Related Documentation

- **Project Overview:** `project-overview-pdr.md` — Vision, scope, tech stack
- **System Architecture:** `system-architecture.md` — Detailed design, data flows
- **Code Standards:** `code-standards.md` — Naming, patterns, guidelines
- **Phase Plans:** `plans/260421-2300-k-beauty-spa-website/` — Implementation details

## Quick Reference

### Start Development
```bash
pnpm install
pnpm db:up
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:3001
```

### Run Tests
```bash
pnpm test              # All tests
pnpm --filter api test:e2e    # Backend E2E
```

### Lint & Format
```bash
pnpm lint              # Check all
pnpm format            # Format all (requires script)
```

### Database
```bash
pnpm db:up             # Start container
pnpm db:down           # Stop container
pnpm --filter api prisma migrate dev --name migration_name
```

### Deploy
```bash
pnpm build             # Build all apps
# Follow Phase 09 deployment guide for hosting
```
