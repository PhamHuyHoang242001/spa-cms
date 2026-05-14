# Phase 09 — Deploy (Vercel + Railway + Cloudinary + Domain)

**Priority:** Critical (for launch) | **Status:** completed | **Est:** 1d | **Depends:** 08

## Overview
Ship ra production: web lên Vercel, api+postgres lên Railway, Cloudinary live key, domain + SSL, basic analytics + uptime.

## Deployment Plan

### 1. Railway — API + PostgreSQL
- Create project, attach Postgres plugin (Free → Hobby $5/m khi live).
- Add service from GitHub repo, root `apps/api`, build `pnpm install && pnpm --filter api build`, start `node dist/main.js`.
- Env vars:
  - `DATABASE_URL` (auto from Postgres plugin)
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (generate via openssl rand -hex 32)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `CORS_ORIGIN=https://<vercel-domain>`
  - `NODE_ENV=production`
  - `PORT=$PORT` (Railway auto)
- Run migrations on deploy: `prisma migrate deploy` hook post-build.
- Run seed ONE time manually: `railway run pnpm --filter api prisma db seed` (remove admin creds from logs).
- Get public URL, note `<api-url>`.

### 2. Vercel — Next.js Web
- Import repo, root `apps/web`, framework Next.js, install `pnpm install`, build `pnpm --filter web build`.
- Env vars:
  - `NEXT_PUBLIC_API_URL=<api-url>`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...`
  - `NEXT_PUBLIC_SITE_URL=<production-domain>`
- Set Vercel project domain hoặc custom.

### 3. Cloudinary
- Tạo production account (free tier), ghi env.
- Configure upload preset (signed only).
- Whitelist domains.

### 4. Domain & DNS
- Mua domain (ví dụ `spahankorea.vn` — xác nhận với user).
- Point A/CNAME:
  - `@` / `www` → Vercel (per instruction).
  - `api` → Railway custom domain.
- Wait DNS + SSL provision (Vercel auto, Railway auto).
- Update `CORS_ORIGIN` + `NEXT_PUBLIC_API_URL` sau khi DNS xong.

### 5. Analytics & Monitoring
- Vercel Web Analytics (free, auto).
- Sentry: create project, add DSN env, enable trong next.config + nest main.
- Uptime: UptimeRobot (free) ping `GET <api-url>/health` every 5min.

### 6. Health Endpoints
- `GET /health` → 200 `{status:'ok', db:'up'}`
- Add Prisma ping trong healthcheck.

### 7. Backup
- Railway Postgres: enable scheduled backup (daily).
- Doc restore procedure trong `docs/deployment-guide.md`.

### 8. Launch Checklist
- [x] Smoke test register/login/book trên prod.
- [x] Verify i18n vi/ko work.
- [x] Verify Cloudinary images load.
- [x] Verify admin login with seeded superadmin (rotate password immediately).
- [x] Verify cron expiry trong Railway logs (wait 5-10min, manually create booking với endsAt nhỏ để test).
- [x] Lighthouse on prod URL ≥ 90.
- [x] SSL A+ (ssllabs).
- [x] SEO: sitemap.xml + robots.txt accessible.
- [x] Set production NODE_ENV + remove debug logs.

## Files to Create

- `apps/api/Dockerfile` (optional, Railway uses Nixpacks by default)
- `apps/api/src/health/health.controller.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- `.github/workflows/deploy.yml` — optional: run tests gate before Railway/Vercel auto-deploy
- `docs/deployment-guide.md`

## Todo

- [x] Railway project + Postgres attached
- [x] API deployed, migrations ran
- [x] Seed ran, superadmin password rotated
- [x] Vercel web deployed
- [x] Cloudinary production config
- [x] Domain purchased + DNS pointed
- [x] SSL working both FE + API
- [x] CORS allow production FE only
- [x] Sentry live, test error captured
- [x] Uptime monitor alert to email
- [x] Sitemap + robots
- [x] Launch smoke test passed
- [x] Deployment guide doc
- [x] Handover creds to owner via 1Password/secure channel

## Success Criteria

- Public URL loads home, books a slot end-to-end trên production.
- Sub-2s LCP trên 4G.
- No 5xx trong 24h post-launch.
- Admin can login + CRUD working.
- Backups confirmed running.

## Risks

- CORS misconfig → blocks FE → verify trước launch.
- DB migration timing → run `prisma migrate deploy` trong build, not runtime (avoid race on scale).
- Hardcoded `localhost:3001` trong web → audit codebase, always use env.
- Timezone server: Railway default UTC — OK vì code dùng explicit Asia/Ho_Chi_Minh. Double-check.

## Next Steps (Post-MVP)

- Password reset (email OTP).
- Notification (email/SMS via Zalo ZNS khi book success).
- OAuth login.
- Online deposit payment.
- Multi-branch.
- Analytics dashboard deep (GA4).
- Automated daily content scheduling.
