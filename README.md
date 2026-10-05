# K-Beauty Spa CMS

Turborepo monorepo — Next.js 16 (web) + NestJS 11 (api) + PostgreSQL + Prisma.

## Prerequisites

- Node 20+
- pnpm 9+
- Docker 20+

## Quick Start

```bash
# 1. Install all dependencies
pnpm install

# 2. Start local Postgres (Docker)
pnpm db:up

# 3. Copy env and fill secrets (first time only)
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Start both apps in dev mode
pnpm dev
```

## Ports

| App | URL |
|-----|-----|
| Web (Next.js) | http://localhost:3100 |
| API (NestJS) | http://localhost:3101 |
| Postgres | localhost:5433 (container 5432) |

## Useful Commands

```bash
pnpm build          # Build all apps
pnpm lint           # Lint all apps
pnpm typecheck      # Type-check all apps
pnpm test           # Run all tests
pnpm db:up          # Start Postgres container
pnpm db:down        # Stop Postgres container
```

## Project Structure

```
spa-cms/
├── apps/
│   ├── web/          # Next.js 15 (App Router, Tailwind)
│   └── api/          # NestJS 11 (Prisma, JWT)
├── packages/
│   ├── shared/       # Shared TS types, Zod schemas, DTOs
│   └── tsconfig/     # Shared tsconfig base + presets
├── turbo.json
├── pnpm-workspace.yaml
└── .github/workflows/ci.yml
```

## Deployment

Use one GitHub repo with two deployment targets:

- Vercel project: `apps/web`
- Render Blueprint/API: root `render.yaml`

See `docs/deployment-guide.md` for exact build commands and environment
variables.

## Plan

See `plans/260421-2300-k-beauty-spa-website/` for implementation plan and phase files.
