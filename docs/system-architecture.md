# System Architecture — K-Beauty Spa CMS

**Last Updated:** 2026-04-22 | **Phase:** 02-Core Entities Completed

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Internet / Browser                        │
└─────────────────┬───────────────────────────────────┬───────────┘
                  │                                   │
        ┌─────────▼─────────┐              ┌──────────▼──────────┐
        │   Next.js 16      │              │    NestJS 11 API    │
        │   (Port 3000)     │◄────────────►│   (Port 3001)       │
        │                   │              │                     │
        │ ┌───────────────┐ │              │ ┌─────────────────┐ │
        │ │ React Pages   │ │              │ │ Auth Controller │ │
        │ │ • Login       │ │              │ │ • Register      │ │
        │ │ • Register    │ │              │ │ • Login         │ │
        │ └───────────────┘ │              │ │ • Refresh       │ │
        │                   │              │ │ • Logout        │ │
        │ ┌───────────────┐ │              │ │ • Get /me       │ │
        │ │ Auth Context  │ │              │ └─────────────────┘ │
        │ │ • useAuth()   │ │              │ ┌─────────────────┐ │
        │ │ • auto-refresh│ │              │ │ Auth Service    │ │
        │ └───────────────┘ │              │ │ • generateTokens│ │
        │                   │              │ │ • validate hash │ │
        │ ┌───────────────┐ │              │ │ • rotate token  │ │
        │ │ api-client    │ │              │ └─────────────────┘ │
        │ │ • fetch+auth  │ │              │ ┌─────────────────┐ │
        │ │ • token store │ │              │ │ JWT Strategy    │ │
        │ └───────────────┘ │              │ │ • Bearer token  │ │
        └─────────────────────┘              │ │ validation      │ │
                                             │ └─────────────────┘ │
                                             │ ┌─────────────────┐ │
                                             │ │ Prisma Service  │ │
                                             │ │ (DB abstraction)│ │
                                             │ └─────────────────┘ │
                                             └─────────────────────┘
                                                     │
                                                     │
                                      ┌──────────────▼──────────────┐
                                      │   PostgreSQL 15             │
                                      │   (Docker)                  │
                                      │                            │
                                      │ ┌──────────────────────────┐│
                                      │ │ User                     ││
                                      │ │ • id, email, password    ││
                                      │ │ • name, phone, role      ││
                                      │ │ • locale, timestamps     ││
                                      │ └──────────────────────────┘│
                                      │ ┌──────────────────────────┐│
                                      │ │ RefreshToken             ││
                                      │ │ • userId, tokenHash      ││
                                      │ │ • expiresAt, revokedAt   ││
                                      │ └──────────────────────────┘│
                                      └──────────────────────────────┘
