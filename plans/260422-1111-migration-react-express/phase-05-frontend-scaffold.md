# Phase 05: Frontend Scaffold (spa-fe)

**Priority:** High | **Status:** Pending | **Est:** 0.5d | **Depends:** None (parallel with BE)

## Overview

Create Vite + React 19 + React Router v7 + Tailwind CSS 4 project. Copy lib files (api-client, auth-context, api-types) and Zod schemas from monorepo. These are already client-side and need minimal changes.

## Architecture

```
spa-fe/
├── src/
│   ├── main.tsx                  # ReactDOM.createRoot + BrowserRouter
│   ├── app.tsx                   # Route definitions
│   ├── index.css                 # Tailwind @import
│   ├── pages/                    # (Phase 06)
│   ├── components/               # (Phase 06)
│   ├── lib/
│   │   ├── api-client.ts         # Copy from apps/web/lib/ (no changes)
│   │   ├── api-types.ts          # Copy from apps/web/lib/ (no changes)
│   │   └── auth-context.tsx      # Copy, replace next/navigation → react-router
│   └── schemas/                  # Duplicated from shared
│       ├── auth-schemas.ts
│       ├── booking-schemas.ts
│       ├── doctor-schemas.ts
│       ├── service-schemas.ts
│       ├── slot-schemas.ts
│       └── article-schemas.ts
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── tsconfig.json
├── postcss.config.js
└── package.json
```

## Implementation Steps

### 1. Scaffold Vite project
```bash
cd /Users/phamhoang/Documents/work
pnpm create vite spa-fe --template react-ts
cd spa-fe
git init
```

### 2. Install dependencies
```bash
# Core
pnpm add react-router-dom@7 framer-motion lucide-react clsx embla-carousel-react zod

# TipTap (for blog article rendering)
pnpm add @tiptap/html @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link

# Dev
pnpm add -D @tailwindcss/postcss tailwindcss postcss @types/react @types/react-dom
```

### 3. Tailwind CSS 4 setup

**postcss.config.js:**
```js
export default { plugins: { '@tailwindcss/postcss': {} } };
```

**src/index.css:**
```css
@import 'tailwindcss';
```

Copy global styles from `apps/web/app/globals.css` (custom properties, font imports).

### 4. Fonts setup

Replace `next/font/google` with CSS `@import` or `<link>` in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap" rel="stylesheet">
```
Geist Sans: use CDN or `@fontsource/geist-sans` package.

### 5. Copy lib files

| Source | Target | Changes |
|--------|--------|---------|
| `apps/web/lib/api-client.ts` | `src/lib/api-client.ts` | None (already pure fetch) |
| `apps/web/lib/api-types.ts` | `src/lib/api-types.ts` | None |
| `apps/web/lib/auth-context.tsx` | `src/lib/auth-context.tsx` | None (already 'use client', no next imports) |
| `packages/shared/src/schemas/*.ts` | `src/schemas/*.ts` | None |

### 6. TypeScript config
- Path alias: `@/*` → `./src/*` (match existing `@/` imports)
- vite.config.ts: `resolve.alias: { '@': path.resolve(__dirname, './src') }`

### 7. Create `src/app.tsx` — Router skeleton

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';

// Layouts
import { RootLayout } from '@/pages/root-layout';
import { AdminLayout } from '@/pages/admin/admin-layout';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<ArticleDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected */}
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/me/bookings" element={<MyBookingsPage />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="doctors" element={<AdminDoctorsPage />} />
              <Route path="articles" element={<AdminArticlesPage />} />
              <Route path="slots" element={<AdminSlotsPage />} />
              <Route path="my-schedule" element={<AdminMySchedulePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### 8. Create `src/main.tsx`
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);
```

### 9. Create stub RootLayout
```tsx
// src/pages/root-layout.tsx
import { Outlet } from 'react-router-dom';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export function RootLayout() {
  return (
    <div className="min-h-full flex flex-col bg-[#F5F0E8]">
      <SiteHeader />
      <main id="main-content" className="flex flex-col flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
```

### 10. Verify dev server starts
```bash
pnpm dev
# Should show: Local: http://localhost:5173
```

## Key Migration Patterns

### Next.js `useRouter` → React Router
```tsx
// BEFORE
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/login');

// AFTER
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/login');
```

### Next.js `Link` → React Router `Link`
```tsx
// BEFORE
import Link from 'next/link';
<Link href="/services">

// AFTER
import { Link } from 'react-router-dom';
<Link to="/services">
```

### Next.js `useSearchParams` → React Router
```tsx
// BEFORE
import { useSearchParams } from 'next/navigation';
const searchParams = useSearchParams();

// AFTER
import { useSearchParams } from 'react-router-dom';
const [searchParams, setSearchParams] = useSearchParams();
```

### Next.js `useParams` → React Router
```tsx
// BEFORE
// params passed as prop to page component: { params: { slug } }

// AFTER
import { useParams } from 'react-router-dom';
const { slug } = useParams();
```

## Todo

- [ ] Scaffold Vite + React project
- [ ] Install dependencies (react-router, tailwind, framer-motion, etc.)
- [ ] Setup Tailwind CSS 4 + PostCSS
- [ ] Setup fonts (Geist Sans + Noto Serif KR)
- [ ] Copy lib files (api-client, auth-context, api-types)
- [ ] Copy Zod schemas
- [ ] Setup path aliases (@/*)
- [ ] Create router skeleton (app.tsx)
- [ ] Create stub RootLayout
- [ ] Verify dev server starts

## Success Criteria

- `pnpm dev` starts Vite on :5173
- Tailwind classes render correctly
- Router shows stub pages
- TypeScript compiles without errors
- Path aliases (@/) resolve correctly
