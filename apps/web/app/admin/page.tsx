'use client';

// admin/page.tsx — Role-based redirect for /admin root
// SUPERADMIN → /admin/dashboard | DOCTOR → /admin/my-schedule

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return; // layout handles redirect to /admin/login
    if (user.role === 'SUPERADMIN') {
      router.replace('/admin/dashboard');
    } else if (user.role === 'DOCTOR') {
      router.replace('/admin/my-schedule');
    }
  }, [user, isLoading, router]);

  return null;
}
