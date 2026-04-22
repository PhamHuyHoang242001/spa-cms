'use client';

// hero-section.tsx — Full-width hero banner with gradient overlay and CTA
// Uses CSS gradient bg (no video) for MVP

import Link from 'next/link';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #1C1917 0%, #2d1f1a 40%, #4a2c20 70%, #D4A574 100%)',
        }}
      />
      {/* Decorative overlay pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, #D4A574 0%, transparent 50%), radial-gradient(circle at 80% 20%, #F5F0E8 0%, transparent 40%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[#D4A574] text-sm font-semibold tracking-[0.3em] uppercase mb-4"
      >
          K-Beauty · Seoul Standard
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-white text-4xl md:text-6xl font-bold leading-tight mb-6"
          style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
        >
          Trải Nghiệm Làn Da
          <br />
          <span className="text-[#D4A574]">Chuẩn Hàn</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[#A8A29E] text-lg md:text-xl leading-relaxed mb-10"
        >
          Công nghệ làm đẹp hiện đại từ Hàn Quốc kết hợp với liệu pháp chăm sóc da chuyên sâu.
          Hơn 10 năm kinh nghiệm, hàng nghìn khách hàng tin tưởng.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/booking"
            className="px-8 py-4 rounded-full bg-[#D4A574] text-white font-semibold text-sm tracking-wide hover:bg-[#c4956a] transition-colors"
          >
            Đặt Lịch Ngay
          </Link>
          <Link
            href="/services"
            className="px-8 py-4 rounded-full border border-white/30 text-white font-semibold text-sm tracking-wide hover:border-[#D4A574] hover:text-[#D4A574] transition-colors"
          >
            Khám Phá Dịch Vụ
          </Link>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F5F0E8] to-transparent" />
    </section>
  );
}
