import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toSearchString } from '../utils/searchUtils';

const DEMO_CUSTOMERS_KEY = 'tb_sa_demo_customers';

const INITIAL_CUSTOMERS = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Bpk. Ahmad Subagyo', phone: '081298765432', email: 'ahmad@gmail.com', address: 'Jl. Pemuda No. 45, Kebumen', member_tier: 'Gold', points: 125, created_at: new Date().toISOString() },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'Ibu Siti Rahmawati', phone: '085712345678', email: 'siti.rahma@yahoo.com', address: 'Jl. Merdeka No. 12', member_tier: 'Silver', points: 68, created_at: new Date().toISOString() },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Mas Budi Prasetyo (Kontraktor)', phone: '082133445566', email: 'budi@gmail.com', address: 'Proyek Perum Graha Indah', member_tier: 'Regular', points: 24, created_at: new Date().toISOString() },
];

function getLocalCustomers() {
  const stored = localStorage.getItem(DEMO_CUSTOMERS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  localStorage.setItem(DEMO_CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
  return INITIAL_CUSTOMERS;
}

function saveLocalCustomers(custs) {
  localStorage.setItem(DEMO_CUSTOMERS_KEY, JSON.stringify(custs));
}

export const customerService = {
  async getCustomers(search = '') {
    const searchStr = toSearchString(search);
    const q = searchStr.toLowerCase();
    if (!isSupabaseConfigured) {
      let custs = getLocalCustomers();
      if (q) {
        custs = custs.filter(
          (c) =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.phone || '').toLowerCase().includes(q) ||
            (c.address || '').toLowerCase().includes(q)
        );
      }
      return { data: custs, error: null };
    }

    try {
      let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (searchStr) {
        query = query.or(`name.ilike.%${searchStr}%,phone.ilike.%${searchStr}%,email.ilike.%${searchStr}%`);
      }
      const { data, error } = await query;
      if (error) return { data: [], error };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  async createCustomer(payload) {
    if (!isSupabaseConfigured) {
      const custs = getLocalCustomers();
      const newCust = {
        id: `cust-${Date.now()}`,
        name: payload.name,
        phone: payload.phone || '',
        email: payload.email || '',
        address: payload.address || '',
        points: Number(payload.points || 0),
        member_tier: payload.member_tier || 'Regular',
        created_at: new Date().toISOString(),
      };
      custs.unshift(newCust);
      saveLocalCustomers(custs);
      return { data: newCust, error: null };
    }

    try {
      const { data, error } = await supabase.from('customers').insert([payload]).select().single();
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async updateCustomer(id, payload) {
    if (!isSupabaseConfigured) {
      const custs = getLocalCustomers();
      const idx = custs.findIndex((c) => c.id === id);
      if (idx !== -1) {
        custs[idx] = { ...custs[idx], ...payload, updated_at: new Date().toISOString() };
        saveLocalCustomers(custs);
        return { data: custs[idx], error: null };
      }
      return { error: { message: 'Pelanggan tidak ditemukan.' } };
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async deleteCustomer(id) {
    if (!isSupabaseConfigured) {
      const custs = getLocalCustomers().filter((c) => c.id !== id);
      saveLocalCustomers(custs);
      return { error: null };
    }

    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      return { error };
    } catch (err) {
      return { error: err };
    }
  },
};
