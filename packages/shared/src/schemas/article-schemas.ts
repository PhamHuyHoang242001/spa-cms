// article-schemas.ts — Zod schemas for Article (blog) CRUD endpoints
import { z } from 'zod';

// Bilingual text field schema (Vietnamese + Korean)
const i18nTextSchema = z.object({
  vi: z.string().min(1, 'Vietnamese text is required'),
  ko: z.string().min(1, 'Korean text is required'),
});

// Tiptap JSON document schema (permissive — validates basic structure only)
const tiptapDocSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.record(z.string(), z.unknown())).default(() => []),
});

const i18nContentSchema = z.object({
  vi: tiptapDocSchema,
  ko: tiptapDocSchema,
});

export const createArticleSchema = z.object({
  title: i18nTextSchema,
  excerpt: i18nTextSchema,
  content: i18nContentSchema,
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

export const updateArticleSchema = z.object({
  title: i18nTextSchema.optional(),
  excerpt: i18nTextSchema.optional(),
  content: i18nContentSchema.optional(),
  coverUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
