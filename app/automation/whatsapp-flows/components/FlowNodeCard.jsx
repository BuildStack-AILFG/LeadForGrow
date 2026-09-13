'use client';

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, MessageCircle, Split, Sparkles, MoreVertical, Flag } from 'lucide-react';
import { getNodeMeta, CATEGORY_ACCENT } from '@/lib/whatsappFlows/constants';
import { useFlowActions } from './FlowActionsContext';
import NodeContextMenu from './NodeContextMenu';

const CATEGORY_ICON = {
  trigger: Zap,
  action: MessageCircle,
  logic: Split,
};

function previewText(type, data) {
  if (data?.text) return data.text;
  if (data?.body) return data.body;
  if (data?.templateName) return data.templateName;
  if (data?.mediaUrl) return data.mediaUrl;
  if (type === 'action_delay') return `Wait ${data?.delaySeconds || 60}s`;
  if (type === 'trigger_keyword') return (data?.keywords || []).join(', ');
  return null;
}

function FlowNodeCard({ id, data, selected, type }) {
  const meta = getNodeMeta(type);
  const cat = meta.category || data?.category || 'action';
  const Icon = CATEGORY_ICON[cat] || Sparkles;
  const accent = data?.cardColor || CATEGORY_ACCENT[cat] || CATEGORY_ACCENT.action;
  const [menuOpen, setMenuOpen] = useState(false);
  const actions = useFlowActions();
  const isStartNode = actions.startNodeKey === id;
  const preview = previewText(type, data);

  return (
    <div
      className={`relative min-w-[190px] max-w-[220px] rounded-lg bg-white border overflow-visible transition-shadow ${
        selected ? 'border-[#1D4B3E] shadow-[0_0_0_2px_rgba(29,75,62,0.25)]' : 'border-slate-200 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="h-[3px] rounded-t-lg" style={{ backgroundColor: accent }} />

      {!String(type).startsWith('trigger_') && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !bg-white !border-2 !border-slate-400 !-left-1"
        />
      )}

      <div className="px-2.5 py-2 flex items-center justify-between gap-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0">
          {isStartNode && <Flag className="w-3 h-3 shrink-0" style={{ color: accent, fill: accent }} />}
          <span className="text-[12.5px] font-semibold text-slate-800 truncate">
            {data?.label || meta.label}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="shrink-0 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 nodrag"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <NodeContextMenu
            isStartNode={isStartNode}
            cardColor={data?.cardColor}
            onEdit={() => actions.onEdit(id)}
            onDuplicate={() => actions.onDuplicate(id)}
            onDelete={() => actions.onDelete(id)}
            onSetStartNode={() => actions.onSetStartNode(id)}
            onSetCardColor={(color) => actions.onSetCardColor(id, color)}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      <div className="px-2.5 py-3 flex flex-col items-center text-center gap-1.5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1a` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        {preview ? (
          <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">{preview}</p>
        ) : (
          <p className="text-[10.5px] text-slate-400 italic leading-snug">
            A preview of the message will be displayed here
          </p>
        )}
      </div>

      {type === 'logic_if_else' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: '38%' }}
            className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white !-right-1"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: '68%' }}
            className="!w-2.5 !h-2.5 !bg-rose-500 !border-2 !border-white !-right-1"
          />
        </>
      ) : type === 'action_end' ? null : (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!w-2.5 !h-2.5 !border-2 !border-white !-right-1"
          style={{ backgroundColor: accent }}
        />
      )}
    </div>
  );
}

function makeNode(type) {
  return memo(function Node(props) {
    return <FlowNodeCard {...props} type={type} />;
  });
}

export const flowNodeTypes = {
  trigger_incoming_message: makeNode('trigger_incoming_message'),
  trigger_keyword: makeNode('trigger_keyword'),
  trigger_contact_created: makeNode('trigger_contact_created'),
  trigger_lead_created: makeNode('trigger_lead_created'),
  trigger_manual: makeNode('trigger_manual'),
  trigger_webhook: makeNode('trigger_webhook'),
  action_send_template: makeNode('action_send_template'),
  action_send_text: makeNode('action_send_text'),
  action_send_image: makeNode('action_send_image'),
  action_send_video: makeNode('action_send_video'),
  action_send_document: makeNode('action_send_document'),
  action_send_audio: makeNode('action_send_audio'),
  action_send_buttons: makeNode('action_send_buttons'),
  action_send_list: makeNode('action_send_list'),
  action_delay: makeNode('action_delay'),
  action_assign: makeNode('action_assign'),
  action_add_tag: makeNode('action_add_tag'),
  action_remove_tag: makeNode('action_remove_tag'),
  action_update_contact: makeNode('action_update_contact'),
  action_create_lead: makeNode('action_create_lead'),
  action_update_lead: makeNode('action_update_lead'),
  action_http: makeNode('action_http'),
  action_webhook: makeNode('action_webhook'),
  action_ai_response: makeNode('action_ai_response'),
  action_end: makeNode('action_end'),
  logic_wait_reply: makeNode('logic_wait_reply'),
  logic_if_else: makeNode('logic_if_else'),
  logic_switch: makeNode('logic_switch'),
  logic_goto: makeNode('logic_goto'),
  logic_save_variable: makeNode('logic_save_variable'),
};
