import React, { useState } from 'react';
import { LegalPoliciesConfig } from '../../types';
import { ShieldCheck, Save, FileText, Lock, Sparkles } from 'lucide-react';

interface LegalPoliciesManagerTabProps {
  legalPoliciesConfig?: LegalPoliciesConfig;
  onChange: (updatedConfig: LegalPoliciesConfig) => void;
  showToast: (msg: string) => void;
}

export const LegalPoliciesManagerTab: React.FC<LegalPoliciesManagerTabProps> = ({
  legalPoliciesConfig,
  onChange,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'privacy' | 'terms' | 'ai_policy'>('privacy');

  const [privacyPolicy, setPrivacyPolicy] = useState(
    legalPoliciesConfig?.privacyPolicy ||
      `Privacy Policy for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Information Collection\nVirJoy AI ("we", "our", or "us") respects your privacy. We collect account details (email, display name), user-submitted prompts, media uploads, and generated video metadata to provide our AI video commercial creation service.\n\n2. Data Usage & AI Model Processing\nPrompts and user uploads are processed securely via encrypted AI API gateways solely to synthesize video commercials, voiceovers, and graphics. We do not sell your personal information or use your content for public model training without explicit consent.\n\n3. Data Retention & Auto-Cleanup\nTo protect user data and optimize storage, generated media outputs are automatically deleted after a default duration of 24 hours (or as configured by system policy). Users are advised to download generated assets promptly.\n\n4. Account Deletion Rights\nIn compliance with Google Play Store Developer Policies, users can permanently delete their account and all associated personal data directly within the app under User Settings -> Delete Account or by contacting support@virjoy.ai.\n\n5. Contact Information\nIf you have questions regarding this Privacy Policy, please email support@virjoy.ai.`
  );

  const [termsAndConditions, setTermsAndConditions] = useState(
    legalPoliciesConfig?.termsAndConditions ||
      `Terms & Conditions for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Acceptance of Terms\nBy accessing or using VirJoy AI, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the application.\n\n2. AI Credit System & Usage Limits\nVirJoy AI operates on an AI Credit allocation system. Credits are consumed according to video duration (1 second = 1 credit). Unused monthly credits roll over or expire according to your subscription tier.\n\n3. Subscription & Billing\nUpgrades and recurring plans are processed securely via verified payment partners. Plan benefits, credit allocations, and refund terms are detailed during purchase.\n\n4. User Responsibilities\nYou agree not to generate illegal, abusive, sexually explicit, defamatory, or fraudulent content. VirJoy AI reserves the right to terminate accounts violating these guidelines.`
  );

  const [aiUsagePolicy, setAiUsagePolicy] = useState(
    legalPoliciesConfig?.aiUsagePolicy ||
      `AI Usage & Synthetic Content Policy for VirJoy AI\n\nEffective Date: August 2, 2026\n\n1. Responsible AI Generation\nVirJoy AI employs automated content safety classifiers and neural synthesis tools to ensure safe commercial generation.\n\n2. Deepfake & Misinformation Prohibition\nUsers are strictly prohibited from creating non-consensual deepfakes, impersonating public figures, or generating deceptive political media.\n\n3. Copyright & Media Rights\nUsers retain rights to their original uploaded assets and commercial outputs created under active paid plans, subject to third-party AI licensing laws.\n\n4. Disclosure of Synthetic Media\nAll generated outputs may contain subtle digital watermarks or synthetic metadata tags in accordance with Google Play AI Content Standards.`
  );

  const handleSave = () => {
    const updated: LegalPoliciesConfig = {
      privacyPolicy,
      termsAndConditions,
      aiUsagePolicy,
      lastUpdated: new Date().toISOString().substring(0, 10)
    };
    onChange(updated);
    showToast('Legal policy documents saved and published successfully!');
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Legal Documents & Google Play Compliance Editor</h3>
            <p className="text-xs text-slate-400">Dynamically update Privacy Policy, Terms & Conditions, and AI Usage Policy</p>
          </div>
        </div>

        {/* SubTab navigation */}
        <div className="flex border-b border-slate-800 mb-5 gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'privacy'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Privacy Policy
          </button>

          <button
            onClick={() => setActiveSubTab('terms')}
            className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'terms'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms & Conditions
          </button>

          <button
            onClick={() => setActiveSubTab('ai_policy')}
            className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'ai_policy'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Usage Policy
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {activeSubTab === 'privacy' && (
            <div>
              <label className="text-slate-300 font-bold block mb-1 text-xs">Privacy Policy Content</label>
              <textarea
                rows={12}
                value={privacyPolicy}
                onChange={e => setPrivacyPolicy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          )}

          {activeSubTab === 'terms' && (
            <div>
              <label className="text-slate-300 font-bold block mb-1 text-xs">Terms & Conditions Content</label>
              <textarea
                rows={12}
                value={termsAndConditions}
                onChange={e => setTermsAndConditions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          )}

          {activeSubTab === 'ai_policy' && (
            <div>
              <label className="text-slate-300 font-bold block mb-1 text-xs">AI Usage Policy Content</label>
              <textarea
                rows={12}
                value={aiUsagePolicy}
                onChange={e => setAiUsagePolicy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Legal Policies
          </button>
        </div>
      </div>
    </div>
  );
};
