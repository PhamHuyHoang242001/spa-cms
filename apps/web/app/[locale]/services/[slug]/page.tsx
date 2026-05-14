// services/[slug]/page.tsx — Service detail page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';

import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Service } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';
import { resolveMediaUrl } from '@/lib/media-url';
import { Clock, ArrowLeft, CalendarDays } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch(`${API_BASE}/services`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json() as Promise<Service[]>;
  } catch {
    return [];
  }
}

async function findServiceBySlug(slug: string): Promise<Service | null> {
  const services = await fetchServices();
  return services.find((s) => s.slug === slug) ?? null;
}

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await findServiceBySlug(slug);
  if (!service) return { title: 'Not found' };

  const name = localizedText(service.name, locale);
  const description = localizedText(service.description, locale);

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} — K-Beauty Spa`,
      description,
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'services' });
  const service = await findServiceBySlug(slug);
  if (!service) notFound();

  const name = localizedText(service.name, locale);
  const description = localizedText(service.description, locale);

  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-sm text-[#A8A29E] hover:text-[#D4A574] transition-colors mb-8"
        >
          <ArrowLeft size={14} /> {t('pageTitle')}
        </Link>

        <div className="w-full h-72 rounded-2xl mb-8 overflow-hidden bg-[#D4A574]/20">
          {service.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(service.coverUrl)} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#667eea_0%,#D4A574_100%)]" />
          )}
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-[#D4A574] border border-[#D4A574]/30">
            {service.priceVnd.toLocaleString('vi-VN')}đ
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs text-[#A8A29E] border border-[#A8A29E]/20">
            <Clock size={11} /> {t('duration', { min: service.durationMin })}
          </span>
          {service.category && (
            <span className="px-3 py-1.5 bg-white rounded-full text-xs text-[#A8A29E] border border-[#A8A29E]/20 capitalize">
              {service.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-3xl md:text-4xl font-bold text-[#1C1917] mb-4"
          style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
        >
          {name}
        </h1>

        {/* Description */}
        <p className="text-[#A8A29E] leading-relaxed text-base mb-8">
          {description || t('pageDescription')}
        </p>

        {/* Gallery placeholder */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-[#1C1917] uppercase tracking-wider mb-4">
            {t('featured')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {(service.gallery?.length ? service.gallery : [service.coverUrl].filter(Boolean)).slice(0, 3).map((url, i) => (
              <div key={`${url}-${i}`} className="h-28 rounded-xl overflow-hidden bg-[#D4A574]/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveMediaUrl(url as string)} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/booking?service=${service.slug}`}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0F172A] text-white font-semibold text-sm hover:bg-[#D4A574] transition-colors"
        >
          <CalendarDays size={16} />
          {t('bookNow')}
        </Link>
      </div>
    </div>
  );
}
