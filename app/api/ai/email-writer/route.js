import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import Business from '@/models/Business';
import { generateEmail } from '@/lib/ai/emailWriter';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const business = await Business.findById(req.user.businessId).select('businessName').lean();
    const result = await generateEmail({
      businessId: req.user.businessId,
      businessName: business?.businessName || 'Business',
      ...body,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
