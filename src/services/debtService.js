import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEMO_PIUTANG_KEY = 'tb_sa_demo_piutang';
const DEMO_HUTANG_KEY = 'tb_sa_demo_hutang';

const INITIAL_PIUTANG = [
  {
    id: 'piu-1',
    customer_id: 'c3333333-3333-3333-3333-333333333333',
    customer_name: 'Mas Budi Prasetyo (Kontraktor)',
    phone: '082133445566',
    notes: 'Bon Material Proyek Perum Graha (Semen, Besi 10mm)',
    total_amount: 3250000,
    paid_amount: 1000000,
    remaining_amount: 2250000,
    due_date: '2026-08-30',
    status: 'PARTIAL',
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'piu-2',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    customer_name: 'Bpk. Ahmad Subagyo',
    phone: '081298765432',
    notes: 'Pembelian Cat Tembok & Thinner',
    total_amount: 750000,
    paid_amount: 0,
    remaining_amount: 750000,
    due_date: '2026-08-20',
    status: 'UNPAID',
    created_at: '2026-08-05T14:30:00Z',
  },
];

const INITIAL_HUTANG = [
  {
    id: 'hut-1',
    supplier_id: 's2222222-2222-2222-2222-222222222222',
    supplier_name: 'CV. Baja Utama Steel',
    invoice_number: 'INV-STEEL-9901',
    notes: 'Faktur Kulakan Besi Beton SNI 100 Batang',
    total_amount: 6500000,
    paid_amount: 3000000,
    remaining_amount: 3500000,
    due_date: '2026-08-25',
    status: 'PARTIAL',
    created_at: '2026-07-28T09:00:00Z',
  },
];

function getLocalPiutang() {
  const stored = localStorage.getItem(DEMO_PIUTANG_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  localStorage.setItem(DEMO_PIUTANG_KEY, JSON.stringify(INITIAL_PIUTANG));
  return INITIAL_PIUTANG;
}

function saveLocalPiutang(data) {
  localStorage.setItem(DEMO_PIUTANG_KEY, JSON.stringify(data));
}

function getLocalHutang() {
  const stored = localStorage.getItem(DEMO_HUTANG_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  localStorage.setItem(DEMO_HUTANG_KEY, JSON.stringify(INITIAL_HUTANG));
  return INITIAL_HUTANG;
}

function saveLocalHutang(data) {
  localStorage.setItem(DEMO_HUTANG_KEY, JSON.stringify(data));
}

export const debtService = {
  /**
   * Mengambil Piutang Pelanggan (Bon Proyek/Tukang)
   */
  async getPiutangList(search = '') {
    if (!isSupabaseConfigured) {
      let list = getLocalPiutang();
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (item) =>
            item.customer_name.toLowerCase().includes(q) ||
            (item.notes || '').toLowerCase().includes(q)
        );
      }
      return { data: list, error: null };
    }

    try {
      // In Supabase, we can select from sales with notes or payment status OR custom debt records
      let query = supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          total,
          paid_amount,
          notes,
          created_at,
          customer:customers(name, phone)
        `)
        .gt('total', 0)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) return { data: [], error };

      const formatted = (data || []).map((s) => {
        const total = Number(s.total || 0);
        const paid = Number(s.paid_amount || 0);
        const remaining = Math.max(0, total - paid);
        return {
          id: s.id,
          customer_name: s.customer?.name || 'Pelanggan Umum',
          phone: s.customer?.phone || '-',
          notes: s.notes || `Invoice ${s.invoice_number}`,
          total_amount: total,
          paid_amount: paid,
          remaining_amount: remaining,
          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
          created_at: s.created_at,
        };
      });

      return { data: formatted, error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  /**
   * Mengambil Hutang Supplier (Tagihan Pembelian Material)
   */
  async getHutangList(search = '') {
    if (!isSupabaseConfigured) {
      let list = getLocalHutang();
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (item) =>
            item.supplier_name.toLowerCase().includes(q) ||
            (item.invoice_number || '').toLowerCase().includes(q)
        );
      }
      return { data: list, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          purchase_number,
          total_amount,
          payment_status,
          due_date,
          created_at,
          supplier:suppliers(name, contact_person, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) return { data: [], error };

      const formatted = (data || []).map((p) => {
        const total = Number(p.total_amount || 0);
        const isPaid = p.payment_status === 'PAID';
        const remaining = isPaid ? 0 : total;
        return {
          id: p.id,
          supplier_name: p.supplier?.name || 'Supplier Material',
          invoice_number: p.purchase_number,
          notes: `Pembelian Faktur ${p.purchase_number}`,
          total_amount: total,
          paid_amount: isPaid ? total : 0,
          remaining_amount: remaining,
          due_date: p.due_date ? p.due_date.split('T')[0] : '-',
          status: p.payment_status || 'UNPAID',
          created_at: p.created_at,
        };
      });

      return { data: formatted, error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  /**
   * Catat Pembayaran Cicilan / Pelunasan Piutang
   */
  async payPiutang(piutangId, paymentAmount) {
    if (!isSupabaseConfigured) {
      const list = getLocalPiutang();
      const idx = list.findIndex((item) => item.id === piutangId);
      if (idx !== -1) {
        const amount = Number(paymentAmount);
        list[idx].paid_amount += amount;
        list[idx].remaining_amount = Math.max(0, list[idx].total_amount - list[idx].paid_amount);
        list[idx].status = list[idx].remaining_amount === 0 ? 'PAID' : 'PARTIAL';
        saveLocalPiutang(list);
      }
      return { error: null };
    }

    try {
      // In Supabase, update sales or debt record
      const { data: sale } = await supabase
        .from('sales')
        .select('paid_amount, total')
        .eq('id', piutangId)
        .single();

      if (sale) {
        const newPaid = Number(sale.paid_amount || 0) + Number(paymentAmount);
        await supabase
          .from('sales')
          .update({ paid_amount: newPaid, updated_at: new Date().toISOString() })
          .eq('id', piutangId);
      }
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  },

  /**
   * Catat Pembayaran Hutang ke Supplier
   */
  async payHutang(hutangId, paymentAmount) {
    if (!isSupabaseConfigured) {
      const list = getLocalHutang();
      const idx = list.findIndex((item) => item.id === hutangId);
      if (idx !== -1) {
        const amount = Number(paymentAmount);
        list[idx].paid_amount += amount;
        list[idx].remaining_amount = Math.max(0, list[idx].total_amount - list[idx].paid_amount);
        list[idx].status = list[idx].remaining_amount === 0 ? 'PAID' : 'PARTIAL';
        saveLocalHutang(list);
      }
      return { error: null };
    }

    try {
      await supabase
        .from('purchases')
        .update({ payment_status: 'PAID', updated_at: new Date().toISOString() })
        .eq('id', hutangId);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  },
};
