'use client';

export default function ReportsSkeleton() {
  return (
    <div className="p-4 sm:p-6 animate-pulse space-y-4">
      <div className="h-24 bg-muted dark:bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="h-28 bg-muted dark:bg-slate-800 rounded-lg" />
        ))}
      </div>
      <div className="h-16 bg-muted dark:bg-slate-800 rounded-lg" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-72 bg-muted dark:bg-slate-800 rounded-lg" />
        <div className="h-72 bg-muted dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="h-96 bg-muted dark:bg-slate-800 rounded-lg" />
    </div>
  );
}
