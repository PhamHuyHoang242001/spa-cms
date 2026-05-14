import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

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

// Locale-aware navigation helpers for Client Components
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
