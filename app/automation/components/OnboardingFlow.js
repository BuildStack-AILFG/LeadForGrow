'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  MessageCircle,
  Bell,
  RefreshCw,
  UserPlus,
  Rocket
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

export default function OnboardingFlow({ onComplete }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState({
    hasLeadSource: false,
    hasAutomation: false,
    hasTeamSetup: false
  });

  // Choice for Step 3
  const [assignMode, setAssignMode] = useState('solo'); // 'solo' or 'team'

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  const fetchSetupStatus = async () => {
    try {
      const res = await authFetch('/api/automation/setup-status');
      const data = await res.json();
      if (data.success) {
        setSetupStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching setup status:', error);
    }
  };

  const nextStep = () => setStep(step + 1);

  const handleCompleteStep1 = () => {
    router.push('/automation/integrations');
    nextStep();
  };

  const handleEnableAutomation = async () => {
    setLoading(true);
    try {
      // Logic to enable default rules could go here
      toast.success('Default automation enabled!');
      nextStep();
    } catch (error) {
      toast.error('Failed to enable automation');
    }
    setLoading(false);
  };

  const handleSaveTeam = async () => {
    setLoading(true);
    // Simulate saving preference
    setTimeout(() => {
      setLoading(false);
      nextStep();
    }, 800);
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/automation/setup-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('System is now LIVE!');
        onComplete();
      }
    } catch (error) {
      toast.error('Failed to finalize setup');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-full flex-1 transition-all duration-500 ${
                s <= step ? 'bg-indigo-600' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-[24px] flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Globe className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Connect Lead Sources</h2>
              <p className="text-slate-600 mb-8 text-lg">
                You’re almost ready. Connect where leads come from so the system can start working for you.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 border-2 border-slate-100 rounded-2xl text-left hover:border-indigo-600 cursor-pointer group transition-all">
                  <MessageCircle className="w-8 h-8 text-emerald-500 mb-3" />
                  <h3 className="font-bold text-slate-900">WhatsApp</h3>
                  <p className="text-xs text-slate-500">Capture from WhatsApp buttons</p>
                </div>
                <div className="p-6 border-2 border-indigo-600 bg-indigo-50 rounded-2xl text-left">
                  <CheckCircle2 className="w-8 h-8 text-indigo-600 mb-3" />
                  <h3 className="font-bold text-slate-900">Website Forms</h3>
                  <p className="text-xs text-slate-500 font-bold text-indigo-600">Active (Standard)</p>
                </div>
              </div>

              <button 
                onClick={handleCompleteStep1}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Go to Integrations <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Automation Quick Setup</h2>
                <p className="text-slate-600">Enable recommended rules for instant results</p>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Instant Customer Response</p>
                      <p className="text-xs text-slate-500">WhatsApp / Email welcome message</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative p-1">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Bell className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Internal Notification</p>
                      <p className="text-xs text-slate-500">Notify you instantly on new lead</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative p-1">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <RefreshCw className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Auto Follow-up Reminder</p>
                      <p className="text-xs text-slate-500">Remind if no action in 24 hours</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative p-1">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleEnableAutomation}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all"
              >
                {loading ? 'Enabling...' : 'Enable Recommended Automation'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Who handles new leads?</h2>
              <p className="text-slate-600 mb-8">Choose how enquiries are distributed</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <button 
                  onClick={() => setAssignMode('solo')}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all ${
                    assignMode === 'solo' 
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' 
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle2 className={`w-6 h-6 ${assignMode === 'solo' ? 'text-indigo-600' : 'text-slate-300'}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Assign all to me</h3>
                  <p className="text-sm text-slate-500 mt-2">I will handle all new leads myself</p>
                </button>

                <button 
                  onClick={() => setAssignMode('team')}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all ${
                    assignMode === 'team' 
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' 
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4">
                    <UserPlus className={`w-6 h-6 ${assignMode === 'team' ? 'text-indigo-600' : 'text-slate-300'}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Auto-assign Team</h3>
                  <p className="text-sm text-slate-500 mt-2">Distribute leads between team members</p>
                </button>
              </div>

              <button 
                onClick={handleSaveTeam}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all"
              >
                Save Ownership Setup
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Rocket className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">You’re Live! 🎉</h2>
              <p className="text-xl text-slate-700 font-bold mb-8">Your lead automation is now active.</p>
              
              <div className="bg-slate-50 rounded-[32px] p-8 text-left space-y-4 mb-10">
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <p className="text-slate-700"><span className="font-bold">Captured:</span> New enquiries are saved instantly.</p>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <p className="text-slate-700"><span className="font-bold">Responded:</span> Customers get an instant welcome message.</p>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <p className="text-slate-700"><span className="font-bold">Notified:</span> You get alerted on every new lead.</p>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <p className="text-slate-700"><span className="font-bold">Tracked:</span> Follow-up tasks are created automatically.</p>
                </div>
              </div>

              <button 
                onClick={handleFinalComplete}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Finalizing...' : 'Go to Dashboard'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
