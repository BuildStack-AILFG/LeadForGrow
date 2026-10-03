'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, ArrowRight, ShieldAlert, Mail } from 'lucide-react';
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

  const bootLoader = (
    <WorkspaceBootLoader
      complete={!checking}
      onFinished={() => setBootDone(true)}
    />
  );

  // Same slot as below so the loader keeps its progress when the workspace mounts.
  if (checking || (frozen && !bootDone)) return <>{null}{bootLoader}</>;

  // Hard kill switch — takes priority over plan. A frozen account gets a
  // full-stop screen no matter what plan it's on; nothing under /automation
  // renders. Distinct from the free-plan upsell below: this is not "upgrade
  // to unlock," it's "your access was turned off, contact us."
  if (frozen) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-canvas dark:bg-slate-900 rounded-lg shadow-modal p-10 text-center border border-line dark:border-slate-800">
            <div className="w-20 h-20 bg-danger rounded-lg flex items-center justify-center mx-auto mb-7">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl font-semibold text-fg dark:text-slate-50 mb-3">
              Your plan has ended
            </h1>
            <p className="text-base text-fg-secondary dark:text-fg-tertiary mb-2 leading-relaxed">
              This workspace has been paused and access to LeadForGrow is temporarily disabled.
            </p>
            <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mb-8">
              {frozenReason || 'Please renew your subscription or contact our team to restore access.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/918810873052"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-semibold transition-all"
              >
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp our team
              </a>
              <a
                href="mailto:hello@leadforgrow.com?subject=Renew%20my%20LeadForGrow%20plan"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-canvas dark:bg-slate-800 text-fg dark:text-slate-100 rounded-lg font-semibold border-2 border-line dark:border-slate-700 hover:border-line-strong dark:hover:border-slate-600 transition-all"
              >
                <Mail className="w-4 h-4" /> Email us
              </a>
            </div>

            <button
              type="button"
              onClick={() => router.push('/user/home')}
              className="mt-6 text-sm text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled"
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
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-2xl w-full my-6">
          <div className="bg-canvas dark:bg-slate-900 rounded-lg shadow-modal p-8 text-center border border-line dark:border-slate-800">
            <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-hero font-semibold text-fg dark:text-slate-50 mb-3">
              Automation Service
            </h1>
            <p className="text-base text-fg-secondary dark:text-fg-tertiary mb-5 max-w-md mx-auto">
              Unlock powerful lead management and automation features with the Growth plan or higher.
            </p>

            {userPlan && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted dark:bg-slate-800 rounded-lg mb-5">
                <span className="text-sm text-fg-tertiary font-medium">Current Plan:</span>
                <span className="text-sm text-fg dark:text-slate-100 font-semibold capitalize">{userPlan}</span>
              </div>
            )}

            <div className="bg-accent-subtle dark:from-indigo-950/40 dark:to-purple-950/30 rounded-lg p-6 mb-5 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-accent-fg dark:text-accent-fg" />
                <h3 className="text-lg font-semibold text-fg dark:text-slate-50">What you&apos;ll get:</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  'Complete lead management dashboard',
                  'Automated follow-up reminders',
                  'Team collaboration & assignment',
                  'WhatsApp & Email automation',
                  'Business insights & reports',
                  'Never miss a lead again'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-fg-secondary dark:text-fg-disabled font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => router.push('/user/home#pricing')}
                className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:shadow-modal transition-all flex items-center justify-center gap-2 group"
              >
                Upgrade to Growth Plan
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/user/home')}
                className="px-6 py-3 bg-canvas dark:bg-slate-800 text-fg dark:text-slate-100 rounded-lg font-semibold border-2 border-line dark:border-slate-700 hover:border-accent hover:bg-subtle dark:hover:bg-slate-800 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mount the workspace as soon as access is confirmed so its data requests
  // start right away; the loader stays on top only while it fades out.
  return (
    <>
      <div className="h-screen w-full">{children}</div>
      {!bootDone && bootLoader}
    </>
  );
}
