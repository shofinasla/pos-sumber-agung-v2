import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toSearchString } from '../utils/searchUtils';

const DEMO_PURCHASES_KEY = 'tb_sa_demo_purchases';
const DEMO_PRODUCTS_KEY = 'tb_sa_demo_products';

const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

function getLocalPurchases() {
  const stored = localStorage.getItem(DEMO_PURCHASES_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  return [];
}

function saveLocalPurchases(purchases) {
  localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(purchases));
}

function createLocalPurchaseRecord(purchaseData) {
  const purchases = getLocalPurchases();
  const purchaseNo = purchaseData.purchaseNumber || `PO-${Date.now().toString().slice(-6)}`;
  
  let totalAmount = 0;
  const purchaseItems = purchaseData.items.map((item, idx) => {
    const sub = Number(item.quantity) * Number(item.unitCost);
    totalAmount += sub;
    return {
      id: `pi-${Date.now()}-${idx}`,
      product_id: item.productId,
      product_name: item.productName || 'Material',
      quantity: Number(item.quantity),
      unit_cost: Number(item.unitCost),
      subtotal: sub,
      product: {
        name: item.productName || 'Material',
        unit: item.unit || 'PCS',
        sku: item.sku || '',
      }
    };
  });

  // Update local product stock
  const productsStored = localStorage.getItem(DEMO_PRODUCTS_KEY);
  if (productsStored) {
    try {
      const prods = JSON.parse(productsStored);
      purchaseData.items.forEach((item) => {
        const p = prods.find((pr) => pr.id === item.productId || pr.name === item.productName);
        if (p) {
          const stockBefore = Number(p.stock || 0);
          const qty = Number(item.quantity);
          p.stock = stockBefore + qty;
          if (Number(item.unitCost) > 0) {
            p.cost_price = Number(item.unitCost); // Update harga modal terbaru
          }
        }
      });
      localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(prods));
    } catch (e) {
      console.warn('Failed to update local stock for purchase:', e);
    }
  }

  const newPurchase = {
    id: `pur-${Date.now()}`,
    purchase_number: purchaseNo,
    supplier_id: purchaseData.supplierId || null,
    supplier_name: purchaseData.supplierName || 'Supplier Toko',
    total_amount: totalAmount,
    status: 'COMPLETED',
    payment_status: purchaseData.paymentStatus || 'PAID',
    due_date: purchaseData.dueDate || null,
    created_at: new Date().toISOString(),
    purchase_items: purchaseItems,
  };

  purchases.unshift(newPurchase);
  saveLocalPurchases(purchases);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pos_data_updated', { detail: { type: 'purchase', data: newPurchase } }));
  }

  return newPurchase;
}

