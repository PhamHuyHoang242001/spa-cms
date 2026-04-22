'use client';

// step-doctor.tsx — Booking step 2: Doctor selection cards
// Fetches doctors from API and renders selectable cards with specialty info

import { useEffect, useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import type { Doctor } from '@/lib/api-types';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

interface StepDoctorProps {
  selectedId: string | null;
  onSelect: (doctor: Doctor) => void;
}

export function StepDoctor({ selectedId, onSelect }: StepDoctorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Doctor[]>('/doctors')
      .then(setDoctors)
      .catch(() => setError('Không thể tải danh sách bác sĩ.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
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
      {doctors.map((doctor, i) => {
        const isSelected = doctor.id === selectedId;
        const initials = doctor.name
          .split(' ')
          .slice(-2)
          .map((w) => w[0])
          .join('')
          .toUpperCase();

        return (
          <button
            key={doctor.id}
            type="button"
            onClick={() => onSelect(doctor)}
            className={`text-left bg-white rounded-2xl p-5 shadow-sm transition-all focus:outline-none ${
              isSelected
                ? 'ring-2 ring-[#D4A574] shadow-md'
                : 'hover:shadow-md hover:ring-1 hover:ring-[#D4A574]/40'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
              >
                {initials}
              </div>
              {isSelected && (
                <CheckCircle2 size={20} className="text-[#D4A574] flex-shrink-0" />
              )}
            </div>
            <h3 className="font-semibold text-[#1C1917] text-sm mb-0.5">{doctor.name}</h3>
            <p className="text-[#D4A574] text-xs font-medium mb-2">
              {doctor.specialty?.vi ?? ''}
            </p>
            <div className="flex items-center gap-1.5 mb-3">
              <Star size={11} className="text-[#D4A574] fill-[#D4A574]" />
              <span className="text-xs text-[#A8A29E]">{doctor.yearsExp} năm kinh nghiệm</span>
            </div>
            <p className="text-[#A8A29E] text-xs line-clamp-2">{doctor.bio?.vi ?? ''}</p>
          </button>
        );
      })}
    </div>
  );
}
