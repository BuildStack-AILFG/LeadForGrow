'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Bot as Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useAccess } from '../../context/AccessContext';

const TIER_COPY = {
  growth: { name: 'Growth', perks: ['Sequences', 'Advanced reports', 'Audit logs', 'Custom roles'] },
  scale: { name: 'Scale', perks: ['AI assistant', 'API keys', 'Webhooks', 'Multi-workspace'] },
  enterprise: { name: 'Enterprise', perks: ['SSO', 'IP restrictions', 'White-label', 'Dedicated support'] },
};

export default function UpgradeGateModal() {
  const { upgradeModal, closeUpgrade } = useAccess();
  const tier = TIER_COPY[upgradeModal.tier] || TIER_COPY.growth;

  return (
    <AnimatePresence>
      {upgradeModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeUpgrade}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-canvas dark:bg-slate-900 rounded-lg shadow-modal max-w-md w-full p-8 border border-line dark:border-slate-800"
          >
            <button
              type="button"
              onClick={closeUpgrade}
              className="absolute top-4 right-4 p-2 text-fg-tertiary hover:text-fg-secondary rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-lg bg-accent-subtle dark:bg-indigo-950/50 flex items-center justify-center mb-5">
              <Lock className="w-7 h-7 text-accent-fg" />
            </div>
            <h2 className="text-xl font-semibold text-fg dark:text-slate-50 mb-2">
              Upgrade to {tier.name}
            </h2>
            <p className="text-sm text-fg-tertiary mb-6">
              {upgradeModal.feature
                ? `"${upgradeModal.feature}" requires a higher plan.`
                : 'This feature is not included in your current plan.'}
            </p>
            <ul className="space-y-2 mb-8">
              {tier.perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-fg-secondary dark:text-fg-disabled">
                  <Sparkles className="w-4 h-4 text-accent-fg flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/automation/settings/billing"
              onClick={closeUpgrade}
              className="block w-full text-center py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm"
            >
              View plans & upgrade
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
