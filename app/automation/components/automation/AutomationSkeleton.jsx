'use client';

export default function AutomationSkeleton() {
  return (
    <div className="p-4 sm:p-6 animate-pulse space-y-4">
      <div className="h-24 bg-muted dark:bg-slate-800 rounded-lg" />
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-2 h-96 bg-muted dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}
