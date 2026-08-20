import React, { useState } from 'react';
import { X, Search, UserPlus, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatPaiseToRupees } from '../../utils/formatters';

interface DmtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
}

export const DmtModal: React.FC<DmtModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, refreshWallet } = useAuthStore();

  const [step, setStep] = useState<'LOOKUP' | 'TRANSFER' | 'ADD_BENEFICIARY'>('LOOKUP');
  const [mobile, setMobile] = useState('9876543210');
  const [remitter, setRemitter] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedBen, setSelectedBen] = useState<any>(null);

  // Transfer Form State
  const [amountRupees, setAmountRupees] = useState('1000');
  const [channel, setChannel] = useState<'IMPS' | 'NEFT'>('IMPS');
  const [transactionPin, setTransactionPin] = useState('1234');

  // Add Beneficiary Form State
  const [benName, setBenName] = useState('');
  const [benAccount, setBenAccount] = useState('');
  const [benIfsc, setBenIfsc] = useState('');
  const [benBank, setBenBank] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/dmt/remitter/lookup', { mobile });
      if (res.data?.data?.isRegistered) {
        setRemitter(res.data.data.remitter);
        setBeneficiaries(res.data.data.beneficiaries || []);
        if (res.data.data.beneficiaries?.length > 0) {
          setSelectedBen(res.data.data.beneficiaries[0]);
        }
        setStep('TRANSFER');
      } else {
        const regRes = await api.post('/dmt/remitter/register', {
          mobile,
          name: 'Customer Remitter',
          pincode: '400001'
        });
        setRemitter(regRes.data.data.remitter);
        setBeneficiaries([]);
        setStep('ADD_BENEFICIARY');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to lookup remitter');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/dmt/beneficiary/add', {
        remitterMobile: mobile,
        beneficiaryName: benName,
        accountNumber: benAccount,
        ifscCode: benIfsc,
        bankName: benBank
      });
      const newBen = res.data.data.beneficiary;
      setBeneficiaries([...beneficiaries, newBen]);
      setSelectedBen(newBen);
      setStep('TRANSFER');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add beneficiary');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBen) {
      setError('Please select a beneficiary');
      return;
    }
    const amountPaise = Math.round(parseFloat(amountRupees) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/dmt/transfer', {
        remitterMobile: mobile,
        remitterName: remitter?.name || 'Customer',
        beneficiaryId: selectedBen.id,
        accountNumber: selectedBen.accountNumber,
        ifscCode: selectedBen.ifscCode,
        bankName: selectedBen.bankName,
        beneficiaryName: selectedBen.beneficiaryName,
        amount: amountPaise,
        channel,
        transactionPin
      });

      await refreshWallet();
      onClose();
      onSuccess({
        ...res.data.data,
        serviceType: 'DOMESTIC MONEY TRANSFER (DMT)'
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transaction failed');
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
              ₹
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Domestic Money Transfer (DMT)</h3>
              <p className="text-[11px] text-slate-500">Instant IMPS / NEFT 24x7 Settlement</p>
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

          {/* STEP 1: Remitter Lookup */}
          {step === 'LOOKUP' && (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer / Remitter Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Lookup</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Quick Test Remitter:</p>
                <p>Mobile: <span className="font-mono font-bold text-slate-800">9876543210</span> (Pre-verified with 2 bank accounts)</p>
              </div>
            </form>
          )}

          {/* STEP 2: Transfer */}
          {step === 'TRANSFER' && (
            <form onSubmit={handleTransfer} className="space-y-4">
              {/* Remitter Info Card */}
              <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Remitter: </span>
                  <span className="font-bold text-slate-800">{remitter?.name} ({mobile})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Monthly Limit: </span>
                  <span className="font-bold text-emerald-600">{formatPaiseToRupees(remitter?.remainingLimit)}</span>
                </div>
              </div>

              {/* Beneficiary Select */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Select Beneficiary Account</label>
                  <button
                    type="button"
                    onClick={() => setStep('ADD_BENEFICIARY')}
                    className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <UserPlus size={13} />
                    <span>Add New</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {beneficiaries.map((ben) => (
                    <div
                      key={ben.id}
                      onClick={() => setSelectedBen(ben)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedBen?.id === ben.id
                          ? 'bg-orange-50/50 border-orange-500 ring-1 ring-orange-500'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800">{ben.beneficiaryName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          A/C: {ben.accountNumber} | IFSC: {ben.ifscCode}
                        </p>
                        <p className="text-[10px] text-indigo-600 font-semibold">{ben.bankName}</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                        {selectedBen?.id === ben.id && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    min="1"
                    max="50000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Mode</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="IMPS">IMPS (Instant 24x7)</option>
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
                  placeholder="Enter 4-digit PIN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  required
                />
              </div>

              {/* Wallet Info */}
              <div className="flex justify-between text-xs text-slate-500 px-1 font-medium">
                <span>Available Main Balance:</span>
                <span className="font-bold text-slate-800">{formatPaiseToRupees(wallet?.mainBalance)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                <span>Confirm & Send ₹{amountRupees}</span>
              </button>
            </form>
          )}

          {/* STEP 3: Add Beneficiary */}
          {step === 'ADD_BENEFICIARY' && (
            <form onSubmit={handleAddBeneficiary} className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-slate-800">Add New Beneficiary Bank</span>
                <button
                  type="button"
                  onClick={() => setStep('TRANSFER')}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Back to List
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">Beneficiary Full Name</label>
                <input
                  type="text"
                  value={benName}
                  onChange={(e) => setBenName(e.target.value)}
                  placeholder="As per bank passbook"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-0.5">Bank Account Number</label>
                <input
                  type="text"
                  value={benAccount}
                  onChange={(e) => setBenAccount(e.target.value)}
                  placeholder="9-18 digit account number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">IFSC Code</label>
                  <input
                    type="text"
                    value={benIfsc}
                    onChange={(e) => setBenIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={benBank}
                    onChange={(e) => setBenBank(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow transition mt-2"
              >
                {loading ? 'Verifying...' : 'Verify & Add Beneficiary'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
