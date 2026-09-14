import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowExecution from '@/models/automation/FlowExecution';
import { sendAutoWhatsApp } from '@/lib/integrations/whatsapp';
import { sendMetaMediaMessage } from '@/lib/integrations/whatsappMedia';
import { sendInteractiveButtons, sendInteractiveList } from '@/lib/integrations/whatsappInteractive';
import { fetchExternal } from '@/lib/fetchExternal';
import { renderTemplate } from '@/lib/whatsappFlows/constants';

const MAX_STEPS = 40;

function buildInitialVariables(lead = {}, extras = {}) {
  return {
    customer_name: lead.name || '',
    phone: lead.whatsapp || lead.phone || '',
    email: lead.email || '',
    vehicle_type: '',
    service: lead.serviceInterest || '',
    brand: '',
    model: '',
    fuel_type: '',
    package: '',
    location: '',
    last_reply: '',
    ...extras,
  };
}

function findTriggerNode(nodes = []) {
  return nodes.find((n) => String(n.type || '').startsWith('trigger_')) || nodes[0];
}

function nextNodes(edges = [], sourceKey, handle = 'default') {
  return edges
    .filter((e) => e.source === sourceKey && (e.sourceHandle || 'default') === (handle || 'default'))
    .map((e) => e.target);
}

function getNode(nodes, key) {
  return nodes.find((n) => n.id === key || n.nodeKey === key);
}

function evaluateCondition(variables, { variable, operator, value }) {
  const left = String(variables[variable] ?? '').toLowerCase();
  const right = String(value ?? '').toLowerCase();
  switch (operator) {
    case 'equals':
      return left === right;
    case 'not_equals':
      return left !== right;
    case 'contains':
      return left.includes(right);
    case 'not_contains':
      return !left.includes(right);
    case 'exists':
      return Boolean(String(variables[variable] ?? '').trim());
    case 'not_exists':
      return !String(variables[variable] ?? '').trim();
    default:
      return left.includes(right);
  }
}

async function bumpFlowAnalytics(flowId, patch) {
  await WhatsAppFlow.updateOne({ _id: flowId }, { $inc: patch });
}

async function bumpNodeAnalytics(flowId, nodeKey, field) {
  const FlowNode = (await import('@/models/automation/FlowNode')).default;
  await FlowNode.updateOne({ flowId, nodeKey }, { $inc: { [`analytics.${field}`]: 1 } });
}

/**
 * Start a flow execution for a lead.
 */
export async function startFlowExecution({
  flow,
  business,
  lead,
  conversationId = null,
  triggerPayload = {},
  isTest = false,
}) {
  const snapshot = flow.publishedSnapshot || { nodes: [], edges: flow.edges || [] };
  const nodes = snapshot.nodes || [];
  const edges = snapshot.edges || flow.edges || [];
  if (!nodes.length) throw new Error('Flow has no nodes');

  const trigger = findTriggerNode(nodes);
  const variables = buildInitialVariables(lead, {
    last_reply: triggerPayload.text || triggerPayload.body || '',
    ...(triggerPayload.variables || {}),
  });

  const execution = await FlowExecution.create({
    businessId: business._id,
    flowId: flow._id,
    flowVersion: flow.publishedVersion || flow.version || 1,
    leadId: lead?._id,
    conversationId,
    phone: lead?.whatsapp || lead?.phone,
    status: isTest ? 'test' : 'active',
    currentNodeKey: trigger.id,
    variables,
    isTest,
    logs: [{ nodeKey: trigger.id, nodeType: trigger.type, status: 'entered', message: 'Flow started' }],
  });

  if (!isTest) {
    await bumpFlowAnalytics(flow._id, { 'analytics.totalExecutions': 1, 'analytics.active': 1 });
  }

  return continueExecution(execution._id, { business, lead, nodes, edges, inboundText: variables.last_reply });
}

/**
 * Resume executions waiting for a reply.
 */
