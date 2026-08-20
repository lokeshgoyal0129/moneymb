import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Send,
  Fingerprint,
  LayoutGrid,
  ReceiptText,
  FileSpreadsheet,
  Globe,
  QrCode,
  RotateCcw,
  PlusSquare,
  BookOpen,
  ArrowLeftRight,
  Headphones,
  Landmark,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '@fintech/shared';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Money Transfer (DMT)', path: '/dmt', icon: Send },
    { name: 'AePS Banking', path: '/aeps', icon: Fingerprint },
    { name: 'Summary', path: '/summary', icon: LayoutGrid },
    { name: 'Transaction', path: '/transactions', icon: ReceiptText },
    { name: 'CMS Transaction', path: '/cms-transactions', icon: FileSpreadsheet },
    { name: 'Travel', path: '/travel', icon: Globe },
    { name: 'Qr Orders', path: '/qr-orders', icon: QrCode },
    { name: 'Refund Pending', path: '/refund-pending', icon: RotateCcw },
    { name: 'Fund Request', path: '/fund-request', icon: PlusSquare },
    { name: 'Account Statement', path: '/passbook', icon: BookOpen },
    { name: 'Gateway Orders', path: '/gateway-orders', icon: ArrowLeftRight },
    { name: 'Complaint', path: '/complaint', icon: Headphones },
    { name: 'Add Settlement Bank', path: '/settlement-bank', icon: Landmark },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const isAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

  return (
    <aside className="w-64 bg-[#171738] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-[#232352]">
      {/* Navigation List */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md font-bold'
                    : 'text-slate-300 hover:bg-[#232352] hover:text-white'
                }`
              }
            >
              <Icon size={16} className="shrink-0 opacity-90" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Admin Console Shortcut if Admin */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-[#232352]">
            <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Administration
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-orange-600 text-white font-bold'
                    : 'text-orange-400 hover:bg-[#232352] hover:text-orange-300'
                }`
              }
            >
              <ShieldAlert size={16} />
              <span>Admin Console</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#0F1026] text-[11px] text-slate-400 border-t border-[#232352] flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-300">MoneyMB</span> v1.0.0
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online</span>
        </div>
      </div>
    </aside>
  );
};
