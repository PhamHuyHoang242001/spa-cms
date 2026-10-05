// doctors/page.tsx — All doctors listing page (Server Component, i18n)

export const dynamic = 'force-dynamic';

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Doctor } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';
import { resolveMediaUrl } from '@/lib/media-url';
import { Star, ArrowRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const res = await fetch(`${API_BASE}/doctors`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json() as Promise<Doctor[]>;
  } catch {
    return [];
  }
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('doctors.title'),
    description: t('doctors.description'),
  };
}

export default async function DoctorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('doctors');
  const doctors = await fetchDoctors();

  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            {t('teamLabel')}
          </p>
          <h1
            className="text-4xl font-bold text-[#1C1917] mb-4"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            {t('heroTitle')}
          </h1>
          <p className="text-[#A8A29E] max-w-xl mx-auto leading-relaxed">
            {t('heroDescription')}
          </p>
        </div>

        {/* Grid */}
        {doctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, i) => {
              const initials = doctor.user.name
                .split(' ')
                .slice(-2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={doctor.id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 overflow-hidden"
                    style={doctor.avatarUrl ? undefined : { background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
                  >
                    {doctor.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveMediaUrl(doctor.avatarUrl)} alt={doctor.user.name} className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>

                  <h2 className="font-semibold text-[#1C1917] text-base mb-1">
                    {doctor.user.name}
                  </h2>
                  <p className="text-[#D4A574] text-sm font-medium mb-2">
                    {localizedText(doctor.specialty, locale)}
                  </p>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star size={12} className="text-[#D4A574] fill-[#D4A574]" />
                    <span className="text-xs text-[#A8A29E]">
                      {t('yearsExp', { years: doctor.yearsExp })}
                    </span>
                  </div>
                  <p className="text-[#A8A29E] text-sm line-clamp-2 mb-4">
                    {localizedText(doctor.bio, locale)}
                  </p>

                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[#D4A574] hover:text-[#c4956a] transition-colors"
                  >
                    {t('viewProfile')} <ArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-[#A8A29E]">
            {t('emptyState')}
          </div>
        )}
      </div>
    </div>
  );
}
