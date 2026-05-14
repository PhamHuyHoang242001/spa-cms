---
phase: 04
title: "Admin User Management"
status: pending
priority: P1
effort: 1d
dependencies: [phase-02]
---

# Phase 04 — Admin User Management

## Context Links
- Phase 02 provides `GET /users` (paginated, filterable) and `PATCH /users/:id`
- [Admin sidebar](../../apps/web/components/admin/admin-sidebar.tsx) — `NAV_ITEMS` array
- [AdminTable](../../apps/web/components/admin/admin-table.tsx) — generic table
- [AdminFormModal](../../apps/web/components/admin/admin-form-modal.tsx) — modal wrapper
- [Auth context](../../apps/web/lib/auth-context.tsx) — `user.id` for self-demotion guard
- [Prisma schema](../../apps/api/prisma/schema.prisma) — `Role` enum: CUSTOMER, DOCTOR, SUPERADMIN

## Overview

Create `/admin/users` page for SUPERADMIN to list all users, filter by role, search by name/email, and edit user name/role. Prevent self-demotion (current user cannot change own role).

## Key Insights

- `GET /users?page=1&limit=20&role=CUSTOMER&search=nguyen` returns `PaginatedResponse<UserRow>`
- `PATCH /users/:id` accepts `{ name?, role? }` — backend prevents self-demotion
- User response shape: `{ id, email, name, phone, role, locale, createdAt }`
- No user deletion — role change or deactivation only
- DOCTOR role change has implications: changing CUSTOMER to DOCTOR without a DoctorProfile will cause issues in doctor-specific features. UI should warn but backend handles gracefully.

## Requirements

### Functional
- List all users with pagination
- Filter by role (ALL, CUSTOMER, DOCTOR, SUPERADMIN)
- Search by name or email
- Edit modal: update name and role
- Prevent editing own role (disable dropdown for current user's row)
- Warning dialog when changing roles

### Non-functional
- SUPERADMIN only access
- Follows existing admin page patterns

## Architecture

```
/admin/users → UsersPage
  ├── Role filter dropdown + search input
  ├── AdminTable (columns: name, email, role, phone, created, actions)
  ├── Edit modal (name input, role dropdown)
  └── Pagination controls
```

## Related Code Files

### Files to Create
- `apps/web/app/admin/users/page.tsx` — User management page

### Files to Modify
- `apps/web/components/admin/admin-sidebar.tsx` — Add "Nguoi dung" nav item
- `apps/web/lib/api-types.ts` — Add `UserAdmin` type

## Implementation Steps

### Step 1: Add User Type

Add to `apps/web/lib/api-types.ts`:

```ts
export interface UserAdmin {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'CUSTOMER' | 'DOCTOR' | 'SUPERADMIN';
  locale: string;
  createdAt: string;
}
```

### Step 2: Add Sidebar Nav Item

In `admin-sidebar.tsx`, add to `NAV_ITEMS` (after bookings entry):

```ts
{
  href: '/admin/users',
  label: 'Nguoi dung',
  icon: <Users size={18} />,
  roles: ['SUPERADMIN'],
},
```

Import `Users` from `lucide-react`.

### Step 3: Create Users Page

Create `apps/web/app/admin/users/page.tsx`:

1. **State**:
   - `users: UserAdmin[]`, `meta: PaginationMeta | null`
   - `roleFilter: string` (default `''` = ALL)
   - `search: string`, `debouncedSearch: string`
   - `page: number`
   - `editUser: UserAdmin | null` (for modal)
   - `editForm: { name: string; role: string }`
   - `loading`, `error`, `saving`

2. **Load function**:
   ```ts
   const params = new URLSearchParams();
   params.set('page', String(page));
   params.set('limit', '20');
   if (roleFilter) params.set('role', roleFilter);
   if (debouncedSearch) params.set('search', debouncedSearch);
   const result = await apiGet<PaginatedResponse<UserAdmin>>(`/users?${params}`);
   setUsers(result.data);
   setMeta(result.meta);
   ```

3. **Debounced search**: use `useEffect` with 300ms `setTimeout` on `search` to set `debouncedSearch`. Reset page to 1 on search change.

4. **Filter bar**:
   - Role dropdown: ALL, CUSTOMER, DOCTOR, SUPERADMIN
   - Search input: placeholder "Tim theo ten hoac email..."
   - Both trigger reload via `useEffect` deps

5. **Table columns**:
   - Ho ten (name): `user.name`
   - Email: `user.email`
   - Vai tro (role): badge with role color
     ```ts
     const ROLE_COLORS = {
       CUSTOMER: 'bg-blue-100 text-blue-700',
       DOCTOR: 'bg-purple-100 text-purple-700',
       SUPERADMIN: 'bg-amber-100 text-amber-700',
     };
     const ROLE_LABELS = {
       CUSTOMER: 'Khach hang',
       DOCTOR: 'Bac si',
       SUPERADMIN: 'Quan tri',
     };
     ```
   - Dien thoai (phone): `user.phone ?? '—'`
   - Ngay tao (created): formatted date
   - Hanh dong: Edit button

6. **Edit modal** (AdminFormModal):
   - Name input (text)
   - Role dropdown (CUSTOMER, DOCTOR, SUPERADMIN)
   - If editing current user (`editUser.id === user.id`): disable role dropdown, show tooltip "Khong the thay doi vai tro cua chinh minh"
   - Warning text when role changes: "Thay doi vai tro se anh huong den quyen truy cap cua nguoi dung nay"
   - Save button: `apiPatch('/users/' + editUser.id, editForm)`

7. **Pagination**: prev/next buttons, page X of Y

### Step 4: Handle Edge Cases

- Empty state: "Khong co nguoi dung nao"
- Error on save: show error in modal, don't close
- After successful save: close modal, reload list
- Self-demotion: backend rejects with 400, frontend prevents via disabled dropdown

## Todo List

- [ ] Add `UserAdmin` type to `api-types.ts`
- [ ] Add "Nguoi dung" nav item to sidebar
- [ ] Create users page with role filter and search
- [ ] Implement user table with role badges
- [ ] Add edit modal with name + role fields
- [ ] Disable role change for current user
- [ ] Add role change warning text
- [ ] Add pagination controls
- [ ] Test: filter by each role
- [ ] Test: search by name and email
- [ ] Test: edit user name
- [ ] Test: change user role (non-self)
- [ ] Test: self-demotion prevention

## Success Criteria

- `/admin/users` lists all users with pagination
- Role filter narrows results to selected role
- Search filters by name or email (debounced)
- Edit modal allows name change and role change
- Current user cannot change own role (disabled + tooltip)
- Save refreshes list with updated data

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Changing CUSTOMER to DOCTOR without DoctorProfile | Medium | Show warning; backend handles gracefully (doctor pages just won't find profile) |
| Phase 02 not complete | Blocking | Strict dependency on `GET /users` and `PATCH /users/:id` |
| Race condition: admin edits user while user is active | Low | Last-write-wins; acceptable for admin tool |

## Security Considerations

- SUPERADMIN-only page; backend guards prevent unauthorized access
- Self-demotion blocked on both frontend (disabled dropdown) and backend (400 error)
- Password hash never exposed in API response
- No user deletion capability — reduces risk of accidental data loss
