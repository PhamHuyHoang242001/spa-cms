// bookings.service.ts — Core booking business logic: create, list, cancel, confirm, complete, no-show
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createBookingSchema, cancelBookingSchema } from '@spa/shared';
import { combineDateTime } from '../common/utils/datetime-utils';
import { BookingStatus, Prisma } from '@prisma/client';
import {
  buildPaginatedResult,
  parsePagination,
} from '../common/utils/pagination-utils';

// Statuses considered "active" — enforces one active booking per user per day
const ACTIVE_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

// ── Doctor/service include shape for list responses ──────────────────────────
const BOOKING_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  doctor: { include: { user: { select: { name: true, id: true } } } },
  service: {
    select: { id: true, name: true, durationMin: true, priceVnd: true },
  },
  slot: { select: { id: true, date: true, startTime: true, endTime: true } },
} satisfies Prisma.BookingInclude;

interface BookingListFilters {
  page?: string;
  limit?: string;
  status?: string;
  doctorId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create booking (CUSTOMER only) ──────────────────────────────────────────

  async create(userId: string, body: unknown) {
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    const { serviceId, doctorId, slotId, note } = parsed.data;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Verify slot availability (DB unique on slotId is the concurrency safety net)
        const slot = await tx.timeSlot.findUnique({ where: { id: slotId } });
        if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);
        if (slot.status !== 'AVAILABLE') {
          throw new BadRequestException('Slot is no longer available');
        }
        if (slot.doctorId !== doctorId) {
          throw new BadRequestException(
            'Slot does not belong to the specified doctor',
          );
        }

        // 2. Guard: max 1 active booking per user per day (VN timezone)
        const dateStr = slot.date.toISOString().split('T')[0]; // YYYY-MM-DD
        const dayStartVN = new Date(`${dateStr}T00:00:00+07:00`);
        const dayEndVN = new Date(`${dateStr}T23:59:59.999+07:00`);
        const existing = await tx.booking.findFirst({
          where: {
            userId,
            status: { in: ACTIVE_STATUSES },
            startsAt: { gte: dayStartVN, lte: dayEndVN },
          },
        });
        if (existing) {
          throw new BadRequestException(
            'You already have an active booking on this date.',
          );
        }

        // 3. Verify service exists and is active
        const service = await tx.service.findUnique({
          where: { id: serviceId },
        });
        if (!service)
          throw new NotFoundException(`Service ${serviceId} not found`);
        if (!service.active)
          throw new BadRequestException('Service is not active');

        // 4. Compute start/end datetimes from slot date + times (VN UTC+7)
        const startsAt = combineDateTime(slot.date, slot.startTime);
        const endsAt = combineDateTime(slot.date, slot.endTime);

        // 5. Mark slot as BOOKED
        await tx.timeSlot.update({
          where: { id: slotId },
          data: { status: 'BOOKED' },
        });

