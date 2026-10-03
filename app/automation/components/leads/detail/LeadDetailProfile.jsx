'use client';

import { Phone, Mail, Tag, Clock, User, Sparkles, ChevronDown, MapPin } from 'lucide-react';
import { WhatsAppIcon } from '../../chat/BrandIcons';
import { useState } from 'react';
import { PIPELINE_STAGES } from '../constants';
import { assigneeName, formatSource, formatDate, formatRelative, mapTeamMemberOptions } from '../utils';
import { normalizeLeadStatus } from '@/lib/crm/leadStages';
import FollowupChip from '../FollowupChip';
import { ChannelMark } from './LeadWhatsAppPanel';
import WarningNote from '@/app/components/ui/WarningNote';
import { canOpenWhatsApp, getPrimaryChannel, getChannelSuggestion, getInstagramHandle } from './leadChannels';

// "No phone number yet" + inline add. Leads that arrive from Instagram/Messenger have none.
function AddPhoneRow({ onSave }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!value.trim() || saving || !onSave) return;
    setSaving(true);
    const ok = await onSave({ phone: value.trim() });
    setSaving(false);
    if (ok) {
      setOpen(false);
      setValue('');
    }
  };

  if (!open) {
    return (
      <div className="flex items-center gap-2.5 text-sm">
        <Phone className="w-4 h-4 text-fg-disabled flex-shrink-0" />
        <span className="text-fg-tertiary">No phone number yet</span>
        {onSave && (
          <button type="button" onClick={() => setOpen(true)} className="ml-auto text-xs font-medium text-accent-fg dark:text-accent-fg hover:underline">
            Add
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <div className="flex gap-1.5">
        <input
          autoFocus
          type="tel"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="+91 98765 43210"
          className="flex-1 min-w-0 text-sm px-2.5 py-1.5 border border-line dark:border-slate-700 rounded bg-canvas dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-focus"
        />
        <button type="submit" disabled={!value.trim() || saving} className="px-2.5 text-xs font-medium rounded bg-accent text-white disabled:opacity-40">
          {saving ? '...' : 'Save'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setValue(''); }} className="px-2 text-xs text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled">
          Cancel
        </button>
      </div>
      <p className="text-meta text-fg-tertiary">Include the country code, so WhatsApp and calls work.</p>
    </form>
  );
}

export default function LeadDetailProfile({
  lead,
  intelligence,
  teamMembers,
  showHistory,
  onShowHistoryChange,
  onStatusChange,
  onAssign,
  templates,
  onTemplate,
  onCall,
  onWhatsApp,
  onUpdateContact
}) {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const primaryChannel = getPrimaryChannel(lead, lead.messages || []);
  const showWhatsAppButton = canOpenWhatsApp(lead) || primaryChannel === 'whatsapp';
  const instagramHandle = getInstagramHandle(lead);
  // Concrete, conversation-based suggestion first; the stage-based fallback is hidden when it is the generic default.
  const channelSuggestion = getChannelSuggestion(lead.messages || []);
  const stageAction = intelligence?.nextAction?.action || intelligence?.nextAction?.text;
  const suggestion = channelSuggestion || (stageAction && stageAction !== 'Review and update' ? { tone: 'action', text: stageAction } : null);

  return (
    <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded overflow-hidden">
      <div className="p-5 border-b border-line dark:border-slate-800">
        <div className="w-12 h-12 rounded bg-accent-subtle dark:bg-teal-950/40 text-accent-fg dark:text-accent-fg flex items-center justify-center text-lg font-semibold mb-3">
          {lead.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h2 className="text-base font-semibold text-fg dark:text-slate-50">{lead.name}</h2>
        <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">Lead since {formatDate(lead.receivedAt)}</p>
      </div>

      <div className="p-5 space-y-4 border-b border-line dark:border-slate-800">
        {lead.phone && (
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="w-4 h-4 text-fg-tertiary flex-shrink-0" />
            <span className="text-fg dark:text-slate-200 tabular-nums">{lead.phone}</span>
          </div>
        )}
        {instagramHandle && (
          <div className="flex items-center gap-2.5 text-sm min-w-0">
            <ChannelMark channel="instagram" className="w-4 h-4 flex-shrink-0" />
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-secondary dark:text-fg-disabled hover:text-accent-fg dark:hover:text-accent-fg hover:underline truncate"
            >
              @{instagramHandle}
            </a>
          </div>
        )}
        {!lead.phone && <AddPhoneRow onSave={onUpdateContact} />}
        {lead.email && (
          <div className="flex items-center gap-2.5 text-sm min-w-0">
            <Mail className="w-4 h-4 text-fg-tertiary flex-shrink-0" />
            <span className="text-fg-secondary dark:text-fg-tertiary truncate">{lead.email}</span>
          </div>
        )}
        {lead.serviceInterest && (
          <div className="flex items-start gap-2.5 text-sm">
            <Tag className="w-4 h-4 text-fg-tertiary flex-shrink-0 mt-0.5" />
            <span className="text-fg-secondary dark:text-fg-tertiary">{lead.serviceInterest}</span>
          </div>
        )}
        {(lead.location?.city || lead.location?.country || lead.location?.state) && (
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin className="w-4 h-4 text-fg-tertiary flex-shrink-0 mt-0.5" />
            <span className="text-fg-secondary dark:text-fg-tertiary">
              {[lead.location.city, lead.location.state, lead.location.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-sm">
          <Clock className="w-4 h-4 text-fg-tertiary flex-shrink-0" />
          <span className="text-fg-secondary dark:text-fg-tertiary">
            Last activity {formatRelative(lead.lastContactedAt || lead.updatedAt)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3 border-b border-line dark:border-slate-800">
        <div>
          <label className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary mb-1.5 block">Pipeline stage</label>
          <select
            value={normalizeLeadStatus(lead.status)}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded"
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary mb-1.5 flex items-center gap-1">
            <User className="w-3 h-3" /> Assigned to
          </label>
          <select
            value={lead.assignedTo?._id || ''}
            onChange={(e) => onAssign(e.target.value || null)}
            className="w-full text-sm px-3 py-2 bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded"
          >
            <option value="">Unassigned</option>
            {mapTeamMemberOptions(teamMembers).map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e) => onShowHistoryChange(e.target.checked)}
              className="rounded border-line-strong dark:border-slate-600"
            />
            <span className="text-xs text-fg-tertiary dark:text-fg-tertiary">Show chat history to new assignee</span>
          </label>
        </div>

        <div>
          <label className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary mb-1.5 block">Next follow-up</label>
          <FollowupChip date={lead.nextFollowUpAt} />
        </div>
      </div>

      <div className="p-5 space-y-3 border-b border-line dark:border-slate-800">
        <div>
          <p className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary mb-1">Source</p>
          <p className="text-sm font-medium text-fg dark:text-slate-200">{formatSource(lead.source)}</p>
          {lead.sourceDetails && <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{lead.sourceDetails}</p>}
          {(lead.campaignName || lead.adName) && (
            <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-1">{lead.campaignName || lead.adName}</p>
          )}
        </div>
      </div>

      {suggestion && (
        <div className="p-5 border-b border-line dark:border-slate-800">
          {suggestion.tone === 'warning' ? (
            <WarningNote>{suggestion.text}</WarningNote>
          ) : (
            <div className="p-3 rounded bg-accent-subtle/80 dark:bg-teal-950/20 border border-line dark:border-teal-900">
              <p className="text-xs font-semibold text-accent-fg dark:text-accent-fg flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Suggested action
              </p>
              <p className="text-sm text-fg-secondary dark:text-fg-disabled">{suggestion.text}</p>
            </div>
          )}
        </div>
      )}

      <div className="p-5 space-y-2">
        {lead.phone && (
          <button type="button" onClick={onCall} className="w-full py-2.5 text-sm font-medium rounded border border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-800 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Call lead
          </button>
        )}
        {showWhatsAppButton && (
          <button type="button" onClick={onWhatsApp} className="w-full py-2.5 text-sm font-medium rounded bg-accent text-white hover:bg-accent-hover flex items-center justify-center gap-2">
            <WhatsAppIcon className="w-4 h-4" /> Open WhatsApp
          </button>
        )}
        {templates.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setTemplatesOpen(!templatesOpen)}
              className="w-full py-2.5 text-sm font-medium rounded-md bg-accent dark:bg-slate-800 text-white hover:bg-accent-hover flex items-center justify-center gap-2"
            >
              Quick template <ChevronDown className={`w-4 h-4 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
            </button>
            {templatesOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded shadow-popover max-h-48 overflow-y-auto z-10">
                {templates.map((t) => (
                  <button
                    key={t.id || t.name}
                    type="button"
                    onClick={() => { onTemplate(t); setTemplatesOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-subtle dark:hover:bg-slate-800 border-b border-line dark:border-slate-800 last:border-0"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
