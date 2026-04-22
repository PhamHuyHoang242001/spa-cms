'use client';

// admin/dashboard/page.tsx — SUPERADMIN stats overview
// Fetches counts from /services, /doctors, /articles + quick action buttons

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api-client';
import { Stethoscope, BookOpen, Newspaper, Plus } from 'lucide-react';

interface StatsState {
  services: number;
  doctors: number;
  articles: number;
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
  const [stats, setStats] = useState<StatsState>({ services: 0, doctors: 0, articles: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [services, doctors, articles] = await Promise.all([
          apiGet<unknown[]>('/services'),
          apiGet<unknown[]>('/doctors'),
          apiGet<unknown[]>('/articles'),
        ]);
        setStats({
          services: services.length,
          doctors: doctors.length,
          articles: articles.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Recent bookings placeholder */}
      <div>
        <h2 className="text-base font-semibold text-[#3d2b25] mb-3">Đặt lịch gần đây</h2>
        <div className="bg-white rounded-2xl border border-[#ede4de] px-6 py-10 text-center text-[#a89080] text-sm">
          Tính năng danh sách đặt lịch toàn bộ sẽ có ở phiên bản sau.
        </div>
      </div>
    </div>
  );
}
