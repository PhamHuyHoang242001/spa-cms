# Phase 03: i18n Setup (next-intl v4)

**Priority:** High | **Status:** Pending | **Est:** 1d | **Depends:** Phase 02

## Overview

Install and configure next-intl v4.11.0 for Next.js 16.2.4 App Router. Set up locale routing, proxy middleware, translation files, and locale layout. This phase establishes the i18n infrastructure; Phase 04 updates individual pages/components.

## Key Insights (from research)

- next-intl v4.11.0 fully supports Next.js 16.2.4
- Next.js 16 uses `proxy.ts` (not `middleware.ts`) for middleware
- `localePrefix: 'as-needed'` → `/services` for vi (default), `/ko/services` for Korean
- Cookie `NEXT_LOCALE` with 1-year maxAge for persistence
- Server Components: `getTranslations()` (async). Client Components: `useTranslations()` (hook)
- Must call `setRequestLocale(locale)` in layouts/pages for static rendering
- `generateStaticParams()` must return all locales

## Requirements

### Functional
- Locale routing: `/services` (vi default), `/ko/services`
- Language detection: URL prefix → Cookie → Accept-Language → default vi
- Locale switcher component in site header
- Translation files for all UI strings
- Persist locale choice via cookie

### Non-Functional
- No performance regression (middleware adds minimal overhead)
- SEO: correct `lang` attribute, hreflang tags
- Admin pages unaffected (stay outside `[locale]`)

## Architecture

```
apps/web/
├── proxy.ts                        # NEW: next-intl middleware
├── i18n/
│   ├── routing.ts                  # NEW: locale routing config
│   └── request.ts                  # NEW: request-level locale config
├── messages/
│   ├── vi.json                     # NEW: Vietnamese UI strings
│   └── ko.json                     # NEW: Korean UI strings
├── app/
│   ├── [locale]/                   # NEW: locale wrapper
│   │   ├── layout.tsx              # MOVED from app/layout.tsx (modified)
│   │   ├── page.tsx                # MOVED from app/page.tsx
│   │   ├── login/page.tsx          # MOVED
│   │   ├── register/page.tsx       # MOVED
│   │   ├── services/               # MOVED
│   │   ├── doctors/                # MOVED
│   │   ├── blog/                   # MOVED
│   │   ├── booking/                # MOVED
│   │   └── me/                     # MOVED
│   ├── admin/                      # STAYS (no locale prefix)
│   │   ├── layout.tsx              # Keep as-is
│   │   └── ...
│   └── layout.tsx                  # NEW: minimal root layout (html/body only)
├── components/
│   └── locale-switcher.tsx         # NEW: language toggle component
└── next.config.ts                  # MODIFIED: wrap with next-intl plugin
```

## Related Code Files

### Files to Create
- `apps/web/proxy.ts` — next-intl middleware
- `apps/web/i18n/routing.ts` — Locale routing config
- `apps/web/i18n/request.ts` — Request-level locale config
- `apps/web/messages/vi.json` — Vietnamese translations
- `apps/web/messages/ko.json` — Korean translations
- `apps/web/app/[locale]/layout.tsx` — Locale-aware root layout
- `apps/web/components/locale-switcher.tsx` — Language toggle

### Files to Modify
- `apps/web/next.config.ts` — Wrap with `createNextIntlPlugin`
- `apps/web/package.json` — Add next-intl dependency
- `apps/web/app/layout.tsx` — Simplify to minimal root (or remove, depends on structure)

### Files to Move (app/ → app/[locale]/)
- `app/page.tsx` → `app/[locale]/page.tsx`
- `app/login/` → `app/[locale]/login/`
- `app/register/` → `app/[locale]/register/`
- `app/services/` → `app/[locale]/services/`
- `app/doctors/` → `app/[locale]/doctors/`
- `app/blog/` → `app/[locale]/blog/`
- `app/booking/` → `app/[locale]/booking/`
- `app/me/` → `app/[locale]/me/`

## Implementation Steps

### Step 1: Install next-intl
```bash
cd apps/web && pnpm add next-intl
```

### Step 2: Create i18n/routing.ts
```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['vi', 'ko'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
  },
});
```

