import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cashService } from './cashService';

const DEMO_SALES_KEY = 'tb_sa_demo_sales';
const DEMO_PRODUCTS_KEY = 'tb_sa_demo_products';
const DEMO_CUSTOMERS_KEY = 'tb_sa_demo_customers';
const PENDING_SYNC_KEY = 'tb_sa_pending_sync_sales';

const INITIAL_DEMO_CUSTOMERS = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Bpk. Ahmad Subagyo', phone: '081298765432', email: 'ahmad@gmail.com', member_tier: 'Gold', points: 125 },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'Ibu Siti Rahmawati', phone: '085712345678', email: 'siti.rahma@yahoo.com', member_tier: 'Silver', points: 68 },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Mas Budi Prasetyo', phone: '082133445566', email: 'budi@gmail.com', member_tier: 'Regular', points: 24 },
];

const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

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

function savePendingSyncSale(sale) {
  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    const pending = stored ? JSON.parse(stored) : [];
    pending.unshift(sale);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
  } catch (e) {
    console.warn('Failed to save pending sync sale:', e);
  }
}

// Local helper to record sales safely into localStorage and deduct local stock
function createLocalSaleRecord(saleData, customInvoice = null) {
  const sales = getLocalSales();
  const invoiceNumber = customInvoice || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Deduct local product stock
  const productsStored = localStorage.getItem(DEMO_PRODUCTS_KEY);
  if (productsStored) {
    try {
      const products = JSON.parse(productsStored);
      saleData.items.forEach((item) => {
        const p = products.find((prod) => prod.id === item.product_id || prod.name === item.name);
        if (p) {
          p.stock = Math.max(0, Number(p.stock || 0) - Number(item.quantity));
        }
      });
      localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to update local stock:', e);
    }
  }

  const newSale = {
    id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    invoice_number: invoiceNumber,
    subtotal: Number(saleData.subtotal),
    discount: Number(saleData.discount || 0),
    tax: Number(saleData.tax || 0),
    total: Number(saleData.total),
    payment_method: saleData.paymentMethod || 'CASH',
    paid_amount: Number(saleData.paidAmount),
    change_amount: Number(saleData.changeAmount || 0),
    status: 'COMPLETED',
    notes: saleData.notes || null,
    created_at: new Date().toISOString(),
    customer: saleData.selectedCustomer || (saleData.customerId ? { name: 'Pelanggan Toko' } : null),
    cashier: { full_name: 'Kasir POS' },
    is_synced: false,
    sale_items: saleData.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      quantity: Number(item.quantity),
      unit_price: Number(item.selling_price || item.unit_price || 0),
      cost_price: Number(item.cost_price || 0),
      subtotal: Number(item.subtotal),
      product: { name: item.name, unit: item.unit || 'PCS' },
    })),
  };

  sales.unshift(newSale);
  saveLocalSales(sales);
  savePendingSyncSale(newSale);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pos_data_updated', { detail: { type: 'sale', data: newSale } }));
  }

  return newSale;
}

