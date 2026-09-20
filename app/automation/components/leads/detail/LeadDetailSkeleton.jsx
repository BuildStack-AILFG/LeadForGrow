'use client';

export default function LeadDetailSkeleton() {
  return (
    <div className="min-h-full bg-[#F8F9FA] dark:bg-slate-950 p-4 sm:p-6 animate-pulse">
      <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded mb-6 max-w-[1400px] mx-auto" />
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="h-[520px] bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-[640px] bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    </div>
  );
}
