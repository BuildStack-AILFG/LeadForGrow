'use client';

export default function DashboardCard({
  children,
  className = '',
  padding = 'p-5',
  hover = false,
  ...props
}) {
  return (
    <div
      className={[
        'bg-canvas dark:bg-slate-900',
        'border border-line',
        'rounded-lg',
        hover ? 'transition-colors hover:border-line-strong' : '',
        padding,
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
