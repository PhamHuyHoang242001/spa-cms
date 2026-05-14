# Phase 01 — Auth System (JWT Access + Refresh)

**Priority:** Critical | **Status:** completed | **Est:** 1.5d | **Depends:** 00

## Overview
User model với role (CUSTOMER/DOCTOR/SUPERADMIN), register/login/refresh/logout endpoints, JWT access token (15min) + refresh token (7d hashed in DB), NestJS Guards cho auth + role.

## Requirements
- bcrypt password hash (cost 12).
- JWT access (short-lived, returned to client).
- JWT refresh (longer, stored hashed in DB, rotate on refresh).
- Rate limit login/register (`@nestjs/throttler`).
- Validation via Zod schemas trong `packages/shared`.
- FE: `useAuth` hook với context provider, auto-refresh on 401.

## Data Model (Prisma)

```prisma
enum Role { CUSTOMER DOCTOR SUPERADMIN }

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
  bookings      Booking[]
  doctorProfile DoctorProfile?
}

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  tokenHash  String   @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

## API Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{email, password, name, phone?}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/login` | `{email, password}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` (rotated) |
| POST | `/auth/logout` | `{refreshToken}` | `204` (revoke refresh) |
| GET | `/auth/me` | — | `{user}` (requires access) |

## Files to Create

**API:**
- `apps/api/prisma/schema.prisma` — User, RefreshToken, Role enum
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/strategies/jwt.strategy.ts` (Passport JWT)
- `apps/api/src/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/auth/guards/roles.guard.ts`
- `apps/api/src/auth/decorators/roles.decorator.ts`
- `apps/api/src/auth/decorators/current-user.decorator.ts`
- `apps/api/src/users/users.module.ts` + service (used by auth)
- `apps/api/src/prisma/prisma.service.ts`

**Shared:**
- `packages/shared/src/schemas/auth.ts` — Zod: registerSchema, loginSchema

**Web:**
- `apps/web/lib/api-client.ts` — fetch wrapper với auto-refresh
- `apps/web/lib/auth-context.tsx` — React context, user state, token in cookie (HttpOnly via /api route proxy) hoặc localStorage
- `apps/web/app/[locale]/login/page.tsx`
- `apps/web/app/[locale]/register/page.tsx`

## Implementation Steps

1. Add Prisma models, `pnpm --filter api prisma migrate dev --name init_auth`.
2. Install: `@nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/throttler`.
3. Create PrismaModule global + PrismaService.
4. AuthService: `register` (hash + create user + gen tokens), `login` (verify + gen tokens), `refresh` (verify hash match → rotate), `logout` (mark revoked).
5. Token gen helper: sign access with `JWT_ACCESS_SECRET` ttl 15m; refresh random opaque string, hash với bcrypt before store.
6. JwtStrategy validates access token, attaches user to req.
7. RolesGuard + `@Roles(Role.SUPERADMIN)` decorator.
8. Throttler global cho `/auth/*` (10 req/min).
9. FE: `api-client.ts` intercept 401 → call refresh → retry. Store access in memory, refresh in HttpOnly cookie.
10. Basic login/register pages với form + toast.

## Todo

- [x] Prisma models + migration
- [x] Install auth deps
- [x] PrismaService global
- [x] AuthService (register/login/refresh/logout)
- [x] JwtStrategy + guards
- [x] Roles decorator + RolesGuard
- [x] Throttler trên /auth
- [x] Shared Zod schemas
- [x] FE api-client với auto-refresh
- [x] Auth context + useAuth hook
- [x] Login/register pages
- [x] E2E: register → login → /me → refresh → logout

## Security Considerations

- bcrypt cost ≥ 12.
- Refresh rotate on every use (detect theft via reuse detection — optional R2).
- `helmet()` middleware.
- CORS whitelist FE origin.
- No password in response/logs.
- JWT secrets ≥ 32 bytes, separate for access & refresh.

## Success Criteria

- Can register + login + hit `/auth/me` với access token.
- Refresh rotates correctly; old refresh invalid after use.
- Wrong password returns 401 (generic message, no user enum).
- Throttler blocks spam.

## Risks

- Token storage on FE: HttpOnly cookie ideal nhưng cross-origin (Vercel FE + Railway API) → dùng SameSite=None+Secure, hoặc proxy qua Next API route. Mitigation: access in memory, refresh via BFF route.

## Next Steps

Phase 02 Core Entities dùng User + Role để scope doctor profile.
