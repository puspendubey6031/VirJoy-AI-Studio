import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isOwnerEmail, getUserRole } from '../lib/roles';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

interface AuthCallbackProps {
  onAuthCallbackSuccess: (data: { user: any; session: any; isOwner: boolean }) => void;
  onAuthCallbackError: (errorMsg: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({
  onAuthCallbackSuccess,
  onAuthCallbackError
}) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Exchanging authentication credentials & verifying session...');

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      if (!supabase) {
        if (isMounted) {
          setStatus('error');
          setMessage('Supabase client is not configured.');
          onAuthCallbackError('Supabase client is not configured.');
        }
        return;
      }

      try {
        // Parse search & hash params
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = urlParams.get('code');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (errorDescription) {
          if (isMounted) {
            setStatus('error');
            setMessage(`Email verification error: ${errorDescription}`);
            onAuthCallbackError(errorDescription);
          }
          return;
        }

        // Handle PKCE auth code exchange if present
        if (code) {
          setMessage('Exchanging authorization code for user session...');
          const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          if (codeError) {
            console.warn('[AUTH CALLBACK] PKCE Exchange error:', codeError.message);
          } else if (codeData.session) {
            await finalizeSession(codeData.session, isMounted);
            return;
          }
        }

        // Check active session (Implicit flow or existing session after hash processing)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (isMounted) {
            setStatus('error');
            setMessage(`Session error: ${sessionError.message}`);
            onAuthCallbackError(sessionError.message);
          }
          return;
        }

        if (session) {
          await finalizeSession(session, isMounted);
          return;
        }

        // Wait brief delay for hash processing by Supabase client listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
            subscription.unsubscribe();
            await finalizeSession(currentSession, isMounted);
          }
        });

        // Timeout fallback
        setTimeout(async () => {
          const { data: { session: checkSession } } = await supabase.auth.getSession();
          if (checkSession) {
            subscription.unsubscribe();
            await finalizeSession(checkSession, isMounted);
          } else if (isMounted && status === 'processing') {
            subscription.unsubscribe();
            setStatus('error');
            setMessage('Verification token expired or invalid. Please request a new verification email.');
            onAuthCallbackError('Verification token expired or invalid.');
          }
        }, 3500);

      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setMessage(err?.message || 'An error occurred during authentication callback handling.');
          onAuthCallbackError(err?.message || 'Authentication failed.');
        }
      }
    }

    async function finalizeSession(session: any, mounted: boolean) {
      if (!mounted) return;

      const user = session.user;
      const email = user.email || '';
      const isOwner = isOwnerEmail(email) || user.user_metadata?.isOwner || user.user_metadata?.role === 'Owner';
      const role = getUserRole(email, user.user_metadata?.accountType || 'Free', user.user_metadata?.role);

      // Sync user profile to backend
      try {
        await fetch('/api/user/sync-supabase-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supabaseUid: user.id,
            email: email,
            fullName: user.user_metadata?.full_name || email.split('@')[0] || 'VirJoy Creator'
          })
        });
      } catch (syncErr) {
        console.warn('[AUTH CALLBACK] User sync note:', syncErr);
      }

      setStatus('success');
      setMessage(isOwner ? 'Owner Email Verified! Accessing Admin Console...' : 'Email Verified Successfully! Loading Dashboard...');

      setTimeout(() => {
        onAuthCallbackSuccess({
          user,
          session,
          isOwner
        });
      }, 1000);
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [onAuthCallbackSuccess, onAuthCallbackError]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {status === 'processing' && <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />}
            {status === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
            {status === 'error' && <AlertCircle className="w-8 h-8 text-rose-400" />}
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-white mb-2">
          {status === 'processing' && 'Verifying Email & Session'}
          {status === 'success' && 'Email Verification Successful'}
          {status === 'error' && 'Verification Link Issue'}
        </h2>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>

        {status === 'processing' && (
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-semibold">
            <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
            <span>Exchanging security token & setting up session...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 py-3 px-4 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>Redirecting to your dashboard...</span>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => {
              window.history.replaceState({}, document.title, '/');
              window.location.reload();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/25"
          >
            Continue to VirJoy AI Home
          </button>
        )}
      </div>
    </div>
  );
};
