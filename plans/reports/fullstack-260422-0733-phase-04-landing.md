# Phase 04 — Landing/Marketing Pages Implementation Report

## Status: COMPLETED

---

## Files Created / Modified

| File | Action | Lines |
|------|--------|-------|
| `apps/web/app/globals.css` | Modified | 30 |
| `apps/web/app/layout.tsx` | Modified | 44 |
| `apps/web/app/page.tsx` | Replaced | 50 |
| `apps/web/app/services/page.tsx` | Created | 90 |
| `apps/web/app/services/[slug]/page.tsx` | Created | 95 |
| `apps/web/app/doctors/page.tsx` | Created | 90 |
| `apps/web/app/doctors/[id]/page.tsx` | Created | 105 |
| `apps/web/components/layout/site-header.tsx` | Created | 115 |
| `apps/web/components/layout/site-footer.tsx` | Created | 80 |
| `apps/web/components/sections/hero-section.tsx` | Created | 80 |
| `apps/web/components/sections/services-grid-section.tsx` | Created | 100 |
| `apps/web/components/sections/doctors-showcase-section.tsx` | Created | 100 |
| `apps/web/components/sections/process-timeline-section.tsx` | Created | 90 |
| `apps/web/components/sections/cta-band-section.tsx` | Created | 55 |
| `apps/web/lib/api-types.ts` | Created | 28 |

---

## Tasks Completed

- [x] Installed framer-motion, embla-carousel-react, lucide-react, clsx
- [x] Tailwind v4 theme vars: ivory, rose-gold, warm-black, muted, dark-cta in globals.css
- [x] Noto Serif KR font added via next/font/google
- [x] SiteHeader: sticky, mobile hamburger, auth state, Vietnamese nav links
- [x] SiteFooter: address, hours, social links (Zalo/FB/IG), copyright
- [x] layout.tsx: replaced SiteNavHeader with new header/footer, lang="vi"
- [x] Home page: HeroSection, ServicesGridSection, DoctorsShowcaseSection, ProcessTimelineSection, CtaBandSection
- [x] framer-motion fade-in-up on whileInView for all section components
- [x] prefers-reduced-motion global CSS rule
- [x] Services list page with full grid
- [x] Services detail page with gallery placeholder + CTA
- [x] Doctors list page with avatar placeholder grid
- [x] Doctors detail page with bio, specialty tags + CTA
- [x] generateMetadata on all pages (title, description, OG)
- [x] API fields parsed as `.vi` (LocalizedString interface)
- [x] Server Components fetch directly via fetch() to localhost:3001
- [x] export const dynamic = 'force-dynamic' on all API-fetching pages

---

## Tests Status

- TypeScript typecheck: PASS (zero errors)
- Production build: PASS
  - `/` — Dynamic (ƒ)
  - `/doctors` — Dynamic (ƒ)
  - `/doctors/[id]` — Dynamic (ƒ)
  - `/services` — Dynamic (ƒ)
  - `/services/[slug]` — Dynamic (ƒ)
  - `/login`, `/register` — Static (○)

---

## Issues Encountered

1. **Build crash (fixed):** Next.js 16 attempted static prerender of `/doctors` during build — API not running, returned `[]`, but `.specialty.vi.split(',')` in detail page threw TypeError. Fixed by adding `export const dynamic = 'force-dynamic'` to all API-fetching pages.
2. **Tailwind v4:** No `tailwind.config.ts` exists — Tailwind v4 uses `@theme inline` CSS variables in globals.css instead. Theme colors added there.
3. **framer-motion v12:** All imports work normally from `'framer-motion'`; `motion` API unchanged.

---

## Design Notes

- All colors use hex literals matching spec (ivory `#F5F0E8`, rose-gold `#D4A574`, warm-black `#1C1917`, muted `#A8A29E`, dark-cta `#0F172A`)
- Placeholder images: colored CSS gradients cycling per-card index
- Vietnamese text only, no i18n setup (MVP scope)
- All component files under 200 lines

---

## Unresolved Questions

- `NEXT_PUBLIC_API_URL` env var: not set in `.env` — defaults to `http://localhost:3001` via fallback in code. Should be added to `.env.local` for production.
- `/booking` route referenced in CTAs but not yet implemented (Phase 05 presumably).
- `embla-carousel-react` installed but not used — reserved for a future carousel (hero or gallery). Can remove if not needed.
