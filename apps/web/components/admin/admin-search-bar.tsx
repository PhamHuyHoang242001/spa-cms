'use client';

import { Search, X } from 'lucide-react';

interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdminSearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
}: AdminSearchBarProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89080]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#ddd0ca] bg-[#fdfaf8] py-2 pl-9 pr-8 text-sm text-[#3d2b25] focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/40"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#a89080] hover:text-[#3d2b25]"
          aria-label="Xóa tìm kiếm"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
