---
phase: 08
title: "Testing & QA"
status: pending
priority: P1
effort: 1.5d
dependencies: [phase-01, phase-02, phase-03, phase-04, phase-05, phase-06, phase-07]
---

# Phase 08 — Testing & QA

## Context Links
- All previous phase files in this plan
- [API test config](../../apps/api/tsconfig.json)
- [Web test config](../../apps/web/tsconfig.json)
- [CI workflow](../../.github/workflows/ci.yml)
- [Prisma schema](../../apps/api/prisma/schema.prisma) — seed data for test scenarios

## Overview

Comprehensive testing of all features added in Phases 01-07. Covers admin login flow, CRUD with search/pagination, booking management, user management, Tiptap editor, and public site verification. Mix of manual E2E testing and automated API/unit tests.

## Key Insights

- Project uses `pnpm test` for running tests; check existing test setup
- Backend tests: NestJS with Jest (check if e2e tests exist)
- Frontend: verify if testing framework is configured (Vitest, Jest, or Playwright)
- Priority: API endpoint tests > admin page smoke tests > E2E flows
- Seed data needed: CUSTOMER, DOCTOR, SUPERADMIN users; services; bookings in various statuses

## Requirements

### Functional
- All new API endpoints return correct responses
- All admin pages render without errors
- CRUD operations work on all admin pages
- Auth flows work for all role types
- Public site pages render correctly

### Non-functional
- No TypeScript compilation errors
- No ESLint errors blocking CI
- No console errors in browser
- API responses <500ms for paginated endpoints

## Test Matrix

### A. Admin Auth (Phase 01)

| Test Case | Type | Expected |
|-----------|------|----------|
| CUSTOMER login at `/admin/login` | Manual | Error message, tokens cleared |
| DOCTOR login at `/admin/login` | Manual | Redirect to `/admin/my-schedule` |
| SUPERADMIN login at `/admin/login` | Manual | Redirect to `/admin/dashboard` |
| Unauthenticated `/admin/dashboard` | Manual | Redirect to `/admin/login` |
| Login page renders without sidebar | Manual | No AdminSidebar visible |
| Invalid credentials | Manual | Error message shown |

### B. Backend Pagination & Endpoints (Phase 02)

| Test Case | Type | Expected |
|-----------|------|----------|
| `GET /services/admin` no params | API | Returns array (backward compat) |
| `GET /services/admin?page=1&limit=5` | API | Returns `{ data, meta }` with correct pagination |
| `GET /services/admin?search=botox` | API | Filtered results matching name |
| `GET /doctors/admin?page=1` | API | Paginated doctor profiles |
| `GET /doctors/admin?search=nguyen` | API | Filtered by user name |
| `GET /articles/admin?page=1` | API | All articles (including unpublished) |
| `GET /articles/admin?search=cham` | API | Filtered by title |
| `GET /bookings?page=1&limit=10` | API | Paginated bookings with user info |
| `GET /bookings?status=PENDING` | API | Only PENDING bookings |
| `GET /bookings?doctorId=X` | API | Filtered by doctor |
| `GET /bookings?from=2026-05-01&to=2026-05-07` | API | Date range filter |
| `GET /bookings` as CUSTOMER | API | 403 Forbidden |
| `GET /users?page=1` | API | Paginated user list |
| `GET /users?role=DOCTOR` | API | Only DOCTOR users |
| `GET /users?search=test@` | API | Filtered by email |
| `PATCH /users/:id` change name | API | Name updated |
| `PATCH /users/:id` change role | API | Role updated |
| `PATCH /users/:self` change role | API | 400 self-demotion error |
| `GET /users` as DOCTOR | API | 403 Forbidden |

### C. Booking Management (Phase 03)

| Test Case | Type | Expected |
|-----------|------|----------|
| Bookings page loads with data | Manual | Table displays bookings |
| Filter by status | Manual | Only matching status shown |
| Filter by doctor | Manual | Only that doctor's bookings |
| Filter by date range | Manual | Bookings within range |
| Confirm PENDING booking | Manual | Status changes to CONFIRMED |
| Cancel booking with reason | Manual | Modal opens, reason required, status CANCELLED |
| Cancel without reason | Manual | Validation error |
| Dashboard shows booking count | Manual | Correct count in stat card |
| Dashboard shows recent bookings | Manual | 5 most recent with status badges |

### D. User Management (Phase 04)

| Test Case | Type | Expected |
|-----------|------|----------|
| Users page loads | Manual | Table with all users |
| Filter by role | Manual | Only selected role shown |
| Search by name | Manual | Debounced, filtered results |
| Search by email | Manual | Filtered results |
| Edit user name | Manual | Name updated, list refreshed |
| Change user role | Manual | Role updated with warning |
| Edit own user — role disabled | Manual | Dropdown disabled, tooltip shown |
| Pagination works | Manual | Navigate pages, count updates |

### E. Search & Pagination UI (Phase 05)

| Test Case | Type | Expected |
|-----------|------|----------|
| Services: search filters table | Manual | Results update after 300ms debounce |
| Services: pagination navigates | Manual | Data changes per page |
| Services: search resets to page 1 | Manual | Page resets on new search |
| Services: CRUD + reload works | Manual | Create/edit/delete refreshes paginated list |
| Doctors: search + pagination | Manual | Same behavior as services |
| Articles: search + pagination | Manual | Same behavior |
| Empty search clears filter | Manual | Clear button resets to all results |

### F. Tiptap Editor (Phase 06)

