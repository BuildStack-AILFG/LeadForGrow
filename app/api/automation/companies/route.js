import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Company from '@/models/automation/Company';
import Contact from '@/models/automation/Contact';
import Deal from '@/models/automation/Deal';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { parseListParams, buildSearchOr, paginationMeta } from '@/lib/crm/queryBuilder';
import { logTimelineEvent } from '@/lib/crm/timeline';
import { enrichCompaniesWithStats } from '@/lib/crm/companyService';
import { CLOSED_STAGES } from '@/lib/crm/stageKeys';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const { page, limit, skip, sortField, sortDir, search, archived } = parseListParams(searchParams);
    const industry = searchParams.get('industry');
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const country = searchParams.get('country');
    const hasOpenDeals = searchParams.get('hasOpenDeals');
    const tag = searchParams.get('tag');
    const recentlyAdded = searchParams.get('recentlyAdded') === '1';

    const query = { businessId: tenant.business._id, deletedAt: null, archived };
    if (industry) query.industry = industry;
    if (status) query.status = status;
    if (ownerId) query.ownerId = ownerId === 'unassigned' ? null : ownerId;
    if (country) query['address.country'] = country;
    if (tag) query.tags = tag;
    if (recentlyAdded) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    }

    const searchOr = buildSearchOr(['name', 'domain', 'website', 'email', 'gstNumber'], search);
    if (searchOr) query.$or = searchOr;

    // Resolved before pagination (not filtered after, on just the current page's rows) so
    // `total`/`pages` reflect every matching company, not just however many of the current
    // page happen to also match — that previously left Next permanently disabled once this
    // filter was combined with pagination, since `total` could never exceed `limit`.
    if (hasOpenDeals === 'yes' || hasOpenDeals === 'no') {
      const openCompanyIds = await Deal.distinct('companyId', {
        businessId: tenant.business._id,
        archived: false,
        companyId: { $ne: null },
        stage: { $nin: CLOSED_STAGES },
      });
      query._id = hasOpenDeals === 'yes' ? { $in: openCompanyIds } : { $nin: openCompanyIds };
    }

    const companies = await Company.find(query)
      .populate('ownerId', 'firstName lastName email')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean();

    const enriched = await enrichCompaniesWithStats(tenant.business._id, companies);

    const total = await Company.countDocuments(query);

    return NextResponse.json({ success: true, data: enriched, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    console.error('[Companies API GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });

    await dbConnect();

    const company = await Company.create({
      ...body,
      // Tenant/audit fields last so client payloads can never override them
      businessId: tenant.business._id,
      ownerId: body.ownerId || tenant.user._id,
      createdBy: tenant.user._id,
    });

    await logTimelineEvent({
      businessId: tenant.business._id,
      entityType: 'company',
      entityId: company._id,
      type: 'company_created',
      description: `Company "${company.name}" created`,
      performedBy: tenant.user._id,
    });

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error) {
    console.error('[Companies API POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
