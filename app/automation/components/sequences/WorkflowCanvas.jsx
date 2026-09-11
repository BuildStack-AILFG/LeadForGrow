'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Link2 } from 'lucide-react';
import SequenceNode, { NODE_W, NODE_H, getNodeCenter, getNodeTop } from './SequenceNode';

function bezierPath(x1, y1, x2, y2) {
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

export default function WorkflowCanvas({
  nodes, edges, selectedNodeId, onSelectNode, onMoveNode, onConnect, onDuplicate, onDelete,
  onUndo, onRedo,
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.4, z - e.deltaY * 0.001)));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseMove = useCallback((e) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / zoom;
      const dy = (e.clientY - dragging.startY) / zoom;
      onMoveNode(dragging.nodeId, { x: dragging.origX + dx, y: dragging.origY + dy });
    } else if (panning) {
      setPan({ x: panning.origPanX + e.clientX - panning.startX, y: panning.origPanY + e.clientY - panning.startY });
    }
  }, [dragging, panning, zoom, onMoveNode]);

  const onMouseUp = useCallback(() => {
    setDragging(null);
    setPanning(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleNodeClick = (nodeId) => {
    if (connectMode && connectFrom && connectFrom !== nodeId) {
      onConnect(connectFrom, nodeId);
      setConnectFrom(null);
      setConnectMode(false);
    } else if (connectMode) {
      setConnectFrom(nodeId);
    } else {
      onSelectNode(nodeId);
    }
  };

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="relative flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-[#eef1f8] dark:bg-slate-950">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1 p-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg">
        <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600" title="Reset"><Maximize2 className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button type="button" onClick={onUndo} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"><Undo2 className="w-4 h-4" /></button>
        <button type="button" onClick={onRedo} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"><Redo2 className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={() => { setConnectMode(!connectMode); setConnectFrom(null); }}
          className={`p-2 rounded-lg ${connectMode ? 'bg-teal-100 text-teal-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600'}`}
          title="Connect nodes"
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

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          if (e.target === containerRef.current || e.target.closest('[data-canvas-bg]')) {
            onSelectNode(null);
            setPanning({ startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y });
          }
        }}
      >
        <div
          data-canvas-bg
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            opacity: 0.4,
          }}
        />
        <div
          className="absolute origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: 4000, height: 3000 }}
        >
          <svg className="absolute inset-0 pointer-events-none" width={4000} height={3000}>
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            {edges.map((edge) => {
              const src = nodeMap[edge.source];
              const tgt = nodeMap[edge.target];
              if (!src || !tgt) return null;
              const from = getNodeCenter(src);
              const to = getNodeTop(tgt);
              return (
                <path
                  key={edge.id}
                  d={bezierPath(from.x, from.y, to.x, to.y)}
                  fill="none"
                  stroke="url(#edgeGrad)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              );
            })}
          </svg>

          {nodes.map((node) => (
            <SequenceNode
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              connectingFrom={connectFrom}
              onSelect={handleNodeClick}
              onDragStart={(e, nodeId) => {
                const n = nodeMap[nodeId];
                setDragging({ nodeId, startX: e.clientX, startY: e.clientY, origX: n.position?.x ?? 0, origY: n.position?.y ?? 0 });
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
