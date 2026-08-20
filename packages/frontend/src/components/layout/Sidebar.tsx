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
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '@fintech/shared';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`
        fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto
        w-64 bg-[#171738] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-[#232352]
        transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Mobile Drawer Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#232352] bg-[#12122d]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-base">
            M
          </div>
          <span className="font-extrabold text-white text-base">MoneyMB Navigation</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-[#232352] text-slate-400 hover:text-white transition"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
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
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
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

export default Sidebar;
