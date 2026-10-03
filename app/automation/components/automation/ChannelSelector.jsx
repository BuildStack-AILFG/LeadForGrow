'use client';

import { Mail, Smartphone, Zap } from 'lucide-react';
import { CHANNEL_OPTIONS } from './constants';
import HelpHint from '@/app/components/ui/HelpHint';

const ICONS = { email: Mail, whatsapp: Smartphone, both: Zap };

export default function ChannelSelector({ value, onChange }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-2">
        Channel
        <HelpHint text="Where this automation sends its message. 'Both' sends WhatsApp when available and falls back to email." />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {CHANNEL_OPTIONS.map((ch) => {
          const Icon = ICONS[ch.id];
          const active = value === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onChange(ch.id)}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                active
                  ? 'border-accent bg-accent-subtle text-accent-fg dark:bg-teal-950/30 dark:text-accent-fg dark:border-teal-800'
                  : 'border-line dark:border-slate-700 text-fg-tertiary dark:text-fg-tertiary hover:border-line-strong dark:hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {ch.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
