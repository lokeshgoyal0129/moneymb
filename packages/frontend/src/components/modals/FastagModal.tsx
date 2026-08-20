import React, { useState } from 'react';
import { X, Car, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatPaiseToRupees } from '../../utils/formatters';

interface FastagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
}

export const FastagModal: React.FC<FastagModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, refreshWallet } = useAuthStore();

  const [vehicleNumber, setVehicleNumber] = useState('MH02CB1234');
  const [operatorCode] = useState('SBI_FASTAG');
  const [tagDetails, setTagDetails] = useState<any>(null);
  const [amountRupees, setAmountRupees] = useState('500');
  const [transactionPin, setTransactionPin] = useState('1234');

  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = async () => {
    setLookingUp(true);
    setError(null);
    try {
      const res = await api.post('/fastag/lookup', { vehicleNumber });
      setTagDetails(res.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'FASTag lookup failed');
    } finally {
      setLookingUp(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = Math.round(parseFloat(amountRupees) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/fastag/recharge', {
        vehicleNumber,
        operatorCode,
        amount: amountPaise,
        transactionPin
      });

      await refreshWallet();
      onClose();
      onSuccess({
        ...res.data.data,
        serviceType: 'FASTAG TOLL RECHARGE'
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'FASTag recharge failed');
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
              <Car size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">NETC FASTag Recharge</h3>
              <p className="text-[11px] text-slate-500">Instant National Highway Toll Tag Topup</p>
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

          <form onSubmit={handleRecharge} className="space-y-4">
            {/* Vehicle Number Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MH02CB1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookingUp}
                  className="absolute right-1 top-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  {lookingUp ? 'Verifying...' : 'Verify Tag'}
                </button>
              </div>
            </div>

            {/* Tag Info Card */}
            {tagDetails && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-800">{tagDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issuer Bank:</span>
                  <span className="font-semibold text-emerald-800">{tagDetails.issuerBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NETC Status:</span>
                  <span className="font-bold text-emerald-700">{tagDetails.tagStatus}</span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Recharge Amount (₹)</label>
              <input
                type="number"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                min="100"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                required
              />
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
              <span>Main Balance:</span>
              <span className="font-bold text-slate-800">{formatPaiseToRupees(wallet?.mainBalance)}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Recharge FASTag ₹{amountRupees}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
