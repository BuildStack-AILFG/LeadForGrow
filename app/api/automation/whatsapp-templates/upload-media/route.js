import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import Integration from '@/models/Integration';
import { withPlanAccess } from '@/lib/accessControl';
import { uploadMediaToMeta } from '@/lib/whatsapp/templates';
import { decryptCredentials } from '@/lib/integrations/credentials';
import { decrypt } from '@/lib/encryption';
import { serverErrorMessage } from '@/lib/api/serverError';

// Meta's documented sample-media limits for template review
const LIMITS = {
  IMAGE: { size: 5 * 1024 * 1024, mime: ['image/jpeg', 'image/png'] },
  VIDEO: { size: 16 * 1024 * 1024, mime: ['video/mp4', 'video/3gpp'] },
  DOCUMENT: { size: 100 * 1024 * 1024, mime: ['application/pdf'] },
};

function classifyMime(mime) {
  if (LIMITS.IMAGE.mime.includes(mime)) return 'IMAGE';
  if (LIMITS.VIDEO.mime.includes(mime)) return 'VIDEO';
  if (LIMITS.DOCUMENT.mime.includes(mime)) return 'DOCUMENT';
  return null;
}

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const format = classifyMime(file.type);
    if (!format) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type ${file.type}. Meta accepts JPEG/PNG for image, MP4/3GP for video, PDF for document.` },
        { status: 400 }
      );
    }

    const limit = LIMITS[format];
    if (file.size > limit.size) {
      return NextResponse.json(
        { success: false, error: `File too large. Meta max for ${format.toLowerCase()}: ${Math.round(limit.size / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    // Resolve credentials from BOTH stores — the modern Integration collection
    // is source of truth, but we fall back to the legacy Business.integrationCredentials
    // for older tenants. Keeps template media upload working even if the
    // Integration↔Business sync misses a field.
    const [integration, business] = await Promise.all([
      Integration.findOne({ businessId: req.user.businessId, integrationId: 'whatsapp-cloud' }),
      Business.findById(req.user.businessId).select('+integrationCredentials'),
    ]);

    const legacy = business?.integrationCredentials?.whatsapp || {};
    const modern = integration?.credentials
      ? decryptCredentials('whatsapp-cloud', integration.credentials.toObject?.() || integration.credentials)
      : {};

    // Prefer modern Integration store; fall back to legacy field names
    const token = modern.accessToken || (legacy.apiKey ? decrypt(legacy.apiKey) : null);
    const appId = modern.appId || legacy.appId;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp access token missing. Configure the integration in Settings → Integrations → WhatsApp Cloud API.' },
        { status: 400 },
      );
    }
    if (!appId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Meta App ID missing. In Settings → Integrations → WhatsApp Cloud API, fill the Meta App ID field and click Save & connect. Value comes from developers.facebook.com → your App → Settings → Basic → App ID.',
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const handle = await uploadMediaToMeta({
      apiKey: token,
      appId,
      buffer,
      mimeType: file.type,
      filename: file.name,
    });

    // Also persist the file publicly so we have a URL to reuse at send-time.
    // Meta's template review handle (4:…) can't be reused for sends — a public
    // URL is the simplest way to make the media reusable per campaign.
    //
    // Strategy: Cloudinary first (works in dev + prod, cross-server, permanent),
    // fall back to local /public/uploads only when Cloudinary isn't configured.
    let publicUrl = null;
    try {
      publicUrl = await persistMediaFile({ buffer, file, businessId: req.user.businessId, req });
    } catch (persistErr) {
      console.warn('[TemplateMediaUpload] Persist failed (upload to Meta still succeeded):', persistErr.message);
    }

    return NextResponse.json({
      success: true,
      handle,
      publicUrl,
      format,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('[TemplateMediaUpload] failed:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

/**
 * Save the uploaded file to a public URL we can reuse when sending broadcasts.
 * Order of preference:
 *  1. Cloudinary — works in every environment (Vercel/serverless included),
 *     multi-server safe, files persist across deploys.
 *  2. Local /public/uploads — dev/single-server fallback only. Files vanish
 *     on redeploy on ephemeral filesystems.
 */
async function persistMediaFile({ buffer, file, businessId, req }) {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const folder = `lfg/${businessId}/whatsapp-templates`;
    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          filename_override: file.name,
          use_filename: true,
          unique_filename: true,
        },
        (err, result) => (err ? reject(err) : resolve(result)),
      ).end(buffer);
    });
    return uploaded.secure_url;
  }

  // Local fallback — dev only
  const { writeFile, mkdir } = await import('fs/promises');
  const path = await import('path');
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `tmpl-${uniqueSuffix}-${safeName}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'templates');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}/uploads/templates/${filename}`;
}

// Next.js App Router: raise the body size cap so 100 MB PDFs don't get sliced
export const runtime = 'nodejs';
export const maxDuration = 60;
