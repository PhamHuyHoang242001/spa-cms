'use client';

// doctors-showcase-section.tsx — Horizontal doctor card layout with fade-in animation

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import type { Doctor } from '@/lib/api-types';

interface Props {
  doctors: Doctor[];
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

function DoctorCard({ doctor, index }: { doctor: Doctor; index: number }) {
  const initials = doctor.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-shrink-0 w-64 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Avatar placeholder */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4"
        style={{ background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] }}
      >
        {initials}
      </div>

      <h3 className="font-semibold text-[#1C1917] text-sm mb-1">{doctor.name}</h3>
      <p className="text-[#D4A574] text-xs font-medium mb-2">
        {doctor.specialty?.vi ?? ''}
      </p>

      <div className="flex items-center gap-1 mb-4">
        <Star size={11} className="text-[#D4A574] fill-[#D4A574]" />
        <span className="text-xs text-[#A8A29E]">{doctor.yearsExp} năm kinh nghiệm</span>
      </div>

      <Link
        href={`/doctors/${doctor.id}`}
        className="flex items-center gap-1 text-xs font-semibold text-[#D4A574] hover:text-[#c4956a] transition-colors"
      >
        Xem hồ sơ <ArrowRight size={12} />
      </Link>
    </motion.div>
  );
}

export function DoctorsShowcaseSection({ doctors }: Props) {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
              Đội Ngũ Chuyên Gia
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1C1917]"
              style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
            >
              Bác Sĩ Tận Tâm
            </h2>
          </div>
          <Link
            href="/doctors"
            className="flex items-center gap-2 text-sm font-semibold text-[#1C1917] hover:text-[#D4A574] transition-colors"
          >
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </motion.div>

        {doctors.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
            {doctors.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-[#A8A29E] text-sm">Đang cập nhật đội ngũ bác sĩ...</p>
        )}
      </div>
    </section>
  );
}
