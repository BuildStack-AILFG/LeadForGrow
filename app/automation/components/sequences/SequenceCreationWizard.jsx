'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, UserPlus, MessageCircle, PhoneMissed, Home,
  GraduationCap, Calendar, RotateCcw, Sparkles, Target, GitBranch,
  Search, Wrench, Scissors, ShoppingCart, UtensilsCrossed, Dumbbell,
  Stethoscope, BookOpen, ShoppingBag, CreditCard, MessageSquareOff,
  PartyPopper, Zap, CalendarClock, Trophy,
} from 'lucide-react';
import { SEQUENCE_CATEGORIES, TRIGGER_TYPES } from '@/lib/sequences/constants';
import { SEQUENCE_INDUSTRIES } from '@/lib/sequences/templates';

const ICON_MAP = {
  UserPlus, MessageCircle, PhoneMissed, Home, GraduationCap, Calendar, RotateCcw,
  Sparkles, Target, GitBranch, Wrench, Scissors, ShoppingCart, UtensilsCrossed,
  Dumbbell, Stethoscope, BookOpen, ShoppingBag, CreditCard, MessageSquareOff,
  PartyPopper, Zap, CalendarClock, Trophy,
};

export default function SequenceCreationWizard({
  step, draft, onChange, onNext, onBack, onCancel, onFinish, templates,
}) {
  // Industry chip + search: filters the template grid so a new customer
  // isn't drowned in 22 generic cards. Auto-service / salon / e-commerce
  // industries surface immediately, cutting time-to-first-sequence from
  // ~5 min of hunting to ~30 sec of clicking.
  const [industry, setIndustry] = useState('all');
  const [search, setSearch] = useState('');
  // previewTpl = the template the user tapped but hasn't committed to yet.
  // Two-step click ("Preview → Use this template") lets them see the actual
  // messages before creating anything. Cuts the "created 3 sequences by
  // accident while exploring" problem.
  const [previewTpl, setPreviewTpl] = useState(null);

  // Only show industry chips that have at least one template — empty tabs
  // are worse than no tabs, they promise something and deliver nothing.
  const availableIndustries = useMemo(() => {
    const counts = new Map();
    templates.forEach((t) => {
      const key = t.industry || 'generic';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [
      { id: 'all', label: 'All', count: templates.length },
      ...SEQUENCE_INDUSTRIES
        .filter((ind) => counts.get(ind.id))
        .map((ind) => ({ ...ind, count: counts.get(ind.id) })),
    ];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (industry !== 'all' && (t.industry || 'generic') !== industry) return false;
      if (!q) return true;
      return (
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });
  }, [templates, industry, search]);
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-sm text-fg-tertiary hover:text-fg-secondary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to sequences
      </button>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s ? 'bg-accent text-white' : 'bg-muted dark:bg-slate-700 text-fg-tertiary'
            }`}>{s}</div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-fg dark:text-white' : 'text-fg-tertiary'}`}>
              {s === 1 ? 'Details & trigger' : 'Choose template'}
            </span>
            {s === 1 && <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-accent' : 'bg-muted dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-fg dark:text-white">Name your sequence</h2>
              <p className="text-sm text-fg-tertiary mt-1">Start with basics — you can refine the workflow in the builder.</p>
            </div>
            <div className="p-6 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">Sequence name</label>
                <input
                  value={draft.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="e.g. New Lead WhatsApp Nurture"
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 bg-subtle dark:bg-slate-800 text-sm focus:ring-2 focus:ring-focus outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  rows={2}
                  placeholder="What does this sequence do?"
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 bg-subtle dark:bg-slate-800 text-sm focus:ring-2 focus:ring-focus outline-none resize-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">Category</label>
                  <select
                    value={draft.category}
                    onChange={(e) => onChange({ category: e.target.value })}
                    className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 bg-subtle dark:bg-slate-800 text-sm"
                  >
                    {SEQUENCE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">Trigger</label>
                  <select
                    value={draft.triggerType}
                    onChange={(e) => onChange({ triggerType: e.target.value })}
                    className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 bg-subtle dark:bg-slate-800 text-sm"
                  >
                    {TRIGGER_TYPES.map((t) => (
                      <option key={t.triggerKey} value={t.triggerKey}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onNext}
                disabled={!draft.name?.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-fg dark:text-white">Choose a template</h2>
              <p className="text-sm text-fg-tertiary mt-1">Pick an industry to see flows written for that business type.</p>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates by name, purpose, or industry…"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-line dark:border-slate-700 bg-canvas dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {availableIndustries.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setIndustry(ind.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    industry === ind.id
                      ? 'bg-accent text-white border-accent'
                      : 'bg-canvas dark:bg-slate-900 text-fg-secondary dark:text-fg-tertiary border-line dark:border-slate-700 hover:border-teal-400'
                  }`}
                >
                  <span>{ind.label}</span>
                  <span className={`text-meta tabular-nums ${industry === ind.id ? 'text-white/70' : 'text-fg-tertiary'}`}>
                    {ind.count}
                  </span>
                </button>
              ))}
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 rounded-lg border border-dashed border-line dark:border-slate-700">
                <p className="text-sm text-fg-tertiary">No templates match your filter. Try a different industry or clear search.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredTemplates.map((tpl) => {
                  const Icon = ICON_MAP[tpl.icon] || GitBranch;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setPreviewTpl(tpl)}
                      className="group text-left p-4 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 hover:border-teal-400 hover:shadow-popover transition-all"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-canvas ${tpl.gradient} flex items-center justify-center mb-3 shadow-popover group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm text-fg dark:text-white">{tpl.name}</h3>
                      <p className="text-xs text-fg-tertiary mt-1">{tpl.description}</p>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onFinish('blank')}
                  className="p-4 rounded-lg border-2 border-dashed border-line-strong dark:border-slate-600 hover:border-teal-400 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted dark:bg-slate-800 flex items-center justify-center mb-3">
                    <GitBranch className="w-5 h-5 text-fg-tertiary" />
                  </div>
                  <h3 className="font-semibold text-sm text-fg-secondary dark:text-fg-disabled">Blank workflow</h3>
                  <p className="text-xs text-fg-tertiary mt-1">Start from scratch with drag & drop</p>
                </button>
              </div>
            )}

            <button type="button" onClick={onBack} className="mt-6 text-sm text-fg-tertiary hover:text-fg-secondary">
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {previewTpl && (
        <TemplatePreviewModal
          tpl={previewTpl}
          onClose={() => setPreviewTpl(null)}
          onUse={() => { onFinish(previewTpl.id); setPreviewTpl(null); }}
        />
      )}
    </div>
  );
}

/**
 * Modal that previews a sequence template step-by-step before the user
 * commits. Renders each linear step's message with sample variables
 * substituted so the user sees exactly what a real recipient would get.
 */
function TemplatePreviewModal({ tpl, onClose, onUse }) {
  const Icon = ICON_MAP[tpl.icon] || GitBranch;
  const built = useMemo(() => {
    try { return tpl.build?.() || {}; }
    catch { return {}; }
  }, [tpl]);
  const steps = built.steps || [];
  const isGraphOnly = !steps.length && built.nodes?.length;

  const substitute = (text) => String(text || '')
    .replace(/\{\{\s*name\s*\}\}/gi, 'Daksh')
    .replace(/\{\{\s*business_name\s*\}\}/gi, 'Your business')
    .replace(/\{\{1\}\}/g, 'Daksh');

  // In-flow overlay (no position:fixed — see design skill notes on iframes).
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-canvas dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-line dark:border-slate-800 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg bg-canvas ${tpl.gradient} flex items-center justify-center shadow-popover shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-fg dark:text-white">{tpl.name}</h3>
            <p className="text-xs text-fg-tertiary mt-0.5">{tpl.description}</p>
            <div className="flex items-center gap-2 mt-2 text-meta">
              <span className="px-1.5 py-0.5 rounded bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-tertiary font-medium">{tpl.category}</span>
              <span className="text-fg-tertiary">·</span>
              <span className="text-fg-tertiary">Trigger: {tpl.triggerType?.replace(/_/g, ' ')}</span>
              {steps.length > 0 && (
                <>
                  <span className="text-fg-tertiary">·</span>
                  <span className="text-fg-tertiary">{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {isGraphOnly && (
            <div className="text-xs text-fg-tertiary p-3 rounded-lg bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-700">
              This is a visual workflow template. Open it in the builder to see nodes and branches.
            </div>
          )}
          {steps.map((s, i) => {
            const dayLabel = i === 0 && !s.delayDays
              ? 'Immediately'
              : s.delayDays
                ? `+${s.delayDays} day${s.delayDays > 1 ? 's' : ''} later`
                : 'Same day';
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-accent-subtle dark:bg-teal-950/40 text-accent-fg dark:text-accent-fg flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-muted dark:bg-slate-700 my-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-meta font-medium text-fg-tertiary">{dayLabel}</span>
                    <span className="text-meta px-1.5 py-0.5 rounded bg-accent-subtle dark:bg-emerald-950/40 text-accent-fg dark:text-accent-fg font-medium">
                      {s.channel}
                    </span>
                  </div>
                  {s.emailSubject && (
                    <p className="text-xs font-semibold text-fg dark:text-slate-200 mb-1">
                      Subject: {substitute(s.emailSubject)}
                    </p>
                  )}
                  <div className="rounded-lg bg-accent-subtle dark:bg-emerald-950/20 border border-line dark:border-emerald-900/40 p-3 text-xs text-fg dark:text-slate-200 whitespace-pre-wrap">
                    {substitute(s.messageTemplate) || '(no message)'}
                  </div>
                  {/* Smart-branching badges — surface what the sequence will
                      actually do when this step gets a reply, so the user
                      isn't surprised by the intelligent behaviour. */}
                  {(s.isGoal || s.pauseOnReply || s.exitOnAnyReply || (s.exitKeywords && s.exitKeywords.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.isGoal && (
                        <span className="inline-flex items-center gap-1 text-meta px-1.5 py-0.5 rounded bg-warning-subtle dark:bg-amber-950/40 text-warning dark:text-amber-300 font-medium">
                          Goal step
                        </span>
                      )}
                      {s.pauseOnReply && (
                        <span className="inline-flex items-center gap-1 text-meta px-1.5 py-0.5 rounded bg-accent-subtle dark:bg-violet-950/40 text-accent-fg dark:text-accent-fg font-medium">
                          ⏸ Pauses if replied (routes to human)
                        </span>
                      )}
                      {s.exitOnAnyReply && !s.pauseOnReply && (
                        <span className="inline-flex items-center gap-1 text-meta px-1.5 py-0.5 rounded bg-accent-subtle dark:bg-teal-950/40 text-accent-fg dark:text-accent-fg font-medium">
                          ✓ Exits on any reply
                        </span>
                      )}
                      {s.exitKeywords && s.exitKeywords.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-meta px-1.5 py-0.5 rounded bg-danger-subtle dark:bg-red-950/40 text-danger dark:text-red-300 font-medium">
                          Exits on: {s.exitKeywords.slice(0, 3).join(', ')}{s.exitKeywords.length > 3 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {steps.length === 0 && !isGraphOnly && (
            <p className="text-xs text-fg-tertiary text-center py-6">No step details available for this template.</p>
          )}
        </div>

        <div className="p-4 border-t border-line dark:border-slate-800 flex justify-between items-center bg-subtle dark:bg-slate-800/40 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-fg-tertiary hover:text-fg-secondary px-3 py-2"
          >
            ← Back to templates
          </button>
          <button
            type="button"
            onClick={onUse}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover"
          >
            Use this template <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
