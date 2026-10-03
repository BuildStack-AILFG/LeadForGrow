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
  Bot as Sparkles,
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
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
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
    <div className="px-8 py-10 min-h-screen bg-[#FDFDFF] font-sans selection:bg-accent-subtle selection:text-accent-fg">
      {/* 1️⃣ Top Header Bar */}
      <div className="flex items-center justify-between mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-subtle flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-danger" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-page font-semibold text-fg">Call Recovery</h1>
            <p className="text-xs text-fg-tertiary font-medium">Automatically capture and recover unanswered calls</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-accent-subtle text-accent-fg rounded-full border border-line/50">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold">System Active</span>
          </div>

          <button
            onClick={handleTestBridge}
            className="group relative flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-accent-hover transition-all duration-300 active:scale-95"
          >
            <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
            Test Call Flow
          </button>

          <button
            onClick={() => setWizardStep(2)}
            className="p-3 bg-canvas border border-line text-fg-tertiary rounded-lg hover:bg-subtle hover:text-fg-secondary transition-all duration-300"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AutoPageIntro />

      {wizardStep === 1 && (
        <div className="max-w-xl">
          <div className="bg-canvas rounded-[32px] p-12 border border-line relative overflow-hidden">
            <div className="relative z-10 text-left mb-10">
              <div className="w-20 h-20 bg-accent-subtle text-accent-fg rounded-[24px] flex items-center justify-center mb-8">
                <Phone className="w-10 h-10" />
              </div>
              <h2 className="text-title font-semibold text-fg mb-4">Connect Your Line</h2>
              <p className="text-fg-tertiary text-lg leading-relaxed px-6 font-medium">
                Enter your business or personal number to start capturing missed calls.
              </p>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-8 py-5 bg-subtle border-2 border-line rounded-[20px] focus:border-accent focus:bg-canvas outline-none transition-all font-semibold text-xl text-fg placeholder:text-fg-disabled"
              />
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-5 bg-accent text-white rounded-[20px] font-semibold text-lg hover:bg-accent-hover transition-all disabled:opacity-50"
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
            <div className="bg-canvas rounded-[32px] p-8 lg:p-12 border border-line flex flex-col h-full">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-canvas border border-line rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-fg-secondary" />
                </div>
                <h2 className="text-title font-semibold text-fg flex-1 pr-12">Provider Settings</h2>
              </div>

              <div className="flex gap-4 mb-10 p-1.5 bg-subtle rounded-[20px] border border-line">
                {['vapi', 'twilio'].map(p => (
                  <button
                    key={p}
                    onClick={() => setSettings(s => ({ ...s, telephony: { ...s.telephony, provider: p } }))}
                    className={`flex-1 py-3.5 px-6 rounded-[16px] font-bold tracking-tight text-sm transition-all duration-300 ${settings.telephony.provider === p
                        ? 'bg-canvas shadow-popover text-fg'
                        : 'text-fg-tertiary hover:text-fg-secondary'
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
                      <label className="text-meta font-semibold text-fg-tertiary ml-1">Vapi API Key</label>
                      <input
                        type="password"
                        placeholder="Paste Private API Key"
                        value={settings.telephony.apiKey}
                        onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, apiKey: e.target.value } }))}
                        className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-meta font-semibold text-fg-tertiary ml-1">Assistant ID</label>
                        <input
                          type="text"
                          placeholder="id_..."
                          value={settings.telephony.assistantId}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, assistantId: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-meta font-semibold text-fg-tertiary ml-1">Phone Number ID</label>
                        <input
                          type="text"
                          placeholder="+1..."
                          value={settings.telephony.phoneNumberId}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, phoneNumberId: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-meta font-semibold text-fg-tertiary ml-1">Twilio Account SID</label>
                      <input
                        type="text"
                        placeholder="AC..."
                        value={settings.telephony.assistantId}
                        onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, assistantId: e.target.value } }))}
                        className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-meta font-semibold text-fg-tertiary ml-1">API Key (SK...)</label>
                        <input
                          type="text"
                          placeholder="SK..."
                          value={settings.telephony.apiKey}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, apiKey: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-meta font-semibold text-fg-tertiary ml-1">API Secret</label>
                        <input
                          type="password"
                          placeholder="Twilio Secret"
                          value={settings.telephony.apiSecret}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, apiSecret: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-meta font-semibold text-fg-tertiary ml-1">TwiML App SID</label>
                        <input
                          type="text"
                          placeholder="AP..."
                          value={settings.telephony.twimlAppSid}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, twimlAppSid: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-meta font-semibold text-fg-tertiary ml-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="+1..."
                          value={settings.telephony.phoneNumberId}
                          onChange={(e) => setSettings(s => ({ ...s, telephony: { ...s.telephony, phoneNumberId: e.target.value } }))}
                          className="w-full px-7 py-4.5 bg-subtle border-2 border-line rounded-[18px] focus:border-accent outline-none transition-all text-fg font-semibold"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={handleVerifyCredentials}
                  disabled={verifying}
                  className="w-full py-5 bg-accent text-white rounded-[24px] font-semibold text-lg hover:bg-accent-hover transition-all mt-6 disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {verifying ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> Complete Setup</>}
                </button>
              </div>
            </div>
          </div>

          {/* Setup Blueprint (Right) */}
          <div className="xl:col-span-5 h-full">
            <div className="bg-slate-900 rounded-[32px] p-10 h-full text-white flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] -mr-32 -mt-32"></div>
               
               <div className="relative z-10 flex-1">
                 <div className="flex items-center gap-3 mb-12">
                   <div className="w-10 h-10 bg-canvas border border-line rounded-lg flex items-center justify-center">
                     <Sparkles className="w-5 h-5 text-fg-secondary" />
                   </div>
                   <div>
                     <h3 className="text-xl font-semibold tracking-tight text-white leading-none mb-1">Recovery Blueprint</h3>
                     <p className="text-accent-fg text-meta font-semibold">Setup Intelligence Guide</p>
                   </div>
                 </div>

                 <div className="space-y-10">
                   {/* Step 1 */}
                   <div className="flex gap-5 relative">
                     <div className="absolute top-10 left-5 w-px h-[calc(100%+24px)] bg-slate-800"></div>
                     <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 relative z-10">
                       <PhoneMissed className="w-5 h-5 text-fg-tertiary" />
                     </div>
                     <div className="pt-1">
                       <h4 className="font-semibold text-slate-100 mb-1">Detect Call</h4>
                       <p className="text-sm text-fg-tertiary leading-relaxed">The system monitors your connected line 24/7 for missed opportunities.</p>
                     </div>
                   </div>

                   {/* Step 2 */}
                   <div className="flex gap-5 relative">
                     <div className="absolute top-10 left-5 w-px h-[calc(100%+24px)] bg-slate-800"></div>
                     <div className="w-10 h-10 bg-canvas border border-line rounded-lg flex items-center justify-center shrink-0 relative z-10">
                       <Cpu className="w-5 h-5 text-fg-secondary" />
                     </div>
                     <div className="pt-1">
                       <h4 className="font-semibold text-white mb-1">AI Context Mapping</h4>
                       <p className="text-sm text-fg-disabled leading-relaxed font-medium">LFG AI analyzes the lead's history and business context in under 2 seconds.</p>
                     </div>
                   </div>

                   {/* Step 3 */}
                   <div className="flex gap-5 relative">
                     <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 relative z-10">
                       <MessageSquare className="w-5 h-5 text-fg-tertiary" />
                     </div>
                     <div className="pt-1">
                       <h4 className="font-semibold text-slate-100 mb-1">Automated Recovery</h4>
                       <p className="text-sm text-fg-tertiary leading-relaxed">Personalized recovery messages are sent via SMS/WhatsApp to secure the lead.</p>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="mt-12 p-6 bg-slate-800/40 rounded-lg border border-slate-800 relative z-10">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 bg-canvas border border-line rounded-lg flex items-center justify-center">
                     <TrendingUp className="w-4 h-4 text-fg-secondary" />
                   </div>
                   <span className="text-sm font-semibold text-slate-100">Recovery Impact</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-meta font-semibold text-fg-tertiary mb-1">Lead Retention</p>
                     <p className="text-xl font-semibold text-accent-fg">+99.2%</p>
                   </div>
                   <div>
                     <p className="text-meta font-semibold text-fg-tertiary mb-1">Avg. Response</p>
                     <p className="text-xl font-semibold text-accent-fg">12s</p>
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
            <div className="bg-canvas p-8 rounded-[32px] border border-line transition-shadow duration-500">
              <p className="text-fg-tertiary text-xs font-semibold mb-4">Calls Today</p>
              <div className="flex items-baseline gap-2">
                <p className="text-6xl font-semibold text-fg tracking-tighter">{missedCalls.length}</p>
                <span className="text-fg-disabled font-semibold text-xl">/ 0</span>
              </div>
              <p className="text-meta font-semibold text-accent-fg mt-4 px-2.5 py-1 bg-accent-subtle rounded-full w-fit">Updated just now</p>
            </div>

            <div className="bg-canvas p-8 rounded-[32px] border border-line">
              <p className="text-fg-tertiary text-xs font-semibold mb-4">Recovery Performance</p>
              <p className="text-hero font-semibold text-fg tracking-tighter">—</p>
              <p className="text-xs font-medium text-fg-tertiary mt-4">Waiting for first call</p>
            </div>

            <div className="bg-canvas p-8 rounded-[32px] border border-line relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <p className="text-fg-tertiary text-xs font-semibold">Active Call Bridge</p>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-fg-tertiary text-xs font-medium">Signal</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-fg">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    Stable
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-fg-tertiary text-xs font-medium">Forwarding</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-fg">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <p className="text-meta font-semibold text-fg-tertiary mb-1.5">Connected Number</p>
                <p className="text-lg font-semibold text-fg tracking-tight">{maskPhone(usage.connectedPhone)}</p>
              </div>
            </div>
          </div>

          {/* 4️⃣ Center Area (Recovery Stream) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col">
            <div className="bg-canvas rounded-[40px] border border-line overflow-hidden flex-1 flex flex-col relative min-h-[600px]">
              <div className="absolute inset-0 bg-canvas pointer-events-none"></div>

              <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 relative z-10">
                <h3 className="text-xl font-semibold text-fg tracking-tight">Recovery Stream</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                  <span className="text-meta font-semibold text-accent-fg">Live Activity</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col relative z-10">
                {missedCalls.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-1000">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-accent-subtle rounded-[32px] flex items-center justify-center text-indigo-200">
                        <PhoneOff className="w-12 h-12" />
                      </div>
                      <div className="absolute -inset-4 bg-accent-subtle/30 rounded-full blur-2xl animate-pulse -z-10"></div>
                    </div>
                    <h4 className="text-xl font-semibold text-fg mb-2">Waiting for incoming calls</h4>
                    <p className="text-sm font-medium text-fg-tertiary max-w-[280px] leading-relaxed">
                      When a call is unanswered, it will appear here instantly with follow-up status.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-6 overflow-y-auto max-h-[700px]">
                    {missedCalls.map(call => (
                      <div key={call._id} className="group p-6 bg-canvas hover:bg-subtle rounded-[28px] border border-slate-50 hover:border-line transition-all duration-300 flex items-center justify-between hover:shadow-popover">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-subtle group-hover:bg-canvas rounded-lg flex items-center justify-center text-fg-tertiary group-hover:text-accent-fg transition-colors">
                            <Phone className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-fg text-lg tracking-tight">{call.callerNumber}</p>
                            <p className="text-meta text-fg-tertiary font-semibold mt-1">Missed {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTriggerAI(call._id)}
                            className="px-5 py-3 bg-canvas text-accent-fg border border-line rounded-lg font-semibold text-xs hover:bg-accent-hover hover:text-white transition-all active:scale-95"
                          >
                            Recover Now
                          </button>

                          <button
                            onClick={() => handleDeleteMissed(call._id)}
                            className="p-3 text-fg-disabled hover:text-danger transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-50 bg-subtle/30 relative z-10 flex items-center justify-center gap-6">
                <p className="text-meta font-semibold text-fg-tertiary flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  No calls are recorded
                </p>
                <p className="text-meta font-semibold text-fg-tertiary flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  Secure by default
                </p>
              </div>
            </div>
          </div>

          {/* 5️⃣ Right Panel — Guided Setup (Major Redesign) */}
          <div className="col-span-12 lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="bg-canvas p-10 rounded-[40px] border border-line relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent-subtle rounded-full -mr-20 -mt-20 blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>

              <div className="relative z-10">
                <h3 className="text-2xl font-semibold text-fg tracking-tight mb-2">Call Recovery Setup</h3>
                <p className="text-fg-tertiary text-sm font-medium mb-10">Takes less than 2 minutes</p>

                <div className="space-y-10 mb-12">
                  <div className="flex gap-6">
                    <div className="w-10 h-10 bg-accent text-white rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-fg font-semibold text-sm mb-2">Enable Call Forwarding</p>
                      <p className="text-fg-tertiary text-meta font-medium leading-relaxed mb-4">Set your line to forward to our capture node when unanswered.</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(settings.telephony?.phoneNumberId || '');
                          toast.success('Number copied!');
                        }}
                        className="px-5 py-2.5 bg-subtle text-accent-fg rounded-lg text-meta font-semibold border border-line hover:bg-accent-subtle transition-colors flex items-center gap-2"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Copy Forwarding Number
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 bg-accent-subtle text-accent-fg rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    </div>
                    <div className="flex-1 pt-1.5">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-fg font-semibold text-sm">Connect to LeadForGrow</p>
                        <span className="flex items-center gap-1 text-meta font-semibold text-accent-fg px-2 py-0.5 bg-accent-subtle rounded-full">
                          Connected
                        </span>
                      </div>
                      <p className="text-fg-tertiary text-meta font-medium leading-relaxed">Your neural link is active and synchronized.</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-10 h-10 bg-subtle text-fg-tertiary rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                    <div className="flex-1 pt-1.5">
                      <p className="text-fg font-semibold text-sm mb-2 text-accent-fg">Test Your Setup</p>
                      <p className="text-fg-tertiary text-meta font-medium leading-relaxed mb-6">Verify incoming signals reach your recovery system successfully.</p>
                      <button
                        onClick={handleTestBridge}
                        className="w-full py-4 bg-accent text-white rounded-[18px] font-semibold text-sm hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Test Call Flow
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-subtle rounded-[24px] border border-line flex items-center gap-4">
                  <div className="w-10 h-10 bg-canvas rounded-lg flex items-center justify-center text-fg-tertiary">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-meta font-semibold text-fg-tertiary">Trust Signal</p>
                    <p className="text-meta font-semibold text-fg-secondary">Designed for healthcare & service teams</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation Sandbox - Styled as a secondary card */}
            <div className="bg-subtle p-8 rounded-[32px] border border-line">
              <div className="flex items-center justify-between mb-6">
                <p className="text-fg-tertiary text-meta font-semibold">Automation Sandbox</p>
                <button
                  onClick={handleResetIntegration}
                  className="text-meta font-semibold text-danger hover:text-danger"
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
                  className="w-full bg-canvas border border-line rounded-[16px] px-6 py-3.5 text-fg text-sm outline-none font-semibold placeholder:text-fg-disabled focus:border-line-strong transition-colors"
                />
                <button
                  onClick={handleBridgeSimulate}
                  className="w-full bg-accent text-white py-3.5 rounded-md font-medium text-xs hover:bg-accent-hover transition-all"
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



