'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, X, Minus, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

export default function LiveDialer({ callData, onHangup }) {
    const [status, setStatus] = useState('connecting'); // connecting, live, ended
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [followUpTime, setFollowUpTime] = useState('');
    const vapiClient = useRef(null);
    const twilioDevice = useRef(null);

    useEffect(() => {
        if (callData.provider === 'vapi') {
            initVapi();
        } else if (callData.provider === 'twilio') {
            initTwilio();
        }

        return () => {
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callData]);

    // Timer effect keyed to status so it starts ticking when the call goes live
    useEffect(() => {
        if (status !== 'live') return undefined;
        const timer = setInterval(() => setDuration((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [status]);

    // When the in-app voice dialer can't run (no Vapi key, no mic, init error),
    // fall back to the device dialpad so the user can still place the call.
    const fallbackToDialpad = (reason) => {
        const number = callData.leadPhone
            || callData.config?.recipientPhoneNumber
            || callData.recipientPhone;
        const tel = String(number || '').replace(/[^\d+]/g, '');
        if (tel) {
            toast(`Opening dialpad to call ${number}`, { icon: '📞' });
            window.location.href = `tel:${tel}`;
        } else {
            toast.error(reason || 'No phone number to call');
        }
        onHangup();
    };

    const initVapi = async () => {
        try {
            // No AI voice key configured → just open the phone dialpad.
            if (!callData.apiKey) {
                fallbackToDialpad();
                return;
            }

            // Check for microphone support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                fallbackToDialpad('Microphone not supported — opening dialpad');
                return;
            }

            const Vapi = (await import('@vapi-ai/web')).default;
            vapiClient.current = new Vapi(callData.apiKey);

            setStatus('connecting');

            await vapiClient.current.start({
                assistantId: callData.assistantId,
                assistantOverrides: {
                    variableValues: { recipientPhone: callData.config.recipientPhoneNumber }
                }
            });

            setStatus('live');
        } catch (error) {
            console.error('[Global Dialer] Vapi Init Error:', error);
            // Any dialer failure → fall back to the device dialpad instead of erroring.
            fallbackToDialpad('Voice dialer unavailable — opening dialpad');
        }
    };

    const initTwilio = async () => {
        try {
            const { Device } = await import('@twilio/voice-sdk');
            twilioDevice.current = new Device(callData.token, {
                codecPreferences: ['opus', 'pcmu'],
                fakeLocalAudio: false,
                enableIceRestart: true,
            });

            twilioDevice.current.on('registered', () => {
                setStatus('connecting');
                const call = twilioDevice.current.connect({
                    params: { To: callData.leadPhone }
                });

                call.on('accept', () => setStatus('live'));
                call.on('disconnect', () => handleEndCall());
                call.on('error', (err) => {
                    console.error('Twilio Call Error:', err);
                    handleEndCall();
                });
            });

            await twilioDevice.current.register();
        } catch (error) {
            console.error('Twilio Init Error:', error);
            toast.error('Failed to initiate Twilio call');
            onHangup();
        }
    };

    const handleEndCall = async () => {
        setSavingNotes(true);
        try {
            // Save notes to backend before closing
            const bId = localStorage.getItem('businessId');
            const uId = localStorage.getItem('userid');
            await authFetch('/api/automation/calls/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: bId,
                    userId: uId,
                    leadId: callData.leadId || callData.config?.leadId || window.location.pathname.split('/').pop(),
                    notes: notes,
                    followUpTime: followUpTime,
                    duration: duration,
                    provider: callData.provider
                })
            });
        } catch (err) {
            console.error('Failed to save notes:', err);
        }
        setSavingNotes(false);
        onHangup();
    };

    const cleanup = () => {
        if (vapiClient.current) vapiClient.current.stop();
        if (twilioDevice.current) twilioDevice.current.destroy();
    };

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-[100] bg-indigo-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-indigo-700 transition-all"
                onClick={() => setIsMinimized(false)}>
                <Phone className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-bold">{formatTime(duration)}</span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-96 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Connection</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsMinimized(true)} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                        <Minus className="w-4 h-4" />
                    </button>
                    <button onClick={handleEndCall} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 text-center bg-gradient-to-b from-white to-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Phone className={`w-6 h-6 ${status === 'connecting' ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full font-mono text-lg font-bold tracking-tighter shadow-lg">
                        {formatTime(duration)}
                    </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-0.5 text-left">On Call Discussion</h3>
                <p className="text-xs font-medium text-slate-500 mb-4 text-left">{status === 'connecting' ? 'Dialing...' : 'Live using ' + callData.provider.toUpperCase()}</p>

                {/* Notes Section */}
                <div className="mb-4">
                    <textarea
                        placeholder="Write important notes here while discussing..."
                        className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Reschedule Section */}
                <div className="mb-6">
                    {!showReschedule ? (
                        <button
                            onClick={() => setShowReschedule(true)}
                            className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-4 h-4" />
                            Schedule Call-back
                        </button>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reschedule Call</span>
                                <button onClick={() => setShowReschedule(false)} className="text-slate-400 hover:text-slate-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-bold text-indigo-600 outline-none"
                                value={followUpTime}
                                onChange={(e) => setFollowUpTime(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs ${isMuted ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {isMuted ? 'Muted' : 'Mute'}
                    </button>

                    <button
                        onClick={handleEndCall}
                        disabled={savingNotes}
                        className="flex-[1.5] flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-[18px] hover:bg-rose-700 transition-all shadow-sm font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                        <PhoneOff className="w-4 h-4" />
                        {savingNotes ? 'Saving...' : 'End Call'}
                    </button>

                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl outline-none">
                        <Volume2 className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Footer / Status */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                    Auto-Recording
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes sync active</span>
            </div>
        </div>
    );
}
