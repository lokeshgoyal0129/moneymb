import React, { useState } from 'react';
import { X, Fingerprint, Banknote, FileSpreadsheet, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ServiceType } from '@fintech/shared';

interface AepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
}

export const AepsModal: React.FC<AepsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { refreshWallet } = useAuthStore();

  const [transactionType, setTransactionType] = useState<ServiceType>(ServiceType.AEPS_CW);
  const [aadhaarLastFour, setAadhaarLastFour] = useState('4829');
  const [bankIin, setBankIin] = useState('607153'); // SBI IIN
  const [bankName, setBankName] = useState('State Bank of India');
  const [amountRupees, setAmountRupees] = useState('2000');
  const [isScanningBio, setIsScanningBio] = useState(false);
  const [bioCaptured, setBioCaptured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
    }, 1200);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioCaptured) {
      setError('Please capture customer biometric fingerprint first');
      return;
    }

    const amountPaise =
      transactionType === ServiceType.AEPS_CW || transactionType === ServiceType.AADHAAR_PAY
        ? Math.round(parseFloat(amountRupees) * 100)
        : 0;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/aeps/auth', {
        aadhaarLastFour,
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
      onClose();
      onSuccess({
        ...res.data.data,
        serviceType: `AEPS ${transactionType === ServiceType.AEPS_CW ? 'CASH WITHDRAWAL' : 'TRANSACTION'}`
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'AePS transaction failed');
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
              <Fingerprint size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Aadhaar Enabled Payment System (AePS)</h3>
              <p className="text-[11px] text-slate-500">NPCI / UIDAI RD Service Compliant</p>
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

          {/* Service Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTransactionType(ServiceType.AEPS_CW)}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                transactionType === ServiceType.AEPS_CW ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Banknote size={14} />
              <span>Cash Withdrawal</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType(ServiceType.AEPS_BE)}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                transactionType === ServiceType.AEPS_BE ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Balance Enquiry</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType(ServiceType.AEPS_MS)}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                transactionType === ServiceType.AEPS_MS ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Mini Statement</span>
            </button>
          </div>

          <form onSubmit={handleExecute} className="space-y-4">
            {/* Bank Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Bank</label>
              <select
                value={bankIin}
                onChange={(e) => {
                  setBankIin(e.target.value);
                  const b = bankOptions.find((item) => item.iin === e.target.value);
                  if (b) setBankName(b.name);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {bankOptions.map((b) => (
                  <option key={b.iin} value={b.iin}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Aadhaar Number (Masked) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Aadhaar Number (Last 4 digits)
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-400">
                  XXXX - XXXX -
                </span>
                <input
                  type="password"
                  maxLength={4}
                  value={aadhaarLastFour}
                  onChange={(e) => setAadhaarLastFour(e.target.value)}
                  placeholder="4829"
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-center text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Amount for Cash Withdrawal */}
            {transactionType === ServiceType.AEPS_CW && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  min="100"
                  max="10000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  required
                />
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Commission: ₹10.00 will be credited to your settlement wallet on ₹3,000+ withdrawal.
                </p>
              </div>
            )}

            {/* Biometric Scanner Card */}
            <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center">
              <div className="flex justify-center mb-2">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    bioCaptured
                      ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500 shadow-md'
                      : isScanningBio
                      ? 'bg-orange-100 text-orange-600 animate-pulse border-2 border-orange-500'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Fingerprint size={28} />
                </div>
              </div>

              <p className="text-xs font-bold text-slate-800">
                {bioCaptured
                  ? 'Biometric Fingerprint Captured & Tokenized'
                  : isScanningBio
                  ? 'RD Service Device Scanning...'
                  : 'Place Customer Finger on Biometric Scanner'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Device: Mantra MFS100 (RD Ready)</p>

              {!bioCaptured && (
                <button
                  type="button"
                  onClick={handleCaptureBiometrics}
                  disabled={isScanningBio}
                  className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow transition"
                >
                  {isScanningBio ? 'Scanning...' : 'Capture Fingerprint'}
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !bioCaptured}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>
                {transactionType === ServiceType.AEPS_CW
                  ? `Authorize Cash Withdrawal ₹${amountRupees}`
                  : 'Submit Biometric Authentication'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
