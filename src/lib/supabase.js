import { createClient } from '@supabase/supabase-js';

// Default Toko Sumber Agung Supabase Project credentials
export const DEFAULT_SUPABASE_URL = 'https://agohzjfnjdsieyopyext.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_MMCZDcY3HwD9QYhyXmWKXQ_9Crhr_CD';

// Get custom override from localStorage if set by user in Settings
const getStoredCustomConfig = () => {
  if (typeof window === 'undefined') return { url: '', key: '' };
  try {
    const url = localStorage.getItem('tb_sa_custom_supabase_url') || '';
    const key = localStorage.getItem('tb_sa_custom_supabase_key') || '';
    return { url, key };
  } catch {
    return { url: '', key: '' };
  }
};

const customConfig = getStoredCustomConfig();

const rawUrl =
  customConfig.url ||
  import.meta.env.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const rawKey =
  customConfig.key ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY;

export const supabaseUrl = (rawUrl || '').trim();
export const supabaseKey = (rawKey || '').trim();

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  supabaseUrl.startsWith('http') &&
  Boolean(supabaseKey) &&
  supabaseKey !== 'your-supabase-anon-key' &&
  supabaseKey.length > 10;

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Diagnostic helper to test the active Supabase connection
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      isConfigured: false,
      message: 'Supabase URL atau Anon Key belum dikonfigurasi.',
      latencyMs: null,
    };
  }

  const startTime = Date.now();
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        success: false,
        isConfigured: true,
        message: `Gagal query ke database: ${error.message}`,
        latencyMs,
        error,
      };
    }

    return {
      success: true,
      isConfigured: true,
      message: 'Koneksi ke database Cloud Supabase aktif dan normal.',
      latencyMs,
      productsCount: count ?? 0,
      url: supabaseUrl,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      isConfigured: true,
      message: `Koneksi gagal: ${err.message || 'Tidak dapat menghubungi server database.'}`,
      latencyMs,
      error: err,
    };
  }
}
