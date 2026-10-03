'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, Bell, X, Calendar, Clock, Volume2, MessageCircle, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';

// Session-scoped "snooze all" — persists across route changes but resets on page reload.
// Uses sessionStorage so poll intervals in a fresh mount still respect the choice.
const SNOOZE_KEY = 'lfg-reminders-snoozed';

function isSnoozedThisSession() {
    if (typeof window === 'undefined') return false;
    try { return sessionStorage.getItem(SNOOZE_KEY) === '1'; } catch { return false; }
}

function setSnoozedThisSession(v) {
    if (typeof window === 'undefined') return;
    try { v ? sessionStorage.setItem(SNOOZE_KEY, '1') : sessionStorage.removeItem(SNOOZE_KEY); } catch {}
}

export default function ReminderMonitor() {
    const [reminders, setReminders] = useState([]);
    const [activeCall, setActiveCall] = useState(null);
    const [snoozed, setSnoozed] = useState(false);
    const router = useRouter();
    const pollInterval = useRef(null);
    const notifiedTaskIds = useRef(new Set());
    const snoozedRef = useRef(false);

    const fetchDueTasks = async () => {
        if (snoozedRef.current) return; // user chose to silence for this session
        try {
            const res = await authFetch('/api/automation/tasks?status=pending');
            const data = await res.json();

            if (data.success) {
                const now = new Date();
                const upcomingTasks = data.data.filter(task => {
                    const dueDate = new Date(task.dueDate);
                    const diffInMins = (dueDate - now) / (1000 * 60);
                    return diffInMins <= 5;
                });

                const newTasks = upcomingTasks.filter(task => !notifiedTaskIds.current.has(task._id));

                if (newTasks.length > 0) {
                    setReminders(prev => [...prev, ...newTasks]);
                    newTasks.forEach(t => notifiedTaskIds.current.add(t._id));
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(() => { });
                }
            }
        } catch (error) {
            console.error('Reminder Poll Error:', error);
        }
    };

    useEffect(() => {
        const initialSnooze = isSnoozedThisSession();
        setSnoozed(initialSnooze);
        snoozedRef.current = initialSnooze;
        if (!initialSnooze) {
            fetchDueTasks();
            pollInterval.current = setInterval(fetchDueTasks, 30000);
        }
        return () => clearInterval(pollInterval.current);
    }, []);

    const dismissAll = () => {
        setReminders([]);
        setSnoozed(true);
        snoozedRef.current = true;
        setSnoozedThisSession(true);
        clearInterval(pollInterval.current);
    };

    const handleAction = async (task) => {
        const userId = getUserId();

        // 1. Execute Task Action
        if (task.type === 'call') {
            const bId = localStorage.getItem('businessId');
            const res = await authFetch('/api/automation/calls/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId, businessId: bId,
                    leadId: task.leadId?._id || task.leadId,
                    leadPhone: task.leadId?.phone || ''
                })
            });
            const result = await res.json();
            if (result.success) window.dispatchEvent(new CustomEvent('lfg-initiate-call', { detail: result.data }));
        } else if (task.type === 'whatsapp') {
            const phone = (task.leadId?.phone || '').replace(/\D/g, '');
            window.open(`https://wa.me/${phone}`, '_blank');
        } else if (task.type === 'email') {
            window.open(`mailto:${task.leadId?.email || ''}`, '_blank');
        }

        // 2. Mark task as completed
        await authFetch(`/api/automation/tasks/${task._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed', performedBy: userId })
        });

        dismissReminder(task._id);
    };

    const dismissReminder = (id) => {
        setReminders(prev => prev.filter(r => r._id !== id));
    };

    if (reminders.length === 0) return null;

    // Cap simultaneous popups so a backlog of overdue follow-ups doesn't flood the
    // screen — show the most urgent ones and summarize the rest instead of hiding them.
    const MAX_VISIBLE = 3;
    const sorted = [...reminders].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const visible = sorted.slice(0, MAX_VISIBLE);
    const overflowCount = sorted.length - visible.length;

    return (
        <div className="fixed top-[168px] right-4 z-40 flex flex-col gap-2.5 max-w-[300px] w-full pointer-events-none">
            <div className="pointer-events-auto flex justify-end">
                <button
                    onClick={dismissAll}
                    title="Silence all follow-up popups until you refresh the page"
                    className="inline-flex items-center gap-1 bg-slate-900/90 hover:bg-slate-900 text-white text-meta font-medium px-2 py-1 rounded-full shadow-popover"
                >
                    <X className="w-3 h-3" /> Dismiss all
                </button>
            </div>
            {overflowCount > 0 && (
                <div className="pointer-events-auto bg-accent text-white rounded-lg shadow-popover p-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold">+{overflowCount} more follow-up{overflowCount === 1 ? '' : 's'} need attention</span>
                    <button
                        onClick={() => router.push('/automation/tasks')}
                        className="shrink-0 bg-canvas/15 hover:bg-canvas/25 px-2.5 py-1 rounded text-meta font-medium transition-all"
                    >
                        View all
                    </button>
                </div>
            )}
            {visible.map((task) => (
                <div
                    key={task._id}
                    className="pointer-events-auto bg-canvas border-l-4 border-accent rounded-lg shadow-popover p-3 animate-in slide-in-from-right-10 duration-500 overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="bg-accent-subtle p-1.5 rounded-md text-accent-fg">
                                {task.type === 'call' && <Phone className="w-4 h-4" />}
                                {task.type === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
                                {task.type === 'email' && <Mail className="w-4 h-4" />}
                                {task.type !== 'call' && task.type !== 'whatsapp' && task.type !== 'email' && <Bell className="w-4 h-4" />}
                            </div>
                            <div>
                                <h4 className="text-dense font-semibold text-fg leading-tight">
                                    {task.type === 'call' ? 'Call Due' :
                                        task.type === 'whatsapp' ? 'WhatsApp Due' :
                                            task.type === 'email' ? 'Email Due' : 'Follow-up Due'}
                                </h4>
                                <p className="text-meta font-medium text-fg-tertiary">
                                    {task.leadId?.name || 'Scheduled Lead'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => dismissReminder(task._id)} className="p-1 hover:bg-subtle rounded-md transition-colors">
                            <X className="w-3.5 h-3.5 text-fg-tertiary" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3 text-meta font-medium text-fg-secondary">
                        <Calendar className="w-3 h-3 text-fg-tertiary" />
                        <span>Today, {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex gap-1.5">
                        <button
                            onClick={() => handleAction(task)}
                            className="flex-1 bg-accent text-white py-1.5 rounded text-meta font-semibold flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-all"
                        >
                            {task.type === 'call' && <><Phone className="w-3 h-3" /> Call Now</>}
                            {task.type === 'whatsapp' && <><MessageCircle className="w-3 h-3" /> Send Message</>}
                            {task.type === 'email' && <><Mail className="w-3 h-3" /> Send Email</>}
                            {task.type !== 'call' && task.type !== 'whatsapp' && task.type !== 'email' && <>Mark Done</>}
                        </button>
                        <button
                            onClick={() => {
                                router.push(`/automation/leads/${task.leadId?._id || task.leadId}`);
                                dismissReminder(task._id);
                            }}
                            className="px-3 py-1.5 border border-line text-fg-secondary rounded-md text-meta font-medium hover:bg-subtle transition-all"
                        >
                            View Lead
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
