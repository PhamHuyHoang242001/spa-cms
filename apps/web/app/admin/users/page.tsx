'use client';

import { useEffect, useState } from 'react';
import { Pencil, Users } from 'lucide-react';
import { apiPatch } from '@/lib/api-client';
import { AdminFormModal } from '@/components/admin/admin-form-modal';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminSearchBar } from '@/components/admin/admin-search-bar';
import { AdminTable } from '@/components/admin/admin-table';
import { useAdminList } from '@/hooks/use-admin-list';
import { useAuth } from '@/lib/auth-context';
import type { UserAdmin } from '@/lib/api-types';

type Role = UserAdmin['role'];

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Khách hàng',
  DOCTOR: 'Bác sĩ',
  SUPERADMIN: 'Quản trị',
};

const ROLE_COLORS: Record<Role, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  DOCTOR: 'bg-purple-100 text-purple-700',
  SUPERADMIN: 'bg-amber-100 text-amber-700',
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState<UserAdmin | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const {
    data: users,
    meta,
    loading,
    error,
    search,
    setSearch,
    page,
    setPage,
    reload,
  } = useAdminList<UserAdmin>({
    url: '/users',
    extraParams: roleFilter ? { role: roleFilter } : undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [roleFilter, setPage]);

  function openEdit(row: UserAdmin) {
    setEditUser(row);
    setName(row.name);
    setRole(row.role);
    setSaveError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload: { name: string; role?: Role } = { name };
      if (editUser.id !== currentUser?.id) payload.role = role;
      await apiPatch(`/users/${editUser.id}`, payload);
      setEditUser(null);
      await reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Lưu người dùng thất bại');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'name', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Vai trò',
      render: (row: UserAdmin) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[row.role]}`}>
          {ROLE_LABELS[row.role]}
        </span>
      ),
    },
    { key: 'phone', label: 'Điện thoại', render: (row: UserAdmin) => row.phone ?? '-' },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (row: UserAdmin) => new Date(row.createdAt).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3d2b25]">Người dùng</h1>
          <p className="mt-1 text-sm text-[#8a6a62]">Quản lý tài khoản và phân quyền</p>
        </div>
        <Users className="text-[#B76E79]" size={24} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, email hoặc điện thoại..." />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full rounded-lg border border-[#ddd0ca] bg-[#fdfaf8] px-3 py-2 text-sm text-[#3d2b25] focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 md:w-56"
        >
          <option value="">Tất cả vai trò</option>
          <option value="CUSTOMER">Khách hàng</option>
          <option value="DOCTOR">Bác sĩ</option>
          <option value="SUPERADMIN">Quản trị</option>
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        actions={(row) => (
          <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-[#6b4c41] transition-colors hover:bg-[#f5ede8]" title="Sửa">
            <Pencil size={15} />
          </button>
        )}
      />

      {meta && <AdminPagination page={page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />}

      <AdminFormModal title="Sửa người dùng" open={!!editUser} onClose={() => setEditUser(null)}>
        <form onSubmit={handleSave} className="space-y-4">
          {saveError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6b4c41]">Họ tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6b4c41]">Vai trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={editUser?.id === currentUser?.id}
              className={fieldClass}
              title={editUser?.id === currentUser?.id ? 'Không thể thay đổi vai trò của chính mình' : undefined}
            >
              <option value="CUSTOMER">Khách hàng</option>
              <option value="DOCTOR">Bác sĩ</option>
              <option value="SUPERADMIN">Quản trị</option>
            </select>
            {editUser?.id === currentUser?.id ? (
              <p className="mt-1 text-xs text-[#8a6a62]">Không thể thay đổi vai trò của chính mình.</p>
            ) : role !== editUser?.role ? (
              <p className="mt-1 text-xs text-amber-700">
                Thay đổi vai trò sẽ ảnh hưởng đến quyền truy cập của người dùng này.
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditUser(null)} className="rounded-full border border-[#ddd0ca] px-4 py-2 text-sm text-[#6b4c41] hover:bg-[#f5ede8]">Hủy</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#B76E79] px-4 py-2 text-sm font-medium text-white hover:bg-[#a35d68] disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}

const fieldClass =
  'w-full rounded-lg border border-[#ddd0ca] bg-[#fdfaf8] px-3 py-2 text-sm text-[#3d2b25] focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 disabled:cursor-not-allowed disabled:opacity-60';
