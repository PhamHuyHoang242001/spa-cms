// bookings-cron.ts — Scheduled job to expire overdue PENDING/CONFIRMED bookings
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsCron {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run every 5 minutes — expire bookings whose endsAt has passed
  @Cron('*/5 * * * *')
  async expireOverdueBookings() {
    const now = new Date();
    const overdue = await this.prisma.booking.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED'] }, endsAt: { lt: now } },
      select: { id: true, slotId: true },
    });

    for (const b of overdue) {
      // Guard: only expire if still in active status (prevents overwriting concurrent cancel)
      const updated = await this.prisma.booking.updateMany({
        where: { id: b.id, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'EXPIRED' },
      });
      if (updated.count > 0) {
        await this.prisma.timeSlot.update({ where: { id: b.slotId }, data: { status: 'AVAILABLE' } });
      }
    }

    if (overdue.length > 0) {
      this.logger.log(`Expired ${overdue.length} overdue booking(s)`);
    }
  }
}
