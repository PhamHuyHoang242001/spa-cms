'use client';

// admin/layout.tsx — Auth guard + role check for all /admin/* routes
// Redirects unauthenticated users to /login, CUSTOMER role to /

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'CUSTOMER') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

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
