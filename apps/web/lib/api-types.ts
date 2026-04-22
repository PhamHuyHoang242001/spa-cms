// api-types.ts — Shared TypeScript types for API responses
// API returns i18n fields as { vi: string; ko: string }

export interface LocalizedString {
  vi: string;
  ko: string;
}

export interface Service {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  duration: number; // minutes
  category?: string;
  imageUrl?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: LocalizedString;
  bio: LocalizedString;
  yearsExp: number;
  avatarUrl?: string;
}

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface Slot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  status: SlotStatus;
  doctorId: string;
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Booking {
  id: string;
  status: BookingStatus;
  note?: string;
  cancelReason?: string;
  createdAt: string;
  service: {
    id: string;
    name: LocalizedString;
    duration: number;
    price: number;
  };
  doctor: {
    id: string;
    name: string;
    specialty: LocalizedString;
  };
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

export interface CreateBookingInput {
  serviceId: string;
  doctorId: string;
  slotId: string;
  note?: string;
}

// ---------- Admin extended types ----------

export interface ServiceAdmin extends Service {
  priceVnd?: number;
  durationMin?: number;
  featured?: boolean;
  active?: boolean;
}

export interface DoctorAdmin extends Doctor {
  id: string;
  email: string;
  phone?: string;
  active?: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: string;
  tags: string[];
  published: boolean;
  author?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
