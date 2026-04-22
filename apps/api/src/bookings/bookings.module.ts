// bookings.module.ts — BookingsModule wiring controller, service, and cron
import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsCron } from './bookings-cron';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingsCron],
  exports: [BookingsService],
})
export class BookingsModule {}
