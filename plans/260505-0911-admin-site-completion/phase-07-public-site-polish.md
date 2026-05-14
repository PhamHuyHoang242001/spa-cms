---
phase: 07
title: "Public Site Polish & Cleanup"
status: pending
priority: P2
effort: 0.5d
dependencies: []
---

# Phase 07 — Public Site Polish & Cleanup

## Context Links
- Git status shows deleted files: `apps/web/app/blog/`, `apps/web/app/booking/`, `apps/web/app/doctors/`, `apps/web/app/login/`, `apps/web/app/me/`, `apps/web/app/page.tsx`, `apps/web/app/register/`, `apps/web/app/services/`
- Locale pages exist at: `apps/web/app/[locale]/` (page, services, blog, login, register, booking, doctors, me/bookings)
- [Site header](../../apps/web/components/layout/site-header.tsx)
- [Site footer](../../apps/web/components/layout/site-footer.tsx)
- [Next config](../../apps/web/next.config.ts)

## Overview

Clean up deprecated non-locale page files (already deleted in working tree but not committed), verify all `[locale]/` pages render correctly, test full booking flow, and confirm i18n switching works end-to-end.

## Key Insights

- Old non-locale pages are already deleted in the working tree (git status shows `D` prefix) but not committed
- All functionality has been migrated to `apps/web/app/[locale]/` routes
- Need to verify no broken imports or references to old page paths remain
- Site header/footer links must point to locale-prefixed routes (e.g., `/vi/services` not `/services`)
- Root `apps/web/app/page.tsx` is deleted — need a root redirect to default locale

## Requirements

### Functional
- All old non-locale page files confirmed deleted
- Root `/` redirects to `/vi` (default locale)
- All `[locale]/` pages render without errors
- Booking flow works end-to-end (service -> doctor -> slot -> confirm)
- Blog pages load and display articles
- i18n switching (vi <-> ko) works on all pages
- Header/footer links use correct locale-prefixed routes

### Non-functional
- No console errors on any public page
- No broken images or missing assets
- Page transitions smooth (no flash of unstyled content)

## Related Code Files

### Files to Delete (confirm deletion)
- `apps/web/app/blog/[slug]/page.tsx`
- `apps/web/app/blog/loading.tsx`
- `apps/web/app/blog/page.tsx`
- `apps/web/app/booking/error.tsx`
- `apps/web/app/booking/page.tsx`
- `apps/web/app/doctors/[id]/page.tsx`
- `apps/web/app/doctors/loading.tsx`
- `apps/web/app/doctors/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/me/bookings/page.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/services/[slug]/page.tsx`
- `apps/web/app/services/loading.tsx`
- `apps/web/app/services/page.tsx`

### Files to Verify
- `apps/web/app/[locale]/page.tsx` — Home page
- `apps/web/app/[locale]/services/page.tsx` — Services list
- `apps/web/app/[locale]/services/[slug]/page.tsx` — Service detail
- `apps/web/app/[locale]/blog/page.tsx` — Blog list
- `apps/web/app/[locale]/blog/[slug]/page.tsx` — Blog detail
- `apps/web/app/[locale]/login/page.tsx` — Customer login
- `apps/web/app/[locale]/register/page.tsx` — Customer register
- `apps/web/app/[locale]/booking/page.tsx` — Booking wizard
- `apps/web/app/[locale]/doctors/page.tsx` — Doctors list
- `apps/web/app/[locale]/doctors/[id]/page.tsx` — Doctor detail
- `apps/web/app/[locale]/me/bookings/page.tsx` — My bookings

### Files to Possibly Modify
- `apps/web/app/layout.tsx` — Ensure root layout handles locale redirect
- `apps/web/components/layout/site-header.tsx` — Verify locale-prefixed links
- `apps/web/components/layout/site-footer.tsx` — Verify locale-prefixed links
- `apps/web/next.config.ts` — Verify i18n config / middleware

## Implementation Steps

### Step 1: Confirm File Deletions

Run `git status` to verify all old files are deleted. If any remain, delete them:

```bash
# These should already show as deleted in git status
# If not, explicitly remove:
rm -rf apps/web/app/blog apps/web/app/booking apps/web/app/doctors \
       apps/web/app/login apps/web/app/me apps/web/app/register \
       apps/web/app/services apps/web/app/page.tsx
```

