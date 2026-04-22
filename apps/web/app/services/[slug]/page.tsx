// services/[slug]/page.tsx — Service detail page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Service } from '@/lib/api-types';
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

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await findServiceBySlug(slug);
  if (!service) return { title: 'Không tìm thấy dịch vụ' };

  return {
    title: service.name.vi,
    description: service.description?.vi ?? '',
    openGraph: {
      title: `${service.name.vi} — K-Beauty Spa`,
      description: service.description?.vi ?? '',
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await findServiceBySlug(slug);
  if (!service) notFound();

  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-sm text-[#A8A29E] hover:text-[#D4A574] transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Tất cả dịch vụ
        </Link>

        {/* Hero image placeholder */}
        <div
          className="w-full h-64 rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #D4A574 100%)',
          }}
        />

        {/* Meta badges */}
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-[#D4A574] border border-[#D4A574]/30">
            {service.price.toLocaleString('vi-VN')}đ
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs text-[#A8A29E] border border-[#A8A29E]/20">
            <Clock size={11} /> {service.duration} phút
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
          {service.name.vi}
        </h1>

        {/* Description */}
        <p className="text-[#A8A29E] leading-relaxed text-base mb-8">
          {service.description?.vi ?? 'Đang cập nhật mô tả dịch vụ.'}
        </p>

        {/* Gallery placeholder */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-[#1C1917] uppercase tracking-wider mb-4">
            Hình Ảnh
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            ].map((bg, i) => (
              <div
                key={i}
                className="h-28 rounded-xl"
                style={{ background: bg }}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/booking?serviceId=${service.id}`}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0F172A] text-white font-semibold text-sm hover:bg-[#D4A574] transition-colors"
        >
          <CalendarDays size={16} />
          Đặt lịch với gói này
        </Link>
      </div>
    </div>
  );
}
