'use client';

function Block({ className = '' }) {
  return <div className={`lfg-skeleton rounded-none ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="min-h-full bg-[#F8F9FA]">
      <div className="px-4 sm:px-6 pb-12 max-w-[1560px] mx-auto">
        <div className="pt-5 pb-4 mb-2">
          <div className="flex items-center justify-between gap-4 pb-4">
            <div className="lfg-skeleton h-8 w-40 rounded-none" />
            <div className="flex items-center gap-2.5">
              <div className="lfg-skeleton h-9 w-9 rounded-none" />
              <div className="lfg-skeleton h-9 w-[220px] rounded-none" />
              <div className="lfg-skeleton h-9 w-20 rounded-none" />
            </div>
          </div>
          <div className="border-t border-[#E5E7EB]" />
          <div className="flex items-center justify-between gap-3 pt-4">
            <div className="flex gap-2.5">
              <div className="lfg-skeleton h-9 w-24 rounded-none" />
              <div className="lfg-skeleton h-9 w-36 rounded-none" />
            </div>
            <div className="flex items-center gap-3">
              <div className="lfg-skeleton h-4 w-32 rounded-none" />
              <div className="lfg-skeleton h-9 w-28 rounded-none" />
              <div className="lfg-skeleton h-9 w-28 rounded-none" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Block key={i} className="h-[96px] border border-[#E9ECEF]" />
              ))}
              <Block className="col-span-2 sm:col-span-3 xl:col-span-5 h-[300px] border border-[#E9ECEF]" />
            </div>
            <Block className="lg:col-span-5 xl:col-span-4 min-h-[420px] border border-[#E9ECEF]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Block className="h-[280px] border border-[#E9ECEF]" />
            <Block className="h-[280px] border border-[#E9ECEF]" />
            <Block className="h-[280px] border border-[#E9ECEF]" />
          </div>
        </div>
      </div>
    </div>
  );
}
