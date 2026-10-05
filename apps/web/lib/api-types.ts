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
  priceVnd: number;
  durationMin: number;
  coverUrl?: string | null;
  gallery?: string[];
  featured?: boolean;
  active?: boolean;
  category?: string;
}

export interface Doctor {
  id: string;
  user: { id: string; name: string; email: string };
  specialty: LocalizedString;
  bio: LocalizedString;
  yearsExp: number;
  avatarUrl?: string | null;
  active?: boolean;
  order?: number;
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
  | 'EXPIRED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Booking {
  id: string;
  status: BookingStatus;
  note?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt?: string;
  service: {
    id: string;
    name: LocalizedString;
    durationMin: number;
    priceVnd: number;
  };
  doctor: {
    id: string;
    user: { id: string; name: string };
    specialty?: LocalizedString;
    bio?: LocalizedString;
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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---------- Admin extended types ----------

export interface ServiceAdmin extends Service {
  order?: number;
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
  content: LocalizedString | string | Record<string, unknown>;
  coverUrl?: string | null;
  tags: string[];
  featured?: boolean;
  publishedAt?: string | null;
  author?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface BookingAdmin extends Booking {
  user: { id: string; name: string; email: string };
}

export interface UserAdmin {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'CUSTOMER' | 'DOCTOR' | 'SUPERADMIN';
  locale: string;
  createdAt: string;
  updatedAt?: string;
}
