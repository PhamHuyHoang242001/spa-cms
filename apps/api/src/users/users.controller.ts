import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
  ) {
    return this.usersService.listAll({ page, limit, role, search, sort, dir });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: { id: string },
  ) {
    return this.usersService.updateUser(id, body, user.id);
  }
}
