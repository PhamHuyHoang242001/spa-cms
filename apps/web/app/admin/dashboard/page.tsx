'use client';

// admin/dashboard/page.tsx — SUPERADMIN stats overview
// Fetches counts from /services, /doctors, /articles + quick action buttons

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api-client';
import { Stethoscope, BookOpen, Newspaper, Plus, CalendarCheck } from 'lucide-react';
import type { BookingAdmin, BookingStatus, PaginatedResponse } from '@/lib/api-types';

interface StatsState {
  services: number;
  doctors: number;
  articles: number;
  bookings: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#ede4de] p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-[#3d2b25]">{value}</p>
        <p className="text-sm text-[#8a6a62] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsState>({ services: 0, doctors: 0, articles: 0, bookings: 0 });
  const [recentBookings, setRecentBookings] = useState<BookingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [services, doctors, articles, bookings] = await Promise.all([
          apiGet<unknown[]>('/services'),
          apiGet<unknown[]>('/doctors'),
          apiGet<PaginatedResponse<unknown>>('/articles/admin?page=1&limit=1'),
          apiGet<PaginatedResponse<BookingAdmin>>('/bookings?page=1&limit=5'),
        ]);
        setStats({
          services: services.length,
          doctors: doctors.length,
          articles: articles.meta.total,
          bookings: bookings.meta.total,
        });
        setRecentBookings(bookings.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#3d2b25]">Tổng quan</h1>
        <p className="text-sm text-[#8a6a62] mt-1">Xem nhanh dữ liệu hệ thống</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Dịch vụ"
          value={loading ? 0 : stats.services}
          icon={<Stethoscope size={22} className="text-[#B76E79]" />}
          color="bg-[#fdeef1]"
        />
        <StatCard
          label="Bác sĩ"
          value={loading ? 0 : stats.doctors}
          icon={<BookOpen size={22} className="text-[#6b8fd4]" />}
          color="bg-[#eef1fd]"
        />
        <StatCard
          label="Bài viết"
          value={loading ? 0 : stats.articles}
          icon={<Newspaper size={22} className="text-[#5aaa7e]" />}
          color="bg-[#eefdf4]"
        />
        <StatCard
          label="Đặt lịch"
          value={loading ? 0 : stats.bookings}
          icon={<CalendarCheck size={22} className="text-[#c97d3e]" />}
          color="bg-[#fdf4e8]"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-[#3d2b25] mb-3">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#B76E79] text-white text-sm font-medium hover:bg-[#a35d68] transition-colors"
          >
            <Plus size={16} />
            Thêm dịch vụ
          </Link>
          <Link
            href="/admin/doctors"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#6b8fd4] text-white text-sm font-medium hover:bg-[#5a7ec3] transition-colors"
          >
            <Plus size={16} />
            Thêm bác sĩ
          </Link>
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#5aaa7e] text-white text-sm font-medium hover:bg-[#499a6d] transition-colors"
          >
            <Plus size={16} />
            Viết bài
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#3d2b25]">Đặt lịch gần đây</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-[#B76E79] hover:underline">
            Xem tất cả
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#ede4de] px-6 py-10 text-center text-[#a89080] text-sm">
            Chưa có đặt lịch.
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#ede4de] bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-[#3d2b25]">{booking.user.name}</p>
                  <p className="text-xs text-[#8a6a62]">
                    {booking.service.name.vi} - {new Date(booking.slot.date).toLocaleDateString('vi-VN')} {booking.slot.startTime}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[booking.status]}`}>
                  {STATUS_LABELS[booking.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Vắng mặt',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-orange-100 text-orange-700',
};
