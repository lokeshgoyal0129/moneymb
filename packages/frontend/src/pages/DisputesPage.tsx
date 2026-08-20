import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

export const DisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [referenceId, setReferenceId] = useState('');
  const [serviceType, setServiceType] = useState('DMT');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/disputes');
      setDisputes(res.data?.data || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/disputes/create', {
        referenceId,
        serviceType,
        reason
      });
      setIsModalOpen(false);
      setReferenceId('');
      setReason('');
      await loadDisputes();
    } catch {
      // Ignored
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">Support & Dispute Desk</h1>
          <p className="text-xs text-slate-500">Raise complaints, track refunds, and resolve transaction disputes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition"
        >
          <PlusCircle size={15} />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={24} className="animate-spin text-orange-500" />
            <span className="text-xs font-semibold">Loading tickets...</span>
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No complaints or disputes found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ticket No</th>
                  <th className="px-4 py-3">Txn Reference</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Reason / Issue</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{d.ticketNumber}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{d.referenceId}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{d.serviceType}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{d.reason}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Raise Transaction Dispute</h3>
            <p className="text-xs text-slate-500 mb-4">Our operations desk will resolve within 4 business hours.</p>

            <form onSubmit={handleCreateDispute} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Reference ID</label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. TXN_20260818_1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="DMT">Domestic Money Transfer</option>
                  <option value="RECHARGE">Mobile/DTH Recharge</option>
                  <option value="BBPS">Bharat BillPay</option>
                  <option value="FASTAG">FASTag</option>
                  <option value="AEPS_CW">AePS</option>
                  <option value="SETTLEMENT">Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Describe Issue</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Beneficiary account not credited but wallet debited"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
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
                  {submitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
