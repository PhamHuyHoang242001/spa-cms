---
phase: 06
title: "Tiptap WYSIWYG Editor for Articles"
status: pending
priority: P2
effort: 1.5d
dependencies: []
---

# Phase 06 — Tiptap WYSIWYG Editor for Articles

## Context Links
- [Articles page](../../apps/web/app/admin/articles/page.tsx) — uses plain `<textarea>` for content, single `content` field (not per-locale)
- [Articles service](../../apps/api/src/articles/articles.service.ts) — stores `content` as Prisma `Json` column
- [Prisma schema](../../apps/api/prisma/schema.prisma) — `content Json // { vi: TiptapJSON, ko: TiptapJSON }` comment but currently stores string or `{ vi: string }`
- [API types](../../apps/web/lib/api-types.ts) — `content: LocalizedString | string`
- [Web package.json](../../apps/web/package.json) — current deps (no tiptap)

## Overview

Replace the plain textarea content editor on the articles admin page with a Tiptap WYSIWYG editor. Support bilingual content (vi + ko) via tab switching. Store content as HTML strings in the existing JSON column. Handle backward compat with existing plaintext articles.

## Key Insights

- Current articles store content as either plain string or `{ vi: string }` — inconsistent
- Tiptap outputs HTML by default; we store HTML string per locale in `content: { vi: "<p>...", ko: "<p>..." }`
- No backend schema changes needed — `content` is already a `Json` column
- Existing plaintext articles need migration on load: wrap in `<p>` tags if not HTML
- Tiptap `@tiptap/react` works with React 19 (verify compatibility)
- Article form modal is width-constrained (`max-w-lg`); Tiptap editor needs more space — consider expanding modal or using full-page editor
- Decision: expand modal to `max-w-2xl` for article create/edit to accommodate editor

## Requirements

### Functional
- Rich text toolbar: bold, italic, headings (H1-H3), bullet list, ordered list, link, image URL
- Two-tab content editor: "Tieng Viet" and "Han Quoc" tabs
- Each tab has its own Tiptap editor instance with independent content
- On save: `content: { vi: htmlVi, ko: htmlKo }` sent to API
- On load: detect if content is plain string, wrap in `<p>` for display
- Placeholder text when editor is empty

### Non-functional
- Editor min-height: 200px
- Toolbar styled to match admin design system
- Works on desktop (mobile editor UX is acceptable but not prioritized)
- Bundle size: Tiptap starter-kit + 3 extensions is ~50KB gzipped — acceptable

## Architecture

```
TiptapEditor (reusable component)
  ├── Toolbar (button row: B, I, H1, H2, H3, UL, OL, Link, Image)
  └── EditorContent (Tiptap rendering area)

ArticlesPage (modified)
  └── AdminFormModal (max-w-2xl)
      ├── Title, slug, excerpt fields (unchanged)
      ├── Tab bar: [Tieng Viet] [Han Quoc]
      ├── TiptapEditor (for active tab's content)
      └── Tags, save/cancel buttons
```

## Related Code Files

### Files to Create
- `apps/web/components/admin/tiptap-editor.tsx` — Rich text editor component

### Files to Modify
- `apps/web/package.json` — Add tiptap dependencies
- `apps/web/app/admin/articles/page.tsx` — Replace textarea with TiptapEditor, add locale tabs, expand modal

## Implementation Steps

### Step 1: Install Tiptap Dependencies

```bash
pnpm --filter web add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder
```

Packages:
- `@tiptap/react` — React integration
- `@tiptap/starter-kit` — bold, italic, headings, lists, code, blockquote, etc.
- `@tiptap/extension-link` — clickable links
- `@tiptap/extension-image` — image insertion via URL
- `@tiptap/extension-placeholder` — placeholder text

### Step 2: Create TiptapEditor Component

Create `apps/web/components/admin/tiptap-editor.tsx`:

```tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Link as LinkIcon, ImageIcon,
} from 'lucide-react';
import { useEffect } from 'react';

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder = 'Nhap noi dung...' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#B76E79] underline' } }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none',
      },
    },
  });

  // Sync external value changes (e.g. tab switch)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-[#ddd0ca] bg-[#fdfaf8] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-[#ede4de] bg-[#f5ede8]">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold size={15} />}
          title="In dam"
        />
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic size={15} />}
          title="In nghieng"
        />
        <Separator />
        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={<Heading1 size={15} />}
          title="Tieu de 1"
        />
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 size={15} />}
          title="Tieu de 2"
        />
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 size={15} />}
          title="Tieu de 3"
        />
        <Separator />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List size={15} />}
          title="Danh sach"
        />
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<ListOrdered size={15} />}
          title="Danh sach so"
        />
        <Separator />
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          icon={<LinkIcon size={15} />}
          title="Lien ket"
        />
        <ToolbarButton
          active={false}
          onClick={() => {
            const url = window.prompt('URL hinh anh:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          icon={<ImageIcon size={15} />}
          title="Hinh anh"
        />
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}

// -- Toolbar sub-components --

function ToolbarButton({ active, onClick, icon, title }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-[#B76E79]/20 text-[#B76E79]' : 'text-[#6b4c41] hover:bg-[#ede4de]'
      }`}
    >
      {icon}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-[#ddd0ca] mx-1 self-center" />;
}
```

### Step 3: Modify Articles Page

Key changes to `apps/web/app/admin/articles/page.tsx`:

1. **Update form state** — replace single `content: string` with `contentVi: string` and `contentKo: string`:
   ```ts
   const EMPTY_FORM = {
     slug: '',
     titleVi: '',
     titleKo: '',
     excerptVi: '',
     excerptKo: '',
     contentVi: '',
     contentKo: '',
     tags: '',
   };
   ```

2. **Add content tab state**:
   ```ts
   const [contentTab, setContentTab] = useState<'vi' | 'ko'>('vi');
   ```

3. **Load content per locale** in `openEdit`:
   ```ts
   function openEdit(row: Article) {
     const content = row.content;
     let vi = '', ko = '';
     if (typeof content === 'string') {
       // Legacy plain string — treat as Vietnamese, wrap in <p> if not HTML
       vi = content.startsWith('<') ? content : `<p>${content}</p>`;
     } else if (content && typeof content === 'object') {
       const c = content as { vi?: string; ko?: string };
       vi = c.vi ?? '';
       ko = c.ko ?? '';
       // Wrap plain text in <p> if not HTML
       if (vi && !vi.startsWith('<')) vi = `<p>${vi}</p>`;
       if (ko && !ko.startsWith('<')) ko = `<p>${ko}</p>`;
     }
     setForm({ ..., contentVi: vi, contentKo: ko });
     setContentTab('vi');
   }
   ```

4. **Update save payload**:
   ```ts
   const payload = {
     slug: form.slug,
     title: { vi: form.titleVi, ko: form.titleKo },
     excerpt: { vi: form.excerptVi, ko: form.excerptKo },
     content: { vi: form.contentVi, ko: form.contentKo },
     tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
   };
   ```

5. **Replace textarea with tab bar + TiptapEditor** in modal form:
   ```tsx
   {/* Content tabs */}
   <div>
     <div className="flex gap-1 mb-2">
       <button
         type="button"
         onClick={() => setContentTab('vi')}
         className={`px-3 py-1.5 rounded-t-lg text-xs font-medium ${
           contentTab === 'vi'
             ? 'bg-[#fdfaf8] text-[#3d2b25] border border-b-0 border-[#ddd0ca]'
             : 'text-[#8a6a62] hover:text-[#3d2b25]'
         }`}
       >
         Tieng Viet
       </button>
       <button
         type="button"
         onClick={() => setContentTab('ko')}
         className={`px-3 py-1.5 rounded-t-lg text-xs font-medium ${
           contentTab === 'ko'
             ? 'bg-[#fdfaf8] text-[#3d2b25] border border-b-0 border-[#ddd0ca]'
             : 'text-[#8a6a62] hover:text-[#3d2b25]'
         }`}
       >
         Han Quoc
       </button>
     </div>
     {contentTab === 'vi' ? (
       <TiptapEditor
         value={form.contentVi}
         onChange={(html) => field('contentVi', html)}
         placeholder="Noi dung tieng Viet..."
       />
     ) : (
       <TiptapEditor
         value={form.contentKo}
         onChange={(html) => field('contentKo', html)}
         placeholder="Noi dung tieng Han..."
       />
     )}
   </div>
   ```

6. **Expand modal width**: Change AdminFormModal panel from `max-w-lg` to `max-w-2xl` for article modals. Two options:
   - Add optional `size` prop to AdminFormModal
   - Or wrap in a custom div override

   Preferred: add `maxWidth?: string` prop to AdminFormModal:
   ```tsx
   // admin-form-modal.tsx — add optional maxWidth prop
   interface AdminFormModalProps {
     title: string;
     open: boolean;
     onClose: () => void;
     children: React.ReactNode;
     maxWidth?: string; // default 'max-w-lg'
   }
   ```
   
   Then in articles page: `<AdminFormModal maxWidth="max-w-2xl" ...>`

### Step 4: Add Tiptap Prose Styles

Add minimal Tiptap prose styles to `apps/web/app/globals.css` (or Tailwind `@layer`):

```css
/* Tiptap editor prose overrides */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #a89080;
  pointer-events: none;
  height: 0;
}

