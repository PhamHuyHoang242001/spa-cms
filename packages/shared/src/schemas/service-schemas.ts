// service-schemas.ts — Zod schemas for Service (treatment package) CRUD endpoints
import { z } from 'zod';

const i18nTextSchema = z.object({
  vi: z.string().min(1, 'Vietnamese text is required'),
  ko: z.string().min(1, 'Korean text is required'),
});

export const createServiceSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: i18nTextSchema,
  description: i18nTextSchema,
  priceVnd: z.number().int().min(0, 'Price must be non-negative'),
  durationMin: z.number().int().min(15, 'Duration must be at least 15 minutes'),
  coverUrl: z.string().url().optional(),
  gallery: z.array(z.string().url()).default([]),
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

export const updateServiceSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  name: i18nTextSchema.optional(),
  description: i18nTextSchema.optional(),
  priceVnd: z.number().int().min(0).optional(),
  durationMin: z.number().int().min(15).optional(),
  coverUrl: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
