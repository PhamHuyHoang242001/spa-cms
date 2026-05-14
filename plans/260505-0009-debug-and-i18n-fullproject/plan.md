---
name: debug-and-i18n-fullproject
date: 2026-05-05
status: completed
priority: high
estimatedDays: 3-4
blockedBy: []
blocks: []
---

# Full Project Debug & i18n Implementation

**Brainstorm:** `plans/reports/brainstorm-260505-0009-debug-and-i18n-fullproject.md`
**Research:** `plans/reports/researcher-260505-0017-next-intl-next16-compatibility.md`
**Type:** Debug + Feature (i18n)
**Stack:** Next.js 16.2.4 + NestJS 11 + PostgreSQL + Prisma 7

## Goal

Debug entire K-Beauty Spa CMS, fix all bugs, implement Vietnamese-Korean language switching with next-intl v4 + locale routing. Admin panel stays Vietnamese, public pages get full i18n.

## Approach

Debug-first → i18n-later. Stabilize codebase before routing refactor.

## Bug Audit Summary (from codebase scan)

| Severity | Count | Key Issues |
|----------|-------|-----------|
| Critical | 2 | Missing BookingStatus types (EXPIRED, NO_SHOW) |
| High | 4 | Race conditions, auth refresh, cancelReason, type mismatches |
| Medium | 7 | Response structure, slot date parsing, missing includes |
| Low | 7 | Content type, error context, validation |

## Phases

| # | File | Scope | Est | Depends |
|---|------|-------|-----|---------|
| 01 | [phase-01-backend-audit-fix.md](phase-01-backend-audit-fix.md) | Fix backend bugs: types, race conditions, date parsing, includes | 0.5d | — |
| 02 | [phase-02-frontend-audit-fix.md](phase-02-frontend-audit-fix.md) | Fix frontend bugs: types, auth refresh, missing states, UI issues | 0.5d | 01 |
| 03 | [phase-03-i18n-setup.md](phase-03-i18n-setup.md) | Install next-intl, routing config, proxy, locale layout, messages | 1d | 02 |
| 04 | [phase-04-i18n-pages-components.md](phase-04-i18n-pages-components.md) | Update all pages/components for locale-aware rendering | 1d | 03 |
| 05 | [phase-05-integration-test.md](phase-05-integration-test.md) | E2E test both languages, verify all flows, SEO check | 0.5d | 04 |

## Key Architectural Decisions

- **next-intl v4.11.0** — latest, supports Next.js 16.2.4
- **`localePrefix: 'as-needed'`** — `/services` for vi (default), `/ko/services` for Korean
- **`proxy.ts`** — Next.js 16 standard (not middleware.ts)
- **Admin outside `[locale]`** — Admin pages stay at `/admin/*`, Vietnamese UI only
- **Content editor** — Tab-based vi/ko input for bilingual DB fields
- **DB content** — Already stored as `{ vi, ko }` JSON, frontend renders `content[locale]`
- **Cookie** — `NEXT_LOCALE` with 1-year maxAge for persistence

## Success Criteria

- [x] All API endpoints return correct responses
- [x] All pages render without errors
- [x] Auth flow E2E works (register → login → refresh → logout)
- [x] Booking flow E2E works (service → slot → confirm → success)
- [x] Admin CRUD operations work
- [x] Language switcher toggles vi ↔ ko
- [x] URLs: `/services` ↔ `/ko/services`
- [x] Dynamic content shows correct language
- [x] UI strings translated (~150 keys)
- [x] Locale persists across navigation + login
- [x] SEO metadata correct per locale
- [x] No console errors, no broken layouts

## Risks

| Risk | Mitigation |
|------|------------|
| next-intl + Next.js 16 `use cache` | Using 16.2.4 (fixed), avoid cache in locale-dependent code |
| Routing refactor breaks links | `as-needed` prefix keeps default vi URLs unchanged |
| Admin routing conflict | Admin outside `[locale]` wrapper, no conflict |
| Booking state loss on locale switch | Persist booking state to URL search params |
