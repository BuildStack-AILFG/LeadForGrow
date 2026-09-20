import { decryptMaybe } from '@/lib/encryption';
import { metaErrorText, describeMetaError } from '@/lib/social/metaErrors';

const metaError = (data, fallback) => metaErrorText(data, { channel: 'facebook', fallback });

/** Failure result for send functions: English text plus the machine-readable kind/code that lib/social/sendSafety.js acts on. */
function metaFail(data, fallback) {
  const d = describeMetaError(data, { channel: 'facebook', fallback });
  return { success: false, error: d.message, kind: d.kind, retry: d.retry, code: d.code, subcode: d.subcode };
}

/**
 * Facebook Page — Messenger DMs + comment replies via Meta Graph API.
 *
 * Mirrors lib/instagram/send.js, but Facebook uses the graph.facebook.com host
 * and a Page Access Token. Credentials live on
 * business.integrationCredentials.facebook (falls back to the lead-ads
 * facebookAds block so a page already connected for ads works without re-entry).
 */

const GRAPH = 'https://graph.facebook.com/v21.0';

function getPageCreds(business) {
  const fb = business.integrationCredentials?.facebook || {};
  const ads = business.integrationCredentials?.facebookAds || {};
  const pageId = fb.pageId || ads.pageId;
  const token = decryptMaybe(fb.accessToken || ads.accessToken || ads.pageAccessToken);
  return { pageId, token };
}

/**
 * Send a Messenger DM to a user (recipientId = the PSID from the webhook).
 */
export async function sendMessengerMessage(business, recipientId, text) {
  const { pageId, token } = getPageCreds(business);
  if (!pageId || !token || !recipientId) {
    return { success: false, error: 'Facebook not configured' };
  }

  const url = `${GRAPH}/${pageId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return metaFail(data, 'Messenger send failed');
  }
  return { success: true, messageId: data.message_id };
}

/**
 * Send Messenger media (image/video) by URL.
 */
export async function sendMessengerMedia(business, recipientId, { mediaUrl, messageType }) {
  const { pageId, token } = getPageCreds(business);
  if (!pageId || !token || !recipientId || !mediaUrl) {
    return { success: false, error: 'Facebook not configured' };
  }

  const attachmentType = messageType === 'video' ? 'video' : 'image';
  const url = `${GRAPH}/${pageId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: {
        attachment: { type: attachmentType, payload: { url: mediaUrl, is_reusable: true } },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return metaFail(data, 'Messenger media send failed');
  }
  return { success: true, messageId: data.message_id };
}

/**
 * Post a public reply under a Facebook comment (nested comment on the post).
 * Meta endpoint: POST /{comment_id}/comments
 */
export async function sendFacebookCommentReply(business, commentId, text) {
  const { token } = getPageCreds(business);
  if (!token || !commentId || !text?.trim()) {
    return { success: false, error: 'Facebook not configured or missing comment id / text' };
  }

  const url = `${GRAPH}/${commentId}/comments`;
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
    return metaFail(data, 'Facebook comment reply failed');
  }
  return { success: true, messageId: data.id };
}

/**
 * Private reply — DM the person who left a comment, using the comment id as the
 * recipient. Facebook allows exactly one private reply per comment, within the
 * messaging window. This is the FB equivalent of IG's comment→DM.
 * Meta endpoint: POST /{page_id}/messages  recipient={comment_id}
 */
export async function sendFacebookPrivateReply(business, commentId, text) {
  const { pageId, token } = getPageCreds(business);
  if (!pageId || !token || !commentId || !text?.trim()) {
    return { success: false, error: 'Facebook not configured or missing comment id / text' };
  }

  const url = `${GRAPH}/${pageId}/messages`;
  const res = await fetch(url, {
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
    return metaFail(data, 'Facebook private reply failed');
  }
  return { success: true, messageId: data.message_id };
}

/**
 * List the Page's recent posts (newest first) for the comment-automation post
 * picker. Needs pages_read_engagement on the Page token.
 */
export async function listFacebookPosts(business, { limit = 24 } = {}) {
  const { pageId, token } = getPageCreds(business);
  if (!pageId || !token) return { success: false, error: 'Facebook not configured', posts: [] };

  const fields = 'id,message,full_picture,permalink_url,created_time';
  try {
    const res = await fetch(`${GRAPH}/${pageId}/posts?fields=${fields}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: metaError(data, 'Could not load posts'), code: data.error?.code, posts: [] };
    }
    const posts = (data.data || []).map((p) => ({
      id: p.id,
      caption: (p.message || '').slice(0, 140),
      thumbnail: p.full_picture || null,
      permalink: p.permalink_url || null,
      timestamp: p.created_time || null,
      type: 'post',
    }));
    return { success: true, posts };
  } catch (err) {
    return { success: false, error: err.message, posts: [] };
  }
}

export default {
  listFacebookPosts,
  sendMessengerMessage,
  sendMessengerMedia,
  sendFacebookCommentReply,
  sendFacebookPrivateReply,
};
