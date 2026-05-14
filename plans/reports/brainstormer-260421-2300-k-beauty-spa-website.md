# Brainstorm Summary — K-Beauty Spa Website

**Date:** 2026-04-21
**Project:** spa-cms (greenfield)
**Stakeholder:** phamhoang (learn@collect.vn)
**Status:** Agreed on stack & scope, ready for planning phase

---

## 1. Problem Statement

Xây website quảng bá + đặt lịch cho spa chăm sóc da chuẩn Hàn Quốc. Hai mode:
- **Customer:** landing marketing đẹp, đa ngôn ngữ VN/KR, đặt lịch theo bác sĩ + slot 30p (9-12h, 14-18h), dashboard cá nhân, auth user/pass.
- **Admin:** doctor xem lịch của mình; superadmin CRUD toàn bộ (bác sĩ, nhân viên, gói dịch vụ, bài báo).

## 2. Agreed Tech Stack

| Layer | Choice | Lý do |
|---|---|---|
| FE | **Next.js 15 (App Router)** + TypeScript | SSR/SSG cho SEO marketing, i18n built-in, `next/image` tối ưu ảnh beauty, deploy Vercel 1-click |
| UI | **Tailwind + shadcn/ui + Framer Motion** | Premium minimal K-beauty vibe, component tái sử dụng, animation declarative |
| i18n | **next-intl** | Route-based `/vi`, `/ko`, SEO-friendly, tree-shake message |
| BE | **NestJS 10** + TypeScript | Module structure rõ cho RBAC customer/doctor/superadmin, DI clean, Guards/Interceptors chuẩn |
| DB | **PostgreSQL 16** + **Prisma** | Transactional booking (chống double-book), typesafe, migration dễ |
| Auth | **JWT access + refresh** (refresh lưu DB để revoke) | Stateless, scale tốt, chuẩn NestJS |
| Cron | **@nestjs/schedule** (cron mỗi 5p) | Auto-expire booking quá giờ |
| Storage | **Cloudinary** | Free 25GB, auto format/resize/quality, CDN, ideal cho beauty site |
| Editor | **Tiptap** (admin blog) | Headless, extend dễ, multi-lang content |
| Repo | **Turborepo monorepo** (`apps/web`, `apps/api`, `packages/shared`) | Share TS types, CI đơn giản, team nhỏ |
| Deploy | Vercel (web) + Railway (api + postgres) | Nhẹ nhàng, $10-20/tháng |

## 3. High-Level Architecture

```
apps/
├── web/              # Next.js 15 (App Router)
│   ├── (marketing)/  # Home, Services, Doctors, About, Blog — SSG
│   ├── (app)/        # Booking flow, My bookings — SSR + client
│   ├── (admin)/      # Admin + doctor panel — client-heavy
│   └── [locale]/     # vi, ko
├── api/              # NestJS
│   ├── modules/
│   │   ├── auth/     # JWT, guards, refresh
│   │   ├── users/    # customer, doctor, staff
│   │   ├── doctors/
│   │   ├── services/ # gói chăm sóc
│   │   ├── bookings/ # core logic + cron
│   │   ├── articles/ # blog multi-lang
│   │   └── uploads/  # Cloudinary signed upload
│   └── prisma/
packages/
├── shared/           # DTOs, Zod schemas, i18n keys
└── ui/               # (optional) shared components
```

## 4. Data Model (Prisma Sketch)

```prisma
User           { id, email, phone, passwordHash, role(CUSTOMER|DOCTOR|SUPERADMIN), locale, createdAt }
DoctorProfile  { userId, specialty, bio(i18n JSON), avatarUrl, yearsExp, order }
Service        { id, slug, name(i18n), description(i18n), priceVnd, durationMin, coverUrl, active }
TimeSlot       { id, doctorId, date, startTime, endTime, status(AVAILABLE|BOOKED|BLOCKED) }
Booking        { id, userId, doctorId, serviceId, slotId UNIQUE, status(PENDING|CONFIRMED|COMPLETED|EXPIRED|CANCELLED), note, createdAt, endsAt }
Article        { id, slug, title(i18n), content(i18n), coverUrl, authorId, publishedAt, tags[] }
RefreshToken   { id, userId, tokenHash, expiresAt, revokedAt }
```

