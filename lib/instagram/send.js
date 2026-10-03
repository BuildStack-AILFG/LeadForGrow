import Business from '@/models/Business';
import { decryptMaybe } from '@/lib/encryption';
import { metaErrorText, describeMetaError } from '@/lib/social/metaErrors';

/** The account's Instagram access token (decrypted), or undefined. */
export function getInstagramToken(business) {
  // Deliberately disconnected: never fall back to another stored token.
  if (business.integrationCredentials?.instagram?.disconnectedAt) return '';
  return decryptMaybe(business.integrationCredentials?.instagram?.accessToken
    || business.integrationCredentials?.facebookAds?.accessToken
    || business.integrationCredentials?.facebookAds?.pageAccessToken);
}

/** English-only error text ("… (Meta code 190/463)"); see lib/social/metaErrors.js. */
function metaError(data, fallback) {
  return metaErrorText(data, { channel: 'instagram', fallback });
}

/** Failure result for send functions: English text plus the machine-readable kind/code that lib/social/sendSafety.js acts on. */
function metaFail(data, fallback) {
  const d = describeMetaError(data, { channel: 'instagram', fallback });
  return { success: false, error: d.message, kind: d.kind, retry: d.retry, code: d.code, subcode: d.subcode };
}

/**
 * List the account's recent posts/reels (newest first) so a comment automation
 * can be attached to one via a thumbnail picker instead of a pasted Media ID.
 * Needs the instagram_business_basic permission.
 */
export async function listInstagramMedia(business, { limit = 24 } = {}) {
  const token = getInstagramToken(business);
  if (!token) return { success: false, error: 'Instagram not configured', posts: [] };

  const fields = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';
  try {
    const res = await fetch(`https://graph.instagram.com/v21.0/me/media?fields=${fields}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: metaError(data, 'Could not load posts'), code: data.error?.code, posts: [] };
    const posts = (data.data || []).map((m) => ({
      id: m.id,
      caption: (m.caption || '').slice(0, 140),
      thumbnail: m.media_type === 'VIDEO' ? (m.thumbnail_url || null) : (m.media_url || m.thumbnail_url || null),
      permalink: m.permalink || null,
      timestamp: m.timestamp || null,
      type: m.media_product_type === 'REELS' ? 'reel' : m.media_type === 'VIDEO' ? 'video' : 'post',
    }));
    return { success: true, posts };
  } catch (err) {
    return { success: false, error: err.message, posts: [] };
  }
}

/**
 * Fetch a commenter/sender's Instagram profile (name + username) by their
 * Instagram-scoped ID (IGSID). The DM webhook only carries sender.id, so we
 * look up the handle here to show a real name instead of "Instagram User".
 * Best-effort — returns null on any failure so callers keep working.
 */
export async function getInstagramUserProfile(business, igsid) {
  const token = getInstagramToken(business);
  if (!token || !igsid) return null;
  try {
    const url = `https://graph.instagram.com/v21.0/${igsid}?fields=name,username&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return null;
    return { name: data.name || null, username: data.username || null };
  } catch {
    return null;
  }
}

/**
 * Send Instagram DM via Meta Graph API
 */
export async function sendInstagramMessage(business, recipientId, text) {
  const igUserId = business.integrationCredentials?.instagram?.pageId
    || business.integrationCredentials?.instagram?.igUserId
    || business.integrationCredentials?.facebookAds?.pageId;
  const token = getInstagramToken(business);

  if (!igUserId || !token || !recipientId) {
    return { success: false, error: 'Instagram not configured' };
  }

  // Instagram API with Instagram Login uses the graph.instagram.com host.
  const url = `https://graph.instagram.com/v21.0/${igUserId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    // Meta's error code stays in the message so the cause (expired token, missing
    // permission, outside the 24h window, …) is diagnosable from the inbox toast.
    return metaFail(data, 'Instagram send failed');
  }

  return { success: true, messageId: data.message_id };
}

export async function sendInstagramMedia(business, recipientId, { mediaUrl, messageType }) {
  const igUserId = business.integrationCredentials?.instagram?.pageId
    || business.integrationCredentials?.instagram?.igUserId
    || business.integrationCredentials?.facebookAds?.pageId;
  const token = getInstagramToken(business);

  if (!igUserId || !token || !recipientId) {
    return { success: false, error: 'Instagram not configured' };
  }

  const attachmentType = messageType === 'video' ? 'video' : 'image';
  const url = `https://graph.instagram.com/v21.0/${igUserId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: attachmentType,
          payload: { url: mediaUrl },
        },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return metaFail(data, 'Instagram media send failed');
  }

  return { success: true, messageId: data.message_id };
}

/**
 * Private reply — DM the person who left a comment, using the comment id as the
 * recipient. This is the only way to message a commenter who has not messaged
 * the account first (a plain recipient.id send only works inside the 24h window
 * after the user's own message). Meta allows ONE private reply per comment,
 * within 7 days of the comment.
 * Docs: instagram-platform → messaging-api → private-replies
 */
export async function sendInstagramPrivateReply(business, commentId, text) {
  const igUserId = business.integrationCredentials?.instagram?.pageId
    || business.integrationCredentials?.instagram?.igUserId
    || business.integrationCredentials?.facebookAds?.pageId;
  const token = getInstagramToken(business);

  if (!igUserId || !token || !commentId || !text?.trim()) {
    return { success: false, error: 'Instagram not configured or missing comment id / text' };
  }

  const res = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text: text.trim() },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return metaFail(data, 'Instagram private reply failed');
  }
  return { success: true, messageId: data.message_id };
}

/**
 * Post a public reply to an Instagram comment via Graph API.
 * Reply becomes a nested comment on the same post, attributed to the
 * page's IG business account.
 *
 * Meta endpoint: POST /{comment_id}/replies?message=...&access_token=...
 * Docs: https://developers.facebook.com/docs/instagram-api/reference/ig-comment/replies
 */
export async function sendInstagramCommentReply(business, commentId, text) {
  const token = getInstagramToken(business);

  if (!token || !commentId || !text?.trim()) {
    return { success: false, error: 'Instagram not configured or missing comment id / text' };
  }

  const url = `https://graph.instagram.com/v21.0/${commentId}/replies`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: text.trim() }),
  });

  const data = await res.json();
  if (!res.ok) {
    return metaFail(data, 'Instagram comment reply failed');
  }

  return { success: true, messageId: data.id };
}

export default { sendInstagramMessage, sendInstagramMedia, sendInstagramCommentReply, sendInstagramPrivateReply, listInstagramMedia };
