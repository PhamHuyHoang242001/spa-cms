# Phase 04 — Landing Marketing (Home + Services + Doctors + i18n)

**Priority:** High | **Status:** completed | **Est:** 3d | **Depends:** 00 (có thể chạy song song 02)

## Overview
Premium minimal K-beauty landing. Hero cinematic nhẹ, scroll reveal Framer Motion, i18n vi/ko qua next-intl. Pages: `/`, `/services`, `/services/[slug]`, `/doctors`, `/doctors/[slug]`, `/about`, `/contact`.

## Design System

**Palette (default, replaceable khi có brand kit):**
- Primary: `#F5F0E8` (ivory)
- Accent: `#D4A574` (rose gold)
- Text: `#1C1917` (warm black)
- Muted: `#A8A29E`
- CTA: `#0F172A` với rose-gold hover

**Fonts:**
- Display: Noto Serif KR (vi+ko support)
- Body: Inter

**Motion budget:** enter animations only, duration 400-700ms, ease-out. Respect `prefers-reduced-motion`. No heavy WebGL.

## Pages & Sections

### `/` Home
1. **Hero** (100vh): video bg looping (opacity 0.85), headline fade-in + split-word stagger, tagline, CTA "Đặt lịch ngay" → `/booking`. Secondary CTA scroll down.
2. **Trust bar**: 5-6 logos (certifications), grayscale → color on viewport enter.
3. **Services featured** (6 cards): grid 3x2, hover scale 1.02 + soft shadow. Link `/services/[slug]`.
4. **Doctor showcase**: Embla carousel, portrait photo, specialty badge, CTA "Xem hồ sơ".
5. **Process timeline** (5 steps): Consultation → Skin analysis → Treatment → Aftercare → Follow-up. Scroll-triggered icon+text reveal.
6. **Testimonials** + before/after slider (3 items).
7. **Blog latest 3**: cards, hover image zoom.
8. **CTA band**: dark section, "Sẵn sàng trải nghiệm làn da Hàn?"
9. **Footer**: Zalo/FB/IG, address + map placeholder, hours, newsletter input (stub).

### `/services` + `/services/[slug]`
- Listing: grid with filter (by featured). 
- Detail: hero image, i18n name/description, price, duration, gallery, "Đặt lịch với gói này" CTA (passes serviceId).

### `/doctors` + `/doctors/[slug]`
- Grid cards với avatar + specialty.
- Detail: bio, specialty, years exp, "Đặt lịch với bác sĩ này" CTA.

## i18n Setup (next-intl)

```
apps/web/
├── i18n.ts                 # request config
├── middleware.ts           # locale routing
├── messages/
│   ├── vi.json
│   └── ko.json
└── app/[locale]/
    ├── layout.tsx          # NextIntlClientProvider
    ├── page.tsx            # home
    ├── services/...
    └── doctors/...
```

- `defaultLocale: 'vi'`, `locales: ['vi','ko']`.
- Locale switcher component trong header (Dropdown + flag).
- Persist via cookie `NEXT_LOCALE`.
- Content i18n (services, doctor bio) đọc từ API JSON column, pick theo `locale`.

## Files to Create

- `apps/web/app/[locale]/layout.tsx`, `page.tsx` + section components
- `apps/web/components/sections/{hero,trust-bar,services-grid,doctor-showcase,process-timeline,testimonials,blog-latest,cta-band,footer}.tsx`
- `apps/web/components/ui/*` — init shadcn: button, card, carousel, dialog, input, dropdown
- `apps/web/components/locale-switcher.tsx`
- `apps/web/components/site-header.tsx` + `site-footer.tsx`
- `apps/web/lib/motion.ts` — reusable variants
- `apps/web/app/[locale]/services/page.tsx` + `[slug]/page.tsx`
- `apps/web/app/[locale]/doctors/page.tsx` + `[slug]/page.tsx`
- `apps/web/messages/vi.json` + `ko.json`
- `apps/web/i18n.ts` + `middleware.ts`
- `apps/web/public/videos/hero.mp4` (placeholder until brand video)

## Implementation Steps

1. Install: `next-intl framer-motion embla-carousel-react lucide-react class-variance-authority clsx tailwind-merge`.
2. `pnpm dlx shadcn@latest init` — accept defaults, New York style.
3. Add `next-intl` middleware + i18n request config per docs.
4. Wrap layout với `<NextIntlClientProvider messages={messages}>`.
5. Build header/footer first (shared across pages).
6. Home sections: each component SSR-rendered, use `'use client'` chỉ khi cần motion/interaction.
7. Motion: `<motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}}>`.
8. Hero video: `<video autoPlay muted loop playsInline poster="...">`, lazy với Intersection Observer nếu cần.
9. Fetch services/doctors from API (Server Component, use `fetch` với revalidate 300).
10. Services/doctors detail pages use `generateStaticParams` + ISR.
11. SEO: `generateMetadata` per page với OG image, canonical, alternates cho vi/ko.
12. Lighthouse audit sau khi xong, fix top issues.

## Todo

- [x] next-intl setup (routing + messages)
- [x] shadcn init + base components
- [x] Header với nav + locale switcher + mobile menu
- [x] Footer
- [x] Home hero section với video + motion headline
- [x] Trust bar
- [x] Services featured grid (fetch from API)
- [x] Doctor showcase carousel
- [x] Process timeline with scroll reveal
- [x] Testimonials + before/after
- [x] Blog latest placeholder (phase 05 connects)
- [x] CTA band + footer
- [x] /services list + detail (i18n content render)
- [x] /doctors list + detail
- [x] SEO meta + OG images
- [x] vi + ko translation complete cho UI strings
- [x] Lighthouse ≥ 90 trên home (desktop + mobile)
- [x] Mobile responsive pass (breakpoints sm/md/lg/xl)

## Success Criteria

- Home loads < 2.5s LCP trên 3G.
- `/vi` và `/ko` switch giữ nguyên trang, dịch đầy đủ.
- Zero layout shift (CLS < 0.1).
- Mobile usable, no horizontal scroll.
- Motion respects `prefers-reduced-motion`.

## Risks

- Video bg heavy → compress + poster + lazy; fallback image nếu `data-saver`.
- Font loading flash → `next/font` with display=swap.
- next-intl v3 vs v4 API → follow latest docs (v4 introduced getRequestConfig change).

## Next Steps

Phase 06 booking flow UI reuses components (card, motion).
