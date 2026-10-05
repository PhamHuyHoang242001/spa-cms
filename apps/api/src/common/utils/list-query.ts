export type SortDir = 'asc' | 'desc';

export function parseListQuery(
  query: Record<string, unknown>,
  sortFields: string[],
  defaultSort = 'createdAt',
) {
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const sort = typeof query.sort === 'string' && sortFields.includes(query.sort) ? query.sort : defaultSort;
  const dir: SortDir = query.dir === 'asc' ? 'asc' : 'desc';
  const filter: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (['page', 'limit', 'search', 'sort', 'dir'].includes(key)) continue;
    if (typeof value === 'string' && value) filter[key] = value;
  }
  return { search, sort, dir, filter };
}
