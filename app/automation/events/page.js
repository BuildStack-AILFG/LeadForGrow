"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import {
    Calendar,
    Plus,
    Search,
    Users,
    TrendingUp,
    QrCode,
    ExternalLink,
    MoreVertical,
    ChevronRight,
    X,
    Loader2,
    Copy,
    Check,
    AlertCircle
} from 'lucide-react';

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [forms, setForms] = useState([]);
    const [sequences, setSequences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [selectedEventForQr, setSelectedEventForQr] = useState(null);
    const [customBaseUrl, setCustomBaseUrl] = useState('');

    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        date: '',
        formId: '',
        sequenceId: '',
        location: ''
    });

    const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : null;

    useEffect(() => {
        if (!businessId) return;
        fetchData();
    }, [businessId]);

    async function fetchData() {
        try {
            const resp = await authFetch(`/api/automation/events?businessId=${businessId}`);
            const data = await resp.json();
            if (data.success) setEvents(data.data);

            const fResp = await authFetch(`/api/forms?businessId=${businessId}`);
            const fData = await fResp.json();
            if (fData.success) setForms(fData.data);

            const sResp = await authFetch(`/api/automation/sequences?businessId=${businessId}`);
            const sData = await sResp.json();
            if (sData.success) setSequences(sData.data);
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateEvent(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const resp = await authFetch('/api/automation/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newEvent, businessId })
            });
            const data = await resp.json();
            if (data.success) {
                setIsModalOpen(false);
                setNewEvent({ name: '', description: '', date: '', formId: '', sequenceId: '', location: '' });
                fetchData();
            }
        } catch (e) {
            toast.error('Failed to create event');
        } finally {
            setIsSubmitting(false);
        }
    }

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getEventURL = (formToken, eventId) => {
        const baseUrl = customBaseUrl || window.location.origin;
        const token = typeof formToken === 'object' ? formToken.token : formToken;
        return `${baseUrl}/f/${token}?eventId=${eventId}`;
    };

    useEffect(() => {
        // Try to detect local network IP hints if needed, but simple state is better
        if (typeof window !== 'undefined' && !customBaseUrl) {
            setCustomBaseUrl(window.location.origin);
        }
    }, []);

    if (loading) {
        return (
            <PageLoader label="Loading events…" height="80vh" />
        );
    }

    return (
        <div className="px-8 py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">Events & Sessions</h1>
                        <p className="text-xs text-slate-500 font-medium">Monitor live customer interactions and session data</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Create New Event
                </button>
            </div>

            <AutoPageIntro />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-sm font-medium">Total Event Leads</span>
                        <div className="bg-indigo-50 p-2 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        {events.reduce((acc, ev) => acc + (ev.leadCount || 0), 0)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Across all events</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-sm font-medium">Conversions</span>
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        {events.reduce((acc, ev) => acc + (ev.conversionCount || 0), 0)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Overall conversion performance</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-sm font-medium">Active Events</span>
                        <div className="bg-teal-50 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-teal-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{events.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Currently tracked</div>
                </div>
            </div>

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">New Event Session</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Event Name*</label>
                                <input
                                    required
                                    type="text"
                                    value={newEvent.name}
                                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                                    placeholder="e.g. Founder's Meet Kolkata"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                                    <input
                                        type="text"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        placeholder="City / Venue"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Link to Lead Form*</label>
                                <select
                                    required
                                    value={newEvent.formId}
                                    onChange={(e) => setNewEvent({ ...newEvent, formId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select a form</option>
                                    {forms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Automation Sequence (Optional)</label>
                                <select
                                    value={newEvent.sequenceId}
                                    onChange={(e) => setNewEvent({ ...newEvent, sequenceId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">No follow-up sequence</option>
                                    {sequences.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Events Table/List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Event Name</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Leads</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.length === 0 ? (
                                <tr className="group/row">
                                    <td colSpan="5" className="px-8 py-20 text-left">
                                        <div className="flex flex-col items-start gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                                <Calendar className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">No events found</p>
                                                <p className="text-[11px] text-slate-400 mt-1">Create your first session to start tracking leads and conversions.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : events.map((event) => (
                                <tr key={event._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link href={`/automation/leads?eventId=${event._id}`} className="hover:underline">
                                            <div className="font-medium text-slate-900">{event.name}</div>
                                        </Link>
                                        <div className="text-xs text-slate-500">{event.location || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {new Date(event.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/automation/leads?eventId=${event._id}`} className="flex flex-col hover:bg-slate-100 p-1 rounded transition-colors">
                                            <span className="font-semibold text-slate-900">{event.leadCount || 0}</span>
                                            <span className="text-[10px] text-emerald-600">{event.conversionCount || 0} converted</span>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight
                      ${event.active !== false
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-700'}
                    `}>
                                            <span className={`w-1 h-1 rounded-full ${event.active !== false ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                            {event.active !== false ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedEventForQr(event)}
                                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                                                title="View QR Code"
                                            >
                                                <QrCode className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => window.open(getEventURL(event.formId, event._id), '_blank')}
                                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                                                title="Open Form"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(getEventURL(event.formId, event._id), event._id)}
                                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-slate-900"
                                                title="Copy Link"
                                            >
                                                {copiedId === event._id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* QR CODE MODAL */}
            {selectedEventForQr && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Scan to Register</h3>
                            <button onClick={() => setSelectedEventForQr(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-10 flex flex-col items-center text-center">
                            <div className="w-full mb-6">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 text-left">Generated Link Base URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customBaseUrl}
                                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="http://192.168.x.x:3000"
                                    />
                                </div>
                                {customBaseUrl.includes('localhost') && (
                                    <p className="text-[10px] text-amber-600 mt-2 text-left flex gap-1 items-start">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                        <span>Warning: Phones cannot reach 'localhost'. Use your computer's IP address (e.g. 192.168.x.x) if testing on mobile.</span>
                                    </p>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm mb-6">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getEventURL(selectedEventForQr.formId, selectedEventForQr._id))}`}
                                    alt="Event QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-1">{selectedEventForQr.name}</h4>
                            <p className="text-sm text-slate-500 mb-8">Attendees can scan this to fill the registration form.</p>

                            <button
                                onClick={() => {
                                    copyToClipboard(getEventURL(selectedEventForQr.formId, selectedEventForQr._id), 'qr-modal');
                                }}
                                className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
                            >
                                {copiedId === 'qr-modal' ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Form Link</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
