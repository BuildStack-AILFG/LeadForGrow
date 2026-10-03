import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import EmailAccount from '@/models/omnichannel/EmailAccount';
import { withPermissions } from '@/lib/rbac';
import { decrypt, isEncrypted } from '@/lib/encryption';
import { createTransporterForAccount } from '@/lib/omnichannel/mailerFromAccount';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * POST /api/automation/inbox/email-accounts/:id/test
 *
 * Opens a live connection to the account's SMTP (and IMAP, if configured)
 * to confirm credentials work. On success the account is promoted from
 * 'pending' to 'active'. On failure the row is marked 'error' with the
 * provider's message so the UI can surface it to the user.
 *
 * Access rules:
 *   - Personal accounts: only the owning user may test.
 *   - Shared/legacy accounts: any workspace admin may test.
 *   - Cross-tenant access is impossible because we filter by businessId.
 */
async function handler(req, ctx) {
  try {
    const { user } = req;
    const { id } = await ctx.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    await dbConnect();
    const account = await EmailAccount.findOne({ _id: id, businessId: user.businessId });
    if (!account) {
      // 404 not 403 — don't leak the existence of accounts in other tenants.
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    // Ownership check for personal accounts.
    if (account.type === 'personal' && String(account.userId) !== String(user.userId)) {
      const role = (user.role || '').toLowerCase();
      const isAdmin = ['owner', 'admin', 'super', 'super_admin', 'agency_owner'].includes(role);
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const results = { smtp: null, imap: null };

    // ---- SMTP verify ---------------------------------------------------
    // createTransporterForAccount handles decryption + port/secure logic.
    // .verify() opens a real connection and issues EHLO — actually proves
    // the credentials work, not just that the object was constructed.
    try {
      const transporter = await createTransporterForAccount(account);
      await transporter.verify();
      results.smtp = { ok: true };
    } catch (err) {
      results.smtp = {
        ok: false,
        code: err.code,
        message: humanizeSmtpError(err),
      };
    }

    // ---- IMAP verify (optional — only if configured) -------------------
    if (account.imap?.host && account.imap?.username && account.imap?.password) {
      const rawPass = isEncrypted(account.imap.password)
        ? decrypt(account.imap.password)
        : account.imap.password;

      if (rawPass === null) {
        results.imap = { ok: false, message: 'IMAP password could not be decrypted.' };
      } else {
        try {
          const { ImapFlow } = await import('imapflow');
          const client = new ImapFlow({
            host: account.imap.host,
            port: account.imap.port || 993,
            secure: account.imap.secure !== false,
            auth: { user: account.imap.username, pass: rawPass },
            socketTimeout: 15000,
            logger: false,
          });
          await client.connect();
          await client.logout();
          results.imap = { ok: true };
        } catch (err) {
          results.imap = {
            ok: false,
            code: err.code,
            message: humanizeImapError(err),
          };
        }
      }
    }

    // Persist state so the accounts list reflects reality without a re-test.
    const ok = results.smtp?.ok && (results.imap === null || results.imap.ok);
    if (ok) {
      account.status = 'active';
      account.lastError = null;
    } else {
      account.status = 'error';
      account.lastError =
        results.smtp?.message || results.imap?.message || 'Connection test failed';
    }
    await account.save();

    return NextResponse.json({
      success: ok,
      data: {
        accountId: String(account._id),
        status: account.status,
        smtp: results.smtp,
        imap: results.imap,
      },
    });
  } catch (error) {
    console.error('[EmailAccounts test]', error);
    return NextResponse.json(
      { success: false, error: serverErrorMessage(error) || 'Test failed' },
      { status: 500 }
    );
  }
}

/**
 * Map raw Nodemailer errors to something a non-engineer can act on.
 * The wizard shows these directly to the user.
 */
function humanizeSmtpError(err) {
  const code = err?.code || '';
  const msg = err?.message || 'Unknown SMTP error';
  if (code === 'EAUTH') {
    return 'Authentication failed. Check the mailbox address and password. Gmail users: make sure you pasted an App Password (16 chars), not your regular Google password.';
  }
  if (code === 'ETIMEDOUT' || code === 'ECONNECTION') {
    return 'Could not reach the SMTP server. Check host, port, and your network.';
  }
  if (code === 'ESOCKET' || msg.includes('SSL') || msg.includes('TLS')) {
    return 'TLS handshake failed. Try switching between port 465 (secure) and 587 (STARTTLS).';
  }
  return msg;
}

function humanizeImapError(err) {
  const code = err?.code || '';
  const msg = err?.message || 'Unknown IMAP error';
  if (code === 'AUTHENTICATIONFAILED' || msg.toLowerCase().includes('invalid credentials')) {
    return 'IMAP authentication failed. For Gmail, ensure you generated an App Password AND that IMAP is enabled at gmail.com → Settings → Forwarding and POP/IMAP.';
  }
  if (code === 'ETIMEDOUT') {
    return 'Could not reach the IMAP server. Check host and port.';
  }
  return msg;
}

export const POST = withPermissions(['dashboard_access', 'reports_access'], handler);
