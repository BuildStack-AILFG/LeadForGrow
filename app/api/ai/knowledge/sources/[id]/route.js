import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import KnowledgeSource from '@/models/ai/KnowledgeSource';
import KnowledgeChunk from '@/models/ai/KnowledgeChunk';

export const GET = withAuth()(async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const source = await KnowledgeSource.findOne({ _id: id, businessId: req.user.businessId }).lean();
    if (!source) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: source });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PUT = withAuth()(async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const allowed = ['name', 'category', 'url', 'fileUrl', 'fileName', 'mimeType', 'content', 'faqs', 'catalog', 'customInstructions'];
    const patch = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const source = await KnowledgeSource.findOneAndUpdate(
      { _id: id, businessId: req.user.businessId },
      { $set: patch, status: 'pending' },
      { new: true }
    );
    if (!source) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: source });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const DELETE = withAuth()(async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const source = await KnowledgeSource.findOneAndDelete({ _id: id, businessId: req.user.businessId });
    if (!source) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    await KnowledgeChunk.deleteMany({ sourceId: source._id, businessId: req.user.businessId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
