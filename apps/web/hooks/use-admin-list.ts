'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import type { PaginatedResponse, PaginationMeta } from '@/lib/api-types';

interface UseAdminListOptions {
  url: string;
  defaultLimit?: number;
  extraParams?: Record<string, string>;
}

export function useAdminList<T>({
  url,
  defaultLimit = 20,
  extraParams,
}: UseAdminListOptions) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const extraParamsKey = useMemo(() => JSON.stringify(extraParams ?? {}), [extraParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(defaultLimit));
      if (debouncedSearch) params.set('search', debouncedSearch);

      const parsedExtraParams = JSON.parse(extraParamsKey) as Record<string, string>;
      if (parsedExtraParams) {
        for (const [key, value] of Object.entries(parsedExtraParams)) {
          if (value) params.set(key, value);
        }
      }

      const result = await apiGet<PaginatedResponse<T>>(`${url}?${params.toString()}`);
      setData(result.data);
      setMeta(result.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [url, page, defaultLimit, debouncedSearch, extraParamsKey]);

  useEffect(() => {
    void Promise.resolve().then(reload);
  }, [reload]);

  return { data, meta, loading, error, search, setSearch, page, setPage, reload };
}
