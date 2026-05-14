# Brainstorm: Admin Missing Fields, Image Upload & Articles

**Date:** 2026-05-05 | **Type:** Brainstorm Report | **Status:** Agreed

## Problem Statement

Admin CRUD pages missing several DB-supported fields. Backend & schema fully support these fields but admin forms never send them:

| Field | Service | Doctor | Article |
|-------|---------|--------|---------|
| coverUrl / avatarUrl | Missing | Missing | Missing |
| gallery[] | Missing | — | — |
| featured | Missing | — | Missing |
| order | Missing | Missing | — |
| active toggle | Missing (no UI) | Exists (button) | — (publish button) |

Additionally, articles use plain textarea for content — need Tiptap WYSIWYG editor. Content stored as Tiptap JSON in DB already.

## Requirements (User-Confirmed)

1. **Image upload via server** — backend file upload endpoint, NOT URL-only input
2. **Tiptap WYSIWYG editor** for article content (vi + ko)
3. **Gallery management** for services (multiple images)
4. **All missing fields** exposed in admin forms

## Recommended Solution

### 1. Backend Upload Endpoint

**Approach:** NestJS Multer + local disk storage → static file serving

New module: `apps/api/src/uploads/`
- `POST /uploads` — accept `multipart/form-data`, single file, SUPERADMIN/DOCTOR only
- Save to `apps/api/uploads/` directory
- Return `{ url: "/uploads/{timestamp}-{filename}" }`
- Serve static files via NestJS `ServeStaticModule` from `/uploads` path
- Validations: max 5MB, allowed types: jpg/jpeg/png/webp/gif
- Auto-generate unique filename: `{timestamp}-{random}.{ext}`

**Why local disk (not cloud)?**
- Simplest for MVP, no external dependency
- Can migrate to Cloudinary/S3 later by just changing upload destination
- `ServeStaticModule` built into NestJS

### 2. Reusable Frontend Components

**AdminImageUpload** (`apps/web/components/admin/admin-image-upload.tsx`)
- Props: `value: string | null`, `onChange: (url: string | null) => void`, `label: string`
- Click to upload or drag-drop
- Preview current image with remove button
- Calls `POST /uploads` via `apiPost` with FormData
- Shows upload progress/error states

**AdminGalleryManager** (`apps/web/components/admin/admin-gallery-manager.tsx`)
- Props: `value: string[]`, `onChange: (urls: string[]) => void`
- Grid of image thumbnails + "Add" button
- Each image has remove button
- Reuses upload logic from AdminImageUpload

**TiptapEditor** (`apps/web/components/admin/tiptap-editor.tsx`)
- Props: `value: object | null` (Tiptap JSON), `onChange: (json: object) => void`
- Toolbar: bold, italic, heading (1-3), bullet list, ordered list, link, image (URL insert)
- Content stored as Tiptap JSON (matches existing DB format)
- Packages: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`

### 3. Admin Page Updates

**Services page** — add to form:
- `coverUrl` → AdminImageUpload
- `gallery` → AdminGalleryManager
- `featured` → checkbox
- `order` → number input
- `active` → checkbox (or keep as toggle button in table)

**Doctors page** — add to form:
- `avatarUrl` → AdminImageUpload
- `order` → number input

**Articles page** — add to form:
- `coverUrl` → AdminImageUpload
- `featured` → checkbox
- Replace textarea `contentVi`/`contentKo` → TiptapEditor components
- Keep tab switching for vi/ko content

### 4. No Schema/Backend Service Changes Needed

All fields already exist in:
- Prisma schema (coverUrl, avatarUrl, gallery, featured, order)
- Shared Zod schemas (validated)
- Backend services (handled in create/update methods)

Only addition: upload module + static serving.

## Implementation Phases

| Phase | Scope | Effort | Deps |
|-------|-------|--------|------|
| A | Backend upload endpoint + static serving | 0.5d | None |
| B | AdminImageUpload + AdminGalleryManager components | 0.5d | Phase A |
| C | Services page: add all missing fields | 0.5d | Phase B |
| D | Doctors page: add avatarUrl + order | 0.5d | Phase B |
| E | Tiptap editor component | 0.5d | None |
| F | Articles page: coverUrl + featured + Tiptap | 0.5d | Phase B, E |

Total: ~3 days. Phases A+E parallel, then B, then C+D+F parallel.

## Risks

| Risk | Mitigation |
|------|------------|
| Large file uploads slow | 5MB limit, accept only images |
| Disk space on server | Clean orphaned uploads periodically (future) |
| Tiptap bundle size | Lazy load, admin-only pages |
| Existing article content format | Already Tiptap JSON — direct compatibility |

## Success Criteria

- [ ] Admin can upload images for doctors, services, articles
- [ ] Service gallery supports multiple image management
- [ ] All missing fields (featured, order, coverUrl, etc.) visible and editable in admin forms
- [ ] Tiptap editor renders content correctly for vi + ko
- [ ] Uploaded images display on public pages (service cards, doctor profiles, article previews)
- [ ] No regressions in existing CRUD operations
