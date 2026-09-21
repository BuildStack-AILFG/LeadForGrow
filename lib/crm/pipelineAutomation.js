/**
 * Enterprise pipeline automation — runs AROUND stages, never changes them automatically.
 * Stages are changed only by users (or optional payment-confirmed business rule).
 */
import Task from '@/models/automation/Task';
import Notification from '@/models/automation/Notification';
import User from '@/models/User';
import Lead from '@/models/automation/Lead';
import Business from '@/models/Business';
import { logTimelineEvent } from '@/lib/crm/timeline';
import { findDuplicateLeads } from '@/lib/crm/duplicateDetection';
import { getCrmSettings, LOST_REASONS, PAYMENT_ON_CONFIRM_MODES } from '@/lib/crm/crmSettings';
import { normalizeStageKey, isLostStage, isWonStage } from '@/lib/crm/stageKeys';
import { normalizeLeadStatus } from '@/lib/crm/leadStages';
import { STAGE_PROBABILITY, stageLabel } from '@/lib/crm/pipelineStages';
import { startWorkflowRun, appendWorkflowStep, completeWorkflowRun } from '@/lib/crm/workflowTimeline';
import { syncLeadNextFollowUp } from '@/lib/crm/followUpSync';
import { buildTemplateContext, renderCrmTemplate, DEFAULT_CRM_TEMPLATES } from '@/lib/crm/templateVars';
import { sendAutoWhatsApp } from '@/lib/integrations/whatsapp';
import { pickTaskTypeForLead } from '@/lib/crm/taskType';
import { planWonThanks } from '@/lib/crm/wonThanks';
import { sendCustomerEmail } from '@/lib/integrations/email';
import { sendAssignmentNotification } from '@/lib/integrations/email';
import { dispatchAutomationEvent } from '@/lib/automation/triggerHub';

function setMeta(lead, key, value) {
  if (!lead.metadata) lead.metadata = new Map();
  if (typeof lead.metadata.set === 'function') lead.metadata.set(key, value);
  else lead.metadata[key] = value;
}

function getMeta(lead, key) {
  if (!lead.metadata) return undefined;
  if (typeof lead.metadata.get === 'function') return lead.metadata.get(key);
  return lead.metadata[key];
}

function hasAutomationFlag(lead, key) {
  return Boolean(getMeta(lead, `automation_${key}`));
}

function setAutomationFlag(lead, key, value = true) {
  setMeta(lead, `automation_${key}`, value);
}

async function persistLeadMeta(leadId, lead) {
  const meta = lead.metadata instanceof Map
    ? Object.fromEntries(lead.metadata)
    : (lead.metadata || {});
  await Lead.updateOne({ _id: leadId }, { $set: { metadata: meta } });
}

async function createTask({
  businessId, leadId, dealId, title, description, type = 'call',
  dueHours = 24, assignedTo, userId, priority = 'medium', dueDate = null,
}) {
  const due = dueDate || new Date(Date.now() + dueHours * 3600000);
  if (type === 'call' && leadId) {
    // A call task can't be done for a lead with no phone (e.g. Instagram/Messenger): use a channel that works.
    const leadDoc = await Lead.findById(leadId).select('phone email').lean();
    type = pickTaskTypeForLead(type, leadDoc);
  }
  const task = await Task.create({
    businessId,
    leadId,
    dealId,
    type,
    title,
    description,
    dueDate: due,
    assignedTo,
    priority,
    status: 'pending',
    createdBy: userId,
  });
  if (leadId) await syncLeadNextFollowUp(leadId, businessId);
  return task;
}

async function scheduleMeetingReminders({ businessId, leadId, meetingAt, assignedTo, userId, settings }) {
  if (!meetingAt || !settings?.meetingReminders) return;
  const offsets = [];
  if (settings.meetingReminders.hours24) offsets.push({ label: '24h before meeting', hours: -24 });
  if (settings.meetingReminders.hours1) offsets.push({ label: '1h before meeting', hours: -1 });
  if (settings.meetingReminders.minutes10) offsets.push({ label: '10m before meeting', hours: -10 / 60 });
  for (const off of offsets) {
    const due = new Date(meetingAt.getTime() + off.hours * 3600000);
    if (due > new Date()) {
      await createTask({
        businessId,
        leadId,
        title: off.label,
        description: 'CRM meeting reminder',
        type: 'meeting',
        dueDate: due,
        assignedTo,
        userId,
        priority: 'high',
      });
    }
  }
}

