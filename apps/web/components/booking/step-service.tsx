'use client';

// step-service.tsx — Booking step 1: Service selection grid
// Fetches services from API and renders selectable cards

import { useEffect, useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import type { Service } from '@/lib/api-types';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

interface StepServiceProps {
  selectedId: string | null;
  prefillSlug?: string;
  onSelect: (service: Service) => void;
}

export function StepService({ selectedId, prefillSlug, onSelect }: StepServiceProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Service[]>('/services')
      .then((data) => {
        setServices(data);
        // Auto-select if prefill slug matches
        if (prefillSlug && !selectedId) {
          const match = data.find((s) => s.slug === prefillSlug);
          if (match) onSelect(match);
        }
      })
      .catch(() => setError('Không thể tải danh sách dịch vụ.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillSlug]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div className="h-32 bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-8">{error}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service, i) => {
        const isSelected = service.id === selectedId;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={`text-left bg-white rounded-2xl overflow-hidden shadow-sm transition-all focus:outline-none ${
              isSelected
                ? 'ring-2 ring-[#D4A574] shadow-md'
                : 'hover:shadow-md hover:ring-1 hover:ring-[#D4A574]/40'
            }`}
          >
            <div
              className="h-32 w-full relative"
              style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                  <CheckCircle2 size={18} className="text-[#D4A574]" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-[#1C1917] text-sm mb-1 line-clamp-1">
                {service.name.vi}
              </h3>
              <p className="text-[#A8A29E] text-xs line-clamp-2 mb-3">
                {service.description?.vi ?? ''}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[#D4A574] font-bold text-xs">
                  {service.price.toLocaleString('vi-VN')}đ
                </span>
                <span className="flex items-center gap-1 text-xs text-[#A8A29E]">
                  <Clock size={10} />
                  {service.duration} phút
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
