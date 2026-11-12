import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { serializeCommentRule, sanitizeCommentRules } from '@/lib/automation/commentRules';
import { serializeDmRule, sanitizeDmRule } from '@/lib/automation/dmRules';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * Instagram automations (Automation → Instagram automations).
 *   GET                         → account summary + comment-to-DM rules + DM auto-reply rules
 *   PUT    { type, rule }       → create / update one rule (type: 'comment' | 'dm')
 *   PATCH  { type, id, enabled } → turn one rule on / off
 *   DELETE ?type=&id=           → delete one rule
 * Rules live on business.integrationCredentials.instagram (commentAutomations / dmAutomations),
 * the same place the webhook reads them from.
 */
const bad = (error, status = 400) => NextResponse.json({ success: false, error }, { status });

async function loadBusiness(req) {
  await dbConnect();
  return Business.findById(req.user.businessId);
}

function igOf(business) {
  business.integrationCredentials = business.integrationCredentials || {};
  business.integrationCredentials.instagram = business.integrationCredentials.instagram || {};
  return business.integrationCredentials.instagram;
}

function payload(business) {
  const ig = business.integrationCredentials?.instagram || {};
  return {
    account: {
      connected: !!ig.enabled && !ig.disconnectedAt,
      username: ig.username || '',
      profilePicture: ig.profilePicture || '',
      aiReplyEnabled: !!ig.aiReplyEnabled,
    },
    businessName: business.businessName || business.name || '',
    comment: (ig.commentAutomations || []).map(serializeCommentRule),
    dm: (ig.dmAutomations || []).map(serializeDmRule),
  };
}

export const GET = withPlanAccess('automation', async (req) => {
  try {
    const business = await loadBusiness(req);
    if (!business) return bad('Not found', 404);
    return NextResponse.json({ success: true, data: payload(business) });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req) => {
  try {
    const { type, rule } = await req.json();
    if (!rule || typeof rule !== 'object') return bad('rule required');
    const business = await loadBusiness(req);
    if (!business) return bad('Not found', 404);
    const ig = igOf(business);
    let savedId;

    if (type === 'comment') {
      if (rule.matchType !== 'any' && !(rule.keywords || []).some((k) => String(k).trim())) {
        return bad('Add at least one keyword, or choose "Any comment".');
      }
      if (!String(rule.publicReply || '').trim() && !String(rule.dmMessage || '').trim() && rule.replyMode !== 'ai') {
        return bad('Add a public reply or a DM.');
      }
      if (rule.scope === 'specific' && !rule.mediaId) return bad('Choose the post or reel.');
      const existing = (ig.commentAutomations || []).map((r) => (r.toObject ? r.toObject() : r));
      const list = existing.map((r) => ({ ...r }));
      const idx = rule.id ? list.findIndex((r) => r.id === rule.id) : -1;
      const merged = { ...(idx >= 0 ? list[idx] : {}), ...rule, triggeredCount: idx >= 0 ? list[idx].triggeredCount : 0 };
      if (idx >= 0) list[idx] = merged;
      else list.push(merged);
      if (list.length > 50) return bad('You can have up to 50 comment automations.');
      ig.commentAutomations = sanitizeCommentRules(list, existing);
      savedId = idx >= 0 ? rule.id : ig.commentAutomations[ig.commentAutomations.length - 1].id;
    } else if (type === 'dm') {
      const list = (ig.dmAutomations || []).map((r) => (r.toObject ? r.toObject() : r));
      const idx = rule.id ? list.findIndex((r) => r.id === rule.id) : -1;
      const { rule: clean, error } = sanitizeDmRule(rule, idx >= 0 ? list[idx] : null);
      if (error) return bad(error);
      if (idx >= 0) list[idx] = clean;
      else {
        if (list.length >= 30) return bad('You can have up to 30 DM auto-replies.');
        list.push(clean);
      }
      ig.dmAutomations = list;
      savedId = clean.id;
    } else {
      return bad('type must be comment or dm');
    }

    business.markModified('integrationCredentials');
    await business.save();
    return NextResponse.json({ success: true, data: { ...payload(business), savedId } });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PATCH = withPlanAccess('automation', async (req) => {
  try {
    const { type, id, enabled } = await req.json();
    if (typeof enabled !== 'boolean' || !id) return bad('id and enabled required');
    const field = type === 'dm' ? 'dmAutomations' : type === 'comment' ? 'commentAutomations' : null;
    if (!field) return bad('type must be comment or dm');
    await dbConnect();
    const res = await Business.updateOne(
      { _id: req.user.businessId, [`integrationCredentials.instagram.${field}.id`]: id },
      { $set: { [`integrationCredentials.instagram.${field}.$.enabled`]: enabled } }
    );
    if (!res.matchedCount) return bad('Automation not found', 404);
    const business = await Business.findById(req.user.businessId);
    return NextResponse.json({ success: true, data: payload(business) });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const field = type === 'dm' ? 'dmAutomations' : type === 'comment' ? 'commentAutomations' : null;
    if (!field || !id) return bad('type and id required');
    await dbConnect();
    await Business.updateOne(
      { _id: req.user.businessId },
      { $pull: { [`integrationCredentials.instagram.${field}`]: { id } } }
    );
    const business = await Business.findById(req.user.businessId);
    return NextResponse.json({ success: true, data: payload(business) });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
