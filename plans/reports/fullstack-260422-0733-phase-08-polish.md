# Phase 08 Polish — Implementation Report

## Phase
- Phase: 08 — MVP Polish (Error Boundaries, Loading States, SEO, A11y)
- Status: completed

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/app/error.tsx` | 55 | Global error boundary ('use client'), retry + home CTA |
| `apps/web/app/not-found.tsx` | 50 | Custom 404 — "Trang Không Tìm Thấy" with service/home CTAs |
| `apps/web/app/booking/error.tsx` | 52 | Booking-scoped error boundary |
| `apps/web/app/admin/error.tsx` | 55 | Admin-scoped error boundary with digest display |
| `apps/web/app/loading.tsx` | 22 | Global loading — spinner + skeleton lines |
| `apps/web/app/services/loading.tsx` | 43 | Services skeleton grid (6 cards, animate-pulse) |
| `apps/web/app/doctors/loading.tsx` | 44 | Doctors skeleton grid (6 cards, avatar + lines) |
| `apps/web/app/blog/loading.tsx` | 45 | Blog skeleton grid (6 cards, cover + text lines) |
| `apps/web/app/sitemap.ts` | 58 | Dynamic sitemap — static routes + API-fetched slugs |
| `apps/web/app/robots.ts` | 22 | robots.txt — allows `/`, disallows `/admin /me /api` |

## Files Modified

| File | Change |
|------|--------|
| `apps/web/app/layout.tsx` | Added skip-to-content `<a>` + `id="main-content"` on `<main>` |
| `apps/web/components/layout/site-header.tsx` | Added `aria-label="Đăng xuất khỏi tài khoản"` to mobile logout button |

## Tasks Completed

- [x] Global error boundary (`app/error.tsx`)
- [x] Custom 404 page (`app/not-found.tsx`)
- [x] Booking error boundary (`app/booking/error.tsx`)
- [x] Admin error boundary (`app/admin/error.tsx`)
- [x] Global loading (`app/loading.tsx`)
- [x] Services skeleton loading (`app/services/loading.tsx`)
- [x] Doctors skeleton loading (`app/doctors/loading.tsx`)
- [x] Blog skeleton loading (`app/blog/loading.tsx`)
- [x] Empty states — already present on services/doctors/blog/me-bookings pages (not changed, requirement satisfied)
- [x] Sitemap (`app/sitemap.ts`) — `/sitemap.xml` confirmed in build output
- [x] Robots (`app/robots.ts`) — `/robots.txt` confirmed in build output
- [x] Skip-to-content link in root layout
- [x] `aria-label` on mobile logout button in header
- [x] Hamburger toggle already had `aria-label="Toggle menu"` — no change needed
- [x] Footer social links already had `aria-label` — no change needed

## Tests Status

- Typecheck: **pass** (3/3 packages, 858ms)
- Build: **pass** (17/17 pages, 9.3s, 0 errors)

## Notes

- Empty states were already implemented in prior phases on all listed pages; no changes needed
- `generateMetadata` confirmed present on: `/`, `/services`, `/services/[slug]`, `/doctors`, `/doctors/[id]`, `/blog`, `/blog/[slug]`
- Admin sidebar mobile collapse verified present in `admin/layout.tsx` (flex layout, sidebar handles own responsive behavior)
- Booking step indicator already uses `sm:block` classes — works at 375px
- No new packages installed

## Unresolved Questions

- `NEXT_PUBLIC_SITE_URL` env var not yet set in `.env.example` — sitemap/robots fall back to `https://kbeautyspa.vn`; should be added to `.env.example` before production deploy
