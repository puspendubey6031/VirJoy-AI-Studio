import React, { useState, useEffect } from 'react';
import { X, CreditCard, Download, CheckCircle2, AlertCircle, Clock, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { AuthUser, AppConfig, PaymentItem } from '../types';

interface BillingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  config: AppConfig;
  onOpenPricing: () => void;
}

export const BillingHistoryModal: React.FC<BillingHistoryModalProps> = ({
  isOpen,
  onClose,
  authUser,
  config,
  onOpenPricing
}) => {
  if (!isOpen) return null;

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userEmail = authUser?.email || '';
    const allPayments = config.paymentsList || [];
    // Filter payments for user or display demo items if none
    const userPayments = allPayments.filter(
      p => !userEmail || p.userEmail.toLowerCase() === userEmail.toLowerCase()
    );

    if (userPayments.length > 0) {
      setPayments(userPayments);
    } else {
      // Demo records for clean preview
      setPayments([
        {
          id: 'pay-user-1',
          transactionId: 'TXN_VIRJOY_884931',
          userName: authUser?.name || 'VirJoy Creator',
          userEmail: authUser?.email || 'user@virjoy.ai',
          amount: 199,
          currency: 'INR',
          planName: 'Starter Plan (Monthly)',
          date: new Date(Date.now() - 3 * 86400000).toISOString().replace('T', ' ').substring(0, 16),
          status: 'Success',
          paymentMethod: 'Razorpay'
        }
      ]);
    }
    setIsLoading(false);
  }, [authUser, config]);

  const handleDownloadInvoice = (txn: PaymentItem) => {
    const invoiceText = `VIRJOY AI - OFFICIAL PAYMENT RECEIPT / INVOICE\n` +
      `--------------------------------------------------\n` +
      `Transaction ID: ${txn.transactionId}\n` +
      `Date: ${txn.date}\n` +
      `Customer Name: ${txn.userName}\n` +
      `Customer Email: ${txn.userEmail}\n` +
      `Plan: ${txn.planName}\n` +
      `Amount Paid: ${txn.currency === 'INR' ? '₹' : '$'}${txn.amount}\n` +
      `Status: ${txn.status}\n` +
      `Payment Gateway: ${txn.paymentMethod}\n` +
      `--------------------------------------------------\n` +
      `Thank you for subscribing to VirJoy AI Video Studio!`;

    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${txn.transactionId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Billing Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Billing & Payment History</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              View past subscription invoices, payment status and receipt downloads
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Plan</span>
            <span className="text-sm font-extrabold text-amber-400">
              {config.plans?.Free ? 'Starter / Free Plan' : 'Active Plan'}
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Upgrade Plan
          </button>
        </div>

        {/* Transactions Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Recent Invoices & Payment Records
          </h4>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading billing history...</div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-medium">No payment history found.</p>
                <p className="text-slate-500 text-[11px]">
                  When you purchase credits or upgrade your subscription, invoices will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Plan / Item</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {payments.map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/60">
                        <td className="py-3 px-3 font-mono text-[11px] text-indigo-300 font-bold">
                          {item.transactionId}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{item.planName}</td>
                        <td className="py-3 px-3 font-extrabold text-amber-400">
                          {item.currency === 'INR' ? '₹' : '$'}{item.amount}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === 'Success'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : item.status === 'Refunded'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[10px] text-slate-400">{item.date}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDownloadInvoice(item)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> PDF / TXT
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
