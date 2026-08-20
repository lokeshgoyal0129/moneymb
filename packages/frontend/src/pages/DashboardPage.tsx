import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Smartphone,
  Fingerprint,
  QrCode,
  Handshake,
  Wallet,
  Zap,
  Car,
  FileText,
  FileSpreadsheet,
  CreditCard,
  Send,
  Globe,
  PlusCircle,
  Tv,
  ScanLine
} from 'lucide-react';
import { DmtModal } from '../components/modals/DmtModal';
import { RechargeModal } from '../components/modals/RechargeModal';
import { BbpsModal } from '../components/modals/BbpsModal';
import { FastagModal } from '../components/modals/FastagModal';
import { AepsModal } from '../components/modals/AepsModal';
import { SettlementModal } from '../components/modals/SettlementModal';
import { AddFundModal } from '../components/modals/AddFundModal';
import { DynamicQrModal } from '../components/modals/DynamicQrModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { RechargeType } from '@fintech/shared';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const triggerSuccess = (data: any) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setReceiptData(data);
    setIsReceiptOpen(true);
  };

  const serviceCategories = [
    {
      id: 'DMT',
      name: 'DMT',
      desc: 'Money Transfer',
      icon: Send,
      color: 'from-orange-500 to-amber-500',
      action: () => navigate('/dmt')
    },
    {
      id: 'AEPS',
      name: 'AEPS',
      desc: 'Cash & Balance',
      icon: Fingerprint,
      color: 'from-indigo-600 to-purple-600',
      action: () => navigate('/aeps')
    },
    {
      id: 'UPI_ATM',
      name: 'UPI ATM',
      desc: '(Coming Soon)',
      icon: QrCode,
      color: 'from-slate-400 to-slate-500',
      badge: 'Coming Soon',
      action: () => setActiveModal('DYNAMIC_QR')
    },
    {
      id: 'AADHAAR_PAY',
      name: 'Aadhar Pay',
      desc: 'Biometric Pay',
      icon: Fingerprint,
      color: 'from-purple-600 to-pink-600',
      action: () => navigate('/aeps')
    },
    {
      id: 'SETTLEMENT',
      name: 'Settlement',
      desc: 'Bank Payout',
      icon: Handshake,
      color: 'from-emerald-600 to-teal-600',
      action: () => setActiveModal('SETTLEMENT')
    },
    {
      id: 'PPI_WALLET',
      name: 'PPI Wallet',
      desc: 'Prepaid Card',
      icon: Wallet,
      color: 'from-amber-500 to-orange-600',
      action: () => setActiveModal('ADD_FUND')
    },
    {
      id: 'RECHARGE_1',
      name: 'Recharge 1',
      desc: 'Mobile Prepaid',
      icon: Zap,
      color: 'from-orange-500 to-amber-500',
      action: () => setActiveModal('RECHARGE_PREPAID')
    },
    {
      id: 'RECHARGE_2',
      name: 'Recharge 2',
      desc: 'Postpaid & Specl',
      icon: Smartphone,
      color: 'from-orange-600 to-red-500',
      action: () => setActiveModal('RECHARGE_PREPAID')
    },
    {
      id: 'FASTAG',
      name: 'Fasttag',
      desc: 'Toll Recharge',
      icon: Car,
      color: 'from-orange-500 to-amber-500',
      action: () => setActiveModal('FASTAG')
    },
    {
      id: 'OFFLINE_BILL',
      name: 'Offline Bill Pay',
      desc: 'Utility Bills',
      icon: FileText,
      color: 'from-rose-500 to-pink-600',
      action: () => setActiveModal('BBPS')
    },
    {
      id: 'PART_BILL',
      name: 'Part Bill Pay',
      desc: 'Partial Collect',
      icon: FileSpreadsheet,
      color: 'from-rose-600 to-orange-600',
      action: () => setActiveModal('BBPS')
    },
    {
      id: 'CC_PAY',
      name: 'CC Pay',
      desc: 'Card Payment',
      icon: CreditCard,
      color: 'from-indigo-600 to-blue-600',
      action: () => setActiveModal('BBPS')
    },
    {
      id: 'CC_PAY_2',
      name: 'CC Pay 2',
      desc: 'Fast Card Pay',
      icon: CreditCard,
      color: 'from-indigo-700 to-purple-700',
      action: () => setActiveModal('BBPS')
    },
    {
      id: 'WALLET_PAY',
      name: 'Wallet pay',
      desc: 'Peer Transfer',
      icon: Wallet,
      color: 'from-amber-600 to-orange-600',
      action: () => setActiveModal('ADD_FUND')
    },
    {
      id: 'QR_PAY_1',
      name: 'QR pay 1',
      desc: 'Dynamic Scan',
      icon: ScanLine,
      color: 'from-purple-600 to-indigo-600',
      action: () => setActiveModal('DYNAMIC_QR')
    },
    {
      id: 'QR_PAY_2',
      name: 'QR pay 2',
      desc: 'Soundbox UPI',
      icon: QrCode,
      color: 'from-purple-700 to-pink-600',
      action: () => setActiveModal('DYNAMIC_QR')
    },
    {
      id: 'TRAVEL',
      name: 'Travel',
      desc: 'Bus & Flight',
      icon: Globe,
      color: 'from-cyan-600 to-blue-600',
      action: () => setActiveModal('DMT')
    },
    {
      id: 'ADD_ONLINE_2',
      name: 'Add Online 2',
      desc: 'Gateway UPI',
      icon: PlusCircle,
      color: 'from-emerald-700 to-teal-700',
      action: () => setActiveModal('ADD_FUND')
    },
    {
      id: 'ADD_FUND',
      name: 'Add Fund',
      desc: 'Bank Deposit',
      icon: Handshake,
      color: 'from-amber-600 to-orange-600',
      action: () => setActiveModal('ADD_FUND')
    },
    {
      id: 'DTH',
      name: 'DTH',
      desc: 'Satellite TV',
      icon: Tv,
      color: 'from-rose-500 to-red-500',
      action: () => setActiveModal('RECHARGE_DTH')
    },
    {
      id: 'DYNAMIC_QR_1',
      name: 'Dynamic QR 1',
      desc: 'Custom UPI QR',
      icon: QrCode,
      color: 'from-indigo-600 to-purple-600',
      action: () => setActiveModal('DYNAMIC_QR')
    },
    {
      id: 'DYNAMIC_QR_2',
      name: 'Dynamic QR 2',
      desc: 'Instant Counter',
      icon: QrCode,
      color: 'from-indigo-700 to-purple-700',
      action: () => setActiveModal('DYNAMIC_QR')
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4-Column Quick Service Grid matching the exact MoneyMB retailer layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {serviceCategories.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="relative group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150 flex flex-col items-center justify-center text-center h-[120px]"
            >
              {/* Badge if available */}
              {item.badge && (
                <span className="absolute top-2 right-2 text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}

              {/* Icon Container */}
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
              >
                <Icon size={22} className="opacity-95" />
              </div>

              {/* Title & Subtext */}
              <div className="mt-2.5">
                <span className="font-extrabold text-[12px] text-slate-800 tracking-tight block">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-600 font-medium block truncate max-w-[110px]">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Action Modals */}
      {activeModal === 'DMT' && (
        <DmtModal
          isOpen={activeModal === 'DMT'}
          onClose={() => setActiveModal(null)}
          onSuccess={triggerSuccess}
        />
      )}

      {activeModal === 'RECHARGE_PREPAID' && (
        <RechargeModal
          isOpen={activeModal === 'RECHARGE_PREPAID'}
          onClose={() => setActiveModal(null)}
          onSuccess={triggerSuccess}
          initialType={RechargeType.PREPAID}
        />
      )}

      {activeModal === 'RECHARGE_DTH' && (
        <RechargeModal
          isOpen={activeModal === 'RECHARGE_DTH'}
          onClose={() => setActiveModal(null)}
          onSuccess={triggerSuccess}
          initialType={RechargeType.DTH}
        />
      )}

      {activeModal === 'BBPS' && (
        <BbpsModal
          isOpen={activeModal === 'BBPS'}
          onClose={() => setActiveModal(null)}
          onSuccess={triggerSuccess}
        />
      )}

      {activeModal === 'FASTAG' && (
        <FastagModal
          isOpen={activeModal === 'FASTAG'}
          onClose={() => setActiveModal(null)}
          onSuccess={triggerSuccess}
        />
      )}

      {activeModal === 'AEPS' && (
        <AepsModal
          isOpen={activeModal === 'AEPS'}
          onClose={() => setActiveModal(null)}
          onSuccess={triggerSuccess}
        />
      )}

      {activeModal === 'SETTLEMENT' && (
        <SettlementModal
          isOpen={activeModal === 'SETTLEMENT'}
          onClose={() => setActiveModal(null)}
          onSuccess={triggerSuccess}
        />
      )}

      {activeModal === 'ADD_FUND' && (
        <AddFundModal
          isOpen={activeModal === 'ADD_FUND'}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'DYNAMIC_QR' && (
        <DynamicQrModal
          isOpen={activeModal === 'DYNAMIC_QR'}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Printable Receipt Modal */}
      {isReceiptOpen && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          receiptData={receiptData}
        />
      )}
    </div>
  );
};
