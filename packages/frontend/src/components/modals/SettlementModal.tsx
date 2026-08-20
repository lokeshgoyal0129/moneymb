import React, { useState, useEffect } from 'react';
import { X, Landmark, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatPaiseToRupees } from '../../utils/formatters';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, refreshWallet } = useAuthStore();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amountRupees, setAmountRupees] = useState('1000');
  const [payoutMode, setPayoutMode] = useState('IMPS');
  const [transactionPin, setTransactionPin] = useState('1234');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      const res = await api.get('/settlement/accounts');
      const list = res.data?.data || [];
      setAccounts(list);
      if (list.length > 0) {
        setSelectedAccountId(list[0].id);
      }
    } catch {
      setError('Could not load settlement bank accounts');
    }
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = Math.round(parseFloat(amountRupees) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/settlement/payout', {
        settlementAccountId: selectedAccountId,
        amount: amountPaise,
        payoutMode,
        transactionPin
      });

      await refreshWallet();
      onClose();
      onSuccess({
        ...res.data.data,
        grossAmount: amountPaise,
        serviceType: 'SETTLEMENT PAYOUT (IMPS)'
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Settlement payout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Settlement Payout</h3>
              <p className="text-[11px] text-slate-500">Move AePS balance to your verified bank account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handlePayout} className="space-y-4">
            {/* AePS Balance Card */}
            <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-xl flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Available AePS Balance:</span>
              <span className="text-base font-black text-indigo-900">{formatPaiseToRupees(wallet?.aepsBalance)}</span>
            </div>

            {/* Select Bank Account */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank Account</label>
              {accounts.length === 0 ? (
                <p className="text-xs text-red-600 font-semibold">No settlement accounts linked.</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs ${
                        selectedAccountId === acc.id
                          ? 'bg-orange-50/50 border-orange-500 ring-1 ring-orange-500'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{acc.bankName} - {acc.accountHolderName}</p>
                        <p className="font-mono text-[11px] text-slate-500">A/C: {acc.accountNumber} | IFSC: {acc.ifscCode}</p>
                      </div>
                      {acc.isVerified && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          Penny Verified
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amount & Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payout Amount (₹)</label>
                <input
                  type="number"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  min="100"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payout Mode</label>
                <select
                  value={payoutMode}
                  onChange={(e) => setPayoutMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="IMPS">IMPS (Instant ₹5.00)</option>
                  <option value="NEFT">NEFT (Standard)</option>
                </select>
              </div>
            </div>

            {/* Transaction PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={6}
                value={transactionPin}
                onChange={(e) => setTransactionPin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-orange-500 focus:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || accounts.length === 0}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Execute Bank Settlement ₹{amountRupees}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
