'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Send, Loader2, PenLine } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Escape + turn newlines into <br> so plain text renders as HTML above the signature. */
function toHtml(text) {
  const esc = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc.replace(/\n/g, '<br>');
}

const validList = (s) => String(s || '').split(',').map((e) => e.trim()).filter(Boolean);

/**
 * Compose a brand-new email to any address — a real mail-client feel: From
 * picker, Cc/Bcc (Gmail-style toggles), subject, body, and a signature picker.
 * Finds/creates the lead server-side (every recipient becomes a tracked CRM
 * contact) and appends the chosen signature automatically.
 */
export default function ComposeEmailModal({ open, onClose, onSent }) {
  const [accounts, setAccounts] = useState([]);
  const [fromId, setFromId] = useState('');
  const [to, setTo] = useState('');
  const [toName, setToName] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [signatureId, setSignatureId] = useState('');
  const [sending, setSending] = useState(false);

  const account = accounts.find((a) => a._id === fromId) || null;
  const signatures = account?.signatures || [];

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await authFetch('/api/automation/inbox/email-accounts');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAccounts(data.data);
          const def = data.data.find((a) => a.isDefault) || data.data[0];
          if (def) setFromId(def._id);
        }
      } catch { /* From-picker optional; server falls back to the default mailbox */ }
    })();
  }, [open]);

  // When the From mailbox changes, default to that mailbox's default signature.
  useEffect(() => {
    if (!account) return;
    const def = signatures.find((s) => s.isDefault) || signatures[0];
    setSignatureId(def?.id || '');
  }, [fromId, accounts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setTo(''); setToName(''); setCc(''); setBcc('');
    setShowCc(false); setShowBcc(false); setSubject(''); setMessage('');
  };

  const handleSend = async () => {
    if (!EMAIL_RE.test(to.trim())) { toast.error('Enter a valid recipient email'); return; }
    if (cc && validList(cc).some((e) => !EMAIL_RE.test(e))) { toast.error('One of the Cc addresses is invalid'); return; }
    if (bcc && validList(bcc).some((e) => !EMAIL_RE.test(e))) { toast.error('One of the Bcc addresses is invalid'); return; }
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!message.trim()) { toast.error('Write a message'); return; }
    setSending(true);
    try {
      const res = await authFetch('/api/automation/inbox/send', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'email',
          toEmail: to.trim(),
          toName: toName.trim() || undefined,
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          bodyHtml: toHtml(message.trim()),
          emailAccountId: fromId || undefined,
          signatureId: signatureId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Email sent');
        reset();
        onSent?.();
        onClose?.();
      } else {
        toast.error(data.error || 'Failed to send');
      }
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const field = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
            <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">New Email</h3>
          <button type="button" onClick={onClose} className="ml-auto p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          {accounts.length > 1 && (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
              <select value={fromId} onChange={(e) => setFromId(e.target.value)} className={field}>
                {accounts.map((a) => <option key={a._id} value={a._id}>{a.email}</option>)}
              </select>
            </div>
          )}

          {/* To row + Cc/Bcc toggles (Gmail-style) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">To <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2 text-[11px]">
                {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-slate-500 hover:text-teal-600 font-medium">Cc</button>}
                {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="text-slate-500 hover:text-teal-600 font-medium">Bcc</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="person@example.com" className={`${field} sm:col-span-2`} />
              <input type="text" value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Name (optional)" className={field} />
            </div>
          </div>

          {showCc && (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Cc <span className="text-slate-400">(comma-separated)</span></label>
              <input type="text" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="a@x.com, b@y.com" className={field} />
            </div>
          )}
          {showBcc && (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Bcc <span className="text-slate-400">(comma-separated)</span></label>
              <input type="text" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="hidden@x.com" className={field} />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Subject <span className="text-red-500">*</span></label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={field} />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={7} placeholder="Write your message…" className={`${field} resize-none`} />
          </div>

          {/* Signature picker */}
          <div className="flex items-center gap-2">
            <PenLine className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Signature</label>
            {signatures.length > 0 ? (
              <select value={signatureId} onChange={(e) => setSignatureId(e.target.value)} className="flex-1 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none">
                <option value="">No signature</option>
                {signatures.map((s) => <option key={s.id} value={s.id}>{s.name || 'Signature'}{s.isDefault ? ' (default)' : ''}</option>)}
              </select>
            ) : (
              <span className="text-[11px] text-slate-400">Mailbox default is added automatically</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="button" onClick={handleSend} disabled={sending} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
