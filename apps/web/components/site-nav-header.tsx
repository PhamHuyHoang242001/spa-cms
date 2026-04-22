'use client';

// site-nav-header.tsx — Top navigation bar showing auth state
// Displays user name + logout when authenticated, login/register links when not

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function SiteNavHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="w-full border-b border-[#e8ddd4] bg-[#FFFFF0]/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="text-[#6b4c41] font-semibold tracking-wide text-sm uppercase"
        >
          K-Beauty Spa
        </Link>

        {/* Primary nav */}
        <nav className="hidden sm:flex items-center gap-5 text-sm text-[#6b4c41]">
          <Link href="/blog" className="hover:text-[#B76E79] transition-colors">
            Blog
          </Link>
        </nav>

        {/* Auth actions */}
        <nav className="flex items-center gap-4 text-sm">
          {isLoading ? (
            <span className="text-[#a08070] text-xs">Loading...</span>
          ) : user ? (
            <>
              <span className="text-[#6b4c41]">
                Hello, <span className="font-medium">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-full border border-[#B76E79] text-[#B76E79] hover:bg-[#B76E79] hover:text-white transition-colors text-xs font-medium"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#6b4c41] hover:text-[#B76E79] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-full bg-[#B76E79] text-white hover:bg-[#a35d68] transition-colors text-xs font-medium"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
