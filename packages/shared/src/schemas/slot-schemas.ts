// slot-schemas.ts — Zod schemas for TimeSlot generation and query endpoints
import { z } from 'zod';

export const generateSlotsSchema = z.object({
  doctorId: z.string().min(1, 'doctorId is required'),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be YYYY-MM-DD'),
  days: z.number().int().min(1).max(90).default(30),
});

export const slotQuerySchema = z.object({
  doctorId: z.string().min(1, 'doctorId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export type GenerateSlotsInput = z.infer<typeof generateSlotsSchema>;
export type SlotQueryInput = z.infer<typeof slotQuerySchema>;
