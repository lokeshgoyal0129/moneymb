import React, { useState } from 'react';
import { Fingerprint, Banknote, FileSpreadsheet, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ServiceType } from '@fintech/shared';
import { ReceiptModal } from '../components/common/ReceiptModal';

export const AepsPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshWallet } = useAuthStore();

  const [transactionType, setTransactionType] = useState<ServiceType>(ServiceType.AEPS_CW);
  const [aadhaarNumber, setAadhaarNumber] = useState('583929484829');
  const [bankIin, setBankIin] = useState('607153'); // SBI IIN
  const [bankName, setBankName] = useState('State Bank of India');
  const [amountRupees, setAmountRupees] = useState('');
  const [isScanningBio, setIsScanningBio] = useState(false);
  const [bioCaptured, setBioCaptured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const bankOptions = [
    { iin: '607153', name: 'State Bank of India' },
    { iin: '508505', name: 'HDFC Bank Ltd' },
    { iin: '508534', name: 'ICICI Bank Ltd' },
    { iin: '607027', name: 'Punjab National Bank' },
    { iin: '606985', name: 'Bank of Baroda' },
    { iin: '607189', name: 'Canara Bank' }
  ];

  const handleCaptureBiometrics = () => {
    setIsScanningBio(true);
    setTimeout(() => {
      setIsScanningBio(false);
      setBioCaptured(true);
    }, 1000);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioCaptured) {
      setError('Please capture customer biometric fingerprint first');
      return;
    }

    const amountPaise =
      transactionType === ServiceType.AEPS_CW || transactionType === ServiceType.AADHAAR_PAY
        ? Math.round(parseFloat(amountRupees || '0') * 100)
        : 0;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/aeps/auth', {
        aadhaarLastFour: aadhaarNumber.slice(-4) || '4829',
        bankIin,
        bankName,
        transactionType,
        amount: amountPaise,
        pidDataXml: '<PID_BLOCK_ENCRYPTED_RD_SERVICE_SIMULATION/>',
        deviceMake: 'Mantra',
        deviceModel: 'MFS100',
        deviceSerial: 'MFS100_93847291'
      });

      await refreshWallet();
      setReceiptData({
        ...res.data.data,
        serviceType: `AEPS ${transactionType === ServiceType.AEPS_CW ? 'CASH WITHDRAWAL' : 'TRANSACTION'}`
      });
      setIsReceiptOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'AePS transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Page Header */}
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
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Aadhaar Enabled Payment System (AePS)
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              NPCI & UIDAI RD Service Compliant Biometric Banking
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
          ● RD Service Ready
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

      {/* AePS Main Card Container */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Service Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select AePS Banking Service
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100/80 rounded-2xl text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setTransactionType(ServiceType.AEPS_CW)}
              className={`py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                transactionType === ServiceType.AEPS_CW
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Banknote size={16} />
              <span>Cash Withdrawal</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType(ServiceType.AEPS_BE)}
              className={`py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                transactionType === ServiceType.AEPS_BE
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Balance Enquiry</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType(ServiceType.AEPS_MS)}
              className={`py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                transactionType === ServiceType.AEPS_MS
                  ? 'bg-white text-purple-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={16} />
              <span>Mini Statement</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType(ServiceType.AADHAAR_PAY)}
              className={`py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                transactionType === ServiceType.AADHAAR_PAY
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Fingerprint size={16} />
              <span>Aadhaar Pay</span>
            </button>
          </div>
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleExecute} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Bank */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Customer Bank
              </label>
              <div className="relative">
                <select
                  value={bankIin}
                  onChange={(e) => {
                    setBankIin(e.target.value);
                    const b = bankOptions.find((item) => item.iin === e.target.value);
                    if (b) setBankName(b.name);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                >
                  {bankOptions.map((b) => (
                    <option key={b.iin} value={b.iin}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Aadhaar Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Customer Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-digit Aadhaar number (e.g. 583929484829)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white tracking-widest"
                required
              />
            </div>
          </div>

          {/* Amount Field (For Cash Withdrawal & Aadhaar Pay) */}
          {(transactionType === ServiceType.AEPS_CW || transactionType === ServiceType.AADHAAR_PAY) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {transactionType === ServiceType.AADHAAR_PAY ? 'Aadhaar Pay Amount (₹)' : 'Withdrawal Amount (₹)'}
              </label>
              <input
                type="number"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                min="100"
                max="10000"
                placeholder="Enter amount (e.g. 2000)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                required
              />
            </div>
          )}

          {/* Biometric Scanner Block */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50/80 text-center space-y-3">
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  bioCaptured
                    ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500 shadow-md'
                    : isScanningBio
                    ? 'bg-orange-100 text-orange-600 animate-pulse border-2 border-orange-500'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Fingerprint size={32} />
              </div>
            </div>

            <div>
              <p className="text-sm font-black text-slate-900">
                {bioCaptured
                  ? 'Biometric Fingerprint Captured & Verified'
                  : isScanningBio
                  ? 'RD Service Device Scanning Fingerprint...'
                  : 'Place Customer Finger on Biometric Scanner'}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Compatible Device: Mantra MFS100 / Morpho RD Service
              </p>
            </div>

            {!bioCaptured && (
              <button
                type="button"
                onClick={handleCaptureBiometrics}
                disabled={isScanningBio}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition"
              >
                {isScanningBio ? 'Scanning...' : 'Capture Fingerprint'}
              </button>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading || !bioCaptured}
            className="w-full py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ShieldCheck size={18} />
            )}
            <span>
              {transactionType === ServiceType.AEPS_CW
                ? `Authorize Cash Withdrawal ${amountRupees ? `₹${amountRupees}` : ''}`
                : transactionType === ServiceType.AADHAAR_PAY
                ? `Authorize Aadhaar Pay ${amountRupees ? `₹${amountRupees}` : ''}`
                : 'Submit Biometric Authentication'}
            </span>
          </button>
        </form>
      </div>

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

export default AepsPage;
