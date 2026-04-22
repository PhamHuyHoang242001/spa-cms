// not-found.tsx — Custom 404 page
// Shown when Next.js notFound() is called or route doesn't match

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 bg-[#F5F0E8]">
      {/* Large decorative number */}
      <p
        className="text-[8rem] font-bold leading-none text-[#D4A574]/20 select-none mb-4"
        aria-hidden="true"
      >
        404
      </p>

      <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
        Không tìm thấy
      </p>

      <h1
        className="text-2xl font-bold text-[#1C1917] mb-3 text-center"
        style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
      >
        Trang Không Tìm Thấy
      </h1>

      <p className="text-[#A8A29E] text-sm text-center max-w-sm leading-relaxed mb-8">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        Hãy thử tìm kiếm dịch vụ hoặc quay về trang chủ.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D4A574] text-white text-sm font-semibold hover:bg-[#c4956a] transition-colors"
        >
          <Home size={14} />
          Trang chủ
        </Link>
        <Link
          href="/services"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#D4A574] text-[#D4A574] text-sm font-semibold hover:bg-[#D4A574] hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Xem dịch vụ
        </Link>
      </div>
    </div>
  );
}
