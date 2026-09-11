/**
 * Uploads email attachments to Cloudinary under a per-tenant, per-message
 * folder so each business's files stay isolated and messages can carry
 * multiple attachments (CV + cover letter + references, etc.).
 *
 * Called by lib/omnichannel/emailSync.js during IMAP ingest.
 *
 * Design notes:
 *  - Cloudinary's resource_type auto-detects images/videos, but PDFs / DOCs /
 *    other files need resource_type: 'raw' to be stored and served intact.
 *  - Filenames are sanitized because Cloudinary public_ids can't contain
 *    slashes or leading dots — but we keep the ORIGINAL filename on the
 *    Message doc so the UI shows what the sender named it.
 *  - Per-attachment size guardrail (default 25 MB) is enforced BEFORE the
 *    Cloudinary call so we don't burn bandwidth on emails with 200 MB zips.
 *  - When Cloudinary env vars are missing, we log and return null — the
 *    IMAP sync then saves the message text but marks the attachment as
 *    unavailable rather than crashing the whole sync.
 */

import { v2 as cloudinary } from 'cloudinary';

const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per file

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Cloudinary resource_type dispatch — images/video use their own pipelines
 * (transformations, delivery URLs), everything else goes to "raw" which
 * stores the bytes untouched for later download.
 */
function resourceTypeFor(mimeType) {
  const t = (mimeType || '').toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  return 'raw';
}

/**
 * Cloudinary public_ids and folder segments have to be URL-safe; strip
 * anything that would break a slash-delimited path. The original filename
 * is preserved on the Message doc separately so the UI still shows the
 * sender's name.
 *
 * Also used to sanitize the messageId segment of the folder path — RFC 822
 * Message-IDs like `<abc+def@mail.gmail.com>` contain `<`, `>`, `+`, `@`
 * which Cloudinary rejects. Same rule for both segments keeps the path
 * predictable.
 */
function sanitizeSegment(input) {
  return String(input || '')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/^\.+/, '')
    .replace(/_+/g, '_')
    .slice(0, 120) || 'x';
}

/**
 * Upload one attachment buffer to Cloudinary.
 *
 * @param {object} opts
 * @param {string|ObjectId} opts.businessId  — tenant scope
 * @param {string} opts.messageId            — email UID / provider message id
 * @param {Buffer} opts.buffer               — file bytes from mailparser
 * @param {string} opts.fileName             — original name from email header
 * @param {string} opts.mimeType             — from email Content-Type
 *
 * @returns {Promise<{url:string,size:number}|null>}
 *   null if Cloudinary is not configured OR size exceeds cap — sync continues
 *   without the attachment rather than losing the whole message.
 */
export async function uploadEmailAttachment({
  businessId,
  messageId,
  buffer,
  fileName,
  mimeType,
}) {
  if (!buffer || !buffer.length) return null;

  if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
    console.warn(
      `[EmailAttachment] Skipping "${fileName}" — ${(buffer.length / 1024 / 1024).toFixed(1)} MB exceeds ${MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024} MB cap`
    );
    return null;
  }

  if (!isConfigured()) {
    console.warn(
      '[EmailAttachment] Cloudinary env vars missing — attachment not uploaded. Set CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.'
    );
    return null;
  }

  configureCloudinary();

  // Both the messageId (folder) and filename (public_id) must be sanitized —
  // RFC 822 Message-IDs contain <, >, +, @ which Cloudinary rejects.
  const folder = `lfg/${sanitizeSegment(businessId)}/email-attachments/${sanitizeSegment(messageId)}`;
  const publicId = sanitizeSegment(fileName);
  const resourceType = resourceTypeFor(mimeType);

  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        // Keep the original file extension in the delivered URL so a
        // download of report.pdf actually opens as PDF, not as raw octet.
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      },
      (err, result) => {
        if (err || !result?.secure_url) {
          console.error(
            `[EmailAttachment] Upload failed for "${fileName}":`,
            err?.message || 'no url returned'
          );
          resolve(null);
          return;
        }
        resolve({
          url: result.secure_url,
          size: result.bytes || buffer.length,
        });
      }
    );
    stream.end(buffer);
  });
}

export const MAX_ATTACHMENT_SIZE_MB = MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024;
