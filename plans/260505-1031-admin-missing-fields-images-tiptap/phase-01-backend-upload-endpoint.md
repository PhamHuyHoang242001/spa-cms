---
phase: 1
title: "Backend Upload Endpoint"
status: completed
effort: 2h
depends_on: []
---

# Phase 1: Backend Upload Endpoint

## Overview

Create NestJS upload module: `POST /uploads` accepts image files, saves to local disk, returns URL. Configure `ServeStaticModule` to serve uploaded files.

## Key Insights

- `@nestjs/platform-express` already in api `package.json` — no install needed for Multer
- Need to install `@nestjs/serve-static` only
- Auth guards (`JwtAuthGuard`, `RolesGuard`, `@Roles`) already exist at `apps/api/src/auth/`
- Multer from `@nestjs/platform-express` provides `FileInterceptor` and `@UploadedFile()`
- `nest-cli.json` uses `"assets": ["**/*.json"]` — uploads dir is outside dist, no conflict

## Requirements

**Functional:**
- Accept POST multipart/form-data with single `file` field
- Validate: image types only (jpg, jpeg, png, webp, gif), max 5MB
- Generate unique filename to prevent collision
- Return `{ url: '/uploads/filename.ext' }`
- Serve uploaded files at `GET /uploads/{filename}`

**Non-functional:**
- Only SUPERADMIN and DOCTOR roles can upload
- Reject non-image files with 400

## Architecture

```
Client (FormData) → POST /uploads → UploadsController
  → FileInterceptor (Multer) validates type/size
  → Saves to apps/api/uploads/
  → Returns { url: '/uploads/filename.ext' }

Client → GET /uploads/file.jpg → ServeStaticModule → static file
```

## Related Code Files

**Create:**
- `apps/api/src/uploads/uploads.module.ts`
- `apps/api/src/uploads/uploads.controller.ts`

**Modify:**
- `apps/api/src/app.module.ts` — import UploadsModule + ServeStaticModule
- `apps/api/package.json` — add `@nestjs/serve-static`
- `apps/api/.gitignore` — add `uploads/` directory

## Implementation Steps

1. Install serve-static:
   ```bash
   pnpm --filter api add @nestjs/serve-static
   ```

2. Create `apps/api/uploads/` directory, add `.gitkeep` inside it

3. Add `uploads/` to `apps/api/.gitignore` (but keep `.gitkeep`)

4. Create `apps/api/src/uploads/uploads.controller.ts`:
   ```typescript
   import {
     Controller, Post, UseGuards, UseInterceptors,
     UploadedFile, BadRequestException,
   } from '@nestjs/common';
   import { FileInterceptor } from '@nestjs/platform-express';
   import { diskStorage } from 'multer';
   import { extname, join } from 'path';
   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
   import { RolesGuard } from '../auth/guards/roles.guard';
   import { Roles } from '../auth/decorators/roles.decorator';

   const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');
   const ALLOWED_TYPES = /\.(jpg|jpeg|png|webp|gif)$/i;
   const MAX_SIZE = 5 * 1024 * 1024; // 5MB

   @Controller('uploads')
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('SUPERADMIN', 'DOCTOR')
   export class UploadsController {
     @Post()
     @UseInterceptors(FileInterceptor('file', {
       storage: diskStorage({
         destination: UPLOADS_DIR,
         filename: (_req, file, cb) => {
           const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
           cb(null, `${unique}${extname(file.originalname)}`);
         },
       }),
       limits: { fileSize: MAX_SIZE },
       fileFilter: (_req, file, cb) => {
         if (!ALLOWED_TYPES.test(extname(file.originalname))) {
           return cb(new BadRequestException('Only image files allowed'), false);
         }
         cb(null, true);
       },
     }))
     upload(@UploadedFile() file: Express.Multer.File) {
       if (!file) throw new BadRequestException('No valid image file');
       return { url: `/uploads/${file.filename}` };
     }
   }
   ```

5. Create `apps/api/src/uploads/uploads.module.ts`:
   ```typescript
   import { Module } from '@nestjs/common';
   import { UploadsController } from './uploads.controller';

   @Module({ controllers: [UploadsController] })
   export class UploadsModule {}
   ```

6. Update `apps/api/src/app.module.ts`:
   - Add import for `ServeStaticModule` from `@nestjs/serve-static`
   - Add import for `UploadsModule`
   - Add to imports array:
     ```typescript
     ServeStaticModule.forRoot({
       rootPath: join(__dirname, '..', 'uploads'),
       serveRoot: '/uploads',
     }),
     UploadsModule,
     ```
   - Add `import { join } from 'path';` at top

7. Verify `UPLOADS_DIR` resolves correctly relative to compiled dist output — test with `console.log` if needed

## Todo List

- [ ] Install `@nestjs/serve-static`
- [ ] Create `uploads/` dir with `.gitkeep`
- [ ] Add `uploads/` to `.gitignore`
- [ ] Create `uploads.controller.ts` with FileInterceptor + auth guards
- [ ] Create `uploads.module.ts`
- [ ] Update `app.module.ts` with ServeStaticModule + UploadsModule
- [ ] Test: POST /uploads with valid image → 201 + url
- [ ] Test: POST /uploads with non-image → 400
- [ ] Test: POST /uploads without auth → 401
- [ ] Test: GET /uploads/{file} serves the image

## Success Criteria

- `POST /uploads` with auth + image file returns `{ url: '/uploads/xxx.jpg' }`
- `GET /uploads/xxx.jpg` serves the saved image
- Non-image files rejected with 400
- Unauthenticated requests rejected with 401
- Non-admin/doctor users rejected with 403

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `UPLOADS_DIR` path wrong in production build | High | Use `process.cwd()` + `/uploads` as fallback; test with compiled output |
| Disk space exhaustion | Medium | MVP-acceptable; add cleanup task later |
| No file deduplication | Low | Unique filenames prevent collision; accept duplicates for MVP |

## Security Considerations

- Auth required (JWT + role check)
- File type validation via extension check — could add magic-byte validation later
- Filename sanitized via random generation (no user input in filename)
- Size limit (5MB) prevents abuse
