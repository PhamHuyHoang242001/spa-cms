// doctors/[id]/page.tsx — Doctor detail page (Server Component, i18n)

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Doctor } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';
import { resolveMediaUrl } from '@/lib/media-url';
import { ArrowLeft, Star, CalendarDays } from 'lucide-react';

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

async function findDoctorById(id: string): Promise<Doctor | null> {
  const doctors = await fetchDoctors();
  return doctors.find((d) => d.id === id) ?? null;
}

type PageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'doctors' });
  const doctor = await findDoctorById(id);
  if (!doctor) return { title: t('notFound') };

  return {
    title: doctor.user.name,
    description: localizedText(doctor.bio, locale) || `${doctor.user.name} — ${localizedText(doctor.specialty, locale)}`,
  };
}

export default async function DoctorDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('doctors');
  const doctor = await findDoctorById(id);
  if (!doctor) notFound();

  const initials = doctor.user.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-sm text-[#A8A29E] hover:text-[#D4A574] transition-colors mb-8"
        >
          <ArrowLeft size={14} /> {t('allDoctors')}
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0 overflow-hidden"
              style={doctor.avatarUrl ? undefined : { background: 'linear-gradient(135deg, #667eea 0%, #D4A574 100%)' }}
            >
              {doctor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaUrl(doctor.avatarUrl)} alt={doctor.user.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="flex-1">
              <h1
                className="text-2xl md:text-3xl font-bold text-[#1C1917] mb-1"
                style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
              >
                {doctor.user.name}
              </h1>
              <p className="text-[#D4A574] font-semibold mb-3">
                {localizedText(doctor.specialty, locale)}
              </p>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-[#D4A574] fill-[#D4A574]" />
                <span className="text-sm text-[#A8A29E]">
                  {t('yearsExp', { years: doctor.yearsExp })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-sm font-semibold text-[#1C1917] uppercase tracking-wider mb-4">
            {t('about')}
          </h2>
          <p className="text-[#A8A29E] leading-relaxed">
            {localizedText(doctor.bio, locale) || t('noInfo')}
          </p>
        </div>

        {/* Specialties */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-sm font-semibold text-[#1C1917] uppercase tracking-wider mb-4">
            {t('specialties')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {localizedText(doctor.specialty, locale).split(',').filter(Boolean).map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 bg-[#F5F0E8] rounded-full text-xs text-[#1C1917] font-medium"
              >
                {s.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/booking?doctorId=${doctor.id}`}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0F172A] text-white font-semibold text-sm hover:bg-[#D4A574] transition-colors"
        >
          <CalendarDays size={16} />
          {t('bookWithDoctor')}
        </Link>
      </div>
    </div>
  );
}
