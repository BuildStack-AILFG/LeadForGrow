import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SavedEmailDesign from '@/models/automation/SavedEmailDesign';
import { withPlanAccess } from '@/lib/accessControl';
import { normalizeSavedEmailDesign, EmailContentError } from '@/lib/broadcasts/emailContent';
import { serverErrorMessage } from '@/lib/api/serverError';

const MAX_SAVED_DESIGNS = 100;

// "My templates": a business's saved email designs. The list omits stored HTML
// (it can be up to 300 KB each); the editor fetches one template by id when used.
export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const designs = await SavedEmailDesign.find({ businessId: req.user.businessId })
      .sort({ updatedAt: -1 })
      .limit(MAX_SAVED_DESIGNS)
      .select('-html')
      .lean();
    return NextResponse.json({ success: true, data: designs });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    let fields;
    try {
      fields = normalizeSavedEmailDesign(await req.json());
    } catch (err) {
      if (err instanceof EmailContentError) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      throw err;
    }
    const count = await SavedEmailDesign.countDocuments({ businessId });
    if (count >= MAX_SAVED_DESIGNS) {
      return NextResponse.json({ success: false, error: `You can keep up to ${MAX_SAVED_DESIGNS} templates. Delete one to save another.` }, { status: 400 });
    }
    const saved = await SavedEmailDesign.create({ ...fields, businessId, createdBy: req.user.userId, updatedBy: req.user.userId });
    const { html, ...rest } = saved.toObject();
    return NextResponse.json({ success: true, data: rest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
