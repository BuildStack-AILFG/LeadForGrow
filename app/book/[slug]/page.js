'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Video,
  Mail,
} from 'lucide-react';
import { MEETING_CATEGORY_LABELS } from '@/lib/meetings/constants';

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step, setStep] = useState('calendar');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    if (slug) fetchMeeting();
  }, [slug]);

  async function fetchMeeting() {
    try {
      const res = await fetch(`/api/meetings/public?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Not found');
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const slotsByDate = useMemo(() => {
    const map = {};
    (data?.slots || []).forEach((s) => {
      const d = new Date(s.start).toDateString();
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return map;
  }, [data?.slots]);

  const daysInMonth = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const days = [];
    const startPad = (first.getDay() + 6) % 7;
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(y, m, d));
    }
    return days;
  }, [calendarMonth]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !form.name) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/meetings/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          startTime: selectedSlot.start,
          guest: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            whatsapp: form.phone,
            notes: form.notes,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBooked(json.data);
        setStep('success');
      } else {
        toast.error(json.error || 'Booking failed');
      }
    } catch {
      toast.error('Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa] p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Page unavailable</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const { meetingType, business, host } = data;
  const accent = meetingType.branding?.accentColor || '#4338ca';

  if (step === 'success' && booked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa] p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-[28px] shadow-2xl max-w-md w-full text-center border border-slate-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re scheduled!</h1>
          <p className="text-slate-600 mb-6">{booked.meetingTitle}</p>
          <p className="text-sm text-slate-500 mb-4">
            {new Date(booked.startTime).toLocaleString('en-IN', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          {booked.emailSent && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-700 bg-indigo-50 py-3 px-4 rounded-xl mb-3">
              <Mail className="w-4 h-4" />
              Confirmation email sent
            </div>
          )}
          {booked.whatsappSent !== false && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 py-3 px-4 rounded-xl mb-4">
              <MessageCircle className="w-4 h-4" />
              WhatsApp confirmation sent
            </div>
          )}
          {booked.meetingLink && (
            <a
              href={booked.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl mb-3"
              style={{ backgroundColor: accent }}
            >
              <Video className="w-4 h-4" /> Join meeting
            </a>
          )}
          <p className="text-xs text-slate-400 mt-4">Check your inbox (and spam) · Reminders via email & WhatsApp before start</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col lg:flex-row">
        {/* Left panel */}
        <div
          className="lg:w-[38%] p-8 lg:p-10 text-white flex flex-col"
          style={{ background: `linear-gradient(165deg, ${accent} 0%, #1e1b4b 100%)` }}
        >
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-4">
              {business?.businessName || 'LeadForGrow'}
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-3">{meetingType.title}</h1>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              {meetingType.description || meetingType.branding?.welcomeMessage || 'Book a time that works for you. We will confirm instantly on WhatsApp.'}
            </p>
            <div className="space-y-3 text-sm text-white/90">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 opacity-80" />
                {meetingType.durationMinutes} minutes
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 opacity-80" />
                {meetingType.availabilityRules?.timezone || 'Asia/Kolkata'}
              </div>
              <div className="flex items-center gap-3 capitalize">
                <Calendar className="w-4 h-4 opacity-80" />
                {MEETING_CATEGORY_LABELS[meetingType.category] || meetingType.category}
              </div>
            </div>
          </div>
          {host && (
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-xs text-white/60 mb-1">Hosted by</p>
              <p className="font-semibold">{host.name}</p>
            </div>
          )}
          <p className="text-[10px] text-white/40 mt-6">Powered by LeadForGrow Revenue Scheduling</p>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white lg:rounded-l-none flex flex-col">
          <div className="p-6 sm:p-8 flex-1">
            <AnimatePresence mode="wait">
              {step === 'calendar' && (
                <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Select a date & time</h2>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
                      }
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-slate-800">
                      {calendarMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
                      }
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400 mb-2">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-6">
                    {daysInMonth.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} />;
                      const key = day.toDateString();
                      const hasSlots = slotsByDate[key]?.length > 0;
                      const sel = selectedDate?.toDateString() === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={!hasSlots}
                          onClick={() => {
                            setSelectedDate(day);
                            setSelectedSlot(null);
                          }}
                          className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                            sel
                              ? 'text-white shadow-md'
                              : hasSlots
                                ? 'text-slate-800 hover:bg-indigo-50'
                                : 'text-slate-300 cursor-not-allowed'
                          }`}
                          style={sel ? { backgroundColor: accent } : {}}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDate && (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Available times</p>
                      {(slotsByDate[selectedDate.toDateString()] || []).map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all hover:shadow-sm ${
                            selectedSlot?.start === slot.start
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                              : 'border-slate-200 hover:border-indigo-300 text-slate-800'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedSlot && (
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="w-full mt-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-transform hover:scale-[1.01]"
                      style={{ backgroundColor: accent }}
                    >
                      Continue
                    </button>
                  )}
                </motion.div>
              )}

              {step === 'form' && (
                <motion.div key="form" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                  <button
                    type="button"
                    onClick={() => setStep('calendar')}
                    className="text-sm text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Your details</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    {selectedSlot?.label} — confirmation via email & WhatsApp.
                  </p>
                  <form onSubmit={handleBook} className="space-y-4">
                    <input
                      required
                      placeholder="Full name *"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email *"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                    <input
                      required
                      placeholder="WhatsApp / Phone *"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                    <textarea
                      placeholder="Anything we should know?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none outline-none"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ backgroundColor: accent }}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          Confirm & send WhatsApp
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
