import Lead from '@/models/automation/Lead';
import { pickTaskTypeForLead } from '@/lib/crm/taskType';
import Task from '@/models/automation/Task';
import Deal from '@/models/automation/Deal';
import Contact from '@/models/automation/Contact';
import CrmNote from '@/models/automation/CrmNote';
import Notification from '@/models/automation/Notification';
import Activity from '@/models/automation/Activity';
import { sendCustomerEmail } from '@/lib/integrations/email';
import { sendAutoWhatsApp } from '@/lib/integrations/whatsapp';
import { sendInstagramMessage, sendInstagramMedia } from '@/lib/social/guardedSend';
import { assignLead } from '@/lib/automation/assignment';
import { requiresApproval } from '@/lib/automation/approvalGate';
import { evaluateCondition } from './conditions';

function getInstagramRecipientId(lead) {
  const meta = lead.metadata;
  if (meta instanceof Map) return meta.get('instagramId');
  if (meta && typeof meta === 'object') return meta.instagramId || meta.get?.('instagramId');
  return null;
}

function applyVars(text, lead, business) {
  if (!text) return '';
  return text
    .replace(/\{\{name\}\}/gi, lead.name || '')
    .replace(/\{\{lead\.name\}\}/gi, lead.name || '')
    .replace(/\{\{phone\}\}/gi, lead.phone || '')
    .replace(/\{\{lead\.phone\}\}/gi, lead.phone || '')
    .replace(/\{\{email\}\}/gi, lead.email || '')
    .replace(/\{\{lead\.email\}\}/gi, lead.email || '')
    .replace(/\{\{business\.name\}\}/gi, business?.businessName || '')
    .replace(/\{\{serviceInterest\}\}/gi, lead.serviceInterest || '');
}

