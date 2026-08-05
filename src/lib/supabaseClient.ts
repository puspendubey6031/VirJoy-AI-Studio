/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/(rest|auth)\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

// Read client-side environment variables
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = cleanSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project-ref.supabase.co' &&
  !supabaseUrl.includes('your-supabase')
);

// Create single client instance or null if unconfigured
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Safe helper to verify client-side Supabase connectivity
 */
export async function testSupabaseClientConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      configured: false,
      connected: false,
      message: 'Supabase client environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing or set to placeholders.'
    };
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        configured: true,
        connected: false,
        message: `Supabase auth check failed: ${error.message}`
      };
    }
    return {
      configured: true,
      connected: true,
      message: 'Successfully connected to Supabase client auth API.'
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      message: `Supabase client connection error: ${err?.message || 'Unknown error'}`
    };
  }
}
