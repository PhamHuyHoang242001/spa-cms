// articles.service.ts — business logic for Article (blog) CRUD
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createArticleSchema, updateArticleSchema } from '@spa/shared';
import {
  buildPaginatedResult,
  parsePagination,
} from '../common/utils/pagination-utils';

const PAGE_SIZE = 10;

// Converts Vietnamese title string to URL-safe slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List published articles (public, paginated, optional tag filter) ──────────

  async listPublished(page = 1, tag?: string) {
    const skip = (page - 1) * PAGE_SIZE;
    const now = new Date();

    const where = {
      publishedAt: { not: null, lte: now },
      ...(tag ? { tags: { has: tag } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverUrl: true,
          tags: true,
          publishedAt: true,
          featured: true,
          author: { select: { name: true } },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { items, total, page, pageSize: PAGE_SIZE };
  }

  // ── Admin list all articles, including drafts/unpublished ───────────────────

  async listAll(page?: string, limit?: string, search?: string) {
    const pagination = parsePagination(page, limit);
    const q = search?.trim();
    const where: Prisma.ArticleWhereInput = q
      ? {
          OR: [
            { slug: { contains: q, mode: 'insensitive' } },
            { title: { path: ['vi'], string_contains: q } },
            { title: { path: ['ko'], string_contains: q } },
            { excerpt: { path: ['vi'], string_contains: q } },
            { excerpt: { path: ['ko'], string_contains: q } },
          ],
        }
      : {};
    const include = { author: { select: { id: true, name: true } } };

    if (!pagination) {
      return this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include,
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.article.count({ where }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  // ── Get single published article by slug ──────────────────────────────────────

  async findBySlug(slug: string) {
    const now = new Date();
    const article = await this.prisma.article.findFirst({
      where: { slug, publishedAt: { not: null, lte: now } },
      include: { author: { select: { name: true } } },
    });
    if (!article) throw new NotFoundException(`Article "${slug}" not found`);
    return article;
  }

  // ── Create article (slug auto-generated from title.vi) ───────────────────────

  async create(authorId: string, body: unknown) {
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const titleVi = (parsed.data.title as { vi: string }).vi;
    let slug = slugify(titleVi);

    // Ensure slug uniqueness by appending numeric suffix if collision
    const conflict = await this.prisma.article.findUnique({ where: { slug } });
    if (conflict) {
      slug = `${slug}-${Date.now()}`;
    }

    // Cast typed Zod output to Prisma.InputJsonValue for Json columns
    return this.prisma.article.create({
      data: {
        ...parsed.data,
        slug,
        authorId,
        title: parsed.data.title,
        excerpt: parsed.data.excerpt,
        content: parsed.data.content as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // ── Partial update ────────────────────────────────────────────────────────────

  async update(id: string, body: unknown) {
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    // Build update payload, casting Json fields explicitly to satisfy Prisma types
    const { title, excerpt, content, ...rest } = parsed.data;
    const updateData: Prisma.ArticleUpdateInput = {
      ...rest,
      ...(title && { title: title }),
      ...(excerpt && { excerpt: excerpt }),
      ...(content && { content: content as unknown as Prisma.InputJsonValue }),
    };

    return this.prisma.article.update({ where: { id }, data: updateData });
  }

  // ── Publish: set publishedAt = now ────────────────────────────────────────────

  async publish(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    return this.prisma.article.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
  }

  // ── Hard delete ───────────────────────────────────────────────────────────────

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException(`Article ${id} not found`);

    return this.prisma.article.delete({ where: { id } });
  }
}
