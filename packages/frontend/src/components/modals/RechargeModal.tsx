import React, { useState } from 'react';
import { X, Smartphone, Tv, Zap, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { RechargeType } from '@fintech/shared';
import { formatPaiseToRupees } from '../../utils/formatters';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
  initialType?: RechargeType;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = RechargeType.PREPAID
}) => {
  const { wallet, refreshWallet } = useAuthStore();

  const [rechargeType, setRechargeType] = useState<RechargeType>(initialType);
  const [operatorCode, setOperatorCode] = useState('JIO');
  const [circleCode] = useState('MH');
  const [consumerNumber, setConsumerNumber] = useState('9876543210');
  const [amountRupees, setAmountRupees] = useState('299');
  const [transactionPin, setTransactionPin] = useState('1234');
  const [showPlans, setShowPlans] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const operators =
    rechargeType === RechargeType.DTH
      ? [
          { code: 'TATAPLAY', name: 'Tata Play DTH' },
          { code: 'AIRTEL_DTH', name: 'Airtel Digital TV' },
          { code: 'DISHTV', name: 'Dish TV' },
          { code: 'SUNDIRECT', name: 'Sun Direct' }
        ]
      : [
          { code: 'JIO', name: 'Jio Prepaid' },
          { code: 'AIRTEL', name: 'Airtel Prepaid' },
          { code: 'VI', name: 'Vodafone Idea (Vi)' },
          { code: 'BSNL', name: 'BSNL GSM' }
        ];

  const handleFetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.get('/recharge/plans', {
        params: { operatorCode, circleCode }
      });
      setPlans(res.data?.data || []);
      setShowPlans(true);
    } catch {
      setError('Could not fetch plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = Math.round(parseFloat(amountRupees) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Please enter a valid recharge amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/recharge/execute', {
        operatorCode,
        circleCode,
        consumerNumber,
        rechargeType,
        amount: amountPaise,
        transactionPin
      });

      await refreshWallet();
      onClose();
      onSuccess({
        ...res.data.data,
        serviceType: `${rechargeType} RECHARGE`
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Mobile & DTH Recharge</h3>
              <p className="text-[11px] text-slate-500">Instant Switch | 2.5% Retailer Margin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Type Selector Tab */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRechargeType(RechargeType.PREPAID);
                setOperatorCode('JIO');
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                rechargeType === RechargeType.PREPAID ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Smartphone size={14} />
              <span>Mobile Prepaid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRechargeType(RechargeType.DTH);
                setOperatorCode('TATAPLAY');
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                rechargeType === RechargeType.DTH ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Tv size={14} />
              <span>DTH Satellite TV</span>
            </button>
          </div>

          <form onSubmit={handleExecute} className="space-y-4">
            {/* Operator Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Operator</label>
              <select
                value={operatorCode}
                onChange={(e) => setOperatorCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {operators.map((op) => (
                  <option key={op.code} value={op.code}>
                    {op.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile / VC Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {rechargeType === RechargeType.DTH ? 'DTH VC / Subscriber ID' : 'Mobile Number'}
              </label>
              <input
                type="text"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                placeholder={rechargeType === RechargeType.DTH ? 'Enter VC number' : 'Enter 10-digit mobile'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                required
              />
            </div>

            {/* Amount & Plan Browser */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Recharge Amount (₹)</label>
                {rechargeType === RechargeType.PREPAID && (
                  <button
                    type="button"
                    onClick={handleFetchPlans}
                    className="text-xs text-orange-600 font-bold hover:underline"
                  >
                    {plansLoading ? 'Loading Plans...' : 'Browse Plans'}
                  </button>
                )}
              </div>
              <input
                type="number"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                min="10"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                required
              />
            </div>

            {/* Browse Plans Modal/Accordion */}
            {showPlans && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1">
                  <span>Available Tariff Plans</span>
                  <button onClick={() => setShowPlans(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setAmountRupees((p.amount / 100).toString());
                      setShowPlans(false);
                    }}
                    className="p-2 bg-white rounded-lg border border-slate-200 hover:border-orange-500 cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">₹{p.amount / 100}</span>
                      <span className="text-[10px] text-slate-500 ml-2">Val: {p.validity} | Data: {p.data}</span>
                      <p className="text-[10px] text-slate-600 truncate max-w-[280px]">{p.description}</p>
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      Select
                    </span>
                  </div>
                ))}
              </div>
            )}

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
              <span>Main Balance:</span>
              <span className="font-bold text-slate-800">{formatPaiseToRupees(wallet?.mainBalance)}</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              <span>Execute Recharge ₹{amountRupees}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
