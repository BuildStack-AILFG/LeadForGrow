import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Bill from '@/models/automation/Bill';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * GET /api/automation/bills
 * List bills for the current business. Optional filters: status, search.
 */
export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '25', 10));

    const query = { businessId };
    if (status) query.status = status;
    if (search) {
      // Simple regex — for the small volumes a bill list will have (thousands
      // per business, at most), Mongo's regex on billNumber + customerName is
      // fine. Move to text index if list ever gets big.
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ billNumber: rx }, { customerName: rx }, { customerPhone: rx }];
    }

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Bill.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: bills, pagination: { total, page, limit } });
  } catch (err) {
    console.error('[Bills] list:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch bills' }, { status: 500 });
  }
});

/**
 * POST /api/automation/bills
 * Create a new bill. Auto-generates a per-business sequential bill number.
 * Totals are recomputed server-side (see Bill.pre('save') hook).
 */
export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const body = await req.json();

    if (!body.customerName?.trim()) {
      return NextResponse.json({ success: false, error: 'Customer name is required' }, { status: 400 });
    }
    if (!Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one line item is required' }, { status: 400 });
    }

    const billNumber = await generateBillNumber(businessId);

    const bill = await Bill.create({
      businessId,
      billNumber,
      leadId:    body.leadId || undefined,
      dealId:    body.dealId || undefined,
      contactId: body.contactId || undefined,
      customerName:  body.customerName.trim(),
      customerPhone: (body.customerPhone || '').trim(),
      customerEmail: (body.customerEmail || '').trim(),
      lineItems: body.lineItems.map((it) => ({
        description: String(it.description || '').trim(),
        quantity:    Number(it.quantity) || 1,
        rate:        Number(it.rate) || 0,
      })),
      discount:  Number(body.discount) || 0,
      taxRate:   Number(body.taxRate) || 0,
      gstNumber: (body.gstNumber || '').trim(),
      notes:     (body.notes || '').trim(),
      status:    'draft',
      createdBy: req.user.userId,
    });

    return NextResponse.json({ success: true, data: bill });
  } catch (err) {
    console.error('[Bills] create:', err);
    return NextResponse.json({ success: false, error: serverErrorMessage(err) || 'Failed to create bill' }, { status: 500 });
  }
});

/**
 * Generate a per-business sequential bill number.
 *
 * Format: {PREFIX}-{YEAR}-{SEQ padded to 3 digits}
 * Prefix comes from the first 2 letters of the business name (uppercased),
 * fallback to "IN" (invoice). Year is the current calendar year. Seq is
 * per-business, per-year — resets on Jan 1.
 *
 * Race-safe via findOneAndUpdate atomic $inc + upsert on a counter doc
 * living on the Business itself. Cheap enough at MVP scale; if we ever
 * concurrently create many bills we can migrate to a dedicated Counter
 * collection with a unique index.
 */
async function generateBillNumber(businessId) {
  const year = new Date().getFullYear();
  const counterKey = `billCounter.${year}`;

  const business = await Business.findOneAndUpdate(
    { _id: businessId },
    { $inc: { [counterKey]: 1 } },
    { new: true, upsert: false }
  ).lean();

  const seq = business?.billCounter?.[year] || 1;
  const rawPrefix = (business?.businessName || 'IN').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
  const prefix = rawPrefix.length >= 2 ? rawPrefix : (rawPrefix + 'N').slice(0, 2);
  return `${prefix}-${year}-${String(seq).padStart(3, '0')}`;
}
