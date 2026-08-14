import { supabase, isSupabaseConfigured } from '../lib/supabase';

const USERS_KEY = 'tb_sa_registered_users';

const INITIAL_USERS = [
  {
    id: 'user-owner-1',
    email: 'admin@sumberagung.com',
    password: 'admin123',
    full_name: 'Pemilik Toko (Sumber Agung)',
    role: 'OWNER',
    phone: '08123456789',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-cashier-1',
    email: 'kasir@sumberagung.com',
    password: 'kasir123',
    full_name: 'Kasir Utama Toko',
    role: 'CASHIER',
    phone: '085711223344',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

function getLocalUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn(e);
    }
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}

function saveLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const userService = {
  async getUsers() {
    if (!isSupabaseConfigured) {
      return { data: getLocalUsers(), error: null };
    }

    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) return { data: [], error };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  async createUser(userData) {
    if (!isSupabaseConfigured) {
      const users = getLocalUsers();
      const newUser = {
        id: `u-${Date.now()}`,
        email: userData.email,
        password: userData.password || '123456',
        full_name: userData.full_name,
        role: userData.role || 'CASHIER',
        phone: userData.phone || '',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      users.unshift(newUser);
      saveLocalUsers(users);
      return { data: newUser, error: null };
    }

    try {
      // In Supabase, creating an auth user requires admin auth or trigger
      const { data, error } = await supabase.from('profiles').insert([
        {
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role || 'CASHIER',
          phone: userData.phone || '',
          is_active: true,
        },
      ]).select().single();

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async updateUserRole(id, role, isActive) {
    if (!isSupabaseConfigured) {
      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        users[idx].role = role;
        if (typeof isActive === 'boolean') users[idx].is_active = isActive;
        saveLocalUsers(users);
      }
      return { error: null };
    }

    try {
      const updates = { role, updated_at: new Date().toISOString() };
      if (typeof isActive === 'boolean') updates.is_active = isActive;

      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      return { error };
    } catch (err) {
      return { error: err };
    }
  },
};

