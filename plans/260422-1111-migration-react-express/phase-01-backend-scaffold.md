# Phase 01: Backend Scaffold (spa-be)

**Priority:** Critical | **Status:** Pending | **Est:** 0.5d

## Overview

Create Express.js + TypeScript + Prisma project from scratch. Copy DB schema, setup middleware stack, Docker Compose for PostgreSQL.

## Context

- Source: `apps/api/` (NestJS 11)
- Target: `/Users/phamhoang/Documents/work/spa-be/`
- DB: PostgreSQL + Prisma 7 (copy schema exactly)

## Architecture

```
spa-be/
├── src/
│   ├── index.ts                  # Express bootstrap (helmet, CORS, throttle)
│   ├── config/
│   │   └── env.ts                # Typed env vars
│   ├── lib/
│   │   └── prisma.ts             # PrismaClient singleton
│   ├── middleware/
│   │   ├── auth-middleware.ts     # JWT verify (passport-jwt)
│   │   ├── roles-middleware.ts    # RBAC check
│   │   ├── validate-middleware.ts # Zod schema validation
│   │   └── error-handler.ts      # Global error handler
│   ├── routes/                   # (Phase 02-03)
│   ├── services/                 # (Phase 02-03)
│   ├── schemas/                  # Duplicated Zod schemas from shared
│   │   ├── auth-schemas.ts
│   │   ├── doctor-schemas.ts
│   │   ├── service-schemas.ts
│   │   ├── slot-schemas.ts
│   │   ├── booking-schemas.ts
│   │   └── article-schemas.ts
│   └── utils/
│       └── datetime-utils.ts     # Copy from apps/api/src/common/utils/
├── prisma/
│   ├── schema.prisma             # Exact copy
│   └── seed.ts                   # Exact copy
├── docker-compose.yml            # PostgreSQL container
├── .env                          # DATABASE_URL, JWT_ACCESS_SECRET, CORS_ORIGIN, PORT
├── .env.example
├── tsconfig.json
├── package.json
└── .gitignore
```

## Implementation Steps

### 1. Init project
```bash
mkdir -p /Users/phamhoang/Documents/work/spa-be
cd /Users/phamhoang/Documents/work/spa-be
pnpm init
git init
```

### 2. Install dependencies
```bash
# Runtime
pnpm add express helmet cors express-rate-limit passport passport-jwt jsonwebtoken bcrypt dotenv node-cron zod
pnpm add @prisma/client pg @prisma/adapter-pg

# Dev
pnpm add -D typescript @types/node @types/express @types/cors @types/passport-jwt @types/jsonwebtoken @types/bcrypt @types/node-cron tsx prisma nodemon
```

### 3. TypeScript config
- Target: ES2022, module: NodeNext, strict: true
- Path alias: `@/*` → `./src/*`

### 4. Copy from monorepo
| Source | Target | Changes |
|--------|--------|---------|
| `apps/api/prisma/schema.prisma` | `prisma/schema.prisma` | None |
| `apps/api/prisma/seed.ts` | `prisma/seed.ts` | Fix imports (remove monorepo refs) |
| `apps/api/docker-compose.yml` | `docker-compose.yml` | None |
| `apps/api/src/common/utils/datetime-utils.ts` | `src/utils/datetime-utils.ts` | None |
| `packages/shared/src/schemas/*.ts` | `src/schemas/*.ts` | None |
| `packages/shared/src/constants/auth-constants.ts` | `src/schemas/auth-constants.ts` | None |

### 5. Create `src/lib/prisma.ts`
```typescript
// Singleton PrismaClient — replaces NestJS PrismaModule
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

### 6. Create `src/config/env.ts`
```typescript
import 'dotenv/config';
export const env = {
  PORT: Number(process.env.PORT) || 3001,
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
```

### 7. Create `src/middleware/error-handler.ts`
Map NestJS HTTP exceptions to Express error middleware:
- `BadRequestException` → 400
- `UnauthorizedException` → 401
- `ForbiddenException` → 403
- `NotFoundException` → 404
- `ConflictException` → 409
- Use custom `HttpError` class with status + message

### 8. Create `src/middleware/validate-middleware.ts`
```typescript
// Replaces Zod validation pattern from NestJS services
export function validate(schema: ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    req.body = result.data;
    next();
  };
}
```

### 9. Create `src/index.ts` — Express bootstrap
```typescript
// Replaces NestJS main.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, methods: [...], allowedHeaders: [...] }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 10 })); // Same as NestJS ThrottlerGuard

// Routes mounted in Phase 02-03
// app.use('/auth', authRoutes);
// ...

app.use(errorHandler);
app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
```

### 10. Package.json scripts
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down"
  }
}
```

### 11. Run DB setup
```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate --name init
pnpm db:seed
```

### 12. Verify server starts
```bash
pnpm dev
# Should show: API running on http://localhost:3001
```

## Todo

- [ ] Init project with pnpm + git
- [ ] Install all dependencies
- [ ] Setup tsconfig.json
- [ ] Copy Prisma schema + seed + docker-compose
- [ ] Copy Zod schemas + constants + utils
- [ ] Create Prisma singleton
- [ ] Create env config
- [ ] Create error handler middleware
- [ ] Create validate middleware
- [ ] Create Express bootstrap (index.ts)
- [ ] Run DB (docker, migrate, seed)
- [ ] Verify server starts on :3001

## Success Criteria

- `pnpm dev` starts without errors
- PostgreSQL running with seeded data
- `GET http://localhost:3001/` returns 200
- Prisma client generated and connected
