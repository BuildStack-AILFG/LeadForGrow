'use client';

const COMPARISON_ROWS = [
  {
    without: '😓 Reply to every customer manually',
    with: '🤖 AI replies instantly across WhatsApp, Instagram, Email & Web Chat',
  },
  {
    without: '📥 Capture leads from multiple platforms manually',
    with: '✅ Every lead automatically captured in one CRM',
  },
  {
    without: '⚙️ Build workflows using multiple tools',
    with: '⚡ No-code automation workflows for every customer journey',
  },
  {
    without: '⏰ Forget follow-ups',
    with: '🔄 Automated follow-ups until the customer responds',
  },
  {
    without: '👤 Create contacts manually',
    with: '✅ Customer profiles created automatically',
  },
  {
    without: '🔥 Guess which leads are important',
    with: '🎯 AI lead scoring & qualification',
  },
  {
    without: '👨‍💼 Assign leads manually',
    with: '🚀 Auto-assign leads to the right salesperson',
  },
  {
    without: '📅 Schedule meetings manually',
    with: '📆 Automatic meeting booking & calendar sync',
  },
  {
    without: '📊 Update pipeline manually',
    with: '🔄 Pipeline updates automatically after every interaction',
  },
  {
    without: '📱 Switch between 6–8 different apps',
    with: '🧩 CRM, Inbox, Automation, Analytics & AI in one platform',
  },
  {
    without: '📈 No visibility into automation performance',
    with: '📊 Real-time automation analytics & workflow insights',
  },
  {
    without: '💸 Lose leads due to delayed responses',
    with: '⚡ Respond in seconds and convert more customers',
  },
];

export default function LeadForGrowComparisonSection() {
  return (
    <section className="relative overflow-hidden bg-[#F8FAFC] py-14 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#EEF8ED]/60 via-[#F8FAFC] to-white" />
      <div className="pointer-events-none absolute -right-[10%] top-[10%] h-[280px] w-[280px] rounded-full bg-[#D2EDD0]/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Why teams switch
          </p>
          <h2
            className="mt-3 text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#111827] sm:text-[2.15rem]"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            Without LeadForGrow vs{' '}
            <span className="text-[#166534]">With LeadForGrow AI</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#64748B]">
            See what changes when your entire customer journey runs on one intelligent platform.
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)] md:block">
          <div className="grid grid-cols-2 border-b border-[#E2E8F0] bg-[#FAFBFC]">
            <div className="border-r border-[#E2E8F0] px-6 py-4">
              <p className="text-sm font-bold text-[#64748B]">Without LeadForGrow</p>
            </div>
            <div className="bg-gradient-to-r from-[#ECFDF5] to-[#F0FDF4] px-6 py-4">
              <p className="text-sm font-bold text-emerald-800">With LeadForGrow AI</p>
            </div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-[#EEF2F6]' : ''}`}
            >
              <div className="border-r border-[#EEF2F6] px-6 py-4">
                <p className="text-[14px] leading-relaxed text-[#64748B]">{row.without}</p>
              </div>
              <div className="bg-[#F7FDF9] px-6 py-4">
                <p className="text-[14px] font-medium leading-relaxed text-[#1E293B]">{row.with}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm"
            >
              <div className="border-b border-[#EEF2F6] bg-[#FAFBFC] px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Without LeadForGrow
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">{row.without}</p>
              </div>
              <div className="bg-gradient-to-r from-[#ECFDF5] to-white px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  With LeadForGrow AI
                </p>
                <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#1E293B]">{row.with}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
