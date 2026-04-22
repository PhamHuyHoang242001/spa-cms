// doctors/[id]/page.tsx — Doctor detail page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Doctor } from '@/lib/api-types';
import { ArrowLeft, Star, CalendarDays } from 'lucide-react';

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

async function findDoctorById(id: string): Promise<Doctor | null> {
  const doctors = await fetchDoctors();
  return doctors.find((d) => d.id === id) ?? null;
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const doctor = await findDoctorById(id);
  if (!doctor) return { title: 'Không tìm thấy bác sĩ' };

  return {
    title: doctor.name,
    description: doctor.bio?.vi ?? `Bác sĩ ${doctor.name} — ${doctor.specialty?.vi ?? ''}`,
    openGraph: {
      title: `${doctor.name} — K-Beauty Spa`,
      description: doctor.bio?.vi ?? '',
    },
  };
}

export default async function DoctorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const doctor = await findDoctorById(id);
  if (!doctor) notFound();

  const initials = doctor.name
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
          <ArrowLeft size={14} /> Tất cả bác sĩ
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #D4A574 100%)',
              }}
            >
              {initials}
            </div>

            <div className="flex-1">
              <h1
                className="text-2xl md:text-3xl font-bold text-[#1C1917] mb-1"
                style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
              >
                {doctor.name}
              </h1>
              <p className="text-[#D4A574] font-semibold mb-3">
                {doctor.specialty?.vi ?? ''}
              </p>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-[#D4A574] fill-[#D4A574]" />
                <span className="text-sm text-[#A8A29E]">
                  {doctor.yearsExp} năm kinh nghiệm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-sm font-semibold text-[#1C1917] uppercase tracking-wider mb-4">
            Giới Thiệu
          </h2>
          <p className="text-[#A8A29E] leading-relaxed">
            {doctor.bio?.vi ?? 'Đang cập nhật thông tin bác sĩ.'}
          </p>
        </div>

        {/* Specialties summary */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <h2 className="text-sm font-semibold text-[#1C1917] uppercase tracking-wider mb-4">
            Chuyên Môn
          </h2>
          <div className="flex flex-wrap gap-2">
            {(doctor.specialty?.vi ?? '').split(',').filter(Boolean).map((s) => (
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
          Đặt lịch với bác sĩ này
        </Link>
      </div>
    </div>
  );
}
