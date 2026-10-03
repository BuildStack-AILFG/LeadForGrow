import { dbConnect } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { Types } from 'mongoose';
import Lead from '@/models/automation/Lead';
import Activity from '@/models/automation/Activity';
import Task from '@/models/automation/Task';
import Message from '@/models/automation/Message';
import User from '@/models/User';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { LEAD_STATUS_ROW_COLORS } from '@/app/automation/components/leads/constants';
import { normalizeLeadStatus, validateStageTransition } from '@/lib/crm/leadStages';
import { enrichLeadsWithNextFollowUp } from '@/lib/crm/followUpSync';
import { leadActivityFields } from '@/lib/crm/activityHelpers';
import { runLeadStagePipelineActions } from '@/lib/crm/pipelineAutomation';
import { formatTimelineItems } from '@/lib/crm/timelinePresentation';
import { buildContactUpdates, phoneClashFilter } from '@/lib/crm/leadContactUpdate';

// GET - Fetch single lead with details
export const GET = withPlanAccess('leads', async (req, { params }) => {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid lead id' }, { status: 400 });
    }
    const user = req.user;
    const businessId = user.businessId;

    const lead = await Lead.findOneAndUpdate(
      { _id: id, businessId },
      { isRead: true },
      { new: true }
    )
      .populate('assignedTo', 'email firstName lastName')
      .populate('notes.addedBy', 'firstName lastName email')
      .lean();

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const activities = await Activity.find({ leadId: id })
      .populate('performedBy', 'email')
      .sort({ performedAt: -1 })
      .lean();

    const timeline = formatTimelineItems(activities);

    let dealAmount;
    let dealCurrency = 'INR';
    const meta = lead.metadata;
    const metaAmount = meta?.amount ?? meta?.dealAmount ?? (typeof meta?.get === 'function' ? meta.get('amount') || meta.get('dealAmount') : null);
    if (metaAmount) {
      dealAmount = Number(metaAmount);
      dealCurrency = meta?.currency || (typeof meta?.get === 'function' ? meta.get('currency') : null) || 'INR';
    } else {
      const Deal = (await import('@/models/automation/Deal')).default;
      const deal = await Deal.findOne({ businessId, leadId: id, deletedAt: null })
        .sort({ updatedAt: -1 })
        .select('amount currency')
        .lean();
      if (deal?.amount) {
        dealAmount = deal.amount;
        dealCurrency = deal.currency || 'INR';
      }
    }

    const messageQuery = { leadId: id, businessId };
    
    // Role-based history filtering
    const isRestrictedRole = ['member', 'TEAM_MEMBER'].includes(user.role);
    if (isRestrictedRole && lead.historyVisibleFrom) {
      messageQuery.timestamp = { $gte: lead.historyVisibleFrom };
    }

    const messages = await Message.find(messageQuery)
      .sort({ timestamp: 1 })
      .lean();

    const [enrichedLead] = await enrichLeadsWithNextFollowUp([lead], businessId);

    return NextResponse.json({
      success: true,
      data: {
        ...enrichedLead,
        activities: timeline,
        messages,
        ...(dealAmount ? { dealAmount, dealCurrency } : {}),
      },
    });
  } catch (error) {
    console.error('Fetch lead error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
});