```

## Monorepo Organization

### apps/api (NestJS Backend)
**Purpose:** REST API, auth, business logic, database access

**Key Modules (Phase 01-02):**
- `auth/` — Authentication endpoints and service
  - `auth.controller.ts` — 5 endpoints: register, login, refresh, logout, me
  - `auth.service.ts` — Token generation, bcrypt hashing, credential validation
  - `strategies/jwt.strategy.ts` — JWT Bearer token validation
  - `guards/jwt-auth.guard.ts` — Protect routes with JWT
  - `guards/roles.guard.ts` — Role-based access control
  - `decorators/current-user.decorator.ts` — Inject authenticated user
  - `decorators/roles.decorator.ts` — Specify required roles
  - `dto/` — Data Transfer Objects (register, login, refresh)

- `users/` — User management
  - `users.service.ts` — Create user, find by email/id
  - `users.module.ts` — Module wiring

- `doctors/` — Doctor profiles (NEW Phase 02)
  - `doctors.controller.ts` — List, detail, create, update, delete endpoints
  - `doctors.service.ts` — DoctorProfile CRUD, role-guard enforcement
  - `doctors.module.ts` — Module wiring

- `services/` — K-Beauty treatment services (NEW Phase 02)
  - `services.controller.ts` — List, detail (by slug), create, update, delete
  - `services.service.ts` — Service catalog CRUD
  - `services.module.ts` — Module wiring

- `slots/` — Doctor time slot management (NEW Phase 02)
  - `slots.controller.ts` — List available, generate, block endpoints
  - `slots.service.ts` — TimeSlot CRUD, slot generation, doctor ownership validation
  - `slots.module.ts` — Module wiring

- `prisma/` — Database abstraction
  - `prisma.service.ts` — PrismaClient wrapper
  - `prisma.module.ts` — Global module export

- `main.ts` — NestJS bootstrap
- `app.module.ts` — Root module, imports all sub-modules
- `app.controller.ts` — Root routes

### apps/web (Next.js Frontend)
**Purpose:** User-facing web interface with Vietnamese-Korean i18n

**Key Structure:**
- `app/` — App Router pages
  - `[locale]/` — Locale-aware routing wrapper
    - `login/page.tsx` — Locale-aware login form
    - `register/page.tsx` — Locale-aware registration form
    - `services/`, `blog/`, `me/`, etc. — All pages in locale scope
    - `layout.tsx` — Locale layout with provider context
  - `admin/` — Admin panel (outside locale wrapper, Vietnamese only)
  - `i18n.ts` — next-intl routing configuration
  - `middleware.ts` — Locale detection & routing

- `messages/` — Translation files
  - `vi.json` — Vietnamese UI strings (150+ keys)
  - `ko.json` — Korean UI strings

- `lib/` — Shared utilities
  - `api-client.ts` — HTTP client with JWT handling & auto-refresh
  - `auth-context.tsx` — React context for auth state & actions
  - `locale-content.ts` — i18n JSON field access utility
  - `locale-switcher.tsx` — Language toggle component

- `components/` — Reusable React components
- `public/` — Static assets

### packages/shared
**Purpose:** Shared types, validation schemas, DTOs

**Contents:**
- `src/schemas/auth-schemas.ts` — Zod validators (register, login, refresh)
- `src/index.ts` — Public exports

**Usage:** Imported by both `apps/api` and `apps/web` for type safety and consistent validation

## Authentication Flow

### 1. Registration Flow
```
User enters: email, password (≥8 chars), name, phone (optional)
    │
    ├──► api-client.POST('/auth/register', body)
         │
         ├──► Zod validation (registerSchema)
         │
         ├──► Check if user exists
         │    (if yes → 400 Bad Request)
         │
         ├──► Hash password with bcrypt (cost 12)
         │
         ├──► Create User in DB
         │    (id=cuid(), role=CUSTOMER, locale=vi)
         │
         ├──► Generate access token (15m, HS256)
         │    payload: {sub: userId, email, role}
         │
         ├──► Generate refresh token (random 48 bytes hex)
         │    ├─ Hash with SHA-256 (O(1) lookup)
         │    ├─ Store hash + expiresAt + userId in DB
         │    └─ Return raw token (hex) to client
         │
         └──► Response: {user, accessToken, refreshToken}
              │
              └──► Store in FE:
                   • accessToken → in-memory
                   • refreshToken → localStorage
                   • user → React state
```

### 2. Login Flow
```
User enters: email, password
    │
    ├──► api-client.POST('/auth/login', body)
         │
         ├──► Zod validation (loginSchema)
         │
         ├──► Query User by email
         │    (if not found → 401 Unauthorized)
         │
         ├──► Compare password with bcrypt
         │    (if no match → 401 Unauthorized)
         │
         ├──► Generate tokens (same as register)
         │
         └──► Response: {user, accessToken, refreshToken}
              │
              └──► Store in FE (same as register)
```

### 3. Refresh Flow (Auto-Triggered)
```
Frontend detects 401 or token expiry
    │
    ├──► api-client.POST('/auth/refresh', {refreshToken})
         │
         ├──► Zod validation (refreshTokenSchema)
         │
         ├──► Hash refresh token → SHA-256
         │
         ├──► Query RefreshToken by tokenHash
         │    (if not found → 401 Unauthorized)
         │
         ├──► Validate: !revokedAt && expiresAt > now()
         │    (if invalid → 401 Unauthorized)
         │
         ├──► Revoke old token: update revokedAt = now()
         │
         ├──► Fetch user from DB
         │
         ├──► Generate new tokens (rotation)
         │
         └──► Response: {accessToken, refreshToken}
              │
              └──► Update FE tokens + retry original request
