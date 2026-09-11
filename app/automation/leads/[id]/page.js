'use client';

import { Suspense, use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useLeadDetail } from '../../hooks/useLeadDetail';
import LeadDetailSkeleton from '../../components/leads/detail/LeadDetailSkeleton';
import LeadDetailHeader from '../../components/leads/detail/LeadDetailHeader';
import LeadDetailProfile from '../../components/leads/detail/LeadDetailProfile';
import LeadDetailWorkspace from '../../components/leads/detail/LeadDetailWorkspace';
import ChatbotTranscript from '../../components/leads/detail/ChatbotTranscript';
import ConvertLeadDialog from '../../components/leads/ConvertLeadDialog';
import LostReasonModal from '../../components/leads/LostReasonModal';
import QualifiedSummaryModal from '../../components/leads/QualifiedSummaryModal';

export default function LeadDetailPage({ params }) {
  return (
    <Suspense fallback={<LeadDetailSkeleton />}>
      <LeadDetailPageContent params={params} />
    </Suspense>
  );
}

function LeadDetailPageContent({ params }) {
  const { id } = use(params);
  const detail = useLeadDetail(id);
  const searchParams = useSearchParams();
  const [sendingChat, setSendingChat] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  useEffect(() => {
    if (searchParams.get('convert') === '1' && detail.lead && detail.lead.status !== 'converted') {
      setShowConvert(true);
    }
  }, [searchParams, detail.lead]);

  if (detail.loading) return <LeadDetailSkeleton />;

  if (!detail.lead) {
    return (
      <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Lead not found</h2>
          <Link href="/automation/leads" className="inline-flex items-center gap-1 mt-4 text-sm text-teal-600 hover:underline">
            <ChevronLeft className="w-4 h-4" /> Back to leads
          </Link>
        </div>
      </div>
    );
  }

  const handleSendWhatsApp = async (message) => {
    setSendingChat(true);
    try {
      return await detail.sendWhatsApp(message);
    } finally {
      setSendingChat(false);
    }
  };

  const handleTemplate = (template) => {
    const msg = detail.renderTemplate(template.body);
    if (template.channel === 'email' && detail.lead.email) {
      window.open(`mailto:${detail.lead.email}?body=${encodeURIComponent(msg)}`, '_blank');
        } else {
      detail.openWhatsApp(msg);
    }
  };

  return (
    <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950">
      <div className="px-4 sm:px-6 pb-8">
        <LeadDetailHeader
          lead={detail.lead}
          intelligence={detail.intelligence}
          updating={detail.updating}
          onCall={detail.initiateCall}
          onWhatsApp={() => detail.openWhatsApp()}
          onConvert={() => setShowConvert(true)}
          onLost={() => detail.updateStatus('lost')}
          onDelete={detail.deleteLead}
        />

        <ConvertLeadDialog
          open={showConvert}
          lead={detail.lead}
          teamMembers={detail.teamMembers}
          saving={detail.updating}
          onClose={() => setShowConvert(false)}
          onConfirm={async (form) => {
            const ok = await detail.convertLead(form);
            if (ok) setShowConvert(false);
          }}
        />

        <LostReasonModal
          open={!!detail.lostPrompt}
          leadName={detail.lead.name}
          variant={detail.lostPrompt?.status === 'unqualified' ? 'unqualified' : 'lost'}
          saving={detail.lostSaving}
          onCancel={detail.cancelLostPrompt}
          onConfirm={detail.confirmLostReason}
        />

        <QualifiedSummaryModal
          open={!!detail.qualifiedPrompt}
          leadName={detail.lead.name}
          saving={detail.qualifying}
          onCancel={detail.cancelQualifiedPrompt}
          onConfirm={detail.confirmQualifiedAmount}
        />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <LeadDetailProfile
            lead={detail.lead}
            intelligence={detail.intelligence}
            teamMembers={detail.teamMembers}
            showHistory={detail.showHistory}
            onShowHistoryChange={detail.setShowHistory}
            onStatusChange={(status) => {
              if (status === 'converted') {
                setShowConvert(true);
                return;
              }
              detail.updateStatus(status);
            }}
            onAssign={detail.assignLead}
            templates={detail.templates}
            onTemplate={handleTemplate}
            onCall={detail.initiateCall}
            onWhatsApp={() => detail.openWhatsApp()}
          />

          <div className="space-y-6">
            {detail.lead.source === 'bot' && (
              <ChatbotTranscript lead={detail.lead} />
            )}
            <LeadDetailWorkspace
            lead={detail.lead}
            tasks={detail.tasks}
            teamMembers={detail.teamMembers}
            updating={detail.updating}
            sendingChat={sendingChat}
            onSendWhatsApp={handleSendWhatsApp}
            onAddNote={detail.addNote}
            onCreateTask={detail.createTask}
            onCompleteTask={detail.completeTask}
          />
          </div>
        </div>
      </div>
    </div>
  );
}