### Step 3: Create i18n/request.ts
```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### Step 4: Create proxy.ts
```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|admin|.*\\..*).*)',
};
```
Note: `admin` excluded from matcher so admin stays unprefixed.

### Step 5: Update next.config.ts
```ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  // existing config
});
```

### Step 6: Create translation files
Create `messages/vi.json` and `messages/ko.json` with keys for:
- Navigation (nav.home, nav.services, nav.doctors, nav.blog, nav.booking, nav.login, nav.register, nav.logout, nav.myBookings)
- Home page sections (hero.title, hero.subtitle, hero.cta, services.title, doctors.title, process.title, cta.title, cta.button)
- Services page (services.pageTitle, services.pageDescription, services.duration, services.price, services.bookNow)
- Doctors page (doctors.pageTitle, doctors.yearsExp, doctors.specialty)
- Blog page (blog.pageTitle, blog.readMore, blog.tags)
- Booking flow (booking.stepService, booking.stepDoctor, booking.stepSlot, booking.stepConfirm, booking.selectService, booking.selectDoctor, booking.selectSlot, booking.confirm, booking.success)
- My Bookings (myBookings.title, myBookings.upcoming, myBookings.history, myBookings.cancel, myBookings.status.*)
- Common (common.loading, common.error, common.retry, common.back, common.next, common.submit, common.cancel)
- Footer (footer.address, footer.phone, footer.hours, footer.copyright)
- Auth (auth.login, auth.register, auth.email, auth.password, auth.name, auth.phone)
- SEO metadata (metadata.home.title, metadata.home.description, metadata.services.title, etc.)

### Step 7: Move pages to [locale] directory
1. Create `app/[locale]/` directory
2. Move all public pages into `app/[locale]/`
3. Keep `app/admin/` at current location (outside locale)
4. Create new `app/[locale]/layout.tsx` with NextIntlClientProvider
5. Simplify `app/layout.tsx` to minimal root layout

### Step 8: Create locale-aware layout
```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SiteHeader />
      {children}
      <SiteFooter />
    </NextIntlClientProvider>
  );
}
```

### Step 9: Create locale switcher component
```tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button onClick={() => switchLocale(locale === 'vi' ? 'ko' : 'vi')}>
      {locale === 'vi' ? '🇰🇷 한국어' : '🇻🇳 Tiếng Việt'}
    </button>
  );
}
```

### Step 10: Verify setup
1. `pnpm dev` in web
2. Visit `http://localhost:3000` → should show Vietnamese (default)
3. Visit `http://localhost:3000/ko` → should show Korean
4. Click locale switcher → URL changes, content switches
5. `pnpm typecheck` passes

## Todo List

- [ ] Install next-intl v4
- [ ] Create i18n/routing.ts
- [ ] Create i18n/request.ts
- [ ] Create proxy.ts with admin exclusion
- [ ] Update next.config.ts with next-intl plugin
- [ ] Create messages/vi.json (~150 keys)
- [ ] Create messages/ko.json (~150 keys)
- [ ] Move public pages to app/[locale]/
- [ ] Create app/[locale]/layout.tsx with NextIntlClientProvider
- [ ] Simplify app/layout.tsx to minimal root
- [ ] Create locale-switcher component
- [ ] Add locale switcher to site-header
- [ ] Verify routing works for both locales
- [ ] Verify admin pages unaffected
- [ ] Run typecheck

## Success Criteria

- `http://localhost:3000/services` shows Vietnamese (default)
- `http://localhost:3000/ko/services` shows Korean
- Locale switcher toggles between vi/ko
- Cookie `NEXT_LOCALE` set on switch
- Admin at `/admin/*` works without locale prefix
- `pnpm typecheck` passes
- No console errors

## Risk Assessment

- **Page move breaks imports**: Relative imports may break — use `@/` path aliases
- **Admin routing conflict**: Proxy matcher excludes `/admin` — verify no redirect
- **Static rendering**: Must call `setRequestLocale()` + `generateStaticParams()` in every page/layout

## Security Considerations

- Locale input validated against `routing.locales` array — no injection risk
- Cookie `sameSite: 'lax'` prevents CSRF on locale cookie