function buildMeetingLink(platform, customLink) {
  if (customLink) return customLink;
  if (platform === 'google_meet') return 'https://meet.google.com/new';
  if (platform === 'zoom') return 'https://zoom.us/';
  if (platform === 'teams') return 'https://teams.microsoft.com/';
  return '';
}

async function notifyUser({ businessId, userId, type, title, message, link, metadata }) {
  if (!userId) return;
  await Notification.create({
    businessId,
    userId,
    type: type || 'automation_alert',
    title,
    message,
    link,
    metadata,
  }).catch(() => {});
}

/**
 * New lead created — full onboarding automation. Does NOT change stage.
 */
export async function runNewLeadPipelineActions({
  lead,
  business,
  assignedTo,
  userId,
  isNew = true,
  isReEngagement = false,
}) {
  const settings = getCrmSettings(business);
  const workflowKey = isReEngagement ? 'reengagement_workflow' : 'new_lead_workflow';

  if (hasAutomationFlag(lead, workflowKey)) {
    return { skipped: true, reason: 'already_completed' };
  }

  const workflowName = isReEngagement ? 'Lead Re-engagement' : 'New Lead Workflow';
  const { groupId } = await startWorkflowRun({
    businessId: business._id,
    leadId: lead._id,
    workflowName,
  });

  const log = async (label, status = 'success', details = null) => {
    await appendWorkflowStep({
      businessId: business._id,
      leadId: lead._id,
      groupId,
      label,
      status,
      details,
    });
  };

  await log('Lead created');

  const duplicates = await findDuplicateLeads(business._id, {
    phone: lead.phone,
    email: lead.email,
    excludeId: lead._id,
  });
  await log('Duplicate check', 'success', { count: duplicates.length });
  if (duplicates.length) setMeta(lead, 'duplicateOf', duplicates[0]._id);

  await log('Source detected', 'success', { source: lead.source || 'unknown' });

  if (settings.runAiQualificationOnNewLead && isNew) {
    try {
      const { qualifyLead } = await import('@/lib/ai/qualify');
      const result = await qualifyLead({ lead, messages: [], notes: lead.notes || [] });
      setMeta(lead, 'aiQualification', result);
      setMeta(lead, 'leadScore', result.leadScore);
      setMeta(lead, 'aiQualificationReason', result.reasoning);
      setMeta(lead, 'aiStrengths', result.strengths);
      setMeta(lead, 'aiWeaknesses', result.weaknesses);
      await log('AI qualification', 'success', { score: result.leadScore });
    } catch (e) {
      const reason = e.message?.includes('timeout') ? 'API timeout' : e.message || 'unknown error';
      const msg = e.message?.includes('timeout')
        ? `AI qualification failed — reason: ${reason}`
        : 'Lead score unavailable — insufficient information.';
      await log('AI qualification', 'failed', { error: reason });
      await logTimelineEvent({
        businessId: business._id,
        entityType: 'lead',
        entityId: lead._id,
        leadId: lead._id,
        type: 'automation_executed',
        description: msg,
        performedBy: userId,
        dedupeKey: `ai_qual_${lead._id}`,
        metadata: { automation: 'ai_qualification', status: 'failed', reason },
      });
    }
  }

  if (assignedTo && !lead.assignedTo) {
    await Lead.updateOne({ _id: lead._id }, { $set: { assignedTo } });
    lead.assignedTo = assignedTo;
    await log('Assigned salesperson', 'success');
  } else if (assignedTo) {
    await log('Assigned salesperson', 'success');
  }

  if (assignedTo && !hasAutomationFlag(lead, 'assign_notify')) {
    const assignee = await User.findById(assignedTo).lean();
    if (assignee && business) {
      await sendAssignmentNotification(lead, business, assignee).catch(() => {});
      await notifyUser({
        businessId: business._id,
        userId: assignedTo,
        type: 'new_lead',
        title: `New lead: ${lead.name}`,
        message: `Assigned from ${lead.source || 'unknown source'}`,
        link: `/automation/leads/${lead._id}`,
      });
      setAutomationFlag(lead, 'assign_notify');
      await log('Salesperson notified', 'success');
    }
  }

  if (settings.notifyTeamOnNewLead && business.ownerId && assignedTo?.toString() !== business.ownerId?.toString()) {
    if (!hasAutomationFlag(lead, 'team_notify')) {
      await notifyUser({
        businessId: business._id,
        userId: business.ownerId,
        type: 'new_lead',
        title: `New lead: ${lead.name}`,
        message: 'A new lead entered the pipeline',
        link: `/automation/leads/${lead._id}`,
      });
      setAutomationFlag(lead, 'team_notify');
      await log('Team notified', 'success');
    }
  }

  if (settings.sendWelcomeWhatsApp && lead.phone && !hasAutomationFlag(lead, 'welcome_whatsapp')) {
    const tpl = settings.templates.welcomeWhatsApp || DEFAULT_CRM_TEMPLATES.welcome_whatsapp;
    const ctx = buildTemplateContext(lead, business);
    const msg = renderCrmTemplate(tpl, ctx);
    const result = await sendAutoWhatsApp(lead, business, msg).catch((e) => ({ success: false, error: e.message }));
    if (result?.success) {
      setAutomationFlag(lead, 'welcome_whatsapp');
      await log('Welcome WhatsApp sent', 'success');
      await logTimelineEvent({
        businessId: business._id,
        entityType: 'lead',
        entityId: lead._id,
        leadId: lead._id,
        type: 'whatsapp_sent',
        description: 'Welcome WhatsApp sent.',
        performedBy: userId,
        dedupeKey: `welcome_wa_${lead._id}`,
        metadata: { automation: 'welcome_whatsapp', status: 'success' },
      });
    } else {
      await log('Welcome WhatsApp sent', 'failed', { error: result?.error });
      await logTimelineEvent({
        businessId: business._id,
        entityType: 'lead',
        entityId: lead._id,
        leadId: lead._id,
        type: 'whatsapp_failed',
        description: `WhatsApp failed: ${result?.error || 'unknown error'}`,
        performedBy: userId,
        dedupeKey: `welcome_wa_fail_${lead._id}`,
        metadata: { automation: 'welcome_whatsapp', status: 'failed', error: result?.error },
      });
    }
  }

  if (settings.sendWelcomeEmail) {
    try {
      if (!lead.email?.trim()) {
        await log('Welcome email', 'skipped', { reason: 'No email on lead' });
        await logTimelineEvent({
          businessId: business._id,
          entityType: 'lead',
          entityId: lead._id,
          leadId: lead._id,
          type: 'email_failed',
          description: 'Welcome email skipped — no email address on lead',
          performedBy: userId,
          dedupeKey: `welcome_email_skip_${lead._id}`,
          metadata: { automation: 'welcome_email', status: 'skipped' },
        });
      } else if (!hasAutomationFlag(lead, 'welcome_email')) {
        const freshBusiness = await Business.findById(business._id).lean();
        const biz = freshBusiness || business;
        const tpl = settings.templates.welcomeEmail || DEFAULT_CRM_TEMPLATES.welcome_email;
        const ctx = buildTemplateContext(lead, biz);
        const body = renderCrmTemplate(tpl, ctx);
        let result = await sendCustomerEmail(lead, biz, body, 'Welcome').catch((e) => ({ success: false, error: e.message }));

        if (!result?.success) {
          const ackRule = await (await import('@/models/automation/AutomationRule')).default.findOne({
            businessId: business._id,
            type: 'instant_acknowledgement',
            enabled: true,
          }).lean();
          if (ackRule && ['email', 'both'].includes(ackRule.config?.channel) && ackRule.config?.messageTemplate) {
            result = await sendCustomerEmail(
              lead,
              biz,
              ackRule.config.messageTemplate,
              ackRule.config.emailSubject || 'Thank you for your interest'
            ).catch((e) => ({ success: false, error: e.message }));
            if (result?.success) {
              await log('Welcome email sent (automation rule)', 'success');
            }
          }
        }

        if (result?.success) {
          setAutomationFlag(lead, 'welcome_email');
          await log('Welcome email sent', 'success');
          await logTimelineEvent({
            businessId: business._id,
            entityType: 'lead',
            entityId: lead._id,
            leadId: lead._id,
            type: 'email_sent',
            description: 'Welcome email sent.',
            performedBy: userId,
            dedupeKey: `welcome_email_${lead._id}`,
            metadata: { automation: 'welcome_email', status: 'success' },
          });
        } else {
          await log('Welcome email sent', 'failed', { error: result?.error });
          await logTimelineEvent({
            businessId: business._id,
            entityType: 'lead',
            entityId: lead._id,
            leadId: lead._id,
            type: 'email_failed',
            description: `Email failed: ${result?.error || 'SMTP not configured — set up email in Integrations'}`,
            performedBy: userId,
            dedupeKey: `welcome_email_fail_${lead._id}`,
            metadata: { automation: 'welcome_email', status: 'failed', error: result?.error },
          });
        }
      }
    } catch (emailErr) {
      console.error('[Pipeline] Welcome email error:', emailErr);
      await log('Welcome email sent', 'failed', { error: emailErr.message }).catch(() => {});
    }
  }

  if (settings.autoCreateFollowUpTask && !hasAutomationFlag(lead, 'followup_task')) {
    await createTask({
      businessId: business._id,
      leadId: lead._id,
      title: `First follow-up: ${lead.name}`,
      description: 'CRM automation — initial outreach',
      dueHours: settings.defaultFollowUpHours,
      assignedTo: assignedTo || business.ownerId,
      userId: userId || business.ownerId,
      priority: 'high',
    });
    setAutomationFlag(lead, 'followup_task');
    await log('Follow-up task created', 'success', { hours: settings.defaultFollowUpHours });
  }

  setAutomationFlag(lead, workflowKey);
  await persistLeadMeta(lead._id, lead);

  await completeWorkflowRun({
    businessId: business._id,
    leadId: lead._id,
    groupId,
    status: 'success',
  });

  try {
    const { queueAutomation } = await import('@/lib/queue');
    const freshLead = await Lead.findById(lead._id);
    if (freshLead) await queueAutomation(freshLead, 'onLeadReceived');
  } catch (e) {
    console.error('[Pipeline] Supplementary automation rules error:', e.message);
  }

  return { groupId, workflowName };
}

