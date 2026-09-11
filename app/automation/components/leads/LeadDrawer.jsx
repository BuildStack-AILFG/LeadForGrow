'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Phone,
  MessageSquare,
  ExternalLink,
  Clock,
  User,
  Tag,
  Sparkles,
  ArrowRightLeft,
  MapPin,
  Share2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';
import StatusBadge from './StatusBadge';
import FollowupChip from './FollowupChip';
import LeadActivityTab from './detail/LeadDetailTabs';
import LeadScoreBadge from './LeadScoreBadge';
import PageLoader from '../PageLoader';
import { assigneeName, formatSource, formatRelative, formatDate, mapTeamMemberOptions, resolveAssignedToId, resolveStageSelectValue, STAGE_SELECT_OPTIONS } from './utils';
import { normalizeLeadStatus } from '@/lib/crm/leadStages';
import { computeLeadIntelligence } from '@/lib/leadIntelligence';
import ConvertLeadDialog from './ConvertLeadDialog';
import ShareLeadModal, { resolveLeadLocation } from './ShareLeadModal';

export default function LeadDrawer({
  leadId,
  leadSnapshot,
  onClose,
  onStatusChange,
  onAssign,
  teamMembers,
  onCall,
  onConvertLead,
}) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [note, setNote] = useState('');
  const [showConvert, setShowConvert] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [locationForm, setLocationForm] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [savingLocation, setSavingLocation] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    setShowConvert(false);
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;
    setMessagesLoading(true);
    authFetch(`/api/automation/inbox/messages?leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setMessages(d.data || []); })
      .catch(() => {})
      .finally(() => setMessagesLoading(false));
  }, [leadId]);

  const lastMessage =
    [...messages].reverse().find((m) => m.direction === 'incoming')?.content?.body ||
    messages[messages.length - 1]?.content?.body ||
    lead?.message ||
    '';

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    authFetch(`/api/automation/leads/${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setLead(data.data);
          setLocationForm({
            street: data.data.location?.street || '',
            city: data.data.location?.city || '',
            state: data.data.location?.state || '',
            postalCode: data.data.location?.postalCode || '',
            country: data.data.location?.country || '',
          });
        } else toast.error('Failed to load lead');
      })
      .catch(() => toast.error('Failed to load lead'))
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => {
    if (!leadSnapshot || !leadId || leadSnapshot._id !== leadId) return;
    setLead((prev) => (prev ? { ...prev, ...leadSnapshot } : leadSnapshot));
  }, [leadSnapshot, leadId]);

  const handleAssign = async (assigneeId) => {
    const updated = await onAssign(leadId, assigneeId || null);
    if (updated) setLead((prev) => ({ ...prev, ...updated }));
  };

  const handleStageChange = async (newStatus) => {
    const prevStatus = lead?.status;
    const updated = await onStatusChange(leadId, newStatus);
    if (updated) {
      setLead((prev) => ({ ...prev, ...updated }));
    } else if (prevStatus != null) {
      setLead((prev) => (prev ? { ...prev, status: prevStatus } : prev));
    }
  };

  const saveLocation = async () => {
    setSavingLocation(true);
    try {
      const userId = getUserId();
      const res = await authFetch(`/api/automation/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationForm, performedBy: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setLead((prev) => ({ ...prev, ...data.data }));
        toast.success('Location saved');
      } else {
        toast.error(data.error || 'Failed to save location');
      }
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSavingLocation(false);
    }
  };

  if (!leadId) return null;

  const intelligence = lead ? computeLeadIntelligence(lead).intelligence : null;
  const activities = lead?.activities || [];
  const tasks = lead?.tasks || [];

  const addNote = async () => {
    if (!note.trim()) return;
    const userId = getUserId();
    const res = await authFetch(`/api/automation/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note.trim(), performedBy: userId })
    });
    const data = await res.json();
    if (data.success) {
      setNote('');
      toast.success('Note added');
      const refetch = await authFetch(`/api/automation/leads/${leadId}`);
      const refreshed = await refetch.json();
      if (refreshed.success) setLead(refreshed.data);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[60]" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[440px] lg:w-[480px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 z-[70] flex flex-col shadow-2xl">
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lead Details</h2>
            <div className="flex items-center gap-1">
              <Link
                href={`/automation/leads/${leadId}`}
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Full page"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button type="button" onClick={onClose} className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1"><PageLoader label="Loading lead…" height="100%" /></div>
          ) : lead ? (
            <>
              <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{lead.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{lead.phone || lead.email || 'No contact'}</p>
                  </div>
                  <LeadScoreBadge intelligence={intelligence} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <StatusBadge status={lead.status} />
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {formatSource(lead.source)}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => onCall(lead)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </button>
                  <Link href={`/automation/chat?leadId=${leadId}`} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </Link>
                  <button type="button" onClick={() => setShowShare(true)} title="Share this lead on WhatsApp" className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
                {lead.status !== 'converted' && (
                  <button
                    type="button"
                    onClick={() => setShowConvert(true)}
                    className={`w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg border ${
                      normalizeLeadStatus(lead.status) === 'qualified'
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    {normalizeLeadStatus(lead.status) === 'qualified' ? 'Convert to Deal' : 'Convert Lead'}
                  </button>
                )}
              </div>

              <div className="flex border-b border-slate-100 dark:border-slate-800 px-2">
                {['overview', 'messages', 'activity', 'notes'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-3 py-2.5 text-xs font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {tab === 'overview' && (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Assigned</p>
                        <select
                          value={resolveAssignedToId(lead)}
                          onChange={(e) => handleAssign(e.target.value || null)}
                          className="w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0"
                        >
                          <option value="">Unassigned</option>
                          {mapTeamMemberOptions(teamMembers).map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Follow-up</p>
                        <FollowupChip date={lead.nextFollowUpAt} />
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-500 mb-1">Stage</p>
                        <select
                          value={resolveStageSelectValue(lead.status)}
                          onChange={(e) => handleStageChange(e.target.value)}
                          className="w-full text-sm font-medium bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1"
                        >
                          {STAGE_SELECT_OPTIONS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-500 mb-1">Created</p>
                        <p className="text-sm font-medium">{formatDate(lead.receivedAt)}</p>
                      </div>
                    </div>

                    {lead.serviceInterest && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Interest</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{lead.serviceInterest}</p>
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-2.5">
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Location
                      </p>
                      {resolveLeadLocation(lead) && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-2 break-words">
                          {resolveLeadLocation(lead)}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={locationForm.country}
                          onChange={(e) => setLocationForm((prev) => ({ ...prev, country: e.target.value }))}
                          placeholder="Country"
                          className="col-span-2 text-sm px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={locationForm.city}
                          onChange={(e) => setLocationForm((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="City"
                          className="text-sm px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={locationForm.state}
                          onChange={(e) => setLocationForm((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                          className="text-sm px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={locationForm.postalCode}
                          onChange={(e) => setLocationForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="Postal code"
                          className="text-sm px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={locationForm.street}
                          onChange={(e) => setLocationForm((prev) => ({ ...prev, street: e.target.value }))}
                          placeholder="Street"
                          className="text-sm px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={saveLocation}
                        disabled={savingLocation}
                        className="w-full py-2 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {savingLocation ? 'Saving…' : 'Save location'}
                      </button>
                    </div>

                    {intelligence && (
                      <div className="p-3 rounded-lg border border-teal-100 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20">
                        <p className="text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1 mb-1">
                          <Sparkles className="w-3.5 h-3.5" /> Suggested next step
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{intelligence.nextAction?.text || 'Review and follow up'}</p>
                      </div>
                    )}

                    {(lead.campaignName || lead.adName) && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Attribution</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{lead.campaignName || lead.adName}</p>
                      </div>
                    )}
                  </>
                )}

                {tab === 'messages' && (
                  <div className="space-y-2">
                    {messagesLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : messages.length ? (
                      messages.map((m, i) => {
                        const outgoing = m.direction === 'outgoing';
                        const body = m.content?.body || m.content?.caption || `[${m.type || 'media'}]`;
                        const time = m.timestamp
                          ? new Date(m.timestamp).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '';
                        return (
                          <div key={m._id || i} className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                              outgoing
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-slate-800 dark:text-slate-100 rounded-tr-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                            }`}>
                              <p className="whitespace-pre-wrap break-words leading-snug">{body}</p>
                              <p className="text-[10px] text-slate-400 mt-1 text-right">{time}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">No messages yet with this lead.</p>
                    )}
                  </div>
                )}

                {tab === 'activity' && (
                  <LeadActivityTab activities={activities} expandWorkflows />
                )}

                {tab === 'notes' && (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                        onKeyDown={(e) => e.key === 'Enter' && addNote()}
                      />
                      <button type="button" onClick={addNote} className="px-3 py-2 text-xs font-medium bg-teal-600 text-white rounded-lg">
                        Add
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {(lead.notes || []).map((n, i) => (
                        <li key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-sm">
                          <p className="text-slate-700 dark:text-slate-300">{n.text}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{formatRelative(n.addedAt)}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </>
          ) : null}

          {lead && showShare && (
            <ShareLeadModal lead={lead} shareMessage={lastMessage} onClose={() => setShowShare(false)} />
          )}

          {lead && showConvert && (
            <ConvertLeadDialog
              variant="drawer"
              open={showConvert}
              lead={lead}
              teamMembers={teamMembers}
              saving={converting}
              onClose={() => setShowConvert(false)}
              onConfirm={async (form) => {
                if (!onConvertLead) return;
                setConverting(true);
                try {
                  const ok = await onConvertLead(form, leadId);
                  if (ok) {
                    setShowConvert(false);
                    onClose();
                  }
                } finally {
                  setConverting(false);
                }
              }}
            />
          )}
        </div>
      </aside>
    </>
  );
}
