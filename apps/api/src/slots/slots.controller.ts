// slots.controller.ts — REST endpoints for TimeSlot listing, generation, and blocking
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
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // Public — list available slots for a doctor on a date
  @Get()
  listAvailable(@Query() query: unknown) {
    return this.slotsService.listAvailable(query);
  }

  // Admin/Doctor — generate slots for a doctor (DOCTOR can only generate own slots)
  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'DOCTOR')
  generate(
    @Body() body: unknown,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.slotsService.generateForDoctor(body, user);
  }

  // Admin/Doctor — block a slot (DOCTOR can only block own slots)
  @Patch(':id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'DOCTOR')
  block(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.slotsService.block(id, user);
  }
}
