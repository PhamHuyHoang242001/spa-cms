// main.ts — NestJS bootstrap with helmet, CORS, and global validation pipe
import 'dotenv/config'; // Load .env before anything else
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers — allow cross-origin image loading from frontend
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS — allow web frontend
  const corsOrigin = process.env['CORS_ORIGIN'] ?? 'http://localhost:3100';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env['PORT'] ?? 3101;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
void bootstrap();
