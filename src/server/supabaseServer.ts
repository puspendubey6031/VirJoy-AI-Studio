import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/(rest|auth)\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseUrl = cleanSupabaseUrl(rawSupabaseUrl);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl && 
  (serviceRoleKey || anonKey) && 
  !supabaseUrl.includes('your-supabase')
);

// Server-side Supabase client (prefers Service Role Key for secure server execution)
export const supabaseServer: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(supabaseUrl, serviceRoleKey || anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

/**
 * Safe read-only backend health check for Supabase connection
 */
export async function checkBackendSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  hasServiceKey: boolean;
  message: string;
  details?: Record<string, any>;
}> {
  if (!isServerSupabaseConfigured || !supabaseServer) {
    return {
      configured: false,
      connected: false,
      hasServiceKey: Boolean(serviceRoleKey),
      message: 'Server Supabase credentials missing or invalid in environment.'
    };
  }

  try {
    // Perform a harmless read-only query to test connection
    const { data, error } = await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 1 }).catch(() => ({ data: null, error: { message: 'Service role admin call failed or not permitted' } as any }));

    if (!error) {
      return {
        configured: true,
        connected: true,
        hasServiceKey: Boolean(serviceRoleKey),
        message: 'Successfully established administrative server connection to Supabase.',
        details: { usersCheck: 'ok', userCountSample: data?.users?.length ?? 0 }
      };
    }

    // Fallback check if service role fails or anon key is used
    const { error: sessionError } = await supabaseServer.auth.getSession();
    if (!sessionError) {
      return {
        configured: true,
        connected: true,
        hasServiceKey: Boolean(serviceRoleKey),
        message: 'Successfully connected to Supabase using public API key.',
        details: { publicCheck: 'ok' }
      };
    }

    return {
      configured: true,
      connected: false,
      hasServiceKey: Boolean(serviceRoleKey),
      message: `Supabase server connection test failed: ${error?.message || sessionError?.message || 'Unknown error'}`
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      hasServiceKey: Boolean(serviceRoleKey),
      message: `Supabase server exception: ${err?.message || 'Connection refused'}`
    };
  }
}
