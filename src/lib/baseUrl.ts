/**
 * Centralized utility to determine the production application base URL and auth callback URL.
 * Prevents hardcoded or fallback URLs (such as replit.dev) in email verification or OAuth flows.
 */

export function getAppBaseUrl(): string {
  // Client-side execution in browser
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const envUrl = (
      import.meta.env?.VITE_APP_URL ||
      import.meta.env?.VITE_SITE_URL ||
      import.meta.env?.PUBLIC_URL ||
      ''
    ).trim();

    if (envUrl && !envUrl.includes('MY_APP_URL') && !envUrl.includes('placeholder')) {
      return envUrl.replace(/\/$/, '');
    }
    return origin.replace(/\/$/, '');
  }

  // Server-side execution
  const serverEnvUrl = (
    process.env.VITE_APP_URL ||
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    ''
  ).trim();

  if (serverEnvUrl && !serverEnvUrl.includes('MY_APP_URL') && !serverEnvUrl.includes('placeholder')) {
    return serverEnvUrl.replace(/\/$/, '');
  }

  return 'https://virjoy.ai';
}

export function getAuthCallbackUrl(): string {
  return `${getAppBaseUrl()}/auth/callback`;
}
