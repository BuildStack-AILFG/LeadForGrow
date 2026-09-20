'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  useReactFlow,
  useOnViewportChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  History,
  FlaskConical,
  LayoutGrid,
  MessageCircle,
  MoreHorizontal,
  FileDown,
  Copy,
  Trash2,
  Grid3x3,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { useTheme } from '@/app/components/ThemeContext';
import { getDefaultNodeData } from '@/lib/whatsappFlows/constants';
import { flowNodeTypes } from './FlowNodeCard';
import { FlowActionsContext } from './FlowActionsContext';
import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';
import TemplateGalleryModal from './TemplateGalleryModal';

function autoLayoutNodes(nodes) {
  const cols = 3;
  return nodes.map((n, i) => ({
    ...n,
    position: {
      x: 80 + (i % cols) * 280,
      y: 80 + Math.floor(i / cols) * 150,
    },
  }));
}

const STATUS_PILL = {
  draft: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  published: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  archived: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

const PANEL_WIDTH = 320;

function ActivateToggle({ active, onChange, disabled }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        disabled={disabled}
        onClick={() => onChange(!active)}
        className={`relative w-9 h-5 rounded-full transition-colors ${active ? 'bg-brand' : 'bg-slate-300'} disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : ''}`}
        />
      </button>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">Activate Workflow</span>
    </label>
  );
}

