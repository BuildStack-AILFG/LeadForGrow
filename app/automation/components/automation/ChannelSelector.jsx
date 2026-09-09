'use client';

import { Mail, Smartphone, Zap } from 'lucide-react';
import { CHANNEL_OPTIONS } from './constants';
import HelpHint from '@/app/components/ui/HelpHint';

const ICONS = { email: Mail, whatsapp: Smartphone, both: Zap };

export default function ChannelSelector({ value, onChange }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
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
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
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
