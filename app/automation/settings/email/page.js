'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Mail,
  Trash2,
  Zap,
  Sparkles,
  Plug,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';
import RichSignatureEditor from '../../components/settings/RichSignatureEditor';
import MultiSignatureEditor from '../../components/settings/MultiSignatureEditor';
import AiBadgeIcon from '@/app/components/icons/AiBadgeIcon';
import { useConfirm } from '@/app/components/ConfirmProvider';

// Gmail-specific defaults. Users don't need to know these — the wizard fills
// them in from the "Connect Gmail" flow. If Google ever changes them (they
// haven't in a decade) this is the one place to update.
const GMAIL_DEFAULTS = {
  provider: 'gmail',
  imap: { host: 'imap.gmail.com', port: 993, secure: true },
  smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
};

function GmailBrandMark({ className = 'w-4 h-4' }) {
  // Multicolor Gmail glyph — matches the landing page's brand mark.
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M2 6.5A2.5 2.5 0 0 1 4.5 4H5l7 5 7-5h.5A2.5 2.5 0 0 1 22 6.5V18a2 2 0 0 1-2 2h-2V9.7l-6 4.3-6-4.3V20H4a2 2 0 0 1-2-2V6.5Z" />
      <path fill="#34A853" d="M4 20h2V9.7l-4-2.85V18a2 2 0 0 0 2 2Z" />
      <path fill="#FBBC04" d="M18 20h2a2 2 0 0 0 2-2V6.85l-4 2.85V20Z" />
      <path fill="#EA4335" d="m6 9.7 6 4.3 6-4.3V4h-.5L12 9 5 4h-.5A2.5 2.5 0 0 0 2 6.5v.35L6 9.7Z" />
      <path fill="#C5221F" d="M22 6.5v.35L18 9.7V4h.5A2.5 2.5 0 0 1 22 6.5Z" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    pending: { label: 'Not tested', cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: Clock },
    error: { label: 'Error', cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: AlertCircle },
    disconnected: { label: 'Disconnected', cls: 'bg-slate-100 text-slate-500 border-slate-200', Icon: AlertCircle },
    archived: { label: 'Archived', cls: 'bg-slate-100 text-slate-400 border-slate-200', Icon: AlertCircle },
  };
  const entry = map[status] || map.pending;
  const { Icon } = entry;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${entry.cls}`}>
      <Icon className="h-3 w-3" />
      {entry.label}
    </span>
  );
}

/**
 * Modal that walks the user through connecting their Gmail via App Password.
 * Extracted from the main page so the trigger button stays readable.
 */
function GmailConnectModal({ open, onClose, onConnected }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  // Signatures array — populated live by the embedded MultiSignatureEditor.
  // Users can create multiple signatures during setup; one is marked default.
  const [signatures, setSignatures] = useState([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const reset = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSignatures([]);
    setTestResult(null);
    setSaving(false);
    setTesting(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and App Password are required');
      return;
    }
    if (password.replace(/\s+/g, '').length < 16) {
      toast.error("That doesn't look like a Gmail App Password (should be 16 characters).");
      return;
    }

    setSaving(true);
    setTestResult(null);

    try {
      // 1) Create the row. Backend encrypts the password before storing.
      const createRes = await authFetch('/api/automation/inbox/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          displayName: displayName.trim() || email.trim(),
          signatures: signatures.length ? signatures : undefined,
          provider: GMAIL_DEFAULTS.provider,
          type: 'personal',
          imap: {
            ...GMAIL_DEFAULTS.imap,
            username: email.trim(),
            // Google App Passwords are typically shown grouped as "abcd efgh
            // ijkl mnop" — strip the presentation spaces before sending.
            password: password.replace(/\s+/g, ''),
          },
          smtp: {
            ...GMAIL_DEFAULTS.smtp,
            username: email.trim(),
            password: password.replace(/\s+/g, ''),
          },
        }),
      });
      const created = await createRes.json();
      if (!created.success) {
        setSaving(false);
        toast.error(created.error || 'Failed to save account');
        return;
      }

      // 2) Immediately test the credentials. This is the "did it actually
      // work" moment users want — creating a row silently is not enough.
      setSaving(false);
      setTesting(true);

      const testRes = await authFetch(
        `/api/automation/inbox/email-accounts/${created.data._id}/test`,
        { method: 'POST' }
      );
      const tested = await testRes.json();
      setTestResult(tested);
      setTesting(false);

      if (tested.success) {
        toast.success('Gmail connected!');
        onConnected?.();
        // Small delay so the user sees the ✓ before the modal closes.
        setTimeout(() => {
          reset();
          onClose();
        }, 900);
      } else {
        toast.error('Saved, but connection test failed. See details below.');
      }
    } catch (err) {
      setSaving(false);
      setTesting(false);
      toast.error(err.message || 'Something went wrong');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !saving && !testing && onClose()}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <GmailBrandMark className="h-5 w-5" />
            <h2 className="text-base font-semibold text-slate-900">Connect Gmail</h2>
          </div>
          <button
            type="button"
            onClick={() => !saving && !testing && onClose()}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-semibold">You'll need a Google App Password.</p>
            <p className="mt-1">
              Requires 2-Step Verification enabled on your Google account.{' '}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold text-amber-900 underline"
              >
                Generate one <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Gmail address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              disabled={saving || testing}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              App Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="abcd efgh ijkl mnop"
              disabled={saving || testing}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              16 characters. Spaces are fine — we strip them.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Display name{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name as recipients will see it"
              disabled={saving || testing}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Signatures{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <MultiSignatureEditor
              embedded
              account={{ email, displayName, signatures }}
              busy={saving || testing}
              onChange={setSignatures}
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Create as many as you need (Sales, HR, Personal…). The one marked Default is used unless you pick another at compose time.
            </p>
          </div>

          {testResult && !testResult.success && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              <p className="font-semibold">Connection test failed</p>
              {testResult.data?.smtp && !testResult.data.smtp.ok && (
                <p className="mt-1">SMTP: {testResult.data.smtp.message}</p>
              )}
              {testResult.data?.imap && !testResult.data.imap.ok && (
                <p className="mt-1">IMAP: {testResult.data.imap.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => !saving && !testing && onClose()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || testing}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving
                ? 'Saving…'
                : testing
                  ? 'Testing connection…'
                  : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Collapsible per-account signature editor. Uses <details> so we get
 * expand/collapse for free without extra state — one less thing to manage.
 * Draft is local; only committed to the server on "Save".
 */
/**
 * Collapsible per-account signature editor. Now also handles a company logo
 * — uploaded via the existing Cloudinary-signed flow so it lives on a CDN
 * (recipients' email clients render it without hitting our servers).
 */
function SignatureEditor({ account, busy, onSave, onSavePatch }) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState(account.signature || '');
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  useEffect(() => { setDraft(account.signature || ''); }, [account.signature]);
  const dirty = draft !== (account.signature || '');

  const uploadLogo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Logo must be an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB.');
      return;
    }
    setUploading(true);
    try {
      // Get a signed upload payload from our server (tenant-scoped folder).
      const signRes = await authFetch('/api/cloudinary-sign', { method: 'POST' });
      const sign = await signRes.json();
      if (!sign.success) {
        // Friendlier error than the raw env-missing message. Points the user
        // at both the fastest workaround (URL paste) and the proper fix
        // (add the env vars) — instead of a dead-end technical toast.
        throw new Error(
          sign.error?.includes('CLOUDINARY')
            ? 'File uploads need Cloudinary credentials in .env. As a quick fix, paste an image URL instead.'
            : sign.error || 'Sign failed'
        );
      }

      // Send file directly to Cloudinary — never touches our origin.
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sign.apiKey);
      fd.append('timestamp', String(sign.timestamp));
      fd.append('signature', sign.signature);
      fd.append('folder', sign.folder);
      const cdnRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''}/image/upload`,
        { method: 'POST', body: fd }
      );
      const cdnData = await cdnRes.json();
      if (!cdnData.secure_url) throw new Error(cdnData.error?.message || 'Upload failed');

      await onSavePatch(account._id, { signatureLogoUrl: cdnData.secure_url });
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error(err.message || 'Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!(await confirm({ title: 'Remove logo', message: 'Remove the logo from your signature?', confirmLabel: 'Remove', danger: true }))) return;
    onSavePatch(account._id, { signatureLogoUrl: null });
  };

  return (
    <details className="border-t border-slate-100 dark:border-slate-800 group">
      <summary className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 list-none [&::-webkit-details-marker]:hidden">
        <span className="flex-1">
          Signature{' '}
          <span className="text-slate-400">
            {(() => {
              const count = Array.isArray(account.signatures) ? account.signatures.length : 0;
              if (count > 0) return `· ${count} saved`;
              if (account.signature || account.signatureLogoUrl) return '· set';
              return '· none — click to add';
            })()}
          </span>
        </span>
        <span className="text-slate-400 text-[10px] group-open:hidden">Show</span>
        <span className="text-slate-400 text-[10px] hidden group-open:inline">Hide</span>
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-3">
        {/* Logo section — preview + upload/replace/remove */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Company logo
            </p>
            {account.signatureLogoUrl ? (
              <div className="flex items-start gap-3">
                <img
                  src={account.signatureLogoUrl}
                  alt="Signature logo"
                  className="max-h-16 max-w-[180px] border border-slate-200 rounded bg-white p-1"
                />
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50">
                    {uploading ? 'Uploading…' : 'Replace'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadLogo(e.target.files?.[0])}
                      disabled={uploading || busy}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeLogo}
                    disabled={uploading || busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400">
                  {uploading ? 'Uploading…' : '+ Upload logo (PNG/JPG, ≤2 MB)'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadLogo(e.target.files?.[0])}
                    disabled={uploading || busy}
                  />
                </label>
                <div className="text-[10px] text-slate-400">
                  or{' '}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput((v) => !v)}
                    className="underline hover:text-slate-600"
                  >
                    paste an image URL
                  </button>
                  {' '}(if your logo is already hosted somewhere)
                </div>
                {showUrlInput && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://yourdomain.com/logo.png"
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const url = urlInput.trim();
                        if (!url) return;
                        if (!/^https?:\/\//i.test(url)) {
                          toast.error('URL must start with http:// or https://');
                          return;
                        }
                        await onSavePatch(account._id, { signatureLogoUrl: url }, 'Logo set');
                        setUrlInput('');
                        setShowUrlInput(false);
                      }}
                      disabled={!urlInput.trim() || busy}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-black disabled:opacity-40"
                    >
                      Set
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Multi-signature editor — Hostinger-style. Lets the user save
            several named signatures per mailbox (Sales / HR / Personal)
            and mark one as default. Legacy single-signature accounts are
            migrated automatically on first open. */}
        <MultiSignatureEditor
          account={account}
          busy={busy}
          onSave={(signatures) => onSavePatch(account._id, { signatures }, 'Signatures saved')}
        />
      </div>
    </details>
  );
}

