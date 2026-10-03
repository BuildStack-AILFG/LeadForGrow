/**
 * Automations default new follow-up tasks to type "call". A call task is impossible for a lead with no phone number
 * (typical for Instagram / Messenger leads), so it would sit in the task list as something nobody can do.
 *
 * pickTaskTypeForLead keeps 'call' when the lead has a phone; otherwise 'email' when it has an email address,
 * else the generic 'follow_up'. Any type other than 'call' is returned unchanged.
 */
export function pickTaskTypeForLead(type, lead) {
  if (type !== 'call' || !lead) return type;
  if (String(lead.phone || '').replace(/\D/g, '')) return type;
  return lead.email ? 'email' : 'follow_up';
}

export default { pickTaskTypeForLead };
