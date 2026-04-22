// services/loading.tsx — Skeleton grid shown while /services page fetches data

export default function ServicesLoading() {
  return (
    <div className="bg-[#F5F0E8] min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center mb-12 flex flex-col items-center gap-3">
          <div className="w-16 h-2.5 rounded-full bg-[#D4A574]/30 animate-pulse" />
          <div className="w-48 h-6 rounded-full bg-[#1C1917]/10 animate-pulse" />
          <div className="w-72 h-3 rounded-full bg-[#A8A29E]/20 animate-pulse" />
        </div>

        {/* Card grid skeleton — 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
              aria-hidden="true"
            >
              {/* Image placeholder */}
              <div className="h-44 w-full bg-[#E5DDD5] animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="w-3/4 h-3.5 rounded-full bg-[#1C1917]/10 animate-pulse" />
                <div className="w-full h-2.5 rounded-full bg-[#A8A29E]/15 animate-pulse" />
                <div className="w-2/3 h-2.5 rounded-full bg-[#A8A29E]/10 animate-pulse" />
                <div className="flex justify-between mt-2">
                  <div className="w-16 h-3 rounded-full bg-[#D4A574]/25 animate-pulse" />
                  <div className="w-12 h-3 rounded-full bg-[#D4A574]/20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
