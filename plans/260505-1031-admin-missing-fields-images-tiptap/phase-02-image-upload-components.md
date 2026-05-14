---
phase: 2
title: "Image Upload Components"
status: completed
effort: 3h
depends_on: [1]
---

# Phase 2: AdminImageUpload & AdminGalleryManager Components

## Overview

Create two reusable frontend components: `AdminImageUpload` (single image with preview) and `AdminGalleryManager` (multi-image grid). Both upload via `POST /uploads` endpoint from Phase 1.

## Key Insights

- `api-client.ts` currently only does JSON requests — need a new `apiUpload` helper for FormData (no `Content-Type` header, let browser set multipart boundary)
- Access token stored in module-level `accessToken` var via `getAccessToken()`
- API base URL: `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'`
- Image URLs returned as `/uploads/filename.ext` — must prefix with API_BASE for `<img src>`
- Existing admin UI uses K-beauty color palette: `#B76E79`, `#3d2b25`, `#f5ede8`, `#ddd0ca`

## Requirements

**Functional:**
- AdminImageUpload: click to upload, show preview, remove button, loading state, error display
- AdminGalleryManager: grid of thumbnails, add button, remove per-image, reorder not needed for MVP
- Both call `POST /uploads` with auth header

**Non-functional:**
- Match existing admin UI styling (rounded-lg, K-beauty colors)
- Handle upload errors gracefully
- Show loading spinner during upload

## Related Code Files

**Create:**
- `apps/web/components/admin/admin-image-upload.tsx`
- `apps/web/components/admin/admin-gallery-manager.tsx`

**Modify:**
- `apps/web/lib/api-client.ts` — add `apiUpload()` helper

## Implementation Steps

1. Add `apiUpload` to `apps/web/lib/api-client.ts`:
   ```typescript
   export async function apiUpload(file: File): Promise<{ url: string }> {
     const formData = new FormData();
     formData.append('file', file);
     const headers: Record<string, string> = {};
     const token = getAccessToken();
     if (token) headers['Authorization'] = `Bearer ${token}`;

     const res = await fetch(`${API_BASE}/uploads`, {
       method: 'POST',
       headers,
       body: formData,
     });
     if (!res.ok) {
       const err = await res.json().catch(() => ({}));
       throw new Error(err.message ?? 'Upload failed');
     }
     return res.json();
   }
   ```
   Note: DO NOT set Content-Type header — browser auto-sets multipart boundary.

2. Create `apps/web/components/admin/admin-image-upload.tsx`:
   ```
   Props: {
     value: string | null;
     onChange: (url: string | null) => void;
     label?: string;
   }
   ```
   **UI states:**
   - Empty: dashed border box (h-40), cloud-upload icon, "Click to upload" text
   - Uploading: spinner overlay on the box
   - Has value: image preview (object-cover) + absolute-positioned X button (top-right)
   - Error: red text below the box, auto-clears after 5s

   **Logic:**
   - Hidden `<input type="file" accept="image/*" ref={fileRef}>` triggered by box click
   - On file select: `setUploading(true)` → `apiUpload(file)` → `onChange(response.url)` → `setUploading(false)`
   - On remove: `onChange(null)`
   - Image src: if value starts with `/uploads/`, prefix with API_BASE; if full URL, use as-is

3. Create `apps/web/components/admin/admin-gallery-manager.tsx`:
   ```
   Props: {
     value: string[];
     onChange: (urls: string[]) => void;
     label?: string;
   }
   ```
   **UI:**
   - Label with count: "Thư viện ảnh (3)"
   - CSS grid (grid-cols-4 gap-2) of thumbnail cards (aspect-square, rounded-lg)
   - Each thumbnail: image + absolute X button (top-right corner)
   - Last grid item: "Add" button (dashed border, + icon) → triggers file input
   - Uploading state: show spinner in the "Add" slot

   **Logic:**
   - On upload success: `onChange([...value, newUrl])`
   - On remove: `onChange(value.filter((_, i) => i !== index))`
   - Same image URL resolution as AdminImageUpload

4. Helper for resolving image URLs — add to both components or extract:
   ```typescript
   const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
   function resolveImageUrl(url: string): string {
     if (url.startsWith('http')) return url;
     return `${API_BASE}${url}`;
   }
   ```

## Todo List

- [ ] Add `apiUpload()` to `api-client.ts`
- [ ] Create `admin-image-upload.tsx` with upload/preview/remove
- [ ] Create `admin-gallery-manager.tsx` with grid/add/remove
- [ ] Style both to match admin theme
- [ ] Handle upload errors with user-visible feedback
- [ ] Handle loading states with spinner
- [ ] Resolve `/uploads/` paths to full API_BASE URLs for img src
- [ ] Test: upload image → shows preview
- [ ] Test: remove image → clears value
- [ ] Test: gallery add/remove multiple images
- [ ] Test: upload error shows message

## Success Criteria

- AdminImageUpload: click → file picker → upload → preview displayed → remove clears it
- AdminGalleryManager: add multiple images → grid shows all → remove individual works
- Upload errors show user-friendly message
- Loading spinner visible during upload
- Visual style matches K-beauty admin theme

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| CORS on upload endpoint | Medium | API should already allow localhost:3000; verify CORS config |
| Large file upload timeout | Low | 5MB limit in backend; consider client-side size check too |
| Image URL resolution mismatch | Medium | Centralize URL resolution logic; handle both relative and absolute |

## Security Considerations

- File input restricted to `accept="image/*"`
- Auth token included in upload request
- No sensitive data exposed in component
