import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from "@/lib/mongodb";
import Lead from '@/models/automation/Lead';
import Activity from '@/models/automation/Activity';
import Business from '@/models/Business';
import Form from '@/models/Form';
import { processNewLead } from '@/lib/leadProcessor';
import { enrichLeadsWithNextFollowUp } from '@/lib/crm/followUpSync';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { escapeRegex } from '@/lib/crm/queryBuilder';

export const dynamic = 'force-dynamic';

// GET - Fetch all leads with filters
export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { user, business } = tenant;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const eventId = searchParams.get('eventId');
    const campaignName = searchParams.get('campaignName');
    const adId = searchParams.get('adId');
    const view = searchParams.get('view');
    const priority = searchParams.get('priority');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const forKanban = searchParams.get('kanban') === '1';
    const limit = forKanban
      ? Math.min(Math.max(1, parseInt(searchParams.get('limit') || '500', 10)), 500)
      : Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50', 10)), 100);
    const skip = (page - 1) * limit;

    const query = { businessId: business._id };

    const showConverted = searchParams.get('showConverted') === '1';
    if (showConverted) {
      query.$or = [{ archived: false }, { status: 'converted' }];
    } else {
      query.archived = false;
    }

    // Role-based filtering: members and team_members only see leads assigned to them
    const isRestrictedRole = ['member', 'TEAM_MEMBER', 'VIEW_ONLY'].includes(user.role);

    if (isRestrictedRole) {
      query.assignedTo = user._id;
    } else if (assignedTo === 'unassigned') {
      query.assignedTo = null;
    } else if (assignedTo === 'me') {
      query.assignedTo = user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    } else if (searchParams.get('showConverted') !== '1') {
      // Converted leads belong on the Deals page — hidden unless explicitly requested
      query.status = { $ne: 'converted' };
    }
    if (source) query.source = source;
    if (eventId) query.eventId = eventId;
    if (campaignName) query.campaignName = campaignName;
    if (adId) query.adId = adId;
    if (priority) query.priority = priority;

    if (dateFrom || dateTo) {
      query.receivedAt = {};
      if (dateFrom) query.receivedAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.receivedAt.$lte = end;
      }
    }

    if (view === 'today-followups') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.nextFollowUpAt = { $gte: today, $lt: tomorrow };
    } else if (view === 'hot') {
      query.priority = { $in: ['high', 'urgent'] };
    } else if (view === 'unassigned' && !isRestrictedRole) {
      query.assignedTo = null;
    } else if (view === 'whatsapp-unread') {
      query.isRead = false;
      query.$or = [
        { source: 'whatsapp' },
        { whatsappId: { $exists: true, $ne: null } }
      ];
    } else if (view === 'my-leads' && !isRestrictedRole) {
      query.assignedTo = user._id;
    }

    if (search) {
      const safeSearch = escapeRegex(search.slice(0, 200));
      const searchOr = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } },
        { serviceInterest: { $regex: safeSearch, $options: 'i' } }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }


    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedTo', 'email firstName lastName')
        .populate('eventId', 'name')
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query)
    ]);

    let enrichedLeads = leads;
    if (leads.length > 0) {
      const Deal = (await import('@/models/automation/Deal')).default;
      const Conversation = (await import('@/models/omnichannel/Conversation')).default;
      const leadIds = leads.map((l) => l._id);
      // Deal amounts, next follow-ups and last messages are independent — one
      // parallel batch instead of three round trips in a row.
      const [dealAmounts, withFollowUps, convs] = await Promise.all([
        Deal.aggregate([
          { $match: { businessId: business._id, leadId: { $in: leadIds }, deletedAt: null } },
          { $sort: { updatedAt: -1 } },
          {
            $group: {
              _id: '$leadId',
              amount: { $first: '$amount' },
              currency: { $first: '$currency' },
              stage: { $first: '$stage' },
            },
          },
        ]),
        enrichLeadsWithNextFollowUp(leads, business._id),
        // Each lead's most recent conversation message, for the Message column.
        Conversation.find({ businessId: business._id, leadId: { $in: leadIds } })
          .select('leadId lastMessagePreview lastMessageAt lastMessageDirection')
          .sort({ lastMessageAt: -1 })
          .lean(),
      ]);
      const dealByLead = Object.fromEntries(
        dealAmounts.map((d) => [
          d._id.toString(),
          { amount: d.amount, currency: d.currency, stage: d.stage },
        ])
      );
      enrichedLeads = withFollowUps.map((l) => {
        const deal = dealByLead[l._id.toString()];
        if (deal?.amount || deal?.stage) {
          return {
            ...l,
            ...(deal.amount ? { dealAmount: deal.amount, dealCurrency: deal.currency } : {}),
            ...(deal.stage ? { dealStage: deal.stage } : {}),
          };
        }
        const meta = l.metadata;
        const metaAmount = meta?.amount ?? meta?.dealAmount ?? (typeof meta?.get === 'function' ? meta.get('amount') || meta.get('dealAmount') : null);
        if (metaAmount) {
          return {
            ...l,
            dealAmount: Number(metaAmount),
            dealCurrency: meta?.currency || (typeof meta?.get === 'function' ? meta.get('currency') : null) || 'INR',
          };
        }
        return l;
      });
      const msgByLead = {};
      for (const c of convs) {
        const k = String(c.leadId);
        if (!msgByLead[k] && c.lastMessagePreview) msgByLead[k] = c;
      }
      enrichedLeads = enrichedLeads.map((l) => {
        const c = msgByLead[String(l._id)];
        return c
          ? { ...l, lastMessagePreview: c.lastMessagePreview, lastMessageDirection: c.lastMessageDirection, lastMessageAt: c.lastMessageAt }
          : l;
      });
    }

    return NextResponse.json({
      success: true,
      data: enrichedLeads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
  }
});