export async function resumeFlowWaitForReply({ businessId, leadId, text, buttonId, listId }) {
  const reply = text || buttonId || listId || '';
  const now = new Date();
  const waiting = await FlowExecution.find({
    businessId,
    leadId,
    status: 'waiting',
    'wait.type': 'reply',
    $or: [
      { 'wait.until': { $exists: false } }, // No timeout set
      { 'wait.until': { $gte: now } }, // Timeout not reached yet
    ],
  }).limit(5);

  // Mark expired waits as failed
  await FlowExecution.updateMany(
    {
      businessId,
      leadId,
      status: 'waiting',
      'wait.type': 'reply',
      'wait.until': { $exists: true, $lt: now },
    },
    {
      $set: {
        status: 'failed',
        error: 'Reply timeout exceeded',
        completedAt: now,
        'wait.type': null,
      },
    }
  );

  const results = [];
  for (const execution of waiting) {
    const saveAs = execution.wait?.saveAs || 'last_reply';
    execution.variables = {
      ...(execution.variables || {}),
      [saveAs]: reply,
      last_reply: reply,
      ...(buttonId ? { button_id: buttonId } : {}),
      ...(listId ? { list_id: listId } : {}),
    };
    execution.wait = { type: null };
    execution.status = execution.isTest ? 'test' : 'active';
    execution.lastActivityAt = new Date();
    execution.logs.push({
      nodeKey: execution.currentNodeKey,
      status: 'completed',
      message: `Reply received: ${String(reply).slice(0, 120)}`,
    });
    await execution.save();

    const flow = await WhatsAppFlow.findById(execution.flowId).lean();
    if (!flow) continue;
    const snapshot = flow.publishedSnapshot || { nodes: [], edges: [] };
    const business = await Business.findById(businessId);
    const lead = await Lead.findById(leadId);
    results.push(
      await continueExecution(execution._id, {
        business,
        lead,
        nodes: snapshot.nodes || [],
        edges: snapshot.edges || flow.edges || [],
        inboundText: reply,
        fromWait: true,
      })
    );
  }
  return results;
}

/**
 * Resume delay waits that are due.
 */
export async function resumeDueFlowDelays(limit = 50) {
  const due = await FlowExecution.find({
    status: 'waiting',
    'wait.type': 'delay',
    'wait.until': { $lte: new Date() },
  }).limit(limit);

  for (const execution of due) {
    execution.wait = { type: null };
    execution.status = execution.isTest ? 'test' : 'active';
    await execution.save();
    const flow = await WhatsAppFlow.findById(execution.flowId).lean();
    if (!flow) continue;
    const snapshot = flow.publishedSnapshot || { nodes: [], edges: [] };
    const business = await Business.findById(execution.businessId);
    const lead = execution.leadId ? await Lead.findById(execution.leadId) : null;
    await continueExecution(execution._id, {
      business,
      lead,
      nodes: snapshot.nodes || [],
      edges: snapshot.edges || flow.edges || [],
      fromWait: true,
    });
  }
  return due.length;
}

