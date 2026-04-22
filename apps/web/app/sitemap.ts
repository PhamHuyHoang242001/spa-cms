// sitemap.ts — Next.js Metadata API sitemap generator
// Generates static routes + dynamic service/doctor/blog slugs from API
// Returns MetadataRoute.Sitemap consumed by Next.js at /sitemap.xml

import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kbeautyspa.vn';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Static public routes with their update frequencies
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${SITE_URL}/doctors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/booking`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
];

async function fetchSlugs<T>(path: string, mapFn: (item: T) => string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as T[];
    return data.map(mapFn);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [serviceSlugs, doctorIds, articleSlugs] = await Promise.all([
    fetchSlugs<{ slug: string }>('/services', (s) => s.slug),
    fetchSlugs<{ id: string }>('/doctors', (d) => d.id),
    fetchSlugs<{ slug: string }>('/articles', (a) => a.slug),
  ]);

  const serviceRoutes: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const doctorRoutes: MetadataRoute.Sitemap = doctorIds.map((id) => ({
    url: `${SITE_URL}/doctors/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...STATIC_ROUTES, ...serviceRoutes, ...doctorRoutes, ...blogRoutes];
}
