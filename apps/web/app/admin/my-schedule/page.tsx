'use client';

// admin/my-schedule/page.tsx — DOCTOR role: today's active bookings + quick status actions

import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPatch } from '@/lib/api-client';
import type { Booking } from '@/lib/api-types';
import { CheckCircle, XCircle } from 'lucide-react';

export default function MySchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<Booking[]>('/bookings/me?filter=active');
      setBookings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải lịch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, action: 'confirm' | 'complete' | 'no-show') {
    setActionError('');
    try {
      await apiPatch(`/bookings/${id}/${action}`, {});
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  }

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3d2b25]">Lịch của tôi</h1>
        <p className="text-sm text-[#8a6a62] mt-1 capitalize">{today}</p>
      </div>

      {(error || actionError) && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error || actionError}
        </div>
      )}

      {loading && (
        <p className="text-[#8a6a62] text-sm">Đang tải lịch...</p>
      )}

      {!loading && bookings.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#ede4de] px-6 py-12 text-center text-[#a89080] text-sm">
          Không có lịch hẹn nào hôm nay.
        </div>
      )}

      <ul className="space-y-4">
        {bookings.map((b) => (
          <li key={b.id} className="bg-white rounded-2xl border border-[#ede4de] p-5">
            <div className="flex items-start justify-between gap-4">
              {/* Info */}
              <div className="space-y-1">
                <p className="font-semibold text-[#3d2b25] text-sm">
                  {b.slot.startTime} – {b.slot.endTime}
                  <span className="ml-2 text-[#8a6a62] font-normal">{b.slot.date}</span>
                </p>
                <p className="text-sm text-[#3d2b25]">{b.service.name.vi}</p>
                {b.note && (
                  <p className="text-xs text-[#8a6a62] italic">Ghi chú: {b.note}</p>
                )}
                <StatusBadge status={b.status} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                {b.status === 'PENDING' && (
                  <ActionBtn
                    label="Xác nhận"
                    icon={<CheckCircle size={14} />}
                    color="green"
                    onClick={() => updateStatus(b.id, 'confirm')}
                  />
                )}
                {b.status === 'CONFIRMED' && (
                  <>
                    <ActionBtn
                      label="Hoàn thành"
                      icon={<CheckCircle size={14} />}
                      color="green"
                      onClick={() => updateStatus(b.id, 'complete')}
                    />
                    <ActionBtn
                      label="Vắng"
                      icon={<XCircle size={14} />}
                      color="red"
                      onClick={() => updateStatus(b.id, 'no-show')}
                    />
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  const label: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[status] ?? status}
    </span>
  );
}

interface ActionBtnProps {
  label: string;
  icon: React.ReactNode;
  color: 'green' | 'red';
  onClick: () => void;
}

function ActionBtn({ label, icon, color, onClick }: ActionBtnProps) {
  const cls = color === 'green'
    ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
    : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${cls}`}
    >
      {icon}
      {label}
    </button>
  );
}
