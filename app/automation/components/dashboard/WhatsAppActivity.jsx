'use client';

import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';
import ChartCard from './primitives/ChartCard';

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function WhatsAppActivity({ conversations = [] }) {
  return (
    <ChartCard
      title="WhatsApp Inbox"
      subtitle="Recent conversations needing attention"
      action={
        <Link href="/automation/chat" className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
          Open inbox <ArrowRight className="w-3 h-3" />
        </Link>
      }
      className="h-full"
    >
      {conversations.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No unread conversations</p>
          <Link href="/automation/chat" className="text-xs text-teal-600 hover:underline mt-1 inline-block">
            View all chats
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {conversations.slice(0, 6).map((conv) => {
            const lead = conv.leadId;
            const name = lead?.name || lead?.phone || 'Unknown';
            const preview = conv.lastMessagePreview || 'New message';
            const unread = conv.unreadCount > 0 || conv.status === 'unread';

            return (
              <li key={conv._id}>
                <Link
                  href={`/automation/chat?leadId=${lead?._id || ''}`}
                  className="flex items-start gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${unread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {name}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{preview}</p>
                  </div>
                  {unread && (
                    <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0 mt-2" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}
