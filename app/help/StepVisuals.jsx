'use client';

import {
  Globe, Link2, Copy, Send, CheckCircle2, Upload, MessageCircle, Mail,
  Key, Webhook, PlayCircle, LayoutDashboard, ImagePlus, Building2,
  Phone, MapPin, Hash, Receipt, FileText, ArrowRight, Sparkles, Tag,
  Users, Filter, ShieldCheck, CreditCard, PhoneCall, Zap, GitBranch,
  Settings, ChevronRight, ListChecks, Palette, Clock, Timer,
} from 'lucide-react';
import {
  WhatsAppIcon, InstagramIcon, GmailIcon,
} from '@/app/automation/components/chat/BrandIcons';

/**
 * Per-step topic icons.
 * Keyed strings mapped to Lucide (or brand) icon components. Keeps
 * lib/help/guides.js free of imports — it stays plain data.
 */
const ICON_MAP = {
  // Generic
  globe: Globe, link: Link2, copy: Copy, send: Send, check: CheckCheck,
  upload: Upload, message: MessageCircle, mail: Mail, key: Key,
  webhook: Webhook, play: PlayCircle, dashboard: LayoutDashboard,
  image: ImagePlus, building: Building2, phone: Phone, address: MapPin,
  hash: Hash, receipt: Receipt, file: FileText, arrow: ArrowRight,
  sparkles: Sparkles, tag: Tag, users: Users, filter: Filter,
  shield: ShieldCheck, card: CreditCard, callphone: PhoneCall,
  zap: Zap, branch: GitBranch, settings: Settings, next: ChevronRight,
  list: ListChecks, palette: Palette, clock: Clock, timer: Timer,
  // Real brand marks
  whatsapp: WhatsAppIcon, instagram: InstagramIcon, gmail: GmailIcon,
};

function CheckCheck(props) { return <CheckCircle2 {...props} />; }

/**
 * StepIcon — the coloured circle that replaces the plain "1 / 2 / 3" number.
 * Tone maps to the step's topic; falls back to blue.
 */
