'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch, authJson } from '@/lib/apiClient';
import { BILLING_PLANS } from '@/lib/billing/plans';

function UsageBar({ label, used, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const warn = pct >= 85;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-fg-secondary">{label}</span>
        <span className={warn ? 'text-warning font-medium' : 'text-fg-tertiary'}>
          {used} / {max >= 999999 ? '∞' : max}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${warn ? 'bg-warning' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingSettingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authJson('/api/billing/status');
      if (data.success) setBilling(data.data);
    } catch {
      toast.error('Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (searchParams.get('success')) toast.success('Payment successful — plan updating…');
    if (searchParams.get('canceled')) toast.error('Checkout canceled');
  }, [load, searchParams]);

  const startCheckout = async (planId, provider) => {
    setCheckoutLoading(`${planId}-${provider}`);
    try {
      const res = await authFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, provider }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (provider === 'stripe' && data.url) {
        window.location.href = data.url;
      } else if (provider === 'razorpay' && data.shortUrl) {
        window.open(data.shortUrl, '_blank');
      }
    } catch (e) {
      toast.error(e.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    try {
      const res = await authFetch('/api/billing/status', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Portal unavailable');
    } catch {
      toast.error('Could not open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = billing?.plan || 'free';
  const quotas = billing?.quotas || {};
  const usage = billing?.usage || {};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-fg">Billing & Subscription</h1>
        <p className="text-fg-tertiary mt-1">Manage your plan, usage, and invoices</p>
      </div>

      <div className="bg-canvas border border-line rounded-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-fg-tertiary">Current plan</p>
            <p className="text-xl font-semibold capitalize text-fg">{plan}</p>
            {billing?.subscription?.status && (
              <p className="text-sm text-fg-tertiary mt-1">Status: {billing.subscription.status}</p>
            )}
          </div>
          {billing?.subscription?.stripeCustomerId && (
            <button
              type="button"
              onClick={openPortal}
              className="px-4 py-2 text-sm font-medium border border-line rounded-lg hover:bg-subtle"
            >
              Manage subscription
            </button>
          )}
        </div>
      </div>

      <div className="bg-canvas border border-line rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-fg">Usage this month</h2>
        <UsageBar label="Leads" used={usage.leads || 0} max={quotas.maxLeadsPerMonth || 50} />
        <UsageBar label="Forms" used={usage.formsCreated || 0} max={quotas.maxForms || 1} />
        <UsageBar label="Team seats" used={usage.teamMembers || 1} max={quotas.maxTeamMembers || 1} />
        {(usage.leads || 0) / (quotas.maxLeadsPerMonth || 50) >= 0.85 && (
          <p className="text-sm text-warning bg-warning-subtle border border-warning/30 rounded-lg p-3">
            You&apos;re approaching your lead limit. Upgrade to avoid ingestion blocks.
          </p>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-fg mb-4">Upgrade plan</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.values(BILLING_PLANS)
            .filter((p) => p.id !== 'free')
            .map((p) => (
              <div key={p.id} className="bg-canvas border border-line rounded-lg p-5 flex flex-col">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-2xl font-semibold mt-2">
                  ₹{p.priceInr.toLocaleString('en-IN')}
                  <span className="text-sm font-normal text-fg-tertiary">/mo</span>
                </p>
                <ul className="text-sm text-fg-secondary mt-4 space-y-1 flex-1">
                  <li>{p.quotas.maxLeadsPerMonth >= 999999 ? 'Unlimited' : p.quotas.maxLeadsPerMonth} leads/mo</li>
                  <li>{p.quotas.maxTeamMembers} team seats</li>
                  <li>{p.quotas.maxWhatsappConversations >= 999999 ? 'Unlimited' : p.quotas.maxWhatsappConversations} WA chats</li>
                </ul>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    disabled={plan === p.id || checkoutLoading}
                    onClick={() => startCheckout(p.id, 'razorpay')}
                    className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50"
                  >
                    {checkoutLoading === `${p.id}-razorpay` ? 'Loading…' : 'Pay with Razorpay'}
                  </button>
                  <button
                    type="button"
                    disabled={plan === p.id || checkoutLoading}
                    onClick={() => startCheckout(p.id, 'stripe')}
                    className="w-full py-2.5 border border-line text-sm font-medium rounded-lg hover:bg-subtle disabled:opacity-50"
                  >
                    Pay with Stripe
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {billing?.invoices?.length > 0 && (
        <div className="bg-canvas border border-line rounded-lg p-6">
          <h2 className="font-semibold text-fg mb-4">Invoice history</h2>
          <div className="divide-y divide-line">
            {billing.invoices.map((inv) => (
              <div key={inv._id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{inv.currency} {inv.amount}</p>
                  <p className="text-fg-tertiary">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="capitalize px-2 py-1 rounded bg-muted text-fg-secondary">{inv.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
