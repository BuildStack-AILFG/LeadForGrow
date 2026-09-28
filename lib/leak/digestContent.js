/**
 * Leak Radar daily brief — the five lines an owner reads (pure, unit tested).
 *
 *   1. leaked yesterday   2. still at risk   3. recovered yesterday
 *   4. who needs help     5. one thing to do now
 */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * @param {object} d
 * @param {string} d.businessName
 * @param {number} d.newYesterday      leaks detected yesterday (shown ones)
 * @param {number} d.openNow           open leaks now
 * @param {number|null} d.atRisk       estimated value at risk (null when the owner gave no numbers)
 * @param {number} d.recoveredYesterday leaks resolved yesterday after someone acted
 * @param {{ name: string, open: number }|null} d.topRep
 * @param {{ leadName: string, reason: string }|null} d.topLeak
 * @param {string} d.url               Leak Radar link
 */
export function digestContent(d) {
  const lines = [
    d.newYesterday
      ? `${plural(d.newYesterday, 'enquiry', 'enquiries')} started slipping yesterday.`
      : 'No new enquiries slipped yesterday.',
    d.openNow
      ? `${plural(d.openNow, 'enquiry', 'enquiries')} still need attention${d.atRisk ? ` (about ${inr(d.atRisk)} at risk, an estimate)` : ''}.`
      : 'Nothing is waiting on your team right now.',
    d.recoveredYesterday
      ? `${plural(d.recoveredYesterday, 'enquiry', 'enquiries')} handled by your team yesterday.`
      : 'No enquiries were handled yesterday.',
    d.topRep && d.topRep.open > 0
      ? `${d.topRep.name} has the most open (${d.topRep.open}); they may need a hand.`
      : 'No salesperson is falling behind.',
    d.topLeak
      ? `Start with ${d.topLeak.leadName}: ${d.topLeak.reason}`
      : 'Nothing urgent to start with.',
  ];
  const subject = d.openNow
    ? `${d.businessName}: ${plural(d.openNow, 'enquiry', 'enquiries')} slipping`
    : `${d.businessName}: no enquiries slipping`;

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">
<tr><td style="padding:22px 24px 8px"><p style="margin:0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#0d9488;font-weight:bold">Leak Radar · daily brief</p>
<p style="margin:6px 0 0;font-size:18px;font-weight:bold">${esc(d.businessName)}</p></td></tr>
<tr><td style="padding:8px 24px 4px"><ol style="margin:0;padding-left:20px;font-size:15px;line-height:1.6">
${lines.map((l) => `<li style="margin:0 0 6px">${esc(l)}</li>`).join('\n')}
</ol></td></tr>
<tr><td style="padding:12px 24px 24px"><a href="${esc(d.url)}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 18px;border-radius:8px">Open Leak Radar</a></td></tr>
</table>
<p style="font-size:11px;color:#94a3b8;margin:12px 0 0">You get this because Leak Radar is on. Turn the brief off in Leak Radar → Settings.</p>
</td></tr></table></body></html>`;

  return { subject, lines, html, text: `${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\nOpen Leak Radar: ${d.url}` };
}

/** Has today's brief (in the business's time zone) already gone out? */
export function digestDueToday(lastSentAt, now, tzOffsetMinutes = 330, sendHour = 8) {
  const off = tzOffsetMinutes * 60 * 1000;
  const local = new Date(now.getTime() + off);
  if (local.getUTCHours() < sendHour) return false;
  if (!lastSentAt) return true;
  const last = new Date(new Date(lastSentAt).getTime() + off);
  return last.toISOString().slice(0, 10) !== local.toISOString().slice(0, 10);
}
