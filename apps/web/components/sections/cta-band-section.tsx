// cta-band-section.tsx — Final cinematic conversion band
'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function CtaBandSection() {
  const t = useTranslations('cta');
  const tNav = useTranslations('nav');

  return (
    <section className="relative overflow-hidden bg-[#050403] px-6 py-24 text-white kb-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(212,165,116,0.18),transparent_30%),linear-gradient(115deg,rgba(212,165,116,0.16),transparent_34%,rgba(183,110,121,0.10)_70%,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#D4A574,transparent)]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mx-auto flex flex-col items-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#D4A574]/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#F4CFA3] backdrop-blur-xl">
            <Sparkles size={14} />
            {t('title')}
          </p>
          <h2
            className="mt-6 max-w-4xl text-4xl font-black leading-none md:text-7xl"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            {t('title')}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C9C0B7]">
            {t('subtitle')}
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/booking"
              className="kb-shimmer kb-magnetic inline-flex items-center justify-center gap-3 rounded-full bg-[#D4A574] px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#120E0B] shadow-[0_18px_70px_rgba(212,165,116,0.42)] transition-transform hover:scale-[1.04]"
            >
              {t('button')} <ArrowRight size={17} />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white backdrop-blur-xl transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              {tNav('services')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
