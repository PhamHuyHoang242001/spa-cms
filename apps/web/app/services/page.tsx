// services/page.tsx — All services listing page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import type { Service } from '@/lib/api-types';
import { Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dịch Vụ',
  description:
    'Khám phá đầy đủ các dịch vụ chăm sóc da và làm đẹp chuẩn Hàn tại K-Beauty Spa.',
  openGraph: {
    title: 'Dịch Vụ — K-Beauty Spa',
    description: 'Danh sách đầy đủ các dịch vụ chăm sóc da chuẩn Hàn Quốc.',
  },
};

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

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export default async function ServicesPage() {
  const services = await fetchServices();

  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Dịch Vụ
          </p>
          <h1
            className="text-4xl font-bold text-[#1C1917] mb-4"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            Tất Cả Dịch Vụ
          </h1>
          <p className="text-[#A8A29E] max-w-xl mx-auto leading-relaxed">
            Chúng tôi cung cấp đa dạng dịch vụ chăm sóc da và làm đẹp chuẩn Hàn Quốc,
            được cá nhân hóa theo từng loại da.
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
                <div
                  className="h-44 w-full"
                  style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                />
                <div className="p-5">
                  <h2 className="font-semibold text-[#1C1917] text-base mb-1 line-clamp-1">
                    {service.name.vi}
                  </h2>
                  <p className="text-[#A8A29E] text-sm line-clamp-2 mb-4">
                    {service.description?.vi ?? ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#D4A574] font-bold text-sm">
                        {service.price.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#A8A29E]">
                        <Clock size={11} />
                        {service.duration} phút
                      </span>
                    </div>
                    <Link
                      href={`/services/${service.slug}`}
                      className="flex items-center gap-1 text-xs font-semibold text-[#D4A574] hover:text-[#c4956a] transition-colors"
                    >
                      Chi tiết <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-[#A8A29E]">
            Đang cập nhật dịch vụ. Vui lòng quay lại sau.
          </div>
        )}
      </div>
    </div>
  );
}
