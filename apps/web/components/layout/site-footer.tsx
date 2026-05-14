'use client';

// site-footer.tsx — Footer with address, hours, social links, copyright (i18n)

import { MapPin, Clock, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function SiteFooter() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="relative mt-auto overflow-hidden bg-[#080706] text-[#A8A29E] kb-noise">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(212,165,116,0.16),transparent_34%,rgba(183,110,121,0.10)_74%,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#D4A574,transparent)]" />
      <div className="relative max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <span
            className="text-white font-black tracking-[0.22em] text-sm uppercase"
            style={{ fontFamily: '"Noto Serif KR", serif' }}
          >
            K-Beauty Spa
          </span>
          <p className="text-sm leading-relaxed text-white/60">{t('description')}</p>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3 text-sm">
          <span className="text-white font-semibold text-xs uppercase tracking-wider mb-1">
            {t('contact')}
          </span>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#D4A574]" />
            <span>{t('address')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="shrink-0 text-[#D4A574]" />
            <a href="tel:+84901234567" className="hover:text-[#D4A574] transition-colors">
              {t('phone')}
            </a>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={14} className="mt-0.5 shrink-0 text-[#D4A574]" />
            <span>{t('hours')}</span>
          </div>
        </div>

        {/* Social + nav */}
        <div className="flex flex-col gap-3 text-sm">
          <span className="text-white font-semibold text-xs uppercase tracking-wider mb-1">
            {t('follow')}
          </span>
          <div className="flex gap-4">
            <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A574] transition-colors font-medium" aria-label="Zalo">Zalo</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A574] transition-colors font-medium" aria-label="Facebook">Facebook</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A574] transition-colors font-medium" aria-label="Instagram">Instagram</a>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Link href="/services" className="hover:text-[#D4A574] transition-colors">{nav('services')}</Link>
            <Link href="/doctors" className="hover:text-[#D4A574] transition-colors">{nav('doctors')}</Link>
            <Link href="/booking" className="hover:text-[#D4A574] transition-colors">{nav('booking')}</Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 py-4 text-center text-xs text-[#A8A29E]/60">
        {t('copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
