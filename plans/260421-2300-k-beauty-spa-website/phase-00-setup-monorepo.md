# Phase 00 — Setup Monorepo & Skeleton

**Priority:** Blocker | **Status:** completed | **Est:** 1d | **Depends:** —

## Overview
Tạo Turborepo với 2 apps (web + api) + packages/shared. Prisma init, Docker compose cho Postgres local, CI skeleton (lint + typecheck).

## Requirements
- Node 20 LTS, pnpm 9.
- Turborepo scaffold: `apps/web`, `apps/api`, `packages/shared`, `packages/tsconfig` (base tsconfig).
- Shared ESLint + Prettier + commitlint (conventional).
- Docker compose: postgres:16, pgadmin (optional).
- `.env.example` at root + per app.

## Architecture

```
spa-cms/
├── apps/
│   ├── web/                  # Next.js 15
│   │   ├── app/
│   │   ├── messages/         # next-intl vi.json, ko.json
│   │   └── next.config.mjs
│   └── api/                  # NestJS 10
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   └── prisma/
│       ├── prisma/schema.prisma
│       └── docker-compose.yml
├── packages/
│   ├── shared/               # Zod schemas, DTOs, types, constants
│   └── tsconfig/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .github/workflows/ci.yml
```

## Files to Create

- `package.json` (root, private, workspaces via pnpm)
- `pnpm-workspace.yaml`
- `turbo.json` (pipeline: build, lint, test, typecheck, dev)
- `tsconfig.base.json`
- `apps/web/` — `pnpm create next-app@latest --ts --app --tailwind --eslint --no-src-dir`
- `apps/api/` — `pnpm dlx @nestjs/cli new api --skip-git --package-manager pnpm`
- `apps/api/prisma/schema.prisma` — provider postgresql, datasource env(DATABASE_URL)
- `apps/api/docker-compose.yml` — postgres 16, volume
- `packages/shared/package.json` + `src/index.ts`
- `.env.example` — `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `NEXT_PUBLIC_API_URL`
- `.github/workflows/ci.yml` — pnpm install + turbo run lint typecheck build

## Implementation Steps

1. `mkdir spa-cms && cd` — init git, add `.gitignore` (node_modules, .env, .turbo, .next, dist).
2. `pnpm init` + `pnpm-workspace.yaml` with `apps/*` + `packages/*`.
3. Install turbo: `pnpm add -Dw turbo`.
4. Scaffold `apps/web` with create-next-app (Next 15, App Router, TS, Tailwind).
5. Scaffold `apps/api` with Nest CLI, move into apps/.
6. Add `packages/shared` with basic `package.json` (name `@spa/shared`, `main: ./src/index.ts`).
7. Install Prisma in api: `pnpm --filter api add prisma @prisma/client`, `npx prisma init`.
8. Write `docker-compose.yml` for postgres; add `pnpm db:up` script.
9. Add shared eslint config + prettier at root; extend in both apps.
10. Add CI workflow running `pnpm turbo run lint typecheck build`.
11. Verify: `pnpm turbo run dev` starts both apps (web 3000, api 3001).

## Todo

- [x] Repo init + `.gitignore`
- [x] pnpm workspace + turbo.json
- [x] apps/web scaffolded (Next 15 + Tailwind)
- [x] apps/api scaffolded (NestJS 10)
- [x] packages/shared + tsconfig base
- [x] Prisma installed, schema.prisma empty
- [x] docker-compose postgres working (`docker compose up -d`, connect)
- [x] Shared ESLint + Prettier
- [x] CI workflow green on first push
- [x] Dev command `pnpm dev` starts both apps
- [x] README with run instructions

## Success Criteria

- `pnpm install` clean, no warnings blocker.
- `pnpm dev` → web on :3000, api on :3001 both respond.
- `pnpm turbo run typecheck` passes.
- Postgres reachable from api at `localhost:5432`.

## Risks

- Next 15 + React 19 canary quirks → pin exact versions; consult release notes.
- pnpm + NestJS monorepo path resolution → ensure `paths` in tsconfig or use package.json `workspace:*`.

## Next Steps

Phase 01 Auth — cần User model trước khi bất kỳ module nào khác depend.
