# Code Review: Phase 01 Auth System

**Date:** 2026-04-22
**Reviewer:** code-reviewer
**Scope:** Full auth stack (backend + frontend + shared schemas)

## Scope

- **Files reviewed:** 22 files
- **LOC:** ~750 (backend ~350, frontend ~350, shared ~25)
- **Focus:** Security, architecture, edge cases, OWASP

## Overall Assessment

Solid Phase 01 auth implementation. Clean module boundaries, proper Zod validation on both sides, bcrypt for password hashing, refresh token rotation with hashed storage. A few critical and high-priority issues found below.

---

## Critical Issues

### C1. Fallback JWT Secret in Production (jwt.strategy.ts:19)

```ts
secretOrKey: process.env['JWT_ACCESS_SECRET'] ?? 'fallback-dev-secret',
```

**Impact:** If `JWT_ACCESS_SECRET` env var is missing in production, all tokens are signed with a known, hardcoded string. Any attacker can forge valid JWTs.

**Fix:** Throw at startup if secret is missing:

```ts
const secret = process.env['JWT_ACCESS_SECRET'];
if (!secret) throw new Error('JWT_ACCESS_SECRET must be set');
// use `secret` in constructor
```

### C2. Refresh Token Lookup Scans ALL Non-Revoked Tokens (auth.service.ts:78-85)

```ts
const records = await this.prisma.refreshToken.findMany({
  where: { revokedAt: null, expiresAt: { gt: new Date() } },
});
```

**Impact:** Both `refresh()` and `logout()` fetch **every** active refresh token in the entire DB and bcrypt-compare each one sequentially. This is:
- **O(n) bcrypt comparisons** per request -- each ~250ms at 12 rounds
- **DoS vector** -- 1000 active tokens = ~4 min per refresh call
- **Information leak** -- timing reveals how many tokens exist

**Fix:** Use SHA-256 as a fast lookup index alongside bcrypt for verification:

```ts
// On create:
const sha256 = crypto.createHash('sha256').update(rawToken).digest('hex');
// Store sha256 as indexed column, keep bcrypt hash for verification

// On lookup:
const sha256 = crypto.createHash('sha256').update(refreshToken).digest('hex');
const record = await this.prisma.refreshToken.findUnique({ where: { sha256Index: sha256 } });
if (record && await bcrypt.compare(refreshToken, record.tokenHash)) { ... }
```

This makes lookup O(1) instead of O(n).

### C3. JWT_REFRESH_SECRET Defined in .env.example but Never Used

**Impact:** The `JWT_REFRESH_SECRET` env var exists in `.env.example` but refresh tokens are NOT JWTs -- they're random strings hashed with bcrypt. This is fine architecturally, but the unused env var is misleading. More importantly, the `generateTokens()` method uses `process.env['JWT_ACCESS_SECRET']` directly without validation:

```ts
secret: process.env['JWT_ACCESS_SECRET'],  // undefined if not set
```

**Fix:** 
- Remove `JWT_REFRESH_SECRET` from `.env.example` (avoid confusion)
- Add startup validation for `JWT_ACCESS_SECRET` (same as C1)

---

## High Priority

### H1. User Enumeration on Register (auth.service.ts:39)

```ts
if (existing) throw new BadRequestException('Email already registered');
```

**Impact:** Reveals whether an email is registered. Enables targeted attacks.

**Fix:** Use a generic message: `"Registration failed. Please check your details."` or handle via timing-safe comparison. For a CMS with known users this may be acceptable, but flag it.

### H2. No Rate Limiting on Auth Endpoints Specifically

`ThrottlerGuard` is global at 10 req/60s. This is very aggressive for normal API usage but may be too lenient for auth endpoints (brute force).

**Fix:** Use `@SkipThrottle()` on non-auth routes and `@Throttle({ default: { limit: 5, ttl: 60000 } })` on login/register specifically. Or use separate throttler configs.

### H3. Refresh Token in localStorage is XSS-Vulnerable (api-client.ts:13)

```ts
localStorage.setItem('refreshToken', refresh);
```

**Impact:** Any XSS vulnerability gives attacker full access to refresh tokens, enabling persistent session hijack.

**Recommended:** Use httpOnly cookies for refresh token storage. The current in-memory access token approach is good, but localStorage for refresh tokens undermines it.

**Alternative (if cookies not feasible now):** Document the risk and plan httpOnly cookie migration. Ensure CSP headers are strict.

### H4. `GET /auth/me` Returns Full JWT Payload, Not DB User

The `me()` endpoint returns `request.user` which is the JWT `validate()` result. It includes `createdAt`, `updatedAt`, `locale` etc. from DB. But if user data changes (e.g., name update), the JWT payload is stale until token refresh.

**Impact:** Stale user data shown to client between token refreshes.

**Fix:** This is actually fine since `validate()` does a DB lookup. Just noting that the `AuthContextValue.User` interface is missing `role` and `locale` fields returned by the backend.

