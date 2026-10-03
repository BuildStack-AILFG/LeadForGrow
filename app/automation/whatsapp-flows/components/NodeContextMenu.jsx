'use client';

import { useEffect, useRef } from 'react';
import { Pencil, Copy, Trash2, Flag, Palette } from 'lucide-react';
import { CARD_COLOR_PRESETS } from '@/lib/whatsappFlows/constants';

/**
 * Small floating menu opened from a node's "⋮" kebab button.
 * Matches Interakt's node menu: Edit, Duplicate, Delete, Set start node, Card Colour.
 */
export default function NodeContextMenu({
  isStartNode,
  cardColor,
  onEdit,
  onDuplicate,
  onDelete,
  onSetStartNode,
  onSetCardColor,
  onClose,
}) {
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-8 right-0 z-20 w-48 rounded-lg border border-line bg-canvas shadow-modal py-1 text-left nodrag nopan"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          onEdit?.();
          onClose?.();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary hover:bg-accent-subtle"
      >
        <Pencil className="w-3.5 h-3.5 text-fg-tertiary" />
        Edit
      </button>
      <button
        type="button"
        onClick={() => {
          onDuplicate?.();
          onClose?.();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary hover:bg-accent-subtle"
      >
        <Copy className="w-3.5 h-3.5 text-fg-tertiary" />
        Duplicate
      </button>
      <button
        type="button"
        onClick={() => {
          onDelete?.();
          onClose?.();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger-subtle"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
      <div className="my-1 border-t border-line" />
      <button
        type="button"
        onClick={() => {
          onSetStartNode?.();
          onClose?.();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary hover:bg-accent-subtle"
      >
        <Flag className={`w-3.5 h-3.5 ${isStartNode ? 'text-accent-fg fill-[#1D4B3E]' : 'text-fg-tertiary'}`} />
        {isStartNode ? 'Start node ✓' : 'Set start node'}
      </button>
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1.5 text-xs text-fg-secondary">
          <Palette className="w-3.5 h-3.5 text-fg-tertiary" />
          Card Colour
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CARD_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSetCardColor?.(c)}
              className={`w-5 h-5 rounded-full border ${cardColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : 'border-line'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
