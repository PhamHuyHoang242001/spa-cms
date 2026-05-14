---
name: k-beauty-spa-website
date: 2026-04-21
status: completed
priority: high
estimatedDays: 19-21
blockedBy: []
blocks: []
---

# K-Beauty Spa Website — Implementation Plan

**Brainstorm:** `plans/reports/brainstormer-260421-2300-k-beauty-spa-website.md`
**Type:** Greenfield web app
**Stack:** Next.js 15 + NestJS 10 + PostgreSQL + Prisma (Turborepo monorepo)

## Goal
Website quảng bá + đặt lịch cho spa chuẩn Hàn. Customer mode (landing premium K-beauty + booking + dashboard) và Admin mode (doctor schedule + superadmin CRUD).

## Releases
- **R1 (~10d):** Setup → Auth → Core entities → Booking → Landing → Customer dashboard (public-ready).
- **R2 (+7d):** Admin panel → Blog CMS.
- **R3 (+3d):** Polish → Deploy production.

## Phases

| # | File | Scope | Est | Depends |
|---|------|-------|-----|---------|
| 00 | [phase-00-setup-monorepo.md](phase-00-setup-monorepo.md) | Turborepo init, Next+Nest skeleton, Prisma, Docker, CI | 1d | — | ✓ |
| 01 | [phase-01-auth-system.md](phase-01-auth-system.md) | User model, JWT access+refresh, guards, roles | 1.5d | 00 | ✓ |
| 02 | [phase-02-core-entities.md](phase-02-core-entities.md) | Doctor, Service, TimeSlot CRUD + seed 7 packages | 1.5d | 01 | ✓ |
| 03 | [phase-03-booking-logic.md](phase-03-booking-logic.md) | Slot generation, transactional create, cron expire, cancel | 2.5d | 02 | ✓ |
| 04 | [phase-04-landing-marketing.md](phase-04-landing-marketing.md) | Home, services, doctors, process, testimonials, i18n vi/ko | 3d | 00 | ✓ |
| 05 | [phase-05-blog-articles.md](phase-05-blog-articles.md) | Tiptap admin editor, public blog, ISR, SEO | 2d | 02 | ✓ |
| 06 | [phase-06-customer-dashboard.md](phase-06-customer-dashboard.md) | Booking flow UI, my bookings tabs, history | 2d | 03, 04 | ✓ |
| 07 | [phase-07-admin-panel.md](phase-07-admin-panel.md) | Doctor view (own schedule), superadmin CRUDs | 3d | 03, 05 | ✓ |
| 08 | [phase-08-polish.md](phase-08-polish.md) | Animation pass, Lighthouse, a11y, error boundaries | 2d | 04, 06, 07 | ✓ |
| 09 | [phase-09-deploy.md](phase-09-deploy.md) | Vercel + Railway + Cloudinary + domain + analytics | 1d | 08 | ✓ |

## Key Architectural Rules

- **Double-book prevention:** DB unique on `Booking.slotId` + `SELECT FOR UPDATE` trong transaction.
- **1 active booking/user:** Postgres partial unique index trên `(userId)` WHERE status IN ('PENDING','CONFIRMED').
- **Auto-expire:** `@nestjs/schedule` cron mỗi 5p, flip quá-giờ PENDING/CONFIRMED → EXPIRED, slot freed về AVAILABLE.
- **Timezone:** Asia/Ho_Chi_Minh throughout. Slot stored as `date + local time`, convert only at display edges.
- **Content i18n:** JSON column `{ vi, ko }` cho services, articles, doctor bio.
- **RBAC:** CUSTOMER / DOCTOR / SUPERADMIN enum, NestJS Guards + resource ownership checks.

## Assumptions (from brainstorm §15 open questions)

1. **Guest booking:** disabled — phải login để đặt lịch (đổi sau nếu cần).
2. **Doctor count:** seed 3 bác sĩ mẫu.
3. **Brand assets:** palette mặc định (ivory/nude/rose-gold + warm black), font pairing Inter + Noto Serif KR (thay sau khi có brand kit).
4. **Google Maps:** embed placeholder, address hard-code trong footer.
5. **Giờ làm việc:** 9-12, 14-18 áp dụng cả tuần; weekend override để sau.
6. **Domain:** chưa chốt, dùng Vercel preview URL trước.
7. **Expired slot:** **freed về AVAILABLE** để user khác có thể đặt.

## Out of Scope (MVP)

OAuth login, SMS/email notify, online payment, review/rating, loyalty, mobile app, multi-branch, password reset flow (sẽ thêm R2+).

## Success Metrics

- Lighthouse ≥ 90 (perf/a11y/SEO) on home.
- Booking create success rate > 99%, zero double-book incidents.
- First public booking within launch week.
- Google index ≥ 10 pages within 2 weeks.

## Risks (see brainstorm §11)

Double-book race → DB unique + transaction. Heavy animation mobile lag → strict budget + prefers-reduced-motion. Timezone drift → fixed TZ, store local + convert at edge. Cloudinary limit → on-the-fly transform thay vì multi-size store.
