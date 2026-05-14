'use client';

// admin/slots/page.tsx — SUPERADMIN slot management
// Generate 30-day slots for all doctors + view/block slots per doctor+date

import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import type { Slot } from '@/lib/api-types';

interface DoctorOption {
  id: string;
  name: string;
}

export default function SlotsPage() {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load doctor list on mount
  useEffect(() => {
    void Promise.resolve().then(() => {
      apiGet<Array<{ id: string; user: { name: string } }>>('/doctors')
        .then((data) => {
          const mapped = data.map((d) => ({ id: d.id, name: d.user.name }));
          setDoctors(mapped);
          if (mapped.length > 0) setSelectedDoctor(mapped[0].id);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải bác sĩ'));
    });
  }, []);

  const loadSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    setError('');
    try {
      const data = await apiGet<Slot[]>(`/slots?doctorId=${selectedDoctor}&date=${selectedDate}`);
      setSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải slot');
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    void Promise.resolve().then(loadSlots);
  }, [loadSlots]);

  async function generateAll() {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    let ok = 0;
    let fail = 0;
    for (const doctor of doctors) {
      try {
        await apiPost('/slots/generate', { doctorId: doctor.id, days: 30 });
        ok++;
      } catch {
        fail++;
      }
    }
    setGenerating(false);
    if (fail === 0) {
      setSuccessMsg(`Đã tạo slot cho ${ok} bác sĩ thành công.`);
    } else {
      setSuccessMsg(`Tạo xong: ${ok} thành công, ${fail} thất bại.`);
    }
  }

  async function toggleBlock(slot: Slot) {
    setError('');
    try {
      await apiPatch(`/slots/${slot.id}/block`, { blocked: slot.status !== 'BLOCKED' });
      await loadSlots();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  }

  const statusColor: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-700',
    BOOKED: 'bg-blue-100 text-blue-700',
    BLOCKED: 'bg-gray-100 text-gray-500',
  };

  const statusLabel: Record<string, string> = {
    AVAILABLE: 'Trống',
    BOOKED: 'Đã đặt',
    BLOCKED: 'Chặn',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3d2b25]">Quản lý lịch hẹn</h1>
        <p className="text-sm text-[#8a6a62] mt-1">Tạo slot và xem lịch theo bác sĩ</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{successMsg}</div>
      )}

      {/* Generate action */}
      <div className="bg-white rounded-2xl border border-[#ede4de] p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-[#3d2b25] text-sm">Tạo slot 30 ngày cho tất cả bác sĩ</p>
          <p className="text-xs text-[#8a6a62] mt-0.5">Mỗi bác sĩ sẽ được tạo slot tự động cho 30 ngày tiếp theo.</p>
        </div>
        <button
          onClick={generateAll}
          disabled={generating || doctors.length === 0}
          className="flex-shrink-0 px-5 py-2.5 rounded-full bg-[#B76E79] text-white text-sm font-medium hover:bg-[#a35d68] disabled:opacity-60 transition-colors"
        >
          {generating ? 'Đang tạo...' : 'Tạo slot'}
        </button>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-[#6b4c41] mb-1 uppercase tracking-wider">Bác sĩ</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="rounded-lg border border-[#ddd0ca] px-3 py-2 text-sm text-[#3d2b25] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 focus:border-[#B76E79]"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b4c41] mb-1 uppercase tracking-wider">Ngày</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-[#ddd0ca] px-3 py-2 text-sm text-[#3d2b25] bg-[#fdfaf8] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40 focus:border-[#B76E79]"
          />
        </div>
      </div>

      {/* Slots grid */}
      {loadingSlots ? (
        <p className="text-sm text-[#8a6a62]">Đang tải slot...</p>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ede4de] px-6 py-10 text-center text-[#a89080] text-sm">
          Không có slot nào cho ngày này.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="bg-white rounded-xl border border-[#ede4de] p-4 flex flex-col gap-2"
            >
              <p className="text-sm font-medium text-[#3d2b25]">
                {slot.startTime} – {slot.endTime}
              </p>
              <span className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[slot.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {statusLabel[slot.status] ?? slot.status}
              </span>
              {slot.status !== 'BOOKED' && (
                <button
                  onClick={() => toggleBlock(slot)}
                  className="text-xs text-[#8a6a62] underline hover:text-[#3d2b25] transition-colors self-start"
                >
                  {slot.status === 'BLOCKED' ? 'Mở lại' : 'Chặn'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
