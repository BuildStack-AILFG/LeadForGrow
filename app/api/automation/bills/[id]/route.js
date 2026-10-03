import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Bill from '@/models/automation/Bill';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withPlanAccess('automation', async (req, ctx) => {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    if (!validId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid bill id' }, { status: 400 });
    }
    const bill = await Bill.findOne({ _id: id, businessId: req.user.businessId }).lean();
    if (!bill) return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: bill });
  } catch (err) {
    console.error('[Bills] get:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch bill' }, { status: 500 });
  }
});

/**
 * PUT — full edit. Only draft bills can be edited (once sent, editing
 * would silently diverge from what the customer received). Rejects with
 * a clear error rather than blindly overwriting.
 */
export const PUT = withPlanAccess('automation', async (req, ctx) => {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    if (!validId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid bill id' }, { status: 400 });
    }
    const bill = await Bill.findOne({ _id: id, businessId: req.user.businessId });
    if (!bill) return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    if (bill.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: `Cannot edit a ${bill.status} bill. Duplicate it to create a new draft.`,
      }, { status: 400 });
    }

    const body = await req.json();
    const editable = ['customerName', 'customerPhone', 'customerEmail', 'lineItems',
                      'discount', 'taxRate', 'gstNumber', 'notes'];
    for (const field of editable) {
      if (body[field] !== undefined) bill[field] = body[field];
    }
    // Wipe cached PDF url so the next send/download regenerates from fresh data
    bill.pdfUrl = undefined;
    await bill.save();
    return NextResponse.json({ success: true, data: bill });
  } catch (err) {
    console.error('[Bills] update:', err);
    return NextResponse.json({ success: false, error: serverErrorMessage(err) || 'Failed to update bill' }, { status: 500 });
  }
});

/**
 * PATCH — lifecycle-only updates (mark paid, void, etc.) that don't touch
 * bill content and so are allowed on non-draft bills.
 */
export const PATCH = withPlanAccess('automation', async (req, ctx) => {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    if (!validId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid bill id' }, { status: 400 });
    }
    const bill = await Bill.findOne({ _id: id, businessId: req.user.businessId });
    if (!bill) return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });

    const { action, paymentNote } = await req.json();
    if (action === 'mark_paid') {
      bill.status = 'paid';
      bill.paidAt = new Date();
      if (paymentNote) bill.paymentNote = String(paymentNote).slice(0, 500);
    } else if (action === 'void') {
      bill.status = 'void';
    } else if (action === 'reopen') {
      bill.status = 'draft';
      bill.sentAt = undefined;
      bill.paidAt = undefined;
      bill.pdfUrl = undefined;
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
    await bill.save();
    return NextResponse.json({ success: true, data: bill });
  } catch (err) {
    console.error('[Bills] patch:', err);
    return NextResponse.json({ success: false, error: 'Failed to update bill status' }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req, ctx) => {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    if (!validId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid bill id' }, { status: 400 });
    }
    const bill = await Bill.findOne({ _id: id, businessId: req.user.businessId });
    if (!bill) return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    // Only drafts can be hard-deleted. Sent bills should be voided so the
    // history stays intact (the customer received a physical copy — deleting
    // it in our DB doesn't undo that).
    if (bill.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: `Cannot delete a ${bill.status} bill. Void it instead.`,
      }, { status: 400 });
    }
    await Bill.deleteOne({ _id: bill._id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Bills] delete:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete bill' }, { status: 500 });
  }
});
