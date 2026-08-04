import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Sparkles, ExternalLink } from 'lucide-react';
import { AppConfig } from '../types';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  defaultTab?: 'privacy' | 'terms' | 'ai_policy';
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  config,
  defaultTab = 'privacy'
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'ai_policy'>(defaultTab);

  const legalConfig = config.legalPolicies || {
    privacyPolicy: `Privacy Policy for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Information Collection\nVirJoy AI ("we", "our", or "us") respects your privacy. We collect account details (email, display name), user-submitted prompts, media uploads, and generated video metadata to provide our AI video commercial creation service.\n\n2. Data Usage & AI Model Processing\nPrompts and user uploads are processed securely via encrypted AI API gateways solely to synthesize video commercials, voiceovers, and graphics. We do not sell your personal information or use your content for public model training without explicit consent.\n\n3. Data Retention & Auto-Cleanup\nTo protect user data and optimize storage, generated media outputs are automatically deleted after a default duration of 24 hours (or as configured by system policy). Users are advised to download generated assets promptly.\n\n4. Account Deletion Rights\nIn compliance with Google Play Store Developer Policies, users can permanently delete their account and all associated personal data directly within the app under User Settings -> Delete Account or by contacting support@virjoy.ai.\n\n5. Contact Information\nIf you have questions regarding this Privacy Policy, please email support@virjoy.ai.`,
    termsAndConditions: `Terms & Conditions for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Acceptance of Terms\nBy accessing or using VirJoy AI, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the application.\n\n2. AI Credit System & Usage Limits\nVirJoy AI operates on an AI Credit allocation system. Credits are consumed according to video duration (1 second = 1 credit). Unused monthly credits roll over or expire according to your subscription tier.\n\n3. Subscription & Billing\nUpgrades and recurring plans are processed securely via verified payment partners. Plan benefits, credit allocations, and refund terms are detailed during purchase.\n\n4. User Responsibilities\nYou agree not to generate illegal, abusive, sexually explicit, defamatory, or fraudulent content. VirJoy AI reserves the right to terminate accounts violating these guidelines.`,
    aiUsagePolicy: `AI Usage & Synthetic Content Policy for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Responsible AI Generation\nVirJoy AI employs automated content safety classifiers and neural synthesis tools to ensure safe commercial generation.\n\n2. Deepfake & Misinformation Prohibition\nUsers are strictly prohibited from creating non-consensual deepfakes, impersonating public figures, or generating deceptive political media.\n\n3. Copyright & Media Rights\nUsers retain rights to their original uploaded assets and commercial outputs created under active paid plans, subject to third-party AI licensing laws.\n\n4. Disclosure of Synthetic Media\nAll generated outputs may contain subtle digital watermarks or synthetic metadata tags in accordance with Google Play AI Content Standards.`,
    lastUpdated: '2026-08-02'
  };

  const currentContent =
    activeTab === 'privacy'
      ? legalConfig.privacyPolicy
      : activeTab === 'terms'
      ? legalConfig.termsAndConditions
      : legalConfig.aiUsagePolicy;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close Legal Policies"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Legal & Google Play Compliance Center</h3>
            <p className="text-xs text-slate-400">Official terms, privacy framework & AI policy guidelines</p>
          </div>
        </div>

        {/* Policy Tab Selector */}
        <div className="flex border-b border-slate-800 mb-5 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Privacy Policy
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms & Conditions
          </button>

          <button
            onClick={() => setActiveTab('ai_policy')}
            className={`pb-3 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai_policy'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Usage Policy
          </button>
        </div>

        {/* Document Viewer Box */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
          {currentContent}
        </div>

        {/* Footer info */}
        <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500">
          <span>Last Updated: {legalConfig.lastUpdated} • Google Play Verified</span>
          <a
            href="mailto:support@virjoy.ai"
            className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
          >
            Contact Legal Desk <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="mt-5 flex justify-end">
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
