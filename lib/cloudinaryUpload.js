'use client';

import { authFetch } from '@/lib/apiClient';

/**
 * Upload an image straight from the browser to Cloudinary using a signature
 * from our server, so the file never passes through our origin. Returns the
 * public https URL (safe to use in emails).
 */
export async function uploadImageToCloudinary(file) {
  const signRes = await authFetch('/api/cloudinary-sign', { method: 'POST' });
  const sign = await signRes.json();
  if (!signRes.ok || !sign.success) {
    throw new Error(
      sign.error?.includes('CLOUDINARY')
        ? 'Cloudinary credentials missing on the server. Ask an admin to add them.'
        : sign.error || 'Could not sign upload'
    );
  }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sign.apiKey);
  fd.append('timestamp', sign.timestamp);
  fd.append('signature', sign.signature);
  if (sign.folder) fd.append('folder', sign.folder);

  const cdnRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: 'POST', body: fd }
  );
  const cdnData = await cdnRes.json();
  if (!cdnRes.ok || !cdnData.secure_url) {
    throw new Error(cdnData.error?.message || 'Cloudinary upload failed');
  }
  return cdnData.secure_url;
}
