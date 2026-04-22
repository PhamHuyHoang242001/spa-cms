'use client';

// me/bookings/page.tsx — Customer booking history page
// Two tabs: active bookings (PENDING/CONFIRMED) and history (past)
// Cancel action with confirm dialog calls PATCH /bookings/:id/cancel

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, User, Sparkles, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { RequireAuth } from '@/components/auth/require-auth';
import { apiGet, apiPatch } from '@/lib/api-client';
import type { Booking, BookingStatus } from '@/lib/api-types';

type TabKey = 'active' | 'history';

function formatDateVi(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xác nhận', className: 'text-amber-600 bg-amber-50 border-amber-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'text-blue-600 bg-blue-50 border-blue-200' },
  CANCELLED: { label: 'Đã huỷ', className: 'text-gray-500 bg-gray-50 border-gray-200' },
};

interface CancelDialogProps {
  bookingId: string;
  onConfirm: (id: string) => Promise<void>;
  onClose: () => void;
}

function CancelDialog({ bookingId, onConfirm, onClose }: CancelDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await onConfirm(bookingId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Huỷ lịch thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-[#1C1917] text-sm">Huỷ lịch hẹn?</h3>
            <p className="text-xs text-[#A8A29E] mt-1">
              Bạn có chắc muốn huỷ lịch hẹn này không? Hành động không thể hoàn tác.
            </p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B4C41] mb-1.5 uppercase tracking-wider">
            Lý do huỷ (tuỳ chọn)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vd: Bận đột xuất…"
            className="w-full rounded-xl border border-[#DDD0CA] px-3 py-2 text-sm text-[#3D2B25] placeholder-[#C4A99F] bg-[#FDFAF8] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/40 focus:border-[#D4A574] transition"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full border border-[#DDD0CA] py-2.5 text-sm font-medium text-[#6B4C41] hover:bg-[#F5F0E8] disabled:opacity-60 transition-colors"
          >
            Không
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Đang huỷ…' : 'Huỷ lịch'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  showCancel: boolean;
  onCancelClick: (id: string) => void;
}

function BookingCard({ booking, showCancel, onCancelClick }: BookingCardProps) {
  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD5] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Sparkles size={14} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <p className="text-sm font-semibold text-[#1C1917] truncate">
            {booking.service.name.vi}
          </p>
        </div>
        <span
          className={`flex-shrink-0 text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${statusCfg.className}`}
        >
          {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[#A8A29E]">
        <div className="flex items-center gap-1.5">
          <User size={12} className="flex-shrink-0" />
          <span className="truncate">{booking.doctor.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="flex-shrink-0" />
          <span>{formatDateVi(booking.slot.date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="flex-shrink-0" />
          <span>{booking.slot.startTime} – {booking.slot.endTime}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#D4A574] font-medium">
          <span>{booking.service.price.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {booking.note && (
        <p className="text-xs text-[#A8A29E] italic">Ghi chú: {booking.note}</p>
      )}

      {booking.cancelReason && (
        <p className="text-xs text-red-400 italic">Lý do huỷ: {booking.cancelReason}</p>
      )}

      {showCancel && (
        <button
          type="button"
          onClick={() => onCancelClick(booking.id)}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors mt-1"
        >
          <X size={12} />
          Huỷ lịch hẹn
        </button>
      )}
    </div>
  );
}

function MyBookingsInner() {
  const [tab, setTab] = useState<TabKey>('active');
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGet<Booking[]>('/bookings/me?filter=active'),
      apiGet<Booking[]>('/bookings/me?filter=history'),
    ])
      .then(([active, history]) => {
        setActiveBookings(active);
        setHistoryBookings(history);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCancel(id: string) {
    await apiPatch(`/bookings/${id}/cancel`, {});
    fetchAll();
  }

  const currentList = tab === 'active' ? activeBookings : historyBookings;

  return (
    <div className="min-h-screen bg-[#F5F0E8] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-1">
            Tài khoản
          </p>
          <h1
            className="text-2xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            Lịch Hẹn Của Tôi
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 border border-[#E5DDD5]">
          {([['active', 'Lịch hẹn'], ['history', 'Lịch sử']] as [TabKey, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === key
                    ? 'bg-[#D4A574] text-white shadow-sm'
                    : 'text-[#A8A29E] hover:text-[#1C1917]'
                }`}
              >
                {label}
                {key === 'active' && activeBookings.length > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      tab === 'active'
                        ? 'bg-white/30 text-white'
                        : 'bg-[#D4A574]/10 text-[#D4A574]'
                    }`}
                  >
                    {activeBookings.length}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-[#E5DDD5]" />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5DDD5] py-16 text-center">
            <p className="text-[#A8A29E] text-sm mb-4">
              {tab === 'active' ? 'Bạn chưa có lịch hẹn nào.' : 'Chưa có lịch sử đặt lịch.'}
            </p>
            {tab === 'active' && (
              <Link
                href="/booking"
                className="inline-block rounded-full bg-[#D4A574] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c4956a] transition-colors"
              >
                Đặt lịch ngay
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showCancel={tab === 'active' && ['PENDING', 'CONFIRMED'].includes(booking.status)}
                onCancelClick={setCancelTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel dialog */}
      {cancelTarget && (
        <CancelDialog
          bookingId={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <RequireAuth>
      <MyBookingsInner />
    </RequireAuth>
  );
}
