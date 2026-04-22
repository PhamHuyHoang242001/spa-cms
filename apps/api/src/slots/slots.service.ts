// slots.service.ts — business logic for TimeSlot generation, listing, and blocking
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlotsSchema, slotQuerySchema } from '@spa/shared';

// Working hours: 09:00-12:00 and 14:00-18:00 in 30-min increments
const MORNING_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = [
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];
const ALL_START_TIMES = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

/** Add 30 minutes to a "HH:MM" string, returns "HH:MM" */
function addThirtyMin(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + (m ?? 0) + 30;
  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const mm = String(totalMin % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Generate slots for a doctor over N days ──────────────────────────────────

  async generateForDoctor(body: unknown, currentUser: { id: string; role: string }) {
    const parsed = generateSlotsSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const { doctorId, fromDate, days } = parsed.data;

    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException(`Doctor ${doctorId} not found`);

    // DOCTOR role can only generate own slots
    if (currentUser.role === 'DOCTOR' && doctor.userId !== currentUser.id) {
      throw new ForbiddenException('Doctors can only manage their own slots');
    }

    const slots: { doctorId: string; date: Date; startTime: string; endTime: string }[] = [];

    const start = new Date(`${fromDate}T00:00:00.000Z`);
    for (let i = 0; i < (days ?? 30); i++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + i);

      for (const startTime of ALL_START_TIMES) {
        slots.push({
          doctorId,
          date,
          startTime,
          endTime: addThirtyMin(startTime),
        });
      }
    }

    // Use skipDuplicates to avoid errors on re-generation
    const result = await this.prisma.timeSlot.createMany({
      data: slots,
      skipDuplicates: true,
    });

    return { created: result.count, total: slots.length };
  }

  // ── List available slots for a doctor on a date ──────────────────────────────

  async listAvailable(query: unknown) {
    const parsed = slotQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const { doctorId, date } = parsed.data;
    const dateObj = new Date(`${date}T00:00:00.000Z`);

    return this.prisma.timeSlot.findMany({
      where: { doctorId, date: dateObj, status: 'AVAILABLE' },
      orderBy: { startTime: 'asc' },
    });
  }

  // ── Block a slot by id ───────────────────────────────────────────────────────

  async block(id: string, currentUser: { id: string; role: string }) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
      include: { doctor: { select: { userId: true } } },
    });
    if (!slot) throw new NotFoundException(`Slot ${id} not found`);
    if (slot.status === 'BOOKED') {
      throw new BadRequestException('Cannot block a slot that is already booked');
    }

    // DOCTOR role can only block own slots
    if (currentUser.role === 'DOCTOR' && slot.doctor.userId !== currentUser.id) {
      throw new ForbiddenException('Doctors can only manage their own slots');
    }

    return this.prisma.timeSlot.update({ where: { id }, data: { status: 'BLOCKED' } });
  }
}
