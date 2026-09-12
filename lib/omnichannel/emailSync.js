/**
 * IMAP email sync — polls connected accounts and ingests new messages.
 * Requires imapflow (already installed) — dynamic import keeps the bundle
 * small for pods that never handle IMAP.
 *
 * Called from two places:
 *   1. POST /api/automation/inbox/sync-email  (manual "Sync now" button)
 *   2. GET  /api/cron/email-sync              (scheduled every 5 min)
 */
import { simpleParser } from 'mailparser';
import sanitizeHtml from 'sanitize-html';
import { ingestInboundEmail } from '@/lib/omnichannel/emailService';
import { decrypt, isEncrypted } from '@/lib/encryption';
import { uploadEmailAttachment } from '@/lib/omnichannel/emailAttachmentUploader';

/**
 * sanitize-html config for stored email HTML. We whitelist enough tags to
 * render typical marketing/transactional emails (tables, images, links,
 * lists, formatting) but ban scripts, styles, iframes, forms, event handlers,
 * and javascript:/data: URLs — the standard XSS surface.
 *
 * sanitize-html is used instead of DOMPurify because it is pure JS (no jsdom)
 * and so loads correctly in the serverless/turbopack runtime — isomorphic-
 * dompurify pulled jsdom, which crashed the route at module load.
 *
 * `target=_blank` + `rel=noopener noreferrer` are enforced on every anchor so
 * a malicious sender can't hijack the parent window via window.opener.
 */
const EMAIL_HTML_SANITIZE_CONFIG = {
  allowedTags: [
    'a', 'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div', 'ul', 'ol', 'li',
    'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'td', 'th', 'tfoot',
    'img', 'hr', 'small', 'sub', 'sup', 'dl', 'dt', 'dd', 'font',
  ],
  allowedAttributes: {
    '*': ['style', 'width', 'height', 'align', 'valign', 'border', 'bgcolor', 'color', 'class', 'name', 'title'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    table: ['cellpadding', 'cellspacing', 'border', 'width', 'bgcolor', 'align'],
    td: ['colspan', 'rowspan', 'width', 'height', 'align', 'valign', 'bgcolor'],
    th: ['colspan', 'rowspan', 'width', 'height', 'align', 'valign', 'bgcolor'],
    font: ['color', 'face', 'size'],
  },
  // Blocks javascript:/vbscript: everywhere; images may still use data: URIs.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data', 'cid'] },
  // Drop these tags AND their text content entirely (not just the tag).
  nonTextTags: ['script', 'style', 'textarea', 'noscript', 'iframe'],
  // Force safe link behaviour on every anchor (merge keeps existing attrs).
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, true),
  },
};

function sanitizeEmailHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return sanitizeHtml(html, EMAIL_HTML_SANITIZE_CONFIG);
}

/**
 * Max attachments we'll pull from a single email. Protects against zip-bomb
 * or "500-file .zip attached" style abuse — the first N still land as cards.
 */
const MAX_ATTACHMENTS_PER_EMAIL = 10;

/**
 * Parse a raw IMAP source with mailparser and upload each attachment to
 * Cloudinary. Returns everything the ingest layer needs to persist a
 * clean, human-readable Message with its file cards.
 *
 * Why mailparser instead of the hand-rolled regex we had before:
 *   - Charsets (UTF-8, Latin-1, GB2312, KOI8-R, …) are decoded automatically.
 *     The old regex path was garbling smart quotes ("I'm" → "Iâm") because
 *     it read the bytes as Latin-1 regardless of the Content-Type charset.
 *   - Nested multipart is walked correctly. Real emails from Gmail/Outlook
 *     often nest alternative→related→mixed; the regex approach kept picking
 *     the wrong body.
 *   - RFC 2047 encoded-word subjects (=?UTF-8?B?...?=) decode automatically.
 *   - Attachments come back as {filename, contentType, content: Buffer}
 *     tuples ready to hand to Cloudinary.
 *
 * Every attachment (including inline images embedded via CID) becomes a
 * separate attachment card in the UI — the user chose that over inline HTML
 * rendering so agents can consistently download/preview every file.
 */
