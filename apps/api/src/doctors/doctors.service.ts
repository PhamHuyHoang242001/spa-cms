// doctors.service.ts — business logic for DoctorProfile CRUD
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { createDoctorSchema, updateDoctorSchema, BCRYPT_ROUNDS } from '@spa/shared';
import type { CreateDoctorInput, UpdateDoctorInput } from '@spa/shared';

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

    const { email, password, name, phone, specialty, bio, avatarUrl, yearsExp, order } =
      parsed.data as CreateDoctorInput;

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
            order: order ?? 0,
          },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        return profile;
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
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
      parsed.data as UpdateDoctorInput;

    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      // Update user fields if provided
      if (name !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }) },
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
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { active: false },
    });
  }
}
