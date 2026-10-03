import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';

/**
 * GET / PUT the "bill header" — the fields that print on every bill PDF:
 * businessName, phone, email, address, gstin, website, logo.
 *
 * Kept as its own endpoint (rather than folding into a big settings API)
 * so future changes to bill formatting don't ripple through unrelated
 * settings surfaces.
 */

const FIELDS = [
  'businessName', 'phone', 'email', 'address', 'gstin', 'website',
  // Invoice signature block
  'billStampUrl', 'billSignatoryName', 'billSignatoryTitle',
];

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId)
      .select('businessName phone email address gstin website logo billStampUrl billSignatoryName billSignatoryTitle')
      .lean();
    return NextResponse.json({ success: true, data: business || {} });
  } catch (err) {
    console.error('[BillHeader] get:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const patch = {};
    for (const f of FIELDS) {
      if (body[f] !== undefined) patch[f] = String(body[f] || '').trim();
    }
    // GSTIN is uppercase-normalised (users type "22aaaaa…", we store "22AAAAA…")
    if (patch.gstin) patch.gstin = patch.gstin.toUpperCase();

    // Lightweight validations — keep in step with what the PDF renderer
    // can actually show without breaking layout.
    if (patch.businessName === '') {
      return NextResponse.json({ success: false, error: 'Business name is required' }, { status: 400 });
    }
    if (patch.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email' }, { status: 400 });
    }
    if (patch.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z][0-9A-Z]$/.test(patch.gstin)) {
      return NextResponse.json({ success: false, error: 'GSTIN must be 15 characters in the format 22AAAAA0000A1Z5' }, { status: 400 });
    }
    if (patch.address && patch.address.length > 300) {
      return NextResponse.json({ success: false, error: 'Address too long — keep under 300 characters' }, { status: 400 });
    }

    const business = await Business.findByIdAndUpdate(
      req.user.businessId,
      { $set: patch },
      { new: true, projection: 'businessName phone email address gstin website logo billStampUrl billSignatoryName billSignatoryTitle' }
    ).lean();

    return NextResponse.json({ success: true, data: business });
  } catch (err) {
    console.error('[BillHeader] save:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to save' }, { status: 500 });
  }
});
