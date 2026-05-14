'use client';

// locale-switcher.tsx — Toggle between Vietnamese and Korean locales

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const next = locale === 'vi' ? 'ko' : 'vi';
    router.replace(pathname, { locale: next });
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D4A574]/40 bg-white/10 text-xs font-bold text-current hover:bg-[#D4A574]/15 transition-colors"
      aria-label={locale === 'vi' ? '한국어로 전환' : 'Chuyển sang tiếng Việt'}
    >
      {locale === 'vi' ? '🇰🇷 한국어' : '🇻🇳 Tiếng Việt'}
    </button>
  );
}
