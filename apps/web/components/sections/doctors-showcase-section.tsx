// doctors-showcase-section.tsx — Premium doctor carousel cards
'use client';

import { ArrowRight, Award, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { Doctor } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';
import { resolveMediaUrl } from '@/lib/media-url';

interface Props {
  doctors: Doctor[];
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #172033 0%, #D4A574 100%)',
  'linear-gradient(135deg, #3d2b25 0%, #B76E79 100%)',
  'linear-gradient(135deg, #0b2c33 0%, #D4A574 100%)',
  'linear-gradient(135deg, #211f1b 0%, #6f8f8d 100%)',
];

function DoctorCard({ doctor, index }: { doctor: Doctor; index: number }) {
  const t = useTranslations('doctors');
  const locale = useLocale();

  const initials = doctor.user.name
    .split(' ')
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/doctors/${doctor.id}`}
      className="group relative min-w-[280px] overflow-hidden rounded-3xl border border-[#E8DDD4] bg-white p-5 shadow-sm transition-transform hover:-translate-y-1"
    >
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(110deg,#1C1917,#3d2b25,#D4A574)]" />

      <div className="relative">
        <div
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white text-xl font-black text-white shadow-xl"
          style={doctor.avatarUrl ? undefined : { background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] }}
        >
          {doctor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(doctor.avatarUrl)} alt={doctor.user.name} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-[#1C1917]">{doctor.user.name}</h3>
            <p className="mt-1 text-sm font-semibold text-[#B76E79]">
              {localizedText(doctor.specialty, locale)}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F0E8] text-[#D4A574] transition-colors group-hover:bg-[#1C1917]">
            <Award size={17} />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#F5F0E8] p-3">
            <Star size={14} className="fill-[#D4A574] text-[#D4A574]" />
            <p className="mt-2 text-xs font-bold text-[#1C1917]">
              {t('yearsExp', { years: doctor.yearsExp })}
            </p>
          </div>
          <div className="rounded-2xl bg-[#1C1917] p-3 text-white">
            <Award size={14} className="text-[#D4A574]" />
            <p className="mt-2 text-xs font-bold">{t('teamLabel')}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#E8DDD4] pt-4 text-xs font-black uppercase tracking-[0.16em] text-[#1C1917]">
          {t('viewProfile')}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export function DoctorsShowcaseSection({ doctors }: Props) {
  const t = useTranslations('doctors');

  return (
    <section className="relative overflow-hidden bg-[#0b0a09] px-6 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(183,110,121,0.12),transparent_30%),linear-gradient(120deg,rgba(212,165,116,0.14),transparent_38%,rgba(111,143,141,0.10)_72%,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#D4A574,transparent)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#D4A574]">
              {t('sectionTitle')}
            </p>
            <h2
              className="mt-3 max-w-3xl text-4xl font-black leading-none md:text-6xl"
              style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
            >
              {t('heroTitle')}
            </h2>
          </div>
          <Link
            href="/doctors"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-xl transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
          >
            {t('allDoctors')} <ArrowRight size={15} />
          </Link>
        </div>

        {doctors.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-5 [scrollbar-width:none] kb-edge-fade">
            {doctors.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-[#C9C0B7]">{t('pageDescription')}</p>
        )}
      </div>
    </section>
  );
}
