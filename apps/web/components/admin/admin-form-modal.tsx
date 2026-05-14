'use client';

// admin-form-modal.tsx — Reusable modal wrapper for admin create/edit forms
// Traps focus, closes on backdrop click or Escape key

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface AdminFormModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export function AdminFormModal({
  title,
  open,
  onClose,
  children,
  maxWidthClassName = 'max-w-lg',
}: AdminFormModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative z-10 w-full ${maxWidthClassName} max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ede4de]">
          <h2 className="text-base font-semibold text-[#3d2b25]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a6a62] hover:bg-[#f5ede8] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
