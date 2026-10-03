/**
 * Disconnecting Instagram, for an owner who wants their account back as a normal Instagram account.
 *
 * What it does (the caller saves the document):
 *  1. asks Meta to stop sending events for the account (best effort; a failure never blocks the disconnect)
 *  2. clears the connection: page id, IG user id, username, access token, picture, sync timestamps; enabled = false
 *  3. stamps disconnectedAt, so getInstagramToken() returns nothing and no fallback token (facebookAds) can be used
 *
 * What it deliberately keeps: leads, conversations and messages (the customer's data), and the saved automation
 * rules / AI switch / "create a lead from" mode (they can't run without a connection and are there if the owner
 * reconnects). Meta has no API to revoke the token itself, so a full revoke is also done from the Instagram app
 * (Settings > Apps and websites) — the UI says so when Meta could not be told to stop the events.
 */
import { disableSubscriptions } from '@/lib/instagram/subscriptions';

const CLEARED = ['pageId', 'igUserId', 'username', 'accessToken', 'profilePicture', 'lastSyncAt', 'lastVerified'];

export async function disconnectInstagram(business, { disable = disableSubscriptions } = {}) {
  const creds = business.integrationCredentials?.instagram;
  const hadToken = Boolean(creds?.accessToken);
  const keptRules = (creds?.commentAutomations || []).length;

  let webhook = { attempted: false, success: false };
  if (hadToken) {
    const r = await Promise.resolve(disable(business)).catch((err) => ({ success: false, error: err.message }));
    webhook = { attempted: true, success: Boolean(r?.success), ...(r?.error ? { error: r.error } : {}) };
  }

  const path = 'integrationCredentials.instagram';
  business.set(`${path}.enabled`, false);
  for (const key of CLEARED) business.set(`${path}.${key}`, null);
  business.set(`${path}.webhookStatus`, 'pending');
  business.set(`${path}.disconnectedAt`, new Date());

  return { webhook, keptRules };
}

export default { disconnectInstagram };
