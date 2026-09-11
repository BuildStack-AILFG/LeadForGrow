'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Send, Mail, MessageCircle, RefreshCw, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import AudiencePicker from './AudiencePicker';
import VariableMapping from './VariableMapping';
import BroadcastDetail from './BroadcastDetail';
import QualityRatingBanner from './QualityRatingBanner';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import PageLoader from '../components/PageLoader';

const STATUS_STYLES = {
  draft: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-teal-100 text-teal-700',
  sending: 'bg-violet-100 text-violet-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
};

const emptyDraft = {
  name: '',
  channel: 'whatsapp',
  templateName: '',
  templateLanguage: '',
  headerMediaUrl: '',
  subject: '',
  body: '',
  audience: { type: 'manual', leadIds: [], engagementDays: 0 },
  variableMapping: [],
};

export default function BroadcastsPage() {
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState([]);
  const [approvedTemplates, setApprovedTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [audienceCount, setAudienceCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [samplePreview, setSamplePreview] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/automation/broadcasts');
      const data = await res.json();
      if (data.success) setBroadcasts(data.data);
    } catch {
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApprovedTemplates = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/whatsapp-templates?status=APPROVED');
      const data = await res.json();
      if (data.success) setApprovedTemplates(data.data);
    } catch {
      /* silent */
    }
  }, []);

  const fetchEmailTemplates = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/templates');
      const data = await res.json();
      if (data.success) {
        setEmailTemplates((data.manual || []).filter((t) => t.channel === 'email' && t.enabled));
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
    fetchApprovedTemplates();
    fetchEmailTemplates();
  }, [fetchBroadcasts, fetchApprovedTemplates, fetchEmailTemplates]);

  const selectedTemplate = approvedTemplates.find(
    (t) => t.name === draft.templateName && t.language === draft.templateLanguage
  );

  const previewCount = useCallback(async (audience, channel) => {
    setCountLoading(true);
    try {
      const res = await authFetch('/api/automation/broadcasts/preview-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, channel }),
      });
      const data = await res.json();
      if (data.success) setAudienceCount(data);
    } finally {
      setCountLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showCreate) return;
    const t = setTimeout(() => previewCount(draft.audience, draft.channel), 400);
    return () => clearTimeout(t);
  }, [showCreate, draft.audience, draft.channel, previewCount]);

  useEffect(() => {
    if (!showCreate) return;
    const t = setTimeout(async () => {
      try {
        const bodyText = selectedTemplate?.components?.find((c) => c.type === 'BODY')?.text || draft.body;
        const res = await authFetch('/api/automation/broadcasts/preview-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audience: draft.audience,
            channel: draft.channel,
            content: {
              body: bodyText,
              subject: draft.subject,
              whatsappTemplate: bodyText,
              whatsappTemplateName: draft.templateName,
              whatsappTemplateLanguage: draft.templateLanguage,
              variableMapping: draft.variableMapping,
            },
          }),
        });
        const data = await res.json();
        if (data.success) setSamplePreview(data.sample);
      } catch { /* silent */ }
    }, 500);
    return () => clearTimeout(t);
  }, [showCreate, draft.audience, draft.channel, draft.body, draft.subject, draft.templateName, draft.templateLanguage, draft.variableMapping, selectedTemplate]);

  const isWhatsApp = draft.channel === 'whatsapp' || draft.channel === 'both';
  const isEmail = draft.channel === 'email' || draft.channel === 'both';

  const canSend = useMemo(() => {
    if (!draft.name.trim()) return false;
    if (isWhatsApp && !draft.templateName) return false;
    if (audienceCount?.count === 0) return false;
    // If the selected template has a media header, require a URL for the send
    const header = selectedTemplate?.components?.find((c) => c.type === 'HEADER');
    if (header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format) && !draft.headerMediaUrl?.trim()) {
      return false;
    }
    return true;
  }, [draft, isWhatsApp, audienceCount, selectedTemplate]);

  const createBroadcast = async (testSend = false) => {
    if (!draft.name.trim()) return toast.error('Campaign name required');
    if (isWhatsApp && !draft.templateName) return toast.error('Select an approved WhatsApp template');
    if (!testSend && audienceCount?.count === 0) return toast.error('Audience is empty');

    // Fix the previously-broken test send: ask user for a real destination
    let testRecipients = [];
    if (testSend) {
      if (isWhatsApp) {
        const phone = prompt('Enter a phone number to send the test WhatsApp to (with country code, e.g. 919876543210):');
        if (!phone?.trim()) return;
        testRecipients.push({ name: 'Test recipient', phone: phone.trim().replace(/\D/g, ''), email: '' });
      }
      if (isEmail) {
        const email = prompt('Enter an email address to send the test email to:');
        if (!email?.trim()) return;
        const existing = testRecipients[0];
        if (existing) existing.email = email.trim();
        else testRecipients.push({ name: 'Test recipient', email: email.trim(), phone: '' });
      }
    }

    setSaving(true);
    try {
      const bodyText = selectedTemplate?.components?.find((c) => c.type === 'BODY')?.text || draft.body;

      const res = await authFetch('/api/automation/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          channel: draft.channel,
          content: {
            body: bodyText,
            subject: draft.subject,
            whatsappTemplate: bodyText,
            whatsappTemplateName: draft.templateName || undefined,
            whatsappTemplateLanguage: draft.templateLanguage || undefined,
            whatsappHeaderMediaUrl: draft.headerMediaUrl || undefined,
            variableMapping: draft.variableMapping,
          },
          audience: draft.audience,
          sendNow: !testSend,
          testSend,
          testMode: testSend,
          testRecipients,
        }),
      });
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.error || `Server responded ${res.status}`);
      const sentCount = data.data?.analytics?.sent ?? 0;
      const failedCount = data.data?.analytics?.failed ?? 0;
      if (failedCount > 0 && sentCount === 0) {
        toast.error(`All ${failedCount} messages failed — click the broadcast to see why`);
      } else {
        toast.success(testSend ? 'Test send complete' : `Broadcast sent to ${sentCount} people${failedCount ? ` (${failedCount} failed)` : ''}`);
      }
      setShowCreate(false);
      setDraft(emptyDraft);
      fetchBroadcasts();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id, action) => {
    try {
      const res = await authFetch(`/api/automation/broadcasts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Broadcast ${action.replace('_', ' ')}`);
      fetchBroadcasts();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return <PageLoader label="Loading broadcasts…" />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Broadcasts</h1>
          <p className="text-sm text-slate-500 mt-1">Send WhatsApp and email campaigns to your audience</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New broadcast
        </button>
      </div>

      <AutoPageIntro />

      {showCreate && (
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Create broadcast</h2>
            <button type="button" onClick={() => { setShowCreate(false); setDraft(emptyDraft); }}
              className="text-xs text-slate-500 hover:underline">Cancel</button>
          </div>

          {/* Step 1: name + channel */}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Campaign name"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
            />
            <select
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value, templateName: '', templateLanguage: '' })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Meta quality rating pre-check — only relevant for WhatsApp sends */}
          {isWhatsApp && (
            <QualityRatingBanner audienceCount={audienceCount?.count} />
          )}

          {/* Step 2: audience */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Audience</p>
              <AudienceIndicator count={audienceCount} loading={countLoading} channel={draft.channel} />
            </div>
            <AudiencePicker
              audience={draft.audience}
              onChange={(audience) => setDraft({ ...draft, audience: { ...audience, engagementDays: draft.audience.engagementDays || 0 } })}
              campaignName={draft.name || 'broadcast'}
            />

            {isWhatsApp && (
              <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.audience.engagementDays > 0}
                    onChange={(e) => setDraft({
                      ...draft,
                      audience: { ...draft.audience, engagementDays: e.target.checked ? 30 : 0 },
                    })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Only include leads who messaged us recently</span>
                </label>
                {draft.audience.engagementDays > 0 && (
                  <select
                    value={draft.audience.engagementDays}
                    onChange={(e) => setDraft({
                      ...draft,
                      audience: { ...draft.audience, engagementDays: Number(e.target.value) },
                    })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value={7}>last 7 days</option>
                    <option value={30}>last 30 days</option>
                    <option value={60}>last 60 days</option>
                    <option value={90}>last 90 days</option>
                  </select>
                )}
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  ✓ Recommended — Meta rewards engaged recipients, cuts quality drops
                </span>
              </div>
            )}
          </div>

          {/* Step 3: WhatsApp template */}
          {isWhatsApp && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Approved WhatsApp template</p>
                  <button type="button" onClick={fetchApprovedTemplates}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
                {approvedTemplates.length === 0 ? (
                  <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      No approved templates yet.{' '}
                      <a href="/automation/whatsapp-templates" className="underline font-semibold">Build & submit one</a>.
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      value={draft.templateName ? `${draft.templateName}|${draft.templateLanguage}` : ''}
                      onChange={(e) => {
                        const [n, l] = e.target.value.split('|');
                        const picked = approvedTemplates.find((t) => t.name === n && t.language === l);
                        const savedMediaUrl = picked?.components?.find((c) => c.type === 'HEADER')?.example?.header_media_url || '';
                        setDraft({
                          ...draft,
                          templateName: n || '',
                          templateLanguage: l || '',
                          variableMapping: [],
                          headerMediaUrl: savedMediaUrl,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white dark:bg-slate-900 text-sm"
                    >
                      <option value="">— Choose a template —</option>
                      {approvedTemplates.map((t) => (
                        <option key={t._id} value={`${t.name}|${t.language}`}>
                          {t.name} · {t.language} · {t.category}
                        </option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <div className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1">
                        <p className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Meta approved
                        </p>
                        <p className="text-slate-600 whitespace-pre-wrap line-clamp-4">
                          {selectedTemplate.components?.find((c) => c.type === 'BODY')?.text}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedTemplate && (() => {
                const header = selectedTemplate.components?.find((c) => c.type === 'HEADER');
                const needsMedia = header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format);
                if (!needsMedia) return null;
                const savedUrl = header.example?.header_media_url;
                const filename = header.example?.header_filename;
                const usingSaved = savedUrl && draft.headerMediaUrl === savedUrl;
                const tone = draft.headerMediaUrl?.trim()
                  ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20';
                return (
                  <div className={`rounded-xl border ${tone} p-4 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {header.format.charAt(0) + header.format.slice(1).toLowerCase()} for this campaign
                      </p>
                      {usingSaved && (
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Using template's file
                          {filename && <span className="text-slate-500">· {filename}</span>}
                        </span>
                      )}
                    </div>
                    {!usingSaved && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        This template has a {header.format.toLowerCase()} header. Meta needs a public URL for every send.
                        {savedUrl && ' A URL from the template is saved — click Reset to use it.'}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={draft.headerMediaUrl}
                        onChange={(e) => setDraft({ ...draft, headerMediaUrl: e.target.value })}
                        placeholder={header.format === 'DOCUMENT' ? 'https://…/file.pdf' : header.format === 'VIDEO' ? 'https://…/video.mp4' : 'https://…/image.jpg'}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                      {savedUrl && !usingSaved && (
                        <button type="button"
                          onClick={() => setDraft({ ...draft, headerMediaUrl: savedUrl })}
                          className="px-3 py-2 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {selectedTemplate && (
                <VariableMapping
                  template={selectedTemplate}
                  mapping={draft.variableMapping}
                  onChange={(variableMapping) => setDraft({ ...draft, variableMapping })}
                />
              )}
            </div>
          )}

          {/* Email content */}
          {isEmail && (
            <div className="space-y-3 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">Email content</p>
                <a href="/automation/templates" className="text-[11px] text-violet-700 hover:underline">
                  + Manage templates
                </a>
              </div>

              {emailTemplates.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    const t = emailTemplates.find((x) => String(x.id) === e.target.value);
                    if (t) setDraft({ ...draft, subject: t.subject || draft.subject, body: t.body || draft.body });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-violet-300 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="">— Load from saved email template (optional) —</option>
                  {emailTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.subject ? ` · ${t.subject.slice(0, 40)}` : ''}</option>
                  ))}
                </select>
              )}

              <input
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                placeholder="Email subject — use {{name}} for personalization"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder={'Email body — supports {{name}}, {{email}}, {{phone}}\n\nBasic HTML works too: <b>, <a>, <br>'}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-500">
                An unsubscribe link is auto-added to every email footer for compliance.
              </p>
            </div>
          )}

          {samplePreview?.to && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Preview — first recipient will see:
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sending to: <span className="font-medium text-slate-900 dark:text-white">{samplePreview.to.name}</span>
                {' · '}
                <span className="font-mono">{samplePreview.to.phone || samplePreview.to.email}</span>
              </p>
              {samplePreview.whatsapp && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-emerald-700">WhatsApp</p>

                  {samplePreview.whatsapp.header && (
                    <div className="rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                      {samplePreview.whatsapp.header.format === 'TEXT' ? (
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {samplePreview.whatsapp.header.text}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span className="inline-block w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                          <span>{samplePreview.whatsapp.header.format} header</span>
                          {samplePreview.whatsapp.header.filename && (
                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                              · {samplePreview.whatsapp.header.filename}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {samplePreview.whatsapp.body}
                  </p>

                  {samplePreview.whatsapp.footer && (
                    <p className="text-[11px] text-slate-500 italic">
                      {samplePreview.whatsapp.footer}
                    </p>
                  )}

                  {samplePreview.whatsapp.buttons?.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-emerald-200 dark:border-emerald-900">
                      {samplePreview.whatsapp.buttons.map((btn, i) => (
                        <div key={i}
                          className="flex items-center justify-center gap-1.5 py-1.5 text-[12px] text-teal-600 font-medium bg-white dark:bg-slate-900 rounded">
                          {btn.type === 'URL' && '🔗'}
                          {btn.type === 'PHONE_NUMBER' && '📞'}
                          {btn.type === 'QUICK_REPLY' && '↩️'}
                          <span>{btn.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {samplePreview.email && (
                <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 p-3">
                  <p className="text-[10px] uppercase font-semibold text-violet-700 mb-1">Email</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">{samplePreview.email.subject || '(no subject)'}</p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{samplePreview.email.body}</p>
                </div>
              )}
            </div>
          )}

          {/* Review + send */}
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => createBroadcast(true)} disabled={saving}
              className="px-4 py-2 rounded-xl border text-sm font-medium">
              Test send
            </button>
            <button type="button" onClick={() => createBroadcast(false)} disabled={saving || !canSend}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50">
              {saving
                ? 'Sending…'
                : audienceCount?.count > 0
                  ? `Send to ${audienceCount.count} ${audienceCount.count === 1 ? 'person' : 'people'}`
                  : 'Create & send'}
            </button>
          </div>
        </div>
      )}

      {broadcasts.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Send className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-900 dark:text-white font-semibold">No broadcasts yet</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-5">
            Send an approved WhatsApp template to a filtered list — a promotion, an announcement, or a reminder.
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> New broadcast
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => {
            const a = b.analytics || {};
            // 'read' is a subset of 'delivered' (every read message was already counted as
            // delivered), so take the furthest-reached stage rather than summing them.
            const reached = Math.max(a.delivered || 0, a.read || 0);
            const total = a.total || 0;
            const successRate = total > 0 ? Math.round((reached / total) * 100) : null;
            return (
              <div
                key={b._id}
                onClick={() => setDetailId(b._id)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {b.channel === 'email' ? <Mail className="w-5 h-5 text-violet-500 shrink-0" /> : <MessageCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{b.name}</p>
                    <p className="text-xs text-slate-500">
                      <span className="text-slate-700 dark:text-slate-300">{a.sent || 0}</span> sent
                      {' · '}<span className="text-teal-600">{reached}</span> delivered
                      {a.read ? <> · <span className="text-emerald-600">{a.read}</span> read</> : null}
                      {a.failed ? <> · <span className="text-red-600">{a.failed}</span> failed</> : null}
                      {a.optedOut ? <> · <span className="text-purple-600">{a.optedOut}</span> opted-out</> : null}
                      {successRate !== null && <> · <span className="text-slate-400">{successRate}% reached</span></>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${STATUS_STYLES[b.status] || STATUS_STYLES.draft}`}>
                    {b.status}
                  </span>
                  {b.status === 'draft' && (
                    <button type="button" onClick={() => runAction(b._id, 'send')} className="p-2 rounded-lg hover:bg-slate-100" title="Send">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {a.failed > 0 && (
                    <button type="button" onClick={() => runAction(b._id, 'retry_failed')} className="p-2 rounded-lg hover:bg-slate-100" title="Retry failed">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailId && (
        <BroadcastDetail broadcastId={detailId} onClose={() => { setDetailId(null); fetchBroadcasts(); }} />
      )}
    </div>
  );
}

/**
 * Parse a fetch response as JSON, gracefully handling HTML error pages so
 * the caller never sees the cryptic "Unexpected token '<'" crash.
 */
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const isHtml = text.trim().startsWith('<');
    return {
      success: false,
      error: isHtml
        ? `Server returned HTML instead of JSON (status ${res.status}). Check terminal logs for the real error.`
        : text.slice(0, 200) || `Empty response (status ${res.status})`,
    };
  }
}

function AudienceIndicator({ count, loading, channel }) {
  if (loading) return <span className="text-[11px] text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> counting…</span>;
  if (!count) return <span className="text-[11px] text-slate-400">—</span>;

  const person = (n) => (n === 1 ? 'person' : 'people');
  const skips = [];
  if (count.optedOutCount > 0) skips.push(`${count.optedOutCount} opted-out`);
  if (count.missingChannelCount > 0) {
    skips.push(`${count.missingChannelCount} no ${channel === 'email' ? 'email' : 'phone'}`);
  }

  if (count.count === 0) {
    return (
      <div className="text-[11px] text-amber-700 flex flex-col items-end gap-0.5">
        <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No recipients match</span>
        {skips.length > 0 && <span className="text-slate-500">Skipped: {skips.join(' · ')}</span>}
      </div>
    );
  }
  return (
    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex flex-col items-end gap-0.5 font-medium">
      <span className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        Sends to {count.count} {person(count.count)}
        {count.truncated ? ' (capped at 5000)' : ''}
      </span>
      {skips.length > 0 && (
        <span className="text-slate-500 font-normal">
          {count.matchedTotal} matched · skipped {skips.join(' · ')}
        </span>
      )}
    </div>
  );
}
