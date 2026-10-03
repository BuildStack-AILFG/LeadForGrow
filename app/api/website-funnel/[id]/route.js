import { NextResponse } from 'next/server';
import { dbConnect } from "@/lib/mongodb";
import Website from "@/models/Website";
import { withAuth } from "@/lib/auth";

/** Only the website's owner or someone in its business may load it (was readable by any logged-in user). */
function canAccess(user, website) {
  if (String(website.owner) === String(user.userId)) return true;
  return !!(user.businessId && website.businessId && String(website.businessId) === String(user.businessId));
}

export const GET = withAuth()(async (req, { params }) => {
  try {
    const { id } = await params;
    await dbConnect();

    const website = await Website.findById(id);
    if (!website || !canAccess(req.user, website)) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, website });
  } catch (error) {
    console.error('Error fetching website:', error);
    return NextResponse.json({ success: false, error: 'Failed to load website' }, { status: 500 });
  }
});
