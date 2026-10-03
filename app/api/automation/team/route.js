import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import TeamMember from '@/models/automation/TeamMember';
import User from '@/models/User';
import UserAccess from '@/models/access/UserAccess';
import bcrypt from 'bcryptjs';
import { withTenantAuth, resolveTenant } from '@/lib/auth';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { business } = tenant;

    const members = await TeamMember.find({ businessId: business._id })
      .populate('userId', 'email firstName lastName phone lastActivityAt')
      .lean();

    // The legacy `role` field only distinguishes owner/admin/team_member — the real
    // assignment (including custom roles) lives in UserAccess.roleSlug. Attach it here
    // so the Team & Access role dropdown can reflect a member's actual custom role
    // instead of collapsing everything non-owner/admin to "Sales Agent".
    const accessRecords = await UserAccess.find({
      businessId: business._id,
      userId: { $in: members.map((m) => m.userId?._id).filter(Boolean) },
    }).lean();
    const roleSlugByUserId = new Map(accessRecords.map((a) => [String(a.userId), a.roleSlug]));
    const enriched = members.map((m) => ({
      ...m,
      roleSlug: roleSlugByUserId.get(String(m.userId?._id)) || m.role,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { business } = tenant;
    const body = await request.json();
    const { email, firstName, lastName, phone, role, password } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Check quota
    const currentMemberCount = await TeamMember.countDocuments({ businessId: business._id });
    const maxMembers = business.quotas?.maxTeamMembers ?? 1;

    if (currentMemberCount >= maxMembers) {
      return NextResponse.json({
        success: false,
        error: `Team member limit reached (${maxMembers}). Please upgrade your plan.`,
        requiresUpgrade: true
      }, { status: 403 });
    }

    // Check if user already exists
    let targetUser = await User.findOne({ email: email.toLowerCase() });

    if (targetUser) {
      // Check if already in this business
      const existingMember = await TeamMember.findOne({
        userId: targetUser._id,
        businessId: business._id
      });
      if (existingMember) {
        return NextResponse.json({ success: false, error: 'User is already a team member' }, { status: 400 });
      }
    } else {
      // Create a new user for the team member
      const tempPassword = password || Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      targetUser = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        businessId: business._id,
        firstName,
        lastName,
        phone,
        role: 'TEAM_MEMBER' // Fixed: matches User model enum
      });
      targetUser._tempPassword = tempPassword; // Attach for return
    }

    // Create TeamMember record
    const teamMember = await TeamMember.create({
      businessId: business._id,
      userId: targetUser._id,
      role: role || 'team_member',
      active: true
    });

    const populatedMember = await TeamMember.findById(teamMember._id)
      .populate('userId', 'email firstName lastName phone lastActivityAt')
      .lean();

    // Include login credentials in response when a new user account was created
    if (targetUser._tempPassword) {
      populatedMember.temporaryPassword = targetUser._tempPassword;
    } else if (password) {
      populatedMember.temporaryPassword = password;
    }

    return NextResponse.json({ success: true, data: populatedMember }, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to add member' }, { status: 500 });
  }
});

export const DELETE = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID required' }, { status: 400 });
    }

    // Ensure member belongs to this business
    const member = await TeamMember.findOne({ _id: memberId, businessId: tenant.business._id });
    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found or unauthorized' }, { status: 404 });
    }

    if (member.role === 'owner') {
      return NextResponse.json({ success: false, error: 'Cannot remove the account owner' }, { status: 400 });
    }

    await TeamMember.findByIdAndDelete(memberId);

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
});
