# Documentation Index

Complete documentation for K-Beauty Spa CMS. All docs updated as of Phase 01 auth implementation.

## Core Documentation

### 1. [Project Overview & PDR](./project-overview-pdr.md)
**Start here for:** Project vision, scope, tech stack, requirements, roadmap

**Key Sections:**
- Project vision & scope
- Tech stack (NestJS 11, Next.js 16, Prisma 7, PostgreSQL)
- Functional & non-functional requirements
- Phase roadmap (00-09)
- API contracts
- Success criteria

**For:** New developers, stakeholders, project managers

---

### 2. [System Architecture](./system-architecture.md)
**Start here for:** How the system works, data flows, component interactions

**Key Sections:**
- High-level architecture diagram
- Monorepo organization
- Auth flows (register, login, refresh, logout, protected routes)
- Token management
- Database schema
- Security & error handling
- Scalability considerations
- Deployment architecture

**For:** Architects, senior developers, code reviewers

---

### 3. [Code Standards](./code-standards.md)
**Start here for:** How to write code, naming conventions, patterns

**Key Sections:**
- NestJS module structure & patterns
- Next.js component patterns
- Service & controller patterns
- Guards & decorators
- Error handling standards
- Validation with Zod
- Testing structure
- Git workflow & commit messages
- Naming conventions
- Code quality tools

**For:** All developers implementing features

---

### 4. [Codebase Summary](./codebase-summary.md)
**Start here for:** Understanding current code structure, finding files, dependencies

**Key Sections:**
- Backend file structure & services
- Frontend pages & components
- Shared package exports
- Database models
- Dependencies & versions
- Build & dev scripts
- Security features implemented
- Testing coverage
- Deployment readiness

**For:** Developers exploring codebase, onboarding

---

## Implementation Phases

See `plans/260421-2300-k-beauty-spa-website/` for detailed phase files:

| Phase | Status | Details |
|-------|--------|---------|
| **00-Setup** | ✓ Complete | Turborepo, NestJS, Next.js, Prisma, Docker |
| **01-Auth** | ✓ Complete | JWT, register/login/refresh/logout, roles |
| **02-Core Entities** | 📋 Planned | Doctors, services, availability |
| **03-Booking Logic** | 📋 Planned | Scheduling, cancellation, confirmation |
| **04-Landing** | 📋 Planned | Marketing pages, SEO |
| **05-Blog** | 📋 Planned | Articles, content management |
| **06-Dashboard** | 📋 Planned | Customer bookings & profile |
| **07-Admin** | 📋 Planned | CRUD, reporting, management |
| **08-Polish** | 📋 Planned | Performance, mobile, optimization |
| **09-Deploy** | 📋 Planned | Staging, production, DevOps |

---

## Quick Start

### Local Development
```bash
# 1. Install dependencies
pnpm install

# 2. Start database
pnpm db:up

# 3. Setup environment
cp .env.example apps/api/.env

# 4. Run in dev mode
pnpm dev
```

**Apps:**
- Web (frontend): http://localhost:3000
- API (backend): http://localhost:3001
- Database: localhost:5432

### Build & Deployment
```bash
pnpm build          # Build all apps
pnpm test           # Run all tests
pnpm lint           # Lint & type-check
pnpm db:down        # Stop database
```

See [Code Standards](./code-standards.md#git-workflow) for git workflow & commit messages.

---

## Documentation Organization

**Use this guide to find what you need:**

### "I want to..."

**Understand the project**
→ Read [Project Overview](./project-overview-pdr.md)

**Set up my development environment**
→ See Quick Start (above)

**Write code that follows standards**
→ Read [Code Standards](./code-standards.md)

**Understand how auth works**
→ See [System Architecture](./system-architecture.md#authentication-flow)

**Find a specific file or component**
→ Check [Codebase Summary](./codebase-summary.md)

**Deploy to production**
→ See [System Architecture](./system-architecture.md#deployment-architecture) (Phase 09 for details)

**Implement a new feature**
→ Read related phase docs in `plans/260421-2300-k-beauty-spa-website/`

---

## Key Concepts

### Token Management
- **Access Token:** JWT, 15-min TTL, stored in-memory (FE)
- **Refresh Token:** Random 48-byte string, 7-day TTL, SHA-256 hashed in DB, rotated on use
- **Auto-Refresh:** Frontend intercepts 401, refreshes, retries request

See [System Architecture — Token Management](./system-architecture.md#token-management) for details.

### Module Structure
Each NestJS module (auth, users, prisma) has:
- `.module.ts` — Imports, exports, providers
- `.service.ts` — Business logic
- `.controller.ts` — HTTP endpoints
- `guards/`, `strategies/`, `decorators/`, `dto/` — Supporting files

See [Code Standards — NestJS](./code-standards.md#nestjs-code-standards) for patterns.

### Database Schema
- **User:** id, email, password hash, name, phone, role, locale
- **RefreshToken:** id, userId, tokenHash, expiresAt, revokedAt
- **Role:** CUSTOMER, DOCTOR, SUPERADMIN

See [Codebase Summary — Database](./codebase-summary.md#database-schema-prisma) for schema.

---

## Testing

### Unit Tests
Services, helpers, utilities

```bash
pnpm --filter api test
```

### Integration Tests
API endpoints, guards, validation

```bash
pnpm --filter api test
```

### E2E Tests
Full workflows (register → login → /me → refresh → logout)

```bash
pnpm --filter api test:e2e
```

See [Code Standards — Testing](./code-standards.md#testing-standards) for patterns.

---

## Security Checklist

✓ **Implemented (Phase 01):**
- bcrypt password hashing (cost 12)
- JWT access + refresh tokens
- Token rotation on refresh
- Rate limiting (10 req/min on /auth/*)
- Zod input validation
- Password never exposed in responses
- Generic error messages (no user enumeration)

⚠ **Not yet implemented:**
- HTTPS/TLS enforcement
- CORS whitelist configuration
- Helmet.js headers (imported, needs configuration)
- CSRF protection
- Refresh token reuse detection
- Login audit logs

See [System Architecture — Security](./system-architecture.md#error-handling--security) for details.

---

## Monitoring & Maintenance

### Code Quality
- **Linting:** `pnpm lint`
- **Type-checking:** `pnpm typecheck`
- **Testing:** `pnpm test`

### Documentation
- Update docs after each phase completion
- Keep API contracts (endpoints table) current
- Document breaking changes

### Database
- Regular backups (Phase 09)
- Monitor query performance
- Archive old refresh tokens

---

## Getting Help

1. **Understanding architecture?** → [System Architecture](./system-architecture.md)
2. **Need code examples?** → [Code Standards](./code-standards.md)
3. **Looking for a file?** → [Codebase Summary](./codebase-summary.md)
4. **Want project context?** → [Project Overview](./project-overview-pdr.md)
5. **Implementing Phase 02?** → `plans/260421-2300-k-beauty-spa-website/phase-02-core-entities.md`

---

## Document Status

| Doc | Lines | Last Updated | Status |
|-----|-------|--------------|--------|
| project-overview-pdr.md | 199 | 2026-04-22 | ✓ Current |
| system-architecture.md | 407 | 2026-04-22 | ✓ Current |
| code-standards.md | 714 | 2026-04-22 | ✓ Current |
| codebase-summary.md | 530 | 2026-04-22 | ✓ Current |
| **Total** | **1,850** | — | **✓ Complete** |

All docs verified against Phase 01 implementation. Next update planned after Phase 02 completion.

---

**Last Updated:** 2026-04-22 | **Phase:** 01-Auth | **Contributors:** docs-manager
