'use client';

import PageLoader from '../PageLoader';
import { useMeetingsWorkspace } from '../../hooks/useMeetingsWorkspace';
import MeetingsDashboard from './MeetingsDashboard';
import CreateMeetingWizard from './CreateMeetingWizard';

export default function MeetingsWorkspace() {
  const ws = useMeetingsWorkspace();

  if (ws.loading && ws.mode === 'dashboard') {
    return <PageLoader label="Loading meetings…" />;
  }

  if (ws.mode === 'create') {
    return (
      <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950">
        <CreateMeetingWizard
          step={ws.wizardStep}
          draft={ws.draft}
          onChange={ws.setDraft}
          onNext={() => ws.setWizardStep((s) => Math.min(4, s + 1))}
          onBack={() => ws.setWizardStep((s) => Math.max(1, s - 1))}
          onCancel={() => ws.setMode('dashboard')}
          onPublish={ws.publishMeeting}
          saving={ws.saving}
          editing={!!ws.editingId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950">
      <MeetingsDashboard
        dashboard={ws.dashboard}
        onCreate={ws.startCreate}
        onEdit={ws.startEdit}
        onNoShow={ws.markNoShow}
        onComplete={ws.completeBooking}
      />
    </div>
  );
}
