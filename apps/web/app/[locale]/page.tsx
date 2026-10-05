// page.tsx — Home page (Server Component)
// force-dynamic: API not available at build time

export const dynamic = 'force-dynamic';

import { setRequestLocale } from 'next-intl/server';
import type { Service, Doctor } from '@/lib/api-types';
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesGridSection } from '@/components/sections/services-grid-section';
import { DoctorsShowcaseSection } from '@/components/sections/doctors-showcase-section';
import { ProcessTimelineSection } from '@/components/sections/process-timeline-section';
import { CtaBandSection } from '@/components/sections/cta-band-section';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';
const HOME_API_TIMEOUT_MS = 1500;

async function fetchServices(): Promise<Service[]> {
  try {
    const signal = AbortSignal.timeout(HOME_API_TIMEOUT_MS);
    const res = await fetch(`${API_BASE}/services`, {
      next: { revalidate: 300 },
      signal,
    });
    if (!res.ok) return [];
    return res.json() as Promise<Service[]>;
  } catch {
    return [];
  }
}

async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const signal = AbortSignal.timeout(HOME_API_TIMEOUT_MS);
    const res = await fetch(`${API_BASE}/doctors`, {
      next: { revalidate: 300 },
      signal,
    });
    if (!res.ok) return [];
    return res.json() as Promise<Doctor[]>;
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [services, doctors] = await Promise.all([fetchServices(), fetchDoctors()]);

  return (
    <div className="kb-shell">
      <HeroSection />
      <ServicesGridSection services={services} />
      <DoctorsShowcaseSection doctors={doctors} />
      <ProcessTimelineSection />
      <CtaBandSection />
    </div>
  );
}
