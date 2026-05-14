---
phase: 3
title: "Services Page — Add Missing Fields"
status: completed
effort: 2h
depends_on: [2]
---

# Phase 3: Services Page — Add Missing Fields

## Overview

Add coverUrl, gallery, order, and active fields to the services admin form. Backend already handles all these fields — only admin UI needs updating.

## Key Insights

- `EMPTY_FORM` currently has: slug, nameVi, nameKo, descVi, descKo, priceVnd, durationMin, featured
- Missing from form: `coverUrl`, `gallery`, `order`, `active`
- `ServiceRow` interface already has `active` and `featured` in the table columns
- Zod schemas (shared) accept: coverUrl (string.url optional), gallery (string[] url), featured (bool), order (int), active (bool)
- Backend create/update already handles all fields — just not sent from frontend

## Requirements

**Functional:**
- Cover image upload via AdminImageUpload
- Gallery management via AdminGalleryManager
- Order field (number input)
- Active toggle (checkbox)
- All fields populated when editing existing service
- All fields included in create/update API payload

**Non-functional:**
- Form layout clean, cover image at top, gallery below it

## Related Code Files

**Modify:**
- `apps/web/app/admin/services/page.tsx`

**No create/delete.**

## Implementation Steps

1. Add imports at top of file:
   ```typescript
   import { AdminImageUpload } from '@/components/admin/admin-image-upload';
   import { AdminGalleryManager } from '@/components/admin/admin-gallery-manager';
   ```

2. Update `ServiceRow` interface — add missing fields if not present:
   ```typescript
   coverUrl?: string | null;
   gallery?: string[];
   order?: number;
   ```

3. Update `EMPTY_FORM` — add new fields:
   ```typescript
   const EMPTY_FORM = {
     slug: '', nameVi: '', nameKo: '', descVi: '', descKo: '',
     priceVnd: '', durationMin: '',
     coverUrl: '' as string,
     gallery: [] as string[],
     order: '0',
     featured: false,
     active: true,
   };
   ```
   Note: `FormState` type derives from `typeof EMPTY_FORM` — adding gallery as `string[]` changes the type correctly.

4. Update `openEdit` — populate new fields from `ServiceRow`:
   ```typescript
   coverUrl: row.coverUrl ?? '',
   gallery: row.gallery ?? [],
   order: String(row.order ?? 0),
   active: row.active,
   ```

5. Update `handleSave` payload — include new fields:
   ```typescript
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
   ```

6. Update `field()` helper — currently typed for `string | boolean`, need to handle `string[]` too. Consider separate setter for gallery:
   ```typescript
   function setGallery(urls: string[]) {
     setForm(prev => ({ ...prev, gallery: urls }));
   }
   ```

7. Add form UI fields inside `<form>` before the slug field:
   ```jsx
   {/* Cover Image */}
   <AdminImageUpload
     value={form.coverUrl || null}
     onChange={(url) => setForm(prev => ({ ...prev, coverUrl: url ?? '' }))}
     label="Ảnh bìa"
   />

   {/* Gallery */}
   <AdminGalleryManager
     value={form.gallery}
     onChange={setGallery}
     label="Thư viện ảnh"
   />
   ```

8. Add order + active fields after the featured checkbox:
   ```jsx
   <div className="grid grid-cols-2 gap-3">
     <Field label="Thứ tự hiển thị" value={form.order} onChange={v => field('order', v)} type="number" />
     <label className="flex items-center gap-2 text-sm text-[#3d2b25] self-end pb-2">
       <input type="checkbox" checked={form.active}
         onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))} className="rounded" />
       Đang hoạt động
     </label>
   </div>
   ```

9. Update modal `maxWidthClassName` to `max-w-2xl` to accommodate image fields:
   ```jsx
   <AdminFormModal ... maxWidthClassName="max-w-2xl">
   ```

## Todo List

- [ ] Import AdminImageUpload, AdminGalleryManager
- [ ] Add coverUrl, gallery, order, active to EMPTY_FORM
- [ ] Update ServiceRow with coverUrl, gallery, order
- [ ] Update openEdit to populate new fields
- [ ] Update handleSave payload with new fields
- [ ] Add AdminImageUpload for coverUrl in form
- [ ] Add AdminGalleryManager for gallery in form
- [ ] Add order number input
- [ ] Add active checkbox
- [ ] Widen modal to max-w-2xl
- [ ] Test: create service with cover image + gallery
- [ ] Test: edit service loads existing cover/gallery
- [ ] Test: remove cover image, save, verify null sent

## Success Criteria

- Admin can upload/remove cover image when creating/editing service
- Admin can add/remove gallery images
- Order and active fields work correctly
- Existing services load all fields when editing
- Form submits all fields to backend successfully

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Form state type mismatch (string[] gallery vs string field helper) | Medium | Use separate setter for gallery; avoid generic `field()` for non-string values |
| Zod validation rejects coverUrl if not valid URL | Medium | Upload returns `/uploads/...` — may need to pass full URL or adjust Zod to allow relative paths |

## Security Considerations

- Same auth context as existing form
- No new security surface — uses existing upload endpoint
