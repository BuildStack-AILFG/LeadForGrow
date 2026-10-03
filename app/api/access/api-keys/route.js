import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import ApiKey from '@/models/access/ApiKey';
import { resolveUserAccess } from '@/lib/access/resolver';
import { logAccessEvent } from '@/lib/access/audit';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withTenantAuth(async (req) => {
  try {
    await dbConnect();
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const access = await resolveUserAccess({
      userId: tenant.user._id,
      businessId: tenant.business._id,
      business: tenant.business,
      user: tenant.user,
    });

    if (!access.tierFeatures.api_access) {
      return NextResponse.json(
        { success: false, error: 'API keys require Scale plan or higher.', requiresUpgrade: true, code: 'PLAN_LOCKED' },
        { status: 403 }
      );
    }

    const keys = await ApiKey.find({ businessId: tenant.business._id, revoked: false })
      .select('-keyHash')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: keys });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to list API keys' }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (req) => {
  try {
    await dbConnect();
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const access = await resolveUserAccess({
      userId: tenant.user._id,
      businessId: tenant.business._id,
      business: tenant.business,
      user: tenant.user,
    });

    if (!access.canManageAccess || !access.tierFeatures.api_access) {
      return NextResponse.json({ success: false, error: 'Forbidden or plan locked' }, { status: 403 });
    }

    const body = await req.json();
    const { raw, prefix, hash } = ApiKey.generateKey();

    const key = await ApiKey.create({
      businessId: tenant.business._id,
      name: body.name || 'API Key',
      keyPrefix: prefix,
      keyHash: hash,
      scopes: body.scopes || ['leads:read', 'leads:write'],
      createdBy: tenant.user._id,
    });

    await logAccessEvent({
      businessId: tenant.business._id,
      actorId: tenant.user._id,
      actorEmail: tenant.user.email,
      action: 'api_key_created',
      description: `Created API key "${key.name}"`,
      targetType: 'api_key',
      targetId: String(key._id),
    });

    return NextResponse.json({
      success: true,
      data: { ...key.toObject(), key: raw },
      message: 'Copy this key now — it will not be shown again.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
