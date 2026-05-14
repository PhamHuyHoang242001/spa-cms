// articles.controller.ts — REST endpoints for Article (blog) CRUD
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
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // Public — list published articles with optional page + tag filters
  @Get()
  listPublished(@Query('page') page?: string, @Query('tag') tag?: string) {
    return this.articlesService.listPublished(
      page ? parseInt(page, 10) : 1,
      tag,
    );
  }

  // Admin — list all articles with optional search + pagination
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  listAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.articlesService.listAll(page, limit, search);
  }

  // Public — article detail by slug
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  // Admin — create article (slug auto-generated)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.articlesService.create(user.id, body);
  }

  // Admin — partial update
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.articlesService.update(id, body);
  }

  // Admin — publish (set publishedAt = now)
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  publish(@Param('id') id: string) {
    return this.articlesService.publish(id);
  }

  // Admin — hard delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
