'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { apiUpload } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media-url';

interface AdminGalleryManagerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

export function AdminGalleryManager({
  value,
  onChange,
  label = 'Thư viện ảnh',
}: AdminGalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    if (!files.length) return;

    setUploading(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of files) {
        const result = await apiUpload(file);
        urls.push(result.url);
      }
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải ảnh thất bại');
      window.setTimeout(() => setError(''), 5000);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-wider text-[#6b4c41]">
        {label} ({value.length})
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-[#f5ede8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMediaUrl(url)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow-sm hover:bg-white"
              title="Xóa ảnh"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#c9b8b0] bg-[#fdfaf8] text-[#8a6a62] transition-colors hover:bg-[#f5ede8] disabled:cursor-wait"
          title="Thêm ảnh"
        >
          {uploading ? <Loader2 className="animate-spin text-[#B76E79]" size={22} /> : <ImagePlus size={22} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
