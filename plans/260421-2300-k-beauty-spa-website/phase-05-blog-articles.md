# Phase 05 — Blog & Articles (Tiptap CMS + Public)

**Priority:** Medium | **Status:** completed | **Est:** 2d | **Depends:** 01, 02

## Overview
Admin tự soạn bài qua Tiptap editor với tabs VN/KR. Public blog list + detail page với ISR, SEO, OG images. Bài viết là JSON Tiptap document lưu DB (flexible).

## Data Model (Prisma)

```prisma
model Article {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       Json                     // { vi, ko }
  excerpt     Json                     // { vi, ko }
  content     Json                     // { vi: TiptapJSON, ko: TiptapJSON }
  coverUrl    String?
  tags        String[]
  authorId    String
  publishedAt DateTime?
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  author      User     @relation(fields: [authorId], references: [id])

  @@index([publishedAt])
  @@index([tags])
}
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/articles?page=&tag=` | public | Published only, paginated |
| GET | `/articles/:slug` | public | Detail (published only unless admin) |
| POST | `/articles` | SUPERADMIN | Create draft |
| PATCH | `/articles/:id` | SUPERADMIN | Update |
| PATCH | `/articles/:id/publish` | SUPERADMIN | Set publishedAt=now |
| DELETE | `/articles/:id` | SUPERADMIN | Hard delete |

## Files to Create

**API:**
- `apps/api/src/articles/articles.{module,controller,service}.ts`
- `apps/api/src/articles/dto/*.ts`

**Web (Public):**
- `apps/web/app/[locale]/blog/page.tsx` — list với pagination
- `apps/web/app/[locale]/blog/[slug]/page.tsx` — detail
- `apps/web/components/blog/article-card.tsx`
- `apps/web/components/blog/tiptap-renderer.tsx` — JSON → HTML

**Web (Admin, but placeholder here — full wiring trong phase 07):**
- `apps/web/components/admin/article-editor.tsx` — Tiptap React editor with vi/ko tabs

## Implementation Steps

1. Prisma migration `add_articles`.
2. ArticlesService: list with `where: { publishedAt: { not: null, lte: now } }` for public; admin sees all.
3. Validation: `title.vi` + `title.ko` required; content TiptapJSON loose validation (object with type=doc).
4. Slug: auto từ title.vi via slugify; unique constraint retry `-2`.
5. Public list pagination: cursor-based (`cursor=publishedAt`).
6. Blog list page: fetch API, grid cards, tag filter query param.
7. Detail page: SSG với `generateStaticParams` (top 50 articles) + ISR revalidate 3600s.
8. Tiptap renderer: `@tiptap/html` generateHTML server-side, inject into `<article dangerouslySetInnerHTML>`.
9. SEO: meta title/description từ article.title[locale] + article.excerpt[locale]. OG image = coverUrl.
10. Admin editor: Tiptap với StarterKit, Image (Cloudinary signed upload), Link, Typography. Tabs switch vi/ko.

## Tiptap Extensions

```
@tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
@tiptap/extension-typography @tiptap/html
```

## Todo

- [x] Article model + migration
- [x] ArticlesModule với CRUD + publish
- [x] Auto-slug + unique retry
- [x] Zod/DTO validation
- [x] Public GET list + detail endpoints
- [x] Blog list page với pagination + tag filter
- [x] Blog detail page với ISR
- [x] Tiptap HTML renderer component
- [x] SEO meta + OG per article
- [x] Admin Tiptap editor (vi/ko tabs) — placeholder component
- [x] Image upload signed Cloudinary endpoint integration
- [x] Seed 3 sample articles

## Success Criteria

- Admin tạo bài với 2 ngôn ngữ, publish → hiển thị `/vi/blog/[slug]` và `/ko/blog/[slug]`.
- Unpublished bài không accessible công khai.
- SEO: view-source có `<title>`, `<meta description>`, OG tags đúng.
- ISR: edit publish → trang public cập nhật trong 1 phút.

## Risks

- Tiptap JSON corrupted → strict schema check via `@tiptap/html` parse; reject on save nếu lỗi.
- Image upload abuse → Cloudinary signed URL với TTL 5min, per-user rate limit.

## Next Steps

Phase 07 Admin integrates editor vào UI đầy đủ.
