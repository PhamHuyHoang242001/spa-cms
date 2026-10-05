// services.service.ts — business logic for Service (K-beauty treatment) CRUD
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createServiceSchema, updateServiceSchema } from '@spa/shared';
import {
  buildPaginatedResult,
  parsePagination,
} from '../common/utils/pagination-utils';
import { uniqueSlug } from '../common/utils/slug-utils';
import { parseListQuery } from '../common/utils/list-query';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List active services ordered by display order ────────────────────────────

  listActive() {
    return this.prisma.service.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
  }

  // ── Admin list all services with backward-compatible pagination ─────────────

  async listAll(query: Record<string, string | undefined> = {}) {
    const pagination = parsePagination(query.page, query.limit);
    const { search, sort, dir, filter } = parseListQuery(query, ['createdAt', 'updatedAt', 'priceVnd', 'order', 'durationMin'], 'createdAt');
    const q = search;
    const where: Prisma.ServiceWhereInput = {
      ...(filter.active === 'true' ? { active: true } : {}),
      ...(filter.active === 'false' ? { active: false } : {}),
      ...(filter.featured === 'true' ? { featured: true } : {}),
      ...(filter.featured === 'false' ? { featured: false } : {}),
      ...(q
        ? {
            OR: [
              { slug: { contains: q, mode: 'insensitive' } },
              { name: { path: ['vi'], string_contains: q } },
              { name: { path: ['ko'], string_contains: q } },
              { description: { path: ['vi'], string_contains: q } },
              { description: { path: ['ko'], string_contains: q } },
            ],
          }
        : {}),
    };

    if (!pagination) {
      return this.prisma.service.findMany({ where, orderBy: { [sort]: dir } });
    }

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.service.count({ where }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  // ── Get service by slug (public-facing URL key) ──────────────────────────────

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({ where: { slug } });
    if (!service) throw new NotFoundException(`Service "${slug}" not found`);
    return service;
  }

  // ── Create service ───────────────────────────────────────────────────────────

  async create(body: unknown) {
    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const { slug: _ignored, order, ...data } = parsed.data;
    const slug = await uniqueSlug(data.name.vi, async (s) =>
      Boolean(await this.prisma.service.findUnique({ where: { slug: s } })),
    );
    const agg = await this.prisma.service.aggregate({ _max: { order: true } });
    const nextOrder = order ?? (agg._max.order ?? -1) + 1;

    return this.prisma.service.create({ data: { ...data, slug, order: nextOrder } });
  }

  // ── Update service by id ─────────────────────────────────────────────────────

  async update(id: string, body: unknown) {
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException(`Service ${id} not found`);

    const { slug: _ignored, ...data } = parsed.data;
    return this.prisma.service.update({ where: { id }, data });
  }

  // ── Soft delete (active=false) ───────────────────────────────────────────────

  async softDelete(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException(`Service ${id} not found`);

    return this.prisma.service.update({
      where: { id },
      data: { active: false },
    });
  }
}
