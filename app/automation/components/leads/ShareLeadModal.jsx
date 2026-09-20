'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Send, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

export function resolveLeadLocation(lead) {
  const loc = lead?.location;
  if (loc && (loc.street || loc.city || loc.state || loc.country || loc.postalCode)) {
    return [loc.street, loc.city, loc.state, loc.country, loc.postalCode].filter(Boolean).join(', ');
  }
  // Form leads store the address inside metadata.formFields.address_*
  const ff = lead?.metadata?.formFields;
  if (ff && typeof ff === 'object') {
    const key = Object.keys(ff).find((k) => /address|location/i.test(k) && !/\bip\b|ip[-_]?address/i.test(k));
    if (key && ff[key]) return String(ff[key]);
  }
  return '';
}

function buildShareText(lead, shareMessage) {
  const location = resolveLeadLocation(lead);
  const msg = shareMessage || lead?.lastMessagePreview || lead?.message;
  // Order: name → number → email → location → message
  const lines = [
    '📋 *Lead Details*',
    '',
    `👤 Name: ${lead?.name || '—'}`,
    `📞 Number: ${lead?.phone || lead?.whatsappId || '—'}`,
  ];
  if (lead?.email) lines.push(`✉️ Email: ${lead.email}`);
  if (location) lines.push(`📍 Location: ${location}`);
  if (msg) lines.push(`💬 Message: ${msg}`);
  if (lead?.serviceInterest) lines.push(`🔧 Interest: ${lead.serviceInterest}`);
  return lines.join('\n');
}

export default function ShareLeadModal({ lead, shareMessage, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', whatsapp: '' });
  const [saving, setSaving] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/automation/share-contacts');
      const data = await res.json();
      if (data.success) {
        setContacts(data.data || []);
        if (!data.data?.length) setShowAdd(true);
      }
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const addContact = async () => {
    if (!form.name.trim() || !form.whatsapp.trim()) {
      toast.error('Enter name and WhatsApp number');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/share-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Contact saved');
        setForm({ name: '', whatsapp: '' });
        setShowAdd(false);
        setContacts((prev) => [data.data, ...prev]);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (id) => {
    try {
      const res = await authFetch(`/api/automation/share-contacts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setContacts((prev) => prev.filter((c) => c._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const shareTo = (contact) => {
    const number = String(contact.whatsapp).replace(/[^\d]/g, '');
    const text = encodeURIComponent(buildShareText(lead, shareMessage));
    window.open(`https://wa.me/${number}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Share lead on WhatsApp</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Sharing:</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lead?.name} · {lead?.phone || lead?.whatsappId || '—'}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {contacts.map((c) => (
                <div key={c._id} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">+{c.whatsapp}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => shareTo(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Send className="w-3.5 h-3.5" /> Share
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteContact(c._id)}
                    aria-label="Delete contact"
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {!contacts.length && !showAdd && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No saved contacts yet. Add one below.</p>
              )}
            </>
          )}

          {showAdd ? (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1"><UserPlus className="w-3 h-3" /> New contact</p>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                className="w-full text-sm px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
              />
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                placeholder="WhatsApp number with country code (e.g. 919812345678)"
                className="w-full text-sm px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
              />
              <div className="flex gap-2">
                <button type="button" onClick={addContact} disabled={saving} className="flex-1 py-2 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save contact'}
                </button>
                {!!contacts.length && (
                  <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <Plus className="w-3.5 h-3.5" /> Add new contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
