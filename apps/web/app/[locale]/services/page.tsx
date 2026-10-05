// services/page.tsx — All services listing page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';

import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import type { Service } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';
import { resolveMediaUrl } from '@/lib/media-url';
import { Clock, ArrowRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch(`${API_BASE}/services`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json() as Promise<Service[]>;
  } catch {
    return [];
  }
}

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.services' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'services' });
  const services = await fetchServices();

  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            {t('pageTitle')}
          </p>
          <h1
            className="text-4xl font-bold text-[#1C1917] mb-4"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            {t('pageTitle')}
          </h1>
          <p className="text-[#A8A29E] max-w-xl mx-auto leading-relaxed">
            {t('pageDescription')}
          </p>
        </div>

        {/* Grid */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Clickable area → service detail */}
                <Link href={`/services/${service.slug}`} className="block">
                  <div
                    className="h-44 w-full overflow-hidden"
                    style={service.coverUrl ? undefined : { background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                  >
                    {service.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(service.coverUrl)}
                        alt={localizedText(service.name, locale)}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="px-5 pt-5 pb-2">
                    <h2 className="font-semibold text-[#1C1917] text-base mb-1 line-clamp-1">
                      {localizedText(service.name, locale)}
                    </h2>
                    <p className="text-[#A8A29E] text-sm line-clamp-2">
                      {localizedText(service.description, locale)}
                    </p>
                  </div>
                </Link>
                {/* Price + Book Now → booking with autofill */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#D4A574] font-bold text-sm">
                      {service.priceVnd.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#A8A29E]">
                      <Clock size={11} />
                      {t('duration', { min: service.durationMin })}
                    </span>
                  </div>
                  <Link
                    href={`/booking?service=${service.slug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[#D4A574] hover:text-[#c4956a] transition-colors"
                  >
                    {t('bookNow')} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-[#A8A29E]">
            {t('pageDescription')}
          </div>
        )}
      </div>
    </div>
  );
}
