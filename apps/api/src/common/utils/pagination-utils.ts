export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ParsedPagination {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(
  page?: string,
  limit?: string,
): ParsedPagination | null {
  if (!page) return null;

  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit ?? '', 10);
  const normalizedPage = Number.isFinite(parsedPage)
    ? Math.max(1, parsedPage)
    : 1;
  const normalizedLimit = Number.isFinite(parsedLimit)
    ? Math.min(100, Math.max(1, parsedLimit))
    : 20;

  return {
    skip: (normalizedPage - 1) * normalizedLimit,
    take: normalizedLimit,
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
