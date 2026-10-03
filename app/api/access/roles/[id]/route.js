import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import WorkspaceRole from '@/models/access/WorkspaceRole';
import { logAccessEvent } from '@/lib/access/audit';
import { resolveUserAccess } from '@/lib/access/resolver';
import { serverErrorMessage } from '@/lib/api/serverError';

export const PATCH = withTenantAuth(async (req, { params }) => {
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
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const role = await WorkspaceRole.findOne({ _id: id, businessId: tenant.business._id });

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    if (role.systemRole && role.slug === 'owner' && body.permissions) {
      return NextResponse.json({ success: false, error: 'Owner permissions cannot be modified' }, { status: 400 });
    }

    if (body.name) role.name = body.name;
    if (body.description !== undefined) role.description = body.description;
    if (body.permissions) role.permissions = body.permissions;
    if (body.active !== undefined) role.active = body.active;

    await role.save();

    await logAccessEvent({
      businessId: tenant.business._id,
      actorId: tenant.user._id,
      actorEmail: tenant.user.email,
      action: 'role_updated',
      description: `Updated permissions for role "${role.name}"`,
      targetType: 'role',
      targetId: String(role._id),
      metadata: { permissions: body.permissions ? Object.keys(body.permissions).length : 0 },
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withTenantAuth(async (req, { params }) => {
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
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const role = await WorkspaceRole.findOne({ _id: id, businessId: tenant.business._id });

    if (!role) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (role.systemRole) {
      return NextResponse.json({ success: false, error: 'System roles cannot be deleted' }, { status: 400 });
    }

    role.active = false;
    await role.save();

    await logAccessEvent({
      businessId: tenant.business._id,
      actorId: tenant.user._id,
      actorEmail: tenant.user.email,
      action: 'role_deleted',
      description: `Archived role "${role.name}"`,
      targetType: 'role',
      targetId: String(role._id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
