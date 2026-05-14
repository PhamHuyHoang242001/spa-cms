'use client';

// admin/doctors/page.tsx — Doctors CRUD for SUPERADMIN
// Table with add/edit modal and soft-delete toggle

import { useMemo, useState } from 'react';
import { apiPost, apiPatch } from '@/lib/api-client';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormModal } from '@/components/admin/admin-form-modal';
import { AdminImageUpload } from '@/components/admin/admin-image-upload';
import { AdminSearchBar } from '@/components/admin/admin-search-bar';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { useAdminList } from '@/hooks/use-admin-list';
import { Pencil, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

// API returns DoctorProfile with nested user
interface DoctorApiRow {
  id: string;
  user: { id: string; name: string; email: string };
  specialty: { vi: string; ko: string };
  bio: { vi: string; ko: string };
  yearsExp: number;
  avatarUrl?: string | null;
  order?: number;
  active: boolean;
}

// Flattened for table display
interface DoctorRow {
  id: string;
  email: string;
  name: string;
  phone?: string;
  specialty: { vi: string; ko: string };
  bio: { vi: string; ko: string };
  yearsExp: number;
  avatarUrl?: string | null;
  order?: number;
  active: boolean;
}

const EMPTY_FORM = {
  email: '',
  password: '',
  name: '',
  phone: '',
  specialtyVi: '',
  specialtyKo: '',
  bioVi: '',
  bioKo: '',
  yearsExp: '',
  avatarUrl: '',
  order: '0',
};

type FormState = typeof EMPTY_FORM;

export default function DoctorsPage() {
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const {
    data,
    meta,
    loading,
    error: listError,
    search,
    setSearch,
    page,
    setPage,
    reload,
  } = useAdminList<DoctorApiRow>({ url: '/doctors/admin' });
  const rows = useMemo<DoctorRow[]>(
    () =>
      data.map((d) => ({
        id: d.id,
        email: d.user.email,
        name: d.user.name,
        specialty: d.specialty,
        bio: d.bio,
        yearsExp: d.yearsExp,
        avatarUrl: d.avatarUrl ?? null,
        order: d.order ?? 0,
        active: d.active,
      })),
    [data],
  );

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: DoctorRow) {
    setEditId(row.id);
    setForm({
      email: row.email,
      password: '',
      name: row.name,
      phone: row.phone ?? '',
      specialtyVi: row.specialty.vi,
      specialtyKo: row.specialty.ko,
      bioVi: row.bio.vi,
      bioKo: row.bio.ko,
      yearsExp: String(row.yearsExp),
      avatarUrl: row.avatarUrl ?? '',
      order: String(row.order ?? 0),
    });
    setModalOpen(true);
  }

  async function toggleActive(row: DoctorRow) {
    try {
      await apiPatch(`/doctors/${row.id}`, { active: !row.active });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone,
        specialty: { vi: form.specialtyVi, ko: form.specialtyKo },
        bio: { vi: form.bioVi, ko: form.bioKo },
        yearsExp: Number(form.yearsExp),
        avatarUrl: form.avatarUrl || null,
        order: Number(form.order),
      };
      if (editId) {
        await apiPatch(`/doctors/${editId}`, payload);
      } else {
        await apiPost('/doctors', { ...payload, email: form.email, password: form.password });
      }
      setModalOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const columns = [
    { key: 'name', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'specialty', label: 'Chuyên môn', render: (r: DoctorRow) => r.specialty.vi },
    { key: 'yearsExp', label: 'Kinh nghiệm', render: (r: DoctorRow) => `${r.yearsExp} năm` },
    {
      key: 'active', label: 'Trạng thái', render: (r: DoctorRow) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.active ? 'Hoạt động' : 'Tắt'}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3d2b25]">Bác sĩ</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B76E79] text-white text-sm font-medium hover:bg-[#a35d68] transition-colors"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <AdminSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm bác sĩ theo tên, email hoặc chuyên môn..."
      />

      {(error || listError) && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error || listError}</div>
      )}

      <AdminTable
        columns={columns}
        data={rows}
        loading={loading}
        actions={(row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-[#6b4c41] hover:bg-[#f5ede8] transition-colors">
              <Pencil size={15} />
            </button>
            <button
              onClick={() => toggleActive(row)}
              className={`p-1.5 rounded-lg transition-colors ${row.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
              title={row.active ? 'Tắt bác sĩ' : 'Kích hoạt bác sĩ'}
            >
              {row.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            </button>
          </>
        )}
      />

      {meta && (
        <AdminPagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      )}

      <AdminFormModal
        title={editId ? 'Sửa bác sĩ' : 'Thêm bác sĩ'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidthClassName="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <AdminImageUpload
            value={form.avatarUrl || null}
            onChange={(url) => field('avatarUrl', url ?? '')}
            label="Ảnh đại diện"
          />
          {!editId && (
            <div className="grid grid-cols-2 gap-3">
              <DField label="Email" value={form.email} onChange={(v) => field('email', v)} type="email" required />
              <DField label="Mật khẩu" value={form.password} onChange={(v) => field('password', v)} type="password" required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <DField label="Họ tên" value={form.name} onChange={(v) => field('name', v)} required />
            <DField label="Điện thoại" value={form.phone} onChange={(v) => field('phone', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DField label="Chuyên môn (VI)" value={form.specialtyVi} onChange={(v) => field('specialtyVi', v)} required />
            <DField label="Chuyên môn (KO)" value={form.specialtyKo} onChange={(v) => field('specialtyKo', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DField label="Tiểu sử (VI)" value={form.bioVi} onChange={(v) => field('bioVi', v)} multiline />
            <DField label="Tiểu sử (KO)" value={form.bioKo} onChange={(v) => field('bioKo', v)} multiline />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DField label="Số năm kinh nghiệm" value={form.yearsExp} onChange={(v) => field('yearsExp', v)} type="number" required />
            <DField label="Thứ tự hiển thị" value={form.order} onChange={(v) => field('order', v)} type="number" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-full border border-[#ddd0ca] text-sm text-[#6b4c41] hover:bg-[#f5ede8] transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-full bg-[#B76E79] text-white text-sm font-medium hover:bg-[#a35d68] disabled:opacity-60 transition-colors">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}

interface DFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}

function DField({ label, value, onChange, required, type = 'text', multiline }: DFieldProps) {
  const base = 'w-full rounded-lg border border-[#ddd0ca] px-3 py-2 text-sm text-[#3d2b25] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 focus:border-[#B76E79]';
  return (
    <div>
      <label className="block text-xs font-medium text-[#6b4c41] mb-1 uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea className={`${base} resize-none h-20`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={base} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
      )}
    </div>
  );
}