/**
 * SLA safety net: auto-reply after N min if no human responds.
 * Business-wide setting; per-conversation override lives on the ChatHeader.
 * We render this at the top of the Email Accounts page because that's where
 * users are already thinking about email — separate settings pages get
 * ignored.
 */
function AutoReplyCard() {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/business/settings');
        const data = await res.json();
        // Backend returns { settings: {...} } — nested emailAutoReply may
        // be undefined for tenants that haven't touched this feature yet.
        setCfg(data.data?.settings?.emailAutoReply || {
          enabled: false,
          thresholdMinutes: 5,
          template:
            "Hi {{name}},\n\nThanks for your email — we've got your message and someone from {{businessName}} will get back with a detailed answer shortly.\n\nBest,\n{{businessName}} Team",
          guardrails: {
            businessHoursOnly: true,
            skipKeywords: ['angry', 'refund', 'cancel', 'complaint', 'lawyer', 'sue'],
            onePerConversation: true,
          },
        });
      } catch {
        /* silent */
      }
    })();
  }, []);

  if (!cfg) return null;

  const save = async (next) => {
    setSaving(true);
    try {
      const res = await authFetch('/api/business/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { emailAutoReply: next } }),
      });
      const data = await res.json();
      if (data.success) {
        setCfg(next);
        toast.success('Auto-reply settings saved');
      } else {
        toast.error(data.error || 'Save failed');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = () => save({ ...cfg, enabled: !cfg.enabled });

  return (
    <div className={`rounded-xl border p-4 ${cfg.enabled ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        {/* Bare icon — no container. Opacity dims it in the OFF state so
            the disabled look still reads at a glance. */}
        <AiBadgeIcon className={`h-9 w-9 shrink-0 ${cfg.enabled ? '' : 'opacity-60'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">SLA safety net — auto-reply</p>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {cfg.enabled ? 'ON' : 'OFF'}
            </span>
            {cfg.totalSent > 0 && (
              <span className="text-[10px] text-slate-500">· {cfg.totalSent} sent</span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            If a customer emails you and nobody replies within{' '}
            <strong>{cfg.thresholdMinutes} minute{cfg.thresholdMinutes === 1 ? '' : 's'}</strong>,
            we send a polite &quot;we&apos;ll get back to you&quot; from the mailbox that owns the thread.
          </p>
        </div>
        <label className="inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={!!cfg.enabled}
            onChange={toggle}
            disabled={saving}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:mt-0.5 after:ml-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:border after:border-slate-300 peer-checked:bg-indigo-600 relative" />
        </label>
      </div>

      {cfg.enabled && (
        <div className="mt-3 border-t border-indigo-100 pt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[11px] font-semibold text-indigo-700 hover:underline"
          >
            {open ? 'Hide details' : 'Configure threshold, message, and guardrails →'}
          </button>

          {open && (
            <AutoReplyConfig cfg={cfg} onSave={save} saving={saving} />
          )}
        </div>
      )}
    </div>
  );
}

function AutoReplyConfig({ cfg, onSave, saving }) {
  const [draft, setDraft] = useState(cfg);
  useEffect(() => { setDraft(cfg); }, [cfg]);

  const setField = (path, value) => {
    setDraft((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = obj[parts[i]] || {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(cfg);

  return (
    <div className="mt-3 space-y-3">
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Wait before auto-replying
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={60}
            value={draft.thresholdMinutes}
            onChange={(e) => setField('thresholdMinutes', Number(e.target.value))}
            className="flex-1"
          />
          <span className="min-w-[60px] text-xs font-mono">{draft.thresholdMinutes} min</span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Message template
        </label>
        <textarea
          value={draft.template}
          onChange={(e) => setField('template', e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
        />
        <p className="mt-1 text-[10px] text-slate-500">
          Variables: <code>{'{{name}}'}</code>, <code>{'{{businessName}}'}</code>, <code>{'{{subject}}'}</code>
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Guardrails
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={!!draft.guardrails?.businessHoursOnly}
            onChange={(e) => setField('guardrails.businessHoursOnly', e.target.checked)}
          />
          Only during business hours
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={!!draft.guardrails?.onePerConversation}
            onChange={(e) => setField('guardrails.onePerConversation', e.target.checked)}
          />
          Send at most once per conversation
        </label>
        <div>
          <label className="mt-1 block text-[10px] text-slate-500 mb-1">
            Skip if the customer&apos;s message contains any of these words (comma-separated)
          </label>
          <input
            type="text"
            value={(draft.guardrails?.skipKeywords || []).join(', ')}
            onChange={(e) => setField('guardrails.skipKeywords', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={!dirty || saving}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

export default function EmailSettingsPage() {
  const confirm = useConfirm();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGmail, setShowGmail] = useState(false);
  const [showGenericForm, setShowGenericForm] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    // Multi-signature array — MultiSignatureEditor in embedded mode
    // populates this via its onChange callback.
    signatures: [],
    imapHost: '',
    smtpHost: '',
    imapUser: '',
    imapPass: '',
    smtpUser: '',
    smtpPass: '',
  });

  const load = async () => {
    setLoading(true);
    const res = await authFetch('/api/automation/inbox/email-accounts');
    const data = await res.json();
    if (data.success) setAccounts(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveGeneric = async (e) => {
    e.preventDefault();
    const res = await authFetch('/api/automation/inbox/email-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        displayName: form.displayName,
        signatures: form.signatures?.length ? form.signatures : undefined,
        provider: 'smtp',
        imap: {
          host: form.imapHost,
          username: form.imapUser || form.email,
          password: form.imapPass,
          port: 993,
          secure: true,
        },
        smtp: {
          host: form.smtpHost,
          username: form.smtpUser || form.email,
          password: form.smtpPass || form.imapPass,
          port: 587,
        },
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Account added');
      setShowGenericForm(false);
      load();
    } else toast.error(data.error || 'Failed');
  };

  const handleSync = async () => {
    const res = await authFetch('/api/automation/inbox/sync-email', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const total = data.data?.reduce((n, r) => n + (r.synced || 0), 0) || 0;
      toast.success(`Synced ${total} messages`);
      load();
    } else toast.error(data.error || 'Sync failed');
  };

  const handleTest = async (accountId) => {
    setBusyId(accountId);
    const res = await authFetch(
      `/api/automation/inbox/email-accounts/${accountId}/test`,
      { method: 'POST' }
    );
    const data = await res.json();
    setBusyId(null);
    if (data.success) {
      toast.success('Connection OK');
    } else {
      toast.error(
        data.data?.smtp?.message ||
          data.data?.imap?.message ||
          data.error ||
          'Test failed'
      );
    }
    load();
  };

  const handleDisconnect = async (accountId) => {
    if (!(await confirm({ title: 'Disconnect mailbox', message: 'Disconnect this mailbox? History is kept but sync stops.', confirmLabel: 'Disconnect', danger: true }))) return;
    setBusyId(accountId);
    const res = await authFetch(
      `/api/automation/inbox/email-accounts/${accountId}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    setBusyId(null);
    if (data.success) {
      toast.success('Disconnected');
      load();
    } else toast.error(data.error || 'Failed');
  };

  const handleSaveSignature = async (accountId, newSignature) => {
    await handleAccountPatch(accountId, { signature: newSignature }, 'Signature saved');
  };

  // Generic PATCH helper — used for signature, logo URL, isDefault, etc.
  // Extracted because the SignatureEditor needs it for logo add/remove
  // separately from the text-signature Save button.
  const handleAccountPatch = async (accountId, patch, successMessage) => {
    setBusyId(accountId);
    const res = await authFetch(
      `/api/automation/inbox/email-accounts/${accountId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }
    );
    const data = await res.json();
    setBusyId(null);
    if (data.success) {
      if (successMessage) toast.success(successMessage);
      load();
    } else {
      toast.error(data.error || 'Failed');
    }
    return data;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link
          href="/automation/settings/integrations"
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Email Accounts</h1>
          <p className="text-xs text-slate-500">
            Send and receive from your own mailbox. Connect Gmail in one click, or use SMTP/IMAP for anything else.
          </p>
        </div>
      </div>

      <AutoReplyCard />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowGmail(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <GmailBrandMark className="h-4 w-4" />
          Connect Gmail
        </button>
        <button
          type="button"
          onClick={() => setShowGenericForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" /> Add SMTP/IMAP
        </button>
        <button
          type="button"
          onClick={handleSync}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Sync now
        </button>
      </div>

      {showGenericForm && (
        <form
          onSubmit={handleSaveGeneric}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:bg-slate-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Custom IMAP / SMTP
          </p>
          <input
            required
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Display name (optional)"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Signatures <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <MultiSignatureEditor
              embedded
              account={{
                email: form.email,
                displayName: form.displayName,
                signatures: form.signatures || [],
              }}
              onChange={(signatures) => setForm({ ...form, signatures })}
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Create as many as you need (Sales, HR, Personal…). The one marked Default is used unless you pick another at compose time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="IMAP host"
              value={form.imapHost}
              onChange={(e) => setForm({ ...form, imapHost: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="SMTP host"
              value={form.smtpHost}
              onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="IMAP user (defaults to email)"
              value={form.imapUser}
              onChange={(e) => setForm({ ...form, imapUser: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={form.imapPass}
              onChange={(e) => setForm({ ...form, imapPass: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Save account
          </button>
        </form>
      )}

      {loading ? (
        <PageLoader label="Loading email accounts…" height="8rem" />
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
          <Mail className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">
            No mailboxes connected yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Connect your Gmail to start sending and receiving from the CRM.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {accounts.map((a) => {
            const brand =
              a.provider === 'gmail' ? (
                <GmailBrandMark className="h-5 w-5" />
              ) : (
                <Mail className="h-5 w-5 text-indigo-600" />
              );
            return (
              <li
                key={a._id}
                className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center gap-3 p-4">
                  {brand}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {a.displayName || a.email}
                      </p>
                      <StatusBadge status={a.status} />
                      {a.type === 'shared' && (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          Shared
                        </span>
                      )}
                      {a.type === 'legacy' && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          Legacy
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {a.email}
                      {a.lastSyncAt
                        ? ` · Synced ${new Date(a.lastSyncAt).toLocaleString()}`
                        : ' · Never synced'}
                    </p>
                    {a.status === 'error' && a.lastError && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-rose-600">
                        {a.lastError}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTest(a._id)}
                    disabled={busyId === a._id}
                    title="Test connection"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Plug className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisconnect(a._id)}
                    disabled={busyId === a._id}
                    title="Disconnect"
                    className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <SignatureEditor
                  account={a}
                  busy={busyId === a._id}
                  onSave={handleSaveSignature}
                  onSavePatch={handleAccountPatch}
                />
              </li>
            );
          })}
        </ul>
      )}

      <GmailConnectModal
        open={showGmail}
        onClose={() => setShowGmail(false)}
        onConnected={load}
      />
    </div>
  );
}
