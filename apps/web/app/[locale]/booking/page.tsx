'use client';

// booking/page.tsx — Multi-step booking flow container
// Step state managed via URL searchParams: service → doctor → slot → confirm → success

import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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

function StepIndicator({ current }: { current: BookingStep }) {
  const t = useTranslations('booking');
  const visibleSteps = STEP_ORDER.slice(0, 4); // exclude 'success'
  const currentIdx = STEP_ORDER.indexOf(current);

  const STEP_LABELS: Record<BookingStep, string> = {
    service: t('stepService'),
    doctor: t('stepDoctor'),
    slot: t('stepSlot'),
    confirm: t('stepConfirm'),
    success: '',
  };

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
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawStep = (searchParams.get('step') ?? 'service') as BookingStep;
  const currentStep = STEP_ORDER.includes(rawStep) ? rawStep : 'service';
  const prefillSlug = searchParams.get('service') ?? undefined;

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

  const canGoBack = currentStep !== 'service' && currentStep !== 'success';

  const STEP_LABELS: Record<BookingStep, string> = {
    service: t('stepService'),
    doctor: t('stepDoctor'),
    slot: t('stepSlot'),
    confirm: t('stepConfirm'),
    success: '',
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Page title */}
        <div className="text-center mb-6">
          <p className="text-[#D4A574] text-xs font-semibold tracking-[0.25em] uppercase mb-2">
            {t('title')}
          </p>
          <h1
            className="text-3xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-noto-serif-kr, serif)' }}
          >
            {t('title')}
          </h1>
        </div>

        {currentStep !== 'success' && <StepIndicator current={currentStep} />}

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          {canGoBack && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-[#A8A29E] hover:text-[#1C1917] mb-5 transition-colors"
            >
              <ChevronLeft size={16} />
              {t('back')}
            </button>
          )}

          {currentStep !== 'success' && (
            <h2 className="text-base font-semibold text-[#1C1917] mb-5">
              {STEP_LABELS[currentStep]}
            </h2>
          )}

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
                  {t('errorDefault')}
                </p>
                <button
                  type="button"
                  onClick={() => goToStep('service')}
                  className="text-sm font-semibold text-[#D4A574] hover:underline"
                >
                  {t('back')}
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
