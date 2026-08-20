import React, { useState, useEffect } from 'react';
import { Search, Printer, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/formatters';
import { ReceiptModal } from '../components/common/ReceiptModal';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [serviceFilter, statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/transactions', {
        params: {
          serviceType: serviceFilter || undefined,
          status: statusFilter || undefined
        }
      });
      setTransactions(res.data?.data?.items || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (referenceId: string) => {
    try {
      const res = await api.get(`/reports/receipt/${referenceId}`);
      const data = res.data?.data?.transaction;
      setSelectedReceipt({
        ...data,
        beneficiaryName: data.details?.beneficiaryName,
        accountNumber: data.details?.accountNumber,
        ifscCode: data.details?.ifscCode,
        billerName: data.details?.billerName,
        consumerNumber: data.details?.consumerNumber,
        operatorCode: data.details?.operatorCode,
        vehicleNumber: data.details?.vehicleNumber
      });
      setIsReceiptOpen(true);
    } catch {
      // Ignored
    }
  };

  const filteredList = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.referenceId.toLowerCase().includes(q) ||
      (t.bankRrn && t.bankRrn.toLowerCase().includes(q)) ||
      t.serviceType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">Master Transaction Statement</h1>
          <p className="text-xs text-slate-500">Live auditable transaction ledger records</p>
        </div>
        <button
          onClick={loadTransactions}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold self-start sm:self-auto"
        >
          Refresh List
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Transaction ID, RRN or Service..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
          />
        </div>

        {/* Service Type Filter */}
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 w-full md:w-48"
        >
          <option value="">All Services</option>
          <option value="DMT">Domestic Money Transfer</option>
          <option value="RECHARGE">Mobile & DTH Recharge</option>
          <option value="BBPS">Bharat BillPay (BBPS)</option>
          <option value="FASTAG">FASTag Toll</option>
          <option value="AEPS_CW">AePS Cash Withdrawal</option>
          <option value="SETTLEMENT">Bank Settlement</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 w-full md:w-36"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-orange-500" />
            <span className="text-xs font-semibold">Loading transactions...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No transactions found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Txn ID & Date</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Bank Ref (RRN/UTR)</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredList.map((txn) => (
                  <tr key={txn.id || txn.referenceId} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-900 block">{txn.referenceId}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(txn.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {txn.serviceType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {txn.bankRrn || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      {formatPaiseToRupees(txn.grossAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      +{formatPaiseToRupees(txn.commissionAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          txn.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : txn.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenReceipt(txn.referenceId)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View & Print Receipt"
                      >
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isReceiptOpen && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          receiptData={selectedReceipt}
        />
      )}
    </div>
  );
};
