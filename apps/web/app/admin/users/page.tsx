'use client';

import { useEffect, useState } from 'react';
import { Pencil, Users } from 'lucide-react';
import { AdminChoice } from '@/components/admin/admin-choice';
import { apiPatch } from '@/lib/api-client';
import { AdminFormModal } from '@/components/admin/admin-form-modal';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminListBar, fmtAdminDate } from '@/components/admin/admin-list-bar';
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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [locale, setLocale] = useState('vi');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [password, setPassword] = useState('');
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
    sort,
    dir,
    sortPinned,
    applyColumnIcon,
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
    setEmail(row.email);
    setPhone(row.phone ?? '');
    setLocale(row.locale === 'ko' ? 'ko' : 'vi');
    setRole(row.role);
    setPassword('');
    setSaveError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload: {
        name: string;
        email: string;
        phone: string | null;
        locale: string;
        role?: Role;
        password?: string;
      } = {
        name,
        email,
        phone: phone.trim() || null,
        locale,
      };
      if (editUser.id !== currentUser?.id) payload.role = role;
      if (password) payload.password = password;
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
    { key: 'name', label: 'Họ tên', sortKey: 'name' },
    { key: 'email', label: 'Email', sortKey: 'email' },
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
    { key: 'locale', label: 'Ngôn ngữ', render: (row: UserAdmin) => (row.locale === 'ko' ? '한국어' : 'Tiếng Việt') },
    {
      key: 'createdAtCol',
      label: 'Tạo lúc',
      sortKey: 'createdAt',
      render: (row: UserAdmin) => <span className="whitespace-nowrap">{fmtAdminDate(row.createdAt)}</span>,
    },
    {
      key: 'updatedAtCol',
      label: 'Sửa lúc',
      sortKey: 'updatedAt',
      render: (row: UserAdmin) => <span className="whitespace-nowrap">{fmtAdminDate(row.updatedAt)}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]">Người dùng</h1>
          <p className="mt-1 text-sm text-[#78716C]">Quản lý tài khoản và phân quyền</p>
        </div>
        <Users className="text-[#D4A574]" size={24} />
      </div>

      <AdminListBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm theo tên, email hoặc điện thoại..."
        filters={[{ key: 'role', label: 'Vai trò', value: roleFilter, onChange: setRoleFilter, options: [{ value: 'CUSTOMER', label: 'Khách hàng' }, { value: 'DOCTOR', label: 'Bác sĩ' }, { value: 'SUPERADMIN', label: 'Quản trị' }] }]}
      />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        sort={sort}
        dir={dir}
        sortPinned={sortPinned}
        onSort={applyColumnIcon}
        actions={(row) => (
          <button type="button" onClick={() => openEdit(row)} className="px-3 py-1 text-xs border border-[#E5DDD5]"><Pencil size={14} /> Sửa</button>
        )}
      />

      {meta && <AdminPagination page={page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />}

      <AdminFormModal title="Sửa người dùng" open={!!editUser} onClose={() => setEditUser(null)}>
        <form onSubmit={handleSave} className="space-y-4">
          {saveError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#57534E]">Họ tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#57534E]">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#57534E]">Điện thoại</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
          </div>
          <AdminChoice
            label="Ngôn ngữ"
            value={locale}
            onChange={setLocale}
            options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'ko', label: '한국어' }]}
          />
          <div>
            <AdminChoice
              label="Vai trò"
              value={role}
              onChange={(v) => {
                if (editUser?.id === currentUser?.id) return;
                setRole(v as Role);
              }}
              options={[
                { value: 'CUSTOMER', label: 'Khách hàng' },
                { value: 'DOCTOR', label: 'Bác sĩ' },
                { value: 'SUPERADMIN', label: 'Quản trị' },
              ]}
            />
            {editUser?.id === currentUser?.id ? (
              <p className="mt-1 text-xs text-[#78716C]">Không thể thay đổi vai trò của chính mình.</p>
            ) : role !== editUser?.role ? (
              <p className="mt-1 text-xs text-amber-700">
                Thay đổi vai trò sẽ ảnh hưởng đến quyền truy cập của người dùng này.
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#57534E]">Mật khẩu mới</label>
            <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} placeholder="Để trống nếu không đổi" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditUser(null)} className="rounded-full border border-[#E5DDD5] px-4 py-2 text-sm text-[#57534E] hover:bg-[#f5ede8]">Hủy</button>
            <button type="submit" disabled={saving} className="rounded-full bg-[#D4A574] px-4 py-2 text-sm font-medium text-white hover:bg-[#c4956a] disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}

const fieldClass =
  'w-full rounded-lg border border-[#E5DDD5] bg-[#FAF7F2] px-3 py-2 text-sm text-[#1C1917] focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/40 disabled:cursor-not-allowed disabled:opacity-60';
