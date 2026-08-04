import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Twitter,
  Send,
  Linkedin,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { AuthUser } from '../types';

interface ReferralDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  onOpenPricing?: () => void;
}

export const ReferralDashboardModal: React.FC<ReferralDashboardModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onOpenPricing
}) => {
  if (!isOpen) return null;

  const [dashboardData, setDashboardData] = useState<{
    referralCode: string;
    referralLink: string;
    pendingCount: number;
    completedCount: number;
    totalCreditsEarned: number;
    history: Array<{
      id: string;
      referredUserName: string;
      referredUserEmailMasked: string;
      status: string;
      planKey: string;
      creditsEarned: number;
      createdAt: string;
      completedAt?: string;
    }>;
  }>({
    referralCode: 'VIRJOY100',
    referralLink: 'https://virjoy.ai/signup?ref=VIRJOY100',
    pendingCount: 0,
    completedCount: 0,
    totalCreditsEarned: 0,
    history: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputRefCode, setInputRefCode] = useState('');
  const [applyMessage, setApplyMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Fetch real-time user referral data from backend
  const fetchUserReferralData = async () => {
    setIsLoading(true);
    try {
      const userId = authUser?.id || 'usr_admin';
      const email = authUser?.email || '';
      const res = await fetch(`/api/referrals/user?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDashboardData(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user referral info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReferralData();
  }, [authUser]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(dashboardData.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dashboardData.referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyReferralCode = async () => {
    if (!inputRefCode.trim()) return;
    setIsApplying(true);
    setApplyMessage(null);

    try {
      const res = await fetch('/api/referrals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerCode: inputRefCode.trim(),
          referredUserId: authUser?.id || `usr_${Date.now()}`,
          referredUserName: authUser?.name || 'VirJoy Creator',
          referredUserEmail: authUser?.email || ''
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setApplyMessage({ text: json.message || 'Referral code applied successfully!', isError: false });
        setInputRefCode('');
        fetchUserReferralData();
      } else {
        setApplyMessage({ text: json.error || 'Failed to apply referral code.', isError: true });
      }
    } catch (err: any) {
      setApplyMessage({ text: err?.message || 'Server error applying code.', isError: true });
    } finally {
      setIsApplying(false);
    }
  };

  // Social Sharing Links
  const shareText = `Join me on VirJoy AI and create stunning videos, banners & images with AI! Sign up using my referral link to get bonus AI Credits:`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${dashboardData.referralLink}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(dashboardData.referralLink)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(dashboardData.referralLink)}&text=${encodeURIComponent(shareText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(dashboardData.referralLink)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Referral Center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title Banner */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">Referral & Rewards Hub</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Earn Free Credits
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Invite friends to VirJoy AI. Earn up to <span className="text-amber-400 font-bold">100 Free Credits</span> for every friend who subscribes!
            </p>
          </div>
        </div>

        {/* Referral Link & Code Section */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-950 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Referral Code Box */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Your Unique Referral Code</span>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="font-mono font-black text-amber-400 text-base">{dashboardData.referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-md flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Your Unique Referral Link</span>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="font-mono text-slate-300 text-[11px] truncate max-w-[170px]">{dashboardData.referralLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-md flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Social Sharing Buttons */}
          <div className="pt-2 border-t border-indigo-900/40">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">Instant Social Share:</span>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Twitter className="w-3.5 h-3.5 text-sky-400" /> Twitter / X
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" /> Telegram
              </a>

              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Linkedin className="w-3.5 h-3.5 text-indigo-400" /> LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* User Stats Summary Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Earned</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {dashboardData.totalCreditsEarned} Credits
            </span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Friends</span>
            <span className="text-xl font-black text-amber-300 mt-0.5 block">
              {dashboardData.pendingCount}
            </span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Subscribed Friends</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {dashboardData.completedCount}
            </span>
          </div>
        </div>

        {/* Enter Friend's Referral Code Section */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 space-y-2">
          <span className="text-xs font-bold text-white block">Have a friend's referral code?</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Referral Code (e.g. VIRJOY100)"
              value={inputRefCode}
              onChange={e => setInputRefCode(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleApplyReferralCode}
              disabled={isApplying || !inputRefCode.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isApplying ? 'Applying...' : 'Apply Code'}
            </button>
          </div>
          {applyMessage && (
            <p className={`text-[11px] font-semibold mt-1 ${applyMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
              {applyMessage.text}
            </p>
          )}
        </div>

        {/* Referral History Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Referral Invite History
            </h4>
            <span className="text-[10px] text-slate-400">Reward issued after subscription purchase</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading referral history...</div>
            ) : dashboardData.history.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 font-medium">You haven't referred any friends yet.</p>
                <p className="text-slate-500 text-[11px]">
                  Share your referral link above on WhatsApp or Twitter to start earning free credits!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Referred User</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3">Reward Earned</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {dashboardData.history.map(item => (
                      <tr key={item.id} className="hover:bg-slate-900/60">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-white">{item.referredUserName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{item.referredUserEmailMasked}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === 'Completed'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : item.status === 'Refunded'
                                ? 'bg-rose-950 text-rose-300 border-rose-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-300">{item.planKey}</td>
                        <td className="py-2.5 px-3 font-black text-amber-300">
                          {item.creditsEarned > 0 ? `+${item.creditsEarned} Credits` : 'Pending'}
                        </td>
                        <td className="py-2.5 px-3 text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
