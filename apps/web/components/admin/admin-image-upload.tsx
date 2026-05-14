'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { apiUpload } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media-url';

interface AdminImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export function AdminImageUpload({ value, onChange, label }: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const result = await apiUpload(file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải ảnh thất bại');
      window.setTimeout(() => setError(''), 5000);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-[#6b4c41]">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#c9b8b0] bg-[#fdfaf8] text-sm text-[#8a6a62] transition-colors hover:bg-[#f5ede8] disabled:cursor-wait"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(value)}
            alt={label ?? 'Uploaded image'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <ImagePlus size={24} />
            Click để tải ảnh
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[#B76E79]">
            <Loader2 className="animate-spin" size={24} />
          </span>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          <X size={13} /> Xóa ảnh
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
