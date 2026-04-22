'use client';

// cta-band-section.tsx — Dark CTA band with booking call-to-action

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CtaBandSection() {
  return (
    <section className="py-20 px-6 bg-[#0F172A]">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.3em] uppercase mb-4">
            Bắt Đầu Hành Trình
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            Sẵn Sàng Trải Nghiệm?
          </h2>
          <p className="text-[#A8A29E] text-lg mb-10 leading-relaxed">
            Đặt lịch ngay hôm nay và nhận tư vấn miễn phí từ chuyên gia của chúng tôi.
            Làn da chuẩn Hàn chỉ cách bạn một bước.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#D4A574] text-white font-semibold text-sm tracking-wide hover:bg-[#c4956a] transition-colors"
            >
              Đặt Lịch Ngay <ArrowRight size={16} />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-sm tracking-wide hover:border-[#D4A574] hover:text-[#D4A574] transition-colors"
            >
              Xem Dịch Vụ
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
