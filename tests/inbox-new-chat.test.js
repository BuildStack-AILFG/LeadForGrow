/**
 * "Start new chat" opens a virtual chat in the normal inbox layout (template picker as the composer), and any team member
 * can be assigned from a conversation row.
 * Run: node --test tests/inbox-new-chat.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let N, React, renderToStaticMarkup, Assign, Item, Bar;
before(async () => {
  N = await import('../lib/omnichannel/newChat.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: Assign } = await import('../app/automation/components/chat/AssignMenu.jsx'));
  ({ default: Item } = await import('../app/automation/components/chat/ConversationItem.jsx'));
  ({ default: Bar } = await import('../app/automation/components/chat/OutOfWindowTemplateBar.jsx'));
});

describe('virtual new chat', () => {
  const lead = { _id: 'L1', name: 'Preetiahuja', phone: '9986030563', status: 'contacted' };

  it('is built from the lead, on WhatsApp, and recognisable', () => {
    const chat = N.makeNewChat(lead);
    assert.equal(chat._id, 'temp_new_L1');
    assert.equal(chat.channel, 'whatsapp');
    assert.equal(chat.leadId._id, 'L1');
    assert.equal(chat.leadId.name, 'Preetiahuja');
    assert.equal(chat.participantPhone, '9986030563');
    assert.equal(N.isNewChat(chat), true);
  });

  it('uses the "temp_" id prefix the inbox hook already understands as "no conversation record yet"', () => {
    assert.ok(N.makeNewChat(lead)._id.startsWith('temp_'));
    const hook = read('app/automation/hooks/useChatInbox.js');
    assert.ok(hook.includes("startsWith('temp_')"));
  });

  it('a real conversation, an empty value and a look-alike are not new chats', () => {
    assert.equal(N.isNewChat({ _id: 'abc123', isNew: true }), false);
    assert.equal(N.isNewChat({ _id: 'temp_new_L1' }), false, 'needs the flag too');
    assert.equal(N.isNewChat(null), false);
    assert.equal(N.isNewChat(undefined), false);
  });

  it('the composer for it is the template picker with the first-message wording', () => {
    const out = renderToStaticMarkup(React.createElement(Bar, { firstContact: true, leadName: 'Preetiahuja', lead, onSend() {} }));
    assert.ok(out.includes('First message on WhatsApp') && out.includes('to start a conversation.'));
  });
});

describe('the inbox page runs a new chat', () => {
  const page = read('app/automation/chat/page.js');

  it('opens it from the search result instead of a modal', () => {
    assert.ok(page.includes('inbox.selectChat(makeNewChat(lead))'));
    assert.ok(page.includes("import { makeNewChat, isNewChat } from '@/lib/omnichannel/newChat';"));
  });

  it('needs no take-over: the composer shows the template picker for it', () => {
    assert.ok(/const canReply =\s*\n\s*newChat \? true/.test(page));
    assert.ok(page.includes('firstContact={newChat}'));
    assert.ok(page.includes('Send an approved template below to start the conversation.'));
  });

  it('after the first template it switches to the REAL conversation, asked from the server (it is not in the list view)', () => {
    assert.ok(page.includes('const conversation = await findLeadConversation(lead);') && page.includes('inbox.selectChat(conversation)'));
    assert.ok(page.includes('/api/automation/inbox/search?type=leads&q='));
  });

  it('a failed send is an error, never a success toast', () => {
    assert.ok(page.includes("if (ok === false) throw new Error('Could not send the template');"));
  });

  it('the header does not offer Intervene for a chat that does not exist yet', () => {
    assert.ok(read('app/automation/components/chat/ChatHeader.jsx').includes("!isIntervened && !chat.isNew"));
  });
});

describe('assigning a new chat (no conversation record) goes to the lead', () => {
  const hook = read('app/automation/hooks/useChatInbox.js');
  it('assign and claim use the lead PUT for a new chat, and the conversation route otherwise', () => {
    assert.ok(hook.includes('const assignNewChatLead = useCallback'));
    assert.ok(hook.includes('`/api/automation/leads/${chat.leadId._id}`') && hook.includes("method: 'PUT'"));
    assert.ok(/if \(isNewChat\(selectedChat\)\) \{\s*\n\s*try \{ await assignNewChatLead\(selectedChat, assigneeId\)/.test(hook));
    assert.ok(/if \(isNewChat\(selectedChat\)\) \{\s*\n\s*try \{ await assignNewChatLead\(selectedChat, getUserId\(\)\)/.test(hook));
  });
});

describe('Assign to: any team member from a row', () => {
  const team = [
    { userId: { _id: 'u1', firstName: 'Me', lastName: 'Owner' } },
    { userId: { _id: 'u2', firstName: 'Saif', lastName: 'Abdul' } },
  ];
  const html = (props) => renderToStaticMarkup(React.createElement(Assign, { chat: { _id: 'c1' }, teamMembers: team, currentUserId: 'u1', ...props }));

  it('renders a split button: one click for yourself, a chevron for the team', () => {
    const out = html();
    assert.ok(out.includes('Assign to me') && out.includes('aria-label="Assign to a team member"'));
    assert.ok(out.includes('data-row-action="assign"'));
    assert.ok(out.includes('aria-expanded="false"'), 'closed by default; the menu is portalled only when open');
  });

  it('the menu is portalled to the body with fixed positioning (the list scrolls and would clip it)', () => {
    const src = read('app/automation/components/chat/AssignMenu.jsx');
    assert.ok(src.includes('createPortal(') && src.includes("position: 'fixed'") && src.includes('document.body'));
    assert.ok(src.includes("window.addEventListener('scroll', close, true)") && src.includes("e.key === 'Escape'"));
    assert.ok(src.includes('String(m.id) !== String(currentUserId)'), 'you are not listed twice');
  });

  it('is dark-mode paired', () => {
    assert.ok(html().includes('bg-white dark:bg-slate-900'));
  });

  it('shows on Unassigned rows only, next to Done, and is wired through the list to the hook', () => {
    const chat = { _id: 'c1', channel: 'whatsapp', status: 'open', lastMessageDirection: 'incoming', lastInboundAt: new Date().toISOString(), lastMessageAt: new Date().toISOString(), lastMessagePreview: 'hi', leadId: { name: 'Riya' } };
    const on = renderToStaticMarkup(React.createElement(Item, { chat, active: false, onClick() {}, onDone() {}, onAssignToMe() {}, onAssignTo() {}, teamMembers: team, currentUserId: 'u1', showAssignToMe: true }));
    assert.ok(on.includes('Assign to me') && on.includes('data-row-action="done"'));
    const off = renderToStaticMarkup(React.createElement(Item, { chat, active: false, onClick() {}, onDone() {}, onAssignToMe() {}, onAssignTo() {}, teamMembers: team, currentUserId: 'u1' }));
    assert.ok(!off.includes('Assign to me'));
    const side = read('app/automation/components/chat/ChatSidebar.jsx');
    assert.ok(side.includes('onAssignTo={onAssignTo}') && side.includes('teamMembers={teamMembers}') && side.includes('currentUserId={currentUserId}'));
    const page = read('app/automation/chat/page.js');
    assert.ok(page.includes('onAssignTo={inbox.assignTo}') && page.includes('teamMembers={inbox.teamMembers}') && page.includes('currentUserId={inbox.currentUserId}'));
    assert.ok(/assignTo,\s*\n\s*realtimeConnected/.test(read('app/automation/hooks/useChatInbox.js')), 'assignTo is returned by the hook');
  });

  it('assignTo posts assignedTo to the conversation assign route and refreshes the queue and counts', () => {
    const hook = read('app/automation/hooks/useChatInbox.js');
    assert.ok(hook.includes('const assignTo = useCallback'));
    assert.ok(hook.includes('body: JSON.stringify({ assignedTo: assigneeId })'));
    assert.ok(hook.includes("toast.success(name ? `Assigned to ${name}` : 'Conversation assigned')"));
  });
});
