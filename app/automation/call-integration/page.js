'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PhoneCall,
  Settings,
  RefreshCcw,
  Play,
  Phone,
  PhoneOff,
  Trash2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  PhoneMissed,
  Cpu,
  MessageSquare,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import { useConfirm } from '@/app/components/ConfirmProvider';

export default function CallIntegrationPage() {
  const confirm = useConfirm();
  const [usage, setUsage] = useState({
    callbacksUsed: 0,
    maxCallbacks: 50,
    secondsUsed: 0,
    maxSeconds: 3000,
    limitReached: false,
    connectedPhone: ''
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [testNumber, setTestNumber] = useState('');
  const [showCarrierHelp, setShowCarrierHelp] = useState(false);
  const [bridgeSimNumber, setBridgeSimNumber] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState({
    enabled: true,
    voiceId: 'en-US-Neural2-F',
    recordCalls: false,
    greetingMessage: 'Hello, I am the AI assistant.',
    enableSmsFollowup: true,
    telephony: {
      provider: 'vapi',
      apiKey: '',
      assistantId: '',
      phoneNumberId: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [missedCalls, setMissedCalls] = useState([]);
  const [verifying, setVerifying] = useState(false);

  const fetchUsage = useCallback(async () => {
    try {
      let bId = localStorage.getItem('businessId');

      if (!bId) {
        const authRes = await authFetch('/api/auth/me');
        const authData = await authRes.json();
        if (authData.success) {
          bId = authData.data.businessId;
          localStorage.setItem('businessId', bId);
        }
      }

      if (!bId) return;

      const res = await authFetch(`/api/automation/call-integration?businessId=${bId}`);
      const result = await res.json();

      if (result.success && result.data) {
        setUsage(prev => ({
          ...prev,
          ...result.data,
          maxCallbacks: 50,
          maxSeconds: 3000
        }));
        setMissedCalls(result.data.missedCalls || []);
        if (result.data.connectedPhone) {
          setPhoneInput(result.data.connectedPhone);
          // If we have a connected phone, move to at least Step 2
          if (result.data.settings?.telephony?.apiKey) {
            setWizardStep(4);
          } else {
            setWizardStep(2);
          }
        } else {
          setWizardStep(1);
        }
        if (result.data.settings) {
          setSettings(result.data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleVerifyCredentials = async () => {
    setVerifying(true);
    const tid = toast.loading('Verifying credentials...');
    try {
      const res = await authFetch('/api/automation/call-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          provider: settings.telephony.provider,
          credentials: settings.telephony
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Connection Verified!', { id: tid });
        setWizardStep(4);
        handleSaveSettings(); // Auto-save on success
      } else {
        toast.error(result.error || 'Verification failed. Check your keys.', { id: tid });
      }
    } catch (err) {
      toast.error('Network error during verification', { id: tid });
    } finally {
      setVerifying(false);
    }
  };

  const handleTriggerAI = async (missedCallId) => {
    const tid = toast.loading('Initiating AI Recovery...');
    try {
      const res = await authFetch('/api/automation/call-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_callback',
          missedCallId
        })
      });
      if (res.ok) {
        toast.success('AI is calling the customer now!', { id: tid });
        fetchUsage();
      } else {
        toast.error('Failed to start AI call', { id: tid });
      }
    } catch (err) {
      toast.error('Trigger Error', { id: tid });
    }
  };

  const handleDeleteMissed = async (id) => {
    try {
      const res = await authFetch(`/api/automation/call-integration?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Entry dismissed');
        fetchUsage();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    if (!phoneInput) return toast.error('Please enter a phone number');

    setConnecting(true);
    try {
      const bId = localStorage.getItem('businessId');
      const res = await authFetch('/api/automation/call-integration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bId, phone: phoneInput })
      });

      const result = await res.json();
      if (result.success) {
        toast.success('SIM Linked successfully');
        setUsage(prev => ({ ...prev, connectedPhone: phoneInput }));
        setWizardStep(2);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Failed to connect SIM');
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const bId = localStorage.getItem('businessId');
      const res = await authFetch('/api/automation/call-integration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bId, settings })
      });
      if (res.ok) {
        if (e) toast.success('Configuration saved');
      }
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async () => {
    if (!testNumber) return toast.error('Enter a number to simulate');
    const bId = localStorage.getItem('businessId');
    const res = await authFetch('/api/automation/call-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simulate_missed',
        businessId: bId,
        callerNumber: testNumber,
        businessNumber: usage.connectedPhone // The SIM number linked by the user
      })
    });
    if (res.ok) {
      toast.success('Simulated missed call received!');
      fetchUsage();
    }
  };

  const handleTestBridge = async () => {
    const tid = toast.loading('Calling your personal phone...');
    try {
      const bId = localStorage.getItem('businessId');
      const res = await authFetch('/api/automation/call-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection', businessId: bId })
      });
      if (res.ok) {
        toast.success('Calling now! Miss the call to test.', { id: tid });
      } else {
        toast.error('Failed to trigger test call', { id: tid });
      }
    } catch (err) {
      toast.error('Error triggering test', { id: tid });
    }
  };

  const handleBridgeSimulate = async () => {
    if (!bridgeSimNumber) return toast.error('Enter "X Guy" number to simulate');
    const tid = toast.loading('Simulating forwarded call...');
    try {
      const bId = localStorage.getItem('businessId');
      const res = await authFetch('/api/automation/call-integration/inbound?businessId=' + bId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: bridgeSimNumber,
          ForwardedFrom: usage.connectedPhone, // The user's personal number
          To: settings.telephony?.phoneNumberId,
          AccountSid: 'MOCK_TWILIO' // Trigger TwiML logic
        })
      });
      if (res.ok) {
        toast.success('Simulation Successful! Check table.', { id: tid });
        fetchUsage();
      } else {
        toast.error('Simulation failed', { id: tid });
      }
    } catch (err) {
      toast.error('Error simulating bridge', { id: tid });
    }
  };

  const handleResetIntegration = async () => {
    if (!(await confirm({ title: 'Reset integration', message: 'Are you sure you want to reset your integration? This will clear your settings and SIM link.', confirmLabel: 'Reset', danger: true }))) return;

    try {
      const bId = localStorage.getItem('businessId');
      const res = await authFetch(`/api/automation/call-integration?action=reset&businessId=${bId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Integration reset successfully');
        setWizardStep(1);
        setPhoneInput('');
        setSettings({
          enabled: false,
          voiceId: 'en-US-Neural2-F',
          recordCalls: false,
          greetingMessage: 'Hello, I am the AI assistant.',
          enableSmsFollowup: true,
          telephony: {
            provider: 'vapi',
            apiKey: '',
            assistantId: '',
            phoneNumberId: ''
          }
        });
        setUsage(prev => ({ ...prev, connectedPhone: '' }));
      }
    } catch (err) {
      toast.error('Failed to reset integration');
    }
  };

  const handleCopyWebhook = () => {
    const bId = localStorage.getItem('businessId');
    const url = `${window.location.protocol}//${window.location.host}/api/automation/call-integration/inbound?businessId=${bId}`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const maskPhone = (phone) => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return `+${cleaned.slice(0, 2)} •••• ${cleaned.slice(-4)}`;
  };

  return (
    <div className="px-8 py-10 min-h-screen bg-[#FDFDFF] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1️⃣ Top Header Bar */}
      <div className="flex items-center justify-between mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-red-600" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">Call Recovery</h1>
            <p className="text-xs text-slate-500 font-medium">Automatically capture and recover unanswered calls</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50 shadow-sm shadow-emerald-100/20">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs font-bold uppercase tracking-wider">System Active</span>
          </div>

          <button
            onClick={handleTestBridge}
            className="group relative flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-[14px] font-bold text-sm hover:bg-indigo-700 transition-all duration-300 shadow-sm active:scale-95"
          >
            <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
            Test Call Flow
          </button>

          <button
            onClick={() => setWizardStep(2)}
            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-[14px] hover:bg-slate-50 hover:text-slate-600 transition-all duration-300 shadow-sm"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AutoPageIntro />

      {wizardStep === 1 && (
        <div className="max-w-xl">
          <div className="bg-white rounded-[32px] p-12 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="relative z-10 text-left mb-10">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center mb-8">
                <Phone className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Connect Your Line</h2>
              <p className="text-slate-500 text-lg leading-relaxed px-6 font-medium">
                Enter your business or personal number to start capturing missed calls.
              </p>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[20px] focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold text-xl text-slate-900 placeholder:text-slate-300"
              />
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-5 bg-indigo-600 text-white rounded-[20px] font-bold text-lg hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {wizardStep === 2 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Provider Settings (Left) */}
          <div className="xl:col-span-7">
            <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex-1 pr-12">Provider Settings</h2>
              </div>

              <div className="flex gap-4 mb-10 p-1.5 bg-slate-50 rounded-[20px] border border-slate-100">
                {['vapi', 'twilio'].map(p => (
                  <button
                    key={p}
                    onClick={() => setSettings(s => ({ ...s, telephony: { ...s.telephony, provider: p } }))}
                    className={`flex-1 py-3.5 px-6 rounded-[16px] font-bold tracking-tight text-sm transition-all duration-300 ${settings.telephony.provider === p
                        ? 'bg-white shadow-md text-slate-900'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-8 flex-1">
                {settings.telephony.provider === 'vapi' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vapi API Key</label>
                      <input
                        type="password"
                        placeholder="Paste Private API Key"
                        value={settings.telephony.apiKey}
                        onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, apiKey: e.target.value } }))}
                        className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assistant ID</label>
                        <input
                          type="text"
                          placeholder="id_..."
                          value={settings.telephony.assistantId}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, assistantId: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number ID</label>
                        <input
                          type="text"
                          placeholder="+1..."
                          value={settings.telephony.phoneNumberId}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, phoneNumberId: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Twilio Account SID</label>
                      <input
                        type="text"
                        placeholder="AC..."
                        value={settings.telephony.assistantId}
                        onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, assistantId: e.target.value } }))}
                        className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Key (SK...)</label>
                        <input
                          type="text"
                          placeholder="SK..."
                          value={settings.telephony.apiKey}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, apiKey: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Secret</label>
                        <input
                          type="password"
                          placeholder="Twilio Secret"
                          value={settings.telephony.apiSecret}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, apiSecret: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">TwiML App SID</label>
                        <input
                          type="text"
                          placeholder="AP..."
                          value={settings.telephony.twimlAppSid}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, twimlAppSid: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="+1..."
                          value={settings.telephony.phoneNumberId}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, phoneNumberId: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-[18px] focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={handleVerifyCredentials}
                  disabled={verifying}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-bold text-lg hover:bg-indigo-700 transition-all shadow-sm mt-6 disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {verifying ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> Complete Setup</>}
                </button>
              </div>
            </div>
          </div>

          {/* Setup Blueprint (Right) */}
          <div className="xl:col-span-5 h-full">
            <div className="bg-slate-900 rounded-[32px] p-10 h-full text-white shadow-sm flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -mr-32 -mt-32"></div>
               
               <div className="relative z-10 flex-1">
                 <div className="flex items-center gap-3 mb-12">
                   <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                     <Sparkles className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold tracking-tight text-white leading-none mb-1">Recovery Blueprint</h3>
                     <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Setup Intelligence Guide</p>
                   </div>
                 </div>

                 <div className="space-y-10">
                   {/* Step 1 */}
                   <div className="flex gap-5 relative">
                     <div className="absolute top-10 left-5 w-px h-[calc(100%+24px)] bg-slate-800"></div>
                     <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700 relative z-10">
                       <PhoneMissed className="w-5 h-5 text-slate-400" />
                     </div>
                     <div className="pt-1">
                       <h4 className="font-bold text-slate-100 mb-1">Detect Call</h4>
                       <p className="text-sm text-slate-400 leading-relaxed">The system monitors your connected line 24/7 for missed opportunities.</p>
                     </div>
                   </div>

                   {/* Step 2 */}
                   <div className="flex gap-5 relative">
                     <div className="absolute top-10 left-5 w-px h-[calc(100%+24px)] bg-slate-800"></div>
                     <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative z-10">
                       <Cpu className="w-5 h-5 text-white" />
                     </div>
                     <div className="pt-1">
                       <h4 className="font-bold text-white mb-1">AI Context Mapping</h4>
                       <p className="text-sm text-slate-300 leading-relaxed font-medium">LFG AI analyzes the lead's history and business context in under 2 seconds.</p>
                     </div>
                   </div>

                   {/* Step 3 */}
                   <div className="flex gap-5 relative">
                     <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700 relative z-10">
                       <MessageSquare className="w-5 h-5 text-slate-400" />
                     </div>
                     <div className="pt-1">
                       <h4 className="font-bold text-slate-100 mb-1">Automated Recovery</h4>
                       <p className="text-sm text-slate-400 leading-relaxed">Personalized recovery messages are sent via SMS/WhatsApp to secure the lead.</p>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="mt-12 p-6 bg-slate-800/40 rounded-2xl border border-slate-800 relative z-10">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                     <TrendingUp className="w-4 h-4 text-emerald-400" />
                   </div>
                   <span className="text-sm font-bold text-slate-100">Recovery Impact</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lead Retention</p>
                     <p className="text-xl font-black text-emerald-400">+99.2%</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Response</p>
                     <p className="text-xl font-black text-indigo-400">12s</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {wizardStep === 4 && (
        <div className="grid grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* 3️⃣ Metric Cards (Left Column) */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-indigo-100/30 transition-shadow duration-500">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Calls Today</p>
              <div className="flex items-baseline gap-2">
                <p className="text-6xl font-bold text-slate-900 tracking-tighter">{missedCalls.length}</p>
                <span className="text-slate-300 font-bold text-xl">/ 0</span>
              </div>
              <p className="text-[10px] font-bold text-indigo-500 mt-4 px-2.5 py-1 bg-indigo-50 rounded-full w-fit">Updated just now</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Recovery Performance</p>
              <p className="text-5xl font-bold text-slate-900 tracking-tighter">—</p>
              <p className="text-xs font-medium text-slate-400 mt-4">Waiting for first call</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Call Bridge</p>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs font-medium">Signal</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Stable
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs font-medium">Forwarding</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Connected Number</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight">{maskPhone(usage.connectedPhone)}</p>
              </div>
            </div>
          </div>

          {/* 4️⃣ Center Area (Recovery Stream) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col relative min-h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none"></div>

              <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 relative z-10">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recovery Stream</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                  <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Live Activity</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col relative z-10">
                {missedCalls.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-1000">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-200">
                        <PhoneOff className="w-12 h-12" />
                      </div>
                      <div className="absolute -inset-4 bg-indigo-100/30 rounded-full blur-2xl animate-pulse -z-10"></div>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Waiting for incoming calls</h4>
                    <p className="text-sm font-medium text-slate-400 max-w-[280px] leading-relaxed">
                      When a call is unanswered, it will appear here instantly with follow-up status.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-6 overflow-y-auto max-h-[700px]">
                    {missedCalls.map(call => (
                      <div key={call._id} className="group p-6 bg-white hover:bg-slate-50/50 rounded-[28px] border border-slate-50 hover:border-indigo-100 transition-all duration-300 flex items-center justify-between shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-50 group-hover:bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <Phone className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg tracking-tight">{call.callerNumber}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Missed {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTriggerAI(call._id)}
                            className="px-5 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            Recover Now
                          </button>

                          <button
                            onClick={() => handleDeleteMissed(call._id)}
                            className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-50 bg-slate-50/30 relative z-10 flex items-center justify-center gap-6">
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  No calls are recorded
                </p>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  Secure by default
                </p>
              </div>
            </div>
          </div>

          {/* 5️⃣ Right Panel — Guided Setup (Major Redesign) */}
          <div className="col-span-12 lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full -mr-20 -mt-20 blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Call Recovery Setup</h3>
                <p className="text-slate-400 text-sm font-medium mb-10">Takes less than 2 minutes</p>

                <div className="space-y-10 mb-12">
                  <div className="flex gap-6">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-[14px] flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">1</div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-slate-900 font-bold text-sm mb-2">Enable Call Forwarding</p>
                      <p className="text-slate-400 text-[11px] font-medium leading-relaxed mb-4">Set your line to forward to our capture node when unanswered.</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(settings.telephony?.phoneNumberId || '');
                          toast.success('Number copied!');
                        }}
                        className="px-5 py-2.5 bg-slate-50 text-indigo-600 rounded-xl text-[11px] font-bold border border-slate-100 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Copy Forwarding Number
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-[14px] flex items-center justify-center font-bold text-sm flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 pt-1.5">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-slate-900 font-bold text-sm">Connect to LeadForGrow</p>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded-full">
                          Connected
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] font-medium leading-relaxed">Your neural link is active and synchronized.</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-[14px] flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-slate-900 font-bold text-sm mb-2 text-indigo-600">Test Your Setup</p>
                      <p className="text-slate-400 text-[11px] font-medium leading-relaxed mb-6">Verify incoming signals reach your recovery system successfully.</p>
                      <button
                        onClick={handleTestBridge}
                        className="w-full py-4 bg-indigo-600 text-white rounded-[18px] font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                      >
                        Test Call Flow
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50/50 rounded-[24px] border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Signal</p>
                    <p className="text-[11px] font-bold text-slate-600">Designed for healthcare & service teams</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation Sandbox - Styled as a secondary card */}
            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Automation Sandbox</p>
                <button
                  onClick={handleResetIntegration}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                >
                  Reset All
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Simulation Number (+91...)"
                  value={bridgeSimNumber}
                  onChange={(e) => setBridgeSimNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[16px] px-6 py-3.5 text-slate-900 text-sm outline-none font-bold placeholder:text-slate-300 focus:border-slate-400 transition-colors"
                />
                <button
                  onClick={handleBridgeSimulate}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-[16px] font-bold text-xs uppercase tracking-wider hover:bg-black transition-all active:scale-[0.98]"
                >
                  Run Signal Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