/**
 * User manually changed lead stage — run stage-specific actions. Does NOT change stage.
 */
export async function runLeadStagePipelineActions({
  lead,
  business,
  oldStage,
  newStage,
  userId,
  body = {},
}) {
  const stage = normalizeStageKey(normalizeLeadStatus(newStage));
  const settings = getCrmSettings(business);
  const actions = [];

  if (isLostStage(stage) || stage === 'lost') {
    const reason = body.lostReason || getMeta(lead, 'lostReason');
    if (settings.requireLostReason && !reason) {
      const err = new Error('Lost reason is required');
      err.code = 'LOST_REASON_REQUIRED';
      throw err;
    }
    if (reason) {
      setMeta(lead, 'lostReason', reason);
      await Lead.updateOne({ _id: lead._id }, { $set: { lostAt: new Date(), 'metadata.lostReason': reason } });
      actions.push('lost_reason_saved');
      try {
        const { chatCompletion } = await import('@/lib/ai/providers');
        const result = await chatCompletion({
          messages: [{
            role: 'user',
            content: `Analyze why this B2B lead was lost. Reason: ${reason}. Lead: ${lead.name}, interest: ${lead.serviceInterest}. One sentence insight.`,
          }],
          temperature: 0.3,
        });
        if (result.content) setMeta(lead, 'lossAnalysis', result.content);
      } catch { /* optional */ }
      await logTimelineEvent({
        businessId: business._id,
        entityType: 'lead',
        entityId: lead._id,
        leadId: lead._id,
        type: 'lost',
        description: `Marked lost: ${LOST_REASONS.find((r) => r.key === reason)?.label || reason}`,
        performedBy: userId,
        metadata: { lostReason: reason, automation: 'stage_lost' },
      });
    }
  }

  if (stage === 'qualified') {
    const dedupeKey = `stage_qualified_${lead._id}`;
    if (!hasAutomationFlag(lead, 'stage_qualified')) {
      setMeta(lead, 'qualifiedAt', new Date());
      const ai = getMeta(lead, 'aiQualification');
      if (ai?.reasoning) setMeta(lead, 'qualificationReason', ai.reasoning);
      if (body.dealAmount) {
        setMeta(lead, 'amount', body.dealAmount);
        setMeta(lead, 'dealAmount', body.dealAmount);
      }
      await createTask({
        businessId: business._id,
        leadId: lead._id,
        title: `Qualification follow-up: ${lead.name}`,
        description: 'Confirm needs and schedule next step',
        assignedTo: lead.assignedTo || userId,
        userId,
      });
      setAutomationFlag(lead, 'stage_qualified');
      actions.push('qualified_automation');
      await logTimelineEvent({
        businessId: business._id,
        entityType: 'lead',
        entityId: lead._id,
        leadId: lead._id,
        type: 'status_changed',
        description: body.dealAmount
          ? `Qualified — expected revenue ₹${Number(body.dealAmount).toLocaleString('en-IN')}`
          : 'Qualified — follow-up scheduled',
        performedBy: userId,
        dedupeKey,
        metadata: { stage, dealAmount: body.dealAmount, automation: 'stage_qualified', status: 'success' },
      });
      await persistLeadMeta(lead._id, lead);
    }
  }

  if (stage === 'first_contact') {
    const dedupeKey = `stage_first_contact_${lead._id}`;
    if (!hasAutomationFlag(lead, 'stage_first_contact')) {
      const now = new Date();
      const received = new Date(lead.receivedAt || lead.createdAt);
      const responseMinutes = Math.round((now - received) / 60000);
      setMeta(lead, 'firstContactAt', now);
      setMeta(lead, 'firstResponseMinutes', responseMinutes);
      setAutomationFlag(lead, 'stage_first_contact');
      await Lead.updateOne(
        { _id: lead._id },
        { $set: { lastContactedAt: now, 'metadata.firstContactAt': now, 'metadata.firstResponseMinutes': responseMinutes } }
      );
      actions.push('first_contact_logged');
      await logTimelineEvent({
        businessId: business._id,
        entityType: 'lead',
        entityId: lead._id,
        leadId: lead._id,
        type: 'contacted_call',
        description: `First contact completed — response time ${responseMinutes} min`,
        performedBy: userId,
        dedupeKey,
        metadata: { firstResponseMinutes: responseMinutes, automation: 'stage_first_contact', status: 'success' },
      });
      await persistLeadMeta(lead._id, lead);
    }
  }

  if (stage === 'demo_scheduled') {
    const dedupeKey = `stage_demo_scheduled_${lead._id}_${body.meetingDate || ''}`;
    if (!body.meetingDate && !getMeta(lead, 'scheduledMeeting')) {
      actions.push('demo_scheduled_pending_popup');
    } else if (!hasAutomationFlag(lead, `demo_scheduled_${body.meetingDate || getMeta(lead, 'scheduledMeeting')?.date}`)) {
      const meeting = {
        date: body.meetingDate,
        time: body.meetingTime,
        duration: body.meetingDuration || '30 min',
        platform: body.meetingPlatform || 'google_meet',
        link: buildMeetingLink(body.meetingPlatform, body.meetingLink),
      };
      setMeta(lead, 'scheduledMeeting', meeting);
      const meetingAt = body.meetingDate && body.meetingTime
        ? new Date(`${body.meetingDate}T${body.meetingTime}`)
        : null;

      await createTask({
        businessId: business._id,
        leadId: lead._id,
        title: `Demo prep: ${lead.name}`,
        type: 'meeting',
        description: `Demo on ${meeting.date} at ${meeting.time} (${meeting.platform})`,
        dueHours: 24,
        assignedTo: lead.assignedTo || userId,
        userId,
        priority: 'high',
      });

      const assignee = lead.assignedTo ? await User.findById(lead.assignedTo).lean() : null;
      const ctx = buildTemplateContext(lead, business, {
        meeting,
        salesperson: assignee ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() : 'our team',
      });
      const waTpl = settings.templates.meetingWhatsApp || DEFAULT_CRM_TEMPLATES.meeting_whatsapp;
      const emailTpl = settings.templates.meetingEmail || DEFAULT_CRM_TEMPLATES.meeting_email;

      if (lead.phone && settings.sendMeetingWhatsApp) {
        const waResult = await sendAutoWhatsApp(lead, business, renderCrmTemplate(waTpl, ctx)).catch((e) => ({ success: false, error: e.message }));
        await logTimelineEvent({
          businessId: business._id,
          entityType: 'lead',
          entityId: lead._id,
          leadId: lead._id,
          type: waResult?.success ? 'whatsapp_sent' : 'whatsapp_failed',
          description: waResult?.success ? 'Meeting WhatsApp sent.' : `Meeting WhatsApp failed: ${waResult?.error || 'unknown'}`,
          performedBy: userId,
          dedupeKey: `${dedupeKey}_wa`,
          metadata: { automation: 'demo_meeting_whatsapp', status: waResult?.success ? 'success' : 'failed' },
        });
      }
      if (lead.email && settings.sendMeetingEmail) {
        const emailResult = await sendCustomerEmail(lead, business, renderCrmTemplate(emailTpl, ctx), 'Meeting invitation').catch((e) => ({ success: false, error: e.message }));
        await logTimelineEvent({
          businessId: business._id,
          entityType: 'lead',
          entityId: lead._id,
          leadId: lead._id,
          type: emailResult?.success ? 'email_sent' : 'email_failed',
          description: emailResult?.success ? 'Meeting email sent.' : `Meeting email failed: ${emailResult?.error || 'unknown'}`,
          performedBy: userId,
          dedupeKey: `${dedupeKey}_email`,
          metadata: { automation: 'demo_meeting_email', status: emailResult?.success ? 'success' : 'failed' },
        });
      }

      if (meetingAt && !Number.isNaN(meetingAt.getTime())) {
        await scheduleMeetingReminders({
          businessId: business._id,
          leadId: lead._id,
          meetingAt,
          assignedTo: lead.assignedTo || userId,
          userId,
          settings,
        });
      }

      setAutomationFlag(lead, `demo_scheduled_${meeting.date}`);
      actions.push('demo_scheduled_automation');
      await logTimelineEvent({
        businessId: business._id,
        entityType: 'lead',
        entityId: lead._id,
        leadId: lead._id,
        type: 'meeting_booked',
        description: 'Demo scheduled — meeting saved, invitations sent, reminders queued',
        performedBy: userId,
        dedupeKey,
        metadata: { automation: 'stage_demo_scheduled', meeting, status: 'success' },
      });
      await persistLeadMeta(lead._id, lead);
    }
  }

  if (stage === 'demo_completed') {
    setMeta(lead, 'demoCompletedAt', new Date());
    setMeta(lead, 'demoOutcomePending', true);
    await createTask({
      businessId: business._id,
      leadId: lead._id,
      title: `Capture demo outcome: ${lead.name}`,
      description: 'Record outcome, budget, decision maker, expected close date',
      assignedTo: lead.assignedTo || userId,
      userId,
      priority: 'high',
    });
    actions.push('demo_completed_automation');
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'meeting_completed',
      description: 'Demo completed — capture outcome and next steps',
      performedBy: userId,
      metadata: { automation: 'stage_demo_completed', prompts: ['outcome', 'budget', 'decision_maker', 'close_date'] },
    });
  }

  if (stage === 'quotation_sent') {
    const dedupeKey = `stage_quotation_${lead._id}`;
    if (!body.quotationUrl && !getMeta(lead, 'quotationUrl')) {
      actions.push('quotation_pending_popup');
    } else if (!hasAutomationFlag(lead, 'quotation_sent')) {
      setMeta(lead, 'quotationSentAt', new Date());
      if (body.quotationUrl) setMeta(lead, 'quotationUrl', body.quotationUrl);
      if (body.quotationMessage) setMeta(lead, 'quotationMessage', body.quotationMessage);

      await createTask({
        businessId: business._id,
        leadId: lead._id,
        title: `Quotation follow-up: ${lead.name}`,
        description: 'Follow up on quotation sent',
        dueHours: 48,
        assignedTo: lead.assignedTo || userId,
        userId,
      });

      const assignee = lead.assignedTo ? await User.findById(lead.assignedTo).lean() : null;
      const ctx = buildTemplateContext(lead, business, {
        quotationMessage: body.quotationMessage || '',
        salesperson: assignee ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() : 'our team',
      });
      const waTpl = settings.templates.quotationWhatsApp || DEFAULT_CRM_TEMPLATES.quotation_whatsapp;
      const emailTpl = settings.templates.quotationEmail || DEFAULT_CRM_TEMPLATES.quotation_email;

      if (lead.phone && settings.sendQuotationWhatsApp) {
        const waResult = await sendAutoWhatsApp(lead, business, renderCrmTemplate(waTpl, ctx)).catch((e) => ({ success: false, error: e.message }));
        await logTimelineEvent({
          businessId: business._id,
          entityType: 'lead',
          entityId: lead._id,
          leadId: lead._id,
          type: waResult?.success ? 'whatsapp_sent' : 'whatsapp_failed',
          description: waResult?.success ? 'Quotation WhatsApp sent.' : `Quotation WhatsApp failed: ${waResult?.error || 'unknown'}`,
          performedBy: userId,
          dedupeKey: `${dedupeKey}_wa`,
          metadata: { automation: 'quotation_whatsapp', status: waResult?.success ? 'success' : 'failed' },
        });
      }
      if (lead.email && settings.sendQuotationEmail) {
        const emailResult = await sendCustomerEmail(lead, business, renderCrmTemplate(emailTpl, ctx), 'Your quotation').catch((e) => ({ success: false, error: e.message }));
        await logTimelineEvent({
          businessId: business._id,
          entityType: 'lead',
          entityId: lead._id,
          leadId: lead._id,
          type: emailResult?.success ? 'email_sent' : 'email_failed',
          description: emailResult?.success ? 'Quotation sent successfully.' : `Quotation email failed: ${emailResult?.error || 'unknown'}`,
          performedBy: userId,
          dedupeKey: `${dedupeKey}_email`,
          metadata: { automation: 'quotation_email', status: emailResult?.success ? 'success' : 'failed', quotationUrl: body.quotationUrl },
        });
      }

      setAutomationFlag(lead, 'quotation_sent');
      actions.push('quotation_sent_automation');
      await persistLeadMeta(lead._id, lead);
    }
  }

  if (stage === 'follow_up') {
    await createTask({
      businessId: business._id,
      leadId: lead._id,
      title: `Follow-up: ${lead.name}`,
      type: 'whatsapp',
      assignedTo: lead.assignedTo || userId,
      userId,
    });
    actions.push('follow_up_automation');
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'follow_up_scheduled',
      description: 'Follow-up stage — reminder and outreach queued',
      performedBy: userId,
      metadata: { automation: 'stage_follow_up' },
    });
  }

  if (stage === 'negotiation') {
    setMeta(lead, 'negotiationStartedAt', new Date());
    if (body.discount !== undefined) setMeta(lead, 'discount', body.discount);
    if (body.competitor) setMeta(lead, 'competitor', body.competitor);
    if (body.objections) setMeta(lead, 'objections', body.objections);
    if (body.revisedAmount !== undefined) setMeta(lead, 'revisedAmount', body.revisedAmount);
    actions.push('negotiation_automation');
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'deal_updated',
      description: 'Negotiation — notes captured, probability updated',
      performedBy: userId,
      metadata: { automation: 'stage_negotiation', probability: STAGE_PROBABILITY.negotiation },
    });
  }

  if (stage === 'decision_pending') {
    await createTask({
      businessId: business._id,
      leadId: lead._id,
      title: `Decision check-in: ${lead.name}`,
      dueHours: 72,
      assignedTo: lead.assignedTo || userId,
      userId,
    });
    actions.push('decision_pending_automation');
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'follow_up_scheduled',
      description: 'Decision pending — escalation reminder scheduled',
      performedBy: userId,
      metadata: { automation: 'stage_decision_pending' },
    });
  }

  if (stage === 'payment_pending') {
    setMeta(lead, 'paymentPendingAt', new Date());
    await createTask({
      businessId: business._id,
      leadId: lead._id,
      title: `Payment follow-up: ${lead.name}`,
      description: 'Send invoice / payment link and track payment',
      dueHours: 24,
      assignedTo: lead.assignedTo || userId,
      userId,
      priority: 'high',
    });
    const payWaTpl = settings.templates.paymentReminderWhatsApp || DEFAULT_CRM_TEMPLATES.payment_reminder_whatsapp;
    const payEmailTpl = settings.templates.paymentReminderEmail || DEFAULT_CRM_TEMPLATES.payment_reminder_email;
    const payCtx = buildTemplateContext(lead, business);
    if (lead.phone && settings.sendPaymentReminderWhatsApp) {
      await sendAutoWhatsApp(lead, business, renderCrmTemplate(payWaTpl, payCtx)).catch(() => {});
    }
    if (lead.email && settings.sendPaymentReminderEmail) {
      await sendCustomerEmail(lead, business, renderCrmTemplate(payEmailTpl, payCtx), 'Payment reminder').catch(() => {});
    }
    actions.push('payment_pending_automation');
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'deal_updated',
      description: 'Payment pending — invoice sent, reminders scheduled',
      performedBy: userId,
      metadata: { automation: 'stage_payment_pending' },
    });
  }

  if (isWonStage(stage) || stage === 'won' || stage === 'converted') {
    await Lead.updateOne({ _id: lead._id }, { $set: { convertedAt: new Date() } });
    // Controlled by the Won thank-you toggles (settings -> CRM -> Message automation); it used to be unconditional.
    const thanks = planWonThanks({ settings, lead, context: buildTemplateContext(lead, business) });
    if (thanks.email) await sendCustomerEmail(lead, business, thanks.email.body, thanks.email.subject).catch(() => {});
    if (thanks.whatsapp) await sendAutoWhatsApp(lead, business, thanks.whatsapp).catch(() => {});
    await createTask({
      businessId: business._id,
      leadId: lead._id,
      title: `Onboarding: ${lead.name}`,
      description: 'Start customer onboarding checklist',
      assignedTo: lead.assignedTo || userId,
      userId,
    });
    try {
      await dispatchAutomationEvent(lead, 'lead_converted');
    } catch { /* non-blocking */ }
    actions.push('won_automation');
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'converted',
      description: 'Won — thank-you sent, onboarding started',
      performedBy: userId,
      metadata: { automation: 'stage_won' },
    });
  }

  if (actions.length === 0 && stage !== 'new_lead') {
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'status_changed',
      description: `Stage changed to ${stageLabel(stage)}`,
      performedBy: userId,
      metadata: { oldStage, newStage: stage, automation: `stage_${stage}` },
    });
  }

  try {
    await dispatchAutomationEvent(lead, 'stage_changed', { oldStage, newStage: stage });
  } catch { /* non-blocking */ }

  return { actions, stage };
}

