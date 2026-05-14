---
phase: 6
title: "Articles Page — Add Missing Fields + Tiptap Integration"
status: completed
effort: 3h
depends_on: [2, 5]
---

# Phase 6: Articles Page — Missing Fields + Tiptap Integration

## Overview

Add coverUrl and featured fields to articles admin form. Fix content normalization to handle both Tiptap JSON (from seed data) and HTML strings. Editor already integrated — this phase adds missing form fields and improves content handling.

## Key Insights

**Current articles page state:**
- TiptapEditor already imported and used for content editing
- Content tabs (vi/ko) already working
- Form state: `contentVi` and `contentKo` as strings (HTML)
- `normalizeContent()` converts API response to `{ vi: string, ko: string }` HTML
- Missing from form: `coverUrl`, `featured`
- `Article` type in api-types.ts has `content: LocalizedString | string` — doesn't account for Tiptap JSON objects

**DB content reality:**
- Seed data stores Tiptap JSON objects: `{ type: 'doc', content: [...] }`
- User-created articles (via current form) store HTML strings
- `normalizeContent` must handle BOTH formats

**Zod schemas (article-schemas.ts):**
- Create: `coverUrl: z.string().url().optional()`, `featured: z.boolean().default(false)`
- Update: `coverUrl: z.string().url().optional().nullable()`, `featured: z.boolean().optional()`

## Requirements

**Functional:**
- Cover image upload via AdminImageUpload
- Featured toggle via checkbox
- Content normalization handles Tiptap JSON → HTML conversion
- Existing articles with Tiptap JSON content load correctly in editor

**Non-functional:**
- No content data loss when editing seed articles
- Form consistent with services/doctors pages

## Related Code Files

**Modify:**
- `apps/web/app/admin/articles/page.tsx`

**No create/delete.** Tiptap editor fixes handled in Phase 5.

## Implementation Steps

1. Add imports:
   ```typescript
   import { AdminImageUpload } from '@/components/admin/admin-image-upload';
   import { generateHTML } from '@tiptap/html';
   import StarterKit from '@tiptap/starter-kit';
   import TiptapLink from '@tiptap/extension-link';
   import TiptapImage from '@tiptap/extension-image';
   ```

2. Update `EMPTY_FORM` — add coverUrl and featured:
   ```typescript
   const EMPTY_FORM = {
     slug: '',
     titleVi: '', titleKo: '',
     excerptVi: '', excerptKo: '',
     contentVi: '<p></p>',
     contentKo: '<p></p>',
     tags: '',
     coverUrl: '' as string,
     featured: false,
   };
   ```

3. Update `Article` type usage — the content field from API can be:
   - `{ vi: string, ko: string }` (HTML strings from user edits)
   - `{ vi: TiptapJSON, ko: TiptapJSON }` (JSON objects from seed)
   - `string` (legacy fallback)

4. Fix `normalizeContent` to handle Tiptap JSON:
   ```typescript
   const extensions = [StarterKit, TiptapLink, TiptapImage];

   function toHtml(value: unknown): string {
     if (!value) return '<p></p>';
     if (typeof value === 'string') {
       return value.trim() ? (value.trim().startsWith('<') ? value : `<p>${escapeHtml(value)}</p>`) : '<p></p>';
     }
     // Tiptap JSON object
     if (typeof value === 'object' && value !== null && 'type' in value) {
       try {
         return generateHTML(value as Record<string, unknown>, extensions);
       } catch {
         return '<p></p>';
       }
     }
     return '<p></p>';
   }

   function normalizeContent(content: unknown): { vi: string; ko: string } {
     if (typeof content === 'string') {
       return { vi: toHtml(content), ko: '<p></p>' };
     }
     if (content && typeof content === 'object') {
       const c = content as Record<string, unknown>;
       return { vi: toHtml(c.vi), ko: toHtml(c.ko) };
     }
     return { vi: '<p></p>', ko: '<p></p>' };
   }
   ```

