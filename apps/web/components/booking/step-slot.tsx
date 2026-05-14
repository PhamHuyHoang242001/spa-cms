'use client';

// step-slot.tsx — Booking step 3: Date + slot selection
// Composes DateStrip + SlotGrid, manages local date state

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DateStrip } from './date-strip';
import { SlotGrid } from './slot-grid';
import type { Slot } from '@/lib/api-types';

interface StepSlotProps {
  doctorId: string;
  selectedSlotId: string | null;
  onSelect: (slot: Slot) => void;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function StepSlot({ doctorId, selectedSlotId, onSelect }: StepSlotProps) {
  const t = useTranslations('booking');
  const [date, setDate] = useState<string>(todayIso);

  function handleDateChange(newDate: string) {
    setDate(newDate);
    // Clear slot selection when date changes
    if (selectedSlotId) {
      onSelect({ id: '', date: newDate, startTime: '', endTime: '', status: 'AVAILABLE', doctorId } as Slot);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[#1C1917] mb-3">{t('dateLabel')}</p>
        <DateStrip selectedDate={date} onSelect={handleDateChange} />
      </div>
      <div>
        <p className="text-sm font-medium text-[#1C1917] mb-1">{t('timeLabel')}</p>
        <SlotGrid
          doctorId={doctorId}
          date={date}
          selectedSlotId={selectedSlotId}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
