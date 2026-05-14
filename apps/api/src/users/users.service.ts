// UsersService — low-level user data access, used by AuthService
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Role } from '@prisma/client';
import {
  buildPaginatedResult,
  parsePagination,
} from '../common/utils/pagination-utils';

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

  async listAll({ page, limit, role, search }: ListUsersParams) {
    const pagination = parsePagination(page, limit);
    const q = search?.trim();
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
        orderBy: { createdAt: 'desc' },
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  async updateUser(id: string, body: unknown, currentUserId: string) {
    const input = body as { name?: unknown; role?: unknown };
    const data: Prisma.UserUpdateInput = {};

    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || !input.name.trim()) {
        throw new BadRequestException('name must be a non-empty string');
      }
      data.name = input.name.trim();
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
