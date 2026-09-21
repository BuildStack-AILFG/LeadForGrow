'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Link2, X } from 'lucide-react';
import SequenceNode, { getNodeCenter, getNodeTop } from './SequenceNode';
import {
  NODE_DRAG_MIME, screenToCanvas, dropPosition, hasDragged, canConnect, bezierPath, edgeMidpoint, bezierPoint,
} from '@/lib/sequences/canvasMath';
import { isBranchNode, isNoEdge } from '@/lib/sequences/edges';

const EDGE_COLOR = '#6366f1';
const EDGE_COLOR_SELECTED = '#0d9488';
// Edges stop this far above the target node so the arrow head does not hide behind its input dot.
const ARROW_GAP = 12;

/**
 * Pan / zoom canvas for the sequence builder.
 *  - drag a node to move it (a plain click only selects; it must travel a few px first)
 *  - drag from the teal dot under a node onto another node to connect them
 *  - drag a node type from the library and drop it anywhere on the canvas
 *  - drag empty space to pan, Ctrl+wheel to zoom, click a connection then press Delete (or the x) to remove it
 * Interaction state lives in refs read by ONE set of window listeners, so a gesture never depends on a
 * re-render happening between two mouse events.
 */
export default function WorkflowCanvas({
  nodes, edges, selectedNodeId, onSelectNode, onMoveNode, onBeginMove, onConnect, onDropNode,
  onDuplicate, onDelete, onDeleteEdge, onFlipEdgeLabel, onUndo, onRedo,
}) {
  const containerRef = useRef(null);
  const gesture = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [preview, setPreview] = useState(null);

  // Latest props/state for the listeners below (registered once).
  const live = useRef({});
  live.current = {
    zoom, pan, nodes, edges, selectedNodeId, selectedEdgeId, onMoveNode, onBeginMove, onConnect, onDelete, onDeleteEdge,
  };

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.4, z - e.deltaY * 0.001)));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const onMove = (e) => {
      const g = gesture.current;
      if (!g) return;
      const { zoom: z, pan: p, onMoveNode: move, onBeginMove: begin } = live.current;
      if (g.type === 'node') {
        if (!g.started) {
          if (!hasDragged({ x: g.startX, y: g.startY }, { x: e.clientX, y: e.clientY })) return;
          g.started = true;
          begin?.(); // one undo step per drag
        }
        move(g.nodeId, {
          x: Math.round(g.origX + (e.clientX - g.startX) / z),
          y: Math.round(g.origY + (e.clientY - g.startY) / z),
        });
      } else if (g.type === 'pan') {
        setPan({ x: g.origPanX + e.clientX - g.startX, y: g.origPanY + e.clientY - g.startY });
      } else if (g.type === 'connect') {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const c = screenToCanvas(e, rect, p, z);
        setPreview({ from: g.from, x: c.x, y: c.y });
      }
    };

    const onUp = (e) => {
      const g = gesture.current;
      gesture.current = null;
      if (g?.type !== 'connect') return;
      setPreview(null);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetId = el?.closest?.('[data-node-id]')?.getAttribute('data-node-id');
      // The workspace validates and, when it refuses, tells the user why (a silent vanishing line is confusing).
      if (targetId && targetId !== g.from) live.current.onConnect(g.from, targetId);
    };

    const onKey = (e) => {
      const t = e.target;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
      if (e.key === 'Escape') {
        if (gesture.current?.type === 'connect') { gesture.current = null; setPreview(null); }
        setConnectMode(false);
        setConnectFrom(null);
        setSelectedEdgeId(null);
        return;
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const s = live.current;
      if (s.selectedEdgeId) {
        e.preventDefault();
        s.onDeleteEdge?.(s.selectedEdgeId);
        setSelectedEdgeId(null);
      } else if (s.selectedNodeId) {
        const n = s.nodes.find((x) => x.id === s.selectedNodeId);
        // The trigger is what starts the workflow; it is only removed with its own button.
        if (n && !String(n.type).startsWith('trigger_')) {
          e.preventDefault();
          s.onDelete?.(n.id);
        }
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleNodeClick = (nodeId) => {
    if (connectMode && connectFrom && connectFrom !== nodeId) {
      onConnect(connectFrom, nodeId);
      setConnectFrom(null);
      setConnectMode(false);
    } else if (connectMode) {
      setConnectFrom(nodeId);
    } else {
      setSelectedEdgeId(null);
      onSelectNode(nodeId);
    }
  };

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edgeEnd = (tgt) => {
    const top = getNodeTop(tgt);
    return { x: top.x, y: top.y - ARROW_GAP };
  };
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const selectedEdgeMid = selectedEdge && nodeMap[selectedEdge.source] && nodeMap[selectedEdge.target]
    ? edgeMidpoint(getNodeCenter(nodeMap[selectedEdge.source]), edgeEnd(nodeMap[selectedEdge.target]))
    : null;

  return (
    <div className="relative flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-[#eef1f8] dark:bg-slate-950">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1 p-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg">
        <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Reset view"><Maximize2 className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button type="button" onClick={onUndo} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Undo"><Undo2 className="w-4 h-4" /></button>
        <button type="button" onClick={onRedo} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Redo"><Redo2 className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={() => { setConnectMode(!connectMode); setConnectFrom(null); }}
          className={`p-2 rounded-lg ${connectMode ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          title="Connect nodes: click the first node, then the second (or just drag from the dot under a node)"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <span className="text-[10px] text-slate-400 px-2">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Minimap */}
      <div className="absolute bottom-3 right-3 z-30 w-32 h-24 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden hidden md:block">
        <div className="relative w-full h-full scale-[0.15] origin-top-left" style={{ width: 800, height: 600 }}>
          {nodes.map((n) => (
            <div key={n.id} className="absolute w-[220px] h-[20px] bg-teal-400/60 rounded" style={{ left: n.position?.x, top: n.position?.y }} />
          ))}
        </div>
      </div>

      {/* Canvas. Every mousedown that reaches here is on empty space: nodes, handles and connections stop propagation. */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          onSelectNode(null);
          setSelectedEdgeId(null);
          gesture.current = { type: 'pan', startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y };
        }}
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer?.types || []).includes(NODE_DRAG_MIME)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={(e) => {
          const type = e.dataTransfer?.getData(NODE_DRAG_MIME);
          if (!type) return;
          e.preventDefault();
          const rect = containerRef.current.getBoundingClientRect();
          onDropNode?.(type, dropPosition(e, rect, pan, zoom));
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            opacity: 0.4,
          }}
        />
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: 4000, height: 3000 }}
        >
          <svg className="absolute inset-0 pointer-events-none" width={4000} height={3000}>
            <defs>
              <marker id="edgeArrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L8,4 L0,8 z" fill={EDGE_COLOR} />
              </marker>
              <marker id="edgeArrowSelected" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L8,4 L0,8 z" fill={EDGE_COLOR_SELECTED} />
              </marker>
            </defs>
            {edges.map((edge) => {
              const src = nodeMap[edge.source];
              const tgt = nodeMap[edge.target];
              if (!src || !tgt) return null;
              const from = getNodeCenter(src);
              const to = edgeEnd(tgt);
              const d = bezierPath(from.x, from.y, to.x, to.y);
              const selected = edge.id === selectedEdgeId;
              return (
                <g key={edge.id}>
                  {/* A plain colour, not a gradient: an objectBoundingBox gradient on a perfectly vertical line
                      (two nodes in the same column) has a zero-width box, so the browser paints nothing. */}
                  <path
                    d={d}
                    fill="none"
                    stroke={selected ? EDGE_COLOR_SELECTED : EDGE_COLOR}
                    strokeWidth={selected ? 3 : 2.5}
                    strokeLinecap="round"
                    opacity={selected ? 1 : 0.8}
                    markerEnd={`url(#${selected ? 'edgeArrowSelected' : 'edgeArrow'})`}
                  />
                  {/* Wide invisible stroke so a thin line is easy to click. */}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (e.button !== 0) return;
                      setSelectedEdgeId(edge.id);
                      onSelectNode(null);
                    }}
                  />
                </g>
              );
            })}
            {preview && nodeMap[preview.from] && (() => {
              const from = getNodeCenter(nodeMap[preview.from]);
              return (
                <path
                  d={bezierPath(from.x, from.y, preview.x, preview.y)}
                  fill="none"
                  stroke={EDGE_COLOR_SELECTED}
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
              );
            })()}
          </svg>

          {/* Yes / No pills on the exits of an If / Else (the engine routes on these). Click a selected pill to switch it. */}
          {edges.map((edge) => {
            const src = nodeMap[edge.source];
            const tgt = nodeMap[edge.target];
            if (!src || !tgt || !isBranchNode(src)) return null;
            const kind = isNoEdge(edge) ? 'no' : 'yes';
            const pt = bezierPoint(getNodeCenter(src), edgeEnd(tgt), 0.22);
            return (
              <button
                key={`branch_${edge.id}`}
                type="button"
                data-branch-pill={kind}
                title={edge.id === selectedEdgeId ? 'Click to switch between Yes and No' : 'Select this exit, then click again to switch Yes / No'}
                style={{ left: pt.x - 16, top: pt.y - 9 }}
                className={`absolute z-20 h-[18px] min-w-[32px] px-1.5 rounded-full border text-[10px] font-semibold leading-none ${
                  kind === 'yes'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (edge.id === selectedEdgeId) {
                    onFlipEdgeLabel?.(edge.id);
                  } else {
                    setSelectedEdgeId(edge.id);
                    onSelectNode(null);
                  }
                }}
              >
                {kind === 'yes' ? 'Yes' : 'No'}
              </button>
            );
          })}

          {selectedEdgeMid && (
            <button
              type="button"
              title="Delete connection"
              aria-label="Delete connection"
              style={{ left: selectedEdgeMid.x - 11, top: selectedEdgeMid.y - 11 }}
              className="absolute z-30 w-[22px] h-[22px] rounded-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 text-red-500 shadow flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/40"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteEdge?.(selectedEdge.id);
                setSelectedEdgeId(null);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {nodes.map((node) => (
            <SequenceNode
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              dimmed={Boolean(preview) && node.id !== preview.from && !canConnect({ nodes, edges, source: preview.from, target: node.id })}
              connectingFrom={connectFrom}
              onSelect={handleNodeClick}
              onDragStart={(e, nodeId) => {
                if (e.button !== 0) return;
                const n = nodeMap[nodeId];
                gesture.current = {
                  type: 'node', nodeId, started: false,
                  startX: e.clientX, startY: e.clientY, origX: n.position?.x ?? 0, origY: n.position?.y ?? 0,
                };
              }}
              onConnectStart={(e, nodeId) => {
                if (e.button !== 0) return;
                gesture.current = { type: 'connect', from: nodeId };
                setSelectedEdgeId(null);
              }}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {connectMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-teal-600 text-white text-xs font-medium shadow-lg">
          {connectFrom ? 'Click target node' : 'Click source node to connect'}
        </div>
      )}
    </div>
  );
}
