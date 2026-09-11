'use client';

export default function ContactsSkeleton() {
  return (
    <div className="min-h-full bg-white px-4 sm:px-6 pb-8">
      <div className="max-w-[1600px] mx-auto pt-6">
        <div className="h-8 w-48 rounded-lg bg-[#F2F4F7] animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%] mb-2" />
        <div className="h-4 w-96 max-w-full rounded bg-[#F2F4F7] animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%] mb-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[120px] rounded-xl border border-[#E5E7EB] animate-shimmer bg-gradient-to-r from-[#F9FAFB] via-white to-[#F9FAFB] bg-[length:200%_100%]" />
          ))}
        </div>

        <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="h-11 bg-[#F9FAFB] border-b border-[#E5E7EB]" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[#F2F4F7]">
              <div className="w-4 h-4 rounded bg-[#F2F4F7] animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
              <div className="w-9 h-9 rounded-full bg-[#F2F4F7] animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-[#F2F4F7] animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
                <div className="h-2.5 w-24 rounded bg-[#F2F4F7] animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
              </div>
              <div className="h-6 w-20 rounded-full bg-[#F2F4F7] animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
