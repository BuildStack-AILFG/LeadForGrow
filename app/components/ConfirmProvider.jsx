'use client';

import { createContext, useContext, useCallback, useRef, useState } from 'react';
import ConfirmDialog from '@/app/automation/components/shared/ConfirmDialog';

/**
 * App-wide confirm/prompt system — the enterprise replacement for the native
 * window.confirm()/window.prompt() browser dialogs (which can't be themed,
 * block the JS thread, and show the ugly "site says…" chrome).
 *
 * Usage inside any client component/hook:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete?', message: '…', danger: true }))) return;
 *   const name = await confirm({ mode: 'prompt', title: 'Name', required: true });
 *
 * Returns: boolean for mode 'confirm'; the entered string (or null if
 * cancelled) for 'prompt'/'textarea'.
 */
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, opts: {} });
  const resolverRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, opts });
    });
  }, []);

  const finish = useCallback((result) => {
    setState((s) => ({ ...s, open: false }));
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(result);
  }, []);

  const { open, opts } = state;
  const isPrompt = opts.mode === 'prompt' || opts.mode === 'textarea';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={open}
        mode={opts.mode || 'confirm'}
        title={opts.title || 'Please confirm'}
        message={opts.message}
        placeholder={opts.placeholder}
        defaultValue={opts.defaultValue}
        required={opts.required}
        confirmLabel={opts.confirmLabel}
        cancelLabel={opts.cancelLabel}
        danger={opts.danger}
        onConfirm={(value) => finish(isPrompt ? (value ?? '') : true)}
        onCancel={() => finish(isPrompt ? null : false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
}
