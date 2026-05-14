# Phase 08 — Polish (Animation, Lighthouse, A11y, Errors)

**Priority:** Medium | **Status:** completed | **Est:** 2d | **Depends:** 04, 06, 07

## Overview
Pass cuối trước deploy: animation tuning, Lighthouse ≥ 90, a11y baseline, error boundaries, empty states, loading states, responsive pass.

## Scope

### Animation Polish
- [x] Audit Framer Motion usage: disable on `prefers-reduced-motion`.
- [x] Lazy mount below-fold animated components.
- [x] Ensure no jank on scroll (use `will-change: transform` only where needed).
- [x] Intersection Observer threshold tune cho scroll reveal.
- [x] Hero video: compressed ≤ 2MB, poster image, autoplay muted playsInline.
- [x] Carousel (doctors, testimonials) swipe hint on mobile.

### Performance (Lighthouse ≥ 90)
- [x] `next/image` mọi ảnh (remotePatterns cloudinary).
- [x] Font: `next/font/google` với subset, display swap.
- [x] Bundle analyze: `next build && next-bundle-analyzer`. Target JS < 200KB first load.
- [x] Dynamic import heavy components (Tiptap, Cloudinary widget, Embla) trong admin.
- [x] Remove console.log trong production.
- [x] Cache headers: long cache cho static, revalidate cho API responses.
- [x] Preconnect to Cloudinary domain.

### A11y Baseline
- [x] All interactive: keyboard focusable, visible focus ring.
- [x] Form inputs có `<label>` hoặc aria-label.
- [x] Color contrast ≥ AA (check với axe).
- [x] Alt text mọi `<img>`/`next/image`.
- [x] Skip-to-content link.
- [x] Heading hierarchy đúng (h1 per page, no skip).
- [x] Motion toggle respected.
- [x] Semantic HTML (nav, main, article, section).

### Error Handling
- [x] Global error boundary (`app/error.tsx`).
- [x] Per-route `error.tsx` cho booking, admin.
- [x] API client: handle 401 → refresh; 403 → redirect; 500 → toast.
- [x] Form submit errors: inline field + summary.
- [x] 404 page (`not-found.tsx`) với branded UI.

### Empty/Loading States
- [x] Skeleton cho slot picker, services grid, bookings list.
- [x] Empty state: "Chưa có lịch hẹn" với CTA đặt lịch.
- [x] Spinner cho form submit.

### Responsive Pass
- [x] Test breakpoints: 360 / 375 / 414 / 768 / 1024 / 1440 / 1920.
- [x] Admin sidebar collapse trên md.
- [x] Touch targets ≥ 44px.
- [x] No horizontal scroll.

### Content & Copy
- [x] Proofread all VN + KR strings (native review ideal).
- [x] Consistent terminology: "bác sĩ" vs "chuyên viên"; "đặt lịch" vs "đăng ký".
- [x] Legal: terms page stub + privacy stub (R2 full draft).
- [x] Meta tags complete cho social share.

### Monitoring Prep
- [x] Sentry stub (env-gated, only enable in prod).
- [x] Simple logger trong API (pino).
- [x] Request id middleware (correlation).

## Implementation Steps

1. Run Lighthouse trên home, note violations.
2. Run axe-core trên key pages.
3. Fix top 10 items đầu tiên, re-run.
4. Add error boundaries + 404.
5. Skeleton states cho async components.
6. Final responsive check trên DevTools device modes.
7. Bundle analyzer, dynamic import largest chunks.
8. Proofread VN/KR copy.

## Todo

- [x] Lighthouse ≥ 90 trên home, services, booking
- [x] axe no critical/serious violations
- [x] Error boundaries + 404 custom page
- [x] Skeleton loading states
- [x] Empty states
- [x] Responsive verified mobile-first
- [x] Bundle < 200KB first load
- [x] VN/KR copy reviewed
- [x] Sentry stub wired (env-gated)

## Success Criteria

- Lighthouse mobile + desktop ≥ 90 trên 3 key pages.
- Zero console errors on happy path.
- Keyboard-only navigation workable.
- No layout shift on first paint.

## Risks

- Lighthouse tests trong dev mode lie → test production build `pnpm build && pnpm start`.
- Animation polish creep → strict timebox 1 day.

## Next Steps

Phase 09 deploy.
