import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatPaiseToRupees } from '../../utils/formatters';

interface AddFundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFundModal: React.FC<AddFundModalProps> = ({ isOpen, onClose }) => {
  const { wallet, refreshWallet } = useAuthStore();
  const [amountRupees, setAmountRupees] = useState('5000');
  const [paymentMode, setPaymentMode] = useState('UPI_DIRECT');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = Math.round(parseFloat(amountRupees) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) return;

    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.post('/wallet/fund-request', {
        amount: amountPaise,
        paymentMode
      });
      await refreshWallet();
      setSuccessMsg(res.data?.message || 'Wallet loaded successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Add Wallet Balance</h3>
              <p className="text-[11px] text-slate-500">Instant UPI & Direct Bank Topup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleTopup} className="space-y-4">
            <div className="flex justify-between text-xs text-slate-500 px-1 font-medium">
              <span>Current Main Balance:</span>
              <span className="font-bold text-slate-800">{formatPaiseToRupees(wallet?.mainBalance)}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter Top-up Amount (₹)</label>
              <input
                type="number"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                min="100"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-4 gap-2">
              {['1000', '2000', '5000', '10000'].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmountRupees(amt)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                    amountRupees === amt
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="UPI_DIRECT">Instant UPI Direct Auto-Credit (0% Fee)</option>
                <option value="NET_BANKING">Net Banking (IMPS/NEFT)</option>
                <option value="DEPOSIT_REQUEST">Bank Branch Cash Deposit Slip</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Top-up Wallet with ₹{amountRupees}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