```

### 4. Logout Flow
```
User clicks logout
    │
    ├──► api-client.POST('/auth/logout', {refreshToken})
         │
         ├──► Hash refresh token → SHA-256
         │
         ├──► Update RefreshToken: revokedAt = now()
         │
         └──► Response: 204 No Content
              │
              └──► Clear FE: remove localStorage tokens, clear state
```

### 5. Protected Route Flow
```
Frontend requests GET /auth/me with Authorization header
    │
    ├──► api-client adds: Authorization: Bearer {accessToken}
         │
         ├──► NestJS receives request
         │
         ├──► JwtAuthGuard extracts token from header
         │
         ├──► JwtStrategy validates signature & expiry
         │    (if invalid → 401 Unauthorized)
         │
         ├──► Validate payload: user exists in DB
         │    (if not → 401 Unauthorized)
         │
         ├──► Attach user to request object
         │
         └──► Route handler executes
              │
              └──► Response: {user} without passwordHash
```

## Internationalization (i18n) Flow

### Locale Routing & Detection
```
User visits app:
    │
    ├──► Browser URL: /services (default vi) or /ko/services
         │
         ├──► Middleware checks: URL path, cookies (NEXT_LOCALE), Accept-Language header
         │
         ├──► Resolve locale: vi (default) or ko
         │
         ├──► Route to [locale]/ wrapper
         │
         └──► Pass locale via next-intl context
```

### Translation Access
```
Component needs a translated string:
    │
    ├──► `useTranslations()` hook from next-intl
    │
    ├──► Fetch from messages/{locale}.json
    │
    └──► Display in target language
```

### Dynamic Content (i18n JSON Fields)
```
API returns: DoctorProfile { specialty: { vi: "...", ko: "..." } }
    │
    ├──► Frontend calls `getLocalizedField(specialty, locale)`
    │
    └──► Renders appropriate language version
```

### Locale Persistence
```
User switches language vi → ko:
    │
    ├──► Click locale-switcher component
    │
    ├──► Update NEXT_LOCALE cookie (1-year maxAge)
    │
    ├──► Navigate to /ko/current-page
    │
    └──► On next visit, cookie restores ko preference
```

## Token Management

### Access Token
- **Type:** JWT (HS256)
- **TTL:** 15 minutes
- **Storage:** In-memory (FE)
- **Payload:** `{sub: userId, email, role, iat, exp}`
- **Transport:** `Authorization: Bearer {token}`
- **Revocation:** None (expires naturally)

### Refresh Token
- **Type:** Random opaque string (48 bytes hex)
- **TTL:** 7 days
- **Storage:** 
  - Client: localStorage (FE)
  - Server: SHA-256 hash in DB (RefreshToken table)
- **Transport:** Request body `{refreshToken}`
- **Rotation:** Revokes old token on each refresh (detect theft)
- **Revocation:** User logout or expiry

### Security Properties
- **Access token in-memory:** Not vulnerable to CSRF, but XSS can steal it
- **Refresh token hashed:** DB breach doesn't expose tokens
- **Token rotation:** Reuse detection (old token invalid after refresh)
- **No sensitive data in JWT:** Can be decoded by client (base64)

## Database Schema (Phase 01-02)

### User Table (Phase 01)
```prisma
model User {
  id           String   @id @default(cuid())      # Compact ID
  email        String   @unique                   # Login identifier
  phone        String?  @unique                   # Optional secondary contact
  passwordHash String                             # bcrypt(password, 12)
  name         String                             # Display name
  role         Role     @default(CUSTOMER)        # Authorization level
  locale       String   @default("vi")            # User language
  createdAt    DateTime @default(now())           # Audit trail
  updatedAt    DateTime @updatedAt                # Audit trail

  refreshTokens RefreshToken[]
  doctorProfile DoctorProfile?                    # 1:1 with DOCTOR role (Phase 02)
}

