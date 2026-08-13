import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-supabase-anon-key';

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  supabaseKey && 
  supabaseKey !== 'your-supabase-anon-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'placeholder-key'
);
