import { PRICING_ADDONS, formatINR } from './pricingData';

/**
 * Pay-as-you-grow add-ons — stack on top of any paid plan so a team that's
 * close to a limit can buy a bit more headroom instead of jumping a whole
 * tier. Sits directly under the comparison table, same white page background.
 */
export default function PricingAddOns() {
  return (
    <section className="pb-20 sm:pb-28 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
            Add-ons
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-[#111827]">
            Need a little more? Add it, don&apos;t upgrade.
          </h2>
          <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
            Stack these on any paid plan any time — no need to jump a whole tier just for extra headroom.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {PRICING_ADDONS.map((addon) => (
            <div
              key={addon.id}
              className="rounded-xl border border-slate-200 bg-white px-6 py-6 flex flex-col items-start"
            >
              <p className="text-base font-bold text-[#111827]">{addon.name}</p>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{addon.description}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-2xl font-extrabold text-[#05A68B] tabular-nums">{formatINR(addon.price)}</span>
                <span className="text-sm text-slate-400 mb-0.5">{addon.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
