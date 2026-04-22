// loading.tsx — Global route-level loading UI (shown by Next.js during page transitions)
// Uses animate-pulse skeleton pattern; K-beauty color palette

export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 bg-[#F5F0E8]">
      {/* Spinner ring */}
      <div
        className="w-10 h-10 rounded-full border-4 border-[#D4A574]/20 border-t-[#D4A574] animate-spin mb-6"
        role="status"
        aria-label="Đang tải"
      />

      {/* Skeleton text lines */}
      <div className="w-48 h-3 rounded-full bg-[#D4A574]/20 animate-pulse mb-3" />
      <div className="w-32 h-2.5 rounded-full bg-[#D4A574]/10 animate-pulse" />
    </div>
  );
}
