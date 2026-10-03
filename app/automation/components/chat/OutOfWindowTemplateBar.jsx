'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Send, Loader2, Clock, Search, FileText, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

/**
 * Rendered inside the inbox when the WhatsApp 24-hour customer-care window is
 * closed. Meta only allows approved templates in this state — this bar swaps
 * out the free-text reply box for an approved-template picker + send.
 */
export default function OutOfWindowTemplateBar({ leadName, lead, onSend }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [variableValues, setVariableValues] = useState([]);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/automation/whatsapp-templates?status=APPROVED');
      const data = await res.json();
      if (data.success) setTemplates(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const selected = useMemo(() => {
    if (!pick) return null;
    const [name, lang] = pick.split('|');
    return templates.find((t) => t.name === name && t.language === lang);
  }, [pick, templates]);

  useEffect(() => {
    // Auto-fill from the template's saved media URL if any
    const header = selected?.components?.find((c) => c.type === 'HEADER');
    if (header?.example?.header_media_url && !headerMediaUrl) {
      setHeaderMediaUrl(header.example.header_media_url);
    }
    if (!selected) setHeaderMediaUrl('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._id]);

  const headerNeedsMedia = (() => {
    const header = selected?.components?.find((c) => c.type === 'HEADER');
    return header && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format);
  })();

  const bodyText = selected?.components?.find((c) => c.type === 'BODY')?.text || '';
  const varCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;

  // When the template changes, pre-fill variable inputs with sensible defaults from the lead
  useEffect(() => {
    if (varCount === 0) { setVariableValues([]); return; }
    const firstName = String(lead?.name || leadName || 'Customer').split(' ')[0];
    const defaults = Array.from({ length: varCount }, (_, i) => {
      if (i === 0) return firstName;
      return '';
    });
    setVariableValues(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._id, varCount]);

  const allVarsFilled = variableValues.every((v) => String(v || '').trim());
  const canSend = selected && (!headerNeedsMedia || headerMediaUrl.trim()) && allVarsFilled;

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await onSend({
        name: selected.name,
        language: selected.language,
        headerMediaUrl: headerMediaUrl || undefined,
        variables: variableValues.length ? variableValues.map((v) => String(v || '').trim() || 'Customer') : undefined,
      });
      toast.success('Template sent');
      setPick('');
      setHeaderMediaUrl('');
      setVariableValues([]);
    } catch (e) {
      toast.error(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-line dark:border-slate-800 bg-accent-subtle dark:bg-green-950/20 p-4 space-y-3">
      <div className="flex items-start gap-2 text-xs text-accent-fg dark:text-accent-fg">
        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">24-hour reply window closed</p>
          <p className="text-accent-fg dark:text-accent-fg mt-0.5">
            {leadName ? `${leadName} hasn't messaged you in the last 24 hours. ` : 'This chat is outside the 24h window. '}
            Meta only allows <strong>approved templates</strong> to reopen conversation.
          </p>
        </div>
      </div>

      {!selected ? (
        <>
          {/* Empty-state picker: search + cards, feels like a real inbox action
              instead of a bare HTML dropdown. */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-fg/70" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates by name or category…"
                className="w-full pl-9 pr-3 py-2 rounded border border-line dark:border-green-800 bg-canvas dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>
            <button
              type="button"
              onClick={fetchTemplates}
              title="Refresh templates"
              className="p-2 rounded border border-line dark:border-green-800 hover:bg-accent-subtle dark:hover:bg-green-950/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 justify-center text-xs text-accent-fg">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading approved templates…
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded bg-canvas dark:bg-slate-900 border border-dashed border-line p-4 text-center">
              <FileText className="w-6 h-6 mx-auto text-accent-fg mb-2" />
              <p className="text-xs font-semibold text-accent-fg dark:text-accent-fg">No approved templates yet</p>
              <p className="text-meta text-accent-fg/80 dark:text-accent-fg/80 mt-1">
                Meta requires an approved template to reopen a chat after 24h.
              </p>
              <a href="/automation/whatsapp-templates" className="inline-block mt-2 text-meta font-semibold text-accent-fg hover:underline">
                Build your first template →
              </a>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded border border-line dark:border-green-900/50 bg-canvas dark:bg-slate-900 divide-y divide-green-100 dark:divide-green-950/50">
              {templates
                .filter((t) => {
                  if (!search.trim()) return true;
                  const q = search.toLowerCase();
                  return (
                    t.name?.toLowerCase().includes(q) ||
                    t.category?.toLowerCase().includes(q) ||
                    (t.components?.find((c) => c.type === 'BODY')?.text || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 20)
                .map((t) => {
                  const body = t.components?.find((c) => c.type === 'BODY')?.text || '';
                  return (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => setPick(`${t.name}|${t.language}`)}
                      className="w-full text-left px-3 py-2 hover:bg-accent-subtle dark:hover:bg-green-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <FileText className="w-3 h-3 text-accent-fg flex-shrink-0" />
                        <span className="text-xs font-semibold text-fg dark:text-slate-100 truncate">{t.name}</span>
                        <span className="text-meta font-medium px-1.5 py-[1px] rounded bg-accent-subtle dark:bg-green-950/40 text-accent-fg dark:text-accent-fg">
                          {t.category}
                        </span>
                        <span className="text-meta text-fg-tertiary ml-auto">{t.language}</span>
                      </div>
                      <p className="text-meta text-fg-tertiary dark:text-fg-tertiary line-clamp-2 pl-5">
                        {body || '(no body text)'}
                      </p>
                    </button>
                  );
                })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setPick(''); setHeaderMediaUrl(''); setVariableValues([]); }}
              className="inline-flex items-center gap-1 text-meta font-semibold text-accent-fg hover:text-accent-fg"
            >
              <ChevronLeft className="w-3 h-3" /> Pick another
            </button>
            <span className="text-meta text-fg-tertiary">·</span>
            <span className="text-xs font-semibold text-fg dark:text-slate-200">{selected.name}</span>
            <span className="text-meta px-1.5 py-[1px] rounded bg-accent-subtle dark:bg-green-950/40 text-accent-fg font-medium">
              {selected.category}
            </span>
          </div>

          <div className="rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 p-3 text-xs text-fg-secondary dark:text-fg-disabled whitespace-pre-wrap max-h-32 overflow-y-auto">
            {selected.components?.find((c) => c.type === 'BODY')?.text || '(no body)'}
          </div>
        </>
      )}

      {selected && headerNeedsMedia && (
        <input
          value={headerMediaUrl}
          onChange={(e) => setHeaderMediaUrl(e.target.value)}
          placeholder="Media URL for template header (https://…)"
          className="w-full px-3 py-2 rounded border border-line bg-canvas dark:bg-slate-900 text-xs font-mono"
        />
      )}

      {selected && varCount > 0 && (
        <div className="space-y-2">
          <p className="text-meta font-semibold text-fg-secondary dark:text-fg-disabled">
            Fill template variables ({varCount})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: varCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-meta font-mono text-fg-tertiary shrink-0 w-8">{`{{${i + 1}}}`}</span>
                <input
                  value={variableValues[i] || ''}
                  onChange={(e) => {
                    const next = [...variableValues];
                    next[i] = e.target.value;
                    setVariableValues(next);
                  }}
                  placeholder={i === 0 ? "Recipient's first name" : `Value for {{${i + 1}}}`}
                  className="flex-1 px-2 py-1.5 rounded border border-line bg-canvas dark:bg-slate-900 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <a href="/automation/whatsapp-templates" className="text-meta text-accent-fg hover:underline">
          + Build a new template
        </a>
        <button type="button" onClick={handleSend} disabled={!canSend || sending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send template
        </button>
      </div>

      {!canSend && selected && (
        <p className="text-meta text-accent-fg">
          {headerNeedsMedia && !headerMediaUrl.trim()
            ? `${selected.components.find((c) => c.type === 'HEADER').format.toLowerCase()} URL required for this template's header`
            : !allVarsFilled
              ? `Fill all ${varCount} template variable${varCount === 1 ? '' : 's'} above`
              : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Detect whether the 24h WhatsApp window is open based on the most recent
 * incoming message. Returns true if within window OR if channel is not WhatsApp.
 */
export function useIsWithin24hWindow(chat, messages) {
  return useMemo(() => {
    if (!chat) return true;
    if ((chat.channel || 'whatsapp') !== 'whatsapp') return true;
    // Intervened / template convos still allow free-text within the window
    const lastIncoming = [...(messages || [])]
      .reverse()
      .find((m) => m.direction === 'incoming');
    if (!lastIncoming?.timestamp) return false;
    const ageMs = Date.now() - new Date(lastIncoming.timestamp).getTime();
    return ageMs < 24 * 60 * 60 * 1000;
  }, [chat, messages]);
}
