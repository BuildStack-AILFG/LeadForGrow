import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import { getLeadMemory, upsertMemory } from '@/lib/ai/memory';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withAuth()(async (req, { params }) => {
  try {
    await dbConnect();
    const memories = await getLeadMemory(req.user.businessId, params.leadId);
    return NextResponse.json({ success: true, data: memories });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withAuth()(async (req, { params }) => {
  try {
    await dbConnect();
    const body = await req.json();
    const memory = await upsertMemory(req.user.businessId, { leadId: params.leadId, ...body });
    return NextResponse.json({ success: true, data: memory });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
