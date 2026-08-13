import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toSearchString } from '../utils/searchUtils';

const DEMO_SUPPLIERS_KEY = 'tb_sa_demo_suppliers';

const INITIAL_SUPPLIERS = [
  { id: 's1111111-1111-1111-1111-111111111111', name: 'PT. Semen Gresik Distributor', contact_person: 'Bpk. Hendra Sales', phone: '081234567890', email: 'sales@semengresik.co.id', address: 'Kawasan Industri Cilacap', created_at: new Date().toISOString() },
  { id: 's2222222-2222-2222-2222-222222222222', name: 'CV. Baja Utama Steel', contact_person: 'Ibu Linda', phone: '085698765432', email: 'bajautama@gmail.com', address: 'Jl. Raya Magelang KM 10', created_at: new Date().toISOString() },
  { id: 's3333333-3333-3333-3333-333333333333', name: 'UD. Cat & Kuas Jaya', contact_person: 'Pak Slamet', phone: '082311223344', email: 'catjaya@yahoo.com', address: 'Jl. Ahmad Yani No. 88, Purwokerto', created_at: new Date().toISOString() },
];

function getLocalSuppliers() {
  const stored = localStorage.getItem(DEMO_SUPPLIERS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  localStorage.setItem(DEMO_SUPPLIERS_KEY, JSON.stringify(INITIAL_SUPPLIERS));
  return INITIAL_SUPPLIERS;
}

function saveLocalSuppliers(sups) {
  localStorage.setItem(DEMO_SUPPLIERS_KEY, JSON.stringify(sups));
}

export const supplierService = {
  async getSuppliers(search = '') {
    if (!isSupabaseConfigured) {
      let sups = getLocalSuppliers();
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        sups = sups.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.contact_person || '').toLowerCase().includes(q) ||
            (s.phone || '').toLowerCase().includes(q)
        );
      }
      return { data: sups, error: null };
    }

    try {
      let query = supabase.from('suppliers').select('*').order('name', { ascending: true });
      if (search.trim()) {
        const q = search.trim();
        query = query.or(`name.ilike.%${q}%,contact_person.ilike.%${q}%,phone.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) return { data: [], error };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  async createSupplier(payload) {
    if (!isSupabaseConfigured) {
      const sups = getLocalSuppliers();
      const newSup = {
        id: `sup-${Date.now()}`,
        name: payload.name,
        contact_person: payload.contact_person || '',
        phone: payload.phone || '',
        email: payload.email || '',
        address: payload.address || '',
        created_at: new Date().toISOString(),
      };
      sups.unshift(newSup);
      saveLocalSuppliers(sups);
      return { data: newSup, error: null };
    }

    try {
      const { data, error } = await supabase.from('suppliers').insert([payload]).select().single();
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async updateSupplier(id, payload) {
    if (!isSupabaseConfigured) {
      const sups = getLocalSuppliers();
      const idx = sups.findIndex((s) => s.id === id);
      if (idx !== -1) {
        sups[idx] = { ...sups[idx], ...payload, updated_at: new Date().toISOString() };
        saveLocalSuppliers(sups);
        return { data: sups[idx], error: null };
      }
      return { error: { message: 'Supplier tidak ditemukan.' } };
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
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

  async deleteSupplier(id) {
    if (!isSupabaseConfigured) {
      const sups = getLocalSuppliers().filter((s) => s.id !== id);
      saveLocalSuppliers(sups);
      return { error: null };
    }

    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      return { error };
    } catch (err) {
      return { error: err };
    }
  },
};
