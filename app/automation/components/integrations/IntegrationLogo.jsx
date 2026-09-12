'use client';

import { useState } from 'react';
import { Slack, Linkedin, Webhook } from 'lucide-react';
import { BRAND_ICONS, EXTRA_ICONS } from './brandIcons';
import { COLOR_MAP } from './constants';

// Brands with no path-data logo available, drawn as a lucide brand/line icon
// tinted to the brand colour.
const LUCIDE_ICONS = {
  slack: { Comp: Slack, color: '#4A154B' },
  'linkedin-ads': { Comp: Linkedin, color: '#0A66C2' },
  webhooks: { Comp: Webhook, color: '#64748B' },
};

function Chip({ size, children }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

function InitialsTile({ integration, size }) {
  const colorClass = COLOR_MAP[integration.color] || COLOR_MAP.blue;
  return (
    <div
      className={`rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorClass}`}
      style={{ width: size, height: size }}
    >
      {integration.initials}
    </div>
  );
}

// Tries an official logo dropped at /public/logos/<id>.svg (or .png). If the
// file isn't there yet, it falls back to the initials tile — so you can add a
// brand's real logo any time just by dropping the file, no code change needed.
function LocalLogo({ integration, size }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <InitialsTile integration={integration} size={size} />;
  return (
    <Chip size={size}>
      {/* max-based sizing so wide wordmark logos (Interakt, Pabbly) use the
          chip's width while square marks stay centered — never distorted. */}
      <img
        src={`/logos/${integration.id}.svg`}
        alt={integration.name}
        style={{ maxWidth: '84%', maxHeight: '76%', objectFit: 'contain' }}
        onError={() => setFailed(true)}
      />
    </Chip>
  );
}

/**
 * Renders a real brand logo when we have one; otherwise a branded initials tile.
 * Sources, in order: simple-icons (colored path) -> inlined FA path -> lucide
 * brand icon -> a local /logos/<id>.svg file -> initials fallback. The chip
 * stays white in both themes because brand logos are drawn for a light ground.
 */
export default function IntegrationLogo({ integration, size = 44 }) {
  const glyph = Math.round(size * 0.55);
  const si = BRAND_ICONS[integration.id];
  const extra = EXTRA_ICONS[integration.id];
  const lucide = LUCIDE_ICONS[integration.id];

  if (si) {
    return (
      <Chip size={size}>
        <svg role="img" viewBox="0 0 24 24" width={glyph} height={glyph} fill={`#${si.hex}`} aria-label={si.title}>
          <title>{si.title}</title>
          <path d={si.path} />
        </svg>
      </Chip>
    );
  }

  if (extra) {
    return (
      <Chip size={size}>
        <svg role="img" viewBox={extra.viewBox} width={glyph} height={glyph} fill={`#${extra.hex}`} aria-label={extra.title}>
          <title>{extra.title}</title>
          <path d={extra.path} />
        </svg>
      </Chip>
    );
  }

  if (lucide) {
    const { Comp, color } = lucide;
    return (
      <Chip size={size}>
        <Comp width={glyph} height={glyph} color={color} strokeWidth={2} />
      </Chip>
    );
  }

  return <LocalLogo integration={integration} size={size} />;
}
