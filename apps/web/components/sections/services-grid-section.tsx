// services-grid-section.tsx — High-impact featured services section
'use client';

import { ArrowRight, CalendarDays, Clock, WandSparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import type { Service } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';
import { resolveMediaUrl } from '@/lib/media-url';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #111827 0%, #D4A574 100%)',
  'linear-gradient(135deg, #3d2b25 0%, #c76f54 100%)',
  'linear-gradient(135deg, #0f172a 0%, #6f8f8d 100%)',
  'linear-gradient(135deg, #261711 0%, #d9b36f 100%)',
  'linear-gradient(135deg, #14213d 0%, #e8c07d 100%)',
  'linear-gradient(135deg, #211f1b 0%, #a35d68 100%)',
];

interface Props {
  services: Service[];
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const t = useTranslations('services');
  const locale = useLocale();
  const router = useRouter();

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group kb-card-tilt kb-glass-card relative block min-h-[390px] overflow-hidden rounded-3xl border border-white/20 bg-[#15110f] text-white shadow-lg"
    >
      <div
        className="absolute inset-0"
        style={service.coverUrl ? undefined : { background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }}
      >
        {service.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(service.coverUrl)}
            alt={localizedText(service.name, locale)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(8,7,6,0.34)_45%,rgba(8,7,6,0.92)_100%)]" />
      </div>

      <div className="relative z-10 flex h-full min-h-[390px] flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl">
            {t('featured')}
          </span>
          <span className="rounded-full bg-[#D4A574] px-3 py-1.5 text-xs font-black text-[#16110e]">
            0{index + 1}
          </span>
        </div>

        <div>
          <h3
            className="max-w-[16rem] text-2xl font-black leading-tight transition-transform duration-500 group-hover:-translate-y-1"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            {localizedText(service.name, locale)}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#DDD6CE]">
            {localizedText(service.description, locale)}
          </p>

          <div className="mt-6 flex items-end justify-between border-t border-white/12 pt-5">
            <div>
              <span className="block text-2xl font-black text-[#F4CFA3]">
                {service.priceVnd.toLocaleString('vi-VN')}đ
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-[#C9C0B7]">
                <Clock size={12} />
                {t('duration', { min: service.durationMin })}
              </span>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/booking?service=${service.slug}`);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/booking?service=${service.slug}`);
                }
              }}
              className="relative z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold transition-all hover:bg-[#D4A574] hover:text-[#16110e]"
            >
              <CalendarDays size={14} />
              {t('bookNow')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ServicesGridSection({ services }: Props) {
  const t = useTranslations('services');
  const featured = services.slice(0, 6);

  return (
    <section className="relative overflow-hidden px-6 py-24 kb-spotlight">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#D4A574,transparent)]" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="kb-reveal max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.32em] text-[#B76E79]">
              <WandSparkles size={15} />
              {t('sectionTitle')}
            </p>
            <h2
              className="mt-3 text-4xl font-black leading-none text-[#1C1917] md:text-6xl"
              style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
            >
              {t('homeHeading')}
            </h2>
          </div>
          <Link
            href="/services"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#1C1917]/20 bg-white/60 px-5 py-3 text-sm font-bold text-[#1C1917] backdrop-blur-xl transition-colors hover:border-[#D4A574] hover:bg-[#1C1917] hover:text-white"
          >
            {t('viewAll')} <ArrowRight size={15} />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-[#6b4c41]">{t('pageDescription')}</p>
        )}
      </div>
    </section>
  );
}
