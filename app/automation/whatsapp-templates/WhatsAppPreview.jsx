'use client';

import { Phone, ExternalLink, Reply, Image as ImageIcon, Video, FileText } from 'lucide-react';

function renderTextWithVars(text, samples = []) {
  if (!text) return '';
  return text.replace(/\{\{(\d+)\}\}/g, (_, i) => samples[Number(i) - 1] || `{{${i}}}`);
}

export default function WhatsAppPreview({ template }) {
  const header = template.components?.find((c) => c.type === 'HEADER');
  const body = template.components?.find((c) => c.type === 'BODY');
  const footer = template.components?.find((c) => c.type === 'FOOTER');
  const buttons = template.components?.find((c) => c.type === 'BUTTONS');

  const bodySamples = body?.example?.body_text?.[0] || [];
  const headerSamples = header?.example?.header_text || [];

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <div className="rounded-[2rem] bg-[#0b141a] p-3 shadow-2xl shadow-black/40">
        <div className="rounded-[1.4rem] overflow-hidden bg-[#0b141a]">
          {/* Chat header */}
          <div className="bg-[#1f2c33] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold">B</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Your Business</p>
              <p className="text-emerald-300/70 text-[10px]">online</p>
            </div>
          </div>

          {/* Chat body */}
          <div
            className="min-h-[380px] px-3 py-4 space-y-2"
            style={{
              backgroundColor: '#0b141a',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          >
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-[#202c33] text-white rounded-lg overflow-hidden shadow-md">
                {header && (
                  <div>
                    {header.format === 'TEXT' && header.text && (
                      <p className="px-3 pt-2 text-[13px] font-bold">
                        {renderTextWithVars(header.text, headerSamples)}
                      </p>
                    )}
                    {header.format === 'IMAGE' && (
                      <div className="h-40 bg-slate-700/60 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    {header.format === 'VIDEO' && (
                      <div className="h-40 bg-slate-700/60 flex items-center justify-center">
                        <Video className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    {header.format === 'DOCUMENT' && (
                      <div className="h-16 bg-slate-700/60 flex items-center gap-2 px-3">
                        <FileText className="w-6 h-6 text-slate-300" />
                        <div className="text-[11px] text-slate-300">Document.pdf</div>
                      </div>
                    )}
                  </div>
                )}

                {body?.text ? (
                  <p className="px-3 py-2 text-[13.5px] leading-snug whitespace-pre-wrap">
                    {renderTextWithVars(body.text, bodySamples)}
                  </p>
                ) : (
                  <p className="px-3 py-2 text-[13px] italic text-slate-500">Message body preview…</p>
                )}

                {footer?.text && (
                  <p className="px-3 pb-1 text-[11px] text-slate-400">{footer.text}</p>
                )}

                <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
                  <span className="text-[10px] text-slate-500">{timeStr}</span>
                </div>

                {buttons?.buttons?.length > 0 && (
                  <div className="border-t border-white/5">
                    {buttons.buttons.map((btn, i) => (
                      <div
                        key={i}
                        className="px-3 py-2.5 border-t border-white/5 first:border-t-0 flex items-center justify-center gap-1.5 text-[13px] text-[#53bdeb] font-medium"
                      >
                        {btn.type === 'PHONE_NUMBER' && <Phone className="w-3.5 h-3.5" />}
                        {btn.type === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                        {btn.type === 'QUICK_REPLY' && <Reply className="w-3.5 h-3.5" />}
                        <span className="truncate">{btn.text || 'Button'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-3">Live WhatsApp preview</p>
    </div>
  );
}
