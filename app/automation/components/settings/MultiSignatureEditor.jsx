'use client';

/**
 * Multi-signature editor for a single EmailAccount.
 *
 * Wraps the existing RichSignatureEditor and adds Hostinger-style
 * management: dropdown of saved signatures, create new, rename,
 * delete, make default, save.
 *
 * Two modes:
 *
 *   Standalone (default) — used inside the connected-account accordion.
 *     Holds its own draft state, shows a Save button, calls onSave when
 *     the user clicks Save.
 *
 *   Embedded (embedded={true}) — used inside the "Add mailbox" forms
 *     where no server-side row exists yet. Hides Save button and fires
 *     onChange(signatures) on every mutation so the parent form can
 *     include the signatures array in its own submit payload.
 *
 * Contract:
 *   account   → EmailAccount doc (or {email, displayName} in embedded mode)
 *   busy      → external save-in-progress flag
 *   embedded  → true to hide Save + emit live changes via onChange
 *   onSave(signatures)   → parent persists the array via PATCH (standalone)
 *   onChange(signatures) → parent stores the array in its own state (embedded)
 *
 * Legacy migration: if the account has no `signatures[]` entries but has
 * a legacy `signature` string, we synthesize one entry named "Default"
 * on first render so the user's existing content isn't lost.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Star, ChevronDown, Check } from 'lucide-react';
import RichSignatureEditor from './RichSignatureEditor';
import { useConfirm } from '@/app/components/ConfirmProvider';

function newId() {
  return `sig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function synthesizeFromLegacy(account) {
  const legacy = (account?.signature || '').trim();
  if (!legacy) return [];
  return [
    {
      id: newId(),
      name: 'Default',
      html: legacy,
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function normalize(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const cleaned = list.map((s) => ({
    id: s.id || newId(),
    name: (s.name || '').trim() || 'Signature',
    html: typeof s.html === 'string' ? s.html : '',
    isDefault: !!s.isDefault,
    createdAt: s.createdAt || new Date().toISOString(),
  }));
  let sawDefault = false;
  for (const s of cleaned) {
    if (s.isDefault && !sawDefault) sawDefault = true;
    else s.isDefault = false;
  }
  if (!sawDefault) cleaned[0].isDefault = true;
  return cleaned;
}

export default function MultiSignatureEditor({
  account,
  busy,
  onSave,
  onChange,
  embedded = false,
}) {
  const confirm = useConfirm();
  // Local draft state — parent persists via onSave. We only push on Save,
  // so users can experiment without every keystroke round-tripping.
  const initial = useMemo(() => {
    const existing = Array.isArray(account?.signatures) ? account.signatures : [];
    if (existing.length > 0) return normalize(existing);
    return synthesizeFromLegacy(account);
  }, [account?._id]);

  const [signatures, setSignatures] = useState(initial);
  const [selectedId, setSelectedId] = useState(() => initial[0]?.id || null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Sync when account changes (e.g. parent re-fetches after a save).
  useEffect(() => {
    setSignatures(initial);
    setSelectedId((prev) => (initial.find((s) => s.id === prev) ? prev : initial[0]?.id || null));
  }, [initial]);

  // Embedded mode: bubble every state change up to the parent form so it
  // can include the signatures array in its submit payload.
  //
  // Stash onChange in a ref so its (usually unstable) identity doesn't get
  // it into the dependency array. Without this, a parent passing an
  // inline arrow like `onChange={(s) => setForm({...form, signatures: s})}`
  // rebuilds the callback every render → this effect refires → calls
  // parent → parent re-renders → new callback → infinite loop.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    if (embedded && onChangeRef.current) onChangeRef.current(signatures);
  }, [signatures, embedded]);

  const selected = signatures.find((s) => s.id === selectedId) || null;

  // Dirty check: has anything changed vs. what came from the server?
  const original = useMemo(() => JSON.stringify(initial), [initial]);
  const current = useMemo(() => JSON.stringify(signatures), [signatures]);
  const dirty = original !== current;

  const updateSelected = (patch) => {
    setSignatures((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)));
  };

  const createNew = () => {
    const nextName = `Signature ${signatures.length + 1}`;
    const entry = {
      id: newId(),
      name: nextName,
      html: '',
      isDefault: signatures.length === 0,
      createdAt: new Date().toISOString(),
    };
    setSignatures((prev) => [...prev, entry]);
    setSelectedId(entry.id);
    setPickerOpen(false);
  };

  const deleteSelected = async () => {
    if (!selected) return;
    if (!(await confirm({ title: 'Delete signature', message: `Delete signature "${selected.name}"? This can't be undone.`, confirmLabel: 'Delete', danger: true }))) return;
    setSignatures((prev) => {
      const next = prev.filter((s) => s.id !== selectedId);
      // If we deleted the default, promote the first remaining one so we
      // never end up with zero defaults.
      if (selected.isDefault && next.length > 0) next[0].isDefault = true;
      return next;
    });
    setSelectedId(() => {
      const remaining = signatures.filter((s) => s.id !== selectedId);
      return remaining[0]?.id || null;
    });
  };

  const makeDefault = () => {
    setSignatures((prev) => prev.map((s) => ({ ...s, isDefault: s.id === selectedId })));
  };

  const save = () => {
    onSave(normalize(signatures));
  };

  // Empty state — no signatures yet. Show a big "Create" CTA rather than
  // an empty editor that confuses users.
  if (signatures.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">You don't have any signatures yet.</p>
        <button
          type="button"
          onClick={createNew}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          <Plus className="h-4 w-4" />
          Create your first signature
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header: dropdown + create-new */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300"
          >
            <span className="flex items-center gap-2">
              <span className="truncate font-medium text-slate-800">{selected?.name || 'Select…'}</span>
              {selected?.isDefault && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                  Default
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                {signatures.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      setPickerOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      s.id === selectedId ? 'bg-slate-50' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {s.id === selectedId && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      <span className="truncate">{s.name}</span>
                    </span>
                    {s.isDefault && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={createNew}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Create new
        </button>
      </div>

      {/* Rename input */}
      {selected && (
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Signature name
          </label>
          <input
            value={selected.name}
            onChange={(e) => updateSelected({ name: e.target.value.slice(0, 60) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. Sales team, HR, Personal"
          />
        </div>
      )}

      {/* Rich editor for the selected signature */}
      {selected && (
        <RichSignatureEditor
          key={selected.id}
          value={selected.html}
          onChange={(html) => updateSelected({ html })}
          displayName={account?.displayName || account?.email}
          email={account?.email}
          disabled={busy}
          placeholder={'Best regards,\nYour name\nTitle · Company'}
        />
      )}

      {/* Actions — mirrors Hostinger: Delete on left, Make default + Save on right */}
      {selected && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={deleteSelected}
            disabled={busy || signatures.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete signature
          </button>
          <div className="flex items-center gap-2">
            {!selected.isDefault && (
              <button
                type="button"
                onClick={makeDefault}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Star className="h-3.5 w-3.5" />
                Make default
              </button>
            )}
            {!embedded && (
              <button
                type="button"
                onClick={save}
                disabled={!dirty || busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-black disabled:opacity-40"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