### Step 2: Verify Root Redirect

Check if there's a root page or middleware handling `/` -> `/vi` redirect:

- Option A: `apps/web/app/page.tsx` exists as redirect (currently deleted — need to recreate as redirect)
- Option B: Next.js middleware handles locale detection and redirect
- Option C: `next.config.ts` has redirect rules

If no root handler exists, create `apps/web/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/vi');
}
```

Or if using next-intl middleware, it should handle this automatically. Verify by checking middleware config.

### Step 3: Grep for Broken References

Search for any hardcoded links to old routes without locale prefix:

```bash
# Search for non-locale links in components
grep -r "href=\"/services" apps/web/components/ --include="*.tsx"
grep -r "href=\"/blog" apps/web/components/ --include="*.tsx"
grep -r "href=\"/doctors" apps/web/components/ --include="*.tsx"
grep -r "href=\"/login" apps/web/components/ --include="*.tsx"  # admin login is ok
grep -r "href=\"/booking" apps/web/components/ --include="*.tsx"
grep -r "href=\"/register" apps/web/components/ --include="*.tsx"
```

Fix any found references to use locale-aware paths (e.g., `/${locale}/services`).

### Step 4: Verify Each Page

For each locale page, start dev server and check:

1. **Home** (`/vi`): hero section, services grid, doctors showcase render
2. **Services** (`/vi/services`): list loads from API, cards display correctly
3. **Service detail** (`/vi/services/[slug]`): detail page loads
4. **Blog** (`/vi/blog`): published articles listed
5. **Blog detail** (`/vi/blog/[slug]`): article renders with content
6. **Login** (`/vi/login`): form displays, login works
7. **Register** (`/vi/register`): form displays, registration works
8. **Booking** (`/vi/booking`): multi-step wizard works (service -> doctor -> slot -> confirm -> success)
9. **Doctors** (`/vi/doctors`): doctor cards display
10. **Doctor detail** (`/vi/doctors/[id]`): profile loads
11. **My bookings** (`/vi/me/bookings`): auth-gated, shows user's bookings
12. **Korean** (`/ko`): switch locale, verify pages render with Korean text

### Step 5: Test i18n Switching

- Verify locale switcher in header works
- Check that switching locale preserves current path (e.g., `/vi/services` -> `/ko/services`)
- Verify content changes language (service names, doctor bios in ko vs vi)

### Step 6: Check Header/Footer Links

- All nav links in header should use `/${locale}/...` pattern
- Footer links should use locale-prefixed routes
- Admin link (if any in header) should point to `/admin` (not locale-prefixed)

## Todo List

- [ ] Confirm all old non-locale files are deleted
- [ ] Verify root `/` redirect to `/vi` works
- [ ] Grep for hardcoded non-locale links; fix any found
- [ ] Test home page renders correctly
- [ ] Test services list + detail pages
- [ ] Test blog list + detail pages
- [ ] Test login and register flows
- [ ] Test booking flow end-to-end
- [ ] Test doctors list + detail pages
- [ ] Test my bookings page (authenticated)
- [ ] Test locale switching (vi <-> ko)
- [ ] Verify header/footer links
- [ ] Check for console errors on all pages

## Success Criteria

- No old non-locale page files remain in working tree
- Root `/` redirects to `/vi`
- All 11 public pages render without errors
- Booking flow works from start to finish
- i18n switching works on all pages
- No console errors or broken links
- Header/footer navigation works correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Root redirect missing after `page.tsx` deletion | High | Recreate as server-side redirect or verify middleware handles it |
| Hardcoded non-locale links in components | Medium | Grep search + fix; most should already be locale-aware |
| Some pages broken due to import changes during i18n migration | Medium | Test each page individually; fix on discovery |
| Blog detail page fails for HTML content (from Tiptap Phase 06) | Low | Phase 07 runs independently; existing plaintext content works fine |

## Security Considerations

- No new security surface — this phase is cleanup and verification
- Verify login/register pages still enforce proper auth flow
- Verify my-bookings page is properly auth-gated
- Ensure no admin routes are accessible without authentication
