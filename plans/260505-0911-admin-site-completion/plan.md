---
title: "Admin Site Completion & Full Site Polish"
description: "Complete admin features, add booking/user management, search/pagination, Tiptap editor, polish public site"
status: pending
priority: P1
effort: 10-12d
branch: master
tags: [feature, frontend, backend, admin]
blockedBy: []
blocks: []
created: 2026-05-05
---

# Admin Site Completion & Full Site Polish

## Summary

Enhance the K-Beauty Spa CMS admin panel from MVP to production-ready. Adds dedicated admin login, booking/user management, search+pagination across all CRUD pages, Tiptap rich text editor for articles, and cleans up deprecated public site files.

## Current State

- Admin panel: dashboard, services, doctors, articles, slots, my-schedule
- No `/admin/login`, `/admin/bookings`, `/admin/users`
- No search/filter/pagination on admin pages
- Articles use plaintext textarea (no WYSIWYG)
- Dashboard has placeholder for recent bookings
- Old non-locale pages deleted but not committed
- Backend missing: `GET /bookings` (list all), `GET/PATCH /users` (admin endpoints)

## Phase Overview

| Phase | Name | Effort | Status | Dependencies |
|-------|------|--------|--------|-------------|
| 01 | [Admin Auth](phase-01-admin-auth.md) | 0.5d | pending | None |
| 02 | [Backend Pagination & New Endpoints](phase-02-backend-pagination-and-new-endpoints.md) | 2d | pending | None |
| 03 | [Booking Management](phase-03-admin-booking-management.md) | 1.5d | pending | Phase 02 |
| 04 | [User Management](phase-04-admin-user-management.md) | 1d | pending | Phase 02 |
| 05 | [Search & Pagination UI](phase-05-search-and-pagination-ui.md) | 1.5d | pending | Phase 02 |
| 06 | [Tiptap WYSIWYG Editor](phase-06-tiptap-editor.md) | 1.5d | pending | None |
| 07 | [Public Site Polish](phase-07-public-site-polish.md) | 0.5d | pending | None |
| 08 | [Testing & QA](phase-08-testing-and-qa.md) | 1.5d | pending | All above |

## Dependency Graph

```
Phase 01 (auth) ──────────────────────────┐
Phase 02 (backend) ──┬── Phase 03 (bookings) ──┤
                     ├── Phase 04 (users) ──────┤
                     └── Phase 05 (search UI) ──┤
Phase 06 (tiptap) ──────────────────────────────┤
Phase 07 (polish) ──────────────────────────────┤
                                                └── Phase 08 (testing)
```

## Parallel Execution Strategy

- **Batch 1** (no deps): Phase 01, 02, 06, 07 can run in parallel
- **Batch 2** (needs Phase 02): Phase 03, 04, 05 can run in parallel
- **Batch 3** (needs all): Phase 08

## Key Decisions

- Backend pagination backward-compatible: no `page` param = array response
- Admin login: separate page outside admin layout auth guard
- Tiptap stores HTML strings; no backend schema changes needed
- Reusable `AdminSearchBar` + `AdminPagination` + `useAdminList` hook for all CRUD pages
- `GET /bookings` restricted to SUPERADMIN; `GET /users` restricted to SUPERADMIN
