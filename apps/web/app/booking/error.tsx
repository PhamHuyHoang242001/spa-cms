'use client';

// booking/error.tsx — Error boundary scoped to /booking route
// Catches booking flow errors; prompts user to restart or go home

import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BookingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[BookingError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 bg-[#F5F0E8]">
      <div className="w-16 h-16 rounded-full bg-[#D4A574]/10 flex items-center justify-center mb-6">
        <span className="text-2xl" role="img" aria-label="lỗi đặt lịch">📅</span>
      </div>

      <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-3">
        Lỗi đặt lịch
      </p>

      <h2
        className="text-2xl font-bold text-[#1C1917] mb-3 text-center"
        style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
      >
        Đặt Lịch Gặp Sự Cố
      </h2>

      <p className="text-[#A8A29E] text-sm text-center max-w-sm leading-relaxed mb-8">
        Quá trình đặt lịch bị gián đoạn. Vui lòng thử lại hoặc liên hệ hotline để được hỗ trợ.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D4A574] text-white text-sm font-semibold hover:bg-[#c4956a] transition-colors"
        >
          <RefreshCw size={14} />
          Thử lại
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#D4A574] text-[#D4A574] text-sm font-semibold hover:bg-[#D4A574] hover:text-white transition-colors"
        >
          <Home size={14} />
          Trang chủ
        </Link>
      </div>
    </div>
  );
}
