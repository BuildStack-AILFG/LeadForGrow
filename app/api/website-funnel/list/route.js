import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Website from '@/models/Website';
import Lead from '@/models/automation/Lead';
import Form from '@/models/Form';
import { withAuth } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withAuth()(async (req) => {
  try {
    await dbConnect();
    const userId = req.user.userId;

    const websites = await Website.find({ owner: userId }).sort({ createdAt: -1 }).lean();

    const websitesWithLeads = await Promise.all(
      websites.map(async (site) => {
        const identifiers = site.sections
          ?.filter((s) => s.type === 'form' && (s.content?.formId || s.content?.formToken))
          ?.map((s) => s.content.formId || s.content.formToken)
          .filter(Boolean);

        let leadCount = 0;
        if (identifiers?.length) {
          const resolvedForms = await Form.find({
            $or: [
              { _id: { $in: identifiers.filter((id) => mongoose.isValidObjectId(id)) } },
              { token: { $in: identifiers } },
            ],
          })
            .select('_id')
            .lean();

          const formIds = resolvedForms.map((f) => f._id);
          if (formIds.length) {
            leadCount = await Lead.countDocuments({ formId: { $in: formIds }, archived: { $ne: true } });
          }
        }

        return { ...site, leadCount };
      })
    );

    return NextResponse.json({ success: true, websites: websitesWithLeads });
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
