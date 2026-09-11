'use client';

import { Smartphone, Key, FileText, LogOut } from 'lucide-react';
import { SettingsCard, SettingsToggle } from './SettingsCard';

export default function SecurityPanel({ security, onToggle2FA }) {
  return (
    <div className="space-y-4">
      <SettingsCard title="Two-factor authentication" description="Add an extra layer of security to your account">
        <SettingsToggle
          enabled={security.twoFactorEnabled}
          onChange={onToggle2FA}
          label="Enable 2FA"
          description="Require a verification code when signing in"
        />
      </SettingsCard>

      <SettingsCard title="Active sessions" description="Devices currently signed in to your account">
        <div className="space-y-3">
          {security.sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {session.device}
                    {session.current && <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">Current</span>}
                  </p>
                  <p className="text-xs text-slate-500">{session.location} · {session.lastActive}</p>
                </div>
              </div>
              {!session.current && (
                <button type="button" className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="API tokens" description="Manage programmatic access to your workspace">
        <div className="space-y-3">
          {security.apiTokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{token.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{token.prefix} · Created {token.created}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">Used {token.lastUsed}</span>
            </div>
          ))}
          <button type="button" className="text-xs font-medium text-teal-600 hover:text-teal-700">+ Generate new token</button>
        </div>
      </SettingsCard>

      <SettingsCard title="Audit log" description="Recent security and admin activity">
        <div className="space-y-2">
          {security.auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-2 text-xs border-b border-slate-100 dark:border-slate-800 last:border-0">
              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200">{log.action}</p>
                <p className="text-slate-500">{log.user} · {log.time} · {log.ip}</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}
