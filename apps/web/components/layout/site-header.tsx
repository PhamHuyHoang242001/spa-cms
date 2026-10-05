'use client';

// site-header.tsx — Sticky top navigation with mobile hamburger menu + locale switcher
// Uses next-intl for translated labels and locale-aware Link

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { LocaleSwitcher } from '@/components/locale-switcher';

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations('nav');

  const NAV_LINKS = [
    { href: '/' as const, label: t('home') },
    { href: '/services' as const, label: t('services') },
    { href: '/doctors' as const, label: t('doctors') },
    { href: '/booking' as const, label: t('booking') },
  ];

  async function handleLogout() {
    await logout();
    router.push('/login');
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080706]/78 text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.22em]"
          style={{ fontFamily: '"Noto Serif KR", serif' }}
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#D4A574] text-[#120E0B] shadow-[0_0_30px_rgba(212,165,116,0.45)]">
            K
            <span className="absolute inset-0 rounded-full border border-[#D4A574]" style={{ animation: 'kb-pulse-ring 2.4s ease-out infinite' }} />
          </span>
          K-Beauty Spa
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative font-semibold text-white/78 transition-colors hover:text-[#F4CFA3] after:absolute after:-bottom-2 after:left-0 after:h-px after:w-0 after:bg-[#D4A574] after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth + Locale */}
        <div className="hidden md:flex items-center gap-3 text-sm">
          <LocaleSwitcher />
          {isLoading ? (
            <span className="text-[#A8A29E] text-xs">...</span>
          ) : user ? (
            <>
              <span className="text-white/80 text-sm">
                {t('greeting', { name: user.name })}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-full border border-[#D4A574] text-[#D4A574] hover:bg-[#D4A574] hover:text-[#120E0B] transition-colors text-xs font-bold"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white/78 hover:text-[#F4CFA3] transition-colors font-semibold"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#D4A574] px-4 py-2 text-xs font-black text-[#120E0B] shadow-[0_0_30px_rgba(212,165,116,0.25)] transition-transform hover:scale-105"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 hover:text-[#F4CFA3] transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#080706]/96 px-6 py-4 flex flex-col gap-4 backdrop-blur-2xl">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-white/80 hover:text-[#D4A574] transition-colors font-medium text-sm"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
            <LocaleSwitcher />
            {user ? (
              <>
                <span className="text-sm text-white/80">{t('greeting', { name: user.name })}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label={t('logout')}
                  className="text-sm text-[#D4A574] text-left font-medium hover:underline"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-white/80 font-medium">
                  {t('login')}
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="text-sm text-[#D4A574] font-semibold">
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
