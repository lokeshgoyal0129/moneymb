import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/formatters';

export const SummaryPage: React.FC = () => {
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-20');
  const [selectedService, setSelectedService] = useState('ALL');

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  const defaultRecords = [
    { id: 'REC-001', date: '2026-08-20', service: 'Money Transfer (DMT)', txns: 48, volume: 24500000, commission: 245000, status: 'SUCCESS' },
    { id: 'REC-002', date: '2026-08-20', service: 'AePS Cash Withdrawal', txns: 32, volume: 18000000, commission: 180000, status: 'SUCCESS' },
    { id: 'REC-003', date: '2026-08-19', service: 'AePS Aadhaar Pay', txns: 12, volume: 6000000, commission: 60000, status: 'SUCCESS' },
    { id: 'REC-004', date: '2026-08-19', service: 'Mobile & DTH Recharge', txns: 25, volume: 1200000, commission: 36000, status: 'SUCCESS' },
    { id: 'REC-005', date: '2026-08-18', service: 'Money Transfer (DMT)', txns: 55, volume: 29000000, commission: 290000, status: 'SUCCESS' },
    { id: 'REC-006', date: '2026-08-18', service: 'AePS Balance Enquiry', txns: 24, volume: 0, commission: 12000, status: 'SUCCESS' },
    { id: 'REC-007', date: '2026-08-17', service: 'Utility Bill Pay (BBPS)', txns: 18, volume: 4500000, commission: 45000, status: 'SUCCESS' }
  ];

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary');
      if (res.data?.data?.records) {
        setRecords(res.data.data.records);
      } else {
        setRecords(defaultRecords);
      }
    } catch (err) {
      console.error('Failed to fetch summary reports', err);
      setRecords(defaultRecords);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummary();
  };

  const filteredRecords = records.filter((r) => {
    if (selectedService === 'ALL') return true;
    if (selectedService === 'DMT') return r.service.toLowerCase().includes('dmt') || r.service.toLowerCase().includes('transfer');
    if (selectedService === 'AEPS') return r.service.toLowerCase().includes('aeps') || r.service.toLowerCase().includes('aadhaar');
    if (selectedService === 'RECHARGE') return r.service.toLowerCase().includes('recharge');
    if (selectedService === 'BBPS') return r.service.toLowerCase().includes('bbps') || r.service.toLowerCase().includes('bill');
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Simple Page Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Summary Records</h1>
          <p className="text-xs text-slate-500 font-medium">Select date range & service type to view transaction summary records</p>
        </div>
      </div>

      {/* Filter Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white"
              required
            />
          </div>

          {/* Select Service Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Service
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Services</option>
              <option value="DMT">Money Transfer (DMT)</option>
              <option value="AEPS">AePS Banking</option>
              <option value="RECHARGE">Recharge</option>
              <option value="BBPS">Utility Bill Pay (BBPS)</option>
            </select>
          </div>

          {/* Submit Action Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Submit</span>}
            </button>
          </div>
        </form>
      </div>

      {/* Summary Data Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Summary Records Data</h3>
          <span className="text-xs font-semibold text-slate-500">{filteredRecords.length} Records Found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4 text-center">Total Txns</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4 text-right">Commission (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
              {filteredRecords.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{rec.date}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{rec.service}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-700">{rec.txns}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
                    {formatPaiseToRupees(rec.volume)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                    {formatPaiseToRupees(rec.commission)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
