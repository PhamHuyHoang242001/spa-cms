---
phase: 05
title: "Search & Pagination UI Components"
status: pending
priority: P1
effort: 1.5d
dependencies: [phase-02]
---

# Phase 05 — Search & Pagination UI Components

## Context Links
- [Services page](../../apps/web/app/admin/services/page.tsx) — fetches all via `apiGet<ServiceRow[]>('/services')`, no search/pagination
- [Doctors page](../../apps/web/app/admin/doctors/page.tsx) — fetches all via `apiGet<DoctorApiRow[]>('/doctors')`, no search/pagination
- [Articles page](../../apps/web/app/admin/articles/page.tsx) — fetches all via `apiGet<Article[]>('/articles')`, no search/pagination
- [Slots page](../../apps/web/app/admin/slots/page.tsx) — slot-based filtering (doctor + date), no text search
- [AdminTable](../../apps/web/components/admin/admin-table.tsx) — generic table, no pagination built in
- [API client](../../apps/web/lib/api-client.ts) — `apiGet` helper
- Phase 02 provides admin endpoints: `GET /services/admin`, `GET /doctors/admin`, `GET /articles/admin` with `?page=&limit=&search=`

## Overview

Create reusable `AdminSearchBar`, `AdminPagination` components and `useAdminList` hook. Retrofit all existing admin CRUD pages (services, doctors, articles, slots) to use paginated API endpoints with search and pagination controls.

## Key Insights

- All 4 admin pages follow identical pattern: load all, show in AdminTable, CRUD modals
- Extracting a `useAdminList` hook eliminates repeated fetch/state/pagination logic
- AdminSearchBar needs debounce (300ms) to avoid excessive API calls
- Slots page is different: filter by doctor+date, no text search — add pagination only, not search
- Backend returns `PaginatedResponse<T>` when `page` param present; array when absent
- Admin endpoints use `/services/admin`, `/doctors/admin`, `/articles/admin` paths (Phase 02)

## Requirements

### Functional
- **AdminSearchBar**: debounced text input with search icon and clear button
- **AdminPagination**: prev/next buttons, page number display, total count info
- **useAdminList hook**: manages fetch, search debounce, pagination state, loading, error
- Services page: search by name, paginated
- Doctors page: search by name/email/specialty, paginated
- Articles page: search by title, paginated
- Slots page: paginated (no text search — existing doctor+date filters remain)

### Non-functional
- Components match existing admin design system
- Debounce search input at 300ms
- Reset to page 1 on search change
- Hook API is simple and declarative

## Architecture

### useAdminList Hook API

```ts
interface UseAdminListOptions {
  url: string;                    // e.g. '/services/admin'
  defaultLimit?: number;          // default 20
  extraParams?: Record<string, string>; // for slots: { doctorId, date }
}

interface UseAdminListReturn<T> {
  data: T[];
  meta: PaginationMeta | null;
  loading: boolean;
  error: string;
  search: string;
  setSearch: (v: string) => void;
  page: number;
  setPage: (p: number) => void;
  reload: () => Promise<void>;
}
```

### Component Tree

```
AdminCrudPage
  ├── <AdminSearchBar value={search} onChange={setSearch} />
  ├── <AdminTable data={data} ... />
  └── <AdminPagination meta={meta} page={page} onPageChange={setPage} />
```

## Related Code Files

### Files to Create
- `apps/web/components/admin/admin-search-bar.tsx` — Debounced search input
- `apps/web/components/admin/admin-pagination.tsx` — Pagination controls
- `apps/web/hooks/use-admin-list.ts` — Reusable data fetching hook

### Files to Modify
- `apps/web/app/admin/services/page.tsx` — Replace manual fetch with `useAdminList`, add search + pagination
- `apps/web/app/admin/doctors/page.tsx` — Same retrofit
- `apps/web/app/admin/articles/page.tsx` — Same retrofit
- `apps/web/app/admin/slots/page.tsx` — Add pagination (keep existing doctor+date filters)

## Implementation Steps

### Step 1: Create AdminSearchBar

Create `apps/web/components/admin/admin-search-bar.tsx`:

```tsx
'use client';

import { Search, X } from 'lucide-react';

interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdminSearchBar({
  value,
  onChange,
  placeholder = 'Tim kiem...',
}: AdminSearchBarProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89080]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#ddd0ca] text-sm text-[#3d2b25] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 focus:border-[#B76E79]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#a89080] hover:text-[#3d2b25]"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
```

### Step 2: Create AdminPagination

Create `apps/web/components/admin/admin-pagination.tsx`:

```tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-[#8a6a62]">
        Tong cong {total} ban ghi
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-[#ddd0ca] text-[#6b4c41] hover:bg-[#f5ede8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-[#3d2b25] min-w-[80px] text-center">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-[#ddd0ca] text-[#6b4c41] hover:bg-[#f5ede8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Create useAdminList Hook

Create `apps/web/hooks/use-admin-list.ts`:

```ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-types';

interface UseAdminListOptions {
  url: string;
  defaultLimit?: number;
  extraParams?: Record<string, string>;
}

