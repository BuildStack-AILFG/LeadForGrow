'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, MessageCircle, Split, Sparkles } from 'lucide-react';
import { getNodeMeta } from '@/lib/whatsappFlows/constants';

const CATEGORY_STYLE = {
  trigger: {
    bar: 'from-teal-500 to-indigo-600',
    iconBg: 'from-teal-500 to-indigo-600',
    Icon: Zap,
  },
  action: {
    bar: 'from-emerald-500 to-teal-600',
    iconBg: 'from-emerald-500 to-teal-600',
    Icon: MessageCircle,
  },
  logic: {
    bar: 'from-amber-500 to-orange-500',
    iconBg: 'from-amber-500 to-orange-500',
    Icon: Split,
  },
};

function FlowNodeCard({ data, selected, type }) {
  const meta = getNodeMeta(type);
  const cat = meta.category || data?.category || 'action';
  const style = CATEGORY_STYLE[cat] || CATEGORY_STYLE.action;
  const Icon = style.Icon || Sparkles;

  return (
    <div
      className={`min-w-[200px] max-w-[250px] rounded-2xl bg-white/95 shadow-lg border border-slate-200/80 overflow-hidden transition-shadow ${
        selected
          ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-[#eef1f8] shadow-teal-500/20'
          : 'hover:shadow-xl'
      }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${style.bar}`} />

      {!String(type).startsWith('trigger_') && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-slate-400 !-left-1.5"
        />
      )}

      <div className="px-3 py-3 flex items-start gap-2.5">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${style.iconBg} flex items-center justify-center shadow-sm shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {cat}
          </div>
          <div className="text-sm font-semibold text-slate-900 leading-snug truncate">
            {data?.label || meta.label}
          </div>
          {(data?.text || data?.body || data?.templateName) && (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {data.text || data.body || data.templateName}
            </p>
          )}
        </div>
      </div>

      {type === 'logic_if_else' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: '38%' }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !-right-1.5"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: '68%' }}
            className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white !-right-1.5"
          />
        </>
      ) : type === 'action_end' ? null : (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white !-right-1.5"
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
