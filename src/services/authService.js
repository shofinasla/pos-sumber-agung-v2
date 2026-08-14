import { supabase, isSupabaseConfigured } from '../lib/supabase';

const USERS_STORAGE_KEY = 'tb_sa_registered_users';
const CURRENT_USER_KEY = 'tb_sa_current_user';

const DEFAULT_ACCOUNTS = [
  {
    id: 'user-owner-1',
    email: 'admin@sumberagung.com',
    password: 'admin123',
    role: 'OWNER',
    full_name: 'Pemilik Toko (Sumber Agung)',
    phone: '08123456789',
    created_at: new Date().toISOString(),
    user_metadata: {
      full_name: 'Pemilik Toko (Sumber Agung)',
      role: 'OWNER',
      phone: '08123456789'
    }
  },
  {
    id: 'user-cashier-1',
    email: 'kasir@sumberagung.com',
    password: 'kasir123',
    role: 'CASHIER',
    full_name: 'Kasir Utama',
    phone: '085711223344',
    created_at: new Date().toISOString(),
    user_metadata: {
      full_name: 'Kasir Utama',
      role: 'CASHIER',
      phone: '085711223344'
    }
  }
];

function getStoredUsers() {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback to defaults
    }
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  return DEFAULT_ACCOUNTS;
}

function saveStoredUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const authService = {
  async signUp(email, password, metadata = {}) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const fullName = (metadata.full_name || '').trim() || 'Pengguna Baru';
    const role = metadata.role || 'CASHIER';
    const phone = (metadata.phone || '').trim();

    if (!cleanEmail || !password) {
      return { data: null, error: new Error('Email dan kata sandi wajib diisi.') };
    }

    if (password.length < 6) {
      return { data: null, error: new Error('Kata sandi minimal 6 karakter.') };
    }

    if (!isSupabaseConfigured) {
      const users = getStoredUsers();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return { data: null, error: new Error('Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.') };
      }

      const newUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: cleanEmail,
        password,
        role,
        full_name: fullName,
        phone,
        created_at: new Date().toISOString(),
        user_metadata: {
          full_name: fullName,
          role,
          phone
        }
      };

      users.push(newUser);
      saveStoredUsers(users);

      // Save user session
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

      return {
        data: {
          user: newUser,
          session: { user: newUser }
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone
          }
        }
      });

      if (error) return { data: null, error };

      if (data?.user) {
        // Try inserting or upserting into profiles table
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName,
          role,
          phone,
          is_active: true,
          updated_at: new Date().toISOString()
        });
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async signIn(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!isSupabaseConfigured) {
      const users = getStoredUsers();
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === password
      );

      if (foundUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
        return { data: { user: foundUser, session: { user: foundUser } }, error: null };
      } else {
        return {
          data: null,
          error: new Error('Email atau kata sandi salah. Silakan periksa kembali atau daftar jika belum punya akun.')
        };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    return { data, error };
  },

  async resendVerification(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { data: null, error: new Error('Email wajib diisi.') };
    }

    if (!isSupabaseConfigured) {
      return {
        data: { message: 'Tautan verifikasi telah dikirim ulang ke email Anda (Mode Demo).' },
        error: null,
      };
    }

    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async signOut() {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
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
            full_name: user.full_name || user.user_metadata?.full_name || 'User TB. Sumber Agung',
            role: user.role || user.user_metadata?.role || 'CASHIER',
            phone: user.phone || user.user_metadata?.phone || ''
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

