import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import WorkspaceRole from '@/models/access/WorkspaceRole';
import { ensureWorkspaceRoles } from '@/lib/access/seed';
import { getDefaultPermissionsForRole } from '@/lib/access/catalog';
import { logAccessEvent } from '@/lib/access/audit';
import { resolveUserAccess } from '@/lib/access/resolver';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withTenantAuth(async (req) => {
  try {
    await dbConnect();
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const roles = await ensureWorkspaceRoles(tenant.business._id);
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
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

    if (!access.canManageAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED' }, { status: 403 });
    }

    if (!access.tierFeatures.custom_roles) {
      return NextResponse.json(
        {
          success: false,
          error: 'Custom roles require Growth plan or higher.',
          requiresUpgrade: true,
          code: 'PLAN_LOCKED',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const slug = (body.slug || body.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const role = await WorkspaceRole.create({
      businessId: tenant.business._id,
      slug,
      name: body.name,
      description: body.description || '',
      systemRole: false,
      permissions: body.permissions || getDefaultPermissionsForRole('viewer'),
      createdBy: tenant.user._id,
    });

    await logAccessEvent({
      businessId: tenant.business._id,
      actorId: tenant.user._id,
      actorEmail: tenant.user.email,
      action: 'role_created',
      description: `Created role "${role.name}"`,
      targetType: 'role',
      targetId: String(role._id),
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
