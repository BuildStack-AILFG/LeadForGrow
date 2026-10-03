'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateMeetingWizard from '../../components/meetings/CreateMeetingWizard';
import { authJson } from '@/lib/apiClient';
import toast from 'react-hot-toast';

const EMPTY_DRAFT = {
  title: '',
  description: '',
  category: 'sales_call',
  durationMinutes: 30,
  bookingSlug: '',
  assignmentMode: 'round_robin',
  availabilityRules: {
    timezone: 'Asia/Kolkata',
    workingDays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    bufferAfterMinutes: 15,
    minNoticeHours: 2,
  },
  automationRules: {
    whatsappConfirmation: true,
    whatsappReminder: true,
    whatsappReminderMinutes: 30,
    emailReminder: true,
    triggerAutomationOnBook: true,
    leadStatusOnBook: 'interested',
  },
  branding: { accentColor: '#4338ca' },
};

export default function CreateMeetingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const publish = async () => {
    setSaving(true);
    try {
      const slug =
        draft.bookingSlug ||
        `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-4)}`;
      const res = await authJson('/api/automation/meetings', {
        method: 'POST',
        body: JSON.stringify({ ...draft, bookingSlug: slug, status: 'published' }),
      });
      if (res.success) {
        toast.success('Booking link published');
        router.push('/automation/meetings');
      } else {
        toast.error(res.error || 'Failed to publish');
      }
    } catch {
      toast.error('Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-canvas">
      <CreateMeetingWizard
        step={step}
        draft={draft}
        onChange={setDraft}
        onNext={() => setStep((s) => Math.min(4, s + 1))}
        onBack={() => (step === 1 ? router.push('/automation/meetings') : setStep((s) => s - 1))}
        onCancel={() => router.push('/automation/meetings')}
        onPublish={publish}
        saving={saving}
      />
    </div>
  );
}
