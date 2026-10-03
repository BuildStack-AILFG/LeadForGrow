import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import { ingestSource } from '@/lib/ai/rag/ingest';
import KnowledgeSource from '@/models/ai/KnowledgeSource';

export const POST = withAuth()(async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const result = await ingestSource(id, req.user.businessId);
    const source = await KnowledgeSource.findById(id).lean();
    return NextResponse.json({ success: true, data: { ...result, source } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
