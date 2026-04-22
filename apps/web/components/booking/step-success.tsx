'use client';

// step-success.tsx — Booking step 5: Success confirmation screen
// Shows booking details and CTA to navigate to /me/bookings

import Link from 'next/link';
import { CheckCircle2, Calendar, Clock, User, Sparkles } from 'lucide-react';
import type { Booking } from '@/lib/api-types';

interface StepSuccessProps {
  booking: Booking;
}

function formatDateVi(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
};

export function StepSuccess({ booking }: StepSuccessProps) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-4">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-[#D4A574]/10 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-[#D4A574]" />
        </div>
      </div>

      {/* Heading */}
      <div>
        <h2
          className="text-2xl font-bold text-[#1C1917] mb-2"
          style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
        >
          Đặt lịch thành công!
        </h2>
        <p className="text-sm text-[#A8A29E]">
          Chúng tôi sẽ liên hệ xác nhận lịch hẹn của bạn sớm nhất có thể.
        </p>
      </div>

      {/* Booking details card */}
      <div className="bg-white rounded-2xl border border-[#E5DDD5] p-5 text-left space-y-3.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#A8A29E]">Mã đặt lịch</span>
          <span className="text-xs font-mono text-[#1C1917] bg-[#F5F0E8] px-2 py-0.5 rounded">
            #{booking.id.slice(-8).toUpperCase()}
          </span>
        </div>

        <div className="h-px bg-[#F0EAE4]" />

        <div className="flex items-start gap-3">
          <Sparkles size={14} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">Dịch vụ</p>
            <p className="text-sm font-medium text-[#1C1917]">{booking.service.name.vi}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <User size={14} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">Bác sĩ</p>
            <p className="text-sm font-medium text-[#1C1917]">{booking.doctor.name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar size={14} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">Ngày</p>
            <p className="text-sm font-medium text-[#1C1917]">{formatDateVi(booking.slot.date)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock size={14} className="text-[#D4A574] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[#A8A29E]">Giờ</p>
            <p className="text-sm font-medium text-[#1C1917]">
              {booking.slot.startTime} – {booking.slot.endTime}
            </p>
          </div>
        </div>

        <div className="h-px bg-[#F0EAE4]" />

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A8A29E]">Trạng thái</span>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            {STATUS_LABELS[booking.status] ?? booking.status}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/me/bookings"
        className="inline-block w-full rounded-full bg-[#D4A574] py-3 text-sm font-semibold text-white hover:bg-[#c4956a] transition-colors text-center"
      >
        Xem lịch của tôi
      </Link>
    </div>
  );
}