**Key constraints:**
- `Booking.slotId` UNIQUE → DB-level guarantee chống double-book.
- Index `(userId, status)` để query "active booking của user" nhanh.
- Partial unique: max 1 booking với status in (PENDING, CONFIRMED) per userId — enforced bằng Postgres partial index.

## 5. Booking Logic (Core)

**Slot generation:**
- Mỗi doctor có working hours default (9-12, 14-18). Cron/manual generate TimeSlot 30 ngày tới (12 slot/ngày/doctor).
- Doctor có thể BLOCK slot (nghỉ phép).

**Create booking flow (transactional):**
1. User chọn doctor → hiển thị slot AVAILABLE từ API.
2. POST `/bookings` với slotId.
3. Prisma transaction:
   - Check user chưa có active booking (PENDING/CONFIRMED) → else 409.
   - Lock slot row `FOR UPDATE`, check AVAILABLE → else 409.
   - Update slot → BOOKED, create Booking PENDING.
4. Return booking. (Optional: confirm qua email/SMS sau.)

**Auto-expire cron (mỗi 5 phút):**
- Find bookings PENDING/CONFIRMED với slot.endTime < now → flip status EXPIRED, free slot (nếu business cho tái sử dụng) hoặc để BOOKED.
- Log cho analytics.

**Cancel by user:**
- Chỉ allow khi slot.startTime > now + 2h (chống cancel phút chót). Slot về AVAILABLE.

## 6. Frontend — Customer UI

### Home (wow factor, premium minimal)
- **Hero:** full-height, video loop nhẹ (facial treatment close-up) + headline animate mờ dần → rõ (Framer Motion). CTA "Đặt lịch ngay".
- **Trust bar:** logos (Korea Beauty Association, certifications) — grayscale hover color.
- **Services grid:** 6 gói (xem §7), card parallax nhẹ khi scroll, hover scale 1.02 + shadow.
- **Doctor showcase:** carousel (Embla) với photo portrait + bio ngắn, link detail.
- **Process timeline:** 5 bước consultation → skin analysis → treatment → aftercare → follow-up, scroll-triggered reveal.
- **Testimonials:** masonry grid + before/after slider (react-compare-slider).
- **Blog latest 3:** card layout.
- **Footer:** Zalo/Facebook/Instagram, địa chỉ, map embed.

### Animation budget
- Framer Motion cho enter/exit, scroll reveal (`whileInView`).
- Tránh Three.js/heavy WebGL — giữ Lighthouse >90.
- Prefers-reduced-motion: respect.

### Other pages
- `/services` list + `/services/[slug]` detail với booking CTA.
- `/doctors` + `/doctors/[slug]`.
- `/blog` + `/blog/[slug]` (SSG + ISR 1h).
- `/booking` multi-step: chọn service → chọn doctor → chọn slot → confirm.
- `/me/bookings` (tabs: Active | History).

## 7. Skincare Packages (gợi ý, tham khảo thị trường K-beauty)

1. **Hydra-Glow Facial** — Signature Hàn hydrate tầng sâu, mặt nạ LED, 60p — 1.200.000đ.
2. **Aqua Peel + Collagen** — Tẩy tế bào chết + tiêm tinh chất collagen, 75p — 1.800.000đ.
3. **Gold Jelly Mask Premium** — Mặt nạ jelly vàng 24k chống lão hóa, 90p — 2.500.000đ.
4. **Acne Clear Therapy** — Trị mụn công nghệ cao áp + serum BHA, 60p — 900.000đ.
5. **Whitening Vitamin C Infusion** — Truyền trắng điện di Vit C, 75p — 1.500.000đ.
6. **MTS Micro-Needling Rejuvenation** — Lăn kim phục hồi sẹo, 90p — 2.200.000đ.
7. **Couple/Bridal Package** — Combo 3 buổi trước cưới, deal giá.

→ Gói này superadmin edit được sau, hard-code lúc seed DB.

## 8. Multi-Language Strategy

- `next-intl` với routing `/vi/*` và `/ko/*`, default `/vi`.
- Content i18n lưu DB dạng JSON: `{ vi: "...", ko: "..." }` cho services, articles, doctor bio.
- UI strings: `messages/vi.json`, `messages/ko.json` trong `apps/web`.
- Switcher ở header (lưu cookie `NEXT_LOCALE`).

## 9. Admin Panel

**Doctor view:**
- Today's schedule (list + calendar).
- My bookings (upcoming/past), mark NO_SHOW, add treatment note.
- Block time off (tạo TimeSlot BLOCKED).

