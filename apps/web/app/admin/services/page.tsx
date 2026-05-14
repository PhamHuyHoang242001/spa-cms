'use client';

// admin/services/page.tsx — Services CRUD for SUPERADMIN
// Table list + modal form for create/edit + delete confirm

import { useState } from 'react';
import { apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormModal } from '@/components/admin/admin-form-modal';
import { AdminGalleryManager } from '@/components/admin/admin-gallery-manager';
import { AdminImageUpload } from '@/components/admin/admin-image-upload';
import { AdminSearchBar } from '@/components/admin/admin-search-bar';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { useAdminList } from '@/hooks/use-admin-list';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface ServiceRow {
  id: string;
  slug: string;
  name: { vi: string; ko: string };
  description: { vi: string; ko: string };
  priceVnd: number;
  durationMin: number;
  coverUrl?: string | null;
  gallery?: string[];
  order?: number;
  featured: boolean;
  active: boolean;
}

const EMPTY_FORM = {
  slug: '',
  nameVi: '',
  nameKo: '',
  descVi: '',
  descKo: '',
  priceVnd: '',
  durationMin: '',
  coverUrl: '',
  gallery: [] as string[],
  order: '0',
  featured: false,
  active: true,
};

type FormState = typeof EMPTY_FORM;

export default function ServicesPage() {
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const {
    data: rows,
    meta,
    loading,
    error: listError,
    search,
    setSearch,
    page,
    setPage,
    reload,
  } = useAdminList<ServiceRow>({ url: '/services/admin' });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: ServiceRow) {
    setEditId(row.id);
    setForm({
      slug: row.slug,
      nameVi: row.name.vi,
      nameKo: row.name.ko,
      descVi: row.description.vi,
      descKo: row.description.ko,
      priceVnd: String(row.priceVnd),
      durationMin: String(row.durationMin),
      coverUrl: row.coverUrl ?? '',
      gallery: row.gallery ?? [],
      order: String(row.order ?? 0),
      featured: row.featured,
      active: row.active,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        name: { vi: form.nameVi, ko: form.nameKo },
        description: { vi: form.descVi, ko: form.descKo },
        priceVnd: Number(form.priceVnd),
        durationMin: Number(form.durationMin),
        coverUrl: form.coverUrl || null,
        gallery: form.gallery,
        order: Number(form.order),
        featured: form.featured,
        active: form.active,
      };
      if (editId) {
        await apiPatch(`/services/${editId}`, payload);
      } else {
        await apiPost('/services', payload);
      }
      setModalOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiDelete(`/services/${deleteId}`);
      setDeleteId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  }

  function field(key: keyof FormState, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const columns = [
    { key: 'name', label: 'Tên dịch vụ', render: (r: ServiceRow) => r.name.vi },
    { key: 'priceVnd', label: 'Giá (VND)', render: (r: ServiceRow) => r.priceVnd?.toLocaleString('vi-VN') ?? '—' },
    { key: 'durationMin', label: 'Thời gian (phút)', render: (r: ServiceRow) => `${r.durationMin} phút` },
    {
      key: 'featured', label: 'Nổi bật', render: (r: ServiceRow) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.featured ? 'Có' : 'Không'}
        </span>
      ),
    },
    {
      key: 'active', label: 'Trạng thái', render: (r: ServiceRow) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.active ? 'Hoạt động' : 'Tắt'}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3d2b25]">Dịch vụ</h1>
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
        placeholder="Tìm dịch vụ theo tên hoặc slug..."
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
            <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
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

      {/* Create / Edit modal */}
      <AdminFormModal
        title={editId ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidthClassName="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <AdminImageUpload
            value={form.coverUrl || null}
            onChange={(url) => field('coverUrl', url ?? '')}
            label="Ảnh bìa"
          />
          <AdminGalleryManager
            value={form.gallery}
            onChange={(urls) => field('gallery', urls)}
            label="Thư viện ảnh"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên (VI)" value={form.nameVi} onChange={(v) => field('nameVi', v)} required />
            <Field label="Tên (KO)" value={form.nameKo} onChange={(v) => field('nameKo', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mô tả (VI)" value={form.descVi} onChange={(v) => field('descVi', v)} multiline />
            <Field label="Mô tả (KO)" value={form.descKo} onChange={(v) => field('descKo', v)} multiline />
          </div>
          <Field label="Slug" value={form.slug} onChange={(v) => field('slug', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá (VND)" value={form.priceVnd} onChange={(v) => field('priceVnd', v)} type="number" required />
            <Field label="Thời gian (phút)" value={form.durationMin} onChange={(v) => field('durationMin', v)} type="number" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Thứ tự hiển thị" value={form.order} onChange={(v) => field('order', v)} type="number" />
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm text-[#3d2b25]">
                <input type="checkbox" checked={form.featured} onChange={(e) => field('featured', e.target.checked)} className="rounded" />
                Nổi bật
              </label>
              <label className="flex items-center gap-2 text-sm text-[#3d2b25]">
                <input type="checkbox" checked={form.active} onChange={(e) => field('active', e.target.checked)} className="rounded" />
                Hoạt động
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-full border border-[#ddd0ca] text-sm text-[#6b4c41] hover:bg-[#f5ede8] transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-full bg-[#B76E79] text-white text-sm font-medium hover:bg-[#a35d68] disabled:opacity-60 transition-colors">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </AdminFormModal>

      {/* Delete confirm */}
      <AdminFormModal title="Xác nhận xóa" open={!!deleteId} onClose={() => setDeleteId(null)}>
        <p className="text-sm text-[#3d2b25] mb-5">Bạn có chắc muốn xóa dịch vụ này không?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-full border border-[#ddd0ca] text-sm text-[#6b4c41] hover:bg-[#f5ede8] transition-colors">Hủy</button>
          <button onClick={handleDelete} className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Xóa</button>
        </div>
      </AdminFormModal>
    </div>
  );
}

// ---------- local Field helper ----------
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  multiline?: boolean;
}

function Field({ label, value, onChange, required, type = 'text', multiline }: FieldProps) {
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
