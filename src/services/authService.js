import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const authService = {
  async signIn(email, password) {
    if (!isSupabaseConfigured) {
      // Demo authentication fallback when Supabase is not configured yet
      if (email === 'admin@sumberagung.com' && password === 'admin123') {
        const demoUser = {
          id: 'demo-owner-id',
          email: 'admin@sumberagung.com',
          role: 'OWNER',
          user_metadata: {
            full_name: 'Pemilik Toko (Sumber Agung)',
            role: 'OWNER'
          }
        };
        localStorage.setItem('tb_sa_demo_user', JSON.stringify(demoUser));
        return { data: { user: demoUser, session: { user: demoUser } }, error: null };
      } else if (email === 'kasir@sumberagung.com' && password === 'kasir123') {
        const demoUser = {
          id: 'demo-cashier-id',
          email: 'kasir@sumberagung.com',
          role: 'CASHIER',
          user_metadata: {
            full_name: 'Kasir Utama',
            role: 'CASHIER'
          }
        };
        localStorage.setItem('tb_sa_demo_user', JSON.stringify(demoUser));
        return { data: { user: demoUser, session: { user: demoUser } }, error: null };
      } else {
        return { data: null, error: new Error('Email atau password salah! (Demo default: admin@sumberagung.com / admin123)') };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('tb_sa_demo_user');
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('tb_sa_demo_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId) {
    if (!isSupabaseConfigured) {
      const user = await this.getCurrentUser();
      if (user) {
        return {
          data: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User TB. Sumber Agung',
            role: user.role || 'CASHIER'
          },
          error: null
        };
      }
      return { data: null, error: new Error('User not logged in') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  }
};
