import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { requireAdminPassword } from '@/lib/admin/adminAuth';
import { loadBusinessLeakRecords } from '@/lib/leak/databaseSource';

/**
 * POST /api/admin/leak-audit — platform owner only (LFG admin password).
 * Read-only: nothing is sent, nothing is written.
 *
 *   { action: 'businesses' }                          → businesses to pick from
 *   { action: 'run', businessId, days }               → normalized lead records for one business
 *
 * Prospect CSVs never come here; the admin page audits those in the browser.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!requireAdminPassword(body.password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    if (body.action === 'businesses') {
      const rows = await Business.find({})
        .select('businessName plan createdAt')
        .sort({ businessName: 1 })
        .limit(1000)
        .lean();
      return NextResponse.json({
        data: rows.map((b) => ({ id: String(b._id), name: b.businessName || String(b._id), plan: b.plan || null })),
      });
    }

    if (body.action === 'run') {
      if (!mongoose.isValidObjectId(body.businessId)) {
        return NextResponse.json({ error: 'Pick a business' }, { status: 400 });
      }
      const business = await Business.findById(body.businessId).select('businessName').lean();
      if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

      const days = Math.min(365, Math.max(7, Number(body.days) || 60));
      const now = new Date();
      const { records, notes, meta } = await loadBusinessLeakRecords(business._id, { days, now });

      // Records, not a finished report: the page runs lib/leak/rules.js itself,
      // so changing an SLA or marking a false positive needs no further request.
      return NextResponse.json({
        data: {
          business: { id: String(business._id), name: business.businessName },
          records,
          notes,
          meta: { ...meta, generatedAt: now.toISOString() },
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[admin/leak-audit]', error);
    return NextResponse.json({ error: 'Leak audit failed' }, { status: 500 });
  }
}
