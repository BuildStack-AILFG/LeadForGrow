import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import EmailAccount from '@/models/omnichannel/EmailAccount';
import { withPermissions } from '@/lib/rbac';
import { syncEmailAccount } from '@/lib/omnichannel/emailSync';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

async function handler(req) {
  try {
    const { user } = req;
    await dbConnect();

    const accounts = await EmailAccount.find({ businessId: user.businessId, syncEnabled: true });
    const results = [];
    for (const account of accounts) {
      const r = await syncEmailAccount(account);
      results.push({ accountId: account._id, email: account.email, ...r });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[Email sync]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}

export const POST = withPermissions(['dashboard_access', 'reports_access'], handler);
