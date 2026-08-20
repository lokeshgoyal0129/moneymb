import React, { useState, useEffect } from 'react';
import { Landmark, PlusCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

export const SettlementBankPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settlement/accounts');
      setAccounts(res.data?.data || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/settlement/bank/add', {
        accountNumber,
        ifscCode,
        bankName,
        accountHolderName,
        isPrimary
      });
      setIsModalOpen(false);
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
      setAccountHolderName('');
      await loadAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add settlement account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">Settlement Bank Accounts</h1>
          <p className="text-xs text-slate-500">Manage verified commercial bank accounts for AePS & payout settlements</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition"
        >
          <PlusCircle size={15} />
          <span>Add Settlement Bank</span>
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-orange-500" />
            <span className="text-xs font-semibold">Loading settlement accounts...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-2 bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-semibold">
            No settlement bank accounts linked. Click "Add Settlement Bank" to link one.
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden"
            >
              {acc.isPrimary && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  Primary Account
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{acc.bankName}</h3>
                  <p className="text-xs text-slate-500 font-medium">{acc.accountHolderName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Account Number</span>
                  <span className="font-bold text-slate-800">{acc.accountNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">IFSC Code</span>
                  <span className="font-bold text-slate-800">{acc.ifscCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                  <CheckCircle2 size={14} />
                  <span>Penny Drop Verified</span>
                </div>
                <span className="text-[10px] text-slate-400">Linked on {formatDate(acc.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Bank Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Add Settlement Bank Account</h3>
            <p className="text-xs text-slate-500 mb-4">We will perform instant ₹1 penny drop verification.</p>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Full Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="As per bank passbook"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. ICICI Bank, State Bank of India"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="9-18 digits"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ICIC0000001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <label htmlFor="isPrimary" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Set as Primary Settlement Account
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  {submitting ? 'Verifying...' : 'Penny Drop & Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
