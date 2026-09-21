import { NextResponse } from 'next/server';
import { escapeRegex } from '@/lib/crm/queryBuilder';
import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/automation/Message';
import Conversation from '@/models/omnichannel/Conversation';
import Lead from '@/models/automation/Lead';
import Contact from '@/models/automation/Contact';
import Company from '@/models/automation/Company';
import Deal from '@/models/automation/Deal';
import { withPermissions } from '@/lib/rbac';
import { leadSearchClauses, phoneSearchRegexes, pickConversationForLead } from '@/lib/omnichannel/searchQuery';

async function handler(req) {
  try {
    const { user } = req;
    const { searchParams } = new URL(req.url);
    const rawQ = (searchParams.get('q')?.trim() || '').slice(0, 200);
    const q = escapeRegex(rawQ) || null;
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(30, parseInt(searchParams.get('limit') || '20', 10));

    if (!q || q.length < 2) {
      return NextResponse.json({ success: false, error: 'Query too short' }, { status: 400 });
    }

    await dbConnect();
    const businessId = user.businessId;
    const regex = { $regex: q, $options: 'i' };
    const results = { messages: [], conversations: [], leads: [], contacts: [], companies: [], deals: [] };

    if (type === 'all' || type === 'messages') {
      results.messages = await Message.find({
        businessId,
        $or: [
          { 'content.body': regex },
          { subject: regex },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('leadId conversationId channel content timestamp direction')
        .lean();
    }

    if (type === 'all' || type === 'conversations') {
      results.conversations = await Conversation.find({
        businessId,
        $or: [
          { participantName: regex },
          { participantEmail: regex },
          { participantPhone: regex },
          ...phoneSearchRegexes(rawQ).map((re) => ({ participantPhone: { $regex: re } })),
          { lastMessagePreview: regex },
        ],
      })
        .sort({ lastMessageAt: -1 })
        .limit(limit)
        .lean();
    }

    if (type === 'all' || type === 'leads') {
      // Every lead, whether or not it has ever messaged: the Inbox can start a chat with any lead that has a phone.
      results.leads = await Lead.find({ businessId, $or: leadSearchClauses(rawQ, q) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name phone email status source whatsapp whatsappId')
        .lean();

      // Attach the conversation to open (WhatsApp first), so the client can tell "has a chat" from "start a new chat"
      // without depending on which conversations happen to be loaded in the list.
      if (results.leads.length) {
        const convs = await Conversation.find({ businessId, leadId: { $in: results.leads.map((l) => l._id) } })
          .sort({ lastMessageAt: -1 })
          .lean();
        const byLead = new Map();
        for (const c of convs) {
          const k = String(c.leadId);
          if (!byLead.has(k)) byLead.set(k, []);
          byLead.get(k).push(c);
        }
        results.leads = results.leads.map((l) => ({ ...l, conversation: pickConversationForLead(byLead.get(String(l._id)) || []) }));
      }
    }

    if (type === 'all' || type === 'contacts') {
      results.contacts = await Contact.find({
        businessId,
        $or: [{ firstName: regex }, { lastName: regex }, { emails: regex }, { phones: regex }],
      })
        .limit(limit)
        .select('firstName lastName emails phones')
        .lean();
    }

    if (type === 'all' || type === 'companies') {
      results.companies = await Company.find({ businessId, name: regex }).limit(limit).select('name domain').lean();
    }

    if (type === 'all' || type === 'deals') {
      results.deals = await Deal.find({ businessId, title: regex }).limit(limit).select('title amount stage').lean();
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[Inbox API] search:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], handler);
