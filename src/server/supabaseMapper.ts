import { supabaseServer } from './supabaseServer';
import { PlanKey, VideoProject } from '../types';

/**
 * Interface mappings for existing Supabase public schema tables.
 * These interfaces mirror the exact column names present in the Supabase project.
 */

export interface SupabaseUserRow {
  id: string;
  created_at: string;
  email: string | null;
  supabase_uid: string | null;
  mobile_number: string | null;
  mobile_verified: boolean | null;
  username: string | null;
  current_plan: string | null;
  credits: number | null;
  free_credits_last_claimed: string | null;
  updated_at: string | null;
}

export interface SupabasePlanRow {
  id: string;
  name: string;
  price_inr: number;
  credits_per_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseSubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  credits_per_month: number;
  starts_at: string;
  ends_at: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_subscription_id: string | null;
  created_at: string;
}

export interface SupabaseCreditLogRow {
  id: string;
  user_id: string;
  action: string;
  credits_used: number;
  credits_before: number;
  credits_after: number;
  job_id: string | null;
  description: string | null;
  created_at: string;
}

export interface SupabaseVideoJobRow {
  id: string;
  prompt: string | null;
  title: string | null;
  video_type: string | null;
  duration: number | null;
  plan: string | null;
  status: string | null;
  has_watermark: boolean | null;
  output_path: string | null;
  output_url: string | null;
  error_message: string | null;
  image_count: number | null;
  clip_count: number | null;
  created_at: string;
  updated_at: string | null;
  userId: string | null;
}

export interface SupabaseAppSettingsRow {
  id: string;
  openai_key: string | null;
  replicate_key: string | null;
  default_credits: number | null;
  per_video_cost: number | null;
  maintenance_mode: boolean | null;
  updated_at: string | null;
}

/**
 * Non-destructive mapping utilities between Supabase schema and VirJoy AI application state.
 */

export function mapSupabaseJobToVideoProject(job: SupabaseVideoJobRow): VideoProject {
  return {
    id: job.id,
    title: job.title || job.prompt || 'Untitled Video',
    prompt: job.prompt || 'Untitled Video',
    inputs: { textPrompt: job.prompt || '' },
    aspectRatio: '16:9',
    totalDurationSeconds: job.duration || 30,
    language: 'English',
    voice: 'Warm Storyteller',
    voiceTone: 'Professional',
    scenes: [],
    status: job.status === 'completed' ? 'completed' : job.status === 'failed' ? 'failed' : 'rendering',
    planUsed: (job.plan as PlanKey) || 'Free',
    watermarked: job.has_watermark ?? true,
    exportQuality: '1080p',
    shareUrl: job.output_url || '',
    createdAt: job.created_at,
    expiresAt: new Date(new Date(job.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

export async function fetchUserBySupabaseUid(supabaseUid: string): Promise<SupabaseUserRow | null> {
  if (!supabaseServer) return null;
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('supabase_uid', supabaseUid)
    .single();

  if (error || !data) return null;
  return data as SupabaseUserRow;
}

export async function fetchPlansFromSupabase(): Promise<SupabasePlanRow[]> {
  if (!supabaseServer) return [];
  const { data, error } = await supabaseServer
    .from('plans')
    .select('*')
    .eq('is_active', true);

  if (error || !data) return [];
  return data as SupabasePlanRow[];
}

export async function fetchVideoJobsForUser(userId: string): Promise<VideoProject[]> {
  if (!supabaseServer) return [];
  const { data, error } = await supabaseServer
    .from('video_jobs')
    .select('*')
    .eq('userId', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as SupabaseVideoJobRow[]).map(mapSupabaseJobToVideoProject);
}
