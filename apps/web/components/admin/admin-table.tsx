'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { isIconActive, type SortDir } from '@/lib/admin-sort';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  /** Prisma/API sort field. Omit if column is not sortable. */
  sortKey?: string;
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyText?: string;
  sort?: string;
  dir?: SortDir;
  sortPinned?: boolean;
  onSort?: (columnKey: string, iconDir: SortDir) => void;
}

export function AdminTable<T extends { id: string }>({
  columns,
  data,
  actions,
  loading,
  emptyText = 'Không có dữ liệu',
  sort = 'createdAt',
  dir = 'desc',
  sortPinned = false,
  onSort,
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#8a6a62]">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#ede4de]">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#f5ede8] text-[#6b4c41] uppercase text-xs tracking-wider">
          <tr>
            {columns.map((col) => {
              const state = { sort, dir, pinned: sortPinned };
              return (
                <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortKey && onSort ? (
                      <span className="inline-flex flex-col -space-y-1">
                        <ChevronUp
                          size={12}
                          aria-label={`Sắp xếp ${col.label} tăng dần`}
                          className={`cursor-pointer ${isIconActive(state, col.sortKey, 'asc') ? 'text-[#B76E79]' : 'text-[#c4b4ad] hover:text-[#8a6a62]'}`}
                          onClick={() => onSort(col.sortKey as string, 'asc')}
                        />
                        <ChevronDown
                          size={12}
                          aria-label={`Sắp xếp ${col.label} giảm dần`}
                          className={`cursor-pointer ${isIconActive(state, col.sortKey, 'desc') ? 'text-[#B76E79]' : 'text-[#c4b4ad] hover:text-[#8a6a62]'}`}
                          onClick={() => onSort(col.sortKey as string, 'desc')}
                        />
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
            {actions && (
              <th className="px-4 py-3 font-medium text-right">Hành động</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0e8e3] bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-[#a89080]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-[#fdf9f7] transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[#3d2b25]">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
