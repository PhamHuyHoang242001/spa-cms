// process-timeline-section.tsx — Animated booking/treatment process
'use client';

import { Heart, MessageCircle, RefreshCw, ScanFace, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

const STEP_ICONS = [MessageCircle, ScanFace, Sparkles, Heart, RefreshCw];

export function ProcessTimelineSection() {
  const t = useTranslations('process');

  const steps = [
    { icon: STEP_ICONS[0], title: t('step1'), desc: t('step1Desc') },
    { icon: STEP_ICONS[1], title: t('step2'), desc: t('step2Desc') },
    { icon: STEP_ICONS[2], title: t('step3'), desc: t('step3Desc') },
    { icon: STEP_ICONS[3], title: t('step4'), desc: t('step4Desc') },
    { icon: STEP_ICONS[4], title: t('step5'), desc: t('step5Desc') },
  ];

  return (
    <section className="relative overflow-hidden bg-[#F8F4ED] px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,165,116,0.13),transparent_32%),linear-gradient(180deg,transparent,rgba(28,25,23,0.04))]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#B76E79]">
            {t('title')}
          </p>
          <h2
            className="mt-3 text-4xl font-black leading-none text-[#1C1917] md:text-6xl"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            {t('homeHeading')}
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-14 hidden h-px bg-[linear-gradient(90deg,transparent,#D4A574,#B76E79,#1C1917,transparent)] opacity-55 md:block" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative overflow-hidden rounded-3xl border border-[#E8DDD4] bg-white/86 p-5 text-center shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-1"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1917] shadow-[0_16px_34px_rgba(28,25,23,0.18)]">
                  <Icon size={27} className="text-[#D4A574]" />
                </div>
                <span className="absolute right-4 top-4 text-3xl font-black text-[#1C1917]/10">
                  0{index + 1}
                </span>
                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#1C1917]">
                  {step.title}
                </h3>
                <p className="mt-3 text-xs leading-6 text-[#6b4c41]">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
