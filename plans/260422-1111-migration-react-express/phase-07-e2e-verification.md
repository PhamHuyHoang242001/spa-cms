# Phase 07: End-to-End Verification

**Priority:** Critical | **Status:** Pending | **Est:** 0.5d | **Depends:** Phase 04, Phase 06

## Overview

Run both repos together, test all user flows end-to-end, fix integration issues, verify feature parity with original monorepo.

## Setup

### Start both servers
```bash
# Terminal 1: Backend
cd /Users/phamhoang/Documents/work/spa-be
docker compose up -d  # PostgreSQL
pnpm dev              # Express on :3001

# Terminal 2: Frontend
cd /Users/phamhoang/Documents/work/spa-fe
pnpm dev              # Vite on :5173 (proxy API to :3001)
```

### Vite proxy config (vite.config.ts)
```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') }
    }
  }
});
```
OR keep `VITE_API_URL=http://localhost:3001` env var in api-client.ts.

## Test Checklist

### 1. Public Pages (no auth)
- [ ] Home page loads, shows services + doctors from API
- [ ] Services list page loads with all services
- [ ] Service detail page loads by slug
- [ ] Doctors list page loads with all doctors
- [ ] Doctor detail page loads by ID
- [ ] Blog list page loads with published articles
- [ ] Blog detail page loads by slug, renders Tiptap HTML
- [ ] Blog pagination works (page 1, 2, ...)
- [ ] Blog tag filter works
- [ ] 404 page shows for unknown routes

### 2. Auth Flow
- [ ] Register: create new user → redirects to home → user shown in header
- [ ] Logout → header shows login button
- [ ] Login: existing user → redirects to home
- [ ] Session restore: refresh page → user still logged in (token refresh)
- [ ] Token expiry: wait 15min (or manipulate) → auto-refresh works
- [ ] Invalid token → redirects to login

### 3. Booking Flow (requires CUSTOMER login)
- [ ] Navigate to /booking → RequireAuth redirects if not logged in
- [ ] Step 1: Service selection shows all active services
- [ ] Step 2: Doctor selection shows available doctors
- [ ] Step 3: Date + slot selection shows available 30-min blocks
- [ ] Step 4: Confirmation shows service, doctor, slot, price
- [ ] Step 5: Submit → booking created → success page
- [ ] Back navigation between steps preserves selections
- [ ] /me/bookings shows the new booking

### 4. Admin Flow (requires DOCTOR or SUPERADMIN login)
- [ ] Navigate to /admin → redirects CUSTOMER to home
- [ ] Dashboard page loads with stats
- [ ] Services CRUD: list, create, edit, delete (soft)
- [ ] Doctors CRUD: list, create (creates user+profile), edit, delete
- [ ] Articles CRUD: list, create, edit, publish, delete
- [ ] Slots: generate for date range, view by doctor+date, block slot
- [ ] My Schedule (DOCTOR): view own schedule and bookings

### 5. Booking Lifecycle (admin operations)
- [ ] Doctor confirms booking → status CONFIRMED
- [ ] Doctor completes booking → status COMPLETED
- [ ] Doctor marks no-show → status NO_SHOW, slot freed
- [ ] Customer cancels booking → slot freed
- [ ] Superadmin cancels with reason → adminNote saved

### 6. Edge Cases
- [ ] Duplicate booking same slot → 409 error
- [ ] Access other user's booking → 403
- [ ] CUSTOMER tries admin route → 403
- [ ] Invalid form data → validation errors shown
- [ ] API down → error states render gracefully
- [ ] Rate limiting: 11th request in 60s → 429

### 7. Visual Regression
- [ ] Hero section gradient + animations match
- [ ] K-beauty color palette (#D4A574, #F5F0E8, #1C1917) consistent
- [ ] Responsive: mobile, tablet, desktop layouts
- [ ] Admin sidebar active state highlighting
- [ ] Modal open/close + backdrop
- [ ] Loading spinners during API calls

### 8. Performance
- [ ] FE: `pnpm build` succeeds, bundle < 500KB gzipped
- [ ] BE: no memory leaks after 100 requests
- [ ] API response times < 200ms for list endpoints
- [ ] No infinite re-renders in React DevTools

## Common Integration Issues to Watch

| Issue | Symptom | Fix |
|-------|---------|-----|
| CORS mismatch | Browser blocks API calls | Ensure BE CORS_ORIGIN matches FE origin |
| Token format | 401 on all auth requests | Verify Bearer token format in api-client |
| JSON parse | Empty responses error | Check 204 No Content handling |
| Date timezone | Slots show wrong dates | Verify UTC handling in datetime-utils |
| i18n fields | `[object Object]` rendered | Ensure `.vi` accessor on JSON fields |

## Fix Integration Issues
- Document all issues found in this checklist
- Fix in respective repo
- Re-test after each fix
- Run BE integration tests again after fixes

## Todo

- [ ] Start both servers
- [ ] Test all public pages (7)
- [ ] Test auth flow (register, login, logout, refresh)
- [ ] Test booking flow end-to-end
- [ ] Test admin CRUD operations
- [ ] Test booking lifecycle (confirm, complete, no-show, cancel)
- [ ] Test edge cases (auth, validation, rate limit)
- [ ] Visual regression check (responsive + colors + animations)
- [ ] Performance check (build size, API speed, no memory leaks)
- [ ] Fix all discovered issues
- [ ] Final pass: all tests green

## Success Criteria

- All checklist items pass
- Both repos run independently and communicate correctly
- No console errors in browser or server
- Feature parity with original monorepo confirmed
- BE integration tests still pass after fixes
- FE builds without TypeScript errors
