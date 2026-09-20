'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, X } from 'lucide-react';
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeUpgrade}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              onClick={closeUpgrade}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center mb-5">
              <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Upgrade to {tier.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {upgradeModal.feature
                ? `"${upgradeModal.feature}" requires a higher plan.`
                : 'This feature is not included in your current plan.'}
            </p>
            <ul className="space-y-2 mb-8">
              {tier.perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/automation/settings/billing"
              onClick={closeUpgrade}
              className="block w-full text-center py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm"
            >
              View plans & upgrade
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
