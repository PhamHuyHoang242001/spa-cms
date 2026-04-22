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

### Railway — API + Postgres

1. Create a new Railway project; add a **Postgres** service (Railway managed).
2. Add a new service from the GitHub repo, **Root Directory**: `apps/api`.
3. Set **Build Command**: `pnpm install && pnpm prisma generate && pnpm build`
4. Set **Start Command**: `node dist/main`
5. Set environment variables (see table below).
6. After first deploy, run migration via Railway shell:
   ```bash
   pnpm prisma migrate deploy
   ```
7. Copy the Railway-generated domain (e.g. `api.up.railway.app`) — needed for Vercel.

### Vercel — Web (Next.js)

1. Import repo on Vercel, set **Root Directory** to `apps/web`.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `pnpm build` (turbo handles it via `turbo.json`).
4. Set environment variables (see table below).
5. Deploy — Vercel handles CDN and edge caching automatically.

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

### API (`apps/api/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@host/db` |
| `JWT_ACCESS_SECRET` | Access token signing secret | random 64-char string |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | random 64-char string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `my-spa` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc...` |
| `CORS_ORIGIN` | Allowed web origin | `https://yourdomain.com` |
| `PORT` | HTTP port (Railway sets automatically) | `3001` |
| `SENTRY_DSN` | Sentry error tracking DSN (optional) | `https://...@sentry.io/...` |

### Web (`apps/web/.env.local`)

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