async function continueExecution(executionId, ctx) {
  let execution = await FlowExecution.findById(executionId);
  if (!execution) return null;

  const { business, lead, nodes, edges } = ctx;
  let steps = 0;
  let nodeKey = execution.currentNodeKey;

  // After wait-for-reply completes, advance to next edge first
  if (ctx.fromWait && nodeKey) {
    const targets = nextNodes(edges, nodeKey, 'default');
    nodeKey = targets[0] || null;
    execution.currentNodeKey = nodeKey;
  }

  while (nodeKey && steps < MAX_STEPS) {
    steps += 1;
    const node = getNode(nodes, nodeKey);
    if (!node) {
      await failExecution(execution, `Node not found: ${nodeKey}`);
      return execution;
    }

    const started = Date.now();
    await bumpNodeAnalytics(execution.flowId, node.id, 'entered');
    execution.logs.push({ nodeKey: node.id, nodeType: node.type, status: 'entered' });
    execution.currentNodeKey = node.id;
    execution.lastActivityAt = new Date();

    try {
      const result = await executeNode(node, {
        business,
        lead,
        execution,
        variables: execution.variables || {},
        edges,
        nodes,
        isTest: execution.isTest,
      });

      if (result.variables) {
        execution.variables = { ...execution.variables, ...result.variables };
      }

      if (result.wait) {
        execution.status = 'waiting';
        execution.wait = result.wait;
        execution.logs.push({
          nodeKey: node.id,
          nodeType: node.type,
          status: 'waiting',
          message: result.message || 'Waiting',
          durationMs: Date.now() - started,
        });
        await execution.save();
        return execution;
      }

      if (result.end) {
        await completeExecution(execution, result.converted);
        await bumpNodeAnalytics(execution.flowId, node.id, 'completed');
        return execution;
      }

      execution.logs.push({
        nodeKey: node.id,
        nodeType: node.type,
        status: 'completed',
        message: result.message || 'OK',
        durationMs: Date.now() - started,
      });
      await bumpNodeAnalytics(execution.flowId, node.id, 'completed');

      const handle = result.nextHandle || 'default';
      if (result.gotoNodeKey) {
        nodeKey = result.gotoNodeKey;
      } else {
        const targets = nextNodes(edges, node.id, handle);
        // For triggers, also try any outgoing edge
        nodeKey = targets[0] || (String(node.type).startsWith('trigger_')
          ? nextNodes(edges, node.id).concat(nextNodes(edges, node.id, 'default'))[0]
          : null);
        if (!nodeKey && String(node.type).startsWith('trigger_')) {
          const any = edges.find((e) => e.source === node.id);
          nodeKey = any?.target || null;
        }
      }
      execution.currentNodeKey = nodeKey;
      await execution.save();
    } catch (err) {
      await failExecution(execution, err.message || String(err));
      await bumpNodeAnalytics(execution.flowId, node.id, 'dropped');
      return execution;
    }
  }

  if (!nodeKey) {
    await completeExecution(execution, false);
  }
  return execution;
}

async function completeExecution(execution, converted = false) {
  const wasActive = ['active', 'waiting', 'test'].includes(execution.status);
  execution.status = execution.isTest ? 'test' : 'completed';
  execution.completedAt = new Date();
  execution.wait = { type: null };
  execution.logs.push({ status: 'completed', message: 'Flow completed' });
  await execution.save();
  if (!execution.isTest && wasActive) {
    const duration = execution.completedAt - (execution.startedAt || execution.createdAt);
    await bumpFlowAnalytics(execution.flowId, {
      'analytics.active': -1,
      'analytics.completed': 1,
      'analytics.totalCompletionMs': Math.max(0, duration),
      ...(converted ? { 'analytics.conversions': 1 } : {}),
    });
  }
}

async function failExecution(execution, error) {
  execution.status = 'failed';
  execution.error = error;
  execution.completedAt = new Date();
  execution.logs.push({ status: 'failed', message: error });
  await execution.save();
  if (!execution.isTest) {
    await bumpFlowAnalytics(execution.flowId, {
      'analytics.active': -1,
      'analytics.failed': 1,
      'analytics.dropped': 1,
    });
  }
}