.tiptap img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}
```

Tailwind Typography plugin (`@tailwindcss/typography`) provides the `prose` class used in editor props. If not installed, add it or use manual prose-like styles.

Check if `@tailwindcss/typography` is already in deps. If not:
```bash
pnpm --filter web add @tailwindcss/typography
```

### Step 5: Verify Tiptap + React 19 Compatibility

- Tiptap v2.x supports React 18+; verify with React 19
- If issues: check tiptap GitHub for React 19 compat patches
- Fallback: pin `@tiptap/react` to latest compatible version

## Todo List

- [ ] Install tiptap packages
- [ ] Create `TiptapEditor` component with toolbar
- [ ] Add `maxWidth` prop to `AdminFormModal`
- [ ] Update articles page form state for vi/ko content
- [ ] Add content tab switching (vi/ko)
- [ ] Replace textarea with TiptapEditor
- [ ] Handle legacy plaintext content on load (wrap in `<p>`)
- [ ] Update save payload to send `{ vi, ko }` content
- [ ] Add Tiptap prose CSS styles
- [ ] Install `@tailwindcss/typography` if needed
- [ ] Test: create article with rich text (bold, heading, list)
- [ ] Test: edit existing plaintext article (auto-wraps in `<p>`)
- [ ] Test: switch between vi/ko tabs preserves content
- [ ] Test: link and image insertion
- [ ] Verify React 19 compatibility

## Success Criteria

- Tiptap editor renders with functional toolbar
- Bold, italic, headings, lists, links, images all work
- Vi/Ko tab switching preserves content independently
- Saved articles store HTML in `content: { vi: "...", ko: "..." }`
- Existing plaintext articles display correctly in editor
- Editor fits within expanded modal without overflow

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Tiptap + React 19 incompatibility | High | Check compat before starting; fallback to `@tiptap/react@2.1.x` |
| `@tailwindcss/typography` conflicts with existing styles | Low | Scope prose class to editor container only |
| HTML content XSS on public site | Medium | Sanitize HTML on render in public blog pages (use `sanitize-html` or `DOMPurify`) |
| Large bundle size from Tiptap | Low | ~50KB gzipped; only loaded on admin articles page (code-split) |

## Security Considerations

- Tiptap output is HTML — must sanitize before rendering on public blog pages to prevent XSS
- Image extension only supports URL (no base64) — prevents large payload injection
- Admin-only component; not exposed to public users
- Link URLs should be validated (Tiptap link extension handles basic validation)
