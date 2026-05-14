---
name: migration-react-express
date: 2026-04-22
status: completed
priority: high
estimatedDays: 4-5
blockedBy: []
blocks: []
---

# Migration: Next.js + NestJS Monorepo → React + Express (2 Repos)

**Brainstorm:** `plans/reports/brainstormer-260422-1111-migration-react-express.md`
**Type:** Full stack migration (1:1 feature parity)
**From:** Next.js 16 + NestJS 11 + Turborepo monorepo
**To:** Vite + React 19 + React Router v7 (spa-fe) | Express.js + Prisma 7 (spa-be)

## Goal

Migrate K-Beauty Spa CMS from monorepo to 2 independent repos using plain React + Express. Keep 100% features, remove NestJS/Next.js framework overhead, ensure stable local dev.

## Current System

- ~7,365 LOC | 30 pages | 20 components | 7 BE modules | 35+ API routes | 7 DB models
- Auth: JWT + refresh token rotation + RBAC (CUSTOMER/DOCTOR/SUPERADMIN)
- i18n: bilingual JSON (vi/ko)

## Phases

| # | File | Scope | Est | Depends |
|---|------|-------|-----|---------|
| 01 | [phase-01-backend-scaffold.md](phase-01-backend-scaffold.md) | Express scaffold, Prisma, middleware, Docker | 0.5d | — |
| 02 | [phase-02-backend-auth.md](phase-02-backend-auth.md) | Auth routes, JWT, refresh token, RBAC middleware | 0.5d | 01 |
| 03 | [phase-03-backend-features.md](phase-03-backend-features.md) | All feature routes: doctors, services, slots, bookings, articles, health | 1d | 02 |
| 04 | [phase-04-backend-cron-test.md](phase-04-backend-cron-test.md) | Booking cron job + API integration tests (supertest) | 0.5d | 03 |
| 05 | [phase-05-frontend-scaffold.md](phase-05-frontend-scaffold.md) | Vite + React Router + Tailwind + lib (api-client, auth-context) | 0.5d | — |
| 06 | [phase-06-frontend-pages.md](phase-06-frontend-pages.md) | Convert all 30 pages + 20 components | 1d | 05 |
| 07 | [phase-07-e2e-verification.md](phase-07-e2e-verification.md) | Run both repos, test all flows, fix integration issues | 0.5d | 04, 06 |

## Key Decisions

- **No SSR/SEO** — SPA thuần, accepted trade-off
- **Zod schemas** — Duplicated into both repos (simple, no npm package)
- **Prisma schema** — Copy exactly, same PostgreSQL DB
- **Auth** — JWT thuần (passport-jwt middleware), no SSO
- **Cron** — node-cron replacing @nestjs/schedule
- **Deploy** — Local dev first

## Repo Locations

Both repos created as siblings of current project:
- `/Users/phamhoang/Documents/work/spa-fe/`
- `/Users/phamhoang/Documents/work/spa-be/`
