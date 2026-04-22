'use client';

// booking/page.tsx — Multi-step booking flow container
// Step state managed via URL searchParams: service → doctor → slot → confirm → success
// Each step component is kept under 200 lines in its own file

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { RequireAuth } from '@/components/auth/require-auth';
import { StepService } from '@/components/booking/step-service';
import { StepDoctor } from '@/components/booking/step-doctor';
import { StepSlot } from '@/components/booking/step-slot';
import { StepConfirm } from '@/components/booking/step-confirm';
import { StepSuccess } from '@/components/booking/step-success';
import type { Service, Doctor, Slot, Booking } from '@/lib/api-types';

type BookingStep = 'service' | 'doctor' | 'slot' | 'confirm' | 'success';

const STEP_ORDER: BookingStep[] = ['service', 'doctor', 'slot', 'confirm', 'success'];

const STEP_LABELS: Record<BookingStep, string> = {
  service: 'Chọn dịch vụ',
  doctor: 'Chọn bác sĩ',
  slot: 'Chọn lịch',
  confirm: 'Xác nhận',
  success: 'Hoàn tất',
};

function StepIndicator({ current }: { current: BookingStep }) {
  const visibleSteps = STEP_ORDER.slice(0, 4); // exclude 'success' from indicator
  const currentIdx = STEP_ORDER.indexOf(current);

  return (
    <div className="flex items-center gap-0 mb-8">
      {visibleSteps.map((step, i) => {
        const stepIdx = STEP_ORDER.indexOf(step);
        const isDone = stepIdx < currentIdx;
        const isActive = step === current;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-[#D4A574] text-white'
                    : isActive
                    ? 'bg-[#D4A574] text-white ring-4 ring-[#D4A574]/20'
                    : 'bg-white border-2 border-[#E5DDD5] text-[#A8A29E]'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block ${
                  isActive ? 'text-[#D4A574]' : 'text-[#A8A29E]'
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${
                  stepIdx < currentIdx ? 'bg-[#D4A574]' : 'bg-[#E5DDD5]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BookingPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawStep = (searchParams.get('step') ?? 'service') as BookingStep;
  const currentStep = STEP_ORDER.includes(rawStep) ? rawStep : 'service';
  const prefillSlug = searchParams.get('service') ?? undefined;

  // Selections stored in local state (URL only carries step + prefill)
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  function goToStep(step: BookingStep) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', step);
    router.push(`/booking?${params.toString()}`);
  }

  function handleBack() {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) goToStep(STEP_ORDER[idx - 1]);
  }

  const canGoBack =
    currentStep !== 'service' && currentStep !== 'success';

  return (
    <div className="min-h-screen bg-[#F5F0E8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Page title */}
        <div className="text-center mb-6">
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-2">
            Đặt lịch
          </p>
          <h1
            className="text-3xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            Đặt Lịch Hẹn
          </h1>
        </div>

        {/* Step indicator (hidden on success) */}
        {currentStep !== 'success' && <StepIndicator current={currentStep} />}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Back button */}
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-[#A8A29E] hover:text-[#1C1917] mb-5 transition-colors"
            >
              <ChevronLeft size={16} />
              Quay lại
            </button>
          )}

          {/* Step heading */}
          {currentStep !== 'success' && (
            <h2 className="text-base font-semibold text-[#1C1917] mb-5">
              {STEP_LABELS[currentStep]}
            </h2>
          )}

          {/* Step content */}
          {currentStep === 'service' && (
            <StepService
              selectedId={selectedService?.id ?? null}
              prefillSlug={prefillSlug}
              onSelect={(s) => {
                setSelectedService(s);
                goToStep('doctor');
              }}
            />
          )}

          {currentStep === 'doctor' && (
            <StepDoctor
              selectedId={selectedDoctor?.id ?? null}
              onSelect={(d) => {
                setSelectedDoctor(d);
                goToStep('slot');
              }}
            />
          )}

          {currentStep === 'slot' && selectedDoctor && (
            <StepSlot
              doctorId={selectedDoctor.id}
              selectedSlotId={selectedSlot?.id ?? null}
              onSelect={(slot) => {
                // Only advance if a real slot was selected (not the clear-sentinel)
                if (slot.id) {
                  setSelectedSlot(slot);
                  goToStep('confirm');
                } else {
                  setSelectedSlot(null);
                }
              }}
            />
          )}

          {currentStep === 'confirm' &&
            selectedService &&
            selectedDoctor &&
            selectedSlot && (
              <StepConfirm
                service={selectedService}
                doctor={selectedDoctor}
                slot={selectedSlot}
                onSuccess={(booking) => {
                  setCompletedBooking(booking);
                  goToStep('success');
                }}
              />
            )}

          {currentStep === 'success' && completedBooking && (
            <StepSuccess booking={completedBooking} />
          )}

          {/* Fallback: missing state — restart */}
          {currentStep !== 'service' &&
            currentStep !== 'success' &&
            (!selectedService || !selectedDoctor) && (
              <div className="text-center py-8">
                <p className="text-sm text-[#A8A29E] mb-4">
                  Phiên đặt lịch đã hết hạn. Vui lòng bắt đầu lại.
                </p>
                <button
                  type="button"
                  onClick={() => goToStep('service')}
                  className="text-sm font-semibold text-[#D4A574] hover:underline"
                >
                  Bắt đầu lại
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <RequireAuth>
      <BookingPageInner />
    </RequireAuth>
  );
}
