// doctors.controller.ts — REST endpoints for DoctorProfile CRUD
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // Public — list active doctors
  @Get()
  listActive() {
    return this.doctorsService.listActive();
  }

  // Admin — list all doctors with optional search + pagination
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  listAll(@Query() query: Record<string, string | undefined>) {
    return this.doctorsService.listAll(query);
  }

  // Public — doctor detail
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findById(id);
  }

  // Admin — create doctor user + profile
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  create(@Body() body: unknown) {
    return this.doctorsService.create(body);
  }

  // Admin — update profile fields
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.doctorsService.update(id, body);
  }

  // Admin — soft delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.doctorsService.softDelete(id);
  }
}
