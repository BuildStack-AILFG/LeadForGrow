import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import { retrieveKnowledge } from '@/lib/ai/rag/retriever';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const { query, limit = 6 } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ success: false, error: 'query required' }, { status: 400 });
    }
    const chunks = await retrieveKnowledge(req.user.businessId, query, { limit });
    return NextResponse.json({
      success: true,
      data: chunks.map((c) => ({
        content: c.content,
        sourceName: c.metadata?.sourceName,
        sourceType: c.metadata?.sourceType,
        category: c.metadata?.category,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