/**
 * Payment gateway confirmed — optionally auto-move to Won per CRM settings.
 */
export async function handlePaymentConfirmed({ deal, business, userId, amount }) {
  const settings = getCrmSettings(business);
  const lead = deal.leadId ? await Lead.findById(deal.leadId) : null;
  const paidAmount = amount ?? deal.amount ?? deal.value;

  if (settings.paymentOnConfirm === PAYMENT_ON_CONFIRM_MODES.AUTO_MOVE_WON) {
    const Deal = (await import('@/models/automation/Deal')).default;
    await Deal.updateOne(
      { _id: deal._id },
      { $set: { stage: 'won', wonAt: new Date() } }
    );
    if (lead) {
      await Lead.updateOne({ _id: lead._id }, { $set: { status: 'won', convertedAt: new Date() } });
      await runLeadStagePipelineActions({
        lead: { ...lead.toObject?.() || lead, status: 'won' },
        business,
        oldStage: lead.status,
        newStage: 'won',
        userId,
      });
    }
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'deal',
      entityId: deal._id,
      leadId: deal.leadId,
      type: 'deal_won',
      description: `Payment confirmed — automatically moved to Won (${paidAmount})`,
      performedBy: userId,
      metadata: { amount: paidAmount, autoMoved: true },
    });
    return { autoMoved: true, notifyOnly: false };
  }

  const notifyId = deal.assignedTo || business.ownerId;
  await notifyUser({
    businessId: business._id,
    userId: notifyId,
    type: 'automation_alert',
    title: 'Payment received',
    message: `Payment of ${amount || deal.amount} confirmed for ${deal.title}. Confirm Won manually.`,
    link: deal.leadId ? `/automation/leads/${deal.leadId}` : `/automation/deals/${deal._id}`,
    metadata: { dealId: deal._id, amount },
  });

  if (lead) {
    await logTimelineEvent({
      businessId: business._id,
      entityType: 'lead',
      entityId: lead._id,
      leadId: lead._id,
      type: 'deal_updated',
      description: `Payment confirmed — awaiting salesperson to mark Won`,
      performedBy: userId,
      metadata: { dealId: deal._id, amount, paymentConfirmed: true },
    });
  }

  return { autoMoved: false, notifyOnly: true };
}

export { LOST_REASONS };
export default {
  runNewLeadPipelineActions,
  runLeadStagePipelineActions,
  handlePaymentConfirmed,
};
