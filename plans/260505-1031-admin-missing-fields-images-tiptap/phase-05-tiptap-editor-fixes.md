---
phase: 5
title: "Tiptap Editor Fixes"
status: completed
effort: 2h
depends_on: []
---

# Phase 5: Tiptap Editor Fixes

## Overview

The Tiptap editor component already exists and is integrated with the articles page. This phase covers fixes, enhancements, and ensuring robust content handling.

## Key Insights

**Current state of `tiptap-editor.tsx`:**
- Already fully functional with toolbar (bold, italic, H1-H3, lists, link, image)
- Uses HTML string for value/onChange: `value: string`, `onChange: (html: string) => void`
- Styled with K-beauty theme colors
- `immediatelyRender: false` set (SSR-safe)
- Uses `useEffect` to sync external value changes

**Current state of articles page:**
- Already imports and uses `TiptapEditor`
- Content stored as HTML strings in form state
- `normalizeContent()` converts DB content to HTML strings
- Content tabs (vi/ko) already implemented
- `key={contentTab}` forces editor remount on tab switch

**DB content format:**
- Prisma schema: `content Json` — stores `{ vi: TiptapJSON, ko: TiptapJSON }`
- Seed data uses Tiptap JSON: `{ type: 'doc', content: [...] }`
- But articles page normalizes everything to HTML via `ensureHtml()`

**Decision: Keep HTML workflow.** The editor already works with HTML. Tiptap's `useEditor` accepts HTML string as `content` and `getHTML()` in `onUpdate` returns HTML. Switching to JSON requires changing how content is stored/retrieved across the stack. Not worth the complexity for MVP.

## Requirements

**Functional:**
- Image insertion via upload (not just URL prompt) — integrate with AdminImageUpload
- Ensure editor handles empty/null content gracefully
- Content survives round-trip: edit → save → reload → edit

**Non-functional:**
- No content loss on tab switch between vi/ko
- Editor toolbar usable on mobile (flex-wrap already in place)

## Related Code Files

**Modify:**
- `apps/web/components/admin/tiptap-editor.tsx`

**No create/delete.**

## Implementation Steps

1. **Enhance image insertion to support file upload:**

   Currently uses `window.prompt('URL hình ảnh:')`. Add option to upload via file input:
   ```typescript
   // Add a hidden file input ref
   const imageInputRef = useRef<HTMLInputElement>(null);

   // Image toolbar button: show choice — URL or Upload
   // Simplest approach: change to file upload by default
   async function handleImageUpload() {
     imageInputRef.current?.click();
   }

   async function onImageFileSelected(e: ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;
     try {
       const { url } = await apiUpload(file);
       const fullUrl = resolveImageUrl(url);
       editor?.chain().focus().setImage({ src: fullUrl }).run();
     } catch {
       // Could show error, but keep simple for now
     }
     e.target.value = ''; // reset
   }
   ```

   Add hidden input in JSX:
   ```jsx
   <input ref={imageInputRef} type="file" accept="image/*"
     className="hidden" onChange={onImageFileSelected} />
   ```

2. **Add import for apiUpload:**
   ```typescript
   import { apiUpload } from '@/lib/api-client';
   ```

3. **Add resolveImageUrl helper** (or import from shared util):
   ```typescript
   const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
   function resolveImageUrl(url: string): string {
     if (url.startsWith('http')) return url;
     return `${API_BASE}${url}`;
   }
   ```

4. **Handle null/undefined content gracefully:**
   Current: `content: value` where value is string. If value is empty string, editor shows empty. Already handles this via `useEffect` that calls `setContent(value || '<p></p>')`. Looks good.

5. **Verify content round-trip:**
   - Editor receives HTML → displays it
   - Editor onChange returns HTML via `getHTML()`
   - Form sends HTML to backend as `content.vi` / `content.ko`
   - Backend stores it in JSON field
   - On edit: backend returns JSON, frontend normalizes to HTML
   - Key concern: if backend stored Tiptap JSON (from seed), `normalizeContent()` in articles page receives an object, not HTML string. Current `ensureHtml()` calls `.trim()` on the value — this would fail on objects.

6. **Fix `normalizeContent` in articles page** (this may belong in Phase 6 but noting it here):
   The function must handle:
   - String content (HTML) → use as-is
   - Tiptap JSON object → convert to HTML using `generateHTML` from `@tiptap/html`
   - Null/undefined → default `<p></p>`

   ```typescript
   import { generateHTML } from '@tiptap/html';
   import StarterKit from '@tiptap/starter-kit';
   import TiptapLink from '@tiptap/extension-link';
   import Image from '@tiptap/extension-image';

   function tiptapJsonToHtml(json: Record<string, unknown>): string {
     try {
       return generateHTML(json, [StarterKit, TiptapLink, Image]);
     } catch {
       return '<p></p>';
     }
   }
   ```

7. **Optional: Add underline extension** — skip for MVP, starter-kit covers most needs.

## Todo List

- [ ] Add file upload capability for images in toolbar
- [ ] Import apiUpload in tiptap-editor.tsx
- [ ] Add resolveImageUrl helper
- [ ] Add hidden file input + ref for image upload
- [ ] Handle image upload errors gracefully
- [ ] Verify null/empty content handling
- [ ] Document content round-trip flow for articles page (Phase 6 integration)
- [ ] Test: insert image via upload
- [ ] Test: editor loads HTML content correctly
- [ ] Test: editor loads empty/null content without error

## Success Criteria

- Image upload from editor toolbar works (file picker → upload → inserted in content)
- Editor handles empty, null, HTML, and Tiptap JSON inputs without crashing
- Content round-trip (edit → save → reload → edit) preserves formatting
- No regression in existing toolbar functionality

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `@tiptap/html` `generateHTML` import increases bundle | Low | Already using tiptap; minor addition |
| Image upload fails silently in editor | Medium | Add try/catch with subtle error feedback |
| Tiptap JSON from seed not rendering in HTML mode | High | Use `generateHTML` to convert; test with seed data |

## Security Considerations

- Image upload goes through same authenticated endpoint
- No XSS concern — Tiptap sanitizes HTML output
- External image URLs allowed (via URL prompt fallback) — acceptable for admin-only use
