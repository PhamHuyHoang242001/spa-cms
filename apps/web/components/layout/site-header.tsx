'use client';

// site-header.tsx — Sticky top navigation with mobile hamburger menu
// Shows auth state: user name + logout when logged in, login/register links when not

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/services', label: 'Dịch vụ' },
  { href: '/doctors', label: 'Bác sĩ' },
  { href: '/booking', label: 'Đặt lịch' },
];

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/login');
    setMobileOpen(false);
  }

  return (
    <header className="w-full sticky top-0 z-50 bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-[#D4A574]/20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-[#1C1917] font-semibold tracking-widest text-sm uppercase"
          style={{ fontFamily: '"Noto Serif KR", serif' }}
        >
          K-Beauty Spa
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#1C1917] hover:text-[#D4A574] transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3 text-sm">
          {isLoading ? (
            <span className="text-[#A8A29E] text-xs">...</span>
          ) : user ? (
            <>
              <span className="text-[#1C1917] text-sm">
                Xin chào, <span className="font-semibold text-[#D4A574]">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-full border border-[#D4A574] text-[#D4A574] hover:bg-[#D4A574] hover:text-white transition-colors text-xs font-medium"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#1C1917] hover:text-[#D4A574] transition-colors font-medium"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-full bg-[#0F172A] text-white hover:bg-[#D4A574] transition-colors text-xs font-semibold"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#1C1917]"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#F5F0E8] border-t border-[#D4A574]/20 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-[#1C1917] hover:text-[#D4A574] transition-colors font-medium text-sm"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#D4A574]/20 flex flex-col gap-3">
            {user ? (
              <>
                <span className="text-sm text-[#1C1917]">Xin chào, <strong>{user.name}</strong></span>
                <button
                  onClick={handleLogout}
                  aria-label="Đăng xuất khỏi tài khoản"
                  className="text-sm text-[#D4A574] text-left font-medium"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-[#1C1917] font-medium">
                  Đăng nhập
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="text-sm text-[#D4A574] font-semibold">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
