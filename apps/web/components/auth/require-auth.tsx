'use client';

// require-auth.tsx — Wrapper that redirects unauthenticated users to /login (i18n)

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('common');

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4A574] border-t-transparent animate-spin" />
          <p className="text-sm text-[#A8A29E]">{t('authenticating')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
