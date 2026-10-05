// doctors.service.ts — business logic for DoctorProfile CRUD
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  createDoctorSchema,
  updateDoctorSchema,
  BCRYPT_ROUNDS,
} from '@spa/shared';
import {
  buildPaginatedResult,
  parsePagination,
} from '../common/utils/pagination-utils';
import { parseListQuery } from '../common/utils/list-query';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List active doctors with user name ───────────────────────────────────────

  listActive() {
    return this.prisma.doctorProfile.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // ── Admin list all doctors with backward-compatible pagination ──────────────

  async listAll(query: Record<string, string | undefined> = {}) {
    const pagination = parsePagination(query.page, query.limit);
    const { search, sort, dir, filter } = parseListQuery(query, ['createdAt', 'order', 'yearsExp'], 'createdAt');
    const q = search;
    const where: Prisma.DoctorProfileWhereInput = {
      ...(filter.active === 'true' ? { active: true } : {}),
      ...(filter.active === 'false' ? { active: false } : {}),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q, mode: 'insensitive' } } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
              { specialty: { path: ['vi'], string_contains: q } },
              { specialty: { path: ['ko'], string_contains: q } },
              { bio: { path: ['vi'], string_contains: q } },
              { bio: { path: ['ko'], string_contains: q } },
            ],
          }
        : {}),
    };
    const include = { user: { select: { id: true, name: true, email: true, createdAt: true } } };
    const orderBy = sort === 'createdAt'
      ? { user: { createdAt: dir } }
      : { [sort]: dir };

    if (!pagination) {
      return this.prisma.doctorProfile.findMany({
        where,
        orderBy,
        include,
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        orderBy,
        include,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  // ── Get single doctor by profile id ─────────────────────────────────────────

  async findById(id: string) {
    const doctor = await this.prisma.doctorProfile.findFirst({
      where: { id, active: true },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    return doctor;
  }

  // ── Create user with DOCTOR role + profile in transaction ───────────────────

  async create(body: unknown) {
    const parsed = createDoctorSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const {
      email,
      password,
      name,
      phone,
      specialty,
      bio,
      avatarUrl,
      yearsExp,
      order,
      active,
    } = parsed.data;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email, passwordHash, name, phone, role: 'DOCTOR' },
        });
        const profile = await tx.doctorProfile.create({
          data: {
            userId: user.id,
            specialty,
            bio,
            avatarUrl,
            yearsExp: yearsExp ?? 0,
            order: order ?? ((await tx.doctorProfile.aggregate({ _max: { order: true } }))._max.order ?? -1) + 1,
            active,
          },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        return profile;
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('Email or phone already in use');
      }
      throw err;
    }
  }

  // ── Update profile fields ────────────────────────────────────────────────────

  async update(id: string, body: unknown) {
    const parsed = updateDoctorSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const { name, phone, specialty, bio, avatarUrl, yearsExp, order, active } =
      parsed.data;

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
    });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      // Update user fields if provided
      if (name !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: {
            ...(name !== undefined && { name }),
            ...(phone !== undefined && { phone }),
          },
        });
      }
      // Update profile fields
      return tx.doctorProfile.update({
        where: { id },
        data: {
          ...(specialty !== undefined && { specialty }),
          ...(bio !== undefined && { bio }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(yearsExp !== undefined && { yearsExp }),
          ...(order !== undefined && { order }),
          ...(active !== undefined && { active }),
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });
  }

  // ── Soft delete (set active=false) ───────────────────────────────────────────

  async softDelete(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
    });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { active: false },
    });
  }
}
