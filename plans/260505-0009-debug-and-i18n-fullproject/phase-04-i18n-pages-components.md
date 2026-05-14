# Phase 04: i18n Pages & Components Update

**Priority:** High | **Status:** Pending | **Est:** 1d | **Depends:** Phase 03

## Overview

Update all public pages and components to use next-intl translations for UI strings and locale-aware rendering for DB content (`service.name[locale]` instead of `service.name.vi`). Admin pages stay Vietnamese but content editor gets vi/ko tabs.

## Key Insights

- All DB content already stored as `{ vi, ko }` JSON — just need to read correct field
- Server Components use `getTranslations()` (async), Client Components use `useTranslations()` (hook)
- Every page/layout must call `setRequestLocale(locale)` for static rendering
- Dynamic content pages need `locale` from params to select language
- Locale switcher already created in Phase 03

## Requirements

### Functional
- All hardcoded Vietnamese text replaced with translation keys
- Dynamic content (services, doctors, articles) renders in current locale
- Booking flow fully translated
- My Bookings dashboard translated
- Auth pages (login, register) translated
- Site header/footer translated
- SEO metadata per locale (title, description, hreflang)

### Non-Functional
- No performance regression from translation lookups
- Consistent translation key naming convention
- Fallback to `vi` if `ko` translation missing in DB content

## Related Code Files

### Pages to Update (Server Components — use getTranslations)
- `apps/web/app/[locale]/page.tsx` — Home page
- `apps/web/app/[locale]/services/page.tsx` — Services list
- `apps/web/app/[locale]/services/[slug]/page.tsx` — Service detail
- `apps/web/app/[locale]/doctors/page.tsx` — Doctors list (if exists)
- `apps/web/app/[locale]/doctors/[id]/page.tsx` — Doctor detail (if exists)
- `apps/web/app/[locale]/blog/page.tsx` — Blog list
- `apps/web/app/[locale]/blog/[slug]/page.tsx` — Article detail
- `apps/web/app/[locale]/login/page.tsx` — Login
- `apps/web/app/[locale]/register/page.tsx` — Register

### Components to Update (Client Components — use useTranslations)
- `apps/web/components/layout/site-header.tsx` — Nav labels
- `apps/web/components/layout/site-footer.tsx` — Footer text
- `apps/web/components/sections/hero-section.tsx` — Hero headline, subtitle, CTA
- `apps/web/components/sections/services-grid-section.tsx` — Service names, descriptions
- `apps/web/components/sections/doctors-showcase-section.tsx` — Doctor info
- `apps/web/components/sections/process-timeline-section.tsx` — Process steps
- `apps/web/components/sections/cta-band-section.tsx` — CTA text
- `apps/web/components/booking/step-service.tsx` — Service selection labels
- `apps/web/components/booking/step-doctor.tsx` — Doctor selection labels
- `apps/web/components/booking/step-slot.tsx` — Slot picker labels
- `apps/web/components/booking/step-confirm.tsx` — Confirmation labels
- `apps/web/components/booking/step-success.tsx` — Success message
- `apps/web/components/booking/date-strip.tsx` — Date labels
- `apps/web/app/me/bookings/page.tsx` → `apps/web/app/[locale]/me/bookings/page.tsx` — Dashboard labels

### Admin Content Editor (vi/ko tabs)
- `apps/web/app/admin/services/page.tsx` — Service form with vi/ko name/description
- `apps/web/app/admin/doctors/page.tsx` — Doctor form with vi/ko specialty/bio
- `apps/web/app/admin/articles/page.tsx` — Article editor with vi/ko title/content

## Implementation Steps

### Step 1: Create locale helper for DB content
```ts
// apps/web/lib/locale-content.ts
export function localizedText(
  field: { vi: string; ko: string } | string | null | undefined,
  locale: string
): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[locale as keyof typeof field] || field.vi || '';
}
```

### Step 2: Update Server Component pages
For each page that fetches data from API:
1. Get locale from params: `const { locale } = await params;`
2. Call `setRequestLocale(locale);`
3. Get translations: `const t = await getTranslations('pageName');`
4. Replace hardcoded text: `t('key')`
5. Replace `.vi` access: `localizedText(service.name, locale)`
6. Add `generateMetadata` with translated title/description + hreflang

