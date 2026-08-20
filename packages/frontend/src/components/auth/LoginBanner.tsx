import React from 'react';
import { Zap, ArrowUpRight, CheckCircle2, TrendingUp, Landmark } from 'lucide-react';

export const LoginBanner: React.FC = () => {
  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white overflow-hidden select-none">
      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header - MoneyMB Branding */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-400 to-indigo-500 p-0.5 shadow-xl shadow-orange-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-orange-400">
              M
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-0.5">
              Money<span className="text-orange-400">MB</span>
            </h1>
            <p className="text-[11px] font-bold text-indigo-200/90 uppercase tracking-widest">
              Smart Financial Portal
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NPCI & BBPS Connected</span>
        </div>
      </div>

      {/* Hero Showcase & Glass Card Illustration */}
      <div className="relative z-10 my-auto py-8">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-500/20 border border-orange-400/30 rounded-full text-orange-200 text-xs font-bold mb-5 backdrop-blur-md">
            <Zap size={14} className="text-orange-300" />
            <span>Next-Gen Money Transfer & AEPS Engine</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Empower Your Business With <br />
            <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
              MoneyMB Instant Payouts
            </span>
          </h2>

          <p className="text-indigo-100 text-sm leading-relaxed mb-8 font-medium">
            Execute Domestic Money Transfers, Aadhaar Micro-ATM cash withdrawals, CMS collections, and utility bill payments on India's most reliable B2B fintech portal.
          </p>
        </div>

        {/* Floating Glassmorphism Hero Card */}
        <div className="relative w-full max-w-lg mx-auto">
          <div className="bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
            {/* Stat Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-inner">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium">Daily Transfer Volume</p>
                  <p className="text-xl font-black text-white">₹ 5,84,200.00</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 rounded-full text-xs font-bold">
                <ArrowUpRight size={14} />
                <span>+28.4%</span>
              </span>
            </div>

            {/* Instant Services Badges */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white/15 rounded-2xl border border-white/10 flex items-center gap-3 backdrop-blur-md">
                <div className="w-9 h-9 rounded-xl bg-orange-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  DMT
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Express IMPS/NEFT</p>
                  <p className="text-[10px] text-indigo-200">24x7 Instant Transfer</p>
                </div>
              </div>

              <div className="p-3 bg-white/15 rounded-2xl border border-white/10 flex items-center gap-3 backdrop-blur-md">
                <div className="w-9 h-9 rounded-xl bg-indigo-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  AePS
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Aadhaar Micro ATM</p>
                  <p className="text-[10px] text-indigo-200">Biometric Cash Out</p>
                </div>
              </div>
            </div>

            {/* Feature Checklist Pills */}
            <div className="pt-2 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-white/10">
                <p className="text-[10px] text-indigo-200 font-medium">Uptime</p>
                <p className="text-xs font-bold text-white">99.99% Guaranteed</p>
              </div>
              <div className="p-2 rounded-xl bg-white/10">
                <p className="text-[10px] text-indigo-200 font-medium">Settlement</p>
                <p className="text-xs font-bold text-orange-300">Instant Wallet</p>
              </div>
              <div className="p-2 rounded-xl bg-white/10">
                <p className="text-[10px] text-indigo-200 font-medium">Commission</p>
                <p className="text-xs font-bold text-emerald-300">Max Retail Margin</p>
              </div>
            </div>
          </div>

          {/* Floating Trust Badge */}
          <div className="absolute -bottom-4 -left-4 bg-white text-slate-900 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 border border-indigo-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Direct Bank Escrow</p>
              <p className="text-[10px] text-slate-500 font-semibold">ICICI • SBI • Axis Bank Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Checklist */}
      <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
        <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold">
          <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
          <span>Instant Wallet Top-up</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold">
          <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
          <span>Real-time Passbook</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold">
          <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
          <span>24x7 MoneyMB Support</span>
        </div>
      </div>
    </div>
  );
};
