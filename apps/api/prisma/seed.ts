import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '@spa/shared';
import { ARTICLES, CUSTOMERS, DOCTORS, SERVICES, articleBody } from './seed-catalog.js';

const STARTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

function add30(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + (m ?? 0) + 30;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

async function wipe() {
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.article.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('CMS wipe + Unsplash catalog seed…');
  await wipe();
  const adminHash = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
  const staffHash = await bcrypt.hash('Password123!', BCRYPT_ROUNDS);

  const admin = await prisma.user.create({
    data: { email: 'admin@spa.local', passwordHash: adminHash, name: 'Minh Anh', role: 'SUPERADMIN' },
  });

  const doctorProfiles: { id: string }[] = [];
  for (const d of DOCTORS) {
    const user = await prisma.user.create({
      data: { email: d.email, passwordHash: staffHash, name: d.name, role: 'DOCTOR' },
    });
    const profile = await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        specialty: d.specialty,
        bio: d.bio,
        yearsExp: d.yearsExp,
        order: d.order,
        avatarUrl: d.avatarUrl,
        active: true,
      },
    });
    doctorProfiles.push({ id: profile.id });
  }

  for (const c of CUSTOMERS) {
    await prisma.user.create({
      data: { email: c.email, passwordHash: staffHash, name: c.name, phone: c.phone, role: 'CUSTOMER' },
    });
  }

  for (const s of SERVICES) {
    await prisma.service.create({ data: { ...s, active: true } });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const profile of doctorProfiles) {
    const rows = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + i);
      for (const startTime of STARTS) {
        rows.push({ doctorId: profile.id, date, startTime, endTime: add30(startTime) });
      }
    }
    await prisma.timeSlot.createMany({ data: rows, skipDuplicates: true });
  }

  for (let i = 0; i < ARTICLES.length; i++) {
    const a = ARTICLES[i];
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - (ARTICLES.length - i));
    await prisma.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        content: articleBody(a.excerpt.vi, a.excerpt.ko),
        tags: a.tags,
        featured: a.featured,
        coverUrl: a.coverUrl,
        authorId: admin.id,
        publishedAt,
      },
    });
  }

  console.log('CMS seed done. admin@spa.local / Admin123!  |  bác sĩ & khách: Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