async function parseEmailAndAttachments(rawSource, { businessId, messageId }) {
  const empty = {
    plainBody: '',
    htmlBody: '',
    inReplyTo: null,
    references: [],
    attachments: [],
  };
  if (!rawSource) return empty;

  let parsed;
  try {
    parsed = await simpleParser(rawSource);
  } catch (err) {
    console.error('[emailSync] mailparser failed:', err.message);
    return empty;
  }

  // Threading headers — mailparser hands them back already decoded from
  // RFC 2047 and comment-stripped. References is normalized to an array.
  const inReplyTo = parsed.inReplyTo || null;
  const references = Array.isArray(parsed.references)
    ? parsed.references
    : parsed.references
    ? [parsed.references]
    : [];

  // Body — prefer plain text; fall back to HTML (mailparser also returns
  // parsed.textAsHtml when only HTML is present, but we already have that
  // conversion as parsed.text so we don't need to duplicate).
  const plainBody = (parsed.text || '').trim();
  // HTML gets sanitized before we hand it to the ingest layer — persisting
  // raw sender HTML would be an XSS vector when the UI later renders it
  // with dangerouslySetInnerHTML. See EMAIL_HTML_SANITIZE_CONFIG above.
  const htmlBody = sanitizeEmailHtml(parsed.html || '');

  // Extract CC list from mailparser's already-parsed header addresses.
  const cc = (parsed.cc?.value || []).map((a) => ({
    name: a.name || '',
    address: a.address || '',
  })).filter((c) => c.address);

  // Upload attachments in parallel — most emails have 0-3 attachments so
  // fan-out is bounded, and this keeps sync latency down.
  const rawAttachments = (parsed.attachments || []).slice(0, MAX_ATTACHMENTS_PER_EMAIL);
  const uploaded = await Promise.all(
    rawAttachments.map(async (att) => {
      const upload = await uploadEmailAttachment({
        businessId,
        messageId,
        buffer: att.content,
        fileName: att.filename || 'attachment',
        mimeType: att.contentType || 'application/octet-stream',
      });
      if (!upload) return null;
      return {
        url: upload.url,
        fileName: att.filename || 'attachment',
        mimeType: att.contentType || 'application/octet-stream',
        size: upload.size,
        // Inline images have a contentDisposition of 'inline' and usually
        // a Content-ID header. We surface that so the UI can (later) match
        // them to <img cid:...> tags if we ever want to inline-render.
        isInline: att.contentDisposition === 'inline',
        contentId: att.cid || null,
      };
    })
  );
  const attachments = uploaded.filter(Boolean);

  return { plainBody, htmlBody, inReplyTo, references, attachments, cc };
}

/**
 * Trim the ">" quoted reply chain and "On DATE, X wrote:" preamble so
 * agents see the NEW content instead of the entire thread history.
 * mailparser gives us clean plain-text; this just adds the reply strip.
 *
 * The `wrote:` line can span multiple lines when Gmail wraps a long "On
 * date, Person <email>" preamble — so we match across newlines instead
 * of using `.+?` which stops at `\n`.
 */
function stripQuotedReply(text) {
  if (!text) return '';
  return text
    // "On <date>, <name> <email> wrote:" and everything after — including
    // when the preamble spans multiple wrapped lines (long email addresses
    // often cause Gmail to break "On ...\nName <addr> wrote:" across lines).
    .replace(/(^|\n)\s*On\s[\s\S]+?wrote:[\s\S]*$/i, '')
    // Also catch Outlook's "From: <sender> Sent: <date>" style forwarded
    // reply header — different UI convention, same intent to strip prior thread.
    .replace(/(^|\n)\s*-----\s*Original Message\s*-----[\s\S]*$/i, '')
    .replace(/(^|\n)\s*From:\s.+\r?\nSent:\s[\s\S]*$/i, '')
    // Filter out the > quoted body lines that Gmail/Apple Mail prepend.
    .split('\n')
    .filter((line) => !/^\s*>/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 5000);
}

