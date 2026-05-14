# Phase 06 — Customer Dashboard (Booking Flow + My Bookings)

**Priority:** High | **Status:** completed | **Est:** 2d | **Depends:** 03, 04

## Overview
FE flow đặt lịch multi-step + dashboard cá nhân. Respect rule 1 active booking/user.

## Pages

### `/booking` (multi-step)
Step 1: chọn service (grid card, có thể prefill từ query `?service=slug`).
Step 2: chọn doctor (avatar + specialty) — filter theo service nếu cần.
Step 3: chọn ngày (calendar mini 14 ngày tới) + slot (12 buttons, disabled nếu BOOKED).
Step 4: confirm + note optional + submit.
Step 5: success screen với booking code + CTA "Xem lịch của tôi".

### `/me/bookings` (tabs: Active | History)
- **Active** tab: 1 card với booking PENDING/CONFIRMED (max 1), hiển thị ngày/giờ/doctor/service, countdown tới giờ hẹn, CTA "Hủy" (disabled nếu < 2h) + "Xem chi tiết".
- **History** tab: list bookings COMPLETED/EXPIRED/CANCELLED/NO_SHOW, status badge, ngày hẹn.

### `/me/profile`
- Edit name, phone, locale preference.
- Change password (R1 basic).

## Files to Create

- `apps/web/app/[locale]/booking/page.tsx` — stepper container
- `apps/web/app/[locale]/booking/_steps/{service,doctor,slot,confirm,success}.tsx`
- `apps/web/app/[locale]/me/bookings/page.tsx` — tabs
- `apps/web/app/[locale]/me/profile/page.tsx`
- `apps/web/components/booking/slot-picker.tsx` — 12 buttons grid 9-12, 14-18
- `apps/web/components/booking/date-strip.tsx` — 14-day horizontal scroll
- `apps/web/components/booking/booking-card.tsx`
- `apps/web/components/auth/require-auth.tsx` — client wrapper redirect `/login`
- `apps/web/lib/api/bookings.ts` — typed client

## State Management

Use URL search params cho booking steps (deep-linkable, refresh-safe) + React useState ephemeral:
```
/booking?step=slot&service=hydra-glow&doctor=dr-kim&date=2026-04-22
```

Finish step 4 → POST /bookings → redirect `/me/bookings?newBookingId=...`.

## Key UX Rules

- Nếu user đã có active booking → step 4 show warning + CTA "Hủy lịch cũ trước". Disable submit.
- Slot picker: real-time fetch lại `/slots?doctorId=&date=` khi đổi doctor/date.
- Optimistic UI: sau POST thành công, invalidate cache, animate card slide-in ở `/me/bookings`.
- Error state: 409 ACTIVE_BOOKING_EXISTS → toast + auto redirect.

## Implementation Steps

1. Install `@tanstack/react-query` cho data fetching + cache invalidation.
2. Setup QueryClient Provider trong app layout.
3. Build stepper container reading `step` from searchParams.
4. Each step component: form state via `useForm` (react-hook-form) + validation Zod.
5. Slot picker: show 12 slots, `disabled` nếu status !== AVAILABLE. Loading skeleton.
6. Confirm step: summary card, agree checkbox, submit button.
7. My bookings tabs: Tabs từ shadcn, 2 queries `getActiveBooking` + `getHistory`.
8. Countdown component: `date-fns formatDistanceStrict`, refresh every 30s.
9. Cancel action: confirmation dialog, mutation invalidate queries.
10. Profile page: simple form, PATCH `/auth/me`.
11. Test full flow E2E (Playwright): register → book → see active → cancel → history.

## Todo

- [x] react-query setup
- [x] Booking stepper container
- [x] Service selection step (grid cards)
- [x] Doctor selection step
- [x] Date strip + slot picker
- [x] Confirm step với active-booking check
- [x] Success screen
- [x] My bookings page tabs
- [x] Active booking card với countdown
- [x] History list
- [x] Cancel action với 2h rule UI
- [x] Profile page edit
- [x] Require-auth wrapper cho /booking, /me/*
- [x] E2E happy path test

## Success Criteria

- User flow: login → chọn service/doctor/slot → confirm → /me/bookings shows active.
- Second booking attempt trước khi hủy cái cũ → error clear.
- Cancel button disabled khi < 2h; enabled khi > 2h.
- Countdown correct ở TZ Asia/Ho_Chi_Minh.
- Mobile: stepper workable trên 375px.

## Risks

- Race condition: slot picker stale → fetch fresh before submit; handle 409 gracefully.
- TZ mismatch display: explicit `formatInTimeZone(date, 'Asia/Ho_Chi_Minh', 'HH:mm')`.

## Next Steps

Phase 07 Admin panel consumes similar patterns (calendar, cards).
