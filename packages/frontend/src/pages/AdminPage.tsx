import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Layers, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/formatters';

export const AdminPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, slabRes, userRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/slabs'),
        api.get('/admin/users')
      ]);
      setOverview(ovRes.data?.data);
      setSlabs(slabRes.data?.data || []);
      setUsers(userRes.data?.data || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 size={28} className="animate-spin text-orange-500" />
        <span className="text-xs font-semibold">Loading Admin Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800">Admin Control & Commission Matrix</h1>
        <p className="text-xs text-slate-500">Platform metrics, agent hierarchy, and multi-tier commission packages</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Gross Platform Turnover</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatPaiseToRupees(overview?.totalTurnoverPaise)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Commissions Paid</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">
            {formatPaiseToRupees(overview?.totalCommissionPaise)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Partner Agents</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{overview?.totalUsers || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {overview?.retailerCount} Retailers | {overview?.distributorCount} Distributors
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{overview?.totalTransactions || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Open Disputes: {overview?.openDisputes || 0}</p>
        </div>
      </div>

      {/* Commission Slabs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Master Commission Slabs (Real-Time Split)</h3>
            <p className="text-[11px] text-slate-500">Retailer, Distributor & Master Distributor margins per slab</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Min Amount</th>
                <th className="px-4 py-3">Max Amount</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Retailer Margin</th>
                <th className="px-4 py-3 text-right">Distributor Margin</th>
                <th className="px-4 py-3 text-right">MD Margin</th>
                <th className="px-4 py-3 text-center">TDS (194H)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {slabs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {s.serviceType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{formatPaiseToRupees(s.minAmount)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{formatPaiseToRupees(s.maxAmount)}</td>
                  <td className="px-4 py-3 font-bold text-slate-600">{s.calcType}</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-600">
                    {s.calcType === 'FLAT' ? formatPaiseToRupees(s.retailerVal) : `${(s.retailerVal / 100).toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">
                    {s.calcType === 'FLAT' ? formatPaiseToRupees(s.distributorVal) : `${(s.distributorVal / 100).toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-purple-600">
                    {s.calcType === 'FLAT' ? formatPaiseToRupees(s.masterDistVal) : `${(s.masterDistVal / 100).toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-500">{s.tdsPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Hierarchy Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-sm text-slate-800">Partner Agents & Hierarchy Tree</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Agent ID & Name</th>
                <th className="px-4 py-3">Shop Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Mobile & Email</th>
                <th className="px-4 py-3 text-right">Main Wallet Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-indigo-700 block">{u.customId}</span>
                    <span className="font-bold text-slate-900">{u.fullName}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{u.shopName}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="font-mono block">{u.mobile}</span>
                    <span className="text-[10px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">
                    {formatPaiseToRupees(u.wallet?.mainBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {u.status}
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
