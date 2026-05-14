# Brainstorm: Migration Next.js + NestJS → React + Express (2 Repos)

**Date**: 2026-04-22 | **Status**: Agreed

---

## Problem Statement

Current spa-cms is a Turborepo monorepo (Next.js 16 + NestJS 11 + PostgreSQL). User wants to:
1. Replace Next.js with plain React.js (Vite + React Router)
2. Replace NestJS with Express.js
3. Split into 2 separate repos (FE + BE)
4. Remove SSO dependency
5. Keep Prisma ORM and 100% features
6. Ensure stable operation with proper testing

## Current System Summary

| Metric | Value |
|--------|-------|
| Total LOC | ~7,365 |
| FE Pages | 30 (public + admin + auth) |
| FE Components | 20 |
| BE Modules | 7 (Auth, Users, Doctors, Services, Slots, Bookings, Articles) |
| API Routes | 35+ |
| DB Models | 7 (User, RefreshToken, DoctorProfile, Service, TimeSlot, Booking, Article) |
| Auth | JWT + refresh token rotation + RBAC (CUSTOMER/DOCTOR/SUPERADMIN) |
| i18n | Bilingual JSON fields (vi/ko) |

## Agreed Technology Decisions

| Layer | Current | New |
|-------|---------|-----|
| **FE Framework** | Next.js 16 (App Router, SSR) | Vite + React 19 + React Router v7 |
| **FE Styling** | Tailwind CSS 4 | Tailwind CSS 4 (keep) |
| **BE Framework** | NestJS 11 (decorators, DI) | Express.js (middleware-based) |
| **Database** | PostgreSQL + Prisma 7 | PostgreSQL + Prisma 7 (keep) |
| **Auth** | Passport JWT + NestJS guards | passport-jwt + Express middleware |
| **Validation** | Zod (shared package) | Zod (duplicated into both repos) |
| **Build** | Turborepo monorepo | 2 independent repos |
| **SEO** | SSR (Next.js) | None (SPA, accepted trade-off) |
| **Deploy** | N/A | Local dev first |

## Architecture: 2 Repos

### Repo 1: `spa-fe` (Frontend)
```
spa-fe/
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Router setup
│   ├── router.tsx                # React Router v7 routes
│   ├── pages/                    # 1:1 from Next.js app/ directory
│   │   ├── home.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── services/
│   │   ├── doctors/
│   │   ├── blog/
│   │   ├── booking/
│   │   ├── me/
│   │   └── admin/
│   ├── components/               # Copy from apps/web/components/
│   │   ├── layout/
│   │   ├── sections/
│   │   ├── booking/
│   │   ├── admin/
│   │   ├── blog/
│   │   └── auth/
│   ├── lib/
│   │   ├── api-client.ts         # Copy (already client-side)
│   │   ├── api-types.ts          # Copy
│   │   └── auth-context.tsx      # Copy
│   ├── schemas/                  # Duplicated from shared
│   │   └── *.ts
│   └── index.css                 # Tailwind entry
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Repo 2: `spa-be` (Backend)
```
spa-be/
├── src/
│   ├── index.ts                  # Express app bootstrap
│   ├── config/
│   │   └── env.ts                # Environment variables
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification middleware
│   │   ├── roles.ts              # RBAC middleware
│   │   ├── validate.ts           # Zod validation middleware
│   │   └── error-handler.ts      # Global error handler
│   ├── routes/
│   │   ├── auth.ts               # POST /auth/*
│   │   ├── doctors.ts            # /doctors/*
│   │   ├── services.ts           # /services/*
│   │   ├── slots.ts              # /slots/*
│   │   ├── bookings.ts           # /bookings/*
│   │   ├── articles.ts           # /articles/*
│   │   └── health.ts             # GET /health
│   ├── services/                 # Business logic (copy from NestJS services)
│   │   ├── auth-service.ts
│   │   ├── users-service.ts
│   │   ├── doctors-service.ts
│   │   ├── services-service.ts
│   │   ├── slots-service.ts
│   │   ├── bookings-service.ts
│   │   └── articles-service.ts
│   ├── schemas/                  # Duplicated from shared
│   │   └── *.ts
│   └── utils/
│       └── datetime-utils.ts     # Copy
├── prisma/
│   ├── schema.prisma             # Copy exactly
│   └── seed.ts                   # Copy
├── docker-compose.yml            # PostgreSQL
├── tsconfig.json
└── package.json
```

## Migration Effort Estimate

| Task | Effort | Files | Notes |
|------|--------|-------|-------|
| FE: Vite + React Router setup | Low | 5 | Scaffold, config, router |
| FE: Convert 30 pages | Medium | 30 | Remove SSR, add useEffect for data fetching |
| FE: Copy 20 components | Low | 20 | Replace next/link → Link, next/image → img |
| FE: Copy lib + auth | Low | 3 | Already client-side |
| BE: Express scaffold | Low | 5 | Setup, middleware, error handling |
| BE: Convert 7 controllers → routes | Medium | 7 | NestJS decorators → Express handlers |
| BE: Copy 7 services | Low | 7 | Minimal changes (remove @Injectable) |
| BE: Auth middleware | Medium | 3 | passport-jwt + roles middleware |
| BE: Copy Prisma schema + seed | None | 2 | Exact copy |
| Shared: Duplicate Zod schemas | Low | 8×2 | Copy into both repos |
| Testing: API integration tests | Medium | 7 | supertest for all routes |
| Testing: FE component tests | Medium | 10 | vitest + @testing-library/react |
| **Total** | **~3-5 days** | **~120 files** | Full 1:1 migration |

## Key Migration Patterns

### FE: Next.js Server Component → React Client Component
```tsx
// BEFORE (Next.js - Server Component with async)
export default async function ServicesPage() {
  const services = await fetch(`${API}/services`).then(r => r.json());
  return <ServicesGrid services={services} />;
}

