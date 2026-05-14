// seed.ts — populates database with initial K-Beauty Spa CMS data
// Upserts: 1 superadmin, 3 doctors, 7 services, 14 days of time slots per doctor
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '@spa/shared';

// Working hours in 30-min increments: 09:00-12:00 and 14:00-18:00
const MORNING_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = [
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];
const ALL_START_TIMES = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

function addThirtyMin(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + (m ?? 0) + 30;
  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const mm = String(totalMin % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

const IMG = {
  facial: '/uploads/seed-facial.jpg',
  aqua: '/uploads/seed-aqua.jpg',
  goldMask: '/uploads/seed-gold-mask.jpg',
  acne: '/uploads/seed-acne.jpg',
  vitaminC: '/uploads/seed-vitamin-c.jpg',
  microneedling: '/uploads/seed-microneedling.jpg',
  bridal: '/uploads/seed-bridal.jpg',
  doctorKim: '/uploads/seed-doctor-kim.jpg',
  doctorPark: '/uploads/seed-doctor-park.jpg',
  doctorNguyen: '/uploads/seed-doctor-nguyen.jpg',
};

async function main() {
  console.log('Seeding database...');

  // ── Superadmin ───────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'admin@spa.local' },
    update: {},
    create: {
      email: 'admin@spa.local',
      passwordHash: adminHash,
      name: 'Admin',
      role: 'SUPERADMIN',
    },
  });
  console.log('  Superadmin upserted');

  // ── Customer ─────────────────────────────────────────────────────────────────
  const customerHash = await bcrypt.hash('Customer123!', BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'customer@spa.local' },
    update: {},
    create: {
      email: 'customer@spa.local',
      passwordHash: customerHash,
      name: 'Nguyễn Khách Hàng',
      role: 'CUSTOMER',
    },
  });
  console.log('  Customer upserted');

  // ── Doctors ──────────────────────────────────────────────────────────────────
  const doctorHash = await bcrypt.hash('Doctor123!', BCRYPT_ROUNDS);

  const doctorsData = [
    {
      email: 'doctor1@spa.local',
      name: 'Dr. Kim',
      specialty: { vi: 'Chống lão hóa', ko: '항노화' },
      bio: {
        vi: 'Chuyên gia hàng đầu về liệu trình chống lão hóa da với 10 năm kinh nghiệm.',
        ko: '10년 경력의 항노화 피부 관리 전문가입니다.',
      },
      yearsExp: 10,
      order: 1,
      avatarUrl: IMG.doctorKim,
    },
    {
      email: 'doctor2@spa.local',
      name: 'Dr. Park',
      specialty: { vi: 'Mụn & da nhạy cảm', ko: '여드름 및 민감성 피부' },
      bio: {
        vi: 'Chuyên điều trị mụn và da nhạy cảm theo phác đồ K-Beauty hiện đại.',
        ko: '현대적인 K-뷰티 프로토콜로 여드름과 민감성 피부를 전문적으로 치료합니다.',
      },
      yearsExp: 8,
      order: 2,
      avatarUrl: IMG.doctorPark,
    },
    {
      email: 'doctor3@spa.local',
      name: 'Dr. Nguyen',
      specialty: { vi: 'K-Beauty tổng hợp', ko: '종합 K-뷰티' },
      bio: {
        vi: 'Bác sĩ đa chuyên khoa K-Beauty, tư vấn và điều trị toàn diện cho mọi loại da.',
        ko: '모든 피부 타입에 종합적인 상담과 치료를 제공하는 K-뷰티 전문의입니다.',
      },
      yearsExp: 6,
      order: 3,
      avatarUrl: IMG.doctorNguyen,
    },
  ];

  const doctorProfiles: { id: string }[] = [];

  for (const d of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash: doctorHash,
        name: d.name,
        role: 'DOCTOR',
      },
    });

    const profile = await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {
        specialty: d.specialty,
        bio: d.bio,
        avatarUrl: d.avatarUrl,
        yearsExp: d.yearsExp,
        order: d.order,
      },
      create: {
        userId: user.id,
        specialty: d.specialty,
        bio: d.bio,
        avatarUrl: d.avatarUrl,
        yearsExp: d.yearsExp,
        order: d.order,
      },
    });

    doctorProfiles.push({ id: profile.id });
    console.log(`  Doctor upserted: ${d.name}`);
  }

  // ── Services ─────────────────────────────────────────────────────────────────
  const services = [
    {
      slug: 'hydra-glow-facial',
      name: { vi: 'Hydra-Glow Facial', ko: '하이드라-글로우 페이셜' },
      description: {
        vi: 'Liệu trình dưỡng ẩm sâu giúp da căng mọng, rạng rỡ với công nghệ Hàn Quốc.',
        ko: '한국 기술로 피부를 촉촉하고 빛나게 해주는 깊은 수분 보충 트리트먼트.',
      },
      priceVnd: 890000,
      durationMin: 60,
      featured: true,
      order: 1,
      coverUrl: IMG.facial,
      gallery: [IMG.facial, IMG.aqua, IMG.vitaminC],
    },
    {
      slug: 'aqua-peel',
      name: { vi: 'Aqua Peel', ko: '아쿠아 필' },
      description: {
        vi: 'Tẩy da chết sâu bằng công nghệ nước áp lực, làm sạch lỗ chân lông triệt để.',
        ko: '수압 기술로 깊은 각질 제거, 모공을 철저히 정화합니다.',
      },
      priceVnd: 1200000,
      durationMin: 75,
      featured: false,
      order: 2,
      coverUrl: IMG.aqua,
      gallery: [IMG.aqua, IMG.facial, IMG.goldMask],
    },
    {
      slug: 'gold-jelly-mask',
      name: { vi: 'Gold Jelly Mask', ko: '골드 젤리 마스크' },
      description: {
        vi: 'Mặt nạ vàng 24K dưỡng sáng da, chống oxy hóa và phục hồi collagen.',
        ko: '24K 골드 마스크로 피부를 밝게 하고, 항산화 효과와 콜라겐 재생.',
      },
      priceVnd: 950000,
      durationMin: 60,
      featured: false,
      order: 3,
      coverUrl: IMG.goldMask,
      gallery: [IMG.goldMask, IMG.facial, IMG.bridal],
    },
    {
      slug: 'acne-clear-treatment',
      name: { vi: 'Acne Clear Treatment', ko: '아크네 클리어 트리트먼트' },
      description: {
        vi: 'Điều trị mụn chuyên sâu kết hợp công nghệ ánh sáng và serum kháng khuẩn.',
        ko: '광 기술과 항균 세럼을 결합한 전문적인 여드름 치료.',
      },
      priceVnd: 1500000,
      durationMin: 90,
      featured: true,
      order: 4,
      coverUrl: IMG.acne,
      gallery: [IMG.acne, IMG.aqua, IMG.vitaminC],
    },
    {
      slug: 'whitening-vit-c',
      name: { vi: 'Whitening Vit C', ko: '화이트닝 비타민 C' },
      description: {
        vi: 'Liệu trình làm trắng da với Vitamin C nồng độ cao, giảm thâm và đều màu da.',
        ko: '고농도 비타민 C로 피부 미백, 잡티 제거 및 균일한 피부톤 개선.',
      },
      priceVnd: 780000,
      durationMin: 60,
      featured: false,
      order: 5,
      coverUrl: IMG.vitaminC,
      gallery: [IMG.vitaminC, IMG.facial, IMG.goldMask],
    },
    {
      slug: 'mts-micro-needling',
      name: { vi: 'MTS Micro-Needling', ko: 'MTS 마이크로니들링' },
      description: {
        vi: 'Kỹ thuật vi kim tạo kênh dẫn thuốc, kích thích tái tạo collagen tự nhiên.',
        ko: '약물 전달 채널을 만드는 마이크로니들 기술로 자연스러운 콜라겐 재생 촉진.',
      },
      priceVnd: 1800000,
      durationMin: 75,
      featured: true,
      order: 6,
      coverUrl: IMG.microneedling,
      gallery: [IMG.microneedling, IMG.acne, IMG.facial],
    },
    {
      slug: 'couple-bridal-package',
      name: { vi: 'Couple/Bridal Package', ko: '커플/브라이덜 패키지' },
      description: {
        vi: 'Gói chăm sóc đặc biệt dành cho cặp đôi hoặc cô dâu — trải nghiệm spa đẳng cấp.',
        ko: '커플 또는 신부를 위한 특별 케어 패키지 — 프리미엄 스파 경험.',
      },
      priceVnd: 3500000,
      durationMin: 120,
      featured: true,
      order: 7,
      coverUrl: IMG.bridal,
      gallery: [IMG.bridal, IMG.facial, IMG.goldMask],
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        priceVnd: s.priceVnd,
        durationMin: s.durationMin,
        coverUrl: s.coverUrl,
        gallery: s.gallery,
        featured: s.featured,
        order: s.order,
      },
      create: s,
    });
    console.log(`  Service upserted: ${s.slug}`);
  }

  // ── Time slots — 14 days per doctor ─────────────────────────────────────────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const profile of doctorProfiles) {
    const slots: {
      doctorId: string;
      date: Date;
      startTime: string;
      endTime: string;
    }[] = [];

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + i);

      for (const startTime of ALL_START_TIMES) {
        slots.push({
          doctorId: profile.id,
          date,
          startTime,
          endTime: addThirtyMin(startTime),
        });
      }
    }

    const result = await prisma.timeSlot.createMany({
      data: slots,
      skipDuplicates: true,
    });
    console.log(`  Slots created for doctor ${profile.id}: ${result.count}`);
  }

  // ── Sample Blog Articles ──────────────────────────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { email: 'admin@spa.local' } });
  if (!admin) throw new Error('Admin user not found — run seeder in order');

  const sampleArticles = [
    {
      slug: 'bi-quyet-cham-soc-da-han-quoc',
      title: { vi: 'Bí quyết chăm sóc da Hàn Quốc', ko: '한국 피부 관리 비결' },
      excerpt: {
        vi: 'Khám phá những bí quyết chăm sóc da của phụ nữ Hàn Quốc để có làn da căng mịn, rạng rỡ.',
        ko: '탄력 있고 빛나는 피부를 위한 한국 여성의 피부 관리 비결을 알아보세요.',
      },
      content: {
        vi: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phụ nữ Hàn Quốc nổi tiếng với làn da mịn màng và rạng rỡ. Bí quyết nằm ở quy trình chăm sóc da nhiều bước, sử dụng các sản phẩm dưỡng ẩm chất lượng cao và bảo vệ da khỏi ánh nắng mặt trời.' }] }] },
        ko: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '한국 여성들은 매끄럽고 빛나는 피부로 유명합니다. 비결은 다단계 스킨케어 루틴, 고품질 보습 제품 사용, 자외선으로부터 피부 보호에 있습니다.' }] }] },
      },
      tags: ['skincare', 'k-beauty', 'tips'],
      featured: true,
      coverUrl: IMG.facial,
    },
    {
      slug: 'xu-huong-lam-dep-k-beauty-2026',
      title: { vi: 'Xu hướng làm đẹp K-Beauty 2026', ko: 'K-뷰티 2026 뷰티 트렌드' },
      excerpt: {
        vi: 'Những xu hướng làm đẹp K-Beauty nổi bật nhất trong năm 2026 mà bạn không thể bỏ qua.',
        ko: '2026년 놓칠 수 없는 가장 주목할 만한 K-뷰티 트렌드를 소개합니다.',
      },
      content: {
        vi: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Năm 2026 chứng kiến sự bùng nổ của các xu hướng K-Beauty mới như "glass skin", "cloud skin" và các liệu trình điều trị cá nhân hóa sử dụng công nghệ AI.' }] }] },
        ko: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '2026년에는 "글래스 스킨", "클라우드 스킨" 등 새로운 K-뷰티 트렌드와 AI 기술을 활용한 맞춤형 트리트먼트가 주목받고 있습니다.' }] }] },
      },
      tags: ['trends', 'k-beauty', '2026'],
      featured: true,
      coverUrl: IMG.bridal,
    },
    {
      slug: 'loi-ich-cua-aqua-peel',
      title: { vi: 'Lợi ích của Aqua Peel', ko: '아쿠아 필의 효능' },
      excerpt: {
        vi: 'Tìm hiểu tại sao Aqua Peel là một trong những liệu trình được yêu thích nhất tại spa của chúng tôi.',
        ko: '아쿠아 필이 왜 저희 스파에서 가장 인기 있는 트리트먼트 중 하나인지 알아보세요.',
      },
      content: {
        vi: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Aqua Peel là liệu trình tẩy da chết tiên tiến sử dụng công nghệ nước áp lực để loại bỏ tế bào chết, làm sạch lỗ chân lông sâu và cung cấp dưỡng chất cho da. Kết quả ngay lập tức — da mịn, sáng và căng bóng.' }] }] },
        ko: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '아쿠아 필은 수압 기술을 사용하여 각질을 제거하고 모공을 깊이 정화하며 피부에 영양을 공급하는 첨단 각질 제거 트리트먼트입니다. 즉각적인 결과 — 부드럽고 밝고 탄력 있는 피부.' }] }] },
      },
      tags: ['aqua-peel', 'treatment', 'skincare'],
      featured: false,
      coverUrl: IMG.aqua,
    },
  ];

  for (const article of sampleArticles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        coverUrl: article.coverUrl,
        tags: article.tags,
        featured: article.featured,
        publishedAt: new Date(),
      },
      create: {
        ...article,
        authorId: admin.id,
        publishedAt: new Date(),
      },
    });
    console.log(`  Article upserted: ${article.slug}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
