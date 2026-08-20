import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { formatPaiseToRupees } from '../../utils/formatters';
import {
  RotateCw,
  PlusCircle,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onOpenAddFund?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddFund }) => {
  const { user, wallet, refreshWallet, logout } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWallet();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Header Row */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-700 via-purple-700 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-md">
              M
            </div>
            <div>
              <div className="flex items-center font-extrabold text-xl tracking-tight text-[#171738]">
                Money<span className="text-orange-500">MB</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-1">
                Smart Financial & Money Transfer Portal
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right Balance & Date Controls */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Date Chip */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <span className="text-slate-500">🕒 DATE :</span>
            <span>{todayDateFormatted}</span>
          </div>

          {/* Main Wallet Balance Chip (Vibrant Emerald) */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition">
            <span>{formatPaiseToRupees(wallet?.mainBalance)}</span>
            <button
              onClick={handleRefresh}
              title="Refresh Balance"
              className={`text-white/80 hover:text-white transition ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RotateCw size={14} />
            </button>
            {onOpenAddFund && (
              <button
                onClick={onOpenAddFund}
                title="Add Funds"
                className="bg-white/20 hover:bg-white/30 rounded-full p-0.5 ml-1 transition"
              >
                <PlusCircle size={14} />
              </button>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition border border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AG'}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{user?.fullName || 'Agent'}</p>
                  <p className="text-xs text-slate-500 font-medium">{user?.shopName || 'Retail Kendra'}</p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
                    <ShieldCheck size={13} />
                    <span>KYC Verified ({user?.customId || 'RET-882910'})</span>
                  </div>
                </div>
                <div className="py-1">
                  <div className="px-4 py-1.5 text-xs text-slate-500 flex justify-between">
                    <span>Role:</span>
                    <span className="font-semibold text-slate-700">{user?.role || 'RETAILER'}</span>
                  </div>
                  <div className="px-4 py-1.5 text-xs text-slate-500 flex justify-between">
                    <span>Mobile:</span>
                    <span className="font-semibold text-slate-700">{user?.mobile || '9876543210'}</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Notice & Secondary Balances Banner */}
      <div className="bg-[#171738] text-white px-4 lg:px-6 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="font-black tracking-wider uppercase text-[13px] text-white shrink-0">
            DEAR PARTNERS
          </span>
          <div className="flex-1 md:flex-initial bg-orange-600 text-white font-bold px-3 py-0.5 rounded text-[11px] shadow-sm truncate">
            Move your QR collection from QR1 to QR3.
          </div>
        </div>

        <div className="flex items-center gap-6 self-end md:self-auto text-xs font-semibold">
          <div className="flex items-center gap-2 bg-[#232352] px-3 py-1 rounded-md border border-[#343372]">
            <span className="text-slate-400">AEPS BAL</span>
            <span className="font-bold text-white">{formatPaiseToRupees(wallet?.aepsBalance)}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#232352] px-3 py-1 rounded-md border border-[#343372]">
            <span className="text-slate-400">CREDIT BAL</span>
            <span className="font-bold text-white">{formatPaiseToRupees(wallet?.creditBalance)}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Promotion Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-800 text-white px-4 py-1.5 text-center text-xs font-medium border-t border-purple-700/50">
        <span className="inline-block animate-pulse mr-1">🎉</span>
        Effective 1 Nov 2025 — AEPS Pay & UPI rates revised. 🎉 Travel, CMS now live!
      </div>
    </header>
  );
};
