'use client';

// admin/error.tsx — Error boundary scoped to /admin/* routes
// Catches admin panel errors; professional tone with retry action

import { useEffect } from 'react';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[AdminError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20">
      <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-5">
        <span className="text-xl" role="img" aria-label="lỗi hệ thống">⚠️</span>
      </div>

      <h2 className="text-lg font-bold text-[#1C1917] mb-2 text-center">
        Lỗi Hệ Thống Quản Trị
      </h2>

      <p className="text-[#A8A29E] text-sm text-center max-w-sm leading-relaxed mb-6">
        Đã xảy ra lỗi trong trang quản trị. Vui lòng thử lại hoặc quay về dashboard.
      </p>

      {error.digest && (
        <p className="text-xs text-[#C4B5AC] font-mono mb-5">
          Mã lỗi: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1C1917] text-white text-sm font-semibold hover:bg-[#2C2924] transition-colors"
        >
          <RefreshCw size={14} />
          Thử lại
        </button>
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#E5DDD5] text-[#6B4C41] text-sm font-semibold hover:border-[#1C1917] transition-colors"
        >
          <LayoutDashboard size={14} />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
