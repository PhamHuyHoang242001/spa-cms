'use client';

// slot-grid.tsx — Grid of time slot buttons for a given doctor + date
// Fetches GET /slots?doctorId=X&date=Y, renders morning/afternoon groups

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiGet } from '@/lib/api-client';
import type { Slot } from '@/lib/api-types';

interface SlotGridProps {
  doctorId: string;
  date: string; // YYYY-MM-DD
  selectedSlotId: string | null;
  onSelect: (slot: Slot) => void;
}

function isMorning(time: string): boolean {
  const hour = parseInt(time.split(':')[0], 10);
  return hour < 12;
}

export function SlotGrid({ doctorId, date, selectedSlotId, onSelect }: SlotGridProps) {
  const t = useTranslations('doctors');
  const tb = useTranslations('booking');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctorId || !date) return;
    void Promise.resolve().then(() => {
      setLoading(true);
      setError('');
      apiGet<Slot[]>(`/slots?doctorId=${doctorId}&date=${date}`)
        .then(setSlots)
        .catch(() => setError(t('loadError')))
        .finally(() => setLoading(false));
    });
  }, [doctorId, date, t]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-3">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 mt-3">{error}</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-[#A8A29E] mt-3 text-center py-4">
        {tb('noSlots')}
      </p>
    );
  }

  const morning = slots.filter((s) => isMorning(s.startTime));
  const afternoon = slots.filter((s) => !isMorning(s.startTime));

  function renderGroup(label: string, group: Slot[]) {
    if (group.length === 0) return null;
    return (
      <div className="mt-3">
        <p className="text-xs text-[#A8A29E] font-medium mb-2">{label}</p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {group.map((slot) => {
            const isSelected = slot.id === selectedSlotId;
            const isAvailable = slot.status === 'AVAILABLE';
            return (
              <button
                key={slot.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelect(slot)}
                className={`py-2 px-1 rounded-lg text-xs font-medium transition-all focus:outline-none ${
                  isSelected
                    ? 'bg-[#D4A574] text-white shadow-md'
                    : isAvailable
                    ? 'bg-white border border-[#E5DDD5] text-[#1C1917] hover:border-[#D4A574] hover:text-[#D4A574]'
                    : 'bg-gray-100 text-[#C4B5B0] cursor-not-allowed line-through'
                }`}
              >
                {slot.startTime}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderGroup(t('morning'), morning)}
      {renderGroup(t('afternoon'), afternoon)}
    </div>
  );
}