**Superadmin view:**
- Dashboard KPIs: bookings/day, revenue (manual input), top services.
- CRUD: Doctors, Services, Articles (Tiptap editor, multi-lang tabs), Users, Bookings (override/cancel).
- Role management.

**UI:** Tách route group `/admin/*`, dùng shadcn DataTable + Sidebar. Role guard middleware.

## 10. Implementation Phases (proposed)

| Phase | Scope | Est |
|---|---|---|
| **00 Setup** | Turborepo init, Next + Nest skeleton, Prisma, CI, Docker compose for local Postgres | 1d |
| **01 Auth** | User model, register/login/refresh, JWT guards, role enum | 1.5d |
| **02 Core entities** | Doctor, Service, TimeSlot CRUD + seed packages | 1.5d |
| **03 Booking logic** | Slot generation, transactional create, active rule, cron expire, cancel | 2.5d |
| **04 Landing marketing** | Home hero + services + doctors + process + testimonials + footer, i18n skeleton | 3d |
| **05 Blog/Articles** | Tiptap editor admin, public list/detail, ISR, SEO meta | 2d |
| **06 Customer dashboard** | Booking flow UI, My bookings, history | 2d |
| **07 Admin panel** | Doctor view, superadmin CRUDs | 3d |
| **08 Polish** | Animation pass, Lighthouse, a11y, error boundaries, empty states | 2d |
| **09 Deploy** | Vercel + Railway, env, Cloudinary, domain, analytics | 1d |

**Tổng:** ~19-21 ngày effective (1 dev full-time). Scope lớn, nên chia release:
- **Release 1 (10 ngày):** Landing + auth + booking + user dashboard → ra mắt khách.
- **Release 2 (+7 ngày):** Admin panel full + blog CMS.
- **Release 3:** Polish + deploy production.

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Double-book race | DB unique on `Booking.slotId` + `SELECT FOR UPDATE` trong transaction |
| Cron miss / downtime | Idempotent, compute-on-read fallback khi hiển thị cho user |
| Heavy animation hurt mobile | Budget strict, prefers-reduced-motion, lazy mount below-fold |
| i18n content editor UX | Tiptap với tab VN/KR, validation bắt 2 bản trước publish |
| Cloudinary free tier limit | Transform on-the-fly thay vì store nhiều size; watermark bản demo |
| Timezone drift (doctor ở VN, slot store UTC) | Store `date`, `startTime` as local date+time; convert chỉ ở display; fix TZ = Asia/Ho_Chi_Minh |
| Password reset chưa có | MVP bỏ qua, release 2 thêm (email OTP hoặc admin reset) |

## 12. Security Baseline

- bcrypt password (cost 12).
- Rate-limit login/register (`@nestjs/throttler`).
- CORS whitelist domain FE.
- Helmet headers.
- Zod/class-validator validate mọi DTO.
- Role guards + resource ownership checks (doctor chỉ xem booking của mình).
- Secrets trong Railway env, không commit.

## 13. Success Metrics

- Lighthouse ≥ 90 (perf/a11y/seo) trên home.
- Booking create success rate > 99% (không double-book).
- First booking from public user trong tuần đầu launch.
- SEO: Google Search Console index 10+ page trong 2 tuần.

## 14. Out of Scope (MVP) — phase 2+

- OAuth (Google/Facebook/Zalo login).
- SMS/email notification (chỉ in-app trước).
- Online payment / deposit.
- Review & rating sau treatment.
- Loyalty points, membership tier.
- Mobile app.
- Multi-branch (hiện coi như 1 chi nhánh).

## 15. Open Questions

1. Có cần **booking cho người chưa đăng ký** (guest booking với phone) không, hay bắt buộc login?
2. Số lượng **bác sĩ thực tế** hiện có (để seed DB realistic)?
3. Có **logo + brand guideline** sẵn chưa (màu chủ đạo, font)?
4. **Địa chỉ spa** và có cần embed Google Maps không?
5. Khung giờ **14-18h** cho nghỉ trưa 12-14h — có ngoại lệ weekend không?
6. **Tên miền** dự định (để setup DNS/SSL sớm)?
7. Khi booking **expire**, slot có **trả lại AVAILABLE** không (cho user khác đặt) hay giữ BOOKED?

---

**Next step:** Nếu ok, tạo implementation plan chi tiết qua `/ck:plan` để chia phase thành task + TODO có thể execute.