async function executeNode(node, ctx) {
  const { business, lead, variables, isTest } = ctx;
  const data = node.data || {};
  const type = node.type;

  // Triggers just pass through
  if (String(type).startsWith('trigger_')) {
    return { message: 'Trigger matched' };
  }

  switch (type) {
    case 'action_send_text': {
      const text = renderTemplate(data.text || '', variables);
      if (!isTest && lead && business) {
        const result = await sendAutoWhatsApp(lead, business, text);
        if (!result.success) throw new Error(result.error || 'Failed to send text');
      }
      return { message: `Sent text: ${text.slice(0, 80)}` };
    }
    case 'action_send_template': {
      const text = renderTemplate(data.preview || data.text || data.templateName || '', variables);
      if (!isTest && lead && business) {
        const result = await sendAutoWhatsApp(
          lead,
          business,
          text,
          data.templateName,
          data.headerMedia || null,
          data.language || 'en'
        );
        if (!result.success) throw new Error(result.error || 'Failed to send template');
      }
      return { message: `Sent template: ${data.templateName}` };
    }
    case 'action_send_image':
    case 'action_send_video':
    case 'action_send_document':
    case 'action_send_audio': {
      const mediaType = type.replace('action_send_', '');
      const caption = renderTemplate(data.caption || '', variables);
      if (!isTest && lead && business) {
        const result = await sendMetaMediaMessage(lead, business, {
          mediaUrl: data.mediaUrl,
          mimeType: data.mimeType,
          fileName: data.fileName,
          caption,
          messageType: mediaType,
        });
        if (!result.success) throw new Error(result.error || 'Media send failed');
      }
      return { message: `Sent ${mediaType}` };
    }
    case 'action_send_buttons': {
      const body = renderTemplate(data.body || '', variables);
      if (!isTest && lead && business) {
        await sendInteractiveButtons(lead, business, {
          body,
          buttons: data.buttons || [],
          header: renderTemplate(data.header || '', variables),
          footer: renderTemplate(data.footer || '', variables),
        });
      }
      return {
        wait: {
          type: 'reply',
          saveAs: data.saveAs || 'last_reply',
          expectedButtons: (data.buttons || []).map((b) => b.id),
          nodeKey: node.id,
        },
        message: 'Sent buttons — waiting for reply',
      };
    }
    case 'action_send_list': {
      const body = renderTemplate(data.body || '', variables);
      if (!isTest && lead && business) {
        await sendInteractiveList(lead, business, {
          body,
          buttonText: data.buttonText,
          sections: data.sections || [],
          header: data.header,
          footer: data.footer,
        });
      }
      return {
        wait: {
          type: 'reply',
          saveAs: data.saveAs || 'last_reply',
          nodeKey: node.id,
        },
        message: 'Sent list — waiting for reply',
      };
    }
    case 'action_delay': {
      const seconds = Math.max(1, Number(data.delaySeconds) || 60);
      return {
        wait: {
          type: 'delay',
          until: new Date(Date.now() + seconds * 1000),
          nodeKey: node.id,
        },
        message: `Delay ${seconds}s`,
      };
    }
    case 'logic_wait_reply': {
      return {
        wait: {
          type: 'reply',
          saveAs: data.saveAs || 'last_reply',
          until: data.timeoutMinutes
            ? new Date(Date.now() + Number(data.timeoutMinutes) * 60 * 1000)
            : undefined,
          nodeKey: node.id,
        },
        message: 'Waiting for reply',
      };
    }
    case 'logic_save_variable': {
      const key = data.key || 'custom_var';
      const value = renderTemplate(data.value || '', variables);
      return { variables: { [key]: value }, message: `Saved ${key}` };
    }
    case 'logic_if_else': {
      const ok = evaluateCondition(variables, data);
      return { nextHandle: ok ? 'true' : 'false', message: `Condition → ${ok}` };
    }
    case 'logic_switch': {
      const val = String(variables[data.variable] || '').toLowerCase();
      const cases = data.cases || [];
      const match = cases.find((c) => String(c.value || '').toLowerCase() === val);
      return { nextHandle: match?.handle || 'default', message: `Switch → ${match?.handle || 'default'}` };
    }
    case 'logic_goto': {
      return { gotoNodeKey: data.targetNodeKey, message: `Goto ${data.targetNodeKey}` };
    }
    case 'action_add_tag': {
      if (lead && data.tag) {
        const tags = new Set([...(lead.tags || []), data.tag]);
        lead.tags = [...tags];
        if (!ctx.execution.isTest) await lead.save();
      }
      return { message: `Added tag ${data.tag}` };
    }
    case 'action_remove_tag': {
      if (lead && data.tag) {
        lead.tags = (lead.tags || []).filter((t) => t !== data.tag);
        if (!ctx.execution.isTest) await lead.save();
      }
      return { message: `Removed tag ${data.tag}` };
    }
    case 'action_update_lead': {
      if (lead && data.fields && typeof data.fields === 'object') {
        for (const [k, v] of Object.entries(data.fields)) {
          lead[k] = renderTemplate(String(v), variables);
        }
        if (!ctx.execution.isTest) await lead.save();
      }
      return { message: 'Lead updated' };
    }
    case 'action_create_lead': {
      if (!ctx.execution.isTest) {
        const LeadModel = Lead;
        await LeadModel.create({
          businessId: business._id,
          name: renderTemplate(data.name || 'WhatsApp Lead', variables),
          phone: renderTemplate(data.phone || variables.phone || '', variables),
          source: data.source || 'whatsapp_flow',
        });
      }
      return { message: 'Lead created' };
    }
    case 'action_update_contact':
    case 'action_assign': {
      return { message: `${type} (noop or applied)` };
    }
    case 'action_http':
    case 'action_webhook': {
      if (!isTest && data.url) {
        const bodyStr = renderTemplate(data.body || '{}', variables);
        await fetchExternal(data.url, {
          method: data.method || 'POST',
          headers: { 'Content-Type': 'application/json', ...(data.headers || {}) },
          body: bodyStr,
        });
      }
      return { message: 'HTTP request sent' };
    }
    case 'action_ai_response': {
      const prompt = renderTemplate(data.prompt || '', variables);
      // Lightweight fallback — store prompt as reply text for test / when AI unavailable
      let aiText = `Thanks for your message. Our team will help you shortly.`;
      try {
        const { generateChatReply } = await import('@/lib/ai/chatReply').catch(() => ({}));
        if (typeof generateChatReply === 'function') {
          aiText = await generateChatReply({ business, lead, prompt, variables });
        }
      } catch {
        /* use fallback */
      }
      if (!isTest && lead && business) {
        await sendAutoWhatsApp(lead, business, aiText);
      }
      return {
        variables: { [data.saveAs || 'ai_reply']: aiText },
        message: 'AI response sent',
      };
    }
    case 'action_end': {
      return { end: true, converted: Boolean(data.markConverted), message: 'End' };
    }
    default:
      return { message: `Skipped unknown node ${type}` };
  }
}