export function StepIcon({ icon = 'next', tone = 'blue' }) {
  const Comp = ICON_MAP[icon] || ICON_MAP.next;
  const wrapper = TONE_WRAPPER[tone] || TONE_WRAPPER.blue;
  // Brand icons carry their own colour — otherwise inherit the tone
  const isBrand = ['whatsapp', 'instagram', 'gmail'].includes(icon);
  return (
    <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ring-1 ${wrapper.ring} ${wrapper.bg}`}>
      {isBrand ? (
        icon === 'gmail'
          ? <Comp size={18} />
          : icon === 'whatsapp'
            ? <Comp size={18} className="text-[#25D366]" />
            : <Comp size={18} className="text-[#DD2A7B]" />
      ) : (
        <Comp className={`w-4 h-4 ${wrapper.text}`} strokeWidth={2.2} />
      )}
    </span>
  );
}

const TONE_WRAPPER = {
  blue:    { bg: 'bg-teal-50',    text: 'text-teal-600',    ring: 'ring-teal-200/60' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200/60' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'ring-amber-200/60' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  ring: 'ring-violet-200/60' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    ring: 'ring-rose-200/60' },
  slate:   { bg: 'bg-slate-100',  text: 'text-slate-600',   ring: 'ring-slate-200' },
};

/**
 * StepVisual — inline UI mockup for a step. Each `kind` renders a small,
 * hand-built panel that matches LFG's or the external tool's actual UI.
 * Purely visual: no interaction, no fetches — cheap to render and safe SSR.
 *
 * data shape depends on `kind`, documented below each case.
 */
export function StepVisual({ kind, data = {} }) {
  switch (kind) {

    // { url: string, title?: string }
    case 'browser':
      return (
        <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-14px_rgba(15,23,42,0.25)]">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="flex-1 mx-2 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-500 font-mono truncate">
              {data.url}
            </div>
          </div>
          {data.title && (
            <div className="px-4 py-3 text-sm text-slate-700">{data.title}</div>
          )}
        </div>
      );

    // { fields: [{ label, value?, placeholder? }] }
    case 'form':
      return (
        <div className="mt-3 rounded-xl ring-1 ring-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-14px_rgba(15,23,42,0.25)] p-3 space-y-2">
          {(data.fields || []).map((f, i) => (
            <div key={i}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{f.label}</div>
              <div className={`h-8 px-3 flex items-center rounded-lg border border-slate-200 text-xs font-mono ${f.value ? 'text-slate-800 bg-slate-50' : 'text-slate-400 bg-white'}`}>
                {f.value || f.placeholder || 'paste here'}
              </div>
            </div>
          ))}
        </div>
      );

    // { text: string, direction?: 'in' | 'out', tail?: string }
    case 'whatsapp':
      return (
        <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-14px_rgba(15,23,42,0.25)]">
          <div className="p-4 bg-[#efeae2]">
            <div className={`flex ${data.direction === 'in' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                data.direction === 'in'
                  ? 'bg-white text-slate-900 rounded-tl-none'
                  : 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
              }`}>
                <p className="whitespace-pre-wrap leading-snug">{data.text}</p>
                <div className="text-[10px] text-slate-500 text-right mt-1">
                  {data.tail || '19:32'} <span className="text-[#53bdeb]">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    // { label, kind?: 'primary' | 'secondary', icon? }
    case 'button': {
      const Icon = data.icon ? (ICON_MAP[data.icon] || ArrowRight) : null;
      const style = data.kind === 'secondary'
        ? 'bg-white text-slate-800 border border-slate-200'
        : 'bg-emerald-600 text-white border border-emerald-600';
      return (
        <div className="mt-3">
          <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${style}`}>
            {Icon && <Icon className="w-4 h-4" />}
            {data.label}
          </div>
        </div>
      );
    }

    // { steps: [{ label, done? }] }  — a mini progress checklist
    case 'checklist':
      return (
        <div className="mt-3 rounded-xl ring-1 ring-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-14px_rgba(15,23,42,0.25)] p-3">
          <ul className="space-y-1.5">
            {(data.steps || []).map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className={`w-3.5 h-3.5 ${s.done ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={s.done ? 'text-slate-800' : 'text-slate-500'}>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    // { item: string, description?: string, icon? }  — mock sidebar nav item highlighted
    case 'nav': {
      const Icon = data.icon ? (ICON_MAP[data.icon] || ChevronRight) : ChevronRight;
      return (
        <div className="mt-3 rounded-xl ring-1 ring-slate-200 bg-slate-900 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-14px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/20 border border-teal-400/40">
            <Icon className="w-4 h-4 text-teal-300" />
            <span className="text-sm font-medium text-white">{data.item}</span>
            {data.description && <span className="ml-auto text-[10px] text-teal-200">{data.description}</span>}
          </div>
        </div>
      );
    }

    // { amount: string, business: string, link: string }
    case 'payment-link':
      return (
        <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-14px_rgba(15,23,42,0.25)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500">Pay {data.business}</div>
              <div className="text-lg font-semibold text-slate-900 tabular-nums">₹{data.amount}</div>
            </div>
            <div className="text-xs text-teal-600 font-mono truncate max-w-[140px]">{data.link || 'rzp.io/i/abc123'}</div>
          </div>
        </div>
      );

    // { title, subtitle, actions?: [{ label, kind }] } — a mock bill card
    case 'bill-card':
      return (
        <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-14px_rgba(15,23,42,0.25)]">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Bill</div>
                <div className="text-lg font-semibold font-mono text-slate-900">{data.title || 'PG-2026-001'}</div>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700">Sent</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">{data.subtitle || 'Total ₹3,400 · sent to Daksh'}</div>
          </div>
          {data.actions?.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-2">
              {data.actions.map((a, i) => (
                <div key={i} className={`text-[11px] px-2.5 py-1 rounded-md font-semibold ${
                  a.kind === 'primary' ? 'bg-emerald-600 text-white'
                    : a.kind === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-white text-slate-700 border border-slate-200'
                }`}>{a.label}</div>
              ))}
            </div>
          )}
        </div>
      );

    // { text }
    case 'toast':
      return (
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {data.text || 'Saved'}
        </div>
      );

    default:
      return null;
  }
}
