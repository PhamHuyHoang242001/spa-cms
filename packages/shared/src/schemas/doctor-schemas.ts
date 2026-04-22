// doctor-schemas.ts — Zod schemas for DoctorProfile CRUD endpoints
import { z } from 'zod';

const i18nTextSchema = z.object({
  vi: z.string().min(1, 'Vietnamese text is required'),
  ko: z.string().min(1, 'Korean text is required'),
});

export const createDoctorSchema = z.object({
  // User fields
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().optional(),
  // DoctorProfile fields
  specialty: i18nTextSchema,
  bio: i18nTextSchema,
  avatarUrl: z.string().url().optional(),
  yearsExp: z.number().int().min(0).default(0),
  order: z.number().int().min(0).default(0),
});

export const updateDoctorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  specialty: i18nTextSchema.optional(),
  bio: i18nTextSchema.optional(),
  avatarUrl: z.string().url().optional().nullable(),
  yearsExp: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
