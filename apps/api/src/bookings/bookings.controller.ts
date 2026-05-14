// bookings.controller.ts — REST endpoints for booking lifecycle management
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { id: string; role: string };

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // CUSTOMER — create a new booking
  @Post()
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER')
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    return this.bookingsService.create(user.id, body);
  }

  // Any authenticated user — list own bookings, optional ?filter=active|history
  @Get('me')
  listMine(
    @CurrentUser() user: AuthUser,
    @Query('filter') filter?: 'active' | 'history',
  ) {
    return this.bookingsService.listMine(user.id, filter);
  }

  // SUPERADMIN — list all bookings with filters
  @Get()
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  listAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('doctorId') doctorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.bookingsService.listAll({
      page,
      limit,
      status,
      doctorId,
      from,
      to,
    });
  }

  // Owner / DOCTOR / SUPERADMIN — get booking detail
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookingsService.findById(id, user.id, user.role);
  }

  // Owner (CUSTOMER) or SUPERADMIN — cancel a booking
  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER', 'SUPERADMIN')
  cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.cancel(id, user.id, user.role, body);
  }

  // DOCTOR / SUPERADMIN — confirm a pending booking
  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles('DOCTOR', 'SUPERADMIN')
  confirm(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookingsService.confirm(id, user);
  }

  // DOCTOR — mark booking as completed
  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('DOCTOR')
  complete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookingsService.complete(id, user);
  }

  // DOCTOR — mark customer as no-show
  @Patch(':id/no-show')
  @UseGuards(RolesGuard)
  @Roles('DOCTOR')
  noShow(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookingsService.noShow(id, user);
  }
}
