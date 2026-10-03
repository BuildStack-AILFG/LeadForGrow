import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import SavedEmailDesign from '@/models/automation/SavedEmailDesign';
import { withPlanAccess } from '@/lib/accessControl';
import { normalizeSavedEmailDesign, EmailContentError } from '@/lib/broadcasts/emailContent';
import { serverErrorMessage } from '@/lib/api/serverError';

const notFound = () => NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const design = await SavedEmailDesign.findOne({ _id: id, businessId: req.user.businessId }).lean();
    if (!design) return notFound();
    return NextResponse.json({ success: true, data: design });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

// Overwrite a saved template with the current editor content (or rename it).
export const PUT = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const existing = await SavedEmailDesign.findOne({ _id: id, businessId: req.user.businessId });
    if (!existing) return notFound();
    const body = await req.json();
    let fields;
    try {
      fields = body.renameOnly
        ? { name: normalizeSavedEmailDesign({ name: body.name, format: existing.format, baseTemplateId: existing.baseTemplateId, values: existing.values, html: existing.html }).name }
        : normalizeSavedEmailDesign(body);
    } catch (err) {
      if (err instanceof EmailContentError) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      throw err;
    }
    existing.set({ ...fields, updatedBy: req.user.userId });
    await existing.save();
    const { html, ...rest } = existing.toObject();
    return NextResponse.json({ success: true, data: rest });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return notFound();
    const res = await SavedEmailDesign.deleteOne({ _id: id, businessId: req.user.businessId });
    if (!res.deletedCount) return notFound();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
