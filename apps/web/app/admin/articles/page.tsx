'use client';

// admin/articles/page.tsx — Articles list + create/edit/publish/delete for SUPERADMIN
// Content field is plain textarea (no Tiptap for MVP)

import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormModal } from '@/components/admin/admin-form-modal';
import { Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import type { Article } from '@/lib/api-types';

const EMPTY_FORM = {
  slug: '',
  titleVi: '',
  titleKo: '',
  excerptVi: '',
  excerptKo: '',
  content: '',
  tags: '',
};

type FormState = typeof EMPTY_FORM;

export default function ArticlesPage() {
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<Article[]>('/articles');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải bài viết');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: Article) {
    setEditId(row.id);
    setForm({
      slug: row.slug,
      titleVi: row.title.vi,
      titleKo: row.title.ko,
      excerptVi: row.excerpt.vi,
      excerptKo: row.excerpt.ko,
      content: row.content ?? '',
      tags: (row.tags ?? []).join(', '),
    });
    setModalOpen(true);
  }

  async function togglePublish(row: Article) {
    try {
      await apiPatch(`/articles/${row.id}/publish`, { published: !row.published });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        title: { vi: form.titleVi, ko: form.titleKo },
        excerpt: { vi: form.excerptVi, ko: form.excerptKo },
        content: form.content,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (editId) {
        await apiPatch(`/articles/${editId}`, payload);
      } else {
        await apiPost('/articles', payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiDelete(`/articles/${deleteId}`);
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const columns = [
    { key: 'title', label: 'Tiêu đề', render: (r: Article) => r.title.vi },
    { key: 'slug', label: 'Slug' },
    {
      key: 'published', label: 'Trạng thái', render: (r: Article) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {r.published ? 'Đã đăng' : 'Bản nháp'}
        </span>
      ),
    },
    { key: 'author', label: 'Tác giả', render: (r: Article) => r.author?.name ?? '—' },
    { key: 'createdAt', label: 'Ngày tạo', render: (r: Article) => new Date(r.createdAt).toLocaleDateString('vi-VN') },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3d2b25]">Bài viết</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B76E79] text-white text-sm font-medium hover:bg-[#a35d68] transition-colors"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminTable
        columns={columns}
        data={rows}
        loading={loading}
        actions={(row) => (
          <>
            <button
              onClick={() => togglePublish(row)}
              className={`p-1.5 rounded-lg transition-colors ${row.published ? 'text-green-600 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
              title={row.published ? 'Hủy đăng' : 'Đăng bài'}
            >
              {row.published ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-[#6b4c41] hover:bg-[#f5ede8] transition-colors">
              <Pencil size={15} />
            </button>
            <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {/* Create / Edit modal */}
      <AdminFormModal
        title={editId ? 'Sửa bài viết' : 'Thêm bài viết'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <AField label="Tiêu đề (VI)" value={form.titleVi} onChange={(v) => field('titleVi', v)} required />
            <AField label="Tiêu đề (KO)" value={form.titleKo} onChange={(v) => field('titleKo', v)} />
          </div>
          <AField label="Slug" value={form.slug} onChange={(v) => field('slug', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <AField label="Tóm tắt (VI)" value={form.excerptVi} onChange={(v) => field('excerptVi', v)} multiline />
            <AField label="Tóm tắt (KO)" value={form.excerptKo} onChange={(v) => field('excerptKo', v)} multiline />
          </div>
          <AField label="Nội dung" value={form.content} onChange={(v) => field('content', v)} multiline tall />
          <AField label="Tags (cách nhau bởi dấu phẩy)" value={form.tags} onChange={(v) => field('tags', v)} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-full border border-[#ddd0ca] text-sm text-[#6b4c41] hover:bg-[#f5ede8] transition-colors">Hủy</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-full bg-[#B76E79] text-white text-sm font-medium hover:bg-[#a35d68] disabled:opacity-60 transition-colors">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </AdminFormModal>

      {/* Delete confirm */}
      <AdminFormModal title="Xác nhận xóa" open={!!deleteId} onClose={() => setDeleteId(null)}>
        <p className="text-sm text-[#3d2b25] mb-5">Bạn có chắc muốn xóa bài viết này không?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-full border border-[#ddd0ca] text-sm text-[#6b4c41] hover:bg-[#f5ede8] transition-colors">Hủy</button>
          <button onClick={handleDelete} className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Xóa</button>
        </div>
      </AdminFormModal>
    </div>
  );
}

interface AFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  tall?: boolean;
}

function AField({ label, value, onChange, required, type = 'text', multiline, tall }: AFieldProps) {
  const base = 'w-full rounded-lg border border-[#ddd0ca] px-3 py-2 text-sm text-[#3d2b25] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 focus:border-[#B76E79]';
  return (
    <div>
      <label className="block text-xs font-medium text-[#6b4c41] mb-1 uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea className={`${base} resize-none ${tall ? 'h-36' : 'h-20'}`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={base} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
      )}
    </div>
  );
}
