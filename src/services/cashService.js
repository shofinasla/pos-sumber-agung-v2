import { supabase, isSupabaseConfigured } from '../lib/supabase';

const CASH_STORAGE_KEY = 'tb_sa_cash_transactions';

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function getLocalCashTransactions() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CASH_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalCashTransactions(list) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CASH_STORAGE_KEY, JSON.stringify(list));
}

export const cashService = {
  /**
   * Mengambil daftar transaksi arus kas (IN / OUT)
   */
  async getCashTransactions(filters = {}) {
    const localList = getLocalCashTransactions();

    if (!isSupabaseConfigured || !supabase) {
      let filtered = localList;
      if (filters.type && filters.type !== 'ALL') {
        filtered = filtered.filter((t) => t.type === filters.type);
      }
      if (filters.category && filters.category !== 'ALL') {
        filtered = filtered.filter((t) => t.category === filters.category);
      }
      return { data: filtered, error: null };
    }

    try {
      let query = supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.type && filters.type !== 'ALL') {
        query = query.eq('type', filters.type);
      }
      if (filters.category && filters.category !== 'ALL') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase cash_transactions query error, using local fallback:', error);
        return { data: localList, error: null };
      }

      // Merge local with cloud
      const cloudIds = new Set((data || []).map((t) => t.id));
      const localOnly = localList.filter((t) => !cloudIds.has(t.id));
      const combined = [...localOnly, ...(data || [])];

      return { data: combined, error: null };
    } catch (err) {
      console.warn('Exception fetching cash_transactions, using local:', err);
      return { data: localList, error: null };
    }
  },

  /**
   * Menambahkan transaksi kas masuk (IN) atau kas keluar (OUT)
   */
  async addCashTransaction(txData) {
    const type = (txData.type || 'IN').toUpperCase(); // 'IN' or 'OUT'
    const amount = Math.abs(Number(txData.amount || 0));
    const category = txData.category || (type === 'IN' ? 'PENJUALAN' : 'OPERASIONAL');
    const notes = txData.notes || (type === 'IN' ? 'Pemasukan Kas' : 'Pengeluaran Kas');
    const cashierId = isValidUUID(txData.cashierId) ? txData.cashierId : null;

    const newLocalTx = {
      id: `cash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      amount,
      category,
      notes,
      cashier_id: cashierId,
      created_at: new Date().toISOString(),
    };

    // Save locally first
    const localList = getLocalCashTransactions();
    localList.unshift(newLocalTx);
    saveLocalCashTransactions(localList);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_cash_updated', { detail: newLocalTx }));
      window.dispatchEvent(new CustomEvent('pos_data_updated', { detail: { type: 'cash', data: newLocalTx } }));
    }

    if (!isSupabaseConfigured || !supabase) {
      return { data: newLocalTx, error: null };
    }

    try {
      const payload = {
        type,
        amount,
        category,
        notes,
        cashier_id: cashierId,
      };

      const { data, error } = await supabase
        .from('cash_transactions')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase cash_transactions insert notice (will keep in local sync):', error.message);
        return { data: newLocalTx, error: null };
      }

      return { data: data || newLocalTx, error: null };
    } catch (err) {
      console.warn('Exception recording cash_transaction to Supabase:', err);
      return { data: newLocalTx, error: null };
    }
  },

  /**
   * Menghitung ringkasan kas (Saldo, Total Masuk, Total Keluar)
   */
  async getCashSummary() {
    const { data: list } = await this.getCashTransactions();
    let totalIn = 0;
    let totalOut = 0;

    (list || []).forEach((t) => {
      const amt = Number(t.amount || 0);
      if (t.type === 'IN') {
        totalIn += amt;
      } else if (t.type === 'OUT') {
        totalOut += amt;
      }
    });

    return {
      totalIn,
      totalOut,
      currentBalance: totalIn - totalOut,
      totalTransactions: (list || []).length,
    };
  },

  /**
   * Realtime subscription channel untuk kas
   */
  subscribeCashTransactions(callback) {
    if (!isSupabaseConfigured || !supabase) {
      const handler = (e) => {
        if (callback && e.detail) callback({ eventType: 'INSERT', new: e.detail });
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('pos_cash_updated', handler);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('pos_cash_updated', handler);
        }
      };
    }

    try {
      const channel = supabase
        .channel('cash-transactions-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cash_transactions' },
          (payload) => {
            if (callback) callback(payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  },
};
