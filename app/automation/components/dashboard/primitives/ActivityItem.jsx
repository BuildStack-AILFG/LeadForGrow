'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { Phone, Mail, UserPlus, RefreshCw, CheckCircle2, XCircle, Zap, ListChecks } from 'lucide-react';

const TYPE_ICONS = {
  whatsapp_received: WhatsAppIcon,
  whatsapp_sent: WhatsAppIcon,
  whatsapp_failed: WhatsAppIcon,
  whatsapp: WhatsAppIcon,
  call: Phone,
  email_sent: Mail,
  email_failed: Mail,
  email: Mail,
  assigned: UserPlus,
  status_changed: RefreshCw,
  converted: CheckCircle2,
  automation_step: ListChecks,
  automation_failed: XCircle,
  automation_executed: Zap,
  lead_created: UserPlus,
  task_created: ListChecks,
};

function pickIcon(activity) {
  const type = (activity.type || '').toLowerCase();
  if (TYPE_ICONS[type]) return TYPE_ICONS[type];
  for (const [key, Icon] of Object.entries(TYPE_ICONS)) {
    if (type.includes(key)) return Icon;
  }
  return RefreshCw;
}

function statusColor(activity) {
  const status = activity.metadata?.stepStatus || activity.metadata?.status;
  if (status === 'failed' || activity.type === 'automation_failed' || activity.type === 'whatsapp_failed' || activity.type === 'email_failed') {
    return 'text-red-500';
  }
  if (status === 'success' || activity.type === 'whatsapp_sent' || activity.type === 'email_sent') {
    return 'text-emerald-500';
  }
  return 'text-slate-500 dark:text-slate-400';
}

export default function ActivityItem({ activity, showConnector = false }) {
  const Icon = pickIcon(activity);
  const iconColor = statusColor(activity);
  const time = activity.performedAt
    ? new Date(activity.performedAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Just now';

  return (
    <div className="flex gap-3 relative">
      {showConnector && (
        <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
      )}
      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0 z-[1]">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0 pb-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
          {activity.description || activity.type}
        </p>
        {activity.metadata?.workflowName && activity.isWorkflowStep && (
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5">{activity.metadata.workflowName}</p>
        )}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{time}</p>
      </div>
    </div>
  );
}
