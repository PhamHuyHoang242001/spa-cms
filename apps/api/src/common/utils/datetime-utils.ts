// datetime-utils.ts — Date/time helpers for VN timezone (UTC+7, no DST)

/**
 * Combine a Prisma Date (UTC midnight) and "HH:MM" string into a full Date.
 * All times are treated as Asia/Ho_Chi_Minh local (UTC+7, fixed, no DST).
 * The `date` field stored by Prisma @db.Date comes back as midnight UTC,
 * so we extract the YYYY-MM-DD portion as stored and apply the VN offset.
 */
export function combineDateTime(date: Date, time: string): Date {
  // Extract date part from ISO string — @db.Date is stored as UTC midnight
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return new Date(`${dateStr}T${time}:00+07:00`);
}
