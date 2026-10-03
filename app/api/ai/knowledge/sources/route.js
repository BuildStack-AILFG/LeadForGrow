import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import KnowledgeSource from '@/models/ai/KnowledgeSource';
import { ingestSource } from '@/lib/ai/rag/ingest';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withAuth()(async (req) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const filter = { businessId: req.user.businessId };
    if (type) filter.type = type;
    if (category) filter.category = category;

    const sources = await KnowledgeSource.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: sources });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, type, category, url, fileUrl, fileName, mimeType, content, faqs, catalog, customInstructions, autoIndex = true } = body;

    if (!name?.trim() || !type) {
      return NextResponse.json({ success: false, error: 'name and type required' }, { status: 400 });
    }

    const source = await KnowledgeSource.create({
      businessId: req.user.businessId,
      name: name.trim(),
      type,
      category: category?.trim() || undefined,
      url,
      fileUrl,
      fileName,
      mimeType,
      content,
      faqs,
      catalog,
      customInstructions,
      status: 'pending',
    });

    if (autoIndex) {
      try {
        await ingestSource(source._id, req.user.businessId);
      } catch (err) {
        return NextResponse.json({
          success: true,
          data: await KnowledgeSource.findById(source._id).lean(),
          warning: `Created but indexing failed: ${err.message}`,
        });
      }
    }

    const updated = await KnowledgeSource.findById(source._id).lean();
    return NextResponse.json({ success: true, data: updated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
