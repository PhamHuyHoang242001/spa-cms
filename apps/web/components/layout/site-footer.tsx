// site-footer.tsx — Footer with address, hours, social links, copyright

import Link from 'next/link';
import { MapPin, Clock, Phone } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-[#1C1917] text-[#A8A29E] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <span
            className="text-white font-semibold tracking-widest text-sm uppercase"
            style={{ fontFamily: '"Noto Serif KR", serif' }}
          >
            K-Beauty Spa
          </span>
          <p className="text-sm leading-relaxed">
            Trải nghiệm làm đẹp chuẩn Hàn — kết hợp công nghệ hiện đại và liệu pháp truyền thống.
          </p>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3 text-sm">
          <span className="text-white font-semibold text-xs uppercase tracking-wider mb-1">Liên hệ</span>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#D4A574]" />
            <span>123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="shrink-0 text-[#D4A574]" />
            <a href="tel:+84901234567" className="hover:text-[#D4A574] transition-colors">
              0901 234 567
            </a>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={14} className="mt-0.5 shrink-0 text-[#D4A574]" />
            <span>Thứ 2 – Chủ nhật: 9:00 – 18:00</span>
          </div>
        </div>

        {/* Social + nav */}
        <div className="flex flex-col gap-3 text-sm">
          <span className="text-white font-semibold text-xs uppercase tracking-wider mb-1">Theo dõi</span>
          <div className="flex gap-4">
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D4A574] transition-colors font-medium"
              aria-label="Zalo"
            >
              Zalo
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D4A574] transition-colors font-medium"
              aria-label="Facebook"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D4A574] transition-colors font-medium"
              aria-label="Instagram"
            >
              Instagram
            </a>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Link href="/services" className="hover:text-[#D4A574] transition-colors">Dịch vụ</Link>
            <Link href="/doctors" className="hover:text-[#D4A574] transition-colors">Bác sĩ</Link>
            <Link href="/booking" className="hover:text-[#D4A574] transition-colors">Đặt lịch</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-[#A8A29E]/60">
        © {new Date().getFullYear()} K-Beauty Spa. Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
