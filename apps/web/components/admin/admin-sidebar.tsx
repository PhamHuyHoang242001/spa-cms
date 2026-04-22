'use client';

// admin-sidebar.tsx — Role-filtered sidebar navigation for admin panel
// SUPERADMIN: all sections | DOCTOR: my-schedule only

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  Newspaper,
  Clock,
  BookOpen,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
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
    icon: <Stethoscope size={18} />,
    roles: ['SUPERADMIN'],
  },
  {
    href: '/admin/doctors',
    label: 'Bác sĩ',
    icon: <BookOpen size={18} />,
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
    label: 'Lịch hẹn',
    icon: <Clock size={18} />,
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

  const navContent = (
    <nav className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <span className="text-lg font-semibold text-white tracking-wide">K-Beauty Admin</span>
        <p className="text-xs text-white/50 mt-0.5">{user?.name}</p>
      </div>

      {/* Nav links */}
      <ul className="flex-1 px-3 py-4 space-y-1">
        {filtered.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-[#3d2b25] flex-col">
        {navContent}
      </aside>

      {/* Mobile toggle */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg bg-[#3d2b25] text-white shadow"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <aside className="w-56 bg-[#3d2b25] flex flex-col">{navContent}</aside>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