// POST - Create new lead (manual entry or API)
export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { user, business } = tenant;
    const body = await request.json();

    // Validate required fields (Allow name + phone OR name + email)
    if (!body.name || (!body.phone && !body.email)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name and (phone or email)'
      }, { status: 400 });
    }

    // Check if business has reached lead limit
    if (business.hasReachedLeadLimit()) {
      return NextResponse.json({
        success: false,
        error: `Monthly lead limit reached (${business.quotas.maxLeadsPerMonth}). Please upgrade your plan.`,
        requiresUpgrade: true
      }, { status: 403 });
    }

    // Prepare lead data
    const leadData = {
      name: body.name,
      email: body.email || '',
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone,
      serviceInterest: body.serviceInterest || '',
      message: body.message || '',
      source: body.source || 'manual',
      sourceDetails: body.sourceDetails || 'Manual entry',
      sourcePage: body.sourcePage || '',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      priority: body.priority || 'medium',
      tags: Array.isArray(body.tags) ? body.tags : [],
      ...(body.location ? { location: body.location } : {}),
      ...(body.city || body.country || body.state || body.street || body.postalCode
        ? {
            city: body.city,
            state: body.state,
            country: body.country,
            street: body.street,
            postalCode: body.postalCode,
          }
        : {}),
    };

    // Process lead through centralized processor
    console.log(`[API Leads] Creating lead for business ${business._id}:`, leadData.name);
    
    // For manual entries, assign directly to the user who added it (team member/owner)
    const assignedToId = leadData.source === 'manual' ? user._id : null;
    const processResult = await processNewLead(leadData, business._id, null, assignedToId);

    if (!processResult.success) {
      console.error(`[API Leads] Processor failed for ${leadData.name}:`, processResult.message);
      if (processResult.isDuplicate) {
        return NextResponse.json({
          success: true,
          data: processResult.lead,
          message: 'Lead already exists'
        }, { status: 200 });
      }

      return NextResponse.json({
        success: false,
        error: processResult.message || 'Failed to create lead'
      }, { status: 500 });
    }

    console.log(`[API Leads] Successfully processed lead: ${processResult.lead._id}`);

    // Pipeline automation in ingestLead handles welcome messages, tasks, and AI — no duplicate legacy trigger.

    return NextResponse.json({
      success: true,
      data: processResult.lead
    }, { status: 201 });

  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create lead'
    }, { status: 500 });
  }
});
