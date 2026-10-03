'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';

const POLL_MS = 60 * 1000;

const newKey = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '');

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.error || 'Request failed');
  return data.data ?? data;
}

/**
 * Leak Radar page state. Counts and the queue refresh every minute while the
 * tab is visible; the ledger and settings load when their tab opens.
 * Actions update the list at once and roll back if the server says no.
 */
export function useLeakRadar() {
  const [summary, setSummary] = useState(null);
  const [flags, setFlags] = useState([]);
  const [counts, setCounts] = useState({});
  const [tab, setTab] = useState(null); // decided once we know the role
  const [rule, setRule] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [ledgerDays, setLedgerDays] = useState(30);
  const [team, setTeam] = useState([]);
  const [busy, setBusy] = useState({}); // flagId -> true while an action runs
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const loadSummary = useCallback(async () => {
    const data = await json(await authFetch('/api/automation/leak/summary'));
    setSummary(data);
    return data;
  }, []);

  const loadFlags = useCallback(async (opts = {}) => {
    const t = opts.tab ?? tabRef.current;
    if (t !== 'radar' && t !== 'mine') return;
    const qs = new URLSearchParams({ scope: t === 'mine' ? 'mine' : 'all' });
    const r = opts.rule ?? rule;
    const a = opts.assignee ?? assignee;
    if (r !== 'all') qs.set('rule', r);
    if (t === 'radar' && a !== 'all') qs.set('assignedTo', a);
    if (!opts.silent) setListLoading(true);
    try {
      const data = await json(await authFetch(`/api/automation/leak/flags?${qs}`));
      setFlags(data.items || []);
      setCounts({ ...(data.counts || {}), all: data.totalLeads || 0 });
    } catch (e) {
      if (!opts.silent) toast.error(e.message);
    } finally {
      if (!opts.silent) setListLoading(false);
    }
  }, [rule, assignee]);

  // First load: role decides the opening tab (managers see the whole radar).
  useEffect(() => {
    (async () => {
      try {
        const s = await loadSummary();
        const first = s.manager ? 'radar' : 'mine';
        setTab(first);
        if (s.enabled) await loadFlags({ tab: first });
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh counts + queue every minute while the page is visible.
  useEffect(() => {
    if (!summary?.enabled) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      loadSummary().catch(() => {});
      loadFlags({ silent: true });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [summary?.enabled, loadSummary, loadFlags]);

  const changeTab = useCallback((t) => {
    setTab(t);
    if (t === 'radar' || t === 'mine') loadFlags({ tab: t });
    if (t === 'ledger' && !ledger) {
      authFetch(`/api/automation/leak/ledger?days=${ledgerDays}`).then(json).then(setLedger).catch((e) => toast.error(e.message));
    }
    if (t === 'settings' && !settings) {
      authFetch('/api/automation/leak/settings').then(json).then(setSettings).catch((e) => toast.error(e.message));
    }
  }, [loadFlags, ledger, ledgerDays, settings]);

  const changeLedgerDays = useCallback((d) => {
    setLedgerDays(d);
    setLedger(null);
    authFetch(`/api/automation/leak/ledger?days=${d}`).then(json).then(setLedger).catch((e) => toast.error(e.message));
  }, []);

  const changeRule = (r) => { setRule(r); loadFlags({ rule: r }); };
  const changeAssignee = (a) => { setAssignee(a); loadFlags({ assignee: a }); };
  const openQueueFor = (a) => { setTab('radar'); setRule('all'); setAssignee(a); loadFlags({ tab: 'radar', rule: 'all', assignee: a }); };

  const ensureTeam = useCallback(async () => {
    if (team.length) return team;
    const data = await json(await authFetch('/api/automation/team'));
    const list = (data || [])
      .map((m) => ({ id: m.userId?._id, name: [m.userId?.firstName, m.userId?.lastName].filter(Boolean).join(' ') || m.userId?.email }))
      .filter((m) => m.id);
    setTeam(list);
    return list;
  }, [team]);

  /**
   * Act on one lead's leaks: `before` runs the CRM side effect once (send,
   * reassign, task, stage), then the action is recorded on each open leak of
   * that lead. Keys are generated per leak, so a retry never double-records.
   */
  const act = useCallback(async (item, actionType, { note, snoozeHours, assignedTo, before, successText, keepInList } = {}) => {
    const key = item.leadId;
    if (busy[key]) return false;
    setBusy((b) => ({ ...b, [key]: true }));
    const snapshot = flags;
    if (!keepInList) setFlags((list) => list.filter((i) => i.leadId !== key));
    try {
      let externalMessageId;
      if (before) externalMessageId = await before();
      await Promise.all(item.flags.map(async (f) => json(await authFetch(`/api/automation/leak/flags/${f.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, idempotencyKey: newKey(), note, snoozeHours, assignedTo, externalMessageId }),
      }))));
      if (successText) toast.success(successText);
      loadSummary().catch(() => {});
      return true;
    } catch (e) {
      setFlags(snapshot);
      toast.error(e.message);
      return false;
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[key]; return n; });
    }
  }, [busy, flags, loadSummary]);

  // --- Actions (side effects go through the CRM's existing APIs) ---
  const sendTemplate = (flag, { templateName, templateLanguage, templateVariables, preview }) => act(flag, 'message_sent', {
    successText: `Sent to ${flag.lead.name}`,
    before: async () => {
      const data = await json(await authFetch('/api/automation/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: flag.leadId, channel: 'whatsapp', message: preview || '', templateName, templateLanguage, templateVariables }),
      }));
      return data?.messageId || data?._id;
    },
  });

  const reassign = (flag, member) => act(flag, 'reassigned', {
    assignedTo: member.id,
    successText: `Given to ${member.name}`,
    keepInList: tabRef.current === 'radar',
    before: async () => {
      await json(await authFetch(`/api/automation/leads/${flag.leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: member.id }),
      }));
    },
  }).then((done) => {
    if (done && tabRef.current === 'radar') {
      setFlags((list) => list.map((i) => (i.leadId === flag.leadId ? { ...i, inProgress: true, assignedTo: { id: member.id, name: member.name } } : i)));
    }
    return done;
  });

  const createTask = (flag) => act(flag, 'task_created', {
    successText: 'Follow-up task added for tomorrow 10:00',
    keepInList: true,
    before: async () => {
      const due = new Date();
      due.setDate(due.getDate() + 1);
      due.setHours(10, 0, 0, 0);
      await json(await authFetch('/api/automation/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: flag.leadId,
          type: flag.lead.channel === 'email' ? 'email' : 'call',
          title: `Follow up with ${flag.lead.name}`,
          description: flag.flags.map((f) => f.reason).join(' '),
          dueDate: due.toISOString(),
          assignedTo: flag.assignedTo?.id || getUserId(),
          priority: flag.severity === 'high' ? 'high' : 'medium',
        }),
      }));
    },
  }).then((done) => {
    if (done) setFlags((list) => list.map((i) => (i.leadId === flag.leadId ? { ...i, inProgress: true } : i)));
    return done;
  });

  const markUnqualified = (flag, note) => act(flag, 'marked_unqualified', {
    note,
    successText: 'Marked unqualified',
    before: async () => {
      await json(await authFetch(`/api/automation/leads/${flag.leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unqualified', unqualifiedReason: note }),
      }));
    },
  });

  const workedOutside = (flag, note) => act(flag, 'worked_outside', { note, successText: 'Logged. Thanks for closing the loop.' });
  const snooze = (flag, hours, note) => act(flag, 'snoozed', { snoozeHours: hours, note, successText: `Snoozed for ${hours < 24 ? `${hours}h` : `${hours / 24}d`}` });
  const dismiss = (flag, note) => act(flag, 'dismissed', { note, successText: 'Marked not a leak' });

  const saveSettings = useCallback(async (patch) => {
    let data;
    try {
      data = await json(await authFetch('/api/automation/leak/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }));
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
    setSettings(data);
    const s = await loadSummary();
    if (data.firstScan) toast.success(`Leak Radar is on. First scan found ${data.firstScan.open} leak${data.firstScan.open === 1 ? '' : 's'}.`);
    else toast.success('Saved');
    if (s.enabled && (tabRef.current === 'radar' || tabRef.current === 'mine')) loadFlags({});
    return data;
  }, [loadSummary, loadFlags]);

  const scanNow = useCallback(async () => {
    let data;
    try {
      data = await json(await authFetch('/api/automation/leak/scan', { method: 'POST' }));
    } catch (e) {
      toast.error(e.message);
      return;
    }
    if (data.skipped) toast('Scanned less than a minute ago');
    else toast.success(`Scan done: ${data.open} open`);
    await loadSummary();
    await loadFlags({});
  }, [loadSummary, loadFlags]);

  return {
    loading, listLoading, summary, flags, counts, tab, rule, assignee, settings, ledger, ledgerDays, team, busy,
    changeTab, changeRule, changeAssignee, openQueueFor, changeLedgerDays, ensureTeam,
    sendTemplate, reassign, createTask, markUnqualified, workedOutside, snooze, dismiss,
    saveSettings, scanNow, setSettings,
  };
}
