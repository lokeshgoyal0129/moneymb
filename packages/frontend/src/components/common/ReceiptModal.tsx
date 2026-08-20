import React from 'react';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatPaiseToRupees, formatDate } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    referenceId: string;
    serviceType: string;
    status: string;
    grossAmount: number;
    commissionEarned?: number;
    bankRrn?: string;
    bankUtr?: string;
    beneficiaryName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    consumerNumber?: string;
    operatorCode?: string;
    billerName?: string;
    customerName?: string;
    vehicleNumber?: string;
    closingBalance?: number;
    transactionType?: string;
    aadhaarMasked?: string;
    receiptUrl?: string;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptData }) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-sm text-slate-700">Transaction Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" className="p-6 text-slate-800 text-xs font-sans">
          {/* Brand Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Money<span className="text-orange-500">MB</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">MoneyMB Financial & Retailer Network</p>
            <p className="text-[11px] text-slate-600 mt-1 font-medium">Customer Transaction Advice / Receipt</p>
          </div>

          {/* Success Badge */}
          <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle size={18} className="text-emerald-600" />
            <span>TRANSACTION SUCCESSFUL</span>
          </div>

          {/* Key Metric Card */}
          <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Transaction Amount</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {formatPaiseToRupees(receiptData.grossAmount)}
            </div>
          </div>

          {/* Detail Rows */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono font-bold text-slate-800">{receiptData.referenceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-800">{receiptData.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-medium text-slate-700">{formatDate(new Date().toISOString())}</span>
            </div>

            {/* Bank RRN / UTR */}
            {(receiptData.bankRrn || receiptData.bankUtr) && (
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Ref / RRN:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {receiptData.bankRrn || receiptData.bankUtr}
                </span>
              </div>
            )}

            {/* DMT Details */}
            {receiptData.beneficiaryName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-semibold text-slate-800">{receiptData.beneficiaryName}</span>
              </div>
            )}
            {receiptData.accountNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Account No:</span>
                <span className="font-mono font-semibold text-slate-800">{receiptData.accountNumber}</span>
              </div>
            )}
            {receiptData.ifscCode && (
              <div className="flex justify-between">
                <span className="text-slate-500">IFSC Code:</span>
                <span className="font-mono font-semibold text-slate-800">{receiptData.ifscCode}</span>
              </div>
            )}

            {/* Recharge Details */}
            {receiptData.consumerNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Consumer Number:</span>
                <span className="font-semibold text-slate-800">{receiptData.consumerNumber}</span>
              </div>
            )}
            {receiptData.operatorCode && (
              <div className="flex justify-between">
                <span className="text-slate-500">Operator:</span>
                <span className="font-semibold text-slate-800">{receiptData.operatorCode}</span>
              </div>
            )}

            {/* BBPS Details */}
            {receiptData.billerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Biller Name:</span>
                <span className="font-semibold text-slate-800">{receiptData.billerName}</span>
              </div>
            )}

            {/* FASTag Details */}
            {receiptData.vehicleNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Number:</span>
                <span className="font-bold text-slate-800">{receiptData.vehicleNumber}</span>
              </div>
            )}

            {/* AePS Details */}
            {receiptData.aadhaarMasked && (
              <div className="flex justify-between">
                <span className="text-slate-500">Aadhaar (Masked):</span>
                <span className="font-mono font-bold text-slate-800">{receiptData.aadhaarMasked}</span>
              </div>
            )}

            {receiptData.commissionEarned !== undefined && receiptData.commissionEarned > 0 && (
              <div className="flex justify-between bg-emerald-50/50 p-1.5 rounded">
                <span className="text-emerald-700 font-medium">Retailer Margin Earned:</span>
                <span className="font-bold text-emerald-800">
                  +{formatPaiseToRupees(receiptData.commissionEarned)}
                </span>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="mt-4 text-center text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center justify-center gap-1 text-slate-500 font-semibold">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>NPCI / RBI Compliant Digital Transaction</span>
            </div>
            <p>For support, email support@moneymb.in or call 1800-889-2026</p>
            <p className="font-mono text-[9px] text-slate-400">Security Hash: {Math.random().toString(36).slice(2, 14).toUpperCase()}</p>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