function FlowBuilderInner({ flowId }) {
  const confirm = useConfirm();
  const { theme } = useTheme() || { theme: 'light' };
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [testOpen, setTestOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testMessage, setTestMessage] = useState('hi');
  const [menuOpen, setMenuOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef(null);
  const canvasRef = useRef(null);
  const menuRef = useRef(null);
  const { screenToFlowPosition, flowToScreenPosition, getNode, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) || null,
    [nodes, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFlow(data.data);
      setNodes(
        (data.data.nodes || []).map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position || { x: 0, y: 0 },
          data: n.data || getDefaultNodeData(n.type),
        }))
      );
      setEdges(
        (data.data.edges || []).map((e) => ({
          ...e,
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }))
      );
      setVersions(data.data.versions || []);
      setDirty(false);
    } catch (err) {
      toast.error(err.message || 'Failed to load flow');
    } finally {
      setLoading(false);
    }
  }, [flowId, setNodes, setEdges]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async ({ silent = false, createVersion = false } = {}) => {
      setSaving(true);
      try {
        const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: flow?.name,
            description: flow?.description,
            triggerType: flow?.triggerType,
            triggerConfig: flow?.triggerConfig,
            testStartNodeKey: flow?.testStartNodeKey ?? null,
            nodes: nodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: n.data,
            })),
            edges: edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle || 'default',
              targetHandle: e.targetHandle || 'default',
              label: e.label || '',
            })),
            createVersion,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setFlow((prev) => ({ ...prev, ...data.data, nodes: data.data.nodes }));
        setDirty(false);
        if (!silent) toast.success('Saved');
      } catch (err) {
        toast.error(err.message || 'Save failed');
      } finally {
        setSaving(false);
      }
    },
    [flowId, flow, nodes, edges]
  );

  useEffect(() => {
    if (!dirty || !flow) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist({ silent: true }), 1500);
    return () => clearTimeout(saveTimer.current);
  }, [dirty, nodes, edges, flow?.name, persist, flow]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        persist();
      }
      if (e.key === 'Delete' && selectedId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        deleteNode(selectedId);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist, selectedId]);

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `e_${connection.source}_${connection.target}_${Date.now()}`,
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          },
          eds
        )
      );
      setDirty(true);
    },
    [setEdges]
  );

  function addNode(type, position, dataOverrides) {
    const id = `${type}_${Date.now()}`;
    const pos = position || { x: 200 + nodes.length * 24, y: 120 + nodes.length * 24 };
    setNodes((nds) => [...nds, { id, type, position: pos, data: { ...getDefaultNodeData(type), ...dataOverrides } }]);
    setSelectedId(id);
    setDirty(true);
  }

  function duplicateNode(id) {
    const original = nodes.find((n) => n.id === id);
    if (!original) return;
    const newId = `${original.type}_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        ...original,
        id: newId,
        position: { x: original.position.x + 32, y: original.position.y + 32 },
        data: { ...original.data },
        selected: false,
      },
    ]);
    setSelectedId(newId);
    setDirty(true);
  }

  function deleteNode(id) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setFlow((f) => (f?.testStartNodeKey === id ? { ...f, testStartNodeKey: null } : f));
    setDirty(true);
  }

  function setCardColor(id, color) {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, cardColor: color } } : n)));
    setDirty(true);
  }

  function setStartNode(id) {
    setFlow((f) => ({ ...f, testStartNodeKey: f?.testStartNodeKey === id ? null : id }));
    setDirty(true);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;
    addNode(type, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }

  async function publish() {
    await persist({ silent: true });
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFlow((prev) => ({ ...prev, ...data.data }));
      toast.success('Published');
      load();
    } catch (err) {
      toast.error(err.message || 'Publish failed');
    }
  }

  async function deactivate() {
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFlow((prev) => ({ ...prev, ...data.data }));
      toast.success('Deactivated');
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate');
    }
  }

  async function runTest() {
    await persist({ silent: true });
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage, name: 'Test Customer', phone: '919999999999' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTestResult(data.data);
      toast.success(`Test: ${data.data.status}`);
    } catch (err) {
      toast.error(err.message || 'Test failed');
    }
  }

  async function restoreVersion(version) {
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Restored v${version}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Restore failed');
    }
  }

  async function duplicateFlowAndOpen() {
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Duplicated');
      window.location.href = `/automation/whatsapp-flows/${data.data._id}`;
    } catch (err) {
      toast.error(err.message || 'Duplicate failed');
    }
  }

  async function exportFlowJson() {
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}/export`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(flow?.name || 'flow').replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  }

  async function exportResponses() {
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}/executions/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(flow?.name || 'flow').replace(/\s+/g, '-').toLowerCase()}-responses.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  }

  async function deleteFlowAndBack() {
    if (!(await confirm({ title: 'Delete flow', message: 'Delete this flow and all versions?', confirmLabel: 'Delete', danger: true }))) return;
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${flowId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Deleted');
      window.location.href = '/automation/whatsapp-flows';
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }

  function insertTemplateNode(template) {
    addNode('action_send_template', undefined, {
      templateName: template.name,
      language: template.language || 'en',
    });
    setTemplateGalleryOpen(false);
  }

  // --- Anchor the node config panel next to the selected node on the canvas ---
  const [panelPos, setPanelPos] = useState(null);

  const recomputePanelPos = useCallback(() => {
    if (!selectedId || !canvasRef.current) {
      setPanelPos(null);
      return;
    }
    const n = getNode(selectedId);
    if (!n) {
      setPanelPos(null);
      return;
    }
    const width = n.measured?.width || 200;
    const height = n.measured?.height || 100;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const topRight = flowToScreenPosition({ x: n.position.x + width, y: n.position.y });
    let left = topRight.x - canvasRect.left + 16;
    const top = Math.min(
      Math.max(8, topRight.y - canvasRect.top),
      Math.max(8, canvasRect.height - 8)
    );
    if (left + PANEL_WIDTH > canvasRect.width - 8) {
      const topLeft = flowToScreenPosition({ x: n.position.x, y: n.position.y });
      left = topLeft.x - canvasRect.left - PANEL_WIDTH - 16;
    }
    left = Math.max(8, Math.min(left, canvasRect.width - PANEL_WIDTH - 8));
    setPanelPos({ left, top });
  }, [selectedId, getNode, flowToScreenPosition]);

  // Recompute only when the selected node's own position/size changes (drag, auto-layout,
  // selection change) — NOT on every keystroke while editing its data, which would otherwise
  // shift the panel out from under the user's cursor while typing.
  const selectedNodeGeometry = selectedNode
    ? `${selectedNode.position.x},${selectedNode.position.y},${selectedNode.measured?.width},${selectedNode.measured?.height}`
    : null;
  useEffect(() => {
    recomputePanelPos();
  }, [recomputePanelPos, selectedNodeGeometry]);

  useOnViewportChange({ onChange: recomputePanelPos });

  const flowActions = useMemo(
    () => ({
      startNodeKey: flow?.testStartNodeKey || null,
      onEdit: (id) => setSelectedId(id),
      onDuplicate: duplicateNode,
      onDelete: deleteNode,
      onSetStartNode: setStartNode,
      onSetCardColor: setCardColor,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flow?.testStartNodeKey, nodes]
  );

  if (loading) {
    return (
      <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
        Loading builder…
      </div>
    );
  }

  const isActive = flow?.status === 'published';

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] min-h-[640px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50" data-theme="light">
      <header className="sticky top-0 z-40 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2">
        <Link
          href="/automation/whatsapp-flows"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Go back to all Workflows</span>
        </Link>

        <div className="w-6 h-6 rounded bg-brand flex items-center justify-center shrink-0 hidden sm:flex">
          <MessageCircle className="w-3.5 h-3.5 text-white" />
        </div>

        <input
          value={flow?.name || ''}
          onChange={(e) => {
            setFlow((f) => ({ ...f, name: e.target.value }));
            setDirty(true);
          }}
          className="text-sm font-semibold bg-transparent text-slate-900 dark:text-slate-50 focus:outline-none border-b border-transparent focus:border-brand min-w-[120px] max-w-[220px] truncate"
        />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute top-8 left-0 z-30 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
              <button
                type="button"
                onClick={() => {
                  setVersionsOpen((v) => !v);
                  setTestOpen(false);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-tint"
              >
                <History className="w-3.5 h-3.5 text-slate-400" /> Versions
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestOpen((v) => !v);
                  setVersionsOpen(false);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-tint"
              >
                <FlaskConical className="w-3.5 h-3.5 text-slate-400" /> Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setNodes((nds) => autoLayoutNodes(nds));
                  setDirty(true);
                  setMenuOpen(false);
                  setTimeout(() => fitView({ padding: 0.2 }), 50);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-tint"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" /> Auto layout
              </button>
              <button
                type="button"
                onClick={() => {
                  duplicateFlowAndOpen();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-tint"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" /> Duplicate flow
              </button>
              <button
                type="button"
                onClick={() => {
                  exportFlowJson();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-brand-tint"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-400" /> Export flow (.json)
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  deleteFlowAndBack();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete flow
              </button>
            </div>
          )}
        </div>

        {dirty && <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Unsaved</span>}
        {saving && <span className="text-[11px] text-slate-400">Saving…</span>}
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_PILL[flow?.status] || STATUS_PILL.draft}`}>
          {flow?.status}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setTemplateGalleryOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden md:inline">Template gallery</span>
          </button>
          <button
            type="button"
            onClick={exportResponses}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden md:inline">Export Workflow Responses</span>
          </button>
          <ActivateToggle active={isActive} onChange={(next) => (next ? publish() : deactivate())} />
          <button
            type="button"
            onClick={() => persist()}
            className="inline-flex items-center px-4 py-2 rounded bg-brand text-white text-sm font-semibold hover:bg-[#173d32] transition-colors"
          >
            Save Workflow
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 gap-3 p-3 bg-[#F8F9FA] dark:bg-slate-900">
        <NodePalette onAdd={addNode} hasTrigger={nodes.some((n) => String(n.type).startsWith('trigger_'))} />

        <div
          ref={canvasRef}
          className="flex-1 relative rounded-lg border border-slate-200 dark:border-slate-700 bg-[#eef1f8] dark:bg-slate-800 overflow-hidden shadow-sm"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={() => setShowMiniMap((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              Switch View
            </button>
          </div>

          <FlowActionsContext.Provider value={flowActions}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={(changes) => {
                onNodesChange(changes);
                setDirty(true);
              }}
              onEdgesChange={(changes) => {
                onEdgesChange(changes);
                setDirty(true);
              }}
              onConnect={onConnect}
              onSelectionChange={({ nodes: sel }) => setSelectedId(sel[0]?.id || null)}
              onMoveEnd={recomputePanelPos}
              nodeTypes={flowNodeTypes}
              fitView
              fitViewOptions={{ maxZoom: 1, padding: 0.3 }}
              colorMode={theme === 'dark' ? 'dark' : 'light'}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color={theme === 'dark' ? '#334155' : '#c5cddb'} />
              <Controls
                position="bottom-right"
                className="!bg-white !border-slate-200 !shadow-lg !rounded-xl overflow-hidden !text-slate-600 dark:!bg-slate-900 dark:!border-slate-700 dark:!text-slate-300"
              />
              {showMiniMap && (
                <MiniMap
                  position="bottom-left"
                  className="!bg-white !border-slate-200 !rounded-xl !shadow-lg dark:!bg-slate-900 dark:!border-slate-700"
                  nodeColor={(n) =>
                    String(n.type).startsWith('trigger_')
                      ? '#1D4B3E'
                      : String(n.type).startsWith('logic_')
                        ? '#B45309'
                        : '#2F6B58'
                  }
                />
              )}
            </ReactFlow>
          </FlowActionsContext.Provider>

          {selectedNode && panelPos && (
            <div
              className="absolute z-20"
              style={{ left: panelPos.left, top: panelPos.top, width: PANEL_WIDTH, maxHeight: 'calc(100% - 16px)' }}
            >
              <NodeEditor
                node={selectedNode}
                variables={flow?.variables}
                onChange={(nextData) => {
                  setNodes((nds) => nds.map((n) => (n.id === selectedId ? { ...n, data: nextData } : n)));
                  setDirty(true);
                }}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}

          {versionsOpen && (
            <div className="absolute top-14 right-3 w-72 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3 shadow-xl z-10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Version history</h4>
              {(versions.length ? versions : []).map((v) => (
                <button
                  key={v._id || v.version}
                  type="button"
                  onClick={() => restoreVersion(v.version)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand-tint text-xs mb-1 transition-colors"
                >
                  <div className="text-slate-900 dark:text-slate-50 font-semibold">
                    v{v.version} {v.published ? '· published' : ''}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">{v.note || 'Snapshot'}</div>
                </button>
              ))}
              {!versions.length && <p className="text-slate-500 dark:text-slate-400 text-xs px-1">No versions yet — publish to create one</p>}
            </div>
          )}

          {testOpen && (
            <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:w-96 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-4 shadow-xl z-10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Test flow</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                Simulate an inbound WhatsApp message before publishing.
                {flow?.testStartNodeKey && (
                  <span className="block mt-1 text-brand-ink">Starting from the marked start node.</span>
                )}
              </p>
              <input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full mb-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                placeholder="Simulated inbound message"
              />
              <button
                type="button"
                onClick={runTest}
                className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold shadow-sm"
              >
                Run simulation
              </button>
              {testResult && (
                <div className="mt-3 max-h-40 overflow-y-auto text-[11px] space-y-1 custom-scrollbar">
                  <div className="text-slate-500 dark:text-slate-400">
                    Status: <span className="font-semibold text-slate-900 dark:text-slate-50">{testResult.status}</span>
                  </div>
                  {(testResult.logs || []).map((log, i) => (
                    <div key={i} className="text-slate-500 dark:text-slate-400 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                      [{log.status}] {log.nodeType || ''} — {log.message || ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {templateGalleryOpen && (
        <TemplateGalleryModal onClose={() => setTemplateGalleryOpen(false)} onSelect={insertTemplateNode} />
      )}
    </div>
  );
}

export default function FlowBuilder({ flowId }) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner flowId={flowId} />
    </ReactFlowProvider>
  );
}
