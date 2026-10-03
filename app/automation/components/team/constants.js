export const AVATAR_PALETTE = [
  { bg: 'bg-accent-subtle dark:bg-teal-950/50', text: 'text-accent-fg dark:text-accent-fg', ring: 'ring-focus/60', bar: 'bg-accent' },
  { bg: 'bg-accent-subtle dark:bg-violet-950/50', text: 'text-accent-fg dark:text-accent-fg', ring: 'ring-focus/60', bar: 'bg-accent' },
  { bg: 'bg-accent-subtle dark:bg-emerald-950/50', text: 'text-accent-fg dark:text-accent-fg', ring: 'ring-focus/60', bar: 'bg-accent' },
  { bg: 'bg-warning-subtle dark:bg-amber-950/50', text: 'text-warning dark:text-amber-400', ring: 'ring-amber-200/60', bar: 'bg-warning' },
  { bg: 'bg-danger-subtle dark:bg-rose-950/50', text: 'text-danger dark:text-rose-400', ring: 'ring-rose-200/60', bar: 'bg-danger' },
  { bg: 'bg-accent-subtle dark:bg-cyan-950/50', text: 'text-accent-fg dark:text-accent-fg', ring: 'ring-focus/60', bar: 'bg-accent' }
];

export const STRATEGIES = [
  {
    id: 'solo',
    title: 'Only me (Solo)',
    description: 'Every new lead assigns to you. Best when you handle sales personally.',
    icon: 'UserCircle',
    accent: 'blue',
    selectedClass: 'border-accent/60 bg-accent-subtle/80 dark:bg-teal-950/20',
    iconClass: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg'
  },
  {
    id: 'round-robin',
    title: 'Round robin (Team)',
    description: 'Distribute leads evenly across active team members automatically.',
    icon: 'RefreshCw',
    accent: 'violet',
    selectedClass: 'border-accent/60 bg-accent-subtle/80 dark:bg-violet-950/20',
    iconClass: 'bg-accent-subtle text-accent-fg dark:bg-violet-950/40 dark:text-accent-fg'
  }
];

export function memberName(member) {
  const u = member.userId;
  if (u?.firstName) return [u.firstName, u.lastName].filter(Boolean).join(' ');
  if (member.role === 'owner') return 'Business Owner';
  return u?.email || 'Team member';
}

export function memberInitials(member) {
  const name = memberName(member);
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export function avatarColor(index) {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}
