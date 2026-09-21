'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { SEQUENCE_TEMPLATES } from '@/lib/sequences/templates';
import { createNode, TRIGGER_TYPES } from '@/lib/sequences/constants';
import { connectBlock, planAddAfter, nextNodePosition, hasTrigger, TRIGGER_EXISTS_MESSAGE } from '@/lib/sequences/canvasMath';
import { isBranchNode, isNoEdge, nextBranchLabel, flipBranchLabel } from '@/lib/sequences/edges';

export function useSequencesWorkspace() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sequences, setSequences] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [workspaceMode, setWorkspaceMode] = useState('home');
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDraft, setWizardDraft] = useState({
    name: '',
    description: '',
    category: 'custom',
    triggerType: 'new_lead',
    templateId: null,
  });
  const [builderTab, setBuilderTab] = useState('builder');
  const [draftNodes, setDraftNodes] = useState([]);
  const [draftEdges, setDraftEdges] = useState([]);
  const [draftMeta, setDraftMeta] = useState({
    name: '', description: '', category: 'custom', triggerType: 'new_lead', status: 'draft',
    triggerConfig: {}, abTest: { enabled: false, variants: [] }, webhookSecret: null, folderId: null,
  });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [testModeOpen, setTestModeOpen] = useState(false);
  const historyRef = useRef({ past: [], future: [] });
  const clipboardRef = useRef(null);

  const selectedSequence = useMemo(
    () => sequences.find((s) => s._id === selectedId) || null,
    [sequences, selectedId]
  );

  const stats = useMemo(() => {
    const active = sequences.filter((s) => s.status === 'active').length;
    const enrolled = sequences.reduce((n, s) => n + (s.analytics?.enrolled || 0), 0);
    const completed = sequences.reduce((n, s) => n + (s.analytics?.completed || 0), 0);
    const running = sequences.reduce((n, s) => n + (s.analytics?.activeRuns || 0), 0);
    return { total: sequences.length, active, enrolled, completed, running };
  }, [sequences]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/folders');
      const data = await res.json();
      if (data.success) setFolders(data.data || []);
    } catch {
      /* non-critical */
    }
  }, []);

  const fetchSequences = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (activeFolderId) params.set('folderId', activeFolderId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await authFetch(`/api/automation/sequences${qs}`);
      const data = await res.json();
      if (data.success) setSequences(data.data);
      else toast.error(data.error);
    } catch {
      toast.error('Failed to load sequences');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFolderId]);

  useEffect(() => { fetchSequences(); fetchFolders(); }, [fetchSequences, fetchFolders]);

  const loadExecutions = useCallback(async (id) => {
    if (!id) return;
    try {
      setExecutionsLoading(true);
      const [exRes, anRes] = await Promise.all([
        authFetch(`/api/automation/sequences/${id}/executions`),
        authFetch(`/api/automation/sequences/${id}/analytics`),
      ]);
      const exData = await exRes.json();
      const anData = await anRes.json();
      if (exData.success) setExecutions(exData.data);
      if (anData.success) setAnalytics(anData.data);
    } catch {
      toast.error('Failed to load execution data');
    } finally {
      setExecutionsLoading(false);
    }
  }, []);

  const pushHistory = useCallback(() => {
    historyRef.current.past.push({ nodes: draftNodes, edges: draftEdges });
    historyRef.current.future = [];
  }, [draftNodes, draftEdges]);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (!past.length) return;
    future.unshift({ nodes: draftNodes, edges: draftEdges });
    const prev = past.pop();
    setDraftNodes(prev.nodes);
    setDraftEdges(prev.edges);
  }, [draftNodes, draftEdges]);

  const redo = useCallback(() => {
    const { future } = historyRef.current;
    if (!future.length) return;
    historyRef.current.past.push({ nodes: draftNodes, edges: draftEdges });
    const next = future.shift();
    setDraftNodes(next.nodes);
    setDraftEdges(next.edges);
  }, [draftNodes, draftEdges]);

  const startWizard = () => {
    setWizardDraft({ name: '', description: '', category: 'custom', triggerType: 'new_lead', templateId: null });
    setWizardStep(1);
    setWorkspaceMode('wizard');
  };

  const openEditor = (seq) => {
    setSelectedId(seq._id);
    setDraftNodes(seq.nodes || []);
    setDraftEdges(seq.edges || []);
    setDraftMeta({
      name: seq.name,
      description: seq.description || '',
      category: seq.category || 'custom',
      triggerType: seq.triggerType || 'new_lead',
      status: seq.status || 'draft',
      triggerConfig: seq.triggerConfig || {},
      abTest: seq.abTest || { enabled: false, variants: [] },
      webhookSecret: seq.webhookSecret || null,
      folderId: seq.folderId || null,
    });
    setSelectedNodeId(null);
    historyRef.current = { past: [], future: [] };
    setWorkspaceMode('editor');
    setBuilderTab('simple');
    loadExecutions(seq._id);
  };

  const finishWizard = async (templateId) => {
    const triggerDef = TRIGGER_TYPES.find((t) => t.triggerKey === wizardDraft.triggerType);
    const triggerType = triggerDef?.type || 'trigger_new_lead';

    let nodes = [];
    let edges = [];

    if (templateId !== 'blank') {
      const template = SEQUENCE_TEMPLATES.find((t) => t.id === templateId);
      const built = template?.build?.() || { nodes: [], edges: [] };
      nodes = built.nodes || [];
      edges = built.edges || [];
    } else {
      const trigger = createNode(triggerType, { x: 280, y: 80 });
      const end = createNode('end', { x: 280, y: 280 });
      nodes = [trigger, end];
      edges = [{ id: `e_${trigger.id}_${end.id}`, source: trigger.id, target: end.id }];
    }

    if (nodes.length && !nodes.some((n) => n.type?.startsWith('trigger_'))) {
      const trigger = createNode(triggerType, { x: 280, y: 40 });
      nodes = [trigger, ...nodes];
      if (nodes[1]) {
        edges = [{ id: `e_${trigger.id}_${nodes[1].id}`, source: trigger.id, target: nodes[1].id }, ...edges];
      }
    }

    setDraftNodes(nodes);
    setDraftEdges(edges);
    setDraftMeta({
      name: wizardDraft.name,
      description: wizardDraft.description,
      category: wizardDraft.category,
      triggerType: wizardDraft.triggerType,
      status: 'draft',
    });
    setSelectedId(null);
    setWizardStep(1);
    setWorkspaceMode('editor');
    setBuilderTab('simple');
  };

  const saveSequence = async (activate = false) => {
    if (!draftMeta.name?.trim()) return toast.error('Sequence name required');

    setSaving(true);
    try {
      const payload = {
        name: draftMeta.name,
        description: draftMeta.description,
        category: draftMeta.category,
        triggerType: draftMeta.triggerType,
        triggerConfig: draftMeta.triggerConfig || {},
        abTest: draftMeta.abTest,
        nodes: draftNodes,
        edges: draftEdges,
        folderId: draftMeta.folderId || activeFolderId || null,
        status: activate ? 'active' : draftMeta.status,
      };

      const isNew = !selectedId;
      const url = isNew ? '/api/automation/sequences' : `/api/automation/sequences/${selectedId}`;
      const res = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(activate ? 'Sequence activated!' : 'Sequence saved');
      setSelectedId(data.data._id);
      setDraftMeta((m) => ({
        ...m,
        status: data.data.status,
        webhookSecret: data.data.webhookSecret || m.webhookSecret,
      }));
      await fetchSequences();
      if (activate) toast.success('Automation rule synced — toggle in Automation Rules if needed');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteSequence = async (id) => {
    try {
      const res = await authFetch(`/api/automation/sequences/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Sequence deleted');
      if (selectedId === id) {
        setWorkspaceMode('home');
        setSelectedId(null);
      }
      fetchSequences();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const updateNode = (nodeId, patch) => {
    pushHistory();
    setDraftNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...patch, data: { ...n.data, ...patch.data } } : n)));
  };

  // A second trigger would do nothing (the engine reads the first one) and is the usual mistake when someone
  // picks "Email Sent" from the Triggers list meaning the "Send Email" action.
  const refuseSecondTrigger = (type) => {
    if (String(type || '').startsWith('trigger_') && hasTrigger(draftNodes)) {
      toast.error(TRIGGER_EXISTS_MESSAGE(draftNodes), { duration: 7000 });
      return true;
    }
    return false;
  };

  const addNode = (type, position) => {
    if (refuseSecondTrigger(type)) return null;
    pushHistory();
    const node = createNode(type, position);
    setDraftNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
    return node;
  };

  // Library click with a node selected: place the node after it, make room below, and wire it into the
  // path (see planAddAfter). Nodes, edges and selection change together, so this is ONE undo step.
  const addNodeAfter = (type, sourceId) => {
    if (refuseSecondTrigger(type)) return null;
    const plan = planAddAfter({ nodes: draftNodes, edges: draftEdges, sourceId, newType: type });
    if (!plan) return addNode(type, nextNodePosition(draftNodes, null));
    pushHistory();
    const node = createNode(type, plan.position);
    setDraftNodes((prev) => [
      ...prev.map((n) => (plan.shiftIds.includes(n.id) ? { ...n, position: { ...n.position, y: n.position.y + plan.shiftBy } } : n)),
      node,
    ]);
    const branchSource = isBranchNode(draftNodes.find((n) => n.id === sourceId));
    setDraftEdges((prev) => {
      let next = prev;
      const old = plan.rewireEdgeId ? prev.find((e) => e.id === plan.rewireEdgeId) : null;
      if (old) {
        // The exit label (Yes / No) belongs to the source's exit, so it stays on source -> new; new -> old target has none.
        next = next.map((e) => (e.id === old.id
          ? { ...e, id: `e_${node.id}_${e.target}`, source: node.id, ...(branchSource ? { label: undefined, sourceHandle: undefined } : {}) }
          : e));
      }
      if (plan.chains) {
        const label = !branchSource ? null : (old ? (isNoEdge(old) ? 'No' : 'Yes') : nextBranchLabel(prev.filter((e) => e.source === sourceId)));
        // A branch node with both exits taken gets the node placed but not connected.
        if (!branchSource || label) {
          next = [...next, { id: `e_${sourceId}_${node.id}`, source: sourceId, target: node.id, ...(label ? { label } : {}) }];
        }
      }
      return next;
    });
    setSelectedNodeId(node.id);
    return node;
  };

  const removeNode = (nodeId) => {
    pushHistory();
    setDraftNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setDraftEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const duplicateNode = (nodeId) => {
    const src = draftNodes.find((n) => n.id === nodeId);
    if (!src) return;
    if (refuseSecondTrigger(src.type)) return;
    pushHistory();
    const copy = createNode(src.type, { x: src.position.x + 40, y: src.position.y + 40 });
    copy.data = { ...src.data };
    setDraftNodes((prev) => [...prev, copy]);
    setSelectedNodeId(copy.id);
  };

  const connectNodes = (source, target) => {
    // No self loops / duplicates, nothing into a trigger, nothing out of an End node.
    const block = connectBlock({ nodes: draftNodes, edges: draftEdges, source, target });
    if (block) {
      if (block.message) toast.error(block.message, { duration: 6000 }); // never let a refused line vanish silently
      return;
    }
    pushHistory();
    // Out of an If / Else the first exit is "Yes", the second "No" (the engine routes on these labels).
    const label = isBranchNode(draftNodes.find((n) => n.id === source))
      ? nextBranchLabel(draftEdges.filter((e) => e.source === source))
      : null;
    setDraftEdges((prev) => [...prev, { id: `e_${source}_${target}`, source, target, ...(label ? { label } : {}) }]);
  };

  // Swap an If / Else exit between Yes and No (the other exit takes the opposite label).
  const flipEdgeLabel = (edgeId) => {
    pushHistory();
    setDraftEdges((prev) => flipBranchLabel(prev, edgeId));
  };

  const removeEdge = (edgeId) => {
    pushHistory();
    setDraftEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  const moveNode = (nodeId, position) => {
    setDraftNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, position } : n)));
  };

  const copySelection = () => {
    if (!selectedNodeId) return toast.error('Select a node to copy');
    const node = draftNodes.find((n) => n.id === selectedNodeId);
    if (node) {
      clipboardRef.current = JSON.parse(JSON.stringify(node));
      toast.success('Node copied');
    }
  };

  const pasteSelection = () => {
    if (!clipboardRef.current) return toast.error('Nothing to paste');
    if (refuseSecondTrigger(clipboardRef.current.type)) return;
    pushHistory();
    const copy = createNode(clipboardRef.current.type, {
      x: (clipboardRef.current.position?.x || 0) + 40,
      y: (clipboardRef.current.position?.y || 0) + 40,
    });
    copy.data = { ...clipboardRef.current.data };
    setDraftNodes((prev) => [...prev, copy]);
    setSelectedNodeId(copy.id);
    toast.success('Node pasted');
  };

  const openTestMode = () => {
    if (!selectedId) return toast.error('Save sequence first');
    setTestModeOpen(true);
  };

  const runTestMode = async (leadId) => {
    if (!leadId) return;
    try {
      setSaving(true);
      const res = await authFetch(`/api/automation/sequences/${selectedId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, debugMode: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Test run complete — ${data.data.logs?.length || 0} steps`);
      setExecutions([data.data]);
      setBuilderTab('logs');
      setTestModeOpen(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (id, enabled) => {
    try {
      const res = await authFetch(`/api/automation/sequences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, status: enabled ? 'active' : 'paused' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(enabled ? 'Workflow enabled' : 'Workflow disabled');
      fetchSequences();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Folder mutations update local state directly from the server response
  // rather than relying only on a background fetchFolders() re-fetch — a
  // slow/in-flight re-fetch racing a Turbopack recompile could otherwise
  // resolve with stale data and leave a deleted/renamed folder showing
  // until the next full page load.
  const createFolder = async (name) => {
    if (!name?.trim()) return;
    const res = await authFetch('/api/automation/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Folder created');
      setFolders((prev) => [...prev, data.data]);
      fetchFolders();
    } else toast.error(data.error);
  };

  const renameFolder = async (id, name) => {
    const res = await authFetch(`/api/automation/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Folder renamed');
      setFolders((prev) => prev.map((f) => (f._id === id ? data.data : f)));
      fetchFolders();
    } else toast.error(data.error);
  };

  const deleteFolder = async (id) => {
    const res = await authFetch(`/api/automation/folders/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      if (activeFolderId === id) setActiveFolderId(null);
      toast.success('Folder deleted');
      setFolders((prev) => prev.filter((f) => f._id !== id));
      fetchFolders();
      fetchSequences();
    } else toast.error(data.error);
  };

  const moveSequenceToFolder = async (sequenceId, folderId) => {
    const res = await authFetch(`/api/automation/sequences/${sequenceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Moved to folder');
      fetchSequences();
    } else toast.error(data.error);
  };

  const duplicateSequence = async (seq) => {
    try {
      const res = await authFetch('/api/automation/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${seq.name} (copy)`,
          description: seq.description,
          category: seq.category,
          triggerType: seq.triggerType,
          triggerConfig: seq.triggerConfig,
          nodes: seq.nodes,
          edges: seq.edges,
          folderId: seq.folderId,
          status: 'draft',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Workflow duplicated');
      fetchSequences();
    } catch (e) {
      toast.error(e.message || 'Duplicate failed');
    }
  };

  const archiveSequence = async (id) => {
    try {
      const res = await authFetch(`/api/automation/sequences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Workflow archived');
      fetchSequences();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggleFolderFavorite = async (id, isFavorite) => {
    const res = await authFetch(`/api/automation/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite }),
    });
    const data = await res.json();
    if (data.success) {
      setFolders((prev) => prev.map((f) => (f._id === id ? data.data : f)));
      fetchFolders();
    }
  };

  const selectedNode = draftNodes.find((n) => n.id === selectedNodeId) || null;

  return {
    loading, saving, sequences, stats, selectedSequence, selectedId,
    workspaceMode, setWorkspaceMode, wizardStep, setWizardStep, wizardDraft, setWizardDraft,
    builderTab, setBuilderTab, draftNodes, draftEdges, draftMeta, setDraftMeta,
    selectedNodeId, setSelectedNodeId, selectedNode, executions, analytics, executionsLoading,
    searchQuery, setSearchQuery, folders, activeFolderId, setActiveFolderId,
    createFolder, renameFolder, deleteFolder, moveSequenceToFolder,
    duplicateSequence, archiveSequence, toggleFolderFavorite,
    startWizard, openEditor, finishWizard, saveSequence, deleteSequence,
    fetchSequences, loadExecutions, updateNode, addNode, addNodeAfter, removeNode, duplicateNode,
    connectNodes, removeEdge, flipEdgeLabel, moveNode, beginMove: pushHistory, undo, redo, setDraftNodes, setDraftEdges,
    copySelection, pasteSelection, openTestMode, runTestMode, testModeOpen, setTestModeOpen, toggleEnabled,
    templates: SEQUENCE_TEMPLATES,
  };
}
