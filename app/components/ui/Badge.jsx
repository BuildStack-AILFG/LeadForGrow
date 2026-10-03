import cx from './cx';

/**
 * Badge / Chip — small status label. Colour always paired with text.
 * tone: neutral · accent · success · warning · danger · info
 * `dot` shows a leading dot (status chips); `stageColor` overrides the dot
 * with a pipeline stage colour (e.g. 'var(--stage-3)' or a stage's own hex).
 * `count` style = tertiary on muted, for nav/tab counts.
 */
const TONES = {
  neutral: 'bg-muted text-fg-secondary',
  accent: 'bg-accent-subtle text-accent-fg',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
  info: 'bg-info-subtle text-info',
};

const DOTS = {
  neutral: 'bg-fg-tertiary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export default function Badge({ tone = 'neutral', dot = false, stageColor, count = false, className, children, ...props }) {
  if (count) {
    return (
      <span
        className={cx('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-muted px-1 text-[11px] font-medium leading-none text-fg-tertiary tabular', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cx(
        'inline-flex h-5 max-w-full items-center gap-1.5 whitespace-nowrap rounded-sm px-1.5 text-meta font-medium',
        stageColor ? 'bg-subtle text-fg-secondary' : TONES[tone],
        className
      )}
      {...props}
    >
      {(dot || stageColor) && (
        <span
          aria-hidden
          className={cx('h-1.5 w-1.5 shrink-0 rounded-full', !stageColor && DOTS[tone])}
          style={stageColor ? { backgroundColor: stageColor } : undefined}
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}
