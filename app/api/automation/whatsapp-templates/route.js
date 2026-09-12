import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WhatsAppTemplate from '@/models/automation/WhatsAppTemplate';
import { withPlanAccess } from '@/lib/accessControl';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    // Deleted templates are soft-deleted (see WhatsAppTemplate.isDeleted) so
    // the "Deleted" tab can list + restore them. Every other view excludes
    // them by default.
    const showDeleted = searchParams.get('deleted') === 'true';

    const query = { businessId, isDeleted: showDeleted ? true : { $ne: true } };
    if (status) query.status = status;
    if (category) query.category = category;

    const templates = await WhatsAppTemplate.find(query).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    if (!/^[a-z0-9_]+$/.test(body.name)) {
      return NextResponse.json(
        { success: false, error: 'Name must be lowercase letters, numbers, and underscores only (e.g. order_confirmation)' },
        { status: 400 }
      );
    }

    const existing = await WhatsAppTemplate.findOne({
      businessId, name: body.name, language: body.language || 'en_US',
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A template with this name and language already exists' },
        { status: 409 }
      );
    }

    const template = await WhatsAppTemplate.create({
      businessId,
      name: body.name.trim(),
      language: body.language || 'en_US',
      category: body.category || 'MARKETING',
      components: body.components || [],
      status: 'DRAFT',
      source: 'native',
      createdBy: userId,
      updatedBy: userId,
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