enum Role {
  CUSTOMER      # End user (customer)
  DOCTOR        # Service provider (doctor/beautician)
  SUPERADMIN    # System administrator
}
```

### RefreshToken Table (Phase 01)
```prisma
model RefreshToken {
  id        String    @id @default(cuid())        # Token record ID
  userId    String                                # User owning token
  tokenHash String    @unique                     # SHA-256(refresh token)
  expiresAt DateTime                              # Token expiry time
  revokedAt DateTime?                             # Revocation time (null = valid)
  createdAt DateTime  @default(now())             # Audit trail

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])                               # Speed up user lookup
}
```

### DoctorProfile Table (Phase 02)
```prisma
model DoctorProfile {
  id        String  @id @default(cuid())
  userId    String  @unique                      # 1:1 link to User with DOCTOR role
  specialty Json    # { vi: string, ko: string } # i18n specialty/expertise
  bio       Json    # { vi: string, ko: string } # i18n professional biography
  avatarUrl String?                              # Profile picture URL
  yearsExp  Int     @default(0)                  # Years of experience
  order     Int     @default(0)                  # Display sort order
  active    Boolean @default(true)               # Soft-delete flag

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  timeSlots TimeSlot[]                           # Available appointment slots
}
```

### Service Table (Phase 02)
```prisma
model Service {
  id          String   @id @default(cuid())
  slug        String   @unique                   # URL identifier (kebab-case)
  name        Json     # { vi: string, ko: string } # i18n service name
  description Json     # { vi: string, ko: string } # i18n service description
  priceVnd    Int                                # Price in Vietnamese Dong
  durationMin Int      @default(60)              # Duration in minutes (30, 60, 90, etc.)
  coverUrl    String?                            # Cover/thumbnail image URL
  gallery     String[]                           # Array of gallery image URLs
  featured    Boolean  @default(false)           # Featured service flag
  active      Boolean  @default(true)            # Soft-delete flag
  order       Int      @default(0)               # Display sort order
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### TimeSlot Table (Phase 02)
```prisma
model TimeSlot {
  id        String     @id @default(cuid())
  doctorId  String                              # Foreign key to DoctorProfile
  date      DateTime   @db.Date                 # VN local date (no timezone)
  startTime String     # "09:00"                # Slot start time (24H format)
  endTime   String     # "09:30"                # Slot end time (30-min blocks)
  status    SlotStatus @default(AVAILABLE)      # AVAILABLE, BOOKED, or BLOCKED
  createdAt DateTime   @default(now())

  doctor DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date, startTime])         # One slot per doctor per time
  @@index([date, status])                       # Fast availability queries
}

enum SlotStatus {
  AVAILABLE      # Open for booking
  BOOKED         # Reserved (for future use)
  BLOCKED        # Doctor unavailable
}
```

## Error Handling & Security

### Rate Limiting
- **Throttler:** 10 requests per 60 seconds on `/auth/*`
- **Purpose:** Prevent brute force attacks on login/register
- **Response:** 429 Too Many Requests

### Validation
- **Zod schemas:** All inputs validated before processing
- **Email format:** RFC 5322 compliant via Zod
- **Password minimum:** 8 characters
- **No user enumeration:** Generic "Invalid credentials" on login failure

### Password Security
- **Hash function:** bcrypt with cost 12 (adaptive rounds)
- **Storage:** passwordHash in DB (never plaintext)
- **Transmission:** HTTPS only (required in production)
- **Handling:** Never logged or returned in API responses

### Token Security
- **JWT secrets:** ≥32 bytes, separate for access & refresh
- **No hardcoding:** Secrets via environment variables
- **Signature verification:** HS256 (HMAC-SHA256)
- **Refresh token storage:** SHA-256 hash (not plaintext)

### HTTP Headers
- **Helmet.js:** Applied globally for security headers
- **CORS:** Whitelist FE origin (configurable)
- **No stack traces:** Errors sanitized in production

## Scalability Considerations

### Horizontal Scaling
- **JWT is stateless:** No server-side session storage
- **Database-backed refresh tokens:** O(1) lookup via SHA-256 hash
- **No in-process state:** Each request independent
- **Load balancer friendly:** Can distribute across multiple instances

### Future Optimizations
- **Redis for token revocation:** Cache invalidated tokens
- **Rate limiter per-user:** Detect credential stuffing
- **Login audit logs:** Track suspicious patterns
- **Refresh token reuse detection:** Automatic logout on suspected theft

## Testing Strategy (Phase 01)

### Unit Tests
- `AuthService`: register, login, refresh, logout logic
- `JwtStrategy`: token validation and payload extraction
- `UsersService`: CRUD operations

### Integration Tests
- End-to-end auth flow: register → login → refresh → logout
- Error cases: invalid email, wrong password, expired token
- Role-based access: verify guards block unauthorized users

### E2E Tests
- Register new user via API
- Login and receive tokens
- Use access token to hit `/auth/me`
- Refresh token and verify new tokens
- Logout and verify old token revoked

## API Endpoints (Phase 01-02 + i18n)

**Note:** All frontend pages are now locale-aware (vi/ko). Backend APIs remain language-agnostic; they return i18n JSON fields and frontend renders by locale.

### Authentication (Phase 01)
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/auth/register` | — | `{email, password, name, phone?}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/login` | — | `{email, password}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/refresh` | — | `{refreshToken}` | `{accessToken, refreshToken}` |
| POST | `/auth/logout` | — | `{refreshToken}` | — |
| GET | `/auth/me` | Bearer | — | `{user}` |

### Doctors (Phase 02)
| Method | Path | Auth | Guard | Body | Response |
|--------|------|------|-------|------|----------|
| GET | `/doctors` | — | — | — | `[{id, userId, name, specialty, bio, yearsExp, ...}]` |
| GET | `/doctors/:id` | — | — | — | `{id, userId, name, specialty, bio, ...}` |
| POST | `/doctors` | Bearer | SUPERADMIN | `{email, password, name, specialty, bio, yearsExp, ...}` | `{user, doctorProfile}` |
| PATCH | `/doctors/:id` | Bearer | SUPERADMIN | `{name?, specialty?, bio?, active?, ...}` | `{id, name, specialty, ...}` |
| DELETE | `/doctors/:id` | Bearer | SUPERADMIN | — | `{id, active: false}` |

### Services (Phase 02)
| Method | Path | Auth | Guard | Body | Response |
|--------|------|------|-------|------|----------|
| GET | `/services` | — | — | — | `[{id, slug, name, priceVnd, durationMin, ...}]` |
| GET | `/services/:slug` | — | — | — | `{id, slug, name, description, priceVnd, ...}` |
| POST | `/services` | Bearer | SUPERADMIN | `{slug, name, description, priceVnd, durationMin, ...}` | `{id, slug, name, ...}` |
| PATCH | `/services/:id` | Bearer | SUPERADMIN | `{slug?, name?, priceVnd?, active?, ...}` | `{id, slug, name, ...}` |
| DELETE | `/services/:id` | Bearer | SUPERADMIN | — | `{id, active: false}` |

### Time Slots (Phase 02)
| Method | Path | Auth | Guard | Body/Query | Response |
|--------|------|------|-------|-----------|----------|
| GET | `/slots?doctorId=X&date=YYYY-MM-DD` | — | — | Query params | `[{id, doctorId, date, startTime, status, ...}]` |
| POST | `/slots/generate` | Bearer | DOCTOR, SUPERADMIN | `{doctorId, fromDate: YYYY-MM-DD, days?}` | `{generated: N}` |
| PATCH | `/slots/:id/block` | Bearer | DOCTOR, SUPERADMIN | — | `{id, status: BLOCKED}` |

**Note:** DOCTOR role can only modify own slots (doctorId validation in service).

## Related Components (Future Phases)

### Phase 03 — Booking Logic
- Booking model linking User + Service + Doctor
- Availability constraints
- Cancellation & confirmation

### Phase 06-07 — Dashboard & Admin
- Role-based UI (CUSTOMER vs DOCTOR vs SUPERADMIN)
- Query scoping by userId or role
- Audit logs for admin actions

## Deployment Architecture (Phase 09)

**Expected Structure:**
- **Frontend:** Vercel (Next.js hosting)
- **Backend:** Railway or similar (Docker-compatible)
- **Database:** Managed PostgreSQL (e.g., AWS RDS, Railway)
- **Secrets:** Environment variables (JWT_ACCESS_SECRET, etc.)

**Cross-Origin Consideration:**
- FE: https://domain.com
- API: https://api.domain.com
- CORS: Must whitelist FE origin
- Same-domain deployment preferred for HttpOnly cookies

## Monitoring & Observability

**Phase 01 Baseline:**
- Error logs via NestJS built-in logger
- Database query counts via Prisma
- No external APM yet

**Future Enhancements:**
- Structured logging (Winston or similar)
- Performance tracing (APM like Datadog)
- Error tracking (Sentry)
- Login analytics (failed attempts, geographic data)
