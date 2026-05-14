---
phase: 01
title: "Admin Login Page"
status: pending
priority: P1
effort: 0.5d
dependencies: []
---

# Phase 01 — Admin Login Page

## Context Links
- [Admin layout](../../apps/web/app/admin/layout.tsx) — current auth guard redirects to `/login`
- [Auth context](../../apps/web/lib/auth-context.tsx) — `login()` calls `POST /auth/login`
- [API client](../../apps/web/lib/api-client.ts) — `apiPost`, `setTokens`, `clearTokens`

## Overview

Create dedicated `/admin/login` page. Only DOCTOR/SUPERADMIN can proceed; CUSTOMER role gets rejected post-login. Admin layout must redirect unauthenticated users to `/admin/login` instead of `/login`.

## Key Insights

- Login page must render OUTSIDE admin layout's auth guard (otherwise infinite redirect loop)
- Auth response includes `user.role` — role check happens client-side after successful login
- Existing `login()` from `useAuth()` already calls `POST /auth/login` and stores tokens
- No backend changes needed — same auth endpoint works for all roles

## Requirements

### Functional
- Email + password form with K-Beauty Admin branding
- On submit: call `login()`, check `user.role`
- If CUSTOMER: show error toast "Tài khoản không có quyền truy cập", clear tokens, stay on login
- If DOCTOR/SUPERADMIN: redirect to `/admin`
- Show loading state during auth

### Non-functional
- Matches admin design system (brown/rose color palette)
- Mobile responsive

## Architecture

```
/admin/login → standalone page (no AdminSidebar)
/admin/layout.tsx → checks auth, redirects to /admin/login if no user
/admin/login/page.tsx → excluded from layout auth guard via pathname check
```

## Related Code Files

### Files to Create
- `apps/web/app/admin/login/page.tsx` — Admin login page

### Files to Modify
- `apps/web/app/admin/layout.tsx` — Redirect to `/admin/login`; skip auth guard when pathname is `/admin/login`

## Implementation Steps

1. **Create `apps/web/app/admin/login/page.tsx`**
   - `'use client'` component
   - State: `email`, `password`, `error`, `loading`
   - Import `useAuth` for `login()` and `user`
   - Import `useRouter` for redirect
   - On submit:
     ```ts
     await login({ email, password });
     // After login, user is set in context
     ```
   - `useEffect` watching `user`:
     - If `user.role === 'CUSTOMER'` → `clearTokens()`, show error, call `logout()`
     - If DOCTOR/SUPERADMIN → `router.replace('/admin')`
   - UI: centered card with logo text "K-Beauty Admin", email input, password input, submit button
   - Use existing admin color scheme: `bg-[#faf7f4]`, `text-[#3d2b25]`, `bg-[#B76E79]` button

2. **Modify `apps/web/app/admin/layout.tsx`**
   - Import `usePathname`
   - Check: if `pathname === '/admin/login'`, render `children` without sidebar/guard
   - Change redirect target from `'/login'` to `'/admin/login'`
   - Keep existing role check (CUSTOMER → redirect to `/`)

## Todo List

- [ ] Create admin login page with form and role validation
- [ ] Update admin layout to exclude login from auth guard
- [ ] Update admin layout redirect from `/login` to `/admin/login`
- [ ] Test: CUSTOMER login shows error and clears session
- [ ] Test: DOCTOR login redirects to `/admin/my-schedule`
- [ ] Test: SUPERADMIN login redirects to `/admin/dashboard`
- [ ] Test: unauthenticated `/admin/dashboard` redirects to `/admin/login`

## Success Criteria

- Visiting `/admin` while unauthenticated redirects to `/admin/login`
- CUSTOMER cannot access admin (shown error, tokens cleared)
- DOCTOR/SUPERADMIN can login and reach their admin pages
- Login page renders without AdminSidebar

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Infinite redirect if login page inside auth guard | High | Check pathname before applying guard in layout |
| Flash of admin UI before redirect for CUSTOMER | Low | Return `null` while checking role |

## Security Considerations

- Role check is UX-only; backend guards (`@Roles`) enforce server-side
- CUSTOMER tokens cleared immediately on detection — no stale admin session
- No new API endpoints — attack surface unchanged
