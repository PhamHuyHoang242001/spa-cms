// UsersService — low-level user data access, used by AuthService
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { Role } from '@prisma/client';
import { BCRYPT_ROUNDS } from '@spa/shared';
import {
  buildPaginatedResult,
  parsePagination,
} from '../common/utils/pagination-utils';
import { parseListQuery } from '../common/utils/list-query';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role?: Role;
}

interface ListUsersParams {
  page?: string;
  limit?: string;
  role?: Role;
  search?: string;
  sort?: string;
  dir?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        phone: input.phone,
        role: input.role ?? 'CUSTOMER',
      },
    });
  }

  async listAll({ page, limit, role, search, sort, dir }: ListUsersParams) {
    const pagination = parsePagination(page, limit);
    const parsed = parseListQuery({ search, sort, dir }, ['createdAt', 'updatedAt', 'name', 'email'], 'createdAt');
    const q = parsed.search;
    const where: Prisma.UserWhereInput = {
      ...(role && ['CUSTOMER', 'DOCTOR', 'SUPERADMIN'].includes(role)
        ? { role }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const select = {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      locale: true,
      createdAt: true,
      updatedAt: true,
    };

    if (!pagination) {
      return this.prisma.user.findMany({
        where,
        select,
        orderBy: { [parsed.sort]: parsed.dir },
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select,
        orderBy: { [parsed.sort]: parsed.dir },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  async updateUser(id: string, body: unknown, currentUserId: string) {
    const input = body as {
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      locale?: unknown;
      role?: unknown;
      password?: unknown;
    };
    const data: Prisma.UserUpdateInput = {};

    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || !input.name.trim()) {
        throw new BadRequestException('name must be a non-empty string');
      }
      data.name = input.name.trim();
    }

    if (input.email !== undefined) {
      if (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
        throw new BadRequestException('Invalid email');
      }
      data.email = input.email.trim().toLowerCase();
    }

    if (input.phone !== undefined) {
      if (input.phone === null || input.phone === '') {
        data.phone = null;
      } else if (typeof input.phone !== 'string') {
        throw new BadRequestException('Invalid phone');
      } else {
        data.phone = input.phone.trim();
      }
    }

    if (input.locale !== undefined) {
      if (typeof input.locale !== 'string' || !['vi', 'ko'].includes(input.locale)) {
        throw new BadRequestException('Invalid locale');
      }
      data.locale = input.locale;
    }

    if (input.role !== undefined) {
      if (
        typeof input.role !== 'string' ||
        !['CUSTOMER', 'DOCTOR', 'SUPERADMIN'].includes(input.role)
      ) {
        throw new BadRequestException('Invalid role');
      }
      if (id === currentUserId) {
        throw new BadRequestException('Cannot change your own role');
      }
      data.role = input.role as Role;
    }

    if (input.password !== undefined && input.password !== null && input.password !== '') {
      if (typeof input.password !== 'string' || input.password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters');
      }
      data.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