        // 6. Create booking record
        return tx.booking.create({
          data: { userId, doctorId, serviceId, slotId, note, startsAt, endsAt },
          include: BOOKING_INCLUDE,
        });
      });
    } catch (err: unknown) {
      // P2002 = unique constraint violation on slotId (slot already has a booking record)
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('This slot has already been booked');
      }
      throw err;
    }
  }

  // ── List own bookings with optional status group filter ─────────────────────

  async listMine(userId: string, filter?: 'active' | 'history') {
    let statusFilter: BookingStatus[] | undefined;
    if (filter === 'active') statusFilter = ['PENDING', 'CONFIRMED'];
    if (filter === 'history')
      statusFilter = ['COMPLETED', 'EXPIRED', 'CANCELLED', 'NO_SHOW'];

    return this.prisma.booking.findMany({
      where: {
        userId,
        ...(statusFilter ? { status: { in: statusFilter } } : {}),
      },
      include: BOOKING_INCLUDE,
      orderBy: { startsAt: 'desc' },
    });
  }

  // ── SUPERADMIN list all bookings with filters + pagination ─────────────────

  async listAll(filters: BookingListFilters) {
    const pagination = parsePagination(filters.page, filters.limit);
    const where: Prisma.BookingWhereInput = {};

    const statuses = filters.status
      ?.split(',')
      .map((item) => item.trim())
      .filter((item): item is BookingStatus =>
        [
          'PENDING',
          'CONFIRMED',
          'COMPLETED',
          'EXPIRED',
          'CANCELLED',
          'NO_SHOW',
        ].includes(item),
      );
    if (statuses?.length) where.status = { in: statuses };
    if (filters.doctorId) where.doctorId = filters.doctorId;

    if (filters.from || filters.to) {
      where.startsAt = {
        ...(filters.from
          ? { gte: new Date(`${filters.from}T00:00:00+07:00`) }
          : {}),
        ...(filters.to
          ? { lte: new Date(`${filters.to}T23:59:59.999+07:00`) }
          : {}),
      };
    }

    if (!pagination) {
      return this.prisma.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { startsAt: 'desc' },
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { startsAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  // ── Get booking by id — owner, DOCTOR, or SUPERADMIN ────────────────────────

  async findById(id: string, userId: string, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);

    const isOwner = booking.userId === userId;
    const isPrivileged = role === 'SUPERADMIN' || role === 'DOCTOR';
    if (!isOwner && !isPrivileged)
      throw new ForbiddenException('Access denied');

    return booking;
  }

  // ── Cancel booking (interactive txn to prevent TOCTOU) ────────────────────────

  async cancel(id: string, userId: string, role: string, body: unknown) {
    const parsed = cancelBookingSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    const { cancelReason } = parsed.data;

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) throw new NotFoundException(`Booking ${id} not found`);

      if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        throw new BadRequestException(
          `Cannot cancel a booking with status ${booking.status}`,
        );
      }

      if (role === 'CUSTOMER') {
        if (booking.userId !== userId)
          throw new ForbiddenException('Access denied');
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        if (booking.startsAt <= twoHoursFromNow) {
          throw new BadRequestException(
            'Cannot cancel within 2 hours of appointment',
          );
        }
      } else if (role === 'SUPERADMIN') {
        if (!cancelReason)
          throw new BadRequestException(
            'cancelReason is required for admin cancellation',
          );
      } else {
        throw new ForbiddenException(
          'Only customers or superadmins can cancel bookings',
        );
      }

      await tx.timeSlot.update({
        where: { id: booking.slotId },
        data: { status: 'AVAILABLE' },
      });
      return tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason },
        include: BOOKING_INCLUDE,
      });
    });
  }

  // ── Confirm booking: PENDING → CONFIRMED (DOCTOR/SUPERADMIN) ────────────────

  async confirm(id: string, user: { id: string; role: string }) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { doctor: { select: { userId: true } } },
      });
      if (!booking) throw new NotFoundException(`Booking ${id} not found`);
      if (booking.status !== 'PENDING') {
        throw new BadRequestException(
          `Cannot confirm a booking with status ${booking.status}`,
        );
      }
      this.assertDoctorOwnership(booking.doctor.userId, user);
      return tx.booking.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: BOOKING_INCLUDE,
      });
    });
  }

  // ── Complete booking: CONFIRMED → COMPLETED (DOCTOR) ────────────────────────

  async complete(id: string, user: { id: string; role: string }) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { doctor: { select: { userId: true } } },
      });
      if (!booking) throw new NotFoundException(`Booking ${id} not found`);
      if (booking.status !== 'CONFIRMED') {
        throw new BadRequestException(
          `Cannot complete a booking with status ${booking.status}`,
        );
      }
      this.assertDoctorOwnership(booking.doctor.userId, user);
      return tx.booking.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: BOOKING_INCLUDE,
      });
    });
  }

  // ── No-show: mark NO_SHOW, free slot (DOCTOR) ────────────────────────────────

  async noShow(id: string, user: { id: string; role: string }) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { doctor: { select: { userId: true } } },
      });
      if (!booking) throw new NotFoundException(`Booking ${id} not found`);
      if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        throw new BadRequestException(
          `Cannot mark no-show for booking with status ${booking.status}`,
        );
      }
      this.assertDoctorOwnership(booking.doctor.userId, user);
      await tx.timeSlot.update({
        where: { id: booking.slotId },
        data: { status: 'AVAILABLE' },
      });
      return tx.booking.update({
        where: { id },
        data: { status: 'NO_SHOW' },
        include: BOOKING_INCLUDE,
      });
    });
  }

  // ── Helper: verify doctor can only act on own bookings ──────────────────────

  private assertDoctorOwnership(
    bookingDoctorUserId: string,
    user: { id: string; role: string },
  ) {
    if (user.role === 'DOCTOR' && bookingDoctorUserId !== user.id) {
      throw new ForbiddenException(
        'Doctors can only manage their own bookings',
      );
    }
  }
}
