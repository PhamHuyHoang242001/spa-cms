'use client';

// admin/articles/page.tsx — Articles list + create/edit/publish/delete for SUPERADMIN
// Content field is plain textarea (no Tiptap for MVP)

import { useState } from 'react';
import { apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { AdminTable } from '@/components/admin/admin-table';
import { AdminFormModal } from '@/components/admin/admin-form-modal';
import { AdminImageUpload } from '@/components/admin/admin-image-upload';
import { AdminListBar, fmtAdminDate } from '@/components/admin/admin-list-bar';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { TiptapEditor } from '@/components/admin/tiptap-editor';
import { useAdminList } from '@/hooks/use-admin-list';
import { AdminBoolChoice } from '@/components/admin/admin-choice';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { Article } from '@/lib/api-types';
import { generateHTML } from '@tiptap/html';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';

const EMPTY_FORM = {
  slug: '',
  titleVi: '',
  titleKo: '',
  excerptVi: '',
  excerptKo: '',
  contentVi: '<p></p>',
  contentKo: '<p></p>',
  coverUrl: '',
  featured: false,
  tags: '',
};

type FormState = typeof EMPTY_FORM;

export default function ArticlesPage() {
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [contentTab, setContentTab] = useState<'vi' | 'ko'>('vi');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [published, setPublished] = useState('');
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
    sort,
    dir,
    sortPinned,
    applyColumnIcon,
  } = useAdminList<Article>({ url: '/articles/admin', extraParams: { published } });

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setContentTab('vi');
    setModalOpen(true);
  }

  function openEdit(row: Article) {
    const content = normalizeContent(row.content);
    setEditId(row.id);
    setForm({
      slug: row.slug,
      titleVi: row.title.vi,
      titleKo: row.title.ko,
      excerptVi: row.excerpt.vi,
      excerptKo: row.excerpt.ko,
      contentVi: content.vi,
      contentKo: content.ko,
      coverUrl: row.coverUrl ?? '',
      featured: row.featured ?? false,
      tags: (row.tags ?? []).join(', '),
    });
    setContentTab('vi');
    setModalOpen(true);
  }

  async function togglePublish(row: Article) {
    try {
      await apiPatch(`/articles/${row.id}/publish`, { published: !row.publishedAt });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: { vi: form.titleVi, ko: form.titleKo },
        excerpt: { vi: form.excerptVi, ko: form.excerptKo },
        content: { vi: form.contentVi, ko: form.contentKo },
        coverUrl: form.coverUrl || null,
        featured: form.featured,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (editId) {
        await apiPatch(`/articles/${editId}`, payload);
      } else {
        await apiPost('/articles', payload);
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
      await apiDelete(`/articles/${deleteId}`);
      setDeleteId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  }

  function field(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const columns = [
    { key: 'title', label: 'Tiêu đề', render: (r: Article) => r.title.vi },
    {
      key: 'featured', label: 'Nổi bật', render: (r: Article) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.featured ? 'Có' : 'Không'}
        </span>
      ),
    },
    {
      key: 'publishedAt', label: 'Trạng thái', sortKey: 'publishedAt', render: (r: Article) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.publishedAt ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {r.publishedAt ? 'Đã đăng' : 'Bản nháp'}
        </span>
      ),
    },
    { key: 'author', label: 'Tác giả', render: (r: Article) => r.author?.name ?? '—' },
    { key: 'createdAt', label: 'Tạo lúc', sortKey: 'createdAt', render: (r: Article) => <span className="whitespace-nowrap">{fmtAdminDate(r.createdAt)}</span> },
    { key: 'updatedAt', label: 'Sửa lúc', sortKey: 'updatedAt', render: (r: Article) => <span className="whitespace-nowrap">{fmtAdminDate(r.updatedAt)}</span> },
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

      <AdminListBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm bài viết theo tiêu đề..."
        filters={[{ key: 'published', label: 'Xuất bản', value: published, onChange: (v) => { setPage(1); setPublished(v); }, options: [{ value: 'true', label: 'Đã đăng' }, { value: 'false', label: 'Bản nháp' }] }]}
      />

      {(error || listError) && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error || listError}</div>
      )}

      <AdminTable
        columns={columns}
        data={rows}
        loading={loading}
        sort={sort}
        dir={dir}
        sortPinned={sortPinned}
        onSort={applyColumnIcon}
        actions={(row) => (
          <>
            <button type="button" onClick={() => togglePublish(row)} className={`px-3 py-1 text-xs ${row.publishedAt ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {row.publishedAt ? 'Đã đăng — gỡ' : 'Bản nháp — đăng'}
            </button>
            <button type="button" onClick={() => openEdit(row)} className="px-3 py-1 text-xs border border-[#ddd0ca]"><Pencil size={14} /> Sửa</button>
            <button type="button" onClick={() => setDeleteId(row.id)} className="px-3 py-1 text-xs bg-red-50 text-red-600"><Trash2 size={14} /> Xóa</button>
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
        title={editId ? 'Sửa bài viết' : 'Thêm bài viết'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidthClassName="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <AField label="Tiêu đề (VI)" value={form.titleVi} onChange={(v) => field('titleVi', v)} required />
            <AField label="Tiêu đề (KO)" value={form.titleKo} onChange={(v) => field('titleKo', v)} />
          </div>
          <AdminImageUpload
            value={form.coverUrl || null}
            onChange={(url) => field('coverUrl', url ?? '')}
            label="Ảnh bìa"
          />
          <div className="grid grid-cols-2 gap-3">
            <AField label="Tóm tắt (VI)" value={form.excerptVi} onChange={(v) => field('excerptVi', v)} multiline />
            <AField label="Tóm tắt (KO)" value={form.excerptKo} onChange={(v) => field('excerptKo', v)} multiline />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b4c41] mb-1 uppercase tracking-wider">Nội dung</label>
            <div className="mb-2 flex gap-1">
              <ContentTabButton active={contentTab === 'vi'} onClick={() => setContentTab('vi')}>
                Tiếng Việt
              </ContentTabButton>
              <ContentTabButton active={contentTab === 'ko'} onClick={() => setContentTab('ko')}>
                Hàn Quốc
              </ContentTabButton>
            </div>
            <TiptapEditor
              key={contentTab}
              value={contentTab === 'vi' ? form.contentVi : form.contentKo}
              onChange={(html) => field(contentTab === 'vi' ? 'contentVi' : 'contentKo', html)}
              placeholder={contentTab === 'vi' ? 'Nhập nội dung tiếng Việt...' : '한국어 내용을 입력하세요...'}
            />
          </div>
          <AdminBoolChoice label="Nổi bật trên blog" value={form.featured} onChange={(v) => field('featured', v)} />
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

const articleHtmlExtensions = [StarterKit, TiptapLink, TiptapImage];

function normalizeContent(content: Article['content']): { vi: string; ko: string } {
  if (typeof content === 'string') {
    return { vi: toHtml(content), ko: '<p></p>' };
  }
  if (content && typeof content === 'object') {
    const localized = content as Record<string, unknown>;
    return {
      vi: toHtml(localized.vi),
      ko: toHtml(localized.ko),
    };
  }
  return { vi: '<p></p>', ko: '<p></p>' };
}

function toHtml(value: unknown) {
  if (!value) return '<p></p>';
  if (typeof value === 'string') return ensureHtml(value);
  if (typeof value === 'object' && 'type' in value) {
    try {
      return generateHTML(value as never, articleHtmlExtensions);
    } catch {
      return '<p></p>';
    }
  }
  return '<p></p>';
}

function ensureHtml(value: string) {
  if (!value.trim()) return '<p></p>';
  return value.trim().startsWith('<') ? value : `<p>${escapeHtml(value)}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function ContentTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-lg border px-3 py-1.5 text-xs font-medium ${
        active
          ? 'border-[#ddd0ca] border-b-white bg-white text-[#3d2b25]'
          : 'border-transparent text-[#8a6a62] hover:text-[#3d2b25]'
      }`}
    >
      {children}
    </button>
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
