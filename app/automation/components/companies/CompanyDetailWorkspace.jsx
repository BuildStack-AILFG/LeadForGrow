'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  Users,
  Briefcase,
  IndianRupee,
  CheckSquare,
  Calendar,
  StickyNote,
  Paperclip,
  Activity,
  Pencil,
  Archive,
  Trash2,
  UserPlus,
  Plus,
  Upload,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import { useCompanyDetail } from '../../hooks/useCompanyDetail';
import LeadsSkeleton from '../leads/LeadsSkeleton';

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Other'];
const DEAL_STAGES = ['qualified', 'negotiation', 'won', 'lost'];

function ownerLabel(owner) {
  if (!owner) return 'Unassigned';
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return name || owner.email || 'Unassigned';
}

function formatCurrency(amount, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SectionCard({ title, icon: Icon, count, action, children, empty }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
          {count !== undefined && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">
        {empty ? <p className="text-sm text-slate-400 text-center py-4">{empty}</p> : children}
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

export default function CompanyDetailWorkspace({ companyId }) {
  const ws = useCompanyDetail(companyId);
  const fileRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  if (ws.loading) return <LeadsSkeleton />;
  if (!ws.company) {
    return <div className="p-8 text-center text-slate-500">Company not found</div>;
  }

  const c = ws.company;
  const summary = c.summary || {};
  const currency = summary.currency || 'INR';

  return (
    <div className="min-h-full bg-[#FAFDFA] dark:bg-slate-950">
      <div className="px-4 sm:px-6 py-5 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <Link href="/automation/companies" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-2">
              <ArrowLeft className="w-4 h-4" /> Companies
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{c.name}</h1>
                <p className="text-sm text-slate-500">{c.industry || 'No industry'} · Owner: {ownerLabel(c.ownerId)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => ws.setShowAddContact(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800">
              <UserPlus className="w-4 h-4" /> Add Contact
            </button>
            <button onClick={() => ws.setShowAddDeal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800">
              <Plus className="w-4 h-4" /> Add Deal
            </button>
            <button onClick={() => ws.setShowEdit(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 py-1">
                  <button onClick={() => { setMenuOpen(false); ws.archiveCompany(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                  <button onClick={() => { setMenuOpen(false); ws.deleteCompany(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Deals', value: summary.totalDeals ?? 0, icon: Briefcase },
            { label: 'Open Deals', value: summary.openDeals ?? 0, icon: Briefcase },
            { label: 'Pipeline Value', value: formatCurrency(summary.totalRevenue, currency), icon: IndianRupee },
            { label: 'Active Contacts', value: summary.activeContacts ?? 0, icon: Users },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wide">
                <kpi.icon className="w-3.5 h-3.5 text-emerald-600" />
                {kpi.label}
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left profile */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">About</h3>
              <dl className="space-y-2.5 text-sm">
                {c.website && (
                  <div>
                    <dt className="text-slate-400 text-xs">Website</dt>
                    <dd className="flex items-center gap-1 text-emerald-600 truncate">
                      <Globe className="w-3.5 h-3.5" />
                      <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="hover:underline truncate">
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    </dd>
                  </div>
                )}
                {c.email && (
                  <div>
                    <dt className="text-slate-400 text-xs">Email</dt>
                    <dd className="flex items-center gap-1 text-slate-700 dark:text-slate-300"><Mail className="w-3.5 h-3.5" />{c.email}</dd>
                  </div>
                )}
                {c.phone && (
                  <div>
                    <dt className="text-slate-400 text-xs">Phone</dt>
                    <dd className="flex items-center gap-1 text-slate-700 dark:text-slate-300"><Phone className="w-3.5 h-3.5" />{c.phone}</dd>
                  </div>
                )}
                {c.employeeCount && (
                  <div>
                    <dt className="text-slate-400 text-xs">Size</dt>
                    <dd className="text-slate-700 dark:text-slate-300">{c.employeeCount} employees</dd>
                  </div>
                )}
                {c.annualRevenue > 0 && (
                  <div>
                    <dt className="text-slate-400 text-xs">Annual Revenue</dt>
                    <dd className="text-slate-700 dark:text-slate-300">{formatCurrency(c.annualRevenue, c.revenueCurrency || currency)}</dd>
                  </div>
                )}
                {c.description && (
                  <div>
                    <dt className="text-slate-400 text-xs">Description</dt>
                    <dd className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{c.description}</dd>
                  </div>
                )}
              </dl>
            </div>

            <SectionCard title="Attachments" icon={Paperclip} count={c.attachments?.length || 0}
              action={
                <button onClick={() => fileRef.current?.click()} disabled={ws.uploading} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> {ws.uploading ? 'Uploading…' : 'Upload'}
                </button>
              }
              empty={!c.attachments?.length ? 'No attachments yet' : undefined}
            >
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => { ws.uploadAttachment(e.target.files?.[0]); e.target.value = ''; }} />
              <ul className="space-y-2">
                {(c.attachments || []).map((a) => (
                  <li key={a._id}>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 py-1">
                      <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{a.fileName}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                    </a>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          {/* Center */}
          <div className="xl:col-span-6 space-y-4">
            <SectionCard title="Contacts" icon={Users} count={c.contacts?.length || 0}
              action={<button onClick={() => ws.setShowAddContact(true)} className="text-xs font-medium text-emerald-600">+ Add</button>}
              empty={!c.contacts?.length ? 'No contacts linked yet' : undefined}
            >
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(c.contacts || []).map((contact) => (
                  <Link key={contact._id} href={`/automation/contacts/${contact._id}`} className="flex items-center justify-between py-2.5 group">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                        {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim()}
                      </p>
                      <p className="text-xs text-slate-400">{contact.jobTitle || contact.emails?.[0]?.address || contact.phones?.[0]?.number || '—'}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500" />
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Deals" icon={Briefcase} count={c.deals?.length || 0}
              action={<button onClick={() => ws.setShowAddDeal(true)} className="text-xs font-medium text-emerald-600">+ Add</button>}
              empty={!c.deals?.length ? 'No deals linked yet' : undefined}
            >
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(c.deals || []).map((deal) => (
                  <Link key={deal._id} href={`/automation/deals/${deal._id}`} className="flex items-center justify-between py-2.5 group">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">{deal.title}</p>
                      <p className="text-xs text-slate-400 capitalize">{deal.stage?.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(deal.amount, deal.currency || currency)}
                    </span>
                  </Link>
                ))}
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Open Tasks" icon={CheckSquare} count={c.tasks?.length || 0}
                empty={!c.tasks?.length ? 'No open tasks' : undefined}
              >
                <ul className="space-y-2">
                  {(c.tasks || []).map((t) => (
                    <li key={t._id} className="text-sm border-l-2 border-amber-300 pl-2.5 py-0.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{t.title}</p>
                      <p className="text-xs text-slate-400">Due {formatDateTime(t.dueDate)} · {ownerLabel(t.assignedTo)}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Meetings" icon={Calendar} count={c.meetings?.length || 0}
                empty={!c.meetings?.length ? 'No upcoming meetings' : undefined}
              >
                <ul className="space-y-2">
                  {(c.meetings || []).map((m) => (
                    <li key={m._id} className="text-sm border-l-2 border-teal-300 pl-2.5 py-0.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{m.guest?.name || 'Meeting'}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(m.startTime)} · {m.status}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>

            <SectionCard title="Notes" icon={StickyNote} count={c.notes?.length || 0}>
              <div className="flex gap-2 mb-3">
                <textarea
                  value={ws.noteText}
                  onChange={(e) => ws.setNoteText(e.target.value)}
                  placeholder="Write a note…"
                  rows={2}
                  className={`${inputCls} flex-1 resize-none`}
                />
                <button onClick={ws.addNote} disabled={ws.saving || !ws.noteText.trim()} className="self-end px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                  Add
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(c.notes || []).map((n) => (
                  <div key={n._id} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)} · {ownerLabel(n.createdBy)}</p>
                  </div>
                ))}
                {!c.notes?.length && <p className="text-sm text-slate-400 text-center py-2">No notes yet</p>}
              </div>
            </SectionCard>
          </div>

          {/* Right timeline */}
          <div className="xl:col-span-3">
            <SectionCard title="Activity Timeline" icon={Activity} count={c.timeline?.length || 0}
              empty={!c.timeline?.length ? 'No activity recorded' : undefined}
            >
              <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                {(c.timeline || []).map((a) => (
                  <div key={a._id} className="relative pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{a.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(a.performedAt)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={ws.showEdit} title="Edit Company" onClose={() => ws.setShowEdit(false)}
        footer={
          <>
            <button onClick={() => ws.setShowEdit(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button onClick={ws.saveEdit} disabled={ws.saving} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg disabled:opacity-50">Save</button>
          </>
        }
      >
        <div className="space-y-3">
          <input className={inputCls} placeholder="Company name *" value={ws.editForm.name} onChange={(e) => ws.setEditForm({ ...ws.editForm, name: e.target.value })} />
          <select className={inputCls} value={ws.editForm.industry} onChange={(e) => ws.setEditForm({ ...ws.editForm, industry: e.target.value })}>
            <option value="">Industry</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <input className={inputCls} placeholder="Website" value={ws.editForm.website} onChange={(e) => ws.setEditForm({ ...ws.editForm, website: e.target.value })} />
          <input className={inputCls} placeholder="Email" value={ws.editForm.email} onChange={(e) => ws.setEditForm({ ...ws.editForm, email: e.target.value })} />
          <input className={inputCls} placeholder="Phone" value={ws.editForm.phone} onChange={(e) => ws.setEditForm({ ...ws.editForm, phone: e.target.value })} />
          <input className={inputCls} placeholder="Employee count" value={ws.editForm.employeeCount} onChange={(e) => ws.setEditForm({ ...ws.editForm, employeeCount: e.target.value })} />
          <input className={inputCls} placeholder="Annual revenue" type="number" value={ws.editForm.annualRevenue} onChange={(e) => ws.setEditForm({ ...ws.editForm, annualRevenue: e.target.value })} />
          <textarea className={inputCls} placeholder="Description" rows={3} value={ws.editForm.description} onChange={(e) => ws.setEditForm({ ...ws.editForm, description: e.target.value })} />
        </div>
      </Modal>

      <Modal open={ws.showAddContact} title="Add Contact" onClose={() => ws.setShowAddContact(false)}
        footer={
          <>
            <button onClick={() => ws.setShowAddContact(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button onClick={ws.addContact} disabled={ws.saving} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg">Add Contact</button>
          </>
        }
      >
        <div className="space-y-3">
          <input className={inputCls} placeholder="First name *" value={ws.contactForm.firstName} onChange={(e) => ws.setContactForm({ ...ws.contactForm, firstName: e.target.value })} />
          <input className={inputCls} placeholder="Last name" value={ws.contactForm.lastName} onChange={(e) => ws.setContactForm({ ...ws.contactForm, lastName: e.target.value })} />
          <input className={inputCls} placeholder="Email" value={ws.contactForm.email} onChange={(e) => ws.setContactForm({ ...ws.contactForm, email: e.target.value })} />
          <input className={inputCls} placeholder="Phone" value={ws.contactForm.phone} onChange={(e) => ws.setContactForm({ ...ws.contactForm, phone: e.target.value })} />
        </div>
      </Modal>

      <Modal open={ws.showAddDeal} title="Add Deal" onClose={() => ws.setShowAddDeal(false)}
        footer={
          <>
            <button onClick={() => ws.setShowAddDeal(false)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button onClick={ws.addDeal} disabled={ws.saving} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg">Create Deal</button>
          </>
        }
      >
        <div className="space-y-3">
          <input className={inputCls} placeholder="Deal title *" value={ws.dealForm.title} onChange={(e) => ws.setDealForm({ ...ws.dealForm, title: e.target.value })} />
          <input className={inputCls} placeholder="Amount" type="number" value={ws.dealForm.amount} onChange={(e) => ws.setDealForm({ ...ws.dealForm, amount: e.target.value })} />
          <select className={inputCls} value={ws.dealForm.stage} onChange={(e) => ws.setDealForm({ ...ws.dealForm, stage: e.target.value })}>
            {DEAL_STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}