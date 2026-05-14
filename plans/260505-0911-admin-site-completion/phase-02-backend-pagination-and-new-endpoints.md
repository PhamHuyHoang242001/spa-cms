---
phase: 02
title: "Backend Pagination & New Endpoints"
status: pending
priority: P1
effort: 2d
dependencies: []
---

# Phase 02 — Backend Pagination & New Endpoints

## Context Links
- [Services controller](../../apps/api/src/services/services.controller.ts) — no pagination params
- [Services service](../../apps/api/src/services/services.service.ts) — `listActive()` returns all
- [Doctors controller](../../apps/api/src/doctors/doctors.controller.ts) — no pagination
- [Doctors service](../../apps/api/src/doctors/doctors.service.ts) — `listActive()` returns all
- [Articles controller](../../apps/api/src/articles/articles.controller.ts) — public list has page param
- [Bookings controller](../../apps/api/src/bookings/bookings.controller.ts) — only `listMine`
- [Users service](../../apps/api/src/users/users.service.ts) — only `findByEmail`, `findById`, `create`
- [Users module](../../apps/api/src/users/users.module.ts) — no controller
- [App module](../../apps/api/src/app.module.ts) — UsersModule imported but no controller
- [Prisma schema](../../apps/api/prisma/schema.prisma) — all models defined

## Overview

Add pagination + search to existing admin endpoints (services, doctors, articles). Create new admin endpoints for booking list and user management. All changes backward-compatible: omitting `page` param returns array as before.

## Key Insights

- Services/Doctors currently return arrays with no pagination — admin pages fetch all
- Articles already has public pagination (`listPublished`) but admin fetches all via same endpoint
- Need separate admin list endpoints: `GET /services/admin`, `GET /doctors/admin` or use query param `?admin=true` — simpler approach: add optional `?page=` `?search=` params to existing list endpoints, keep backward compat
- Bookings has no `listAll` — need `GET /bookings` for SUPERADMIN
- Users has no controller at all — need `UsersController` with `GET /users` and `PATCH /users/:id`
- JSON fields (`name`, `specialty`, `title`) need raw SQL or Prisma `JsonFilter` for search — use `Prisma.sql` raw filter or `string_contains` workaround

## Requirements

### Functional
- **Pagination utility**: reusable across all services
- **Services admin**: `GET /services?page=1&limit=20&search=botox` — search in `name` JSON field
- **Doctors admin**: `GET /doctors?page=1&limit=20&search=nguyen` — search by user.name or specialty
- **Articles admin**: `GET /articles/admin?page=1&limit=20&search=cham` — search in `title` JSON, return all (including unpublished)
- **Bookings list**: `GET /bookings?page=1&limit=20&status=PENDING,CONFIRMED&doctorId=X&from=2026-05-01&to=2026-05-07`
- **Users list**: `GET /users?page=1&limit=20&role=CUSTOMER&search=email`
- **Users update**: `PATCH /users/:id` — update name, role (prevent self-demotion)

### Non-functional
- Backward compatible: no `page` param = original array response
- All admin endpoints require `JwtAuthGuard` + `RolesGuard('SUPERADMIN')`
- Paginated response shape: `{ data: T[], meta: { total, page, limit, totalPages } }`

## Architecture

### Paginated Response Shape

```ts
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Pagination Utility Pattern

```ts
// pagination-utils.ts
interface PaginationParams {
  page?: number;
  limit?: number;
}