### H5. `tokenHash` Has `@unique` Constraint in Prisma Schema (schema.prisma:37)

```prisma
tokenHash String @unique
```

**Impact:** bcrypt hashes are non-deterministic (different salt each time), so uniqueness is not semantically useful here. The unique index adds write overhead and could theoretically cause (astronomically unlikely) collisions to fail inserts.

**Fix:** Remove `@unique` from `tokenHash`. Add an index on the SHA-256 lookup column instead (per C2 fix).

---

## Medium Priority

### M1. `auth-context.tsx` Restore Flow Has Race Condition

The `useEffect` calls `apiPost('/auth/refresh')` directly instead of using the api-client's built-in refresh mechanism. If the app makes other API calls during mount, two refresh calls could race.

**Fix:** Add a `refreshPromise` deduplication lock in `api-client.ts` to prevent concurrent refresh calls.

### M2. No Email Normalization

Emails are stored as-is. `User@Example.com` and `user@example.com` would be different users.

**Fix:** Normalize email to lowercase in both `registerSchema` and `loginSchema`:
```ts
email: z.string().email().transform(e => e.toLowerCase().trim()),
```

### M3. Phone Field Has No Validation

`phone` is `z.string().optional()` with no format validation. Could store arbitrary strings.

**Fix:** Add regex or use a phone validation library:
```ts
phone: z.string().regex(/^\+?[\d\s-()]{7,20}$/).optional(),
```

### M4. Register Page Exceeds 200-Line Limit (213 lines)

Per project rules, files should stay under 200 lines.

**Fix:** Extract form field components or the input class helper.

### M5. `sanitize()` Method Has Hardcoded Type (auth.service.ts:150)

The `sanitize` method manually lists all User fields in the parameter type instead of using Prisma's generated type.

**Fix:** Use `Prisma.UserGetPayload<{}>` or `User` from `@prisma/client`:
```ts
private sanitize(user: User) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
```

### M6. Logout Silently Ignores Malformed Input (auth.service.ts:107)

```ts
if (!parsed.success) return; // Silently ignore malformed input
```

This is acceptable for logout but inconsistent with other endpoints. Document the design decision.

---

## Low Priority

### L1. Hardcoded Color Values in Frontend

Multiple components use raw hex values (`#B76E79`, `#6b4c41`, `#FFFFF0`). Should be in Tailwind config as design tokens.

### L2. Missing `aria-` Attributes on Form Inputs

No `aria-describedby` linking inputs to error messages. Accessibility improvement.

### L3. `Geist` and `Geist_Mono` Fonts Loaded but Only `Geist` Used Visually

Minor bundle size optimization.

---

## Positive Observations

1. **Token rotation** -- refresh tokens are single-use with proper revocation
2. **Bcrypt at 12 rounds** -- strong password hashing
3. **Zod validation on both client and server** -- shared schemas prevent drift
4. **Access token in memory, not localStorage** -- mitigates XSS for access tokens
5. **Helmet + CORS + ThrottlerGuard** -- defense-in-depth security headers
6. **Clean module boundaries** -- NestJS modules are well-scoped
7. **All files under 200 lines** (except register page at 213)
8. **Proper `onDelete: Cascade`** on RefreshToken relation
9. **Prisma pg adapter** -- modern Prisma 7 setup
10. **No password hash in API responses** -- properly sanitized

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix C1: Remove fallback JWT secret, throw on missing env var
2. **[CRITICAL]** Fix C2: Add SHA-256 index for O(1) refresh token lookup
3. **[CRITICAL]** Fix C3: Remove unused `JWT_REFRESH_SECRET` from `.env.example`
4. **[HIGH]** Fix H3: Plan httpOnly cookie migration for refresh tokens
5. **[HIGH]** Fix H2: Tighten rate limiting on auth endpoints
6. **[HIGH]** Fix M2: Normalize emails to lowercase
7. **[MEDIUM]** Fix M1: Deduplicate concurrent refresh calls
8. **[MEDIUM]** Fix M3: Add phone validation
9. **[MEDIUM]** Fix M4: Refactor register page under 200 lines
10. **[LOW]** Extract color tokens to Tailwind config

---

## Metrics

| Metric | Value |
|---|---|
| Files reviewed | 22 |
| Critical issues | 3 |
| High issues | 5 |
| Medium issues | 6 |
| Low issues | 3 |
| Files under 200 lines | 21/22 |
| Kebab-case naming | Pass |
| Hardcoded secrets | 1 (C1 fallback) |
| User enumeration risk | 1 (H1 register) |

---

## Unresolved Questions

1. Is httpOnly cookie for refresh token planned for a future phase? If so, localStorage is acceptable as temporary.
2. Should `SUPERADMIN` registration be restricted? Currently anyone can register (as CUSTOMER by default), but no guard prevents role escalation via direct API call if `role` field is ever added to register DTO.
3. Is the 10 req/60s global throttle intentional? Seems aggressive for normal CMS usage.
