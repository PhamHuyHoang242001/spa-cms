'use client';

// admin/layout.tsx — Auth guard + role check for all /admin/* routes
// Redirects unauthenticated users to /admin/login, CUSTOMER role to /

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

const noopSubscribe = () => () => {};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  // false during SSR/hydration, true on the client — avoids a hydration mismatch
  // without setting state inside an effect.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (isLoginPage) return;
    if (isLoading) return;
    if (!user) {
      router.replace('/admin/login');
      return;
    }
    if (user.role === 'CUSTOMER') {
      router.replace('/');
    }
  }, [user, isLoading, router, isLoginPage]);

  if (!ready) {
    return <div className="min-h-screen bg-[#F5F0E8]" />;
  }

  if (isLoginPage) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F0E8]">
        <p className="text-[#78716C]">Đang xác thực...</p>
      </div>
    );
  }

  if (!user || user.role === 'CUSTOMER') return null;

  return (
    <div className="min-h-screen bg-[#faf7f4] md:flex">
      <AdminSidebar />
      {/* min-w-0 lets wide tables scroll inside their own wrapper instead of stretching the page */}
      <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 md:p-8">{children}</main>
    </div>
  );
}
