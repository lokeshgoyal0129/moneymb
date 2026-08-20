import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { BbpsCategory } from '@fintech/shared';
import { formatPaiseToRupees } from '../../utils/formatters';

interface BbpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
}

export const BbpsModal: React.FC<BbpsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, refreshWallet } = useAuthStore();

  const [category, setCategory] = useState<BbpsCategory>(BbpsCategory.ELECTRICITY);
  const [billers, setBillers] = useState<any[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<any>(null);
  const [consumerId, setConsumerId] = useState('1029384756');
  const [fetchedBill, setFetchedBill] = useState<any>(null);
  const [transactionPin, setTransactionPin] = useState('1234');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBillers(category);
    }
  }, [category, isOpen]);

  const loadBillers = async (cat: BbpsCategory) => {
    try {
      const res = await api.get('/bbps/billers', { params: { category: cat } });
      const list = res.data?.data || [];
      setBillers(list);
      if (list.length > 0) {
        setSelectedBiller(list[0]);
      }
      setFetchedBill(null);
    } catch {
      setError('Could not load billers');
    }
  };

  const handleFetchBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiller) return;
    setFetching(true);
    setError(null);
    try {
      const res = await api.post('/bbps/fetch-bill', {
        billerId: selectedBiller.billerId,
        category,
        consumerIdentifier: consumerId
      });
      setFetchedBill(res.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bill from BBPS');
    } finally {
      setFetching(false);
    }
  };

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchedBill) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/bbps/pay-bill', {
        billerId: fetchedBill.billerId,
        billerName: fetchedBill.billerName,
        category,
        consumerIdentifier: fetchedBill.consumerIdentifier,
        customerName: fetchedBill.customerName,
        billNumber: fetchedBill.billNumber,
        billDate: fetchedBill.billDate,
        dueDate: fetchedBill.dueDate,
        amount: fetchedBill.billAmount,
        transactionPin
      });

      await refreshWallet();
      onClose();
      onSuccess({
        ...res.data.data,
        serviceType: 'BHARAT BILLPAY (BBPS)'
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Bill payment failed');
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
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Bharat Bill Payment System (BBPS)</h3>
              <p className="text-[11px] text-slate-500">Electricity, Water, Gas, Broadband & Taxes</p>
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

          {/* Category Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl mb-4 text-[11px] font-bold">
            <button
              onClick={() => setCategory(BbpsCategory.ELECTRICITY)}
              className={`py-1.5 rounded-lg ${category === BbpsCategory.ELECTRICITY ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              Electricity
            </button>
            <button
              onClick={() => setCategory(BbpsCategory.WATER)}
              className={`py-1.5 rounded-lg ${category === BbpsCategory.WATER ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              Water
            </button>
            <button
              onClick={() => setCategory(BbpsCategory.GAS)}
              className={`py-1.5 rounded-lg ${category === BbpsCategory.GAS ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              Piped Gas
            </button>
            <button
              onClick={() => setCategory(BbpsCategory.BROADBAND)}
              className={`py-1.5 rounded-lg ${category === BbpsCategory.BROADBAND ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
            >
              Broadband
            </button>
          </div>

          {!fetchedBill ? (
            /* STEP 1: Fetch Bill Form */
            <form onSubmit={handleFetchBill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Biller</label>
                <select
                  value={selectedBiller?.billerId || ''}
                  onChange={(e) => {
                    const b = billers.find((item) => item.billerId === e.target.value);
                    setSelectedBiller(b);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {billers.map((b) => (
                    <option key={b.billerId} value={b.billerId}>
                      {b.billerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedBiller?.paramName || 'Consumer Number'}
                </label>
                <input
                  type="text"
                  value={consumerId}
                  onChange={(e) => setConsumerId(e.target.value)}
                  placeholder={selectedBiller?.paramPlaceholder || 'Enter consumer number'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={fetching}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                {fetching ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                <span>Fetch Live Bill</span>
              </button>
            </form>
          ) : (
            /* STEP 2: Confirm & Pay Form */
            <form onSubmit={handlePayBill} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Bill Validated from BBPS</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    DUE: {fetchedBill.dueDate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>
                    <p className="text-slate-500 text-[10px]">Customer Name</p>
                    <p className="font-bold text-slate-900">{fetchedBill.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">Bill Number</p>
                    <p className="font-mono font-bold text-slate-900">{fetchedBill.billNumber}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total Payable Amount:</span>
                  <span className="text-lg font-black text-emerald-900">
                    {formatPaiseToRupees(fetchedBill.billAmount)}
                  </span>
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

              {/* Wallet Info */}
              <div className="flex justify-between text-xs text-slate-500 px-1 font-medium">
                <span>Main Wallet Balance:</span>
                <span className="font-bold text-slate-800">{formatPaiseToRupees(wallet?.mainBalance)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFetchedBill(null)}
                  className="w-1/3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>Pay Bill Now</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