export function useAdminList<T>({ url, defaultLimit = 20, extraParams }: UseAdminListOptions) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Serialize extraParams for dep array
  const extraParamsKey = extraParams ? JSON.stringify(extraParams) : '';

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(defaultLimit));
      if (debouncedSearch) params.set('search', debouncedSearch);

      // Merge extra params (e.g. doctorId, date for slots)
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) {
          if (v) params.set(k, v);
        }
      }

      const result = await apiGet<PaginatedResponse<T>>(`${url}?${params}`);
      setData(result.data);
      setMeta(result.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Loi tai du lieu');
    } finally {
      setLoading(false);
    }
  }, [url, page, defaultLimit, debouncedSearch, extraParamsKey]);

  useEffect(() => { reload(); }, [reload]);

  return { data, meta, loading, error, search, setSearch, page, setPage, reload };
}
```

### Step 4: Retrofit Services Page

Modify `apps/web/app/admin/services/page.tsx`:

- Replace manual `load()` with `useAdminList<ServiceRow>({ url: '/services/admin' })`
- Remove `rows`, `loading`, `error`, `load` state — provided by hook
- Add `AdminSearchBar` between header and table
- Add `AdminPagination` after table
- Keep CRUD modals (create/edit/delete) unchanged
- After save/delete: call `reload()` from hook

Key changes:
```tsx
const { data: rows, meta, loading, error: listError, search, setSearch, page, setPage, reload } = useAdminList<ServiceRow>({ url: '/services/admin' });

// In JSX, between header and table:
<AdminSearchBar value={search} onChange={setSearch} placeholder="Tim dich vu..." />

// After AdminTable:
{meta && <AdminPagination page={page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />}
```

### Step 5: Retrofit Doctors Page

Same pattern as services:
- `useAdminList<DoctorApiRow>({ url: '/doctors/admin' })`
- Map API rows to `DoctorRow` for display (keep existing mapping logic)
- Add search bar + pagination
- After save: call `reload()`

Note: the existing `load` function maps `DoctorApiRow[]` to `DoctorRow[]`. Since `useAdminList` returns `DoctorApiRow[]`, do the mapping in a `useMemo`:

```tsx
const { data: apiRows, ... } = useAdminList<DoctorApiRow>({ url: '/doctors/admin' });
const rows = useMemo(() => apiRows.map(d => ({
  id: d.id, email: d.user.email, name: d.user.name,
  specialty: d.specialty, bio: d.bio, yearsExp: d.yearsExp, active: d.active,
})), [apiRows]);
```

### Step 6: Retrofit Articles Page

- `useAdminList<Article>({ url: '/articles/admin' })`
- Add search bar + pagination
- Keep publish toggle, edit, delete modals
- After any mutation: call `reload()`

### Step 7: Retrofit Slots Page

Slots page has different filter pattern (doctor + date dropdowns, not text search). Add pagination only:

- Keep existing `selectedDoctor`, `selectedDate` state
- Use `useAdminList<Slot>({ url: '/slots', extraParams: { doctorId: selectedDoctor, date: selectedDate } })`
- Or: keep existing fetch logic, just add AdminPagination at bottom if backend supports pagination on slots
- Decision: since slots are typically <20 per doctor per day, pagination is low value. **Skip pagination for slots**, keep existing implementation. Only add if slot count grows.

Alternative: leave slots page as-is. The slot endpoint returns slots for a specific doctor+date combo, which is already a narrow filter. No search/pagination needed.

**Final decision: Skip slots page retrofit.** It already has adequate filtering.

## Todo List

- [ ] Create `AdminSearchBar` component
- [ ] Create `AdminPagination` component
- [ ] Create `useAdminList` hook with debounced search + pagination
- [ ] Retrofit services page: replace manual fetch, add search + pagination
- [ ] Retrofit doctors page: add search + pagination, keep row mapping
- [ ] Retrofit articles page: add search + pagination
- [ ] Verify slots page — skip retrofit (adequate filtering exists)
- [ ] Test search debounce (300ms delay, resets to page 1)
- [ ] Test pagination (prev/next, page indicator)
- [ ] Test CRUD operations still work after retrofit (create/edit/delete + reload)

## Success Criteria

- All admin CRUD pages (services, doctors, articles) have search bar + pagination
- Search is debounced at 300ms; typing resets to page 1
- Pagination shows current page, total pages, total count
- Prev/Next buttons disabled at boundaries
- CRUD operations (create, edit, delete) still work and refresh list
- AdminSearchBar and AdminPagination are reusable across pages
- useAdminList hook handles all fetch/state/error logic

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Retrofit breaks existing CRUD modals | Medium | Keep modal state/logic unchanged; only replace list fetching |
| useAdminList re-fetches on every extraParams change | Low | Serialize extraParams to stable key; use JSON.stringify for dep |
| Search on JSON fields returns no results | Medium | Test JSON field search in Phase 02; fallback to slug/email search |

## Security Considerations

- Admin endpoints already guarded by SUPERADMIN role (Phase 02)
- Search input sanitized by backend (Prisma parameterized queries)
- No client-side data filtering — all filtering done server-side
