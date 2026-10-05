'use client';

// admin/layout.tsx — Auth guard + role check for all /admin/* routes
// Redirects unauthenticated users to /admin/login, CUSTOMER role to /

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

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
        <p className="text-[#8a6a62]">Đang xác thực...</p>
      </div>
    );
  }

  if (!user || user.role === 'CUSTOMER') return null;

  return (
    <div className="flex min-h-screen bg-[#faf7f4]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
