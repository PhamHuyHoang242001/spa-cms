# K-Beauty Spa CMS — Project Overview & PDR

**Version:** 0.0.1 | **Phase:** 01-Auth (Completed)

## Project Vision

K-Beauty Spa CMS is a fullstack monorepo for managing a Vietnamese spa booking platform with customer dashboard, admin panel, and content management. The system handles user authentication, service booking, staff management, and blog content.

## Project Scope

### Current Implementation (Phase 00-01)
- **Phase 00:** Turborepo monorepo setup with Next.js 16, NestJS 11, Prisma 7, PostgreSQL, Docker
- **Phase 01:** JWT authentication system (register/login/refresh/logout), user roles (CUSTOMER/DOCTOR/SUPERADMIN), frontend auth context and pages

### Planned Phases
- **Phase 02:** Core entities (services, doctors, availability, bookings)
- **Phase 03:** Booking logic (scheduling, cancellation, confirmation)
- **Phase 04:** Landing & marketing pages
- **Phase 05:** Blog & articles system
- **Phase 06:** Customer dashboard (bookings, profile)
- **Phase 07:** Admin panel (CRUD, reporting)
- **Phase 08:** Polish (performance, SEO, mobile)
- **Phase 09:** Deployment (staging, production)

### Completed Phases (Additional)
- **Phase 00 Audit & Debug:** Fixed all backend/frontend bugs (BookingStatus enum, timezone handling, auth refresh, double-submit prevention)
- **Phase i18n:** Vietnamese-Korean language switching via next-intl v4.11.0, locale routing with prefix strategy, translation files for 150+ UI keys, locale persistence via cookie

## Tech Stack

### Backend
- **Framework:** NestJS 11.0.1
- **Database:** PostgreSQL 15 (Docker)
- **ORM:** Prisma 7.7.0
- **Authentication:** JWT + Passport.js
- **Password Hashing:** bcrypt (cost 12)
- **Validation:** Zod (TypeScript-first)
- **Rate Limiting:** @nestjs/throttler 6.5.0

### Frontend
- **Framework:** Next.js 16.2.4 (App Router)
- **Runtime:** React 19.2.4
- **Styling:** Tailwind CSS 4
- **State Management:** React Context (auth context)
- **API Client:** Fetch-based with auto-refresh
- **i18n:** next-intl v4.11.0 (Vietnamese/Korean, locale routing, cookie persistence)

### Shared
- **Shared Package:** `packages/shared` (Zod schemas, types, DTOs)
- **Build Tool:** Turborepo (monorepo orchestration)
- **Package Manager:** pnpm 10.33.0
- **Node:** 20+

## Functional Requirements

### Phase 01 — Authentication System

**Must-Have (Completed)**
- User model with role enum (CUSTOMER, DOCTOR, SUPERADMIN)
- bcrypt password hashing (cost ≥12)
- JWT access token (15 min TTL, Bearer token)
- JWT refresh token (7 day TTL, hashed with SHA-256 in DB)
- Register endpoint with validation
- Login endpoint with credential validation
- Refresh endpoint with token rotation
- Logout endpoint (revoke refresh token)
- Get current user endpoint (`/auth/me`)
- NestJS JwtAuthGuard for protected routes
- Zod schema validation in shared package
- Frontend auth context with auto-refresh on 401
- Login & register pages with form validation
- Rate limiting on auth endpoints (10 req/min)

## Non-Functional Requirements

### Security
- Password hash: bcrypt with cost ≥12
- Refresh token rotation: revoke on each refresh (detect theft via reuse)
- No password exposure in API responses or logs
- JWT secrets ≥32 bytes (separate for access & refresh)
- Helmet.js for HTTP headers security
- CORS whitelist for FE origin

### Performance
- Access token in-memory (short-lived)
- Refresh token in localStorage (client-side)
- DB lookup via SHA-256 hash (O(1) for refresh validation)
- Throttler: 10 req/min on `/auth/*` to prevent brute force

### Maintainability
- Modular NestJS architecture (auth, users, prisma modules)
- Shared validation schemas in `packages/shared`
- Decorators for role-based access control
- Clear separation of concerns (service, controller, strategy)

### Scalability
- Database ready for future models (bookings, doctors, services)
- JWT stateless auth (horizontal scaling)
- Role-based foundation for feature-level authorization

## Architecture Overview

