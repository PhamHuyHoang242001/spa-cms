'use client';

// admin-sidebar.tsx — Role-filtered sidebar navigation for admin panel
// SUPERADMIN: all sections | DOCTOR: my-schedule only
// Desktop: sticky full-height rail. Mobile: sticky top bar + slide-in drawer.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Stethoscope,
  Newspaper,
  Clock,
  Sparkles,
  LogOut,
  Menu,
  Users,
  X,
  ExternalLink,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import clsx from 'clsx';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Tổng quan',
    icon: <LayoutDashboard size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/services',
    label: 'Dịch vụ',
    icon: <Sparkles size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/doctors',
    label: 'Bác sĩ',
    icon: <Stethoscope size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/articles',
    label: 'Bài viết',
    icon: <Newspaper size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/slots',
    label: 'Khung giờ',
    icon: <Clock size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/bookings',
    label: 'Lịch hẹn',
    icon: <CalendarCheck size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/users',
    label: 'Người dùng',
    icon: <Users size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/my-schedule',
    label: 'Lịch của tôi',
    icon: <CalendarDays size={18} />,
    roles: ['DOCTOR', 'SUPERADMIN'],
  },
];

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const role = user?.role ?? '';
  const filtered = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const current = filtered.find((item) => pathname.startsWith(item.href));

  // Close on Escape and lock page scroll while the drawer is open (links close it on click).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navContent = (
    <nav className="flex flex-col h-full" aria-label="Điều hướng quản trị">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <span className="font-serif text-lg font-semibold text-white tracking-wide">K-Beauty Admin</span>
        <p className="text-xs text-white/50 mt-0.5 truncate">{user?.name}</p>
      </div>

      {/* Nav links */}
      <ul className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filtered.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={clsx(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-white/15 text-white font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-[#D4A574]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <span className={active ? 'text-[#D4A574]' : ''}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink size={18} />
          Xem trang web
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="!m-0 !justify-start !border-0 !bg-transparent !shadow-none hover:!bg-white/10 hover:!translate-y-0 flex items-center gap-3 px-3 py-2.5 w-full !rounded-lg text-sm text-white/70 hover:text-white"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar: stays in view while long pages scroll */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-[#2a1d19] flex-col sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-3 bg-[#2a1d19] text-white shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="!m-0 !border-0 !bg-transparent !shadow-none !p-2 !rounded-lg hover:!bg-white/10 hover:!translate-y-0 text-white"
          aria-label="Mở menu quản trị"
          aria-expanded={open}
        >
          <Menu size={20} />
        </button>
        <span className="font-medium text-sm truncate">{current?.label ?? 'K-Beauty Admin'}</span>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <aside className="relative w-72 max-w-[85vw] bg-[#2a1d19] flex flex-col shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="!absolute right-2 top-3 !m-0 !border-0 !bg-transparent !shadow-none !p-2 !rounded-lg hover:!bg-white/10 hover:!translate-y-0 text-white/80"
              aria-label="Đóng menu"
            >
              <X size={20} />
            </button>
            {navContent}
          </aside>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
