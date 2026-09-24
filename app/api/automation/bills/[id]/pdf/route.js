import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Bill from '@/models/automation/Bill';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { renderBillPdf } from '@/lib/bills/pdfRenderer';
import { fetchLogoDataUrl } from '@/lib/bills/fetchLogoDataUrl';

/**
 * GET /api/automation/bills/[id]/pdf
 *
 * Streams the freshly rendered PDF as a download. Used by the "Download"
 * button on the bill detail page and by the "Preview" action. Does NOT
 * cache to Cloudinary — that's only done on send. Lets the owner iterate
 * on the design without piling up dead Cloudinary uploads.
 */
export const GET = withPlanAccess('automation', async (req, ctx) => {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid bill id' }, { status: 400 });
    }
    const [bill, business] = await Promise.all([
      Bill.findOne({ _id: id, businessId: req.user.businessId }).lean(),
      Business.findById(req.user.businessId).lean(),
    ]);
    if (!bill) return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });

    const [logoDataUrl, stampDataUrl] = await Promise.all([
      fetchLogoDataUrl(business?.logo),
      fetchLogoDataUrl(business?.billStampUrl),
    ]);
    const buffer = renderBillPdf({ bill, business, logoDataUrl, stampDataUrl });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${bill.billNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[Bills] pdf:', err);
    return NextResponse.json({ success: false, error: 'Failed to render PDF' }, { status: 500 });
  }
});
