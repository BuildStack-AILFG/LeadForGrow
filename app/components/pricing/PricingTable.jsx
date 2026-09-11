'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, ChevronDown, Info } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, GmailIcon } from '@/app/automation/components/chat/BrandIcons';
import {
  PRICING_PLANS,
  FEATURE_CATEGORIES,
  YEARLY_DISCOUNT_LABEL,
  QUARTERLY_DISCOUNT_LABEL,
  formatINR,
} from './pricingData';

// Exact per-tier palette scraped live off interakt.shop/pricing (computed
// styles) at the user's explicit "100% same to same UI, exact colors, exact
// icons" request. Only the copy/numbers below are ours — these hex values
// ARE their real plan colors:
//   Starter (amber)  button #FAB534 / black text, checklist tint #FFF1D6, check-badge #FAB534
//   Growth  (teal)   button #05A68B / white text, checklist tint #EFF1F5, check-badge #05A68B
//   Scale   (blue)   button #0096DE / white text, checklist tint #DFF5FF, check-badge #12295F (navy)
//   Enterprise(forest) button #004C3D / white text, checklist tint #E3FFFA, check-badge #038CFF
const ACCENT = {
  amber:  { name: 'text-[#B45F06]', btnBg: '#FAB534', btnText: '#111827', tint: '#FFF1D6', check: '#FAB534' },
  teal:   { name: 'text-[#05A68B]', btnBg: '#05A68B', btnText: '#FFFFFF', tint: '#EFF1F5', check: '#05A68B' },
  blue:   { name: 'text-[#0096DE]', btnBg: '#0096DE', btnText: '#FFFFFF', tint: '#DFF5FF', check: '#12295F' },
  forest: { name: 'text-[#004C3D]', btnBg: '#004C3D', btnText: '#FFFFFF', tint: '#E3FFFA', check: '#038CFF' },
};

// Interakt's own comparison table is ONE continuous grid — a 0.83px hairline
// border (~#EBEFF2) between every row and column, sharp corners (0px radius
// on everything except the outer wrapper), no per-card rounding/shadows.
// Scraped live via computed styles — see DECISIONS.md 2026-09-11 entry.
const GRID_LINE = '#E5E7EB';
const LABEL_COL = '220px';

const BILLING_OPTIONS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly', badge: `▼${QUARTERLY_DISCOUNT_LABEL}` },
  { id: 'yearly', label: 'Yearly', badge: `▼${YEARLY_DISCOUNT_LABEL}` },
];

function priceForBilling(plan, billing) {
  if (billing === 'quarterly') return plan.quarterlyPrice;
  if (billing === 'yearly') return plan.yearlyPrice;
  return plan.monthlyPrice;
}

