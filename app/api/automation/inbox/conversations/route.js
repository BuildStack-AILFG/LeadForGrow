import { NextResponse } from 'next/server';
import { escapeRegex } from '@/lib/crm/queryBuilder';
import { dbConnect } from '@/lib/mongodb';
import Conversation from '@/models/omnichannel/Conversation';
import Lead from '@/models/automation/Lead';
import { withPermissions } from '@/lib/rbac';
import { syncLegacyWhatsAppConversations } from '@/lib/omnichannel/conversationService';
import { isServerView, viewClauses } from '@/lib/omnichannel/inboxViews';
import { loadViewInputs } from '@/lib/omnichannel/inboxViewQuery';

async function handler(req) {
  try {
    const { user } = req;
    const { searchParams } = new URL(req.url);

    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const inboxStatus = searchParams.get('inboxStatus');
    const search = escapeRegex(searchParams.get('search') || '').slice(0, 200) || null;
    const label = searchParams.get('label');
    const archived = searchParams.get('archived') === 'true';
    const spam = searchParams.get('spam') === 'true';
    const pinned = searchParams.get('pinned') === 'true';
    const favorite = searchParams.get('favorite') === 'true';
    const assignedTo = searchParams.get('assignedTo');
    // `origin` filter — the inbox "Automated" chip sends this. Value is one
    // of user|automation|sequence|broadcast|meeting|system, OR the special
    // 'automated' shortcut which matches everything except 'user'.
    const origin = searchParams.get('origin');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    // 50 per page — matches infinite-scroll sentinel in ChatSidebar.
    // Cap at 200 to guard against pathological clients requesting everything.
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '50', 10));
    const skip = (page - 1) * limit;

    await dbConnect();
    await syncLegacyWhatsAppConversations(user.businessId);

    const query = { businessId: user.businessId };

    if (channel && channel !== 'all') query.channel = channel;
    if (archived) query.isArchived = true;
    else query.isArchived = { $ne: true };
    if (spam) query.isSpam = true;
    else query.isSpam = { $ne: true };
    query.isDeleted = { $ne: true };

    // Email folders (Gmail-style) — the email tab is triaged by folder, not the
    // chat queues. Overrides the default open-inbox query above.
    //   inbox   → default (open, not sent/deleted/spam)
    //   sent    → conversations where we spoke last (outgoing)
    //   trash   → soft-deleted conversations
    //   spam    → conversations flagged spam
    //   starred → favourited conversations
    //   drafts  → handled client-side (EmailDraft, not a conversation)
    const emailFolder = channel === 'email' ? searchParams.get('emailFolder') : null;
    if (emailFolder === 'sent') {
      query.lastMessageDirection = 'outgoing';
    } else if (emailFolder === 'trash') {
      query.isDeleted = true;
    } else if (emailFolder === 'spam') {
      query.isSpam = true;
    } else if (emailFolder === 'starred') {
      query.isFavorite = true;
    }

    // Instagram / Facebook triage by type — DMs vs public post comments. Comment
    // conversations are keyed with an "ig_comment:" / "fb_comment:" participant,
    // so the type filter is a prefix match on participantId.
    const convType = ['instagram', 'facebook'].includes(channel) ? searchParams.get('convType') : null;
    if (convType === 'comment') {
      query.participantId = { $regex: '^(ig|fb)_comment:' };
    } else if (convType === 'dm') {
      query.participantId = { $not: /^(ig|fb)_comment:/ };
    }
    const andClauses = [
      { $or: [{ snoozedUntil: null }, { snoozedUntil: { $exists: false } }, { snoozedUntil: { $lte: new Date() } }] },
    ];
    if (pinned) query.isPinned = true;
    if (favorite) query.isFavorite = true;
    if (assignedTo === 'me') query.assignedTo = user.userId;
    else if (assignedTo === 'unassigned') query.assignedTo = null;
    else if (assignedTo) query.assignedTo = assignedTo;

    if (inboxStatus) query.inboxStatus = inboxStatus;
    else if (status === 'unread') query.inboxStatus = 'unread';
    else if (status === 'intervened') query.inboxStatus = 'intervened';
    else if (status === 'assigned') query.assignedTo = { $ne: null };
    else if (status === 'unassigned') query.assignedTo = null;

    if (label) query['labels.name'] = label;

    if (origin === 'automated') {
      // Anything not user-composed — the "everything the system sent" view.
      query.lastMessageOrigin = { $in: ['automation', 'sequence', 'broadcast', 'meeting'] };
    } else if (origin === 'user') {
      // Explicit "human conversations only" — treats missing origin (old
      // rows) as user by convention.
      query.$or = [
        { lastMessageOrigin: 'user' },
        { lastMessageOrigin: { $exists: false } },
      ];
    } else if (origin) {
      // Specific origin (automation | sequence | broadcast | meeting | system).
      query.lastMessageOrigin = origin;
    }

    if (search) {
      const leads = await Lead.find({
        businessId: user.businessId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      const leadIds = leads.map((l) => l._id);
      andClauses.push({
        $or: [
          { leadId: { $in: leadIds } },
          { participantName: { $regex: search, $options: 'i' } },
          { participantEmail: { $regex: search, $options: 'i' } },
          { participantPhone: { $regex: search, $options: 'i' } },
          { lastMessagePreview: { $regex: search, $options: 'i' } },
        ],
      });
    }

    // Inbox queues (?view=needs_reply|mine|unassigned|taken_over): same rules the tab counts use.
    let sortOrder = { isPinned: -1, lastMessageAt: -1 };
    const view = searchParams.get('view');
    if (isServerView(view)) {
      const inputs = await loadViewInputs({ businessId: user.businessId, userId: user.userId, view });
      const { clauses, sort } = viewClauses(view, inputs);
      andClauses.push(...clauses);
      if (sort) sortOrder = sort;
    }

    if (andClauses.length) query.$and = andClauses;

    // countDocuments on a big Conversation collection is the second-biggest
    // cost after the sync — only compute it on page 1 (infinite scroll uses
    // hasMore = returned.length === limit, not the exact total). Later pages
    // reuse the client-cached count.
    const listQuery = Conversation.find(query)
      .populate('leadId', 'name phone email status priority assignedTo whatsappId')
      .populate('assignedTo', 'firstName lastName email')
      .populate('contactId', 'firstName lastName email phones')
      .populate('companyId', 'name')
      .populate('dealId', 'title amount stage')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean();

    const [conversations, total] = await Promise.all([
      listQuery,
      page === 1 ? Conversation.countDocuments(query) : Promise.resolve(null),
    ]);

    const hasMore = conversations.length === limit;
    return NextResponse.json({
      success: true,
      data: conversations,
      pagination: {
        total,
        page,
        limit,
        pages: total != null ? Math.ceil(total / limit) : null,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[Inbox API] conversations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], handler);
