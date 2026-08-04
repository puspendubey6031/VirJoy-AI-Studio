import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AuthUser } from '../types';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  onConfirmDelete: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onConfirmDelete
}) => {
  if (!isOpen) return null;

  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isConfirmed = confirmInput.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    setErrorMsg('');

    try {
      await onConfirmDelete();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-rose-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Banner Header */}
        <div className="flex items-center gap-3 border-b border-rose-900/30 pb-5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-md shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-rose-300">Delete VirJoy Account</h3>
            <p className="text-xs text-slate-400">Google Play Compliant Data Erasure</p>
          </div>
        </div>

        {/* Info & Consequences Box */}
        <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-2xl space-y-2 text-xs mb-5">
          <div className="flex items-center gap-1.5 font-extrabold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Warning: This action is permanent!
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Deleting your account ({authUser?.email || 'Current User'}) will immediately purge:
          </p>
          <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
            <li>All saved video projects, scenes, and generated drafts</li>
            <li>All remaining AI Credit allocations & active subscriptions</li>
            <li>Referral earnings and personal account history</li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-3 mb-6 text-xs">
          <label className="block text-slate-300 font-bold">
            To confirm deletion, type <span className="text-rose-400 font-mono">DELETE</span> below:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={e => setConfirmInput(e.target.value)}
            placeholder="Type DELETE"
            className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500 text-sm"
          />

          {errorMsg && (
            <p className="text-rose-400 text-[11px] font-semibold">{errorMsg}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
          >
            Keep Account
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer text-center shadow-lg shadow-rose-900/30"
          >
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
