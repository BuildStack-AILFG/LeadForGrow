'use client';

export default function DealsSkeleton() {
  return (
    <div className="min-h-full bg-white dark:bg-slate-900 px-4 sm:px-6 pb-8">
      <div className="max-w-[1600px] mx-auto pt-6">
        <div className="h-8 w-32 rounded-lg bg-[#F2F4F7] dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%] mb-2" />
        <div className="h-4 w-80 max-w-full rounded bg-[#F2F4F7] dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%] mb-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[120px] rounded-xl border border-[#E5E7EB] dark:border-slate-700 animate-shimmer bg-gradient-to-r from-[#F9FAFB] via-white to-[#F9FAFB] bg-[length:200%_100%]" />
          ))}
        </div>

        <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
          <div className="h-11 bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[#F2F4F7] dark:border-slate-700">
              <div className="w-7 h-7 rounded-full bg-[#F2F4F7] dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-[#F2F4F7] dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
                <div className="h-2.5 w-24 rounded bg-[#F2F4F7] dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
              </div>
              <div className="h-6 w-20 rounded-full bg-[#F2F4F7] dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
              <div className="h-3 w-16 rounded bg-[#F2F4F7] dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F2F4F7] via-white to-[#F2F4F7] bg-[length:200%_100%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
