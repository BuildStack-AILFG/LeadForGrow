'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useSettings } from '../../hooks/useSettings';
import { SettingsTabs, SettingsCard, SettingsField, SettingsInput, SettingsSelect, SettingsToggle, SettingsSaveBar } from '../../components/settings/SettingsCard';

const TABS = [
  { id: 'profile', label: 'Business Profile' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'branding', label: 'Branding' }
];

export default function GeneralSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'profile';
  const { profile, workspace, branding, setProfile, setWorkspace, setBranding, saving, save } = useSettings();

  const setTab = (id) => router.replace(`/automation/settings/general?tab=${id}`);

  return (
    <div className="space-y-5">
      <SettingsTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'profile' && (
        <SettingsCard title="Business profile" description="Company information visible across your CRM">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsField label="Business name">
              <SettingsInput value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} />
            </SettingsField>
            <SettingsField label="Legal name">
              <SettingsInput value={profile.legalName} onChange={(e) => setProfile({ ...profile, legalName: e.target.value })} />
            </SettingsField>
            <SettingsField label="Industry">
              <SettingsInput value={profile.industry} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} />
            </SettingsField>
            <SettingsField label="Website">
              <SettingsInput value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
            </SettingsField>
            <SettingsField label="Phone">
              <SettingsInput value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </SettingsField>
            <SettingsField label="Email">
              <SettingsInput value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </SettingsField>
            <SettingsField label="Timezone" className="sm:col-span-2">
              <SettingsSelect value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </SettingsSelect>
            </SettingsField>
            <SettingsField label="Address" className="sm:col-span-2">
              <SettingsInput value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </SettingsField>
          </div>
          <SettingsSaveBar saving={saving} onSave={() => save('profile', profile)} />
        </SettingsCard>
      )}

      {tab === 'workspace' && (
        <SettingsCard title="Workspace preferences" description="Defaults and behavior for your CRM workspace">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsField label="Language">
                <SettingsSelect value={workspace.language} onChange={(e) => setWorkspace({ ...workspace, language: e.target.value })}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </SettingsSelect>
              </SettingsField>
              <SettingsField label="Date format">
                <SettingsSelect value={workspace.dateFormat} onChange={(e) => setWorkspace({ ...workspace, dateFormat: e.target.value })}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </SettingsSelect>
              </SettingsField>
              <SettingsField label="Default pipeline">
                <SettingsSelect value={workspace.defaultPipeline} onChange={(e) => setWorkspace({ ...workspace, defaultPipeline: e.target.value })}>
                  <option value="Sales Pipeline">Sales Pipeline</option>
                  <option value="Enterprise Pipeline">Enterprise Pipeline</option>
                </SettingsSelect>
              </SettingsField>
              <SettingsField label="Auto-archive after (days)">
                <SettingsInput type="number" value={workspace.autoArchiveDays} onChange={(e) => setWorkspace({ ...workspace, autoArchiveDays: +e.target.value })} />
              </SettingsField>
            </div>
            <SettingsToggle enabled={workspace.showWhatsAppBadge} onChange={(v) => setWorkspace({ ...workspace, showWhatsAppBadge: v })} label="Show WhatsApp badge on leads" description="Display messaging status in lead lists" />
          </div>
          <SettingsSaveBar saving={saving} onSave={() => save('workspace', workspace)} />
        </SettingsCard>
      )}

      {tab === 'branding' && (
        <SettingsCard title="Branding" description="Customize how LeadForGrow appears to your team and customers">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsField label="Primary color">
              <div className="flex items-center gap-2">
                <input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" />
                <SettingsInput value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} />
              </div>
            </SettingsField>
            <SettingsField label="Custom domain" hint="Available on Agency plan">
              <SettingsInput value={branding.customDomain} onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })} placeholder="crm.yourcompany.com" />
            </SettingsField>
            <SettingsField label="Email footer" className="sm:col-span-2">
              <SettingsInput value={branding.emailFooter} onChange={(e) => setBranding({ ...branding, emailFooter: e.target.value })} />
            </SettingsField>
          </div>
          <SettingsSaveBar saving={saving} onSave={() => save('branding', branding)} />
        </SettingsCard>
      )}
    </div>
  );
}
