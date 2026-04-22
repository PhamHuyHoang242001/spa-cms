// doctors/page.tsx — All doctors listing page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import type { Doctor } from '@/lib/api-types';
import { Star, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bác Sĩ',
  description: 'Đội ngũ bác sĩ chuyên nghiệp tại K-Beauty Spa — giàu kinh nghiệm, tận tâm.',
  openGraph: {
    title: 'Đội Ngũ Bác Sĩ — K-Beauty Spa',
    description: 'Gặp gỡ các chuyên gia làm đẹp hàng đầu tại K-Beauty Spa.',
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

export default async function DoctorsPage() {
  const doctors = await fetchDoctors();

  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Đội Ngũ
          </p>
          <h1
            className="text-4xl font-bold text-[#1C1917] mb-4"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            Các Bác Sĩ Chuyên Gia
          </h1>
          <p className="text-[#A8A29E] max-w-xl mx-auto leading-relaxed">
            Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo chuyên sâu về thẩm mỹ và
            chăm sóc da theo tiêu chuẩn Hàn Quốc.
          </p>
        </div>

        {/* Grid */}
        {doctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, i) => {
              const initials = doctor.name
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
                  {/* Avatar */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4"
                    style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
                  >
                    {initials}
                  </div>

                  <h2 className="font-semibold text-[#1C1917] text-base mb-1">
                    {doctor.name}
                  </h2>
                  <p className="text-[#D4A574] text-sm font-medium mb-2">
                    {doctor.specialty?.vi ?? ''}
                  </p>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star size={12} className="text-[#D4A574] fill-[#D4A574]" />
                    <span className="text-xs text-[#A8A29E]">
                      {doctor.yearsExp} năm kinh nghiệm
                    </span>
                  </div>
                  <p className="text-[#A8A29E] text-sm line-clamp-2 mb-4">
                    {doctor.bio?.vi ?? ''}
                  </p>

                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[#D4A574] hover:text-[#c4956a] transition-colors"
                  >
                    Xem hồ sơ <ArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-[#A8A29E]">
            Đang cập nhật đội ngũ bác sĩ. Vui lòng quay lại sau.
          </div>
        )}
      </div>
    </div>
  );
}
