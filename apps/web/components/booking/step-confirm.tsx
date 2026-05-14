'use client';

// step-confirm.tsx — Booking step 4: Summary + note + submit
// Shows selected service/doctor/slot summary, optional note, active booking warning

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AlertTriangle, Calendar, Clock, User, Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api-client';
import type { Booking, CreateBookingInput, Service, Doctor, Slot } from '@/lib/api-types';
import { localizedText } from '@/lib/locale-content';

interface StepConfirmProps {
  service: Service;
  doctor: Doctor;
  slot: Slot;
  onSuccess: (booking: Booking) => void;
}

function formatDateLocale(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-');
  if (locale === 'ko') return `${year}년 ${month}월 ${day}일`;
  return `${day}/${month}/${year}`;
}

export function StepConfirm({ service, doctor, slot, onSuccess }: StepConfirmProps) {
  const t = useTranslations('booking');
  const locale = useLocale();

  const [note, setNote] = useState('');
  const [hasActive, setHasActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittedRef = useRef(false);

  // Check for existing active bookings to warn user
  useEffect(() => {
    apiGet<Booking[]>('/bookings/me?filter=active')
      .then((data) => setHasActive(data.length > 0))
      .catch(() => {}); // non-blocking — ignore error
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError('');

    const payload: CreateBookingInput = {
      serviceId: service.id,
      doctorId: doctor.id,
      slotId: slot.id,
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    try {
      const booking = await apiPost<Booking>('/bookings', payload);
      onSuccess(booking);
    } catch (err) {
      submittedRef.current = false; // Allow retry on error
      setError(err instanceof Error ? err.message : t('errorDefault'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      {/* Active booking warning */}
      {hasActive && (
        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{t('activeWarning')}</p>
        </div>
      )}

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-[#E5DDD5] p-5 space-y-3.5">
        <h3 className="text-sm font-semibold text-[#1C1917] mb-4">{t('summary')}</h3>

        <div className="flex items-start gap-3">
          <Sparkles size={15} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">{t('serviceLabel')}</p>
            <p className="text-sm font-medium text-[#1C1917]">
              {localizedText(service.name, locale)}
            </p>
            <p className="text-xs text-[#A8A29E] mt-0.5">
              {service.priceVnd.toLocaleString('vi-VN')}đ · {service.durationMin} min
            </p>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4]" />

        <div className="flex items-start gap-3">
          <User size={15} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">{t('doctorLabel')}</p>
            <p className="text-sm font-medium text-[#1C1917]">{doctor.user.name}</p>
            <p className="text-xs text-[#A8A29E] mt-0.5">
              {localizedText(doctor.specialty, locale)}
            </p>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4]" />

        <div className="flex items-start gap-3">
          <Calendar size={15} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">{t('dateLabel')}</p>
            <p className="text-sm font-medium text-[#1C1917]">
              {formatDateLocale(slot.date, locale)}
            </p>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4]" />

        <div className="flex items-start gap-3">
          <Clock size={15} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">{t('timeLabel')}</p>
            <p className="text-sm font-medium text-[#1C1917]">
              {slot.startTime} – {slot.endTime}
            </p>
          </div>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium text-[#6B4C41] mb-1.5 uppercase tracking-wider">
          {t('noteLabel')}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={t('notePlaceholder')}
          className="w-full rounded-xl border border-[#DDD0CA] px-4 py-2.5 text-sm text-[#3D2B25] placeholder-[#C4A99F] bg-[#FDFAF8] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/40 focus:border-[#D4A574] resize-none transition"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#D4A574] py-3 text-sm font-semibold text-white hover:bg-[#c4956a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? t('confirming') : t('confirm')}
      </button>
    </form>
  );
}
