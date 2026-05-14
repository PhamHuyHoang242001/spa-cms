'use client';

// me/bookings/page.tsx — Customer booking history page
// Two tabs: active bookings (PENDING/CONFIRMED) and history (past)
// Cancel action with confirm dialog calls PATCH /bookings/:id/cancel

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Clock, User, Sparkles, X, AlertTriangle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { RequireAuth } from '@/components/auth/require-auth';
import { apiGet, apiPatch } from '@/lib/api-client';
import type { Booking, BookingStatus } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';

type TabKey = 'active' | 'history';

function formatDateLocale(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-');
  if (locale === 'ko') return `${year}년 ${month}월 ${day}일`;
  return `${day}/${month}/${year}`;
}

// Status badge CSS classes (no translated labels — labels come from t())
const STATUS_CLASS: Record<BookingStatus, string> = {
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  CONFIRMED: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  COMPLETED: 'text-blue-600 bg-blue-50 border-blue-200',
  EXPIRED: 'text-gray-500 bg-gray-50 border-gray-200',
  CANCELLED: 'text-gray-500 bg-gray-50 border-gray-200',
  NO_SHOW: 'text-red-500 bg-red-50 border-red-200',
};

interface CancelDialogProps {
  bookingId: string;
  onConfirm: (id: string) => Promise<void>;
  onClose: () => void;
}

function CancelDialog({ bookingId, onConfirm, onClose }: CancelDialogProps) {
  const t = useTranslations('myBookings');
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
      setError(err instanceof Error ? err.message : t('cancelError'));
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
            <h3 className="font-semibold text-[#1C1917] text-sm">{t('cancelTitle')}</h3>
            <p className="text-xs text-[#A8A29E] mt-1">{t('cancelMessage')}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B4C41] mb-1.5 uppercase tracking-wider">
            {t('cancelReasonLabel')}
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('cancelReasonPlaceholder')}
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
            {t('cancelNo')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            {loading ? t('cancelling') : t('cancelConfirm')}
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
  const t = useTranslations('myBookings');
  const locale = useLocale();
  const statusClass = STATUS_CLASS[booking.status] ?? STATUS_CLASS.PENDING;

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD5] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Sparkles size={14} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <p className="text-sm font-semibold text-[#1C1917] truncate">
            {localizedText(booking.service.name, locale)}
          </p>
        </div>
        <span
          className={`flex-shrink-0 text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${statusClass}`}
        >
          {t(`status.${booking.status}`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[#A8A29E]">
        <div className="flex items-center gap-1.5">
          <User size={12} className="flex-shrink-0" />
          <span className="truncate">{booking.doctor.user.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="flex-shrink-0" />
          <span>{formatDateLocale(booking.slot.date, locale)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="flex-shrink-0" />
          <span>{booking.slot.startTime} – {booking.slot.endTime}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#D4A574] font-medium">
          <span>{booking.service.priceVnd.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {booking.note && (
        <p className="text-xs text-[#A8A29E] italic">{t('notePrefix')}: {booking.note}</p>
      )}

      {booking.cancelReason && (
        <p className="text-xs text-red-400 italic">{t('cancelReasonPrefix')}: {booking.cancelReason}</p>
      )}

      {showCancel && (
        <button
          type="button"
          onClick={() => onCancelClick(booking.id)}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors mt-1"
        >
          <X size={12} />
          {t('cancel')}
        </button>
      )}
    </div>
  );
}

function MyBookingsInner() {
  const t = useTranslations('myBookings');
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

  useEffect(() => {
    void Promise.resolve().then(fetchAll);
  }, [fetchAll]);

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
            {t('account')}
          </p>
          <h1
            className="text-2xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            {t('title')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 border border-[#E5DDD5]">
          {(['active', 'history'] as TabKey[]).map((key) => (
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
              {key === 'active' ? t('tabActive') : t('tabHistory')}
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
          ))}
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
              {tab === 'active' ? t('emptyActive') : t('emptyHistory')}
            </p>
            {tab === 'active' && (
              <Link
                href="/booking"
                className="inline-block rounded-full bg-[#D4A574] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c4956a] transition-colors"
              >
                {t('bookNow')}
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
