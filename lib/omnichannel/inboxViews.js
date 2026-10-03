/**
 * Inbox "queues": the few views a team member opens the inbox for (pure: no DB, no React, so they can be tested).
 *
 *  - needs_reply : the customer spoke last and nobody answered (open, not muted, not a newsletter). Longest waiting first.
 *  - mine        : conversations that belong to me
 *  - unassigned  : conversations nobody owns
 *  - taken_over  : a team member took the conversation over from the bot
 *
 * "Belongs to" = the conversation's assignee, else the lead's assignee. Both exist: an agent assigned in the Inbox sets
 * the conversation, while auto-assignment of a new lead only sets the lead.
 */
import { automatedAddressRegexSource } from './automatedSender.js';

export const SERVER_VIEWS = ['needs_reply', 'mine', 'unassigned', 'taken_over'];
export const isServerView = (v) => SERVER_VIEWS.includes(v);

/** Roles that supervise the whole inbox (owner / admin / manager); everyone else is an agent working their own queue. */
export function isManagerRole(role) {
  const r = String(role || '').toLowerCase();
  return ['owner', 'super', 'super_admin', 'agency_owner'].includes(r) || r.includes('admin') || r.includes('manager');
}

/** Which view opens first: the manager sees who is waiting (and what nobody owns), an agent sees their own work. */
export function defaultInboxView(role) {
  return isManagerRole(role) ? 'needs_reply' : 'mine';
}

/** Which lead-id lists the view needs (loaded only when needed, so the other views cost nothing extra). */
export function leadListsNeeded(view) {
  return {
    mine: view === 'mine',
    unassigned: view === 'unassigned',
    // Queues where nobody can act on a conversation whose lead was deleted (the send route needs the lead).
    existing: view === 'needs_reply' || view === 'taken_over',
  };
}

/**
 * Mongo clauses (to AND together) and the sort order for a view.
 * `userId` = the current user, `myLeadIds` = leads assigned to them, `unassignedLeadIds` = leads nobody owns.
 */
export function viewClauses(view, { userId, myLeadIds = [], unassignedLeadIds = [], existingLeadIds = null } = {}) {
  // A conversation whose lead was deleted cannot be answered, so it must not sit in a queue as a customer "waiting".
  const leadStillExists = Array.isArray(existingLeadIds)
    ? [{ $or: [{ leadId: null }, { leadId: { $in: existingLeadIds } }] }]
    : [];
  switch (view) {
    case 'needs_reply':
      return {
        clauses: [
          { status: { $nin: ['closed', 'spam', 'archived'] } },
          { lastMessageDirection: 'incoming' },
          // A newsletter / no-reply sender cannot be answered (same rule as the red waiting badge).
          { participantEmail: { $not: new RegExp(automatedAddressRegexSource(), 'i') } },
          ...leadStillExists,
        ],
        sort: { lastMessageAt: 1 }, // the customer who has waited longest first
      };
    case 'mine':
      return {
        clauses: [{ $or: [{ assignedTo: userId }, { assignedTo: null, leadId: { $in: myLeadIds } }] }],
        sort: null,
      };
    case 'unassigned':
      return {
        clauses: [{ assignedTo: null }, { $or: [{ leadId: null }, { leadId: { $in: unassignedLeadIds } }] }],
        sort: null,
      };
    case 'taken_over':
      return { clauses: [{ inboxStatus: 'intervened' }, ...leadStillExists], sort: null };
    default:
      return { clauses: [], sort: null };
  }
}
