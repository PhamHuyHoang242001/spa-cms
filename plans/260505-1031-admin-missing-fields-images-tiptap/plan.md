---
title: "Admin Missing Fields, Image Upload & Tiptap Editor"
description: "Add file upload endpoint, image management, missing CRUD fields, and Tiptap WYSIWYG editor to admin pages"
status: completed
priority: P1
effort: 3d
branch: master
tags: [feature, frontend, backend, admin, upload]
blockedBy: []
blocks: []
created: 2026-05-05
---

# Admin Missing Fields, Image Upload & Tiptap Editor

## Summary

Add backend file upload endpoint, reusable image upload components, missing admin form fields (coverUrl, avatarUrl, gallery, order, active, featured), and integrate existing Tiptap editor with article content editing.

## Key Facts

- All missing fields ALREADY exist in Prisma schema, Zod schemas, and backend services
- Tiptap editor component ALREADY exists at `apps/web/components/admin/tiptap-editor.tsx`
- Tiptap packages ALREADY installed in apps/web
- `@nestjs/platform-express` ALREADY in api deps
- Articles page ALREADY uses TiptapEditor with HTML string content
- Only NEW backend code = uploads module + serve-static config

## Dependency Graph

```
Phase A (Upload Endpoint) ──┐
                             ├──> Phase B (Image Components) ──> Phase C (Services Fields)
Phase E (Tiptap Fixes)  ────┘                                ──> Phase D (Doctors Fields)
                                                              ──> Phase F (Articles Fields + Tiptap)
```

- A + E: run in parallel (independent)
- B: depends on A (needs upload endpoint)
- C, D, F: run in parallel after B (independent form changes)

## Phases

| # | Phase | File | Status | Effort |
|---|-------|------|--------|--------|
| 1 | Backend Upload Endpoint | [phase-01](phase-01-backend-upload-endpoint.md) | completed | 2h |
| 2 | Image Upload Components | [phase-02](phase-02-image-upload-components.md) | completed | 3h |
| 3 | Services Missing Fields | [phase-03](phase-03-services-missing-fields.md) | completed | 2h |
| 4 | Doctors Missing Fields | [phase-04](phase-04-doctors-missing-fields.md) | completed | 1.5h |
| 5 | Tiptap Editor Fixes | [phase-05](phase-05-tiptap-editor-fixes.md) | completed | 2h |
| 6 | Articles Missing Fields + Tiptap | [phase-06](phase-06-articles-missing-fields-tiptap.md) | completed | 3h |

## Tech Stack

- **Backend:** NestJS 11, Prisma 7.7, `@nestjs/platform-express`, `@nestjs/serve-static`
- **Frontend:** Next.js 16.2, Tailwind 4, `@tiptap/react` 3.22 (already installed)
- **Monorepo:** pnpm workspace, Turborepo

## Risk Summary

- Upload file storage is local disk (not S3) — fine for MVP, needs migration for production
- Tiptap editor already uses HTML strings; articles page normalizes content as HTML — must decide if keeping HTML or switching to Tiptap JSON (recommendation: keep HTML for now, simpler)
