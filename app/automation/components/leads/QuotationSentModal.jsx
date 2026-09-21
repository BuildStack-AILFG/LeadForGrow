'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500';

export default function QuotationSentModal({
  open,
  leadName,
  entityName,
  dealId,
  onConfirm,
  onCancel,
  saving,
}) {
  const name = entityName || leadName || 'this deal';
  const [mode, setMode] = useState('file');
  const [quotationUrl, setQuotationUrl] = useState('');
  const [quotationMessage, setQuotationMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) {
      setMode('file');
      setQuotationUrl('');
      setQuotationMessage('');
      setFileName('');
      setUploading(false);
    }
  }, [open]);

  if (!open || !mounted) return null;

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await authFetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success && data.url) {
        const absolute = data.url.startsWith('http') ? data.url : `${window.location.origin}${data.url}`;
        setQuotationUrl(absolute);
        if (dealId) {
          await authFetch('/api/automation/attachments', {
            method: 'POST',
            body: JSON.stringify({
              entityType: 'deal',
              entityId: dealId,
              fileName: file.name,
              fileUrl: absolute,
              fileSize: file.size,
              mimeType: file.type || 'application/pdf',
            }),
          }).catch(() => {});
        }
        toast.success('File uploaded');
      } else {
        toast.error(data.error || 'Upload failed');
        setFileName('');
      }
    } catch {
      toast.error('Upload failed');
      setFileName('');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = quotationUrl.trim() && !uploading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({ quotationUrl: quotationUrl.trim(), quotationMessage: quotationMessage.trim() });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={saving || uploading ? undefined : onCancel} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Send proposal / quotation</h3>
          <button type="button" onClick={onCancel} disabled={saving || uploading} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Attach the quotation for <span className="font-medium">{name}</span>. Customer WhatsApp/email will send after you confirm.
          </p>

          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md ${mode === 'file' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload file
            </button>
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md ${mode === 'link' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <Link2 className="w-3.5 h-3.5" /> Paste link
            </button>
          </div>

          {mode === 'file' ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 transition-colors"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {uploading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Uploading…</p>
              ) : fileName && quotationUrl ? (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-4 h-4" /> {fileName}
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload PDF or document</p>
                  <p className="text-[11px] text-slate-400 mt-1">PDF, Word, or image</p>
                </>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Quotation link *</label>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/... or cloud link"
                className={`${inputCls} mt-1`}
                value={quotationUrl}
                onChange={(e) => setQuotationUrl(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Message to customer</label>
            <textarea
              rows={3}
              placeholder="e.g. Please find our proposal attached. Valid for 14 days."
              className={`${inputCls} mt-1 resize-none`}
              value={quotationMessage}
              onChange={(e) => setQuotationMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onCancel} disabled={saving || uploading} className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading || !canSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Send quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
