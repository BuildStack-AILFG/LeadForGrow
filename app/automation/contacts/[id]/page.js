'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/apiClient';
import LeadsSkeleton from '../../components/leads/LeadsSkeleton';
import { ArrowLeft, Building2, Mail, Phone } from 'lucide-react';

export default function ContactDetailPage() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    authFetch(`/api/automation/contacts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) setContact(d.data);
        else setError(d.error || 'Failed to load contact');
      })
      .catch(() => { if (!cancelled) setError('Could not reach the server'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  if (loading) return <LeadsSkeleton />;
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!contact) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Contact not found</div>;

  return (
    <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950 px-4 sm:px-6 py-6">
      <Link href="/automation/contacts" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Contacts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h1 className="text-xl font-bold">{contact.fullName}</h1>
          {contact.jobTitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{contact.jobTitle}</p>}
          <div className="mt-4 space-y-2 text-sm">
            {contact.emails?.map((e) => (
              <div key={e._id} className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Mail className="w-4 h-4" />{e.address}</div>
            ))}
            {contact.phones?.map((p) => (
              <div key={p._id} className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone className="w-4 h-4" />{p.number}</div>
            ))}
            {contact.companyId && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Building2 className="w-4 h-4" />
                <Link href={`/automation/companies/${contact.companyId._id || contact.companyId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {contact.companyId.name || 'Company'}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {contact.deals?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h2 className="font-semibold mb-3">Deals</h2>
              {contact.deals.map((d) => (
                <Link key={d._id} href={`/automation/deals/${d._id}`} className="block py-2 border-b last:border-0 text-sm hover:text-indigo-600 dark:hover:text-indigo-400">
                  {d.title} — {d.currency} {d.amount?.toLocaleString()}
                </Link>
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h2 className="font-semibold mb-3">Timeline</h2>
            <div className="space-y-3">
              {(contact.timeline || []).map((a) => (
                <div key={a._id} className="text-sm border-l-2 border-indigo-200 dark:border-indigo-800 pl-3 py-1">
                  <p className="text-slate-700 dark:text-slate-300">{a.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(a.performedAt).toLocaleString()}</p>
                </div>
              ))}
              {!contact.timeline?.length && <p className="text-sm text-slate-400">No activity yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