function parsePagination(page?: string, limit?: string): { skip: number; take: number; page: number; limit: number } | null {
  if (!page) return null; // backward compat: no pagination
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
```

### Search in JSON Fields

Prisma 7 supports `JsonFilter` with `path` and `string_contains`. For searching `name.vi`:

```ts
where: {
  name: { path: ['vi'], string_contains: search, mode: 'insensitive' } // Prisma 7 JsonFilter
}
```

Fallback: use raw query `CAST(name->>'vi' AS TEXT) ILIKE '%search%'`.

Need to verify Prisma 7's JSON filter support for case-insensitive search — if not supported, use raw `$queryRaw` or `$executeRaw`.

## Related Code Files

### Files to Create
- `apps/api/src/common/utils/pagination-utils.ts` — Reusable pagination helpers
- `apps/api/src/users/users.controller.ts` — Admin user management endpoints

### Files to Modify
- `apps/api/src/services/services.controller.ts` — Add `@Query` params for page/limit/search
- `apps/api/src/services/services.service.ts` — Add `listAll(page?, limit?, search?)` method
- `apps/api/src/doctors/doctors.controller.ts` — Add `@Query` params
- `apps/api/src/doctors/doctors.service.ts` — Add `listAll(page?, limit?, search?)` method
- `apps/api/src/articles/articles.controller.ts` — Add `GET /articles/admin` for admin listing
- `apps/api/src/articles/articles.service.ts` — Add `listAll(page?, limit?, search?)` method
- `apps/api/src/bookings/bookings.controller.ts` — Add `GET /bookings` for SUPERADMIN
- `apps/api/src/bookings/bookings.service.ts` — Add `listAll(filters)` method
- `apps/api/src/users/users.service.ts` — Add `listAll`, `updateUser` methods
- `apps/api/src/users/users.module.ts` — Add `UsersController` to module
- `apps/api/src/app.module.ts` — No change needed (UsersModule already imported)

## Implementation Steps

### Step 1: Create Pagination Utility

Create `apps/api/src/common/utils/pagination-utils.ts`:

```ts
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ParsedPagination {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(page?: string, limit?: string): ParsedPagination | null {
  if (!page) return null;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
```

### Step 2: Update Services (search + pagination)

**`services.controller.ts`** — Add admin list endpoint:

```ts
@Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
listAll(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
) {
  return this.servicesService.listAll(page, limit, search);
}
```

Place this route BEFORE `@Get(':slug')` to avoid slug match.

**`services.service.ts`** — Add `listAll` method:

```ts
async listAll(page?: string, limit?: string, search?: string) {
  const pagination = parsePagination(page, limit);
  const where: Prisma.ServiceWhereInput = {};
  
  if (search) {
    where.OR = [
      { name: { path: ['vi'], string_contains: search } },
      { name: { path: ['ko'], string_contains: search } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (!pagination) {
    return this.prisma.service.findMany({ where, orderBy: { order: 'asc' } });
  }

  const [data, total] = await Promise.all([
    this.prisma.service.findMany({
      where,
      orderBy: { order: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    this.prisma.service.count({ where }),
  ]);

  return buildPaginatedResult(data, total, pagination.page, pagination.limit);
}
```

### Step 3: Update Doctors (search + pagination)

**`doctors.controller.ts`** — Add admin list before `:id` route:

```ts
@Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
listAll(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
) {
  return this.doctorsService.listAll(page, limit, search);
}
```

**`doctors.service.ts`** — Add `listAll` method:

```ts
async listAll(page?: string, limit?: string, search?: string) {
  const pagination = parsePagination(page, limit);
  const where: Prisma.DoctorProfileWhereInput = {};

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { specialty: { path: ['vi'], string_contains: search } },
    ];
  }

  const include = { user: { select: { id: true, name: true, email: true } } };

  if (!pagination) {
    return this.prisma.doctorProfile.findMany({ where, orderBy: { order: 'asc' }, include });
  }

  const [data, total] = await Promise.all([
    this.prisma.doctorProfile.findMany({
      where, orderBy: { order: 'asc' }, include,
      skip: pagination.skip, take: pagination.take,
    }),
    this.prisma.doctorProfile.count({ where }),
  ]);

  return buildPaginatedResult(data, total, pagination.page, pagination.limit);
}
```

### Step 4: Update Articles (admin list)

**`articles.controller.ts`** — Add admin list endpoint:

```ts
@Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
listAll(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('search') search?: string,
) {
  return this.articlesService.listAll(page, limit, search);
}
```

Place BEFORE `@Get(':slug')`.

**`articles.service.ts`** — Add `listAll` method (includes unpublished):

```ts
async listAll(page?: string, limit?: string, search?: string) {
  const pagination = parsePagination(page, limit);
  const where: Prisma.ArticleWhereInput = {};

  if (search) {
    where.OR = [
      { title: { path: ['vi'], string_contains: search } },
      { title: { path: ['ko'], string_contains: search } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const include = { author: { select: { id: true, name: true } } };

  if (!pagination) {
    return this.prisma.article.findMany({
      where, orderBy: { createdAt: 'desc' }, include,
    });
  }

  const [data, total] = await Promise.all([
    this.prisma.article.findMany({
      where, orderBy: { createdAt: 'desc' }, include,
      skip: pagination.skip, take: pagination.take,
    }),
    this.prisma.article.count({ where }),
  ]);

  return buildPaginatedResult(data, total, pagination.page, pagination.limit);
}
```

### Step 5: Add Bookings List All

**`bookings.controller.ts`** — Add `GET /bookings` before instance routes:

```ts
@Get()
@UseGuards(RolesGuard)
@Roles('SUPERADMIN')
listAll(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('status') status?: string,
  @Query('doctorId') doctorId?: string,
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  return this.bookingsService.listAll({ page, limit, status, doctorId, from, to });
}
```

**`bookings.service.ts`** — Add `listAll` method:

```ts
interface ListAllFilters {
  page?: string;
  limit?: string;
  status?: string;    // comma-separated: "PENDING,CONFIRMED"
  doctorId?: string;
  from?: string;      // YYYY-MM-DD
  to?: string;        // YYYY-MM-DD
}

async listAll(filters: ListAllFilters) {
  const pagination = parsePagination(filters.page, filters.limit);
  const where: Prisma.BookingWhereInput = {};

  if (filters.status) {
    const statuses = filters.status.split(',') as BookingStatus[];
    where.status = { in: statuses };
  }
  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }
  if (filters.from || filters.to) {
    where.startsAt = {};
    if (filters.from) where.startsAt.gte = new Date(`${filters.from}T00:00:00+07:00`);
    if (filters.to) where.startsAt.lte = new Date(`${filters.to}T23:59:59.999+07:00`);
  }

  const pag = pagination ?? { skip: 0, take: 50, page: 1, limit: 50 };

  const [data, total] = await Promise.all([
    this.prisma.booking.findMany({
      where,
      include: {
        ...BOOKING_INCLUDE,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pag.skip,
      take: pag.take,
    }),
    this.prisma.booking.count({ where }),
  ]);

  return buildPaginatedResult(data, total, pag.page, pag.limit);
}
```

### Step 6: Create Users Controller + Update Service

**`users.controller.ts`**:

```ts
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.listAll(page, limit, role, search);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() currentUser: { id: string },
  ) {
    return this.usersService.updateUser(id, body, currentUser.id);
  }
}
```

**`users.service.ts`** — Add methods:

```ts
async listAll(page?: string, limit?: string, role?: string, search?: string) {
  const pagination = parsePagination(page, limit);
  const where: Prisma.UserWhereInput = {};

  if (role) where.role = role as Role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const select = {
    id: true, email: true, name: true, phone: true,
    role: true, locale: true, createdAt: true,
  };

  const pag = pagination ?? { skip: 0, take: 50, page: 1, limit: 50 };

  const [data, total] = await Promise.all([
    this.prisma.user.findMany({
      where, select, orderBy: { createdAt: 'desc' },
      skip: pag.skip, take: pag.take,
    }),
    this.prisma.user.count({ where }),
  ]);

  return buildPaginatedResult(data, total, pag.page, pag.limit);
}

async updateUser(id: string, body: unknown, currentUserId: string) {
  // Prevent self-demotion
  if (id === currentUserId && body && typeof body === 'object' && 'role' in body) {
    throw new BadRequestException('Cannot change your own role');
  }

  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException(`User ${id} not found`);

  const { name, role } = body as { name?: string; role?: string };
  const data: Prisma.UserUpdateInput = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role as Role;

  return this.prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, email: true, name: true, phone: true,
      role: true, locale: true, createdAt: true,
    },
  });
}
```

**`users.module.ts`** — Add controller:

```ts
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### Step 7: Verify & Compile

- Run `pnpm --filter api build` to check for compile errors
- Test each endpoint with curl/httpie
- Verify backward compat: `GET /services` without params still returns array

## Todo List

- [ ] Create pagination utility (`pagination-utils.ts`)
- [ ] Add `GET /services/admin` with search + pagination
- [ ] Add `GET /doctors/admin` with search + pagination
- [ ] Add `GET /articles/admin` with search + pagination
- [ ] Add `GET /bookings` with filters + pagination
- [ ] Create `UsersController` with `GET /users` and `PATCH /users/:id`
- [ ] Update `UsersService` with `listAll` and `updateUser`
- [ ] Update `UsersModule` to include controller
- [ ] Verify all existing endpoints still work (backward compat)
- [ ] Run compile check

## Success Criteria

- All admin list endpoints support `?page=&limit=&search=` params
- Omitting `page` param returns plain array (backward compat) for services/doctors
- `GET /bookings` returns paginated bookings with user info, filterable by status/doctor/date
- `GET /users` returns paginated users filterable by role and search
- `PATCH /users/:id` can update name and role, prevents self-demotion
- All endpoints guarded by `JwtAuthGuard` + `RolesGuard('SUPERADMIN')`

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| JSON field search not working with Prisma 7 `string_contains` | Medium | Fallback to `$queryRawUnsafe` with parameterized ILIKE |
| Route collision (`/admin` vs `/:slug` or `/:id`) | High | Place admin routes BEFORE parameterized routes in controller |
| Breaking existing public endpoints | High | Backward compat: no page param = array response |

## Security Considerations

- All new admin endpoints require SUPERADMIN role
- User update prevents self-demotion (cannot change own role)
- Password hash never returned in user list/update responses (use `select` to exclude)
- Input validation via Zod or manual checks for body params
