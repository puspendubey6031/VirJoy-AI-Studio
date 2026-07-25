import React, { useState } from 'react';
import { AuthUser } from '../types';
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Github,
  Globe
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  initialMode = 'signin'
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg(`Password reset email sent to ${email}. Please check your inbox.`);
      }, 800);
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('You must agree to the Terms of Service');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const newUser: AuthUser = {
          id: `usr_${Date.now()}`,
          email: email.trim(),
          name: name.trim(),
          provider: 'email',
          createdAt: new Date().toISOString()
        };
        onSignIn(newUser);
        onClose();
      }, 600);
      return;
    }

    // Sign In mode
    if (!email.trim()) {
      setErrorMsg('Please enter your email');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: AuthUser = {
        id: `usr_${Date.now()}`,
        email: email.trim(),
        name: email.split('@')[0] || 'VirJoy Creator',
        provider: 'email',
        createdAt: new Date().toISOString()
      };
      onSignIn(user);
      onClose();
    }, 600);
  };

  const handleDemoSignIn = (role: 'Creator' | 'Pro' | 'Enterprise') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user: AuthUser = {
        id: `usr_demo_${role.toLowerCase()}`,
        email: `${role.toLowerCase()}.creator@virjoy.ai`,
        name: `${role} VirJoy Creator`,
        provider: 'email',
        createdAt: new Date().toISOString()
      };
      onSignIn(user);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative my-8 overflow-hidden transition-colors">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 dark:text-white light:text-slate-900">
                {mode === 'signin' ? 'Sign In to VirJoy' : mode === 'signup' ? 'Create VirJoy Account' : 'Reset Password'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Access your AI videos, credits & saved projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 bg-slate-950 dark:bg-slate-950 light:bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-800 dark:border-slate-800 light:border-slate-300">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200'
              }`}
            >
              Sign Up / Register
            </button>
          </div>
        )}

        {/* Error / Success Feedback Alerts */}
        {errorMsg && (
          <div className="bg-rose-950/80 dark:bg-rose-950/80 light:bg-rose-100 border border-rose-500/40 text-rose-300 dark:text-rose-300 light:text-rose-900 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/80 dark:bg-emerald-950/80 light:bg-emerald-100 border border-emerald-500/40 text-emerald-300 dark:text-emerald-300 light:text-emerald-900 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-white light:text-slate-900 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                placeholder="creator@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-white light:text-slate-900 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-white light:text-slate-900 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-white light:text-slate-900 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="accent-indigo-500 rounded"
              />
              <label htmlFor="terms">I agree to VirJoy Terms & Privacy Policy</label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer mt-2"
          >
            {isLoading ? (
              <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>
              {mode === 'signin'
                ? 'Sign In to Dashboard'
                : mode === 'signup'
                ? 'Create Free Account'
                : 'Send Reset Link'}
            </span>
          </button>
        </form>

        {/* Back to Sign In button for Forgot Mode */}
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="w-full mt-3 text-center text-xs text-slate-400 hover:text-white font-semibold underline"
          >
            Back to Sign In
          </button>
        )}

        {/* Quick Demo Login Shortcuts */}
        <div className="mt-6 pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
          <p className="text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-600 text-center mb-2 font-medium">
            Quick One-Click Demo Login
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDemoSignIn('Creator')}
              className="flex-1 bg-slate-950 dark:bg-slate-950 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-800 text-[11px] font-bold py-2 rounded-xl transition-all"
            >
              Demo Creator
            </button>
            <button
              onClick={() => handleDemoSignIn('Pro')}
              className="flex-1 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold py-2 rounded-xl transition-all"
            >
              Pro Creator
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Session & Token Persistence Enabled</span>
        </div>
      </div>
    </div>
  );
};
