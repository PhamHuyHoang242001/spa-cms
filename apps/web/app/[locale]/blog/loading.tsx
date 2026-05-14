// blog/loading.tsx — Skeleton shown while /blog page fetches articles

export default function BlogLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Header skeleton */}
      <div className="mb-10 text-center flex flex-col items-center gap-3">
        <div className="w-40 h-7 rounded-full bg-[#3d2c2c]/10 animate-pulse" />
        <div className="w-72 h-3 rounded-full bg-[#6b4c41]/10 animate-pulse" />
      </div>

      {/* Article card grid skeleton — 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
            aria-hidden="true"
          >
            {/* Cover image placeholder */}
            <div className="h-44 w-full bg-[#e8ddd4] animate-pulse" />
            <div className="p-4 space-y-2.5">
              {/* Tags */}
              <div className="flex gap-1.5">
                <div className="w-12 h-2 rounded-full bg-[#B76E79]/20 animate-pulse" />
                <div className="w-10 h-2 rounded-full bg-[#B76E79]/10 animate-pulse" />
              </div>
              {/* Title */}
              <div className="w-full h-3.5 rounded-full bg-[#3d2c2c]/10 animate-pulse" />
              <div className="w-4/5 h-3.5 rounded-full bg-[#3d2c2c]/8 animate-pulse" />
              {/* Excerpt */}
              <div className="w-full h-2.5 rounded-full bg-[#6b4c41]/8 animate-pulse" />
              <div className="w-3/4 h-2.5 rounded-full bg-[#6b4c41]/6 animate-pulse" />
              {/* Date */}
              <div className="w-20 h-2 rounded-full bg-[#a08070]/15 animate-pulse mt-1" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
