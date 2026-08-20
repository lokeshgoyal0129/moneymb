import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/formatters';

export const PassbookPage: React.FC = () => {
  const [passbook, setPassbook] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPassbook();
  }, []);

  const loadPassbook = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/passbook');
      setPassbook(res.data?.data || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">Account Passbook & Financial Ledger</h1>
          <p className="text-xs text-slate-500">Immutable double-entry debits, credits, and running balance audit</p>
        </div>
        <button
          onClick={loadPassbook}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
        >
          Refresh Passbook
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-orange-500" />
            <span className="text-xs font-semibold">Loading passbook entries...</span>
          </div>
        ) : passbook.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No passbook ledger entries found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Transaction ID / Ref</th>
                  <th className="px-4 py-3">Description & Service</th>
                  <th className="px-4 py-3 text-right">Debit (DR)</th>
                  <th className="px-4 py-3 text-right">Credit (CR)</th>
                  <th className="px-4 py-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {passbook.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDate(entry.postedAt)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {entry.referenceId || entry.transactionId || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 block">{entry.description}</span>
                      <span className="text-[10px] text-slate-400">{entry.serviceType}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.debitAmount > 0 ? (
                        <span className="font-bold text-rose-600 flex items-center justify-end gap-1">
                          <ArrowUpRight size={13} />
                          <span>-{formatPaiseToRupees(entry.debitAmount)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.creditAmount > 0 ? (
                        <span className="font-bold text-emerald-600 flex items-center justify-end gap-1">
                          <ArrowDownLeft size={13} />
                          <span>+{formatPaiseToRupees(entry.creditAmount)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatPaiseToRupees(entry.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
