/**
 * Is this email conversation with a machine (newsletter, no-reply, notification, marketing mailer)?
 *
 * Nobody can reply to these, so the inbox must not show a red "6d waiting for reply" badge on them — in a real mailbox that
 * was 40 red pills, mostly Slack / ClickUp newsletters, drowning the customers who actually wait for an answer.
 *
 * Conservative on purpose (a wrong "automated" hides a real customer's badge): only clearly automated local parts and
 * bulk-mail sub-domains match. "support@", "sales@", "hello@", "team@", "info@" are NOT matched — real prospects use them.
 * Email headers (List-Unsubscribe, Precedence: bulk) would be a stronger signal, but inbound mail does not store them yet.
 */

// Unambiguous prefixes: no-reply, do-not-reply, mailer-daemon ...
const AUTOMATED_PREFIX = /^(?:no[-_.]?reply|do[-_.]?not[-_.]?reply|mailer[-_.]?daemon|postmaster|bounces?)/;
// Exact words (optionally "+tag" or trailing digits): "news@", "notifications+abc@", "updates2@"
const AUTOMATED_WORD = /^(?:notifications?|notify|newsletters?|news|updates?|digest|alerts?|marketing|automated|mailer)(?:\+.*|[-_.]?\d+)?$/;
// Bulk-mail sub-domains: em.clickup.com, click.email.slackhq.com, mail.notion.so, news.company.com ...
const BULK_SUBDOMAIN = /^(?:e|em|email|emails|mail|mailer|news|newsletter|click|clicks|links|notify|notifications|send|bounce|mg)\./;

export function isAutomatedSender({ channel, email } = {}) {
  if (channel !== 'email') return false;
  const address = String(email || '').trim().toLowerCase();
  const at = address.lastIndexOf('@');
  if (at < 1) return false;
  const local = address.slice(0, at);
  const domain = address.slice(at + 1);
  return AUTOMATED_PREFIX.test(local) || AUTOMATED_WORD.test(local) || BULK_SUBDOMAIN.test(domain);
}

export default { isAutomatedSender };
