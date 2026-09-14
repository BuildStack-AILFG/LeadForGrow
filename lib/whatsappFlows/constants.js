/** WhatsApp Flow Builder — node catalog & defaults (industry-agnostic) */

export const FLOW_STATUSES = ['draft', 'published', 'archived'];

export const TRIGGER_TYPES = [
  { type: 'trigger_incoming_message', label: 'Incoming WhatsApp Message', category: 'trigger', description: 'Starts when a WhatsApp message arrives' },
  { type: 'trigger_keyword', label: 'Keyword Trigger', category: 'trigger', description: 'Match one or more keywords' },
  { type: 'trigger_contact_created', label: 'Contact Created', category: 'trigger', description: 'When a contact is created' },
  { type: 'trigger_lead_created', label: 'Lead Created', category: 'trigger', description: 'When a new lead is created' },
  { type: 'trigger_manual', label: 'Manual Trigger', category: 'trigger', description: 'Start from inbox or API' },
  { type: 'trigger_webhook', label: 'Webhook Trigger', category: 'trigger', description: 'Start via HTTP webhook' },
];

export const ACTION_TYPES = [
  { type: 'action_send_template', label: 'Send WhatsApp Template', category: 'action' },
  { type: 'action_send_text', label: 'Send Text', category: 'action' },
  { type: 'action_send_image', label: 'Send Image', category: 'action' },
  { type: 'action_send_video', label: 'Send Video', category: 'action' },
  { type: 'action_send_document', label: 'Send Document', category: 'action' },
  { type: 'action_send_audio', label: 'Send Audio', category: 'action' },
  { type: 'action_send_buttons', label: 'Send Interactive Buttons', category: 'action' },
  { type: 'action_send_list', label: 'Send Interactive List', category: 'action' },
  { type: 'action_delay', label: 'Delay / Wait', category: 'action' },
  { type: 'action_assign', label: 'Assign Conversation', category: 'action' },
  { type: 'action_add_tag', label: 'Add Tag', category: 'action' },
  { type: 'action_remove_tag', label: 'Remove Tag', category: 'action' },
  { type: 'action_update_contact', label: 'Update Contact', category: 'action' },
  { type: 'action_create_lead', label: 'Create Lead', category: 'action' },
  { type: 'action_update_lead', label: 'Update Lead', category: 'action' },
  { type: 'action_http', label: 'HTTP Request', category: 'action' },
  { type: 'action_webhook', label: 'Webhook', category: 'action' },
  { type: 'action_ai_response', label: 'AI Response', category: 'action' },
  { type: 'action_end', label: 'End Flow', category: 'action' },
];

export const LOGIC_TYPES = [
  { type: 'logic_wait_reply', label: 'Wait for Reply', category: 'logic' },
  { type: 'logic_if_else', label: 'If / Else', category: 'logic' },
  { type: 'logic_switch', label: 'Switch', category: 'logic' },
  { type: 'logic_goto', label: 'Go To Node', category: 'logic' },
  { type: 'logic_save_variable', label: 'Save Variable', category: 'logic' },
];

export const ALL_NODE_TYPES = [...TRIGGER_TYPES, ...ACTION_TYPES, ...LOGIC_TYPES];

export const DEFAULT_SYSTEM_VARIABLES = [
  { key: 'customer_name', label: 'Customer Name', source: 'system' },
  { key: 'phone', label: 'Phone', source: 'system' },
  { key: 'email', label: 'Email', source: 'system' },
  { key: 'vehicle_type', label: 'Vehicle Type', source: 'custom' },
  { key: 'service', label: 'Service', source: 'custom' },
  { key: 'brand', label: 'Brand', source: 'custom' },
  { key: 'model', label: 'Model', source: 'custom' },
  { key: 'fuel_type', label: 'Fuel Type', source: 'custom' },
  { key: 'package', label: 'Package', source: 'custom' },
  { key: 'location', label: 'Location', source: 'custom' },
  { key: 'last_reply', label: 'Last Reply', source: 'reply' },
];

export const NODE_COLORS = {
  trigger: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', accent: '#34d399' },
  action: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-300', accent: '#60a5fa' },
  logic: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', accent: '#fbbf24' },
};

export function getNodeMeta(type) {
  return ALL_NODE_TYPES.find((n) => n.type === type) || { type, label: type, category: 'action' };
}

export function getDefaultNodeData(type) {
  const meta = getNodeMeta(type);
  const base = { label: meta.label, category: meta.category };
  switch (type) {
    case 'trigger_keyword':
      return { ...base, keywords: ['hi', 'hello'], matchMode: 'contains' };
    case 'action_send_text':
      return { ...base, text: 'Hi {{customer_name}}, thanks for reaching out!' };
    case 'action_send_template':
      return { ...base, templateName: '', language: 'en', components: [] };
    case 'action_send_buttons':
      return {
        ...base,
        body: 'Please choose an option:',
        buttons: [
          { id: 'btn_1', title: 'Option 1' },
          { id: 'btn_2', title: 'Option 2' },
        ],
        footer: '',
        header: '',
      };
    case 'action_send_list':
      return {
        ...base,
        header: '',
        body: 'Pick from the list:',
        footer: '',
        buttonText: 'View options',
        sections: [{ title: 'Options', rows: [{ id: 'row_1', title: 'Option 1', description: '' }] }],
        saveAs: 'selected_option',
      };
    case 'action_send_image':
    case 'action_send_video':
    case 'action_send_document':
    case 'action_send_audio':
      return { ...base, mediaUrl: '', caption: '', fileName: '' };
    case 'action_delay':
      return { ...base, delaySeconds: 60 };
    case 'action_add_tag':
    case 'action_remove_tag':
      return { ...base, tag: '' };
    case 'action_assign':
      return { ...base, userId: '' };
    case 'action_update_lead':
    case 'action_update_contact':
      return { ...base, fields: {} };
    case 'action_create_lead':
      return { ...base, name: '{{customer_name}}', phone: '{{phone}}', source: 'whatsapp_flow' };
    case 'action_http':
    case 'action_webhook':
      return { ...base, url: '', method: 'POST', headers: {}, body: '{}' };
    case 'action_ai_response':
      return { ...base, prompt: 'Reply helpfully as our business assistant.', saveAs: 'ai_reply' };
    case 'logic_wait_reply':
      return { ...base, saveAs: 'last_reply', timeoutMinutes: 1440 };
    case 'logic_if_else':
      return { ...base, variable: 'last_reply', operator: 'contains', value: '' };
    case 'logic_switch':
      return { ...base, variable: 'last_reply', cases: [{ value: '', handle: 'case_0' }] };
    case 'logic_goto':
      return { ...base, targetNodeKey: '' };
    case 'logic_save_variable':
      return { ...base, key: 'custom_var', value: '{{last_reply}}' };
    case 'action_end':
      return { ...base, markConverted: false };
    default:
      return base;
  }
}

export function renderTemplate(str, variables = {}) {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const val = variables[key];
    return val == null ? '' : String(val);
  });
}
