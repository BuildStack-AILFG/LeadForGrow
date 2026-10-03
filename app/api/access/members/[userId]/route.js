import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import UserAccess from '@/models/access/UserAccess';
import TeamMember from '@/models/automation/TeamMember';
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

    const { userId } = await params;
    const body = await req.json();

    if (body.roleSlug) {
      await TeamMember.findOneAndUpdate(
        { businessId: tenant.business._id, userId },
        {
          role:
            body.roleSlug === 'owner'
              ? 'owner'
              : body.roleSlug === 'admin'
                ? 'admin'
                : 'team_member',
        }
      );
    }

    const record = await UserAccess.findOneAndUpdate(
      { businessId: tenant.business._id, userId },
      {
        businessId: tenant.business._id,
        userId,
        roleSlug: body.roleSlug,
        roleId: body.roleId,
        suspended: body.suspended,
        department: body.department,
        moduleOverrides: body.moduleOverrides,
        featureOverrides: body.featureOverrides,
        workspaceIds: body.workspaceIds,
      },
      { upsert: true, new: true }
    );

    await logAccessEvent({
      businessId: tenant.business._id,
      actorId: tenant.user._id,
      actorEmail: tenant.user.email,
      action: body.suspended ? 'member_suspended' : 'member_role_changed',
      description: `Updated access for team member`,
      targetType: 'user',
      targetId: userId,
      metadata: body,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
