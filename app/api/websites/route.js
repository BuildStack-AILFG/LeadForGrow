import { dbConnect } from '@/lib/mongodb';
import Website from '@/models/Website';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const data = await req.json();
    const { templateId, websiteName, brandName, goal, content } = data;

    if (!templateId || !websiteName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const website = await Website.create({
      owner: req.user.userId,
      templateId,
      websiteName,
      brandName,
      goal,
      content: content || {},
    });

    return NextResponse.json({ success: true, data: website });
  } catch (error) {
    console.error('Error creating website:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const GET = withAuth()(async (req) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const status = searchParams.get('status');

    const query = { owner: req.user.userId };
    if (slug) query.slug = slug;
    if (status) query.status = status;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 100);
    const skip = (page - 1) * limit;

    const [websites, total] = await Promise.all([
      Website.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Website.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: websites,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
