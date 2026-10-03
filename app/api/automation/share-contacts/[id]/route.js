import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import ShareContact from '@/models/automation/ShareContact';
import { serverErrorMessage } from '@/lib/api/serverError';

export const DELETE = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { id } = await params;
    const deleted = await ShareContact.findOneAndDelete({ _id: id, businessId });
    if (!deleted) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
