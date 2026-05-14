# Phase 02: Backend Auth System

**Priority:** Critical | **Status:** Pending | **Est:** 0.5d | **Depends:** Phase 01

## Overview

Migrate auth system from NestJS (Passport + guards + decorators) to Express middleware. 1:1 feature parity with current JWT + refresh token rotation + RBAC.

## Source Files → Target Files

| NestJS Source | Express Target | LOC | Changes |
|---------------|----------------|-----|---------|
| `auth/auth.service.ts` (147 LOC) | `src/services/auth-service.ts` | ~130 | Remove @Injectable, change constructor DI → function params |
| `auth/auth.controller.ts` (50 LOC) | `src/routes/auth-routes.ts` | ~60 | Decorators → Express router handlers |
| `auth/strategies/jwt.strategy.ts` (33 LOC) | `src/middleware/auth-middleware.ts` | ~40 | PassportStrategy → passport-jwt middleware |
| `auth/guards/jwt-auth.guard.ts` (6 LOC) | (merged into auth-middleware.ts) | — | AuthGuard → passport.authenticate() |
| `auth/guards/roles.guard.ts` (31 LOC) | `src/middleware/roles-middleware.ts` | ~20 | CanActivate → Express middleware |
| `auth/decorators/current-user.decorator.ts` | (not needed) | — | req.user available directly |
| `auth/decorators/roles.decorator.ts` | (not needed) | — | Roles passed as middleware param |
| `users/users.service.ts` | `src/services/users-service.ts` | ~30 | Remove @Injectable |

## Implementation Steps

### 1. Create `src/services/users-service.ts`
```typescript
// Copy logic from apps/api/src/users/users.service.ts
// Remove: @Injectable() decorator
// Change: constructor DI → import prisma singleton
import { prisma } from '../lib/prisma';

export async function findByEmail(email: string) { ... }
export async function findById(id: string) { ... }
export async function create(data: {...}) { ... }
```

### 2. Create `src/services/auth-service.ts`
```typescript
// Copy logic from apps/api/src/auth/auth.service.ts (147 lines)
// Remove: @Injectable(), constructor DI
// Replace: this.prisma → prisma (singleton import)
// Replace: this.jwtService.sign() → jsonwebtoken.sign()
// Replace: this.usersService → imported functions
// Keep: bcrypt, sha256, sanitize, generateTokens logic EXACTLY
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import * as usersService from './users-service';
```

Key methods to migrate:
- `register(body)` — Zod validate → hash password → create user → generate tokens
- `login(body)` — Zod validate → find user → compare password → generate tokens
- `refresh(body)` — Zod validate → find token by SHA-256 hash → revoke → rotate
- `logout(body)` — Revoke all tokens for user
- `generateTokens(userId, email, role)` — JWT sign (15m) + random refresh token (7d)

### 3. Create `src/middleware/auth-middleware.ts`
```typescript
// Replaces JwtStrategy + JwtAuthGuard
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { findById } from '../services/users-service';
import { env } from '../config/env';

// Configure strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_ACCESS_SECRET,
}, async (payload, done) => {
  const user = await findById(payload.sub);
  if (!user) return done(null, false);
  const { passwordHash, ...safeUser } = user;
  done(null, safeUser);
}));

// Export middleware
export const auth = passport.authenticate('jwt', { session: false });
```

### 4. Create `src/middleware/roles-middleware.ts`
```typescript
// Replaces RolesGuard + @Roles() decorator
export function roles(...allowedRoles: string[]) {
  return (req, res, next) => {
    if (!allowedRoles.length) return next(); // No roles = allow authenticated
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
```

### 5. Create `src/routes/auth-routes.ts`
```typescript
import { Router } from 'express';
import { auth } from '../middleware/auth-middleware';
import { validate } from '../middleware/validate-middleware';
import * as authService from '../services/auth-service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth-schemas';

const router = Router();

// POST /auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try { res.status(201).json(await authService.register(req.body)); }
  catch (e) { next(e); }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try { res.json(await authService.login(req.body)); }
  catch (e) { next(e); }
});

// POST /auth/refresh
router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try { res.json(await authService.refresh(req.body)); }
  catch (e) { next(e); }
});

// POST /auth/logout
router.post('/logout', async (req, res, next) => {
  try { await authService.logout(req.body); res.status(204).end(); }
  catch (e) { next(e); }
});

// GET /auth/me
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

export default router;
```

### 6. Mount in `src/index.ts`
```typescript
import authRoutes from './routes/auth-routes';
app.use('/auth', authRoutes);
```

### 7. Verify all 5 auth endpoints
```bash
# Register
curl -X POST localhost:3001/auth/register -H 'Content-Type: application/json' -d '{"email":"test@test.com","password":"12345678","name":"Test"}'

# Login
curl -X POST localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"test@test.com","password":"12345678"}'

# Refresh (use token from login response)
curl -X POST localhost:3001/auth/refresh -H 'Content-Type: application/json' -d '{"refreshToken":"..."}'

# Me (use accessToken from login)
curl -H 'Authorization: Bearer ...' localhost:3001/auth/me

# Logout
curl -X POST localhost:3001/auth/logout -H 'Content-Type: application/json' -d '{"refreshToken":"..."}'
```

## Todo

- [ ] Create users-service.ts (copy logic, remove DI)
- [ ] Create auth-service.ts (copy logic, replace jwtService → jsonwebtoken)
- [ ] Create auth-middleware.ts (passport-jwt strategy)
- [ ] Create roles-middleware.ts
- [ ] Create auth-routes.ts (5 endpoints)
- [ ] Mount routes in index.ts
- [ ] Test all 5 auth endpoints via curl

## Success Criteria

- Register returns `{ user, accessToken, refreshToken }`
- Login returns same shape
- Refresh rotates tokens (old token invalidated)
- `/auth/me` returns user with valid JWT
- `/auth/me` returns 401 with invalid/expired JWT
- Roles middleware blocks CUSTOMER from admin routes
