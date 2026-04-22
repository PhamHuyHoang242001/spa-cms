'use client';

// process-timeline-section.tsx — 5-step treatment process timeline with icons

import { motion } from 'framer-motion';
import { MessageCircle, ScanFace, Sparkles, Heart, RefreshCw } from 'lucide-react';

const STEPS = [
  {
    icon: MessageCircle,
    title: 'Tư Vấn',
    desc: 'Gặp gỡ chuyên gia, trao đổi về tình trạng da và mong muốn của bạn.',
  },
  {
    icon: ScanFace,
    title: 'Phân Tích Da',
    desc: 'Sử dụng thiết bị hiện đại để đánh giá chính xác loại da và vấn đề cần điều trị.',
  },
  {
    icon: Sparkles,
    title: 'Điều Trị',
    desc: 'Áp dụng liệu trình chuẩn Hàn phù hợp với từng loại da và nhu cầu cá nhân.',
  },
  {
    icon: Heart,
    title: 'Chăm Sóc Sau',
    desc: 'Hướng dẫn chăm sóc tại nhà và cung cấp sản phẩm hỗ trợ phù hợp.',
  },
  {
    icon: RefreshCw,
    title: 'Tái Khám',
    desc: 'Theo dõi tiến trình, điều chỉnh liệu trình để đạt kết quả tốt nhất.',
  },
];

export function ProcessTimelineSection() {
  return (
    <section className="py-20 px-6 bg-[#F5F0E8]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Quy Trình
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            5 Bước Chăm Sóc Toàn Diện
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                {/* Step number + icon */}
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#1C1917] flex items-center justify-center">
                    <Icon size={22} className="text-[#D4A574]" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4A574] text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-semibold text-[#1C1917] text-sm mb-2">{step.title}</h3>
                <p className="text-[#A8A29E] text-xs leading-relaxed">{step.desc}</p>

                {/* Connector line — hidden on last item */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
