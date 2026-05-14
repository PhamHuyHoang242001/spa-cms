-- Replace global "one active booking per user" with "one active booking per user per day"
DROP INDEX IF EXISTS "one_active_booking_per_user";
CREATE UNIQUE INDEX "one_active_booking_per_user_per_day" ON "Booking" ("userId", (CAST("startsAt" AS DATE))) WHERE status IN ('PENDING', 'CONFIRMED');
