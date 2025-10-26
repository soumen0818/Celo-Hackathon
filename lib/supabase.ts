import { createClient } from '@supabase/supabase-js';

// Use actual values if available, otherwise use dummy values that won't cause validation errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Project {
  id: number;
  project_address: string;
  name: string;
  description: string;
  github_url: string;
  impact_score: number;
  total_grants_received: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImpactScore {
  id: number;
  project_id: number;
  score: number;
  github_activity: number;
  community_engagement: number;
  milestones_completed: number;
  ai_analysis: any;
  calculated_at: string;
}

export interface GrantDistribution {
  id: number;
  project_id: number;
  amount: string;
  token_address: string;
  transaction_hash: string;
  reason: string;
  distributed_at: string;
}
