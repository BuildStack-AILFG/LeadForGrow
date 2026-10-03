import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import ShareContact from '@/models/automation/ShareContact';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const contacts = await ShareContact.find({ businessId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: contacts });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const body = await req.json();

    const name = String(body.name || '').trim();
    const whatsapp = String(body.whatsapp || '').replace(/[^\d]/g, ''); // digits only

    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    if (whatsapp.length < 10) {
      return NextResponse.json({ success: false, error: 'Enter a valid WhatsApp number with country code' }, { status: 400 });
    }

    const existing = await ShareContact.findOne({ businessId, whatsapp });
    if (existing) {
      return NextResponse.json({ success: false, error: 'This number is already saved' }, { status: 409 });
    }

    const contact = await ShareContact.create({ businessId, name, whatsapp, createdBy: userId });
    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
