// page.tsx — Home page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';
// Fetches services + doctors from API, renders section components

import type { Metadata } from 'next';
import type { Service, Doctor } from '@/lib/api-types';
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesGridSection } from '@/components/sections/services-grid-section';
import { DoctorsShowcaseSection } from '@/components/sections/doctors-showcase-section';
import { ProcessTimelineSection } from '@/components/sections/process-timeline-section';
import { CtaBandSection } from '@/components/sections/cta-band-section';

export const metadata: Metadata = {
  title: 'Trang Chủ — K-Beauty Spa',
  description:
    'K-Beauty Spa — Dịch vụ chăm sóc da và làm đẹp chuẩn Hàn Quốc tại TP. Hồ Chí Minh. Đội ngũ bác sĩ chuyên nghiệp, công nghệ hiện đại.',
  openGraph: {
    title: 'K-Beauty Spa — Trải Nghiệm Làn Da Chuẩn Hàn',
    description:
      'Dịch vụ chăm sóc da và làm đẹp chuẩn Hàn Quốc. Đặt lịch online dễ dàng.',
    url: '/',
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<Service[]>;
  } catch {
    return [];
  }
}

async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const res = await fetch(`${API_BASE}/doctors`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<Doctor[]>;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [services, doctors] = await Promise.all([fetchServices(), fetchDoctors()]);

  return (
    <>
      <HeroSection />
      <ServicesGridSection services={services} />
      <DoctorsShowcaseSection doctors={doctors} />
      <ProcessTimelineSection />
      <CtaBandSection />
    </>
  );
}
