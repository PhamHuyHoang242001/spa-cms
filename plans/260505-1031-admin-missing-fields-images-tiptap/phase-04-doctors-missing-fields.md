---
phase: 4
title: "Doctors Page — Add Missing Fields"
status: completed
effort: 1.5h
depends_on: [2]
---

# Phase 4: Doctors Page — Add Missing Fields

## Overview

Add avatarUrl and order fields to the doctors admin form. Backend already handles both fields.

## Key Insights

- `DoctorApiRow` from API returns nested structure: `{ id, user: { id, name, email }, specialty, bio, yearsExp, active }`
- API response likely includes `avatarUrl` and `order` — but `DoctorApiRow` interface doesn't declare them
- `DoctorRow` (flattened) also missing these fields
- Zod schema accepts: `avatarUrl` (string.url optional), `order` (int min 0)
- Doctor PATCH goes to `/doctors/${id}` — backend `updateDoctor` method already handles avatarUrl + order
- Doctor POST to `/doctors` creates user + profile — need to check if it accepts avatarUrl

## Requirements

**Functional:**
- Avatar upload via AdminImageUpload
- Order field (number input)
- Avatar populated when editing existing doctor
- Avatar included in PATCH payload for update

**Non-functional:**
- Avatar shown prominently at top of form
- Consistent styling with other admin forms

## Related Code Files

**Modify:**
- `apps/web/app/admin/doctors/page.tsx`

**No create/delete.**

## Implementation Steps

1. Add import:
   ```typescript
   import { AdminImageUpload } from '@/components/admin/admin-image-upload';
   ```

2. Update `DoctorApiRow` — add missing fields:
   ```typescript
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
   ```

3. Update `DoctorRow` — add avatar and order:
   ```typescript
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
   ```

4. Update `useMemo` mapping to include new fields:
   ```typescript
   avatarUrl: d.avatarUrl ?? null,
   order: d.order ?? 0,
   ```

5. Update `EMPTY_FORM`:
   ```typescript
   const EMPTY_FORM = {
     email: '', password: '', name: '', phone: '',
     specialtyVi: '', specialtyKo: '', bioVi: '', bioKo: '',
     yearsExp: '',
     avatarUrl: '' as string,
     order: '0',
   };
   ```

6. Update `openEdit` — populate avatar and order:
   ```typescript
   avatarUrl: row.avatarUrl ?? '',
   order: String(row.order ?? 0),
   ```

7. Update `handleSave` — add new fields to payload:
   ```typescript
   const payload: Record<string, unknown> = {
     name: form.name,
     phone: form.phone,
     specialty: { vi: form.specialtyVi, ko: form.specialtyKo },
     bio: { vi: form.bioVi, ko: form.bioKo },
     yearsExp: Number(form.yearsExp),
     avatarUrl: form.avatarUrl || null,
     order: Number(form.order),
   };
   ```

8. Add avatar field in form — at top, before email/password fields:
   ```jsx
   <AdminImageUpload
     value={form.avatarUrl || null}
     onChange={(url) => setForm(prev => ({ ...prev, avatarUrl: url ?? '' }))}
     label="Ảnh đại diện"
   />
   ```

9. Add order field — after yearsExp:
   ```jsx
   <div className="grid grid-cols-2 gap-3">
     <DField label="Số năm kinh nghiệm" value={form.yearsExp}
       onChange={v => field('yearsExp', v)} type="number" required />
     <DField label="Thứ tự hiển thị" value={form.order}
       onChange={v => field('order', v)} type="number" />
   </div>
   ```
   This replaces the current standalone yearsExp field, grouping it with order.

10. Optionally add avatar thumbnail to the table (small column). If table too wide, skip for MVP.

## Todo List

- [ ] Import AdminImageUpload
- [ ] Add avatarUrl, order to DoctorApiRow and DoctorRow interfaces
- [ ] Add to useMemo mapping
- [ ] Add to EMPTY_FORM
- [ ] Update openEdit with new fields
- [ ] Update handleSave payload with avatarUrl, order
- [ ] Add AdminImageUpload in form UI
- [ ] Add order number input
- [ ] Test: upload avatar for new doctor
- [ ] Test: edit doctor loads existing avatar
- [ ] Test: remove avatar, save

## Success Criteria

- Admin can upload/remove doctor avatar photo
- Admin can set display order for doctors
- Editing existing doctor loads current avatar and order
- Create doctor without avatar works (optional field)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Doctor create endpoint may not accept avatarUrl | Low | Check backend; if not, only send avatarUrl on PATCH |
| Zod URL validation rejects `/uploads/...` relative path | Medium | Same as Phase 3 — may need full URL or Zod adjustment |

## Security Considerations

- Uses existing auth flow, no new attack surface
- Avatar URLs validated server-side by Zod schema
