'use client';

import { memo } from 'react';
import {
  Pin, Star, Mail,
  ArrowLeft, ArrowRight,
  FileText, Image as ImageIcon, Mic, Video, MapPin, Phone,
  Check, CheckCheck, Clock,
} from 'lucide-react';
import { WhatsAppIcon, InstagramIcon } from './BrandIcons';

const CHANNEL_ICON = {
  whatsapp: WhatsAppIcon,
  email: Mail,
  instagram: InstagramIcon,
};

const CHANNEL_ICON_COLOR = {
  whatsapp: 'text-[#25D366]',        // official WhatsApp brand green
  email: 'text-violet-600',
  instagram: 'text-[#E1306C]',       // official Instagram brand pink
};

// Stable per-name color for avatar backgrounds — feels alive without being random
const AVATAR_TONES = [
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', fg: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-teal-100 dark:bg-teal-900/40',       fg: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-violet-100 dark:bg-violet-900/40',   fg: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40',     fg: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40',       fg: 'text-pink-700 dark:text-pink-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/40',       fg: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40',   fg: 'text-indigo-700 dark:text-indigo-300' },
];
function toneForName(name) {
  const s = String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Choose which icon + label prefix to show in front of the message preview.
 *
 * If the recipient has replied at any point, prefer their latest reply — a
 * broadcast on top otherwise makes every row look identical and buries real
 * engagement. When we do fall back to the outbound (broadcast) preview, tag
 * it "You: …" so it's clear that's your side of the conversation.
 */
function messagePreviewMeta(chat) {
  const rawOutbound = String(chat.lastMessagePreview || '').trim();

  // If the most recent activity was OUR outbound send but the customer has
  // replied before, surface the customer's reply instead. That reply is what
  // an agent actually needs to see and act on.
  const outboundIsLatest = chat.lastMessageDirection === 'outgoing';
  const hasInbound = !!chat.lastInboundPreview;
  const showInbound = hasInbound && outboundIsLatest;

  const preview = showInbound
    ? String(chat.lastInboundPreview || '').trim()
    : rawOutbound;
  const previewIsInbound = showInbound || chat.lastMessageDirection === 'incoming';

  if (/^\[Template[:\s]/i.test(preview) || /Automated message sent/i.test(preview)) {
    const m = preview.match(/\[Template[:\s]+([^\]]+)\]/i);
    const name = m ? m[1].trim() : 'message';
    return { Icon: FileText, label: `You: Template · ${name}`, isInboundPreview: false };
  }
  const t = (chat.lastMessageType || '').toLowerCase();
  const prefix = previewIsInbound ? '' : 'You: ';
  if (t === 'image')    return { Icon: ImageIcon, label: (prefix + (preview || 'Photo')), isInboundPreview: previewIsInbound };
  if (t === 'video')    return { Icon: Video,     label: (prefix + (preview || 'Video')), isInboundPreview: previewIsInbound };
  if (t === 'audio' || t === 'voice') return { Icon: Mic, label: (prefix + (preview || 'Voice message')), isInboundPreview: previewIsInbound };
  if (t === 'document') return { Icon: FileText,  label: (prefix + (preview || 'Document')), isInboundPreview: previewIsInbound };
  if (t === 'location') return { Icon: MapPin,    label: (prefix + (preview || 'Location')), isInboundPreview: previewIsInbound };
  if (t === 'contacts') return { Icon: Phone,     label: (prefix + (preview || 'Contact card')), isInboundPreview: previewIsInbound };

  if (!preview) return { Icon: null, label: 'No messages yet', isInboundPreview: false };
  return { Icon: null, label: previewIsInbound ? preview : `You: ${preview}`, isInboundPreview: previewIsInbound };
}

function ConversationItem({ chat, active, onClick }) {
  const lead = chat.leadId || {};
  const unread = chat.unreadCount > 0 || chat.inboxStatus === 'unread' || chat.status === 'unread';
  const displayName = lead.name || chat.participantName || lead.phone || chat.participantEmail || 'Unknown';
  const channel = chat.channel || 'whatsapp';
  const ChannelIcon = CHANNEL_ICON[channel] || WhatsAppIcon;
  const channelClass = CHANNEL_ICON_COLOR[channel] || 'text-emerald-600';

  const { Icon: PreviewIcon, label: previewLabel, isInboundPreview } = messagePreviewMeta(chat);
  // Direction arrow reflects the preview we're actually rendering, not the
  // literal last message — otherwise the arrow disagrees with the label
  // whenever we surface an older inbound reply over a fresh outbound send.
  const showingOutgoing = !isInboundPreview;

  const tone = toneForName(displayName);
  const intervened = chat.status === 'intervened' || chat.inboxStatus === 'intervened';

  // SLA badge: how long has the customer been waiting for a human reply?
  // Only shown when the LAST message was inbound (they're waiting on us)
  // and no human has replied since. Buckets escalate visually — grey <1h,
  // amber 1-4h, red >4h — so agents can prioritize at a glance.
  let waitingBadge = null;
  if (chat.lastMessageDirection === 'incoming' && chat.lastInboundAt) {
    const waitMs = Date.now() - new Date(chat.lastInboundAt).getTime();
    const waitH = waitMs / (60 * 60 * 1000);
    if (waitH >= 0.25) {  // Only show after 15 min — before that it's just "recent"
      let label, cls;
      if (waitH < 1) { label = `${Math.round(waitH * 60)}m`; cls = 'bg-slate-100 text-slate-600'; }
      else if (waitH < 4) { label = `${Math.round(waitH)}h`; cls = 'bg-amber-100 text-amber-700'; }
      else if (waitH < 24) { label = `${Math.round(waitH)}h`; cls = 'bg-rose-100 text-rose-700'; }
      else { label = `${Math.round(waitH / 24)}d`; cls = 'bg-rose-200 text-rose-800'; }
      waitingBadge = { label, cls };
    }
  }

  // Delivery status icon only makes sense when the preview is our outbound
  // message. Hide it entirely when we've surfaced a customer reply.
  let DeliveryIcon = null;
  let deliveryClass = '';
  if (showingOutgoing) {
    const s = String(chat.lastMessageStatus || '').toLowerCase();
    if (s === 'read')          { DeliveryIcon = CheckCheck; deliveryClass = 'text-teal-500'; }
    else if (s === 'delivered'){ DeliveryIcon = CheckCheck; deliveryClass = unread ? 'text-slate-500' : 'text-slate-400'; }
    else if (s === 'sent' || s === 'accepted') { DeliveryIcon = Check; deliveryClass = unread ? 'text-slate-500' : 'text-slate-400'; }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left flex items-center gap-3 pl-2 pr-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 border-l-[3px] transition-colors ${
        active
          ? 'bg-teal-50/60 dark:bg-teal-950/30 border-l-teal-600'
          : unread
            ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-l-emerald-500 hover:bg-emerald-50/60'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-transparent'
      }`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full ${tone.bg} ${tone.fg} flex items-center justify-center text-sm font-semibold`}>
        {displayName.charAt(0)?.toUpperCase() || '?'}
      </div>

      <div className="flex-1 min-w-0">
        {/* Row 1 — name + right rail (pin, channel icon, time, unread count) */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] truncate ${unread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-normal text-slate-600 dark:text-slate-400'}`}>
            {displayName}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {chat.isPinned && <Pin className="w-3 h-3 text-teal-500" />}
            {chat.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
            {intervened && (
              <span className="text-[9px] font-bold px-1.5 py-[1px] rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 uppercase tracking-wide">Live</span>
            )}
            {waitingBadge && (
              <span
                title="Waiting for reply"
                className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-[1px] rounded-full ${waitingBadge.cls}`}
              >
                <Clock className="w-2.5 h-2.5" />
                {waitingBadge.label}
              </span>
            )}
            <ChannelIcon className={`w-3 h-3 ${unread ? channelClass : 'text-slate-400'}`} />
            <span className={`text-[11px] tabular-nums ${unread ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>
              {formatTime(chat.lastMessageAt)}
            </span>
            {unread && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                {chat.unreadCount || 1}
              </span>
            )}
          </div>
        </div>

        {/* Row 2 — direction arrow · type icon · delivery tick · preview */}
        <div className="flex items-center gap-1 mt-0.5 min-w-0">
          {isInboundPreview ? (
            <ArrowLeft className={`w-3 h-3 flex-shrink-0 ${unread ? 'text-emerald-600' : 'text-slate-400'}`} />
          ) : (
            <ArrowRight className="w-3 h-3 flex-shrink-0 text-slate-400" />
          )}
          {DeliveryIcon && (
            <DeliveryIcon className={`w-3 h-3 flex-shrink-0 ${deliveryClass}`} />
          )}
          {PreviewIcon && (
            <PreviewIcon className={`w-3 h-3 flex-shrink-0 ${unread ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`} />
          )}
          <span className={`text-[12px] truncate ${unread ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
            {previewLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

export default memo(ConversationItem);
