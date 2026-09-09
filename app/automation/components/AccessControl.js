'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight, ShieldAlert, MessageCircle, Mail } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import WorkspaceBootLoader from './WorkspaceBootLoader';

export default function AccessControl({ children }) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [bootDone, setBootDone] = useState(false);
  const [userPlan, setUserPlan] = useState('');
  const [frozen, setFrozen] = useState(false);
  const [frozenReason, setFrozenReason] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      const userId = localStorage.getItem('userid');
      let plan = localStorage.getItem('userPlan') || '';
      let isFrozen = localStorage.getItem('accountFrozen') === 'true';
      let reason = localStorage.getItem('accountFrozenReason') || '';

      if (userId) {
        try {
          const res = await authFetch('/api/auth/me');
          const data = await res.json();
          if (data.success) {
            plan = data.data.plan || plan;
            localStorage.setItem('userPlan', plan);
            isFrozen = data.data.frozen === true;
            reason = data.data.frozenReason || '';
            localStorage.setItem('accountFrozen', String(isFrozen));
            localStorage.setItem('accountFrozenReason', reason);
            // Force-rotate gate — if the user closed the browser mid-rotation
            // and came back with a still-valid access token, /me tells us the
            // server flag is still set. Bounce them back to /rotate-password
            // before rendering any authenticated content.
            // Skip Google-auth users: they have no password to rotate, and
            // /rotate-password would crash bcrypt on undefined password.
            if (data.data.mustRotatePassword && data.data.authProvider !== 'google') {
              router.replace('/rotate-password');
              return;
            }
          }
        } catch { /* use cached plan/frozen state */ }
      }

      setUserPlan(plan);
      setFrozen(isFrozen);
      setFrozenReason(reason);
      const lowerPlan = (plan || '').toLowerCase();
      const isFree = lowerPlan === 'free' || !lowerPlan;
      setHasAccess(!isFree);
      setChecking(false);
    };
    checkAccess();
  }, []);

  if (checking || ((hasAccess || frozen) && !bootDone)) {
    return (
      <WorkspaceBootLoader
        complete={!checking}
        onFinished={() => setBootDone(true)}
      />
    );
  }

  // Hard kill switch — takes priority over plan. A frozen account gets a
  // full-stop screen no matter what plan it's on; nothing under /automation
  // renders. Distinct from the free-plan upsell below: this is not "upgrade
  // to unlock," it's "your access was turned off, contact us."
  if (frozen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-10 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-7 shadow-xl shadow-red-200 dark:shadow-red-950/50">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">
              Your plan has ended
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              This workspace has been paused and access to LeadForGrow is temporarily disabled.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
              {frozenReason || 'Please renew your subscription or contact our team to restore access.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/918810873052"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold transition-all"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp our team
              </a>
              <a
                href="mailto:hello@leadforgrow.com?subject=Renew%20my%20LeadForGrow%20plan"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl font-semibold border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-all"
              >
                <Mail className="w-4 h-4" /> Email us
              </a>
            </div>

            <button
              type="button"
              onClick={() => router.push('/user/home')}
              className="mt-6 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-12 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 dark:shadow-indigo-950/50">
              <Lock className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Automation Service
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Unlock powerful lead management and automation features with the Growth plan or higher.
            </p>

            {userPlan && (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8">
                <span className="text-sm text-slate-500 font-medium">Current Plan:</span>
                <span className="text-sm text-slate-900 dark:text-slate-100 font-bold capitalize">{userPlan}</span>
              </div>
            )}

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 rounded-2xl p-8 mb-8 text-left">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">What you&apos;ll get:</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Complete lead management dashboard',
                  'Automated follow-up reminders',
                  'Team collaboration & assignment',
                  'WhatsApp & Email automation',
                  'Business insights & reports',
                  'Never miss a lead again'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => router.push('/user/home#pricing')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-indigo-200 dark:hover:shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 group"
              >
                Upgrade to Growth Plan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/user/home')}
                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl font-bold text-lg border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.985 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="h-screen w-full"
    >
      {children}
    </motion.div>
  );
}
