// booking-schemas.ts — Zod schemas for Booking create and cancel endpoints
import { z } from 'zod';

// Create booking: requires slotId, serviceId, doctorId; optional customer note
export const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'serviceId is required'),
  doctorId: z.string().min(1, 'doctorId is required'),
  slotId: z.string().min(1, 'slotId is required'),
  note: z.string().max(500).optional(),
});

// Cancel booking: optional cancellation reason (required for SUPERADMIN)
export const cancelBookingSchema = z.object({
  cancelReason: z.string().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
