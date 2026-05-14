# Phase 06: Frontend Pages + Components Migration

**Priority:** High | **Status:** Pending | **Est:** 1d | **Depends:** Phase 05

## Overview

Convert all 30 Next.js pages and 20 components to plain React. Main changes: server components → client components with useEffect, Next.js imports → React Router imports.

## Migration Patterns by Page Type

### Type A: Server Component (async fetch) → useEffect
Pages: home, services list, services detail, doctors list, doctors detail, blog list, blog detail

```tsx
// BEFORE (Next.js server component)
export default async function Page() {
  const data = await fetch(`${API}/endpoint`).then(r => r.json());
  return <Component data={data} />;
}

// AFTER (React client component)
export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet('/endpoint').then(setData).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  return <Component data={data} />;
}
```

### Type B: Client Component (already 'use client') → Minor import changes
Pages: login, register, booking, admin/*, me/bookings

Changes: `next/navigation` → `react-router-dom`, `next/link` → `react-router-dom Link`

### Type C: Dynamic Route `[slug]` → useParams
```tsx
// BEFORE: export default async function Page({ params }) { const { slug } = await params; }
// AFTER: const { slug } = useParams();
```

## Page-by-Page Migration

### Public Pages (10 pages)

| Page | Source | Type | Key Changes |
|------|--------|------|-------------|
| Home | `app/page.tsx` (65L) | A | Remove force-dynamic, async → useEffect, fetchServices+fetchDoctors |
| Services List | `app/services/page.tsx` | A | async fetch → useEffect |
| Service Detail | `app/services/[slug]/page.tsx` | A+C | params → useParams, notFound() → navigate('/404') |
| Doctors List | `app/doctors/page.tsx` | A | async fetch → useEffect |
| Doctor Detail | `app/doctors/[id]/page.tsx` | A+C | params → useParams |
| Blog List | `app/blog/page.tsx` (124L) | A | searchParams → useSearchParams, pagination |
| Blog Detail | `app/blog/[slug]/page.tsx` (136L) | A+C | params → useParams, generateHTML kept |
| Login | `app/login/page.tsx` | B | useRouter → useNavigate |
| Register | `app/register/page.tsx` | B | useRouter → useNavigate |
| Not Found | `app/not-found.tsx` | — | Static, minimal changes |

### Protected Pages (2 pages)

| Page | Source | Type | Key Changes |
|------|--------|------|-------------|
| Booking | `app/booking/page.tsx` (231L) | B | useSearchParams + useRouter → react-router equivalents |
| My Bookings | `app/me/bookings/page.tsx` | B | useRouter → useNavigate |

### Admin Pages (7 pages)

| Page | Source | Type | Key Changes |
|------|--------|------|-------------|
| Admin Layout | `app/admin/layout.tsx` (42L) | B | useRouter → useNavigate, children → Outlet |
| Dashboard | `app/admin/dashboard/page.tsx` | B | useEffect data fetch |
| Admin Index | `app/admin/page.tsx` | B | Redirect to dashboard |
| Services CRUD | `app/admin/services/page.tsx` (244L) | B | Minimal (already client) |
| Doctors CRUD | `app/admin/doctors/page.tsx` (229L) | B | Minimal |
| Articles CRUD | `app/admin/articles/page.tsx` (233L) | B | Minimal |
| Slots | `app/admin/slots/page.tsx` (183L) | B | Minimal |
| My Schedule | `app/admin/my-schedule/page.tsx` (160L) | B | Minimal |

## Components (20 components)

### Layout (3)
| Component | Changes |
|-----------|---------|
| `site-header.tsx` | `next/link` → `react-router-dom Link` (href → to) |
| `site-footer.tsx` | `next/link` → `react-router-dom Link` |
| `site-nav-header.tsx` | Same as above |

### Sections (5) — Minimal changes
| Component | Changes |
|-----------|---------|
| `hero-section.tsx` | `next/link` → `react-router-dom Link` |
| `services-grid-section.tsx` | `next/link` → `react-router-dom Link` |
| `doctors-showcase-section.tsx` | `next/link` → `react-router-dom Link` |
| `process-timeline-section.tsx` | None (pure JSX) |
| `cta-band-section.tsx` | `next/link` → `react-router-dom Link` |

### Auth (1)
| Component | Changes |
|-----------|---------|
| `require-auth.tsx` | `useRouter` → `useNavigate` |

### Booking (6) — Already client components
| Component | Changes |
|-----------|---------|
| `step-service.tsx` | None (uses apiGet, no Next.js imports) |
| `step-doctor.tsx` | None |
| `date-strip.tsx` | None |
| `slot-grid.tsx` | None |
| `step-slot.tsx` | None |
| `step-confirm.tsx` | None |
| `step-success.tsx` | `next/link` → `react-router-dom Link` |

### Admin (3) — Already client components
| Component | Changes |
|-----------|---------|
| `admin-sidebar.tsx` | `next/link` → `react-router-dom Link`, `usePathname()` → `useLocation()` |
| `admin-table.tsx` | None (pure React) |
| `admin-form-modal.tsx` | None (pure React) |

### Blog (1)
| Component | Changes |
|-----------|---------|
| `article-card.tsx` | `next/link` → `react-router-dom Link` |

## Removed Next.js Features (no migration needed)

| Feature | Decision |
|---------|----------|
| `Metadata` exports | Drop (no SSR/SEO needed) |
| `generateMetadata()` | Drop |
| `loading.tsx` boundaries | Replace with inline loading states (already have) |
| `error.tsx` boundaries | Use React ErrorBoundary wrapper |
| `robots.ts` / `sitemap.ts` | Drop or serve as static files |
| `next/font/google` | Already replaced in Phase 05 (CSS @import) |
| `next/image` | Not used in codebase (plain `<img>`) |
| `force-dynamic` / `revalidate` | Not applicable in SPA |

## Loading & Error Handling

### Replace Next.js loading.tsx
Create a simple `<LoadingSpinner />` component used inline:
```tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

### Replace Next.js error.tsx
Create `<ErrorBoundary />` wrapper for top-level and route-level errors:
```tsx
import { ErrorBoundary } from 'react-error-boundary';
// Wrap routes with <ErrorBoundary fallback={<ErrorPage />}>
```

## Todo

- [ ] Create LoadingSpinner + ErrorBoundary components
- [ ] Create RootLayout with Outlet (replace Next.js layout.tsx)
- [ ] Create AdminLayout with Outlet + sidebar + auth guard
- [ ] Migrate 10 public pages (home, services, doctors, blog, auth)
- [ ] Migrate 2 protected pages (booking, my-bookings)
- [ ] Migrate 7 admin pages (dashboard, services, doctors, articles, slots, schedule)
- [ ] Migrate 20 components (fix imports)
- [ ] Copy global CSS styles
- [ ] Verify all routes render in browser
- [ ] Test booking wizard flow
- [ ] Test admin CRUD operations

## Success Criteria

- All 30 pages render without errors
- Navigation works between all routes
- Auth guard redirects unauthenticated users
- Admin layout shows sidebar with active route highlighting
- Booking wizard completes all steps
- Blog pagination works with URL params
- Tailwind styles match original design