5. Update `openEdit` — populate new fields:
   ```typescript
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
       tags: (row.tags ?? []).join(', '),
       coverUrl: (row as Record<string, unknown>).coverUrl as string ?? '',
       featured: (row as Record<string, unknown>).featured as boolean ?? false,
     });
     setContentTab('vi');
     setModalOpen(true);
   }
   ```
   Note: `Article` interface in `api-types.ts` may need `coverUrl` and `featured` fields added.

6. Update `Article` type in `apps/web/lib/api-types.ts`:
   ```typescript
   export interface Article {
     id: string;
     slug: string;
     title: LocalizedString;
     excerpt: LocalizedString;
     content: LocalizedString | string | Record<string, unknown>;
     coverUrl?: string | null;
     tags: string[];
     featured?: boolean;
     publishedAt?: string | null;
     author?: { id: string; name: string };
     createdAt: string;
     updatedAt: string;
   }
   ```

7. Update `handleSave` payload — include coverUrl and featured:
   ```typescript
   const payload = {
     slug: form.slug,
     title: { vi: form.titleVi, ko: form.titleKo },
     excerpt: { vi: form.excerptVi, ko: form.excerptKo },
     content: { vi: form.contentVi, ko: form.contentKo },
     tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
     coverUrl: form.coverUrl || null,
     featured: form.featured,
   };
   ```

8. Add form UI fields — cover image after slug, featured before tags:
   ```jsx
   {/* After slug field */}
   <AdminImageUpload
     value={form.coverUrl || null}
     onChange={(url) => setForm(prev => ({ ...prev, coverUrl: url ?? '' }))}
     label="Ảnh bìa"
   />

   {/* After content editor, before tags */}
   <label className="flex items-center gap-2 text-sm text-[#3d2b25]">
     <input type="checkbox" checked={form.featured}
       onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
       className="rounded" />
     Bài viết nổi bật
   </label>
   ```

9. Add `featured` column to table (optional):
   ```typescript
   {
     key: 'featured', label: 'Nổi bật',
     render: (r: Article) => (r as Record<string, unknown>).featured ? 'Co' : '—',
   },
   ```

## Todo List

- [ ] Import AdminImageUpload and generateHTML
- [ ] Add coverUrl, featured to EMPTY_FORM
- [ ] Update Article type in api-types.ts with coverUrl, featured
- [ ] Fix normalizeContent to handle Tiptap JSON → HTML conversion
- [ ] Update openEdit with coverUrl, featured
- [ ] Update handleSave payload with coverUrl, featured
- [ ] Add AdminImageUpload in form
- [ ] Add featured checkbox in form
- [ ] Add featured column to table (optional)
- [ ] Test: edit seed article (Tiptap JSON) → loads in editor correctly
- [ ] Test: create new article with cover + featured
- [ ] Test: edit existing article → cover/featured preserved
- [ ] Test: content round-trip (HTML saved, HTML loaded)

## Success Criteria

- Seed articles with Tiptap JSON content load correctly in editor
- Admin can set cover image and featured flag for articles
- Content editing preserves formatting across save/reload
- New articles save content as HTML strings
- No data loss when editing existing articles

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `generateHTML` throws on malformed Tiptap JSON | Medium | Wrap in try/catch, fallback to `<p></p>` |
| Content type mismatch (backend expects JSON but receives HTML string) | High | Backend stores `content` as JSON field — `{ vi: "html", ko: "html" }` is valid JSON; works fine |
| Zod rejects coverUrl as non-URL (relative path) | Medium | Send full URL from frontend or adjust backend validation |
| `@tiptap/html` not SSR-safe | Low | Component is 'use client', no SSR issue |

## Security Considerations

- Same auth as existing form
- HTML content from Tiptap is sanitized by the editor
- Cover image goes through authenticated upload endpoint
