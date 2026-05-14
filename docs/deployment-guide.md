# Deployment Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node | 20+ |
| pnpm | 9+ |
| Docker | 20+ |

---

## Local Development

```bash
# 1. Clone and install
git clone <repo-url> && cd spa-cms
pnpm install

# 2. Start Postgres (Docker, port 5433)
pnpm db:up

# 3. Configure environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Fill in secrets — see Environment Variables section below

# 4. Run migrations and seed
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed

# 5. Start dev servers
cd ../..
pnpm dev
# Web → http://localhost:3000
# API → http://localhost:3001
# Health → http://localhost:3001/health
```

---

## Production Deployment

This repo is a pnpm/Turborepo monorepo. Keep `apps/web`, `apps/api`, and
`packages/shared` in the same GitHub repository for deployment. Both Vercel and
Render support this setup, and it avoids breaking the local `workspace:*`
dependency on `@spa/shared`.

### GitHub

```bash
git add .
git commit -m "chore: prepare deploy config"
git branch -M main
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
```

If you prefer HTTPS:

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

### Render — API + Postgres

Recommended: use the root `render.yaml` Blueprint.

1. Push this repo to GitHub.
2. In Render, create a **Blueprint** from the GitHub repo.
3. Render will create:
   - `spa-cms-api` web service
   - `spa-cms-db` Postgres database
4. Fill prompted secrets:
   - `CORS_ORIGIN`: your Vercel production URL, e.g. `https://your-site.vercel.app`
   - Cloudinary variables if uploads should work in production
5. Build/predeploy/start are already defined in `render.yaml`:
   - Build: install workspace deps, build `@spa/shared`, generate Prisma client, build API
   - Predeploy: `prisma migrate deploy`
   - Start: `pnpm --filter api start:prod`

Manual Render service settings if you do not use Blueprint:

| Setting | Value |
|---------|-------|
| Runtime | Node |
| Root Directory | leave empty |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @spa/shared build && pnpm --filter api exec prisma generate && pnpm --filter api build` |
| Pre-Deploy Command | `pnpm --filter api exec prisma migrate deploy` |
| Start Command | `pnpm --filter api start:prod` |
| Health Check Path | `/health` |

### Vercel — Web (Next.js)

1. Import the same GitHub repo on Vercel.
2. Set **Root Directory** to `apps/web`.
3. Enable **Include source files outside of the Root Directory in the Build Step**
   because `apps/web` imports `packages/shared`.
4. Framework preset: **Next.js** (auto-detected).
5. Install command: leave default (`pnpm install`).
6. Build command: leave default or set `pnpm build`.
7. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: your Render API URL
   - `NEXT_PUBLIC_SITE_URL`: your Vercel site URL
8. Deploy.

After both services are live, update Render `CORS_ORIGIN` to exactly match the
Vercel production origin.

### Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From Dashboard copy **Cloud Name**, **API Key**, **API Secret**.
3. Add to Railway API service env vars.
4. (Optional) Create an upload preset for unsigned uploads from the web client.

### Domain + DNS

```
A   @       → Vercel IP (provided in Vercel dashboard)
CNAME www   → cname.vercel-dns.com
CNAME api   → your-api.up.railway.app
```

Add custom domain in both Vercel (web) and Railway (API) dashboards, then update `CORS_ORIGIN` and `NEXT_PUBLIC_API_URL` to use the real domains.

---

## Environment Variables Reference

### API (`apps/api/.env` / Render service env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@host/db` |
| `JWT_ACCESS_SECRET` | Access token signing secret | random 64-char string |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | random 64-char string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `my-spa` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc...` |
| `CORS_ORIGIN` | Allowed web origin, exact Vercel/custom-domain origin | `https://yourdomain.com` |
| `PORT` | HTTP port (Railway sets automatically) | `3001` |
| `SENTRY_DSN` | Sentry error tracking DSN (optional) | `https://...@sentry.io/...` |

### Web (`apps/web/.env.local` / Vercel project env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (sitemap/robots) | `https://yourdomain.com` |
| `SENTRY_DSN` | Sentry DSN (optional) | `https://...@sentry.io/...` |

---

## Post-Deploy Checklist

- [ ] `GET /health` returns `{ status: 'ok' }`
- [ ] `GET /api/services` returns service list (public endpoint)
- [ ] Admin login works at `/admin/login`
- [ ] Image upload via Cloudinary succeeds
- [ ] Booking form submits without errors
- [ ] CORS is restricted to production domain only
- [ ] `DATABASE_URL` points to production DB (not local Docker)
- [ ] JWT secrets are unique and at least 32 chars
- [ ] `NEXT_PUBLIC_SITE_URL` matches actual domain (for sitemap/robots.txt)
