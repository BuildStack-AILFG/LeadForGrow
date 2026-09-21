import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Contact from '@/models/automation/Contact';
import { withTenantAuth, resolveTenant } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { ids, action, data } = await request.json();
    if (!Array.isArray(ids) || !ids.length || !action) {
      return NextResponse.json({ success: false, error: 'ids and action required' }, { status: 400 });
    }
    if (ids.length > 500) {
      return NextResponse.json({ success: false, error: 'Bulk operations are limited to 500 contacts at a time' }, { status: 400 });
    }

    await dbConnect();
    const query = { _id: { $in: ids }, businessId: tenant.business._id, deletedAt: null };
    let modified = 0;

    switch (action) {
      case 'delete': {
        const res = await Contact.updateMany(query, { deletedAt: new Date(), updatedBy: tenant.user._id });
        modified = res.modifiedCount;
        break;
      }
      case 'archive': {
        const res = await Contact.updateMany(query, { archived: true, updatedBy: tenant.user._id });
        modified = res.modifiedCount;
        break;
      }
      case 'restore': {
        const res = await Contact.updateMany(query, { archived: false, updatedBy: tenant.user._id });
        modified = res.modifiedCount;
        break;
      }
      case 'assignOwner': {
        if (!data?.ownerId) return NextResponse.json({ success: false, error: 'ownerId required' }, { status: 400 });
        const res = await Contact.updateMany(query, { ownerId: data.ownerId, updatedBy: tenant.user._id });
        modified = res.modifiedCount;
        break;
      }
      case 'addTags': {
        if (!data?.tags?.length) return NextResponse.json({ success: false, error: 'tags required' }, { status: 400 });
        const res = await Contact.updateMany(query, { $addToSet: { tags: { $each: data.tags } }, $set: { updatedBy: tenant.user._id } });
        modified = res.modifiedCount;
        break;
      }
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { modified, requested: ids.length } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