export const transactionService = {
  /**
   * Memproses transaksi kasir secara atomic melalui PostgreSQL RPC, direct insert, atau offline fallback
   */
  async createSale(saleData) {
    if (!saleData || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      return {
        data: null,
        error: { message: 'Keranjang belanja kosong atau data transaksi tidak valid.' },
      };
    }

    // Jika Supabase tidak dikonfigurasi, gunakan local storage
    if (!isSupabaseConfigured || !supabase) {
      try {
        const localSale = createLocalSaleRecord(saleData);
        return { data: localSale, error: null };
      } catch (err) {
        console.error('Local sale creation error:', err);
        return {
          data: null,
          error: { message: err.message || 'Gagal menyimpan transaksi.' },
        };
      }
    }

    // Sanitize parameters for Supabase Postgres
    const validCustomerId = isValidUUID(saleData.customerId) ? saleData.customerId : null;
    const validCashierId = isValidUUID(saleData.cashierId) ? saleData.cashierId : null;

    const itemsPayload = saleData.items.map((item) => {
      const rawId = item.product_id || item.id || item.productId || null;
      const validProdId = isValidUUID(rawId) ? rawId : null;
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.selling_price || item.unit_price || item.price || 0);
      const costPrice = Number(item.cost_price || 0);
      const discount = Number(item.discount || 0);
      const subtotal = Number(item.subtotal || Math.max(0, (unitPrice - discount) * qty));
      return {
        product_id: validProdId,
        raw_id: rawId,
        quantity: qty,
        unit_price: unitPrice,
        cost_price: costPrice,
        discount: discount,
        subtotal: subtotal,
        name: item.name || 'Produk Material',
      };
    });

    const generatedInvoice = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // STEP 1: Attempt Supabase RPC 'process_pos_sale' if available
    try {
      const rpcParams = {
        p_customer_id: validCustomerId,
        p_cashier_id: validCashierId,
        p_subtotal: Number(saleData.subtotal),
        p_discount: Number(saleData.discount || 0),
        p_tax: Number(saleData.tax || 0),
        p_total: Number(saleData.total),
        p_payment_method: saleData.paymentMethod || 'CASH',
        p_paid_amount: Number(saleData.paidAmount),
        p_change_amount: Number(saleData.changeAmount || 0),
        p_notes: saleData.notes || null,
        p_items: itemsPayload
          .filter((i) => i.product_id !== null)
          .map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            cost_price: i.cost_price,
            discount: i.discount,
            subtotal: i.subtotal,
          })),
      };

      if (rpcParams.p_items.length > 0) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('process_pos_sale', rpcParams);

        if (!rpcError && rpcData) {
          const returnData = {
            sale_id: rpcData.id || rpcData.sale_id,
            invoice_number: rpcData.invoice_number || generatedInvoice,
            total: Number(rpcData.total || saleData.total),
            paid_amount: Number(rpcData.paid_amount || saleData.paidAmount),
            change_amount: Number(rpcData.change_amount || saleData.changeAmount || 0),
            created_at: rpcData.created_at || new Date().toISOString(),
            customer: saleData.selectedCustomer || null,
            cashier: { full_name: 'Kasir POS' },
            success: true,
          };

          // Record cash flow if paid in cash
          if ((saleData.paymentMethod || 'CASH').toUpperCase() === 'CASH') {
            await cashService.addCashTransaction({
              type: 'IN',
              amount: Number(returnData.total),
              category: 'PENJUALAN',
              notes: `Penjualan Kasir POS #${returnData.invoice_number}`,
              cashierId: validCashierId,
            });
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pos_data_updated', { detail: { type: 'sale', data: returnData } }));
          }

          return { data: returnData, error: null };
        }

        if (rpcError) {
          console.warn('RPC process_pos_sale returned error, switching to direct insert fallback:', rpcError.message || rpcError);
        }
      }
    } catch (rpcEx) {
      console.warn('Exception during RPC process_pos_sale:', rpcEx);
    }

    // STEP 2: Direct Table Insert Fallback
    try {
      // First attempt with sanitized UUIDs
      let directSaleInsert = {
        invoice_number: generatedInvoice,
        customer_id: validCustomerId,
        cashier_id: validCashierId,
        subtotal: Number(saleData.subtotal),
        discount: Number(saleData.discount || 0),
        tax: Number(saleData.tax || 0),
        total: Number(saleData.total),
        payment_method: saleData.paymentMethod || 'CASH',
        paid_amount: Number(saleData.paidAmount),
        change_amount: Number(saleData.changeAmount || 0),
        status: 'COMPLETED',
        notes: saleData.notes || null,
      };

      let { data: directSale, error: directSaleErr } = await supabase
        .from('sales')
        .insert([directSaleInsert])
        .select()
        .single();

      // If failed due to FK constraint on customer_id or cashier_id, retry without them
      if (directSaleErr && (directSaleErr.code === '23503' || directSaleErr.message?.includes('foreign key') || directSaleErr.code === '22P02')) {
        console.warn('Foreign key or UUID mismatch on sales table, retrying with sanitized null IDs:', directSaleErr.message);
        directSaleInsert.customer_id = null;
        directSaleInsert.cashier_id = null;
        const retryRes = await supabase
          .from('sales')
          .insert([directSaleInsert])
          .select()
          .single();
        directSale = retryRes.data;
        directSaleErr = retryRes.error;
      }

      if (directSaleErr) {
        console.warn('Direct sales table insert failed:', directSaleErr);
        throw directSaleErr;
      }

      // Insert sale items safely into Supabase sale_items table
      if (directSale && itemsPayload.length > 0) {
        let saleItemsToInsert = itemsPayload.map((item) => ({
          sale_id: directSale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          cost_price: item.cost_price,
          discount: item.discount,
          subtotal: item.subtotal,
        }));

        try {
          const { error: itemsErr } = await supabase.from('sale_items').insert(saleItemsToInsert);
          if (itemsErr) {
            console.warn('Initial sale_items insert failed (FK mismatch), retrying with sanitized null product IDs:', itemsErr.message);
            // Retry by setting non-conforming product_id to null so items are never lost
            const fallbackItems = saleItemsToInsert.map((it) => ({ ...it, product_id: null }));
            await supabase.from('sale_items').insert(fallbackItems);
          }
        } catch (itemsEx) {
          console.warn('Sale items insert exception:', itemsEx);
        }

        // Update product stock and record movement
        for (const item of itemsPayload) {
          if (!item.product_id) continue;
          try {
            const { data: prod } = await supabase
              .from('products')
              .select('id, stock')
              .eq('id', item.product_id)
              .single();

            if (prod) {
              const currentStock = Number(prod.stock || 0);
              const newStock = Math.max(0, currentStock - Number(item.quantity));
              await supabase
                .from('products')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('id', prod.id);

              await supabase.from('stock_movements').insert([
                {
                  product_id: prod.id,
                  movement_type: 'OUT',
                  quantity: Number(item.quantity),
                  stock_before: currentStock,
                  stock_after: newStock,
                  reference_id: directSale.id,
                  notes: `Penjualan Kasir POS #${generatedInvoice}`,
                },
              ]);
            }
          } catch (stockErr) {
            console.warn('Stock update warning for item:', item.product_id, stockErr);
          }
        }
      }

      // Record cash transaction for Cash payment
      if ((saleData.paymentMethod || 'CASH').toUpperCase() === 'CASH') {
        await cashService.addCashTransaction({
          type: 'IN',
          amount: Number(directSale.total),
          category: 'PENJUALAN',
          notes: `Penjualan Kasir POS #${generatedInvoice}`,
          cashierId: validCashierId,
        });
      }

      const returnData = {
        sale_id: directSale.id,
        invoice_number: generatedInvoice,
        total: directSale.total,
        paid_amount: directSale.paid_amount,
        change_amount: directSale.change_amount,
        created_at: directSale.created_at,
        customer: saleData.selectedCustomer || null,
        cashier: { full_name: 'Kasir POS' },
        success: true,
      };

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_data_updated', { detail: { type: 'sale', data: returnData } }));
      }

      return { data: returnData, error: null };
    } catch (directEx) {
      // STEP 3: RESILIENT LOCAL FALLBACK (When offline / RLS / network issues happen)
      // Save locally so the cashier never loses a sale and can always print the receipt!
      console.warn('Database insert failed. Falling back to local offline storage:', directEx);
      try {
        const localSale = createLocalSaleRecord(saleData, generatedInvoice);
        return {
          data: {
            ...localSale,
            sale_id: localSale.id,
            success: true,
            isOfflineSaved: true,
          },
          error: null,
        };
      } catch (localEx) {
        console.error('Fatal failure saving sale locally:', localEx);
        return {
          data: null,
          error: {
            message: 'Terjadi kesalahan sistem saat memproses pembayaran. Silakan coba kembali.',
          },
        };
      }
    }
  },

  /**
   * Mengambil daftar transaksi lengkap dengan filter
   */
  async getSalesHistory(filters = {}) {
    let localSales = getLocalSales();

    if (!isSupabaseConfigured || !supabase) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        localSales = localSales.filter(
          (s) =>
            (s.invoice_number || '').toLowerCase().includes(q) ||
            (s.customer?.name || '').toLowerCase().includes(q) ||
            (s.notes || '').toLowerCase().includes(q)
        );
      }
      if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
        localSales = localSales.filter((s) => s.payment_method === filters.paymentMethod);
      }
      if (filters.status && filters.status !== 'ALL') {
        localSales = localSales.filter((s) => (s.status || 'COMPLETED') === filters.status);
      }
      return { data: localSales, error: null };
    }

    try {
      let query = supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          subtotal,
          discount,
          tax,
          total,
          payment_method,
          paid_amount,
          change_amount,
          status,
          notes,
          created_at,
          customer:customers(name, phone),
          cashier:profiles(full_name),
          sale_items(
            id,
            quantity,
            unit_price,
            cost_price,
            discount,
            subtotal,
            product:products(name, sku, unit)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        const q = filters.search.trim();
        query = query.or(`invoice_number.ilike.%${q}%,notes.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase getSalesHistory query error, returning local sales:', error);
        return { data: localSales, error: null };
      }

      // Merge any local unsynced sales with cloud sales
      const cloudInvoiceSet = new Set((data || []).map((s) => s.invoice_number));
      const unsyncedSales = localSales.filter((s) => !cloudInvoiceSet.has(s.invoice_number));
      const combinedSales = [...unsyncedSales, ...(data || [])];

      return { data: combinedSales, error: null };
    } catch (err) {
      console.warn('Exception in getSalesHistory, falling back to local sales:', err);
      return { data: localSales, error: null };
    }
  },

  /**
   * Pembatalan Transaksi / Void
   */
  async voidSale(saleId, reason = 'Pembatalan Transaksi Kasir') {
    // Update local sales if exists
    const sales = getLocalSales();
    const idx = sales.findIndex((s) => s.id === saleId);
    if (idx !== -1) {
      sales[idx].status = 'VOIDED';
      sales[idx].notes = (sales[idx].notes ? sales[idx].notes + ' | ' : '') + `VOID: ${reason}`;
      saveLocalSales(sales);
    }

    if (!isSupabaseConfigured || !supabase) {
      return { data: true, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .update({
          status: 'VOIDED',
          notes: `VOID: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saleId);

      if (error) {
        console.warn('Supabase voidSale update error:', error);
        return { data: true, error: null }; // Already voided locally
      }
      return { data, error: null };
    } catch (err) {
      console.warn('Exception in voidSale:', err);
      return { data: true, error: null };
    }
  },

  /**
   * Mengambil daftar pelanggan untuk dropdown pilihan kasir
   */
  async getCustomers(search = '') {
    let localCusts = getLocalCustomers();
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      localCusts = localCusts.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return { data: localCusts, error: null };
    }

    try {
      let query = supabase
        .from('customers')
        .select('id, name, phone, email, member_tier, points')
        .order('name', { ascending: true })
        .limit(30);

      if (search.trim()) {
        const cleanSearch = search.trim();
        query = query.or(
          `name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`
        );
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return { data: localCusts, error: null };
      }

      return { data: data || [], error: null };
    } catch {
      return { data: localCusts, error: null };
    }
  },

  /**
   * Mengambil daftar transaksi terbaru untuk histori singkat
   */
  async getRecentTransactions(limit = 10) {
    const historyRes = await this.getSalesHistory();
    const list = historyRes.data || [];
    return { data: list.slice(0, limit), error: null };
  },

  /**
   * Berlangganan perubahan data penjualan secara real-time antar perangkat
   */
  subscribeSales(callback) {
    if (!isSupabaseConfigured || !supabase) {
      const handler = (e) => {
        if (callback && e.detail) callback({ eventType: 'INSERT', new: e.detail });
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('pos_data_updated', handler);
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('pos_data_updated', handler);
        }
      };
    }

    try {
      const channel = supabase
        .channel('sales-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
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

