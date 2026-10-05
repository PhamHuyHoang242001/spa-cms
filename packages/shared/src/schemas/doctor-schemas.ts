// doctor-schemas.ts — Zod schemas for DoctorProfile CRUD endpoints
import { z } from 'zod';

const i18nTextSchema = z.object({
  vi: z.string().min(1, 'Vietnamese text is required'),
  ko: z.string().min(1, 'Korean text is required'),
});

const imageUrlSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/uploads\/[^/]+$/, 'Invalid upload path'),
]);

export const createDoctorSchema = z.object({
  // User fields
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().optional(),
  // DoctorProfile fields
  specialty: i18nTextSchema,
  bio: z.object({ vi: z.string(), ko: z.string() }).default({ vi: '', ko: '' }),
  avatarUrl: imageUrlSchema.optional().nullable(),
  yearsExp: z.number().int().min(0).default(0),
  order: z.number().int().min(0).optional(),
  active: z.boolean().default(true),
});

export const updateDoctorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  specialty: i18nTextSchema.optional(),
  bio: i18nTextSchema.optional(),
  avatarUrl: imageUrlSchema.optional().nullable(),
  yearsExp: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
