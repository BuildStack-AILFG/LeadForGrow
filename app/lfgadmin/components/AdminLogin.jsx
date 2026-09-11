'use client';

import { Lock, RefreshCw, Shield } from 'lucide-react';

export default function AdminLogin({ password, setPassword, onLogin, loading, error }) {
  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500 shadow-sm mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LFG Admin</h1>
          <p className="text-slate-400 mt-2 text-sm">LeadForGrow platform control center</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onLogin(); }}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Access code
          </label>
          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 rounded-xl bg-teal-700 text-white font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Enter admin panel'}
          </button>

          <p className="text-[11px] text-slate-600 text-center mt-4">
            Authorized personnel only · All actions are logged
          </p>
        </form>
      </div>
    </div>
  );
}