export async function syncEmailAccount(account) {
  if (!account?.imap?.host) {
    return { synced: 0, skipped: true, reason: 'IMAP not configured' };
  }
  if (!account.imap?.username || !account.imap?.password) {
    return { synced: 0, skipped: true, reason: 'IMAP credentials missing' };
  }

  // Decrypt the stored password. isEncrypted() guards against decrypt() on
  // legacy plaintext values (the old rows written before Step 2).
  const rawPassword = isEncrypted(account.imap.password)
    ? decrypt(account.imap.password)
    : account.imap.password;

  if (rawPassword === null) {
    account.status = 'error';
    account.lastError = 'CORRUPT_CREDENTIALS: IMAP password could not be decrypted.';
    await account.save();
    return { synced: 0, error: account.lastError };
  }

  let client;
  let synced = 0;

  try {
    const { ImapFlow } = await import('imapflow');
    client = new ImapFlow({
      host: account.imap.host,
      port: account.imap.port || 993,
      secure: account.imap.secure !== false,
      auth: {
        user: account.imap.username,
        pass: rawPassword,
      },
      // Fail fast — a hung IMAP connection blocks the cron worker.
      socketTimeout: 30000,
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Incremental sync: only fetch messages since the last successful run.
      // Falls back to the last 24h on first-ever sync — keeps the initial
      // pull small so a mailbox with 50k messages doesn't stall the cron.
      const since = account.lastSyncAt
        ? new Date(account.lastSyncAt.getTime() - 60_000) // 1-minute overlap for clock skew
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      for await (const msg of client.fetch(
        { since },
        { envelope: true, source: true, uid: true }
      )) {
        const from = msg.envelope?.from?.[0];
        const fromEmail = from?.address;
        if (!fromEmail) continue;

        // Skip mail WE sent — Gmail's IMAP INBOX doesn't usually include
        // our own outbound, but Sent-All-Mail archives do; a self-sent
        // safety check keeps us from creating phantom "reply from myself".
        if (
          fromEmail.toLowerCase() === (account.email || '').toLowerCase()
        ) {
          continue;
        }

        const rawSource = msg.source; // Buffer — pass to mailparser as-is
        const externalMessageId =
          msg.envelope?.messageId || `imap_${account._id}_${msg.uid}`;

        // Full MIME parse + attachment upload in one shot. mailparser handles
        // charsets/quoted-printable/base64/multipart correctly (the old regex
        // approach was garbling smart quotes and dropping every attachment).
        const {
          plainBody,
          htmlBody,
          inReplyTo,
          references,
          attachments,
          cc,
        } = await parseEmailAndAttachments(rawSource, {
          businessId: account.businessId,
          messageId: externalMessageId,
        });

        // Prefer plain body; fall back to HTML if the sender only sent HTML.
        // We KEEP the quoted reply chain — MessageBubble collapses it behind
        // a "..." toggle (Gmail/Outlook-style) so agents can peek at prior
        // context on demand without it dominating the bubble.
        const readableBody = plainBody
          ? plainBody.slice(0, 20000) // safety cap; larger than before since quote is retained
          : (htmlBody || '').replace(/<[^>]+>/g, '').trim().slice(0, 20000);

        try {
          await ingestInboundEmail(account.businessId, {
            from: fromEmail,
            fromName: from?.name,
            subject: msg.envelope?.subject || '(no subject)',
            body: readableBody,
            html: htmlBody,
            externalMessageId,
            threadId: msg.envelope?.messageId,
            inReplyTo,
            references,
            timestamp: msg.envelope?.date || new Date(),
            emailAccountId: account._id,
            attachments,
            cc,
          });
          synced += 1;
        } catch (perMsgError) {
          // A single bad message must not sink the whole sync. Log and skip.
          console.error(
            `[emailSync] account=${account._id} uid=${msg.uid} failed:`,
            perMsgError.message
          );
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    client = null;

    account.lastSyncAt = new Date();
    account.status = 'active';
    account.lastError = null;
    await account.save();

    return { synced };
  } catch (error) {
    // Best-effort cleanup — logout() throws if the socket already died.
    if (client) {
      try {
        await client.logout();
      } catch {
        /* ignore */
      }
    }
    account.status = 'error';
    account.lastError = error.message;
    await account.save();
    return { synced: 0, error: error.message };
  }
}

export default { syncEmailAccount };
