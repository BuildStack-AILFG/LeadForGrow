'use client';

import { Plus, Save } from 'lucide-react';
import Button from '@/app/components/ui/Button';

/**
 * Message templates header. WhatsApp (Meta) templates are one tab away via
 * TemplateChannelTabs above, so no extra cross-links here.
 */
export default function TemplatesHeader({ stats, saving, onSave, onCreate }) {
  return (
    <header className="border-b border-line bg-canvas">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-fg">Message templates</h1>
          <p className="mt-0.5 text-body text-fg-secondary">
            {stats.total} {stats.total === 1 ? 'template' : 'templates'} · {stats.autoActive} automatic flows on
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={Plus} onClick={onCreate}>
            New template
          </Button>
          <Button variant="primary" icon={Save} onClick={onSave} loading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </header>
  );
}
