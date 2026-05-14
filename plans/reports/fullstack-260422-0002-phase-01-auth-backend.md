# Phase 01 Auth Backend — Implementation Report

**Date:** 2026-04-22  
**Status:** Completed

---

## Files Created / Modified

| File | Action | Lines |
|------|--------|-------|
| `apps/api/prisma/schema.prisma` | Modified | 44 |
| `apps/api/src/main.ts` | Modified | 22 |
| `apps/api/src/app.module.ts` | Modified | 21 |
| `apps/api/src/prisma/prisma.service.ts` | Created | 23 |
| `apps/api/src/prisma/prisma.module.ts` | Created | 11 |
| `apps/api/src/users/users.service.ts` | Created | 38 |
| `apps/api/src/users/users.module.ts` | Created | 11 |
| `apps/api/src/auth/auth.service.ts` | Created | 117 |
| `apps/api/src/auth/auth.controller.ts` | Created | 47 |
| `apps/api/src/auth/auth.module.ts` | Created | 21 |
| `apps/api/src/auth/dto/register.dto.ts` | Created | 8 |
| `apps/api/src/auth/dto/login.dto.ts` | Created | 6 |
| `apps/api/src/auth/strategies/jwt.strategy.ts` | Created | 35 |
| `apps/api/src/auth/guards/jwt-auth.guard.ts` | Created | 8 |
| `apps/api/src/auth/guards/roles.guard.ts` | Created | 32 |
| `apps/api/src/auth/decorators/roles.decorator.ts` | Created | 8 |
| `apps/api/src/auth/decorators/current-user.decorator.ts` | Created | 12 |
| `packages/shared/src/schemas/auth-schemas.ts` | Created | 22 |
| `packages/shared/src/index.ts` | Modified | 3 |
| `apps/api/prisma/migrations/20260421170534_init_auth/` | Created | — |

## Dependencies Installed

- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` — JWT auth
- `bcrypt` + `@types/bcrypt` — password hashing (cost 12)
- `@nestjs/throttler` — rate limiting (10 req/60s)
- `helmet` — security headers
- `@prisma/adapter-pg` + `pg` — Prisma 7 driver adapter (required in v7)
- `dotenv` — env loading in NestJS bootstrap
- `zod` (in `@spa/shared`) — request validation schemas

## Key Decisions / Deviations

- **Prisma 7 breaking change**: `url` removed from schema.prisma `datasource` block; must live in `prisma.config.ts` + adapter passed to `PrismaClient({ adapter })`.
- **dotenv required**: NestJS ts-node doesn't auto-load `.env`; added `import 'dotenv/config'` as first line of `main.ts`.
- **Refresh token lookup**: No indexed token hash lookup possible (bcrypt is one-way), so all active tokens for matching are scanned. Acceptable at this scale; add userId index in Phase 02 if needed.
- **JwtModule.register({})**: Secrets injected per-call in `generateTokens` to support different TTLs without environment-level JwtModule config.
- **@types/helmet** deprecated (v4.0.0): helmet v8 ships its own types; `@types/helmet` installed but harmless.

## Endpoints Verified

| Method | Path | Result |
|--------|------|--------|
| POST | `/auth/register` | 201 — user + accessToken + refreshToken |
| POST | `/auth/login` | 200 — user + accessToken + refreshToken |
| POST | `/auth/refresh` | 200 — new accessToken + refreshToken (old revoked) |
| POST | `/auth/logout` | 204 — refresh token revoked |
| GET | `/auth/me` | 200 — user object (Bearer required) |

Edge cases verified:
- Validation errors return field-level Zod messages
- Duplicate email → 400
- Bad credentials → 401
- Expired/revoked refresh token → 401
- Unauthenticated `/me` → 401

## Tests Status

- `pnpm turbo run typecheck` — 5/5 pass
- `pnpm turbo run build` — 5/5 pass
- Manual curl tests — all pass

## Unresolved Questions

- Refresh token scan (bcrypt compare on all active tokens) is O(n) — fine now, but add per-user filtering in Phase 02 when load is a concern.
- `bcrypt@6` native build skipped by pnpm (build scripts not approved). Works because pre-built binaries are bundled. If CI fails, run `pnpm approve-builds` to approve `bcrypt`.
