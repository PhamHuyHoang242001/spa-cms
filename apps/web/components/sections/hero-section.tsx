// hero-section.tsx — Cinematic first viewport with generated visual asset
'use client';

import { ArrowRight, CalendarCheck, Sparkles, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

const HERO_IMAGE = '/images/kbeauty-cinematic-hero.png';

export function HeroSection() {
  const t = useTranslations('hero');
  const tNav = useTranslations('nav');

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050403] text-white kb-noise kb-hero-stage">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover object-center opacity-90"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(244,207,163,0.15),transparent_30%),linear-gradient(90deg,rgba(5,4,3,0.96)_0%,rgba(8,7,6,0.82)_36%,rgba(8,7,6,0.34)_68%,rgba(8,7,6,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,6,0.42)_0%,transparent_34%,rgba(8,7,6,0.94)_100%)]" />
        <div className="kb-laser-grid opacity-25" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16">
        <div className="max-w-3xl">
          <div className="kb-reveal inline-flex items-center gap-2 rounded-full border border-[#D4A574]/30 bg-white/[0.07] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F4CFA3] shadow-[0_0_35px_rgba(212,165,116,0.14)] backdrop-blur-xl">
            <Sparkles size={14} />
            Seoul Standard · Skin Tech Lab
          </div>

          <h1
            className="kb-reveal kb-reveal-delay-1 mt-7 max-w-4xl text-5xl font-black leading-[0.93] text-white sm:text-6xl lg:text-7xl"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            <span className="block">{t('title')}</span>
            <span className="kb-aurora-text mt-2 block bg-[linear-gradient(90deg,#FFFFFF_0%,#F8D9AE_36%,#D4A574_62%,#B76E79_100%)] bg-clip-text text-transparent">
              Glow Lab
            </span>
          </h1>

          <p className="kb-reveal kb-reveal-delay-2 mt-7 max-w-2xl text-base leading-8 text-[#DDD6CE] sm:text-lg">
            {t('subtitle')} · {t('subline')}
          </p>

          <div className="kb-reveal kb-reveal-delay-3 mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/booking"
              className="kb-shimmer kb-magnetic group inline-flex items-center justify-center gap-3 rounded-full bg-[#D4A574] px-7 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-[#120E0B] shadow-[0_18px_70px_rgba(212,165,116,0.44)] transition-transform hover:scale-[1.04]"
            >
              {t('cta')}
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/25 bg-white/[0.06] px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white backdrop-blur-xl transition-colors hover:border-[#D4A574] hover:bg-[#D4A574]/10 hover:text-[#F4CFA3]"
            >
              {tNav('services')}
              <Zap size={16} />
            </Link>
          </div>

          <div className="kb-reveal kb-reveal-delay-3 mt-12 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] shadow-xl backdrop-blur-xl">
            {[
              [t('stat1Value'), t('stat1Label')],
              [t('stat2Value'), t('stat2Label')],
              [t('stat3Value'), t('stat3Label')],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/10 px-4 py-4 last:border-r-0">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#BFB7AE]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden min-h-[560px] lg:block">
          <div className="absolute right-12 top-16 h-[440px] w-[440px] rounded-full border border-[#D4A574]/18" style={{ animation: 'kb-float 7s ease-in-out infinite' }} />
          <div className="absolute bottom-20 right-4 w-96 rounded-3xl border border-white/15 bg-[#120F0D]/70 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl kb-card-tilt">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4A574] text-[#120E0B]">
                <CalendarCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4CFA3]">{t('liveTitle')}</p>
                <p className="mt-1 text-sm text-[#DDD6CE]">{t('liveBody')}</p>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-[linear-gradient(90deg,#D4A574,#FFFFFF,#D4A574)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1C1917] to-transparent" />
    </section>
  );
}
