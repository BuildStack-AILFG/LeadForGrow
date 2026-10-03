'use client';

import Chatbot from '@/app/components/Chatbot';

export default function ChatbotPreviewFrame({ businessId, config, businessName }) {
  return (
    <div className="relative h-full min-h-[560px] bg-[#eef1f6] dark:bg-slate-950 rounded-lg border border-line dark:border-slate-800 overflow-hidden">
      {/* Fake website chrome */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-10 bg-canvas dark:bg-slate-900 border-b border-line dark:border-slate-800 flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <div className="flex-1 mx-4 h-5 bg-muted dark:bg-slate-800 rounded-md max-w-xs" />
        </div>
        <div className="p-8 space-y-4 opacity-40">
          <div className="h-8 w-2/3 bg-slate-300/50 dark:bg-slate-700/50 rounded-lg" />
          <div className="h-4 w-full bg-muted/60 dark:bg-slate-800/60 rounded" />
          <div className="h-4 w-5/6 bg-muted/60 dark:bg-slate-800/60 rounded" />
          <div className="h-32 w-full bg-muted/40 dark:bg-slate-800/40 rounded-lg mt-6" />
        </div>
      </div>

      <div className="absolute inset-0 pt-10">
        <Chatbot
          isPreview
          businessId={businessId}
          position={config.appearance?.position || 'right'}
          previewConfig={{
            active: true,
            businessName,
            appearance: config.appearance,
            messages: config.messages,
            flow: config.flow,
          }}
        />
      </div>
    </div>
  );
}
