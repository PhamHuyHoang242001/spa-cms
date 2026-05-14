# next-intl × Next.js 16 Compatibility Research

**Latest Version:** next-intl@4.11.0 (released 5 days ago, 2026-05-01)
**Next.js Compatibility:** Supports Next.js 16+ (confirmed v4.4+)

---

## 1. FILE STRUCTURE & SETUP CODE

### `src/i18n/routing.ts`
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['vi', 'ko', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',  // Default locale unprefixed (/services), others prefixed (/ko/services)
  // OR use 'always' for /vi/services, /ko/services everywhere
  // OR use 'never' for domain/cookie-based detection
});
```

### `src/proxy.ts` (formerly middleware.ts — updated for Next.js 16)
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

### `src/i18n/request.ts`
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = requestLocale || routing.defaultLocale;
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### `app/[locale]/layout.tsx`
```typescript
import { setRequestLocale } from 'next-intl/server';
import { ReactNode } from 'react';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### `next.config.ts`
```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  // your config
});
```

---

## 2. LOCALEPREFIX MODES EXPLAINED

| Mode | Default Locale | Other Locales | Use Case |
|------|---|---|---|
| `'as-needed'` | `/services` | `/ko/services` | **Recommended** — SEO-friendly, cleaner default URLs |
| `'always'` | `/vi/services` | `/ko/services` | Consistent prefixes everywhere |
| `'never'` | Domain/cookie-based, no prefix in URL | — | Hidden locale detection (advanced) |

**Cookie Behavior:** `NEXT_LOCALE` cookie set when user manually switches locale (not on accept-language header match). Session cookie by default (v4.0+, expires on browser close).

---

## 3. SERVER VS CLIENT COMPONENTS

### Server Components
```typescript
// Use getTranslations (async) in async Server Components
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('page');
  return <h1>{t('title')}</h1>;
}
```

### Client Components
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations('component');
  return <h1>{t('title')}</h1>;
}
```

**Key:** Server Components get `getTranslations()` (awaited); Client Components get `useTranslations()` (hook). Both use request-level caching internally. Wrap app in `NextIntlClientProvider` to enable Client Component translations.

---

## 4. GENERATEMETADATA WITH LOCALE-AWARE SEO

```typescript
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('metadata');

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      languages: {
        vi: 'https://example.com/services',      // default, no prefix
        ko: 'https://example.com/ko/services',
        en: 'https://example.com/en/services',
        'x-default': 'https://example.com/services',
      },
    },
  };
}
```

**Auto-generates hreflang tags** via alternates.languages. Must include `x-default` for search engines.

---

## 5. BREAKING CHANGES v3 → v4

1. **Type Augmentation** — Register `Messages`, `Formats`, `Locale` under `AppConfig` interface, not global scope
2. **`locale` required in getRequestConfig** — v3 optional, v4 mandatory
3. **Cookie defaults to session** — No longer persistent across browser restarts (GDPR)
4. **Cookie only on manual switch** — Not set on accept-language header match alone
5. **Requires TypeScript 5+, React 17+**

**Upgrade Path:** Upgrade to latest v3.x first, check deprecation warnings, then migrate to v4.

---

## 6. COOKIE-BASED LOCALE PERSISTENCE

```typescript
export const routing = defineRouting({
  locales: ['vi', 'ko', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 31536000,  // 1 year (customize as needed)
    sameSite: 'lax',
  },
});
```

Cookie set automatically when:
- User clicks navigation link to different locale
- Middleware detects a locale mismatch from accept-language + existing cookie

---

## 7. NEXT.JS 16 SPECIFIC ISSUES & SOLUTIONS

### Issue: `use cache` + next-intl
**Status:** Partially fixed with Next.js 16.2+

**Problem:** `'use cache'` boundary can't access headers (needed for locale detection). Link component triggers headers() call inside cache.

**Solution (Next.js 16.2+):** Use `next/root-params` to access locale without headers:
```typescript
// i18n/request.ts updated for root-params
import { getRootParams } from 'next/root-params';

export default getRequestConfig(async ({ requestLocale }) => {
  const params = getRootParams();
  const locale = params.locale || requestLocale;
  // ...
});
```

**Workaround (if <16.2):** Pass locale explicitly; avoid Link component inside `'use cache'` boundary.

### Issue: Static Rendering
**Solution:** Always call `setRequestLocale(locale)` in layouts/pages before using next-intl functions, then export `generateStaticParams()` returning all locales.

---

## 8. MINIMAL WORKING EXAMPLE

```
src/
├── i18n/
│   ├── routing.ts
│   └── request.ts
├── proxy.ts
└── app/
    └── [locale]/
        ├── layout.tsx
        └── page.tsx

messages/
├── vi.json
├── ko.json
└── en.json
```

**To detect locale:** Middleware → URL prefix → Cookie → Accept-Language → Default

---

## UNRESOLVED QUESTIONS

1. Does next-intl v4.11.0 fully support Next.js 16's `getSearchParams()` root param without custom workarounds?
2. Any performance metrics for `'as-needed'` vs `'always'` prefix modes with large locale lists?
3. Does the `Link` component fully work inside `'use cache'` blocks in Next.js 16.2+, or still requires explicit locale prop?

---

## SOURCES

- [next-intl v4.0 Release](https://next-intl.dev/blog/next-intl-4-0)
- [App Router Setup Guide](https://next-intl.dev/docs/getting-started/app-router)
- [Routing Configuration](https://next-intl.dev/docs/routing/configuration)
- [Proxy/Middleware Setup](https://next-intl.dev/docs/routing/middleware)
- [Locale-Based Routing Setup](https://next-intl.dev/docs/routing/setup)
- [Server & Client Components](https://next-intl.dev/docs/environments/server-client-components)
- [Implementing Next.js 16 'use cache' with next-intl](https://aurorascharff.no/posts/implementing-nextjs-16-use-cache-with-next-intl-internationalization/)
- [Next.js Canonical Tags & Hreflang](https://www.buildwithmatija.com/blog/nextjs-advanced-seo-multilingual-canonical-tags)
- [Upgrading Next.js to Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