### Monorepo Structure
```
spa-cms/
├── apps/
│   ├── web/           # Next.js 16 frontend
│   └── api/           # NestJS 11 backend
├── packages/
│   ├── shared/        # Zod schemas, types
│   └── tsconfig/      # Shared TS config
├── plans/             # Development phases
├── docs/              # Documentation
└── turbo.json         # Turborepo config
```

### Auth System Architecture

**Frontend (Next.js)**
- `AuthContext` & `AuthProvider` manage auth state
- `useAuth()` hook for consuming auth state
- `api-client.ts` intercepts 401 → auto-refresh
- Login/register pages with Zod validation
- Tokens: access in-memory, refresh in localStorage

**Backend (NestJS)**
- `AuthService`: register, login, refresh, logout logic
- `AuthController`: REST endpoints for auth operations
- `JwtStrategy`: validates Bearer access tokens
- `JwtAuthGuard`: protects routes requiring auth
- `RolesGuard`: protects routes by role
- Throttler: rate limiting on auth endpoints
- `PrismaService`: centralized DB access

**Database (Prisma)**
- `User`: email, password hash, name, phone, role, locale
- `RefreshToken`: userId, tokenHash (SHA-256), expiresAt, revokedAt
- Role enum: CUSTOMER, DOCTOR, SUPERADMIN

## API Contracts

### Auth Endpoints

| Method | Path | Auth | Body | Response | Note |
|--------|------|------|------|----------|------|
| POST | `/auth/register` | — | `{email, password, name, phone?}` | `{user, accessToken, refreshToken}` | 201 Created |
| POST | `/auth/login` | — | `{email, password}` | `{user, accessToken, refreshToken}` | 200 OK |
| POST | `/auth/refresh` | — | `{refreshToken}` | `{accessToken, refreshToken}` | 200 OK, rotates token |
| POST | `/auth/logout` | — | `{refreshToken}` | — | 204 No Content |
| GET | `/auth/me` | Bearer | — | `{user}` | 200 OK, requires JwtAuthGuard |

### Error Responses

- **400 Bad Request:** Invalid input (email format, password length, validation)
- **401 Unauthorized:** Invalid credentials, expired/invalid token, rate limit
- **500 Internal Server Error:** Server errors

## Success Criteria

- Register with email, password (≥8 chars), name → user created, tokens returned
- Login with correct credentials → user + tokens returned
- Login with wrong password → generic 401 (no user enum)
- Refresh endpoint rotates token → old token invalid after use
- Logout revokes refresh token → subsequent refresh with old token fails
- `/auth/me` accessible with valid Bearer token → user returned
- Rate limiter blocks 11th request in 60sec window on `/auth/*`

## Known Constraints & Trade-offs

### Token Storage (FE)
- Access token in-memory: vulnerable to XSS but not to CSRF
- Refresh token in localStorage: susceptible to XSS but survives page reload
- Alternative (HttpOnly cookie): requires BFF proxy or same-origin deployment
- Current choice: accept XSS risk, mitigate via CSP and sanitization

### Refresh Token Rotation
- Rotation on every use simplifies implementation but increases DB load
- Future optimization: stateless rotation with reuse detection

### Database
- Refresh tokens stored hashed (SHA-256) to match refresh token entropy
- Separate from access token validation (stateless JWT)

## Roadmap Integration

| Phase | Status | Owner | Depends | Completion |
|-------|--------|-------|---------|------------|
| 00-Setup | ✓ Complete | Fullstack | — | 100% |
| 01-Auth | ✓ Complete | Fullstack | 00 | 100% |
| 02-Core Entities | ✓ Complete | Fullstack | 01 | 100% |
| 03-Booking Logic | ✓ Complete | Fullstack | 02 | 100% |
| 04-Landing | ✓ Complete | Frontend | 02 | 100% |
| 05-Blog | ✓ Complete | Fullstack | 02 | 100% |
| 06-Dashboard | ✓ Complete | Frontend | 03 | 100% |
| 07-Admin | ✓ Complete | Fullstack | 03 | 100% |
| 08-Polish | ✓ Complete | Fullstack | 07 | 100% |
| 09-Deploy | ✓ Complete | DevOps | 08 | 100% |
| i18n | ✓ Complete | Frontend | 02 | 100% |
| Debug & Audit | ✓ Complete | Fullstack | 01-09 | 100% |

## Related Documentation

- **Architecture:** See `system-architecture.md` for detailed system design
- **Code Standards:** See `code-standards.md` for NestJS/Next.js conventions
- **API Reference:** See individual phase docs in `plans/`
- **Codebase:** See `codebase-summary.md` for code organization
