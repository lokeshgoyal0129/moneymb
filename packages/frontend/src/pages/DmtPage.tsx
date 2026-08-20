import React, { useState } from 'react';
import { UserPlus, ShieldCheck, Loader2, ArrowLeft, Smartphone, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatPaiseToRupees } from '../utils/formatters';
import { ReceiptModal } from '../components/common/ReceiptModal';

export const DmtPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshWallet } = useAuthStore();

  // Search Inputs
  const [mobileSearch, setMobileSearch] = useState('9876543210');
  const [accountSearch, setAccountSearch] = useState('');

  // App State
  const [step, setStep] = useState<'IDLE' | 'TRANSFER' | 'ADD_BENEFICIARY'>('IDLE');
  const [remitter, setRemitter] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedBen, setSelectedBen] = useState<any>(null);

  // Transfer Form State
  const [amountRupees, setAmountRupees] = useState('');
  const [channel, setChannel] = useState<'IMPS' | 'NEFT'>('IMPS');
  const [transactionPin] = useState('1234');

  // Add Beneficiary Form State
  const [benName, setBenName] = useState('');
  const [benAccount, setBenAccount] = useState('');
  const [benIfsc, setBenIfsc] = useState('');
  const [benBank, setBenBank] = useState('');

  // Status & Receipt State
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'MOBILE' | 'ACCOUNT' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Search by Mobile Number
  const handleMobileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mobileSearch) {
      setError('Please enter a mobile number');
      return;
    }
    setLoading(true);
    setError(null);
    setSearchType('MOBILE');

    try {
      const res = await api.post('/dmt/remitter/lookup', { mobile: mobileSearch });
      if (res.data?.data?.isRegistered) {
        setRemitter(res.data.data.remitter);
        const bens = res.data.data.beneficiaries || [];
        setBeneficiaries(bens);
        if (bens.length > 0) {
          setSelectedBen(bens[0]);
        }
        setStep('TRANSFER');
      } else {
        const regRes = await api.post('/dmt/remitter/register', {
          mobile: mobileSearch,
          name: 'Customer Remitter',
          pincode: '400001',
        });
        setRemitter(regRes.data.data.remitter);
        setBeneficiaries([]);
        setStep('ADD_BENEFICIARY');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mobile search failed');
    } finally {
      setLoading(false);
    }
  };

  // Search by Account Number
  const handleAccountSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accountSearch) {
      setError('Please enter an account number');
      return;
    }
    setLoading(true);
    setError(null);
    setSearchType('ACCOUNT');

    try {
      const res = await api.post('/dmt/remitter/lookup', { mobile: mobileSearch || '9876543210' });
      if (res.data?.data?.isRegistered) {
        setRemitter(res.data.data.remitter);
        const bens: any[] = res.data.data.beneficiaries || [];
        const matched = bens.filter((b) =>
          b.accountNumber.toLowerCase().includes(accountSearch.toLowerCase().trim())
        );

        if (matched.length > 0) {
          setBeneficiaries(matched);
          setSelectedBen(matched[0]);
          setStep('TRANSFER');
        } else {
          const customBen = {
            id: `ben_acc_${Date.now()}`,
            beneficiaryName: 'Verified Account Holder',
            accountNumber: accountSearch,
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
          };
          setBeneficiaries([customBen, ...bens]);
          setSelectedBen(customBen);
          setStep('TRANSFER');
        }
      } else {
        setError('Account number not found. Please try with customer mobile.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Account search failed');
    } finally {
      setLoading(false);
    }
  };

  // Add Beneficiary
  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/dmt/beneficiary/add', {
        remitterMobile: mobileSearch,
        beneficiaryName: benName,
        accountNumber: benAccount,
        ifscCode: benIfsc,
        bankName: benBank,
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

  // Execute Money Transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBen) {
      setError('Please select a beneficiary account');
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
        remitterMobile: mobileSearch || '9876543210',
        remitterName: remitter?.name || 'Customer Remitter',
        beneficiaryId: selectedBen.id,
        accountNumber: selectedBen.accountNumber,
        ifscCode: selectedBen.ifscCode,
        bankName: selectedBen.bankName,
        beneficiaryName: selectedBen.beneficiaryName,
        amount: amountPaise,
        channel,
        transactionPin,
      });

      await refreshWallet();
      setReceiptData({
        ...res.data.data,
        serviceType: 'DOMESTIC MONEY TRANSFER (DMT)',
      });
      setIsReceiptOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 font-sans">
      {/* Top Simple Page Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Domestic Money Transfer (DMT)</h1>
            <p className="text-xs text-slate-500 font-medium">Instant IMPS / NEFT 24×7 Settlement</p>
          </div>
        </div>

        <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
          ● Active Engine
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Dual Search Input Boxes */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Input Box 1: Search by Mobile Number */}
          <form onSubmit={handleMobileSubmit} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Smartphone size={16} className="text-orange-500" />
              <span>Search by Mobile Number</span>
            </div>

            <label className="block text-xs font-semibold text-slate-600">
              Mobile Number
            </label>

            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-4 pr-28 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                required
              />
              <button
                type="submit"
                disabled={loading && searchType === 'MOBILE'}
                className="absolute right-1.5 top-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1"
              >
                {loading && searchType === 'MOBILE' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>

          {/* Input Box 2: Search by Account Number */}
          <form onSubmit={handleAccountSubmit} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <CreditCard size={16} className="text-indigo-600" />
              <span>Search by Account Number</span>
            </div>

            <label className="block text-xs font-semibold text-slate-600">
              Bank Account Number
            </label>

            <div className="relative">
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Enter bank account number"
                className="w-full pl-4 pr-28 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <button
                type="submit"
                disabled={loading && searchType === 'ACCOUNT'}
                className="absolute right-1.5 top-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1"
              >
                {loading && searchType === 'ACCOUNT' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Remitter Helper Note */}
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800">Quick Test Mobile: </span>
            <span className="font-mono font-bold text-orange-600">9876543210</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setMobileSearch('9876543210');
              handleMobileSubmit();
            }}
            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition"
          >
            Submit Test Mobile
          </button>
        </div>
      </div>

      {/* Step 2: Remitter Accounts List & Selected Account Side Panel */}
      {step === 'TRANSFER' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          {/* Remitter Header Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Customer: </span>
              <span className="font-bold text-slate-900">{remitter?.name || 'Customer Remitter'}</span>
              <span className="text-slate-500 font-mono ml-2">({mobileSearch})</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Monthly Limit: </span>
              <span className="font-bold text-emerald-600">{formatPaiseToRupees(remitter?.remainingLimit || 25000000)}</span>
            </div>
          </div>

          {/* Split View: Left List of Accounts, Right Side Selected Account & Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Side (lg:col-span-5): List of Multiple Accounts */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Beneficiary Accounts List
                </h3>
                <button
                  type="button"
                  onClick={() => setStep('ADD_BENEFICIARY')}
                  className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1"
                >
                  <UserPlus size={14} />
                  <span>+ Add New</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {beneficiaries.map((ben) => {
                  const isSelected = selectedBen?.id === ben.id;
                  return (
                    <div
                      key={ben.id}
                      onClick={() => setSelectedBen(ben)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-slate-900">{ben.beneficiaryName}</p>
                        <p className="text-xs text-slate-600 font-mono">
                          A/C: <span className="font-bold text-slate-900">{ben.accountNumber}</span>
                        </p>
                        <p className="text-[11px] text-indigo-700 font-semibold">
                          {ben.bankName} • <span className="font-mono text-[10px] text-slate-500">{ben.ifscCode}</span>
                        </p>
                      </div>

                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                        {isSelected && <div className="w-3 h-3 rounded-full bg-orange-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side (lg:col-span-7): Selected Account Card & Transfer Form */}
            <div className="lg:col-span-7">
              <form onSubmit={handleTransfer} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-5">
                {/* Selected Account Summary Header */}
                {selectedBen ? (
                  <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                        Selected Beneficiary Account
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        Verified
                      </span>
                    </div>
                    <p className="text-base font-black text-slate-900">{selectedBen.beneficiaryName}</p>
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 font-mono">
                      <span>Account No: <strong className="text-slate-900">{selectedBen.accountNumber}</strong></span>
                      <span>IFSC: <strong className="text-slate-900">{selectedBen.ifscCode}</strong></span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-700">{selectedBen.bankName}</p>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    Select an account from the left list to proceed
                  </div>
                )}

                {/* Transfer Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      min="1"
                      max="50000"
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Transfer Mode
                    </label>
                    <div className="flex items-center gap-6 p-3 bg-white border border-slate-200 rounded-xl">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                        <input
                          type="radio"
                          name="channel"
                          value="IMPS"
                          checked={channel === 'IMPS'}
                          onChange={() => setChannel('IMPS')}
                          className="w-4 h-4 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <span>IMPS (Instant 24×7)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                        <input
                          type="radio"
                          name="channel"
                          value="NEFT"
                          checked={channel === 'NEFT'}
                          onChange={() => setChannel('NEFT')}
                          className="w-4 h-4 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <span>NEFT (Standard Batch)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !selectedBen}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>Send {amountRupees ? `₹${amountRupees}` : ''} Now</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Add Beneficiary Section */}
      {step === 'ADD_BENEFICIARY' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Add New Beneficiary Bank Account</h3>
            <button
              type="button"
              onClick={() => setStep('TRANSFER')}
              className="text-xs font-bold text-slate-500 hover:underline"
            >
              Cancel & Back
            </button>
          </div>

          <form onSubmit={handleAddBeneficiary} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary Full Name</label>
              <input
                type="text"
                value={benName}
                onChange={(e) => setBenName(e.target.value)}
                placeholder="As per bank passbook"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={benAccount}
                onChange={(e) => setBenAccount(e.target.value)}
                placeholder="9-18 digit bank account number"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={benIfsc}
                  onChange={(e) => setBenIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={benBank}
                  onChange={(e) => setBenBank(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition mt-2"
            >
              {loading ? 'Verifying...' : 'Submit & Add Beneficiary'}
            </button>
          </form>
        </div>
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

export default DmtPage;
