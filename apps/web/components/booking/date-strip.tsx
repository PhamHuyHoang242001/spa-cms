'use client';

// date-strip.tsx — Horizontal scrollable strip showing next 14 days for slot step
// Highlights selected date, formats day/month in Vietnamese short form

interface DateStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function DateStrip({ selectedDate, onSelect }: DateStripProps) {
  const days = buildNext14Days();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((d) => {
        const iso = formatDate(d);
        const isSelected = iso === selectedDate;
        const dayLabel = DAY_LABELS[d.getDay()];
        const dayNum = d.getDate();
        const monthNum = d.getMonth() + 1;

        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            className={`flex-shrink-0 flex flex-col items-center w-14 py-2.5 rounded-xl text-xs font-medium transition-all focus:outline-none ${
              isSelected
                ? 'bg-[#D4A574] text-white shadow-md'
                : 'bg-white text-[#1C1917] hover:bg-[#D4A574]/10 border border-[#E5DDD5]'
            }`}
          >
            <span className={`text-[10px] mb-0.5 ${isSelected ? 'text-white/80' : 'text-[#A8A29E]'}`}>
              {dayLabel}
            </span>
            <span className="text-sm font-semibold">{dayNum}</span>
            <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#A8A29E]'}`}>
              Th{monthNum}
            </span>
          </button>
        );
      })}
    </div>
  );
}
