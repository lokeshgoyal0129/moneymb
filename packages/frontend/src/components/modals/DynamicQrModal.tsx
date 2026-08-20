import React, { useState } from 'react';
import { X, QrCode, Copy, Check, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface DynamicQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicQrModal: React.FC<DynamicQrModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [amountRupees, setAmountRupees] = useState('500');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const upiId = `moneymb.${user?.customId?.toLowerCase() || 'ret882910'}@icici`;
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(user?.shopName || 'Retail Kendra')}&am=${amountRupees}&cu=INR&tn=RetailCollection`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden text-center">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <QrCode size={16} />
            </div>
            <h3 className="font-bold text-xs text-slate-800">Dynamic UPI Collection QR</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Collection Amount (₹)</label>
            <input
              type="number"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-center text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
          </div>

          {/* QR Container */}
          <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl inline-block shadow-md">
            <img src={qrSvgUrl} alt="UPI QR Code" className="w-44 h-44 mx-auto" />
            <div className="mt-2 text-[11px] font-black text-slate-900">
              SCAN & PAY ₹{amountRupees}
            </div>
          </div>

          {/* UPI ID Pill */}
          <div className="mt-3 flex items-center justify-between bg-slate-100 p-2 rounded-xl text-xs">
            <span className="font-mono text-[11px] text-slate-700 font-semibold truncate max-w-[200px]">{upiId}</span>
            <button
              onClick={handleCopy}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>NPCI Bharat QR / Soundbox Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
