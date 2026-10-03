'use client';

import cx, { focusRing } from './cx';
import Popover from './Popover';

/**
 * DropdownMenu — Popover + role="menu" list with arrow-key navigation.
 *
 *   <DropdownMenu trigger={(p) => <Button {...p} icon={MoreHorizontal} aria-label="More" variant="ghost" />}
 *     items={[{ label: 'Edit', icon: Pencil, onSelect }, { separator: true }, { label: 'Delete', danger: true, onSelect }]} />
 */
export default function DropdownMenu({ trigger, items, align = 'end', width = 200 }) {
  const onKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const els = [...e.currentTarget.querySelectorAll('[role="menuitem"]:not([disabled])')];
    if (!els.length) return;
    e.preventDefault();
    const i = els.indexOf(document.activeElement);
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? els.length - 1 : e.key === 'ArrowDown' ? (i + 1) % els.length : (i - 1 + els.length) % els.length;
    els[next].focus();
  };

  return (
    <Popover trigger={trigger} align={align} width={width}>
      {({ close }) => (
        <div role="menu" onKeyDown={onKeyDown} className="p-1">
          {items.map((item, i) =>
            item.separator ? (
              <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-line" />
            ) : item.heading ? (
              <div key={`h-${i}`} className="px-2 pb-1 pt-2 text-meta font-medium text-fg-tertiary">
                {item.heading}
              </div>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                autoFocus={i === 0}
                onClick={() => {
                  close();
                  item.onSelect?.();
                }}
                className={cx(
                  'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-body',
                  'disabled:cursor-not-allowed disabled:text-fg-disabled',
                  item.danger ? 'text-danger hover:bg-danger-subtle' : 'text-fg hover:bg-muted',
                  focusRing
                )}
              >
                {item.icon && <item.icon className={cx('h-4 w-4 shrink-0', !item.danger && 'text-fg-tertiary')} strokeWidth={1.5} aria-hidden />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && <kbd className="font-sans text-meta text-fg-tertiary">{item.shortcut}</kbd>}
              </button>
            )
          )}
        </div>
      )}
    </Popover>
  );
}
