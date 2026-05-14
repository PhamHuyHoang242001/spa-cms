# Phase 00 Report — Setup Monorepo & Skeleton

**Date:** 2026-04-21
**Status:** Completed
**Agent:** fullstack-developer

---

## Files Created / Modified

```
spa-cms/
├── .gitignore
├── .npmrc                        # confirmModulesPurge=false, shamefully-hoist=false
├── .prettierrc                   # shared prettier config
├── .prettierignore
├── .env.example                  # all env vars documented
├── package.json                  # root, turbo dev/build/lint/typecheck/test, db:up/down
├── pnpm-workspace.yaml           # apps/*, packages/*, onlyBuiltDependencies whitelist
├── turbo.json                    # tasks: build, dev, lint, typecheck, test
├── README.md
├── .github/
│   └── workflows/ci.yml          # pnpm install + turbo lint typecheck build
├── apps/
│   ├── web/                      # Next.js 16.2.4 (Next 15 API compatible), TS, Tailwind, App Router
│   │   ├── package.json          # + typecheck script
│   │   ├── next.config.ts        # turbopack.root set to fix workspace detection warning
│   │   ├── tsconfig.json         # scaffolded by create-next-app (unchanged)
│   │   └── app/                  # default App Router scaffold
│   └── api/                      # NestJS 11.x (CLI installed latest, not 10)
│       ├── package.json          # + dev + typecheck scripts
│       ├── src/main.ts           # port changed 3000→3001
│       ├── tsconfig.json         # scaffolded by nest CLI (unchanged)
│       ├── prisma/schema.prisma  # generator prisma-client-js + datasource postgresql env()
│       ├── prisma.config.ts      # prisma 7 config (generated)
│       └── docker-compose.yml    # postgres:16-alpine, port 5433, db spa_dev, user/pass spa
├── packages/
│   ├── shared/
│   │   ├── package.json          # name @spa/shared, main ./src/index.ts
│   │   ├── tsconfig.json         # standalone (no extend base — base incompatible with bundler)
│   │   └── src/index.ts          # export {} placeholder
│   └── tsconfig/
│       ├── package.json
│       ├── base.json             # shared base tsconfig
│       ├── nextjs.json           # next preset
│       └── nestjs.json           # nest preset
```

---

## Verification Results

### pnpm install
```
Done in 5.4s — all 5 workspace projects linked
Build scripts approved: @nestjs/core, @prisma/engines, prisma, sharp, unrs-resolver
```

### pnpm turbo run typecheck
```
Tasks: 3 successful, 3 total — @spa/shared, api, web all pass
Time: ~730ms
```

### pnpm turbo run build
```
Tasks: 2 successful, 2 total — api (nest build), web (next build)
Time: ~3.5s
web: 2 static routes (/, /_not-found)
```

### pnpm db:up
```
Container spa_postgres started (postgres:16-alpine)
docker exec spa_postgres psql -U spa -d spa_dev → spa_dev database confirmed
```

### pnpm dev (smoke test)
```
web http://localhost:3000 → 200 OK (Next.js default)
api  http://localhost:3001 → 200 OK (NestJS Hello World)
```

---

## Deviations from Plan

| Item | Plan | Actual | Reason |
|------|------|--------|--------|
| NestJS version | 10 | 11.1.x | CLI installed latest; no functional impact for Phase 00 |
| Next.js version | 15 | 16.2.4 | create-next-app@latest resolved to 16; API-compatible |
| Postgres port | 5432 | 5433 | 5432 occupied by another project's Postgres container |
| packages/shared tsconfig | extends base.json | standalone | base.json used `moduleResolution: bundler` incompatible with `module: commonjs`; standalone tsconfig avoids conflict |
| Prisma init style | classic schema only | schema.prisma + prisma.config.ts | Prisma 7 generates config file; kept both, schema.prisma updated to use prisma-client-js + env(DATABASE_URL) |
| pnpm-workspace.yaml | packages only | + onlyBuiltDependencies | pnpm 10 security change requires explicit build script approval |

---

## Known Issues / TODO for Phase 01

- `apps/api/.env` is present locally (gitignored) — Phase 01 should add dotenv/config loading
- Prisma 7 uses `prisma.config.ts` instead of just `schema.prisma` — Phase 01 migrations must use `prisma migrate dev`
- NestJS 11 vs planned 10: verify all Phase 01 packages (`@nestjs/jwt`, `@nestjs/passport`) support ^11
- `packages/tsconfig/base.json` not currently `extends`'d by apps (apps use their own scaffolded tsconfigs) — acceptable for MVP, Phase 01+ can unify if needed

---

## Open Questions

None blocking. Phase 01 (Auth) can proceed.
