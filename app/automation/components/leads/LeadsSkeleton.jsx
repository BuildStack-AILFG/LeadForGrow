'use client';

export default function LeadsSkeleton() {
  return (
    <div className="p-4 sm:p-6 animate-pulse space-y-4">
      <div className="h-20 bg-muted dark:bg-slate-800 rounded-lg" />
      <div className="h-24 bg-muted dark:bg-slate-800 rounded-lg" />
      <div className="h-96 bg-muted dark:bg-slate-800 rounded-lg" />
    </div>
  );
}
