import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEMO_PURCHASES_KEY = 'tb_sa_demo_purchases';
const DEMO_PRODUCTS_KEY = 'tb_sa_demo_products';

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

export const purchaseService = {
  async getPurchases(filters = {}) {
    if (!isSupabaseConfigured) {
      let purchases = getLocalPurchases();
      if (filters.search) {
        const q = filters.search.toLowerCase();
        purchases = purchases.filter(
          (p) =>
            (p.purchase_number || '').toLowerCase().includes(q) ||
            (p.supplier_name || '').toLowerCase().includes(q)
        );
      }
      return { data: purchases, error: null };
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
      if (error) return { data: [], error };

      const formatted = (data || []).map((p) => ({
        ...p,
        supplier_name: p.supplier?.name || 'Supplier Umum',
      }));

      return { data: formatted, error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  async createPurchase(purchaseData) {
    // purchaseData = { supplierId, purchaseNumber, paymentStatus, dueDate, items: [{ productId, quantity, unitCost }] }
    if (!isSupabaseConfigured) {
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
        };
      });

      // Update local product stock
      const productsStored = localStorage.getItem(DEMO_PRODUCTS_KEY);
      if (productsStored) {
        try {
          const prods = JSON.parse(productsStored);
          purchaseData.items.forEach((item) => {
            const p = prods.find((pr) => pr.id === item.productId);
            if (p) {
              const stockBefore = Number(p.stock || 0);
              const qty = Number(item.quantity);
              p.stock = stockBefore + qty;
              p.cost_price = Number(item.unitCost); // Update harga modal terbaru
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

      return { data: newPurchase, error: null };
    }

    try {
      const purchaseNo = purchaseData.purchaseNumber || `PO-${Date.now().toString().slice(-6)}`;
      let totalAmount = 0;

      purchaseData.items.forEach((item) => {
        totalAmount += Number(item.quantity) * Number(item.unitCost);
      });

      // Insert purchase header
      const { data: purchase, error: purErr } = await supabase
        .from('purchases')
        .insert([
          {
            purchase_number: purchaseNo,
            supplier_id: purchaseData.supplierId || null,
            total_amount: totalAmount,
            status: 'COMPLETED',
            payment_status: purchaseData.paymentStatus || 'PAID',
            due_date: purchaseData.dueDate || null,
          },
        ])
        .select()
        .single();

      if (purErr || !purchase) return { data: null, error: purErr };

      // Insert purchase items & update product stock
      for (const item of purchaseData.items) {
        const qty = Number(item.quantity);
        const cost = Number(item.unitCost);
        const subtotal = qty * cost;

        await supabase.from('purchase_items').insert([
          {
            purchase_id: purchase.id,
            product_id: item.productId,
            quantity: qty,
            unit_cost: cost,
            subtotal,
          },
        ]);

        // Get current stock
        const { data: prod } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single();

        const currentStock = prod ? Number(prod.stock || 0) : 0;
        const newStock = currentStock + qty;

        // Update product stock and cost price
        await supabase
          .from('products')
          .update({
            stock: newStock,
            cost_price: cost,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.productId);

        // Record stock movement
        await supabase.from('stock_movements').insert([
          {
            product_id: item.productId,
            movement_type: 'PURCHASE',
            quantity: qty,
            stock_before: currentStock,
            stock_after: newStock,
            reference_id: purchase.id,
            notes: `Faktur Pembelian No: ${purchaseNo}`,
          },
        ]);
      }

      return { data: purchase, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
};