| Test Case | Type | Expected |
|-----------|------|----------|
| Toolbar renders all buttons | Manual | Bold, italic, H1-H3, lists, link, image |
| Bold text | Manual | Selected text becomes bold |
| Italic text | Manual | Selected text becomes italic |
| Heading levels | Manual | Text changes to H1/H2/H3 |
| Bullet list | Manual | List items created |
| Ordered list | Manual | Numbered list created |
| Insert link | Manual | Prompt for URL, link applied |
| Insert image | Manual | Prompt for URL, image displayed |
| Vi/Ko tab switching | Manual | Each tab has independent content |
| Save article with HTML | Manual | Content saved as `{ vi: "...", ko: "..." }` |
| Load existing plaintext article | Manual | Wrapped in `<p>`, editable in Tiptap |
| Load existing HTML article | Manual | Renders correctly in editor |

### G. Public Site (Phase 07)

| Test Case | Type | Expected |
|-----------|------|----------|
| Root `/` redirects to `/vi` | Manual | 302/307 redirect |
| Home page renders | Manual | Hero, services, doctors sections |
| Services list page | Manual | Service cards load from API |
| Service detail page | Manual | Detail renders correctly |
| Blog list page | Manual | Published articles listed |
| Blog detail page | Manual | Article content displays |
| Doctors list page | Manual | Doctor cards display |
| Doctor detail page | Manual | Profile loads |
| Login flow | Manual | Login succeeds, redirects |
| Register flow | Manual | Account created, logged in |
| Booking flow E2E | Manual | Service -> doctor -> slot -> confirm -> success |
| My bookings page | Manual | Auth-gated, shows user's bookings |
| Locale switch vi -> ko | Manual | URL changes, content in Korean |
| Locale switch ko -> vi | Manual | URL changes, content in Vietnamese |
| Header links work | Manual | All nav items navigate correctly |
| Footer links work | Manual | All footer links correct |
| No console errors | Manual | Dev tools console clean |

## Implementation Steps

### Step 1: TypeScript Compilation Check

```bash
pnpm typecheck
```

Fix any TS errors introduced by Phases 01-07.

### Step 2: Lint Check

```bash
pnpm lint
```

Fix any ESLint errors. Focus on actual issues, not style nits.

### Step 3: API Endpoint Tests

Write or run API tests using curl/httpie against running dev server:

1. Start dev server: `pnpm dev`
2. Login as SUPERADMIN to get access token
3. Test each endpoint from Test Matrix B
4. Verify response shapes match `PaginatedResponse<T>` type
5. Verify backward compat (no page param = array)

If Jest e2e test files exist, add tests for new endpoints. If not, manual curl testing is acceptable for this phase.

### Step 4: Admin UI Smoke Tests

With dev server running:

1. Open `/admin/login`, test all 3 role login scenarios (Matrix A)
2. Navigate to each admin page, verify rendering
3. Test CRUD operations on services, doctors, articles
4. Test search and pagination on each page
5. Test bookings page with filters and actions
6. Test users page with filters and edit modal

### Step 5: Tiptap Editor Tests

1. Create new article with rich text content in both vi and ko
2. Save and verify content stored correctly (check via API `GET /articles/admin`)
3. Edit existing plaintext article — verify it loads in editor
4. Test all toolbar buttons
5. Test tab switching preserves content

### Step 6: Public Site Verification

1. Visit each public page from Matrix G
2. Test complete booking flow as CUSTOMER
3. Test locale switching
4. Check browser console for errors

### Step 7: Fix Regressions

For any failures found:
1. Document the issue
2. Identify which phase introduced it
3. Fix in the appropriate source file
4. Re-test

### Step 8: Final Build Check

```bash
pnpm build
```

Ensure production build succeeds without errors.

## Todo List

- [ ] Run `pnpm typecheck` — fix all TS errors
- [ ] Run `pnpm lint` — fix blocking errors
- [ ] Test admin login flow (all 3 roles + invalid credentials)
- [ ] Test all new API endpoints (pagination, search, filters)
- [ ] Test backward compatibility (no page param = array)
- [ ] Test booking management (list, filter, confirm, cancel)
- [ ] Test user management (list, filter, edit, role change)
- [ ] Test search + pagination on services, doctors, articles pages
- [ ] Test Tiptap editor (all toolbar actions, vi/ko tabs, save/load)
- [ ] Test all public site pages render
- [ ] Test booking flow end-to-end
- [ ] Test i18n switching
- [ ] Fix any regressions found
- [ ] Run `pnpm build` — verify production build
- [ ] Final manual walkthrough of critical paths

## Success Criteria

- `pnpm typecheck` passes with 0 errors
- `pnpm lint` passes (no blocking errors)
- `pnpm build` succeeds
- All test cases in Matrix A-G pass
- No console errors on any page
- Complete booking flow works end-to-end
- All admin CRUD operations functional with search + pagination

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Multiple regressions from parallel phase implementation | High | Test each phase incrementally if possible |
| Tiptap React 19 compat issues surface during testing | Medium | Documented fallback in Phase 06 |
| JSON field search doesn't work as expected | Medium | Fallback query strategy documented in Phase 02 |
| Build fails due to Next.js 16 breaking changes | High | Check Next.js 16 docs for migration notes |

## Security Considerations

- Verify SUPERADMIN-only endpoints reject CUSTOMER and DOCTOR roles
- Verify self-demotion prevention on user update
- Verify admin login rejects CUSTOMER role
- Check no sensitive data (passwords, tokens) in API responses
- Verify public pages don't expose admin data