async function executeHttpRequest(url, method, headers, body) {
  const res = await fetch(url, {
    method: method || 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { success: res.ok, status: res.status, body: text };
}

/**
 * Execute a single workflow node
 */
export async function executeNode(node, lead, business, execution, options = {}) {
  const data = node.data || {};
  const testMode = options.testMode || execution?.testMode;
  const log = { nodeId: node.id, nodeType: node.type, status: 'running', executedAt: new Date() };

  try {
    switch (node.type) {
      case 'send_whatsapp': {
        const msg = applyVars(data.message || data.body || '', lead, business);
        const approval = requiresApproval(node, business, lead);
        if (approval && !testMode && !options.approved) {
          log.status = 'pending';
          log.message = 'Awaiting approval for WhatsApp';
          log.metadata = { pendingApproval: true, approval, channel: 'whatsapp' };
          return { log, complete: false, pendingApproval: true, approval };
        }
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] WhatsApp preview: ${msg.slice(0, 80)}…`;
          log.metadata = { channel: 'whatsapp', testMode: true };
          break;
        }
        const result = await sendAutoWhatsApp(lead, business, msg, data.templateName);
        log.status = result.success ? 'success' : 'failed';
        log.message = result.success ? 'WhatsApp sent' : (result.error || 'WhatsApp failed');
        log.metadata = { channel: 'whatsapp' };
        break;
      }
      case 'send_email': {
        const body = applyVars(data.body || data.message || '', lead, business);
        const subject = applyVars(data.subject || 'Message from us', lead, business);
        const approval = requiresApproval(node, business, lead);
        if (approval && !testMode && !options.approved) {
          log.status = 'pending';
          log.message = 'Awaiting approval';
          log.metadata = { pendingApproval: true, approval };
          return { log, complete: false, pendingApproval: true, approval };
        }
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] Email preview: ${subject}`;
          log.metadata = { channel: 'email', testMode: true };
          break;
        }
        const result = await sendCustomerEmail(lead, business, body, subject, { origin: 'sequence' });
        log.status = result.success ? 'success' : 'failed';
        log.message = result.success ? 'Email sent' : (result.error || 'Email failed');
        log.metadata = { channel: 'email' };
        break;
      }
      case 'send_instagram_dm': {
        const msg = applyVars(data.message || data.body || '', lead, business);
        const recipientId = data.recipientId || getInstagramRecipientId(lead);
        const approval = requiresApproval(node, business, lead);
        if (approval && !testMode && !options.approved) {
          log.status = 'pending';
          log.message = 'Awaiting approval for Instagram DM';
          log.metadata = { pendingApproval: true, approval, channel: 'instagram' };
          return { log, complete: false, pendingApproval: true, approval };
        }
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] Instagram DM preview: ${msg.slice(0, 80)}…`;
          log.metadata = { channel: 'instagram', testMode: true };
          break;
        }
        if (!recipientId) {
          log.status = 'failed';
          log.message = 'No Instagram recipient ID on lead';
          break;
        }
        let result;
        if (data.mediaUrl) {
          result = await sendInstagramMedia(business, recipientId, {
            mediaUrl: data.mediaUrl,
            messageType: data.mediaType || 'image',
          });
        } else {
          result = await sendInstagramMessage(business, recipientId, msg);
        }
        log.status = result.success ? 'success' : 'failed';
        log.message = result.success ? 'Instagram DM sent' : (result.error || 'Instagram send failed');
        log.metadata = { channel: 'instagram', messageId: result.messageId, recipientId };
        break;
      }
      case 'assign_agent': {
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] Would assign via ${data.strategy || 'round-robin'}`;
          break;
        }
        await assignLead(lead, business, data.strategy);
        log.status = 'success';
        log.message = 'Agent assigned';
        break;
      }
      case 'add_tag': {
        const tag = data.tag || 'automated';
        if (!testMode) await Lead.updateOne({ _id: lead._id }, { $addToSet: { tags: tag } });
        log.status = 'success';
        log.message = testMode ? `[Test] Would add tag "${tag}"` : `Tag "${tag}" added`;
        break;
      }
      case 'create_task': {
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] Would create task: ${data.title || 'Follow up'}`;
          break;
        }
        await Task.create({
          businessId: business._id,
          leadId: lead._id,
          title: applyVars(data.title || 'Follow up', lead, business),
          description: data.description || 'Created by sequence automation',
          status: 'pending',
          priority: data.priority || 'medium',
          dueDate: new Date(Date.now() + (data.dueHours || 24) * 3600000),
          assignedTo: lead.assignedTo,
          type: data.taskType || pickTaskTypeForLead('call', lead),
        });
        log.status = 'success';
        log.message = 'Task created';
        break;
      }
      case 'move_pipeline':
      case 'update_lead': {
        const updates = {};
        if (data.priority) updates.priority = data.priority;
        if (data.customField && data.customValue !== undefined) {
          updates[`metadata.customFields.${data.customField}`] = data.customValue;
        }
        if (!testMode && Object.keys(updates).length) {
          await Lead.updateOne({ _id: lead._id }, { $set: updates });
        }
        if (data.stage) {
          log.status = 'success';
          log.message = testMode
            ? `[Test] Stage "${data.stage}" suggested — salesperson must update manually`
            : `Stage "${data.stage}" suggested — update pipeline manually`;
          log.metadata = { suggestedStage: data.stage, autoStageChange: false };
        } else {
          log.status = 'success';
          log.message = testMode ? `[Test] Would update lead` : 'Lead updated';
        }
        break;
      }
      case 'create_deal': {
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] Would create deal: ${data.title || lead.name}`;
          break;
        }
        await Deal.create({
          businessId: business._id,
          leadId: lead._id,
          title: applyVars(data.title || `Deal — ${lead.name}`, lead, business),
          value: data.value || 0,
          stage: data.stage || 'new',
          assignedTo: lead.assignedTo,
        });
        log.status = 'success';
        log.message = 'Deal created';
        break;
      }
      case 'add_note': {
        if (testMode) {
          log.status = 'success';
          log.message = '[Test] Would add note';
          break;
        }
        await CrmNote.create({
          businessId: business._id,
          leadId: lead._id,
          content: applyVars(data.note || data.body || '', lead, business),
          createdBy: business.ownerId,
        });
        log.status = 'success';
        log.message = 'Note added';
        break;
      }
      case 'archive_lead':
      case 'delete_lead': {
        if (!testMode) {
          if (node.type === 'delete_lead') {
            await Lead.deleteOne({ _id: lead._id });
          } else {
            await Lead.updateOne({ _id: lead._id }, { $set: { archived: true } });
          }
        }
        log.status = 'success';
        log.message = testMode ? `[Test] Would ${node.type.replace('_lead', '')} lead` : `Lead ${node.type.replace('_lead', '')}d`;
        if (node.type === 'delete_lead') return { log, complete: true };
        break;
      }
      case 'notify_team': {
        const msg = applyVars(data.message || `Lead ${lead.name} needs attention`, lead, business);
        const recipients = business.settings?.notifications?.email?.recipients || [];
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] Would notify ${recipients.length} team members`;
          break;
        }
        if (recipients.length) {
          // Team notification — no lead._id passed, so recordChannelMessage
          // is skipped by the guard in sendCustomerEmail. Origin still set
          // for consistency; log analytics can distinguish 'system'.
          await sendCustomerEmail(
            { email: recipients.join(', '), name: 'Team' },
            business,
            msg,
            data.subject || `Automation: ${lead.name}`,
            { origin: 'system' }
          );
        }
        await Notification.create({
          businessId: business._id,
          userId: lead.assignedTo || business.ownerId,
          type: 'automation_alert',
          title: 'Workflow notification',
          message: msg,
          metadata: { leadId: lead._id, sequenceExecutionId: execution._id },
        });
        log.status = 'success';
        log.message = 'Team notified';
        break;
      }
      case 'push_notification': {
        if (!testMode) {
          await Notification.create({
            businessId: business._id,
            userId: lead.assignedTo || business.ownerId,
            type: 'automation_alert',
            title: applyVars(data.title || 'Automation alert', lead, business),
            message: applyVars(data.message || '', lead, business),
            metadata: { leadId: lead._id },
          });
        }
        log.status = 'success';
        log.message = testMode ? '[Test] Push notification preview' : 'Push notification sent';
        break;
      }
      case 'delay':
        log.status = 'success';
        log.message = `Delay ${data.delayHours || 0}h ${data.delayMinutes || 0}m scheduled`;
        log.metadata = {
          delayMs: ((data.delayHours || 0) * 3600000) + ((data.delayMinutes || 0) * 60000),
          waitType: data.waitType || 'fixed',
        };
        break;
      case 'split':
      case 'condition': {
        const passed = evaluateCondition(data, lead, execution?.context || {});
        log.status = 'success';
        log.message = passed ? 'Condition passed' : 'Condition failed';
        log.metadata = { branch: passed ? 'true' : 'false', splitKey: data.branchKey || 'default' };
        break;
      }
      case 'wait_until':
        log.status = 'success';
        log.message = 'Wait until scheduled';
        log.metadata = {
          waitUntil: data.datetime,
          waitType: data.waitType || 'datetime',
          delayMs: Math.max(0, new Date(data.datetime || Date.now()).getTime() - Date.now()),
        };
        break;
      case 'wait_reply':
      case 'wait_payment':
      case 'wait_meeting':
      case 'wait_deal_won':
        log.status = 'success';
        log.message = `Waiting: ${node.type.replace('wait_', '')}`;
        log.metadata = { waitType: node.type, delayMs: (data.timeoutHours || 72) * 3600000 };
        break;
      case 'webhook':
      case 'http_request': {
        const url = data.url;
        if (!url) {
          log.status = 'failed';
          log.message = 'Webhook URL not configured';
          break;
        }
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] Would call ${url}`;
          log.metadata = { url, testMode: true };
          break;
        }
        const payload = {
          lead: { id: lead._id, name: lead.name, email: lead.email, phone: lead.phone, status: lead.status },
          business: { id: business._id, name: business.businessName },
          executionId: execution._id,
          nodeId: node.id,
        };
        const result = await executeHttpRequest(url, data.method, data.headers, payload);
        log.status = result.success ? 'success' : 'failed';
        log.message = result.success ? `Webhook ${result.status}` : `Webhook failed: ${result.status}`;
        log.metadata = { url, status: result.status };
        break;
      }
      case 'ai_whatsapp_reply': {
        let aiMsg;
        if (testMode) {
          aiMsg = `[Test AI Reply for ${lead.name}]`;
        } else {
          const { generateReply } = await import('@/lib/ai/reply');
          const result = await generateReply({
            businessId: business._id,
            businessName: business.businessName,
            channel: 'whatsapp',
            style: data.tone || 'smart',
            customerName: lead.name,
            lastMessage: data.prompt || lead.serviceInterest || '',
            leadId: lead._id,
          });
          aiMsg = result.reply;
        }
        if (!testMode) {
          const result = await sendAutoWhatsApp(lead, business, aiMsg);
          log.status = result.success ? 'success' : 'failed';
          log.message = result.success ? 'AI WhatsApp reply sent' : (result.error || 'Failed');
        } else {
          log.status = 'success';
          log.message = `[Test] AI reply: ${aiMsg.slice(0, 60)}…`;
        }
        log.metadata = { ai: true, tone: data.tone };
        break;
      }
      case 'ai_qualification':
      case 'ai_scoring': {
        if (testMode) {
          log.status = 'success';
          log.message = '[Test] AI qualification preview';
          break;
        }
        const { qualifyLead } = await import('@/lib/ai/qualify');
        const qual = await qualifyLead({ lead });
        await Lead.updateOne(
          { _id: lead._id },
          {
            $set: {
              'metadata.score': qual.leadScore,
              'metadata.qualification': qual,
              'metadata.temperature': qual.temperature,
            },
          }
        );
        log.status = 'success';
        log.message = `AI score: ${qual.leadScore} (${qual.temperature})`;
        log.metadata = { ai: true, score: qual.leadScore, temperature: qual.temperature };
        break;
      }
      case 'ai_summary':
      case 'ai_email':
      case 'ai_translate':
      case 'ai_intent':
      case 'ai_followup_timing': {
        if (testMode) {
          log.status = 'success';
          log.message = `[Test] AI action: ${node.type}`;
          break;
        }
        const { generateReply } = await import('@/lib/ai/reply');
        const result = await generateReply({
          businessId: business._id,
          businessName: business.businessName,
          channel: node.type === 'ai_email' ? 'email' : 'whatsapp',
          customerName: lead.name,
          lastMessage: data.prompt || '',
          leadId: lead._id,
        });
        if (node.type === 'ai_email') {
          await sendCustomerEmail(lead, business, result.reply, applyVars(data.subject || 'Update', lead, business), { origin: 'sequence' });
        } else {
          await sendAutoWhatsApp(lead, business, result.reply);
        }
        log.status = 'success';
        log.message = `AI action: ${node.type.replace('ai_', '')}`;
        log.metadata = { ai: true };
        break;
      }
      case 'create_contact': {
        if (!testMode) {
          await Contact.create({
            businessId: business._id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            leadId: lead._id,
            source: lead.source,
          });
        }
        log.status = 'success';
        log.message = testMode ? '[Test] Would create contact' : 'Contact created';
        break;
      }
      case 'parallel_branch':
        log.status = 'success';
        log.message = 'Parallel branch started';
        log.metadata = { parallel: true };
        break;
      case 'merge':
      case 'wait_for_all':
      case 'wait_for_any':
        log.status = 'success';
        log.message = `Flow control: ${node.type}`;
        log.metadata = { flowControl: node.type };
        break;
      case 'loop': {
        const max = data.maxIterations || data.max || 10;
        const count = (execution?.context?.loopCounts?.[node.id] || 0) + 1;
        log.status = 'success';
        log.message = `Loop iteration ${count}/${max}`;
        log.metadata = { loop: true, iteration: count, maxIterations: max, continueLoop: count < max };
        break;
      }
      case 'for_each':
        log.status = 'success';
        log.message = `For-each over ${data.field || 'items'}`;
        log.metadata = { forEach: true, field: data.field };
        break;
      case 'goto':
        log.status = 'success';
        log.message = `Go to ${data.targetNodeId || data.nodeId || 'next'}`;
        log.metadata = { goto: data.targetNodeId || data.nodeId };
        break;
      case 'exit_workflow':
        log.status = 'success';
        log.message = 'Workflow exited';
        return { log, complete: true };
      case 'break_loop':
        log.status = 'success';
        log.message = 'Break loop';
        log.metadata = { breakLoop: true };
        break;
      case 'continue_loop':
        log.status = 'success';
        log.message = 'Continue loop';
        log.metadata = { continueLoop: true };
        break;
      case 'sub_workflow': {
        if (!testMode && data.sequenceId) {
          const { sequenceEngine } = await import('./engine');
          await sequenceEngine.startWorkflow(lead, data.sequenceId, null, { context: { parentExecutionId: execution._id } });
        }
        log.status = 'success';
        log.message = testMode ? `[Test] Would run sub-workflow ${data.sequenceId}` : 'Sub-workflow started';
        log.metadata = { subWorkflowId: data.sequenceId };
        break;
      }
      case 'approval': {
        if (!testMode) {
          log.status = 'pending';
          log.message = data.message || 'Awaiting approval';
          log.metadata = {
            pendingApproval: true,
            approverRoles: data.approverRoles || ['admin', 'owner'],
            approvalType: data.approvalType || 'manager',
          };
          return { log, complete: false, pendingApproval: true };
        }
        log.status = 'success';
        log.message = '[Test] Approval gate preview';
        break;
      }
      case 'end':
        log.status = 'success';
        log.message = 'Sequence completed';
        return { log, complete: true };
      default:
        if (node.type?.startsWith('trigger_')) {
          log.status = 'success';
          log.message = 'Trigger passed';
          break;
        }
        log.status = 'skipped';
        log.message = `Unknown node type: ${node.type}`;
    }

    if (!testMode) {
      await Activity.create({
        leadId: lead._id,
        businessId: business._id,
        type: 'automation_executed',
        description: log.message,
        performedBy: business.ownerId,
        metadata: { sequenceExecutionId: execution._id, nodeId: node.id, nodeType: node.type, ...log.metadata },
      });
    }

    return { log, complete: false };
  } catch (err) {
    log.status = 'failed';
    log.message = err.message;
    return { log, complete: false, error: err.message };
  }
}

export function getOutgoingEdges(sequence, nodeId, branch) {
  const edges = sequence.edges || [];
  return edges.filter((e) => {
    if (e.source !== nodeId) return false;
    if (branch && e.label) return e.label.toLowerCase() === branch.toLowerCase();
    if (branch === 'false') return e.label?.toLowerCase() === 'no' || e.sourceHandle === 'false';
    if (branch === 'true') return !e.label || e.label?.toLowerCase() === 'yes' || e.sourceHandle === 'true';
    return true;
  });
}

export function findTriggerNode(sequence) {
  return (sequence.nodes || []).find((n) => n.type?.startsWith('trigger_'));
}

export function findStartNode(sequence) {
  const trigger = findTriggerNode(sequence);
  if (!trigger) return (sequence.nodes || [])[0];
  const edge = (sequence.edges || []).find((e) => e.source === trigger.id);
  if (edge) return (sequence.nodes || []).find((n) => n.id === edge.target);
  return trigger;
}
