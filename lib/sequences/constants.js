/** Node type definitions for workflow builder & executor */

export const NODE_CATEGORIES = {
  trigger: { label: 'Triggers', color: 'blue' },
  action: { label: 'Actions', color: 'green' },
  ai: { label: 'AI', color: 'cyan' },
  logic: { label: 'Logic', color: 'amber' },
  end: { label: 'End', color: 'slate' },
};

export const TRIGGER_TYPES = [
  // CRM
  { type: 'trigger_new_lead', label: 'Lead Created', icon: 'UserPlus', triggerKey: 'new_lead', engineTrigger: 'onLeadReceived', category: 'crm' },
  { type: 'trigger_lead_updated', label: 'Lead Updated', icon: 'UserCog', triggerKey: 'lead_updated', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_lead_converted', label: 'Lead Converted', icon: 'UserCheck', triggerKey: 'lead_converted', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_deal_created', label: 'Deal Created', icon: 'Handshake', triggerKey: 'deal_created', engineTrigger: 'onLeadReceived', category: 'crm' },
  { type: 'trigger_deal_won', label: 'Deal Won', icon: 'Trophy', triggerKey: 'deal_won', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_deal_lost', label: 'Deal Lost', icon: 'XCircle', triggerKey: 'deal_lost', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_stage', label: 'Stage Changed', icon: 'GitBranch', triggerKey: 'stage_changed', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_task_created', label: 'Task Created', icon: 'CheckSquare', triggerKey: 'task_created', engineTrigger: 'onLeadReceived', category: 'crm' },
  { type: 'trigger_task_completed', label: 'Task Completed', icon: 'CheckCircle', triggerKey: 'task_completed', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_meeting_scheduled', label: 'Meeting Scheduled', icon: 'Calendar', triggerKey: 'meeting_scheduled', engineTrigger: 'onLeadReceived', category: 'crm' },
  { type: 'trigger_meeting_completed', label: 'Meeting Completed', icon: 'CalendarCheck', triggerKey: 'meeting_completed', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_meeting_no_show', label: 'Meeting No-show', icon: 'Calendar', triggerKey: 'meeting_no_show', engineTrigger: 'onStatusChange', category: 'crm' },
  { type: 'trigger_contact_created', label: 'Contact Created', icon: 'UserCircle', triggerKey: 'contact_created', engineTrigger: 'onLeadReceived', category: 'crm' },
  { type: 'trigger_company_created', label: 'Company Created', icon: 'Building', triggerKey: 'company_created', engineTrigger: 'onLeadReceived', category: 'crm' },
  // Communication
  { type: 'trigger_form', label: 'Form Submission', icon: 'FileInput', triggerKey: 'form_submission', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_whatsapp', label: 'WhatsApp Received', icon: 'MessageCircle', triggerKey: 'whatsapp_message', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_whatsapp_sent', label: 'WhatsApp Sent', icon: 'Send', triggerKey: 'whatsapp_sent', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_instagram', label: 'Instagram DM', icon: 'Instagram', triggerKey: 'instagram_dm', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_instagram_comment', label: 'Instagram Comment', icon: 'MessageSquare', triggerKey: 'instagram_comment', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_email_received', label: 'Email Received', icon: 'Mail', triggerKey: 'email_received', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_email_sent', label: 'Email Sent', icon: 'MailCheck', triggerKey: 'email_sent', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_email_opened', label: 'Email Opened', icon: 'MailOpen', triggerKey: 'email_opened', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_email_clicked', label: 'Email Clicked', icon: 'MousePointer', triggerKey: 'email_clicked', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_chat_started', label: 'Website Chat Started', icon: 'MessagesSquare', triggerKey: 'chat_started', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_visitor', label: 'Visitor Identified', icon: 'Eye', triggerKey: 'visitor_identified', engineTrigger: 'onLeadReceived', category: 'communication' },
  { type: 'trigger_meta_lead', label: 'Meta Lead Ad', icon: 'Megaphone', triggerKey: 'meta_lead', engineTrigger: 'onLeadReceived', category: 'communication' },
  // AI
  { type: 'trigger_ai_qualified', label: 'Lead Qualified', icon: 'Brain', triggerKey: 'lead_qualified', engineTrigger: 'onStatusChange', category: 'ai' },
  { type: 'trigger_score_changed', label: 'Lead Score Changed', icon: 'TrendingUp', triggerKey: 'lead_score_changed', engineTrigger: 'onStatusChange', category: 'ai' },
  { type: 'trigger_ai_summary', label: 'AI Summary Generated', icon: 'FileText', triggerKey: 'ai_summary_generated', engineTrigger: 'onLeadReceived', category: 'ai' },
  { type: 'trigger_ai_escalated', label: 'AI Escalated', icon: 'AlertTriangle', triggerKey: 'ai_escalated', engineTrigger: 'onStatusChange', category: 'ai' },
  // System
  { type: 'trigger_missed_call', label: 'Missed Call', icon: 'PhoneMissed', triggerKey: 'missed_call', engineTrigger: 'onLeadReceived', category: 'system' },
  { type: 'trigger_tag', label: 'Tag Added', icon: 'Tag', triggerKey: 'tag_added', engineTrigger: 'onLeadReceived', category: 'system' },
  { type: 'trigger_no_reply', label: 'No Reply', icon: 'Clock', triggerKey: 'no_reply', engineTrigger: 'onNoResponse', category: 'system' },
  { type: 'trigger_payment', label: 'Payment Received', icon: 'CreditCard', triggerKey: 'payment_received', engineTrigger: 'onLeadReceived', category: 'system' },
  { type: 'trigger_webhook', label: 'Webhook', icon: 'Webhook', triggerKey: 'webhook', engineTrigger: 'onLeadReceived', category: 'system' },
  { type: 'trigger_manual', label: 'Manual', icon: 'Hand', triggerKey: 'manual', engineTrigger: 'onLeadReceived', category: 'system' },
  { type: 'trigger_schedule', label: 'Recurring Schedule', icon: 'CalendarClock', triggerKey: 'recurring', engineTrigger: 'onLeadReceived', category: 'system' },
  { type: 'trigger_date', label: 'Date', icon: 'CalendarDays', triggerKey: 'date', engineTrigger: 'onLeadReceived', category: 'system' },
];

export const ACTION_TYPES = [
  // CRM
  { type: 'send_whatsapp', label: 'Send WhatsApp', icon: 'MessageCircle', category: 'communication' },
  { type: 'send_email', label: 'Send Email', icon: 'Mail', category: 'communication' },
  { type: 'send_instagram_dm', label: 'Send Instagram DM', icon: 'Instagram', category: 'communication' },
  { type: 'create_lead', label: 'Create Lead', icon: 'UserPlus', category: 'crm' },
  { type: 'update_lead', label: 'Update Lead', icon: 'UserCog', category: 'crm' },
  { type: 'create_contact', label: 'Create Contact', icon: 'UserCircle', category: 'crm' },
  { type: 'create_deal', label: 'Create Deal', icon: 'Handshake', category: 'crm' },
  { type: 'move_pipeline', label: 'Move Pipeline', icon: 'ArrowRight', category: 'crm' },
  { type: 'assign_agent', label: 'Assign Salesperson', icon: 'UserCheck', category: 'crm' },
  { type: 'create_task', label: 'Create Task', icon: 'CheckSquare', category: 'crm' },
  { type: 'add_note', label: 'Add Note', icon: 'StickyNote', category: 'crm' },
  { type: 'add_tag', label: 'Add Tag', icon: 'Tag', category: 'crm' },
  { type: 'archive_lead', label: 'Archive', icon: 'Archive', category: 'crm' },
  { type: 'delete_lead', label: 'Delete', icon: 'Trash2', category: 'crm' },
  { type: 'notify_team', label: 'Notify Team', icon: 'Bell', category: 'notification' },
  { type: 'push_notification', label: 'Push Notification', icon: 'Smartphone', category: 'notification' },
  // Logic
  { type: 'delay', label: 'Delay / Wait', icon: 'Timer', category: 'logic' },
  { type: 'condition', label: 'If / Else', icon: 'Split', category: 'logic' },
  { type: 'split', label: 'Split Branch', icon: 'GitBranch', category: 'logic' },
  { type: 'merge', label: 'Merge', icon: 'GitMerge', category: 'logic' },
  { type: 'parallel_branch', label: 'Parallel Branch', icon: 'Columns', category: 'logic' },
  { type: 'wait_for_all', label: 'Wait for All', icon: 'Layers', category: 'logic' },
  { type: 'wait_for_any', label: 'Wait for Any', icon: 'Zap', category: 'logic' },
  { type: 'loop', label: 'Loop', icon: 'Repeat', category: 'logic' },
  { type: 'for_each', label: 'For Each', icon: 'List', category: 'logic' },
  { type: 'goto', label: 'Go To Node', icon: 'CornerDownRight', category: 'logic' },
  { type: 'exit_workflow', label: 'Exit Workflow', icon: 'LogOut', category: 'logic' },
  { type: 'break_loop', label: 'Break Loop', icon: 'SkipForward', category: 'logic' },
  { type: 'continue_loop', label: 'Continue Loop', icon: 'RotateCw', category: 'logic' },
  { type: 'sub_workflow', label: 'Sub-workflow', icon: 'Workflow', category: 'logic' },
  { type: 'approval', label: 'Approval Gate', icon: 'ShieldCheck', category: 'logic' },
  { type: 'wait_until', label: 'Wait Until Date', icon: 'Calendar', category: 'logic' },
  { type: 'wait_reply', label: 'Wait for Reply', icon: 'MessageSquareReply', category: 'logic' },
  { type: 'wait_payment', label: 'Wait for Payment', icon: 'CreditCard', category: 'logic' },
  { type: 'wait_meeting', label: 'Wait for Meeting', icon: 'CalendarCheck', category: 'logic' },
  { type: 'wait_deal_won', label: 'Wait for Deal Won', icon: 'Trophy', category: 'logic' },
  { type: 'webhook', label: 'Webhook', icon: 'Webhook', category: 'other' },
  { type: 'http_request', label: 'HTTP Request', icon: 'Globe', category: 'other' },
  { type: 'end', label: 'End Workflow', icon: 'Flag', category: 'end' },
];

export const AI_ACTION_TYPES = [
  { type: 'ai_whatsapp_reply', label: 'Generate Reply', icon: 'Sparkles', category: 'ai' },
  { type: 'ai_qualification', label: 'Qualify Lead', icon: 'Brain', category: 'ai' },
  { type: 'ai_scoring', label: 'Lead Scoring', icon: 'TrendingUp', category: 'ai' },
  { type: 'ai_summary', label: 'Generate Summary', icon: 'FileText', category: 'ai' },
  { type: 'ai_email', label: 'Generate Email', icon: 'Mail', category: 'ai' },
  { type: 'ai_translate', label: 'Translate Message', icon: 'Languages', category: 'ai' },
  { type: 'ai_intent', label: 'Intent Detection', icon: 'Scan', category: 'ai' },
  { type: 'ai_followup_timing', label: 'Follow-up Timing', icon: 'Clock', category: 'ai' },
];

export const ALL_NODE_TYPES = [...TRIGGER_TYPES, ...ACTION_TYPES, ...AI_ACTION_TYPES];

export const NODE_STYLES = {
  trigger: 'from-blue-500 to-indigo-600',
  send_whatsapp: 'from-emerald-500 to-teal-600',
  send_email: 'from-violet-500 to-purple-600',
  assign_agent: 'from-sky-500 to-blue-600',
  add_tag: 'from-orange-500 to-amber-600',
  create_task: 'from-pink-500 to-rose-600',
  move_pipeline: 'from-indigo-500 to-blue-700',
  notify_team: 'from-yellow-500 to-orange-500',
  delay: 'from-amber-400 to-orange-500',
  condition: 'from-amber-500 to-yellow-600',
  wait_until: 'from-slate-500 to-slate-700',
  webhook: 'from-cyan-500 to-blue-600',
  end: 'from-slate-600 to-slate-800',
  ai_whatsapp_reply: 'from-cyan-400 to-blue-500',
  ai_qualification: 'from-teal-400 to-cyan-600',
  ai_scoring: 'from-purple-400 to-indigo-600',
  ai_intent: 'from-blue-400 to-violet-600',
  ai_followup_timing: 'from-emerald-400 to-cyan-500',
};

export const CONDITION_OPERATORS = [
  { id: 'equals', label: 'Equals' },
  { id: 'not_equals', label: 'Not Equals' },
  { id: 'contains', label: 'Contains' },
  { id: 'not_contains', label: 'Not Contains' },
  { id: 'starts_with', label: 'Starts With' },
  { id: 'ends_with', label: 'Ends With' },
  { id: 'gte', label: 'Greater Than' },
  { id: 'gt', label: 'Greater Than (strict)' },
  { id: 'lte', label: 'Less Than' },
  { id: 'lt', label: 'Less Than (strict)' },
  { id: 'empty', label: 'Empty' },
  { id: 'not_empty', label: 'Not Empty' },
  { id: 'in', label: 'In List' },
];

export const CONDITION_FIELDS = [
  { id: 'status', label: 'Pipeline Stage' },
  { id: 'score', label: 'Lead Score' },
  { id: 'tags', label: 'Tags' },
  { id: 'owner', label: 'Owner' },
  { id: 'company', label: 'Company' },
  { id: 'industry', label: 'Industry' },
  { id: 'source', label: 'Source' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'priority', label: 'Priority' },
];

export const TRIGGER_TO_ENGINE = {
  new_lead: 'onLeadReceived',
  form_submission: 'onLeadReceived',
  whatsapp_message: 'onLeadReceived',
  meta_lead: 'onLeadReceived',
  stage_changed: 'onStatusChange',
  missed_call: 'onLeadReceived',
  tag_added: 'onLeadReceived',
  no_reply: 'onNoResponse',
  payment_received: 'onLeadReceived',
  event_joined: 'onEventJoined',
  lead_updated: 'onStatusChange',
  lead_converted: 'onStatusChange',
  deal_won: 'onStatusChange',
  deal_lost: 'onStatusChange',
  instagram_dm: 'onLeadReceived',
  instagram_comment: 'onLeadReceived',
  webhook: 'onLeadReceived',
  recurring: 'onLeadReceived',
  email_received: 'onLeadReceived',
};

export const SEQUENCE_CATEGORIES = [
  { id: 'nurture', label: 'Lead nurturing' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'qualification', label: 'Qualification' },
  { id: 'reactivation', label: 'Reactivation' },
  { id: 'booking', label: 'Booking' },
  { id: 'custom', label: 'Custom' },
];

export function getNodeDef(type) {
  return ALL_NODE_TYPES.find((n) => n.type === type) || { type, label: type, category: 'action' };
}

export function getNodeStyle(type) {
  if (NODE_STYLES[type]) return NODE_STYLES[type];
  if (type?.startsWith('trigger_')) return NODE_STYLES.trigger;
  if (type?.startsWith('ai_')) return NODE_STYLES.ai_whatsapp_reply;
  return 'from-slate-500 to-slate-700';
}

export function createNode(type, position = { x: 0, y: 0 }) {
  const def = getNodeDef(type);
  const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const defaults = {
    send_whatsapp: { message: 'Hi {{name}}, thanks for reaching out!', templateName: '' },
    send_email: { subject: 'Following up', body: 'Hi {{name}}, …' },
    delay: { delayHours: 24, delayMinutes: 0 },
    condition: { field: 'status', operator: 'equals', value: 'new' },
    assign_agent: { strategy: 'round-robin' },
    add_tag: { tag: 'nurture' },
    create_task: { title: 'Follow up with {{name}}', dueHours: 24 },
    move_pipeline: { stage: 'contacted' },
    notify_team: { message: 'Lead {{name}} needs attention' },
    ai_whatsapp_reply: { tone: 'friendly', prompt: '' },
    end: {},
  };
  return {
    id,
    type,
    position,
    data: { label: def.label, ...(defaults[type] || {}) },
  };
}

export function linearStepsToGraph(steps, triggerType = 'trigger_new_lead') {
  const nodes = [];
  const edges = [];
  let y = 80;
  const trigger = createNode(triggerType, { x: 280, y: 40 });
  nodes.push(trigger);
  let prevId = trigger.id;

  steps.forEach((step, i) => {
    y += 120;
    const channel = step.channel || 'whatsapp';
    const type = channel === 'email' ? 'send_email' : channel === 'both' ? 'send_whatsapp' : 'send_whatsapp';
    const node = createNode(type, { x: 280, y });
    node.data = {
      ...node.data,
      message: step.messageTemplate || '',
      subject: step.emailSubject || '',
      body: step.messageTemplate || '',
      delayHours: step.delayDays ? step.delayDays * 24 : 0,
      // Preserve smart-branching config so the sequence engine's
      // handleInboundReply can read it off the current node when a lead
      // replies. Without this, template-created sequences lose all
      // branching intelligence the moment they hit the DB.
      exitOnAnyReply: !!step.exitOnAnyReply,
      exitKeywords: Array.isArray(step.exitKeywords) ? step.exitKeywords : [],
      pauseOnReply: !!step.pauseOnReply,
      isGoal: !!step.isGoal,
    };
    nodes.push(node);
    edges.push({ id: `e_${prevId}_${node.id}`, source: prevId, target: node.id });
    if (step.delayDays > 0 && i > 0) {
      const delayNode = createNode('delay', { x: 280, y: y - 60 });
      delayNode.data.delayHours = step.delayDays * 24;
      nodes.splice(nodes.length - 1, 0, delayNode);
      edges.pop();
      edges.push({ id: `e_${prevId}_${delayNode.id}`, source: prevId, target: delayNode.id });
      edges.push({ id: `e_${delayNode.id}_${node.id}`, source: delayNode.id, target: node.id });
    }
    prevId = node.id;
  });

  y += 120;
  const endNode = createNode('end', { x: 280, y });
  nodes.push(endNode);
  edges.push({ id: `e_${prevId}_${endNode.id}`, source: prevId, target: endNode.id });
  return { nodes, edges };
}
