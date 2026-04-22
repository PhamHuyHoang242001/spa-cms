'use client';

// services-grid-section.tsx — Featured services 3x2 grid with fade-in-up animation

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import type { Service } from '@/lib/api-types';

interface Props {
  services: Service[];
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  // Gradient palettes cycling for placeholder images
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
    >
      {/* Placeholder image */}
      <div
        className="h-44 w-full"
        style={{ background: gradients[index % gradients.length] }}
      />

      <div className="p-5">
        <h3 className="font-semibold text-[#1C1917] text-base mb-1 line-clamp-1">
          {service.name.vi}
        </h3>
        <p className="text-[#A8A29E] text-sm line-clamp-2 mb-3">
          {service.description?.vi ?? ''}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[#D4A574] font-bold text-sm">
              {service.price.toLocaleString('vi-VN')}đ
            </span>
            <span className="flex items-center gap-1 text-xs text-[#A8A29E]">
              <Clock size={11} />
              {service.duration} phút
            </span>
          </div>
          <Link
            href={`/services/${service.slug}`}
            className="flex items-center gap-1 text-xs font-semibold text-[#D4A574] hover:text-[#c4956a] transition-colors group-hover:gap-2"
          >
            Chi tiết <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function ServicesGridSection({ services }: Props) {
  const featured = services.slice(0, 6);

  return (
    <section className="py-20 px-6 bg-[#F5F0E8]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Dịch Vụ Nổi Bật
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            Trải Nghiệm Đẳng Cấp
          </h2>
        </motion.div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-[#A8A29E]">Đang cập nhật dịch vụ...</p>
        )}

        <div className="text-center mt-10">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#1C1917] text-[#1C1917] text-sm font-semibold hover:bg-[#1C1917] hover:text-white transition-colors"
          >
            Xem tất cả dịch vụ <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
