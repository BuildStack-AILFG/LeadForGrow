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
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Rocket,
  History,
  FlaskConical,
  LayoutGrid,
  MessageCircle,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { getDefaultNodeData } from '@/lib/whatsappFlows/constants';
import { flowNodeTypes } from './FlowNodeCard';
import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';

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
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
};

function FlowBuilderInner({ flowId }) {
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [testOpen, setTestOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testMessage, setTestMessage] = useState('hi');
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

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
        setNodes((nds) => nds.filter((n) => n.id !== selectedId));
        setEdges((eds) => eds.filter((ed) => ed.source !== selectedId && ed.target !== selectedId));
        setSelectedId(null);
        setDirty(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [persist, selectedId, setNodes, setEdges]);

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

  function addNode(type, position) {
    const id = `${type}_${Date.now()}`;
    const pos = position || { x: 200 + nodes.length * 24, y: 120 + nodes.length * 24 };
    setNodes((nds) => [...nds, { id, type, position: pos, data: getDefaultNodeData(type) }]);
    setSelectedId(id);
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

  if (loading) {
    return (
      <div className="min-h-full bg-[#f4f6fa] flex items-center justify-center text-slate-500 text-sm">
        Loading builder…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] min-h-[640px] bg-[#f4f6fa] text-slate-900" data-theme="light">
      <header className="sticky top-0 z-40 shrink-0 bg-white/90 backdrop-blur border-b border-slate-200 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2">
        <Link
          href="/automation/whatsapp-flows"
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20 hidden sm:flex">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>

        <input
          value={flow?.name || ''}
          onChange={(e) => {
            setFlow((f) => ({ ...f, name: e.target.value }));
            setDirty(true);
          }}
          className="text-lg font-bold bg-transparent text-slate-900 focus:outline-none border-b border-transparent focus:border-teal-400 min-w-[140px] max-w-[240px]"
        />

        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_PILL[flow?.status] || STATUS_PILL.draft}`}>
          {flow?.status}
        </span>
        {dirty && <span className="text-[11px] text-amber-600 font-medium">Unsaved</span>}
        {saving && <span className="text-[11px] text-slate-400">Saving…</span>}

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setNodes((nds) => autoLayoutNodes(nds));
              setDirty(true);
              setTimeout(() => fitView({ padding: 0.2 }), 50);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto layout</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setVersionsOpen((v) => !v);
              setTestOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Versions</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTestOpen((v) => !v);
              setVersionsOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-sm font-medium text-amber-700 hover:bg-amber-50"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test</span>
          </button>
          <button
            type="button"
            onClick={() => persist()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={publish}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <Rocket className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 gap-3 p-3">
        <NodePalette onAdd={addNode} />

        <div
          className="flex-1 relative rounded-2xl border border-slate-200/80 bg-[#eef1f8] overflow-hidden shadow-sm"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
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
            nodeTypes={flowNodeTypes}
            fitView
            colorMode="light"
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#c5cddb" />
            <Controls className="!bg-white !border-slate-200 !shadow-lg !rounded-xl overflow-hidden !text-slate-600" />
            <MiniMap
              className="!bg-white !border-slate-200 !rounded-xl !shadow-lg"
              nodeColor={(n) =>
                String(n.type).startsWith('trigger_')
                  ? '#3b82f6'
                  : String(n.type).startsWith('logic_')
                    ? '#f59e0b'
                    : '#10b981'
              }
            />
          </ReactFlow>

          {versionsOpen && (
            <div className="absolute top-3 right-3 w-72 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3 shadow-xl z-10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Version history</h4>
              {(versions.length ? versions : []).map((v) => (
                <button
                  key={v._id || v.version}
                  type="button"
                  onClick={() => restoreVersion(v.version)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50 text-xs mb-1 transition-colors"
                >
                  <div className="text-slate-900 font-semibold">
                    v{v.version} {v.published ? '· published' : ''}
                  </div>
                  <div className="text-slate-500">{v.note || 'Snapshot'}</div>
                </button>
              ))}
              {!versions.length && <p className="text-slate-500 text-xs px-1">No versions yet — publish to create one</p>}
            </div>
          )}

          {testOpen && (
            <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:w-96 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-4 shadow-xl z-10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Test flow</h4>
              <p className="text-[11px] text-slate-500 mb-2">Simulate an inbound WhatsApp message before publishing.</p>
              <input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full mb-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                placeholder="Simulated inbound message"
              />
              <button
                type="button"
                onClick={runTest}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-sm"
              >
                Run simulation
              </button>
              {testResult && (
                <div className="mt-3 max-h-40 overflow-y-auto text-[11px] space-y-1 custom-scrollbar">
                  <div className="text-slate-500">
                    Status: <span className="font-semibold text-slate-900">{testResult.status}</span>
                  </div>
                  {(testResult.logs || []).map((log, i) => (
                    <div key={i} className="text-slate-500 border-l-2 border-slate-200 pl-2">
                      [{log.status}] {log.nodeType || ''} — {log.message || ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <NodeEditor
          node={selectedNode}
          variables={flow?.variables}
          onChange={(nextData) => {
            setNodes((nds) => nds.map((n) => (n.id === selectedId ? { ...n, data: nextData } : n)));
            setDirty(true);
          }}
          onDelete={() => {
            setNodes((nds) => nds.filter((n) => n.id !== selectedId));
            setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
            setSelectedId(null);
            setDirty(true);
          }}
        />
      </div>
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
