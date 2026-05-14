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

  async listAll(page?: string, limit?: string, search?: string) {
    const pagination = parsePagination(page, limit);
    const q = search?.trim();
    const where: Prisma.ServiceWhereInput = q
      ? {
          OR: [
            { slug: { contains: q, mode: 'insensitive' } },
            { name: { path: ['vi'], string_contains: q } },
            { name: { path: ['ko'], string_contains: q } },
            { description: { path: ['vi'], string_contains: q } },
            { description: { path: ['ko'], string_contains: q } },
          ],
        }
      : {};

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

    const existing = await this.prisma.service.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) throw new BadRequestException('Slug already in use');

    return this.prisma.service.create({ data: parsed.data });
  }

  // ── Update service by id ─────────────────────────────────────────────────────

  async update(id: string, body: unknown) {
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException(`Service ${id} not found`);

    // Check slug uniqueness if being changed
    if (parsed.data.slug && parsed.data.slug !== service.slug) {
      const conflict = await this.prisma.service.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (conflict) throw new BadRequestException('Slug already in use');
    }

    return this.prisma.service.update({ where: { id }, data: parsed.data });
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
