import cx from './cx';

/**
 * Avatar — image or initials. Initials sit on a neutral muted disc (no
 * rainbow palette; DESIGN_BRIEF §4). size in px: 20 (table owner), 24, 32, 40.
 */
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function Avatar({ name, src, size = 24, className }) {
  const style = { width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.4)) };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name || ''} style={style} className={cx('shrink-0 rounded-full object-cover', className)} />;
  }
  return (
    <span
      aria-hidden={!name}
      title={name}
      style={style}
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-fg-secondary', className)}
    >
      {initials(name)}
    </span>
  );
}