**Example pattern for services page:**
```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localizedText } from '@/lib/locale-content';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { title: t('services.title'), description: t('services.description') };
}

export default async function ServicesPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('services');
  const services = await fetchServices();

  return (
    <div>
      <h1>{t('pageTitle')}</h1>
      {services.map(s => (
        <div key={s.id}>
          <h2>{localizedText(s.name, locale)}</h2>
          <p>{localizedText(s.description, locale)}</p>
          <span>{s.priceVnd.toLocaleString()} VND</span>
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Update Client Components
For each client component:
1. Add `useTranslations('namespace')` hook
2. Replace hardcoded text with `t('key')`
3. For DB content, accept `locale` as prop from parent Server Component
4. Use `localizedText(field, locale)` for dynamic content

**Example for booking step-service:**
```tsx
'use client';
import { useTranslations } from 'next-intl';
import { localizedText } from '@/lib/locale-content';

export function StepService({ locale, ...props }) {
  const t = useTranslations('booking');

  return (
    <div>
      <h2>{t('selectService')}</h2>
      {services.map(s => (
        <button key={s.id}>
          {localizedText(s.name, locale)}
        </button>
      ))}
    </div>
  );
}
```

### Step 4: Update site header with locale switcher
1. Import LocaleSwitcher component (from Phase 03)
2. Add to header nav, beside login/user menu
3. Translate nav labels using `useTranslations('nav')`

### Step 5: Update site footer
1. Translate footer text (address, phone, hours, copyright)
2. Use `useTranslations('footer')` hook

### Step 6: Update home page sections
Each section component:
1. Hero: translate headline, subtitle, CTA button
2. Services grid: `localizedText(service.name, locale)`, `localizedText(service.description, locale)`
3. Doctors showcase: `localizedText(doctor.specialty, locale)`, `localizedText(doctor.bio, locale)`
4. Process timeline: translate step labels
5. CTA band: translate heading, button

### Step 7: Update booking flow
All 5 steps need locale-aware rendering:
1. Pass `locale` prop from booking page to each step component
2. Translate labels (step titles, button text, instructions)
3. Use `localizedText()` for service names, doctor info
4. Date formatting: use locale-specific format (vi: DD/MM/YYYY, ko: YYYY년 MM월 DD일)

### Step 8: Update my-bookings dashboard
1. Translate tab labels, status labels, action buttons
2. Use `localizedText()` for service names, doctor info in booking cards
3. Translate cancel dialog text

### Step 9: Update auth pages
1. Login page: translate form labels, button, links
2. Register page: translate form labels, validation messages, button

### Step 10: Admin content editor vi/ko tabs
1. Add tab toggle (Tiếng Việt | 한국어) to service/doctor/article forms
2. When creating/editing, show input fields for both vi and ko
3. Save as `{ vi: "...", ko: "..." }` JSON to API
4. Admin UI labels remain Vietnamese

### Step 11: Add SEO metadata
For every page, add:
```tsx
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('pageName.title'),
    description: t('pageName.description'),
    alternates: {
      languages: {
        vi: '/path',
        ko: '/ko/path',
        'x-default': '/path',
      },
    },
  };
}
```

## Todo List

- [ ] Create locale-content.ts helper
- [ ] Update home page (page.tsx + 5 section components)
- [ ] Update services pages (list + detail)
- [ ] Update doctors pages (list + detail)
- [ ] Update blog pages (list + detail)
- [ ] Update booking flow (5 step components + main page)
- [ ] Update my-bookings dashboard
- [ ] Update auth pages (login + register)
- [ ] Update site-header with translations + locale switcher
- [ ] Update site-footer with translations
- [ ] Add SEO generateMetadata to all pages
- [ ] Add vi/ko tabs to admin service editor
- [ ] Add vi/ko tabs to admin doctor editor
- [ ] Add vi/ko tabs to admin article editor
- [ ] Test all pages in vi locale
- [ ] Test all pages in ko locale
- [ ] Run typecheck

## Success Criteria

- All public pages show translated UI strings
- Dynamic content (services, doctors, articles) renders in current locale
- Switching locale changes all visible text
- Booking flow fully functional in both locales
- Admin forms have vi/ko input tabs
- SEO metadata correct per locale
- `pnpm typecheck` passes

## Risk Assessment

- **Missing translation keys**: Will show raw key — use consistent naming, test both locales
- **Prop drilling locale**: Many components need locale — consider React context or useLocale() hook
- **Date formatting**: Korean date format differs from Vietnamese — use Intl.DateTimeFormat with locale
- **Tiptap content**: Article body stored as Tiptap JSON per locale — ensure correct locale renders
