'use client';

import { Phone, Mail, Tag, Clock, User, Sparkles, ChevronDown, MessageSquare, MapPin } from 'lucide-react';
import { useState } from 'react';
import { PIPELINE_STAGES } from '../constants';
import { assigneeName, formatSource, formatDate, formatRelative, mapTeamMemberOptions } from '../utils';
import { normalizeLeadStatus } from '@/lib/crm/leadStages';
import FollowupChip from '../FollowupChip';

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
  onWhatsApp
}) {
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center text-lg font-semibold mb-3">
          {lead.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{lead.name}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Lead since {formatDate(lead.receivedAt)}</p>
      </div>

      <div className="p-5 space-y-4 border-b border-slate-100 dark:border-slate-800">
        {lead.phone && (
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-800 dark:text-slate-200 tabular-nums">{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2.5 text-sm min-w-0">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 truncate">{lead.email}</span>
          </div>
        )}
        {lead.serviceInterest && (
          <div className="flex items-start gap-2.5 text-sm">
            <Tag className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-400">{lead.serviceInterest}</span>
          </div>
        )}
        {(lead.location?.city || lead.location?.country || lead.location?.state) && (
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-600 dark:text-slate-400">
              {[lead.location.city, lead.location.state, lead.location.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-sm">
          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-slate-600 dark:text-slate-400">
            Last activity {formatRelative(lead.lastContactedAt || lead.updatedAt)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1.5 block">Pipeline stage</label>
          <select
            value={normalizeLeadStatus(lead.status)}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
            <User className="w-3 h-3" /> Assigned to
          </label>
          <select
            value={lead.assignedTo?._id || ''}
            onChange={(e) => onAssign(e.target.value || null)}
            className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
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
              className="rounded border-slate-300"
            />
            <span className="text-xs text-slate-500">Show chat history to new assignee</span>
          </label>
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1.5 block">Next follow-up</label>
          <FollowupChip date={lead.nextFollowUpAt} />
        </div>
      </div>

      <div className="p-5 space-y-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">Source</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatSource(lead.source)}</p>
          {lead.sourceDetails && <p className="text-xs text-slate-500 mt-0.5">{lead.sourceDetails}</p>}
          {(lead.campaignName || lead.adName) && (
            <p className="text-xs text-slate-500 mt-1">{lead.campaignName || lead.adName}</p>
          )}
        </div>
      </div>

      {intelligence?.nextAction && (
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-lg bg-teal-50/80 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900">
            <p className="text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Suggested action
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{intelligence.nextAction.action || intelligence.nextAction.text}</p>
          </div>
        </div>
      )}

      <div className="p-5 space-y-2">
        <button type="button" onClick={onCall} className="w-full py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" /> Call lead
        </button>
        <button type="button" onClick={onWhatsApp} className="w-full py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" /> Open WhatsApp
        </button>
        {templates.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setTemplatesOpen(!templatesOpen)}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              Quick template <ChevronDown className={`w-4 h-4 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
            </button>
            {templatesOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {templates.map((t) => (
                  <button
                    key={t.id || t.name}
                    type="button"
                    onClick={() => { onTemplate(t); setTemplatesOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
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
