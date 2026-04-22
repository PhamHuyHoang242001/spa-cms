'use client';

// admin-table.tsx — Generic reusable table for admin CRUD pages
// Renders column headers + rows from typed data arrays

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyText?: string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  data,
  actions,
  loading,
  emptyText = 'Không có dữ liệu',
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
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                {col.label}
              </th>
            ))}
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
