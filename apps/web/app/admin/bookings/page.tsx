'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api-client';
import { AdminFormModal } from '@/components/admin/admin-form-modal';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminTable } from '@/components/admin/admin-table';
import { fmtAdminDate } from '@/components/admin/admin-list-bar';
import type { BookingAdmin, BookingStatus, Doctor, PaginatedResponse, PaginationMeta } from '@/lib/api-types';

const STATUS_VALUES: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
  'NO_SHOW',
];

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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingAdmin[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Doctor[]>('/doctors').then(setDoctors).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (doctorId) params.set('doctorId', doctorId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const result = await apiGet<PaginatedResponse<BookingAdmin>>(`/bookings?${params}`);
      setBookings(result.data);
      setMeta(result.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải đặt lịch');
    } finally {
      setLoading(false);
    }
  }, [page, status, doctorId, from, to]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function resetPageOnFilter(cb: () => void) {
    setPage(1);
    cb();
  }

  async function confirmBooking(id: string) {
    try {
      await apiPatch(`/bookings/${id}/confirm`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xác nhận thất bại');
    }
  }

  async function cancelBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelId || !cancelReason.trim()) return;
    setSaving(true);
    try {
      await apiPatch(`/bookings/${cancelId}/cancel`, { cancelReason: cancelReason.trim() });
      setCancelId(null);
      setCancelReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hủy lịch thất bại');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'user', label: 'Khách hàng', render: (b: BookingAdmin) => b.user.name },
    { key: 'service', label: 'Dịch vụ', render: (b: BookingAdmin) => b.service.name.vi },
    { key: 'doctor', label: 'Bác sĩ', render: (b: BookingAdmin) => b.doctor.user.name },
    {
      key: 'slot',
      label: 'Ngày giờ',
      render: (b: BookingAdmin) => `${formatDate(b.slot.date)} ${b.slot.startTime}`,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (b: BookingAdmin) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>
          {STATUS_LABELS[b.status]}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Tạo lúc', render: (b: BookingAdmin) => <span className="whitespace-nowrap">{fmtAdminDate(b.createdAt)}</span> },
    { key: 'updatedAt', label: 'Sửa lúc', render: (b: BookingAdmin) => <span className="whitespace-nowrap">{fmtAdminDate(b.updatedAt)}</span> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3d2b25]">Đặt lịch</h1>
          <p className="mt-1 text-sm text-[#8a6a62]">Quản lý lịch hẹn của khách hàng</p>
        </div>
        <CalendarCheck className="text-[#B76E79]" size={24} />
      </div>

      <div className="grid gap-3 rounded-xl border border-[#ede4de] bg-[#fdfaf8] p-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-[#6b4c41]">
          Lọc trạng thái
          <Select value={status} onChange={(v) => resetPageOnFilter(() => setStatus(v))}>
            <option value="">Tất cả trạng thái</option>
            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-[#6b4c41]">
          Lọc bác sĩ
          <Select value={doctorId} onChange={(v) => resetPageOnFilter(() => setDoctorId(v))}>
            <option value="">Tất cả bác sĩ</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.user.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-[#6b4c41]">
          Từ ngày
          <input type="date" value={from} onChange={(e) => resetPageOnFilter(() => setFrom(e.target.value))} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-[#6b4c41]">
          Đến ngày
          <input type="date" value={to} onChange={(e) => resetPageOnFilter(() => setTo(e.target.value))} className={fieldClass} />
        </label>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <AdminTable
        columns={columns}
        data={bookings}
        loading={loading}
        actions={(booking) => (
          <>
            {booking.status === 'PENDING' && (
              <button type="button" onClick={() => confirmBooking(booking.id)} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white">
                Xác nhận
              </button>
            )}
            {['PENDING', 'CONFIRMED'].includes(booking.status) && (
              <button type="button" onClick={() => setCancelId(booking.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Hủy lịch
              </button>
            )}
          </>
        )}
      />

      {meta && <AdminPagination page={page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />}

      <AdminFormModal title="Hủy lịch hẹn" open={!!cancelId} onClose={() => setCancelId(null)}>
        <form onSubmit={cancelBooking} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6b4c41]">Lý do hủy</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              className={`${fieldClass} h-24 resize-none`}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCancelId(null)} className="rounded-full border border-[#ddd0ca] px-4 py-2 text-sm text-[#6b4c41] hover:bg-[#f5ede8]">Hủy</button>
            <button type="submit" disabled={saving || !cancelReason.trim()} className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60">
              Xác nhận hủy
            </button>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}

const fieldClass = 'w-full rounded-lg border border-[#ddd0ca] bg-[#fdfaf8] px-3 py-2 text-sm text-[#3d2b25] focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40';

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
      {children}
    </select>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}
