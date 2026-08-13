import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEMO_SALES_KEY = 'tb_sa_demo_sales';
const DEMO_PRODUCTS_KEY = 'tb_sa_demo_products';
const DEMO_CUSTOMERS_KEY = 'tb_sa_demo_customers';

const INITIAL_DEMO_CUSTOMERS = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Bpk. Ahmad Subagyo', phone: '081298765432', email: 'ahmad@gmail.com', member_tier: 'Gold', points: 125 },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'Ibu Siti Rahmawati', phone: '085712345678', email: 'siti.rahma@yahoo.com', member_tier: 'Silver', points: 68 },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Mas Budi Prasetyo', phone: '082133445566', email: 'budi@gmail.com', member_tier: 'Regular', points: 24 },
];

function getLocalSales() {
  const stored = localStorage.getItem(DEMO_SALES_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn('Failed to parse local sales', e); }
  }
  return [];
}

function saveLocalSales(sales) {
  localStorage.setItem(DEMO_SALES_KEY, JSON.stringify(sales));
}

function getLocalCustomers() {
  const stored = localStorage.getItem(DEMO_CUSTOMERS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn('Failed to parse local customers', e); }
  }
  localStorage.setItem(DEMO_CUSTOMERS_KEY, JSON.stringify(INITIAL_DEMO_CUSTOMERS));
  return INITIAL_DEMO_CUSTOMERS;
}

export const transactionService = {
  /**
   * Memproses transaksi kasir secara atomic melalui PostgreSQL RPC (atau local storage fallback)
   */
  async createSale(saleData) {
    if (!isSupabaseConfigured) {
      // Demo fallback implementation
      try {
        const sales = getLocalSales();
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
        
        // Deduct local product stock
        const productsStored = localStorage.getItem(DEMO_PRODUCTS_KEY);
        if (productsStored) {
          try {
            const products = JSON.parse(productsStored);
            saleData.items.forEach((item) => {
              const p = products.find((prod) => prod.id === item.product_id);
              if (p) {
                p.stock = Math.max(0, p.stock - Number(item.quantity));
              }
            });
            localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
          } catch (e) {
            console.warn('Failed to update local stock:', e);
          }
        }

        const newSale = {
          id: `sale-${Date.now()}`,
          invoice_number: invoiceNumber,
          subtotal: Number(saleData.subtotal),
          discount: Number(saleData.discount || 0),
          total: Number(saleData.total),
          payment_method: saleData.paymentMethod || 'CASH',
          paid_amount: Number(saleData.paidAmount),
          change_amount: Number(saleData.changeAmount || 0),
          created_at: new Date().toISOString(),
          customer: saleData.customerId ? { name: 'Pelanggan Member' } : null,
          cashier: { full_name: 'Kasir POS' },
          sale_items: saleData.items.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            quantity: Number(item.quantity),
            unit_price: Number(item.selling_price),
            subtotal: Number(item.subtotal),
            product: { name: item.name, unit: item.unit || 'PCS' },
          })),
        };

        sales.unshift(newSale);
        saveLocalSales(sales);

        return { data: newSale, error: null };
      } catch (err) {
        return {
          data: null,
          error: { message: err.message || 'Gagal menyimpan transaksi demo.' },
        };
      }
    }

    try {
      const itemsPayload = saleData.items.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.selling_price),
        cost_price: Number(item.cost_price || 0),
        discount: Number(item.discount || 0),
        subtotal: Number(item.subtotal),
      }));

      const rpcParams = {
        p_customer_id: saleData.customerId || null,
        p_cashier_id: saleData.cashierId || null,
        p_subtotal: Number(saleData.subtotal),
        p_discount: Number(saleData.discount || 0),
        p_tax: Number(saleData.tax || 0),
        p_total: Number(saleData.total),
        p_payment_method: saleData.paymentMethod || 'CASH',
        p_paid_amount: Number(saleData.paidAmount),
        p_change_amount: Number(saleData.changeAmount || 0),
        p_notes: saleData.notes || null,
        p_items: itemsPayload,
      };

      const { data, error } = await supabase.rpc('process_pos_sale', rpcParams);

      if (error) {
        console.error('RPC Error process_pos_sale:', error);
        return {
          data: null,
          error: {
            message:
              error.message ||
              'Koneksi ke server bermasalah. Transaksi belum disimpan. Silakan periksa koneksi dan coba lagi.',
          },
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Exception during checkout:', err);
      return {
        data: null,
        error: {
          message:
            'Koneksi ke server bermasalah. Transaksi belum disimpan. Silakan periksa koneksi dan coba lagi.',
        },
      };
    }
  },

  /**
   * Mengambil daftar pelanggan untuk dropdown pilihan kasir
   */
  async getCustomers(search = '') {
    if (!isSupabaseConfigured) {
      let customers = getLocalCustomers();
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        customers = customers.filter(
          (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
        );
      }
      return { data: customers, error: null };
    }

    try {
      let query = supabase
        .from('customers')
        .select('id, name, phone, email, member_tier, points')
        .order('name', { ascending: true })
        .limit(20);

      if (search.trim()) {
        const cleanSearch = search.trim();
        query = query.or(
          `name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching customers:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Exception fetching customers:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Mengambil daftar transaksi terbaru untuk histori singkat
   */
  async getRecentTransactions(limit = 10) {
    if (!isSupabaseConfigured) {
      const sales = getLocalSales();
      return { data: sales.slice(0, limit), error: null };
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          subtotal,
          discount,
          total,
          payment_method,
          paid_amount,
          change_amount,
          created_at,
          customer:customers(name),
          cashier:profiles(full_name),
          sale_items(
            id,
            quantity,
            unit_price,
            subtotal,
            product:products(name, unit)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Exception fetching transactions:', err);
      return { data: [], error: err };
    }
  },
};