// AFTER (React + useEffect)
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet<Service[]>('/services').then(setServices).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  return <ServicesGrid services={services} />;
}
```

### BE: NestJS Controller → Express Router
```tsx
// BEFORE (NestJS)
@Controller('services')
export class ServicesController {
  @Get()
  findAll() { return this.svc.findAll(); }
  
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  create(@Body() dto) { return this.svc.create(dto); }
}

// AFTER (Express)
const router = Router();
router.get('/', async (req, res, next) => {
  try { res.json(await svc.findAll()); } catch(e) { next(e); }
});
router.post('/', auth, roles('SUPERADMIN'), validate(createServiceSchema), async (req, res, next) => {
  try { res.json(await svc.create(req.body)); } catch(e) { next(e); }
});
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| SEO loss (no SSR) | Medium | Accepted. Add prerender later if needed. |
| Zod schema drift between repos | Low | Duplicate now, sync manually. Small surface. |
| No existing tests | High | Write integration tests during migration to verify 1:1 |
| framer-motion bundle size | Low | Keep for now. Lazy-load if needed. |
| Auth token handling | Medium | api-client.ts already client-side. Copy as-is. |

## Success Criteria

1. All 35+ API endpoints return same responses as current
2. All 30 pages render correctly with same data
3. Auth flow (register → login → refresh → logout) works end-to-end
4. Booking wizard completes full cycle
5. Admin CRUD for services/doctors/articles/slots works
6. Both repos run independently (FE on :3000, BE on :3001)
7. API integration tests pass (supertest)
8. FE builds without errors (vite build)

## Implementation Order (Recommended)

### Phase 1: Backend (spa-be) — Do first
1. Scaffold Express + TypeScript + Prisma
2. Copy Prisma schema, run migrations, seed data
3. Implement auth middleware (JWT + roles)
4. Convert 7 controllers to Express routes
5. Copy 7 service classes (remove NestJS decorators)
6. Write integration tests (supertest)
7. Verify all 35+ endpoints match current API

### Phase 2: Frontend (spa-fe) — After BE is stable
1. Scaffold Vite + React + React Router + Tailwind
2. Setup router with all 30 routes
3. Copy lib/ (api-client, auth-context, api-types)
4. Copy 20 components (fix imports)
5. Convert 30 pages (async → useEffect)
6. Test all flows manually
7. Write component tests (vitest)

### Phase 3: Verification
1. Run both repos together
2. Test complete booking flow end-to-end
3. Test admin CRUD operations
4. Test auth edge cases (token expiry, refresh, logout)
5. Performance check (no memory leaks)

## Next Steps

User decides: create implementation plan → `/ck:plan`
