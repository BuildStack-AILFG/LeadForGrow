'use client';

export default function TasksSkeleton() {
  return (
    <div className="p-4 sm:p-6 animate-pulse space-y-4">
      <div className="h-20 bg-muted dark:bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-muted dark:bg-slate-800 rounded-lg" />
        ))}
      </div>
      <div className="h-12 bg-muted dark:bg-slate-800 rounded-lg" />
      <div className="h-96 bg-muted dark:bg-slate-800 rounded-lg" />
    </div>
  );
}
