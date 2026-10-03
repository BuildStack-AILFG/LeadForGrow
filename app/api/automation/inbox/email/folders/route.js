import { pickDraftFields, workingDraftFilter } from '@/lib/omnichannel/draftFields';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import EmailDraft from '@/models/omnichannel/EmailDraft';
import Message from '@/models/automation/Message';
import { withPermissions } from '@/lib/rbac';

async function getHandler(req) {
  try {
    const { user } = req;
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'drafts';
    await dbConnect();

    if (folder === 'drafts') {
      const drafts = await EmailDraft.find({ businessId: user.businessId })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();
      return NextResponse.json({ success: true, data: drafts });
    }

    const folderQuery = { businessId: user.businessId, channel: 'email', isDeleted: { $ne: true } };
    if (folder === 'sent') {
      folderQuery.direction = 'outgoing';
      folderQuery.folder = 'sent';
    } else if (folder === 'trash') {
      folderQuery.isDeleted = true;
    } else if (folder === 'starred') {
      folderQuery.starred = true;
    } else {
      folderQuery.direction = 'incoming';
      folderQuery.folder = { $in: ['inbox', null] };
    }

    const messages = await Message.find(folderQuery)
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('leadId', 'name email')
      .lean();

    const counts = await Promise.all([
      Message.countDocuments({ businessId: user.businessId, channel: 'email', direction: 'incoming', isDeleted: { $ne: true } }),
      Message.countDocuments({ businessId: user.businessId, channel: 'email', folder: 'sent' }),
      EmailDraft.countDocuments({ businessId: user.businessId }),
      Message.countDocuments({ businessId: user.businessId, channel: 'email', isDeleted: true }),
      Message.countDocuments({ businessId: user.businessId, channel: 'email', starred: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: messages,
      counts: { inbox: counts[0], sent: counts[1], drafts: counts[2], trash: counts[3], starred: counts[4] },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

async function postHandler(req) {
  try {
    const { user } = req;
    const body = await req.json();
    await dbConnect();
    // Only known fields (the body used to be spread into the document, which let a client set businessId / createdBy).
    const fields = pickDraftFields(body);

    // Auto-save fires every ~2 s while typing: update the thread's single working draft instead of creating a new row each time.
    if (fields.conversationId) {
      const draft = await EmailDraft.findOneAndUpdate(
        workingDraftFilter({ businessId: user.businessId, conversationId: fields.conversationId, userId: user.userId }),
        { $set: fields },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return NextResponse.json({ success: true, data: draft }, { status: 200 });
    }

    const draft = await EmailDraft.create({ ...fields, businessId: user.businessId, createdBy: user.userId });
    return NextResponse.json({ success: true, data: draft }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

async function putHandler(req) {
  try {
    const { user } = req;
    const body = await req.json();
    const { id } = body;
    await dbConnect();
    const draft = await EmailDraft.findOneAndUpdate(
      { _id: id, businessId: user.businessId },
      { $set: pickDraftFields(body) },
      { new: true }
    );
    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

async function deleteHandler(req) {
  try {
    const { user } = req;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await dbConnect();
    await EmailDraft.findOneAndDelete({ _id: id, businessId: user.businessId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], getHandler);
export const POST = withPermissions(['dashboard_access', 'reports_access'], postHandler);
export const PUT = withPermissions(['dashboard_access', 'reports_access'], putHandler);
export const DELETE = withPermissions(['dashboard_access', 'reports_access'], deleteHandler);
