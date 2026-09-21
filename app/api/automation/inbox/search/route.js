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
import { buildSearchFilters, pickConversationForLead } from '@/lib/omnichannel/searchQuery';

/** One section failing (a bad query, a slow collection) must not take the whole search down: log it, return that section empty. */
async function section(name, fn) {
  try {
    return await fn();
  } catch (error) {
    console.error(`[Inbox API] search section "${name}" failed:`, error?.message || error);
    return [];
  }
}

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
    const filters = buildSearchFilters({ businessId, rawQ, escaped: q });
    const wants = (t) => type === 'all' || type === t;
    const results = { messages: [], conversations: [], leads: [], contacts: [], companies: [], deals: [] };

    const jobs = [];

    if (wants('messages')) {
      jobs.push(section('messages', async () => {
        results.messages = await Message.find(filters.messages)
          .sort({ timestamp: -1 })
          .limit(limit)
          .select('leadId conversationId channel content timestamp direction')
          .lean();
        return results.messages;
      }));
    }

    if (wants('conversations')) {
      jobs.push(section('conversations', async () => {
        results.conversations = await Conversation.find(filters.conversations)
          .sort({ lastMessageAt: -1 })
          .limit(limit)
          .lean();
        return results.conversations;
      }));
    }

    if (wants('leads')) {
      jobs.push(section('leads', async () => {
        // Every lead, whether or not it has ever messaged: the Inbox can start a chat with any lead that has a phone.
        const leads = await Lead.find(filters.leads)
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('name phone email status source whatsapp whatsappId')
          .lean();

        // Attach the conversation to open (WhatsApp first), so the client can tell "has a chat" from "start a new chat"
        // without depending on which conversations happen to be loaded in the list.
        const byLead = new Map();
        if (leads.length) {
          const convs = await Conversation.find({ businessId, leadId: { $in: leads.map((l) => l._id) } })
            .sort({ lastMessageAt: -1 })
            .lean();
          for (const c of convs) {
            const k = String(c.leadId);
            if (!byLead.has(k)) byLead.set(k, []);
            byLead.get(k).push(c);
          }
        }
        results.leads = leads.map((l) => ({ ...l, conversation: pickConversationForLead(byLead.get(String(l._id)) || []) }));
        return results.leads;
      }));
    }

    if (wants('contacts')) {
      jobs.push(section('contacts', async () => {
        results.contacts = await Contact.find(filters.contacts)
          .limit(limit)
          .select('firstName lastName emails phones')
          .lean();
        return results.contacts;
      }));
    }

    if (wants('companies')) {
      jobs.push(section('companies', async () => {
        results.companies = await Company.find(filters.companies).limit(limit).select('name domain').lean();
        return results.companies;
      }));
    }

    if (wants('deals')) {
      jobs.push(section('deals', async () => {
        results.deals = await Deal.find(filters.deals).limit(limit).select('title amount stage').lean();
        return results.deals;
      }));
    }

    await Promise.all(jobs);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[Inbox API] search:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], handler);