// PUT - Update lead
export const PUT = withPlanAccess('leads', async (req, { params }) => {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid lead id' }, { status: 400 });
    }
    const user = req.user;
    const businessId = user.businessId;
    const body = await req.json();
    const {
      performedBy, status, assignedTo, priority, nextFollowUpAt, note, lostReason,
      dealAmount, location, expectedTimeline, requirements, decisionMaker, unqualifiedReason,
    } = body;

    const lead = await Lead.findOne({ _id: id, businessId });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const updates = {};
    const activities = [];

    if (status && status !== lead.status) {
      const newStatus = normalizeLeadStatus(status);
      const transition = validateStageTransition(lead.status, newStatus);
      if (!transition.ok) {
        return NextResponse.json({ success: false, error: transition.message, code: 'INVALID_STAGE_TRANSITION' }, { status: 400 });
      }
      if (newStatus === 'lost' && !lostReason && !lead.metadata?.lostReason) {
        return NextResponse.json({
          success: false,
          error: 'Lost reason is required',
          code: 'LOST_REASON_REQUIRED',
        }, { status: 400 });
      }
    }

    // Status change — user-controlled; automations run around the stage, never change it
    if (status && status !== lead.status) {
      const oldStatus = lead.status;
      const newStatus = normalizeLeadStatus(status);
      updates.status = newStatus;
      updates.rowColor = LEAD_STATUS_ROW_COLORS[newStatus] || null;

      if (newStatus === 'converted') {
        updates.convertedAt = new Date();
      } else if (newStatus === 'lost') {
        updates.lostAt = new Date();
      } else if (newStatus === 'unqualified') {
        updates.lostAt = new Date();
      }

      // lastContactedAt only updated by stage automation for first_contact+, not auto on every change
      activities.push(leadActivityFields({ businessId }, id, {
        type: 'status_changed',
        description: `Stage changed from ${oldStatus} to ${newStatus}`,
        performedBy: performedBy || user.userId,
        metadata: { oldValue: oldStatus, newValue: newStatus, userInitiated: true },
      }));
    }

    if (assignedTo !== undefined && assignedTo !== lead.assignedTo?.toString()) {
      updates.assignedTo = assignedTo;
      
      // Handle History Visibility for new assignee
      if (assignedTo) {
        // If showHistory is false, hide previous history from the new assignee
        if (body.showHistory === false) {
          updates.historyVisibleFrom = new Date();
        } else {
          // If explicitly requested or owner, show everything
          updates.historyVisibleFrom = null;
        }
      }

      activities.push(leadActivityFields({ businessId }, id, {
        type: 'assigned',
        description: assignedTo ? 'Lead assigned to team member' : 'Lead unassigned',
        performedBy: performedBy || user.userId,
      }));
    }

    if (priority) updates.priority = priority;

    // Contact details (e.g. adding a phone number to an Instagram/Messenger lead) — rules in lib/crm/leadContactUpdate.js
    if (body.phone !== undefined || body.email !== undefined) {
      const contact = await buildContactUpdates({
        body,
        lead,
        findClash: (digits) => Lead.findOne(phoneClashFilter({ businessId, leadId: lead._id, digits })).select('name').lean(),
      });
      if (contact.error) {
        return NextResponse.json({ success: false, error: contact.error }, { status: contact.status });
      }
      Object.assign(updates, contact.updates);
    }

    if (nextFollowUpAt) {
      updates.nextFollowUpAt = new Date(nextFollowUpAt);
      activities.push(leadActivityFields({ businessId }, id, {
        type: 'follow_up_scheduled',
        description: `Follow-up scheduled for ${new Date(nextFollowUpAt).toLocaleString()}`,
        performedBy: performedBy || user.userId,
      }));
    }

    if (note) {
      updates.$push = {
        notes: { text: note, addedBy: performedBy || user.userId, addedAt: new Date() }
      };
      activities.push(leadActivityFields({ businessId }, id, {
        type: 'note_added',
        description: 'Note added to lead',
        performedBy: performedBy || user.userId,
      }));
    }

    if (body.rowColor !== undefined) {
      updates.rowColor = body.rowColor || null;
    }

    if (dealAmount != null || expectedTimeline || requirements || decisionMaker) {
      const metaObj = lead.metadata
        ? (lead.metadata instanceof Map ? Object.fromEntries(lead.metadata) : { ...lead.metadata })
        : {};
      if (dealAmount != null) {
        const amount = Number(dealAmount);
        if (!Number.isNaN(amount) && amount > 0) {
          metaObj.estimatedBudget = amount;
          metaObj.amount = amount;
          metaObj.dealAmount = amount;
          metaObj.currency = body.currency || metaObj.currency || 'INR';
        }
      }
      if (expectedTimeline) metaObj.expectedTimeline = String(expectedTimeline).trim();
      if (requirements) metaObj.requirements = String(requirements).trim();
      if (decisionMaker) metaObj.decisionMaker = String(decisionMaker).trim();
      if (unqualifiedReason) metaObj.unqualifiedReason = String(unqualifiedReason).trim();
      updates.metadata = metaObj;
    }

    if (location !== undefined) {
      const { normalizeLeadLocation } = await import('@/lib/leadProcessor');
      const nextLocation = normalizeLeadLocation({ location });
      updates.location = nextLocation || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      };
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, updates, { new: true })
      .populate('assignedTo', 'email firstName lastName')
      .populate('notes.addedBy', 'firstName lastName email');
    if (activities.length > 0) await Activity.insertMany(activities);

    // Stage automations (async, non-blocking for response)
    if (status && status !== lead.status) {
      const business = await Business.findById(businessId);
      if (business) {
        runLeadStagePipelineActions({
          lead: updatedLead,
          business,
          oldStage: lead.status,
          newStage: normalizeLeadStatus(status),
          userId: performedBy || user.userId,
          body: { lostReason, ...body },
        }).catch((err) => {
          if (err.code === 'LOST_REASON_REQUIRED') {
            console.warn('[Lead] Lost reason required:', id);
          } else {
            console.error('[Lead] Stage automation error:', err.message);
          }
        });
      }
    }

    // Human Assignment Notification
    if (updates.assignedTo && updates.assignedTo !== lead.assignedTo?.toString()) {
      const { sendAssignmentNotification } = await import('@/lib/integrations/email');
      const Business = (await import('@/models/Business')).default;
      const biz = await Business.findById(businessId);
      const assignee = await User.findById(updates.assignedTo);

      if (biz && assignee) {
        sendAssignmentNotification(updatedLead, biz, assignee).catch(err => {
          console.error('[Assignment] Notification failed:', err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedLead.toObject(),
        ...(dealAmount != null && Number(dealAmount) > 0
          ? { dealAmount: Number(dealAmount), dealCurrency: body.currency || 'INR' }
          : {}),
      },
    });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
});

// DELETE - Hard delete lead and related data
export const DELETE = withPlanAccess('leads', async (req, { params }) => {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid lead id' }, { status: 400 });
    }
    const user = req.user;
    const businessId = user.businessId;

    // 1. Verify existence and ownership
    const lead = await Lead.findOne({ _id: id, businessId });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // 2. Cascading Deletion
    const deleteResults = await Promise.all([
      Lead.deleteOne({ _id: id, businessId }),
      Activity.deleteMany({ leadId: id, businessId }),
      Task.deleteMany({ leadId: id, businessId }),
      Message.deleteMany({ leadId: id, businessId })
    ]);

    console.log(`[LeadsAPI] Lead ${id} and related data deleted. Result:`, deleteResults);

    return NextResponse.json({
      success: true,
      message: 'Lead and all associated data permanently deleted from database'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete lead' }, { status: 500 });
  }
});
