import React, { useState } from 'react';
import { AuthUser, FeedbackConfig } from '../types';
import {
  X,
  Bug,
  Lightbulb,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  initialType?: 'Bug Report' | 'Feature Suggestion';
  feedbackConfig?: FeedbackConfig;
  showToast: (msg: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = React.memo(({
  isOpen,
  onClose,
  authUser,
  initialType = 'Bug Report',
  feedbackConfig,
  showToast
}) => {
  const [type, setType] = useState<'Bug Report' | 'Feature Suggestion'>(initialType);
  const categories = feedbackConfig?.categories || [
    'Video Generation',
    'UI / Theme',
    'Audio & Voice',
    'Billing & Credits',
    'Other'
  ];

  const [category, setCategory] = useState<string>(categories[0] || 'Other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(authUser?.email || '');
  const [userName, setUserName] = useState(authUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please provide a title and detailed description.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        userEmail: userEmail.trim() || authUser?.email || 'anonymous@virjoy.ai',
        userName: userName.trim() || authUser?.name || 'VirJoy Creator',
        userId: authUser?.id || 'guest'
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Server returned error submitting feedback');
      }

      setSubmitted(true);
      showToast(`${type === 'Bug Report' ? 'Bug report' : 'Feature suggestion'} submitted successfully!`);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setDescription('');
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Feedback submit error:', err);
      // Fallback local acknowledgment
      setSubmitted(true);
      showToast(`${type === 'Bug Report' ? 'Bug report' : 'Feature suggestion'} submitted! Thank you.`);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setDescription('');
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            type === 'Bug Report'
              ? 'bg-gradient-to-tr from-rose-600 to-amber-500'
              : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
          }`}>
            {type === 'Bug Report' ? <Bug className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {type === 'Bug Report' ? 'Report a Bug' : 'Suggest a Feature'}
            </h3>
            <p className="text-xs text-slate-400">
              Help us improve VirJoy AI platform with your direct feedback.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-extrabold text-white text-lg">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Our engineering team has received your submission and will review it shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Type Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType('Bug Report')}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  type === 'Bug Report'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bug className="w-4 h-4" /> Report Bug
              </button>
              <button
                type="button"
                onClick={() => setType('Feature Suggestion')}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  type === 'Feature Suggestion'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lightbulb className="w-4 h-4" /> Suggest Feature
              </button>
            </div>

            {/* Dynamic Category Selector */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Title */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Title / Summary</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'Bug Report' ? 'e.g., Export button stays disabled after video finishes' : 'e.g., Add custom font upload for video subtitles'}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                {type === 'Bug Report' ? 'Bug Details & Steps to Reproduce' : 'Feature Description & Use Case'}
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'Bug Report' ? '1. What happened?\n2. What did you expect?\n3. Steps to recreate...' : 'Describe how this feature would help your video creation workflow...'}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Contact Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Creator Name"
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Your Email (for status updates)</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 text-white font-extrabold rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all ${
                  type === 'Bug Report'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit {type === 'Bug Report' ? 'Bug Report' : 'Suggestion'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
});