function ChannelChips({ channels }) {
  const items = [
    { key: 'whatsapp', on: channels.whatsapp, Icon: WhatsAppIcon, label: 'WhatsApp', color: '#25D366' },
    { key: 'instagram', on: channels.instagram, Icon: InstagramIcon, label: 'Instagram', color: '#DD2A7B' },
    { key: 'email', on: channels.email, Icon: GmailIcon, label: 'Email', color: null },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {items.map(({ key, on, Icon, label, color }) => (
        <span
          key={key}
          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium ${
            on ? 'border-slate-200 bg-white text-[#111827]' : 'border-slate-100 bg-slate-50 text-slate-300'
          }`}
        >
          <Icon size={12} className={on ? '' : 'grayscale opacity-40'} style={color && on ? { color } : undefined} />
          {label}
        </span>
      ))}
    </div>
  );
}

// Filled circle + white check — matches Interakt's Font Awesome
// `fa-check-circle` solid glyph exactly (a solid colored disc with a
// white checkmark cut out), rather than a plain outline check icon.
function CheckBadge({ color }) {
  return (
    <span
      className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full"
      style={{ backgroundColor: color }}
    >
      <Check className="h-[12px] w-[12px]" style={{ color: '#FFFFFF' }} strokeWidth={3.5} />
    </span>
  );
}

function Cell({ value, accent }) {
  if (value === true) return <CheckBadge color={ACCENT[accent].check} />;
  if (value === false) return <Minus className="w-4 h-4 mx-auto text-slate-300" strokeWidth={2} />;
  return <span className="text-[13px] font-semibold text-[#111827]">{value}</span>;
}

function resolveRowValue(row, planId) {
  if (typeof row.v === 'object' && row.v !== null) return row.v[planId];
  return row.v;
}

// Every "row" of the table is 5 grid children in a row (label cell + 4 plan
// cells) rendered in sequence — CSS Grid auto-flow lays them out left to
// right, wrapping to the next row automatically, so the DOM order below IS
// the visual grid. A category header instead renders ONE cell spanning all
// 5 columns (grid-column: 1 / -1), same idea as a table's colSpan.
const gridStyle = { gridTemplateColumns: `${LABEL_COL} repeat(${PRICING_PLANS.length}, 1fr)` };

export default function PricingTable() {
  const [billing, setBilling] = useState('yearly');
  const [openCategory, setOpenCategory] = useState(() =>
    Object.fromEntries(FEATURE_CATEGORIES.map((c) => [c.id, true]))
  );

  const toggleCategory = (id) => setOpenCategory((prev) => ({ ...prev, [id]: !prev[id] }));

  const popularIndex = PRICING_PLANS.findIndex((p) => p.popular);
  const popularPlan = PRICING_PLANS[popularIndex];
  const popularColor = popularPlan ? ACCENT[popularPlan.accent].check : null;

  return (
    <section className="pb-20 sm:pb-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Billing toggle — Monthly / Quarterly / Yearly pill switcher, same
            3-segment shape as Interakt's own toggle-switch-container. */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            {BILLING_OPTIONS.map((opt) => {
              const active = billing === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBilling(opt.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    active ? 'text-white shadow-sm' : 'text-slate-500 hover:text-[#111827]'
                  }`}
                  style={active ? { backgroundColor: '#05A68B' } : undefined}
                >
                  {opt.label}
                  {opt.badge && (
                    <span className={`text-[10px] font-bold ${active ? 'text-emerald-100' : 'text-orange-500'}`}>
                      {opt.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {billing === 'yearly' && (
          <p className="text-center text-sm mb-8">
            Save <span className="font-semibold text-[#05A68B]">{YEARLY_DISCOUNT_LABEL}</span> billed yearly. Discounted price shown below.
          </p>
        )}
        {billing === 'quarterly' && (
          <p className="text-center text-sm mb-8">
            Save <span className="font-semibold text-[#05A68B]">{QUARTERLY_DISCOUNT_LABEL}</span> billed quarterly.
          </p>
        )}
        {billing === 'monthly' && <div className="mb-8" />}

        {/* ── ONE continuous pricing table ──────────────────────────────
            Header, price, CTA, channels and every feature row all live in
            the SAME grid so each plan reads as one unbroken column, not a
            floating card sitting on top of a separate comparison table. */}
        <div className="relative overflow-x-auto -mx-4 px-4 pt-10 sm:mx-0 sm:px-0">
          <div className="relative" style={{ minWidth: 900 }}>
            <div
              className="grid rounded-xl border overflow-hidden"
              style={{ ...gridStyle, borderColor: GRID_LINE }}
            >
              {/* ── Row 1: plan header (name, tagline, price, seats, CTA) ── */}
              <div className="px-4 pb-5 flex flex-col justify-end">
                <p className="text-[17px] font-bold text-[#111827] leading-snug">
                  Find the right plan for your needs
                </p>
              </div>
              {PRICING_PLANS.map((plan) => {
                const a = ACCENT[plan.accent];
                const price = priceForBilling(plan, billing);
                return (
                  <div
                    key={plan.id}
                    className="px-4 pt-5 pb-5 flex flex-col justify-end border-l"
                    style={{ borderColor: GRID_LINE }}
                  >
                    <p className={`text-lg font-bold ${a.name}`}>{plan.name}</p>
                    <p className="mt-1 text-[13px] text-slate-500 font-normal leading-snug min-h-[36px]">{plan.tagline}</p>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-3xl font-extrabold text-[#111827] tabular-nums">{formatINR(price)}</span>
                      {price != null && <span className="text-sm text-slate-400 mb-1">/mo</span>}
                    </div>
                    {price != null && billing !== 'monthly' && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        billed {formatINR(price * (billing === 'yearly' ? 12 : 3))}/{billing === 'yearly' ? 'year' : 'quarter'}
                      </p>
                    )}
                    <span className="mt-2 flex items-center gap-1 text-[12px] text-slate-500">
                      {plan.seats}
                      <Info
                        className="h-3 w-3 text-slate-400 shrink-0"
                        strokeWidth={2}
                        title="Team members who can access this workspace"
                      />
                    </span>
                    <Link
                      href={plan.href}
                      target={plan.enterprise ? '_blank' : undefined}
                      rel={plan.enterprise ? 'noopener noreferrer' : undefined}
                      className="mt-4 block w-full rounded px-4 py-2.5 text-center text-sm font-bold transition-opacity hover:opacity-90"
                      style={{ backgroundColor: a.btnBg, color: a.btnText }}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                );
              })}

              {/* ── Channels row ── */}
              <div className="px-4 py-4 flex items-center border-t text-sm font-semibold text-[#111827]" style={{ borderColor: GRID_LINE }}>
                Channels
              </div>
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="px-4 py-4 flex items-center justify-center border-t border-l"
                  style={{ borderColor: GRID_LINE, backgroundColor: ACCENT[plan.accent].tint }}
                >
                  <ChannelChips channels={plan.channels} />
                </div>
              ))}

              {FEATURE_CATEGORIES.map((cat) => (
                <FeatureCategoryRows
                  key={cat.id}
                  category={cat}
                  open={openCategory[cat.id]}
                  onToggle={() => toggleCategory(cat.id)}
                />
              ))}
            </div>

            {/* Recommended-plan highlight — a border that wraps the ENTIRE
                Growth column (header through the last feature row), poking
                above the table's top edge, matching Interakt's "most
                popular" treatment. Rendered as an absolutely-positioned
                overlay (not a per-cell border) so it reads as one column,
                not a stack of individually-ringed boxes. */}
            {popularPlan && (
              <div
                className="absolute pointer-events-none rounded-xl"
                style={{
                  top: -17,
                  left: `calc(${LABEL_COL} + (100% - ${LABEL_COL}) * ${popularIndex} / ${PRICING_PLANS.length})`,
                  width: `calc((100% - ${LABEL_COL}) / ${PRICING_PLANS.length})`,
                  height: 'calc(100% + 17px)',
                  border: `2px solid ${popularColor}`,
                }}
              >
                <span
                  className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: popularColor }}
                >
                  Most Popular
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCategoryRows({ category, open, onToggle }) {
  return (
    <>
      <div className="border-t" style={{ borderColor: GRID_LINE, gridColumn: '1 / -1' }}>
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-2 bg-slate-50 px-4 py-2.5 text-left"
        >
          <span className="text-[13px] font-bold uppercase tracking-wide text-[#111827]">{category.label}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open &&
        category.rows.map((row) => (
          <RowCells key={row.label} row={row} />
        ))}
    </>
  );
}

function RowCells({ row }) {
  return (
    <>
      <div className="px-4 py-3 flex flex-col justify-center border-t text-[13px] text-[#374151]" style={{ borderColor: GRID_LINE }}>
        {row.label}
        {row.note && <span className="block text-[11px] text-[#05A68B] font-medium mt-0.5">{row.note}</span>}
      </div>
      {PRICING_PLANS.map((plan) => (
        <div
          key={plan.id}
          className="px-4 py-3 flex items-center justify-center border-t border-l"
          style={{ borderColor: GRID_LINE, backgroundColor: ACCENT[plan.accent].tint }}
        >
          <Cell value={resolveRowValue(row, plan.id)} accent={plan.accent} />
        </div>
      ))}
    </>
  );
}
