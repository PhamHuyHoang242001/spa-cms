'use client';

// step-slot.tsx — Booking step 3: Date + slot selection
// Composes DateStrip + SlotGrid, manages local date state

import { useState } from 'react';
import { DateStrip } from './date-strip';
import { SlotGrid } from './slot-grid';
import type { Slot } from '@/lib/api-types';

interface StepSlotProps {
  doctorId: string;
  selectedSlotId: string | null;
  onSelect: (slot: Slot) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StepSlot({ doctorId, selectedSlotId, onSelect }: StepSlotProps) {
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
        <p className="text-sm font-medium text-[#1C1917] mb-3">Chọn ngày</p>
        <DateStrip selectedDate={date} onSelect={handleDateChange} />
      </div>
      <div>
        <p className="text-sm font-medium text-[#1C1917] mb-1">Chọn khung giờ</p>
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
