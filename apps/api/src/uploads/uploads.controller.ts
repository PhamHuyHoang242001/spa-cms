import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const ALLOWED_EXTENSIONS = /\.(gif|jpe?g|png|webp)$/i;
const ALLOWED_MIME_TYPES = /^image\/(gif|jpe?g|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'DOCTOR')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname).toLowerCase();
          const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          cb(null, `${uniqueName}${extension}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const hasAllowedExtension = ALLOWED_EXTENSIONS.test(
          extname(file.originalname),
        );
        const hasAllowedMimeType = ALLOWED_MIME_TYPES.test(file.mimetype);

        if (!hasAllowedExtension || !hasAllowedMimeType) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }

        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No valid image file');
    return { url: `/uploads/${file.filename}` };
  }
}
