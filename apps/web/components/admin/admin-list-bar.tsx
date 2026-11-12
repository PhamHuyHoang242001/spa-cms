'use client';

export interface FilterOpt {
  key: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

interface AdminListBarProps {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOpt[];
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium uppercase tracking-wider text-[#57534E]">
      {label}
      {children}
    </label>
  );
}

export function AdminListBar({
  search,
  onSearch,
  searchPlaceholder = 'Tìm…',
  filters = [],
}: AdminListBarProps) {
  const box = 'rounded-lg border border-[#E5DDD5] px-3 py-2 text-sm bg-white font-normal normal-case tracking-normal text-[#1C1917]';
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E5DDD5] bg-[#FAF7F2] p-3">
      <Labeled label="Tìm kiếm">
        <input className={`${box} min-w-56`} value={search} onChange={(e) => onSearch(e.target.value)} placeholder={searchPlaceholder} />
      </Labeled>
      {filters.map((f) => (
        <Labeled key={f.key} label={`Lọc: ${f.label}`}>
          <select className={box} value={f.value} onChange={(e) => f.onChange(e.target.value)}>
            <option value="">Tất cả</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Labeled>
      ))}
    </div>
  );
}

export function fmtAdminDate(value?: string | Date | null) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).formatToParts(d);
  const g = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${g('hour')}:${g('minute')} ${g('day')}-${g('month')}-${g('year')}`;
}
