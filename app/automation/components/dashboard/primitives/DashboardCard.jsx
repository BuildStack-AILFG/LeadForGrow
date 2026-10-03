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
        'border border-line/80 dark:border-slate-800',
        'rounded-lg',
        hover ? 'transition-shadow hover:shadow-popover' : '',
        padding,
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