export const purchaseService = {
  async getPurchases(filters = {}) {
    const searchStr = typeof filters === 'string' ? toSearchString(filters) : toSearchString(filters?.search);
    const q = searchStr.toLowerCase();
    const localPurchases = getLocalPurchases();

    if (!isSupabaseConfigured || !supabase) {
      let list = localPurchases;
      if (q) {
        list = list.filter(
          (p) =>
            (p.purchase_number || '').toLowerCase().includes(q) ||
            (p.supplier_name || '').toLowerCase().includes(q)
        );
      }
      return { data: list, error: null };
    }

    try {
      let query = supabase
        .from('purchases')
        .select(`
          id,
          purchase_number,
          supplier_id,
          total_amount,
          status,
          payment_status,
          due_date,
          created_at,
          supplier:suppliers(name, contact_person, phone),
          purchase_items(
            id,
            product_id,
            quantity,
            unit_cost,
            subtotal,
            product:products(name, sku, unit)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.ilike('purchase_number', `%${filters.search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase getPurchases error, using local fallback:', error);
        return { data: localPurchases, error: null };
      }

      const formatted = (data || []).map((p) => ({
        ...p,
        supplier_name: p.supplier?.name || p.supplier_name || 'Supplier Umum',
      }));

      // Merge any local unsynced purchases
      const cloudPONumbers = new Set(formatted.map(p => p.purchase_number));
      const localOnly = localPurchases.filter(p => !cloudPONumbers.has(p.purchase_number));
      const combined = [...localOnly, ...formatted];

      return { data: combined, error: null };
    } catch (err) {
      console.warn('Exception in getPurchases, using local:', err);
      return { data: localPurchases, error: null };
    }
  },

  async createPurchase(purchaseData) {
    if (!purchaseData || !Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
      return { data: null, error: { message: 'Item pembelian tidak boleh kosong.' } };
    }

    if (!isSupabaseConfigured || !supabase) {
      try {
        const localPur = createLocalPurchaseRecord(purchaseData);
        return { data: localPur, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    try {
      const purchaseNo = purchaseData.purchaseNumber || `PO-${Date.now().toString().slice(-6)}`;
      let totalAmount = 0;

      purchaseData.items.forEach((item) => {
        totalAmount += Number(item.quantity || 0) * Number(item.unitCost || 0);
      });

      const validSupplierId = isValidUUID(purchaseData.supplierId) ? purchaseData.supplierId : null;

      // Insert purchase header
      let { data: purchase, error: purErr } = await supabase
        .from('purchases')
        .insert([
          {
            purchase_number: purchaseNo,
            supplier_id: validSupplierId,
            total_amount: totalAmount,
            status: 'COMPLETED',
            payment_status: purchaseData.paymentStatus || 'PAID',
            due_date: purchaseData.dueDate || null,
          },
        ])
        .select()
        .single();

      if (purErr && (purErr.code === '23503' || purErr.code === '22P02')) {
        // Retry with null supplier_id
        const retryRes = await supabase
          .from('purchases')
          .insert([
            {
              purchase_number: purchaseNo,
              supplier_id: null,
              total_amount: totalAmount,
              status: 'COMPLETED',
              payment_status: purchaseData.paymentStatus || 'PAID',
              due_date: purchaseData.dueDate || null,
            },
          ])
          .select()
          .single();
        purchase = retryRes.data;
        purErr = retryRes.error;
      }

      if (purErr || !purchase) {
        console.warn('Purchase header insert failed, using local storage fallback:', purErr);
        const localPur = createLocalPurchaseRecord(purchaseData);
        return { data: localPur, error: null };
      }

      // Insert purchase items & update product stock
      for (const item of purchaseData.items) {
        const validProdId = isValidUUID(item.productId) ? item.productId : null;
        const qty = Number(item.quantity);
        const cost = Number(item.unitCost);
        const subtotal = qty * cost;

        if (validProdId) {
          try {
            await supabase.from('purchase_items').insert([
              {
                purchase_id: purchase.id,
                product_id: validProdId,
                quantity: qty,
                unit_cost: cost,
                subtotal,
              },
            ]);

            // Get current stock
            const { data: prod } = await supabase
              .from('products')
              .select('stock')
              .eq('id', validProdId)
              .single();

            const currentStock = prod ? Number(prod.stock || 0) : 0;
            const newStock = currentStock + qty;

            // Update product stock and cost price
            await supabase
              .from('products')
              .update({
                stock: newStock,
                cost_price: cost > 0 ? cost : undefined,
                updated_at: new Date().toISOString(),
              })
              .eq('id', validProdId);

            // Record stock movement
            await supabase.from('stock_movements').insert([
              {
                product_id: validProdId,
                movement_type: 'PURCHASE',
                quantity: qty,
                stock_before: currentStock,
                stock_after: newStock,
                reference_id: purchase.id,
                notes: `Faktur Pembelian No: ${purchaseNo}`,
              },
            ]);
          } catch (itemErr) {
            console.warn('Error inserting purchase item or stock:', itemErr);
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_data_updated', { detail: { type: 'purchase', data: purchase } }));
      }

      return { data: purchase, error: null };
    } catch (err) {
      console.warn('Exception during createPurchase, falling back to local:', err);
      const localPur = createLocalPurchaseRecord(purchaseData);
      return { data: localPur, error: null };
    }
  },
};
