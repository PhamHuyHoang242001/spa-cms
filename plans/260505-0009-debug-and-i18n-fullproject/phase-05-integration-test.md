# Phase 05: Integration Test & Final Verification

**Priority:** High | **Status:** Pending | **Est:** 0.5d | **Depends:** Phase 04

## Overview

Comprehensive E2E testing of all features in both locales. Verify auth flows, booking flows, admin CRUD, locale persistence, SEO metadata, and mobile responsiveness. Fix any remaining issues.

## Requirements

### Functional
- All user flows work in vi and ko locales
- Locale persists across navigation, page refresh, and login
- Admin panel unaffected by i18n changes
- No broken links or missing translations

### Non-Functional
- No console errors in browser
- TypeScript compiles without errors
- Pages load without hydration mismatches
- SEO metadata correct per locale

## Test Matrix

### Auth Flow (both locales)
| Test | vi | ko | Notes |
|------|----|----|-------|
| Register new user | [ ] | [ ] | Form labels translated |
| Login with credentials | [ ] | [ ] | Error messages translated |
| Token refresh on 401 | [ ] | [ ] | Should not logout on 500 |
| Logout | [ ] | [ ] | Redirects to login |
| `/auth/me` returns user | [ ] | [ ] | Includes locale field |

### Booking Flow (both locales)
| Test | vi | ko | Notes |
|------|----|----|-------|
| Select service | [ ] | [ ] | Service names in locale |
| Select doctor | [ ] | [ ] | Doctor info in locale |
| Select time slot | [ ] | [ ] | Date format matches locale |
| Confirm booking | [ ] | [ ] | Summary in locale |
| Success page | [ ] | [ ] | Success message translated |
| Double-submit prevention | [ ] | [ ] | Second click ignored |
| Booking in my-bookings | [ ] | [ ] | Shows in dashboard |

### My Bookings Dashboard (both locales)
| Test | vi | ko | Notes |
|------|----|----|-------|
| Upcoming tab | [ ] | [ ] | Correct status labels |
| History tab | [ ] | [ ] | EXPIRED/NO_SHOW shown |
| Cancel booking | [ ] | [ ] | Dialog translated |
| Empty state | [ ] | [ ] | Message translated |

### Public Pages (both locales)
| Test | vi | ko | Notes |
|------|----|----|-------|
| Home page sections | [ ] | [ ] | All 5 sections translated |
| Services list | [ ] | [ ] | Names/descriptions in locale |
| Service detail | [ ] | [ ] | Full content in locale |
| Doctors list | [ ] | [ ] | Specialty/bio in locale |
| Doctor detail | [ ] | [ ] | Full profile in locale |
| Blog list | [ ] | [ ] | Article titles in locale |
| Blog article | [ ] | [ ] | Content in locale |

### Locale Switching
| Test | Status | Notes |
|------|--------|-------|
| Switcher toggles vi ↔ ko | [ ] | URL changes correctly |
| Cookie NEXT_LOCALE set | [ ] | Check browser dev tools |
| Locale persists on refresh | [ ] | Cookie-based |
| Locale persists after login | [ ] | User.locale synced |
| Deep link /ko/services works | [ ] | Direct URL access |
| Default / redirects correctly | [ ] | No prefix for vi |

### Admin Panel (Vietnamese only)
| Test | Status | Notes |
|------|--------|-------|
| Admin dashboard loads | [ ] | No i18n interference |
| Doctor CRUD | [ ] | vi/ko tabs in forms |
| Service CRUD | [ ] | vi/ko tabs in forms |
| Article CRUD | [ ] | vi/ko tabs in editor |
| Slot management | [ ] | Generate/block works |
| My Schedule (doctor view) | [ ] | Shows correct slots |

### SEO & Technical
| Test | Status | Notes |
|------|--------|-------|
| `<html lang="vi">` on vi pages | [ ] | Check page source |
| `<html lang="ko">` on ko pages | [ ] | Check page source |
| hreflang tags present | [ ] | Check head meta |
| Page titles translated | [ ] | Check document.title |
| Meta descriptions translated | [ ] | Check meta tags |
| No hydration errors | [ ] | Check console |
| No TypeScript errors | [ ] | `pnpm typecheck` |
| Build succeeds | [ ] | `pnpm build` |

### API Endpoints (verify backend)
| Test | Status | Notes |
|------|--------|-------|
| GET /doctors returns bilingual data | [ ] | { vi, ko } JSON |
| GET /services returns bilingual data | [ ] | { vi, ko } JSON |
| GET /articles returns bilingual data | [ ] | { vi, ko } JSON |
| POST /bookings creates correctly | [ ] | No race condition |
| PATCH /bookings/:id/cancel returns full data | [ ] | With BOOKING_INCLUDE |
| Cron job expires old bookings | [ ] | Check EXPIRED status |

## Implementation Steps

### Step 1: Start both apps
```bash
# Terminal 1: API
cd apps/api && pnpm dev

# Terminal 2: Web
cd apps/web && pnpm dev
```

### Step 2: Run TypeScript check
```bash
pnpm typecheck
```
Fix any errors before manual testing.

### Step 3: Manual testing per test matrix
Go through each test case above. Document failures.

### Step 4: Fix found issues
- Fix in relevant phase files
- Re-test after each fix

### Step 5: Build verification
```bash
pnpm build
```
Ensure production build succeeds.

### Step 6: Mobile responsive check
- Test on mobile viewport (375px width)
- Check locale switcher usable on mobile
- Check booking flow on mobile
- Check admin panel on mobile

## Todo List

- [ ] Run `pnpm typecheck` — fix all errors
- [ ] Test auth flow in vi
- [ ] Test auth flow in ko
- [ ] Test booking flow in vi
- [ ] Test booking flow in ko
- [ ] Test my-bookings in vi
- [ ] Test my-bookings in ko
- [ ] Test all public pages in vi
- [ ] Test all public pages in ko
- [ ] Test locale switching & persistence
- [ ] Test admin panel (CRUD + vi/ko tabs)
- [ ] Verify SEO metadata
- [ ] Run `pnpm build` — fix all errors
- [ ] Mobile responsive check
- [ ] Fix any remaining issues

## Success Criteria

- All test matrix items pass (both locales)
- `pnpm typecheck` passes
- `pnpm build` succeeds
- No console errors
- No hydration mismatches
- Mobile layout works
- Locale persists correctly

## Risk Assessment

- **Hydration mismatch**: Server-rendered locale may differ from client cookie — ensure proxy.ts handles correctly
- **Build static pages**: `generateStaticParams` must return all locales for every dynamic route
- **Edge case: switching locale mid-booking**: Booking state may reset — test this specifically
