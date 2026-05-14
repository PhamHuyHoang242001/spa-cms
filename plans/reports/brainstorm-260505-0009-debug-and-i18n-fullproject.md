# Brainstorm: Full Project Debug & i18n Implementation

**Date:** 2026-05-05 | **Status:** Agreed | **Branch:** master

## Problem Statement

K-Beauty Spa CMS (Next.js 16 + NestJS 11 + PostgreSQL) has 9 phases implemented but:
- i18n completely missing despite Phase 04 marked "complete"
- Multiple unknown bugs — not thoroughly tested
- Frontend hardcodes Vietnamese, DB has bilingual data (vi/ko) unused
- Need comprehensive debug + i18n before production

## Agreed Approach: Debug-first → i18n-later

### Phase D1: Backend API Audit
- Verify Prisma schema sync with DB
- Test all endpoints: auth, doctors, services, slots, bookings, articles
- Check RBAC guards (CUSTOMER/DOCTOR/SUPERADMIN)
- Verify cron job (auto-expire bookings)
- Validate seed data integrity
- Check error handling & response formats

### Phase D2: Frontend Page Audit
- Render test all pages (home, services, doctors, blog, booking, admin)
- Check API integration (fetch, errors, loading states)
- Test auth flow (register → login → refresh → logout)
- Verify booking flow E2E (service → doctor → slot → confirm → success)
- Admin CRUD ops (create/edit/delete doctors, services, articles, slots)

### Phase D3: Fix All Found Bugs
- Batch fix backend issues
- Batch fix frontend issues
- Re-test after fixes

### Phase D4: i18n Implementation (next-intl + locale routing)

**Architecture:**
```
apps/web/
├── middleware.ts              # Locale detection & redirect
├── i18n/
│   ├── request.ts            # next-intl request config
│   └── routing.ts            # Locale routing config
├── messages/
│   ├── vi.json               # Vietnamese UI strings (~150 keys)
│   └── ko.json               # Korean UI strings (~150 keys)
├── app/
│   └── [locale]/             # All public routes wrapped
│       ├── layout.tsx         # NextIntlClientProvider
│       ├── page.tsx
│       ├── services/...
│       ├── doctors/...
│       ├── blog/...
│       ├── booking/...
│       └── me/...
│   └── admin/                # Admin stays outside [locale]
│       └── ...               # UI in Vietnamese, content editor has vi/ko tabs
```

**Key Decisions:**
- Default locale: `vi`
- Supported: `vi`, `ko`
- URL: `/vi/services`, `/ko/services` (prefix-based)
- Dynamic content: Read locale from params → `service.name[locale]`
- UI strings: `messages/vi.json` + `messages/ko.json`
- Persistence: Cookie `NEXT_LOCALE` + `User.locale` DB field
- Switcher: Header dropdown (🇻🇳 Tiếng Việt / 🇰🇷 한국어)
- Admin: Keep Vietnamese UI, only content editor supports vi/ko tabs

### Phase D5: Final Integration Test
- E2E both languages
- Auth + locale persistence
- SEO metadata per locale
- Mobile responsive

## Translation Scope

| Category | Count | Source |
|----------|-------|--------|
| UI strings (nav, buttons, labels) | ~150 keys | New messages/*.json |
| Service names & descriptions | 7 | DB JSON {vi, ko} |
| Doctor specialties & bios | 3 | DB JSON {vi, ko} |
| Articles (title, excerpt, content) | 3 | DB JSON {vi, ko} |
| Booking flow labels | ~30 keys | New translation keys |
| Error messages | ~20 keys | New translation keys |
| SEO metadata | ~10 pages | generateMetadata per locale |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| next-intl + Next.js 16 compatibility | Check docs early, test first |
| Routing refactor breaks links | Redirect middleware old→new |
| Booking state loss on locale switch | Persist to URL params / sessionStorage |
| Korean translation quality | Use existing DB seed, manual review |
| Tiptap content per locale | Tab-based editor (vi/ko) |

## Success Criteria

- [ ] All API endpoints correct
- [ ] All pages render without errors
- [ ] Auth flow E2E works
- [ ] Booking flow E2E works
- [ ] Admin CRUD works
- [ ] Language switcher vi ↔ ko
- [ ] URLs: /vi/... ↔ /ko/...
- [ ] Dynamic content shows correct language
- [ ] UI strings translated
- [ ] Locale persists across navigation + login
- [ ] SEO metadata per locale
- [ ] No console errors, no broken layouts

## Next Step

Create detailed implementation plan with `/ck:plan` for all 5 phases.