/**
 * Match published flows for an inbound WhatsApp event.
 */
export async function matchAndStartFlows({ business, lead, text = '', conversationId = null, event = 'incoming_message' }) {
  const triggerMap = {
    incoming_message: ['incoming_message'],
    keyword: ['keyword'],
    lead_created: ['lead_created'],
    contact_created: ['contact_created'],
    manual: ['manual'],
    webhook: ['webhook'],
  };
  // Incoming WhatsApp also evaluates keyword flows
  const triggerTypes = event === 'incoming_message'
    ? ['incoming_message', 'keyword']
    : (triggerMap[event] || [event]);

  const flows = await WhatsAppFlow.find({
    businessId: business._id,
    status: 'published',
    triggerType: { $in: triggerTypes },
  }).lean();

  const started = [];
  const normalized = String(text || '').toLowerCase().trim();

  for (const flow of flows) {
    if (flow.triggerType === 'keyword') {
      const keywords = (flow.triggerConfig?.keywords || []).map((k) => String(k).toLowerCase());
      const mode = flow.triggerConfig?.matchMode || 'contains';
      const hit = keywords.some((k) => {
        if (!k) return false;
        if (mode === 'exact') return normalized === k;
        return normalized.includes(k);
      });
      if (!hit) continue;
    }

    // Avoid duplicate active executions for same lead+flow
    const existing = await FlowExecution.findOne({
      businessId: business._id,
      flowId: flow._id,
      leadId: lead._id,
      status: { $in: ['active', 'waiting'] },
    });
    if (existing) continue;

    try {
      const full = await WhatsAppFlow.findById(flow._id);
      const exec = await startFlowExecution({
        flow: full,
        business,
        lead,
        conversationId,
        triggerPayload: { text },
      });
      started.push(exec);
    } catch (err) {
      console.error('[WhatsAppFlow] start failed:', err.message);
    }
  }
  return started;
}

export default {
  startFlowExecution,
  resumeFlowWaitForReply,
  resumeDueFlowDelays,
  matchAndStartFlows,
};
