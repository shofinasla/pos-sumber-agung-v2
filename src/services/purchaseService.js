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
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn('Failed to parse local purchases:', e);
    }
  }
  return [];
}

function saveLocalPurchases(purchases) {
  try {
    localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(purchases));
  } catch (e) {
    console.warn('Failed to save local purchases:', e);
  }
}

function createLocalPurchaseRecord(purchaseData) {
  const purchases = getLocalPurchases();
  const purchaseNo = purchaseData.purchaseNumber || `PO-${Date.now().toString().slice(-6)}`;

  let totalAmount = 0;
  const purchaseItems = (purchaseData.items || []).map((item, idx) => {
    const qty = Number(item.quantity || 0);
    const unitCost = Number(item.unitCost || 0);
    const sub = qty * unitCost;
    totalAmount += sub;
    return {
      id: `pi-${Date.now()}-${idx}`,
      product_id: item.productId,
      product_name: item.productName || 'Material',
      quantity: qty,
      unit_cost: unitCost,
      subtotal: sub,
      product: {
        id: item.productId,
        name: item.productName || 'Material',
        unit: item.unit || 'PCS',
        sku: item.sku || '',
      },
    };
  });

  // Update local product stock
  const productsStored = localStorage.getItem(DEMO_PRODUCTS_KEY);
  if (productsStored) {
    try {
      const prods = JSON.parse(productsStored);
      if (Array.isArray(prods)) {
        purchaseData.items.forEach((item) => {
          const p = prods.find((pr) => pr.id === item.productId || pr.name === item.productName);
          if (p) {
            const stockBefore = Number(p.stock || 0);
            const qty = Number(item.quantity || 0);
            p.stock = stockBefore + qty;
            if (Number(item.unitCost) > 0) {
              p.cost_price = Number(item.unitCost); // Update harga modal terbaru
            }
          }
        });
        localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(prods));
      }
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
    window.dispatchEvent(
      new CustomEvent('pos_data_updated', {
        detail: { type: 'purchase', data: newPurchase },
      })
    );
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
      // Primary Attempt: PostgREST nested relation query
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
          supplier:suppliers(id, name, contact_person, phone),
          purchase_items(
            id,
            product_id,
            quantity,
            unit_cost,
            subtotal,
            product:products(id, name, sku, unit)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.search && filters.search.trim()) {
        query = query.ilike('purchase_number', `%${filters.search.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase nested getPurchases returned error, trying flat fallback query:', error);
        
        // Secondary Attempt: Flat select from purchases without complex join
        let flatQuery = supabase
          .from('purchases')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters.search && filters.search.trim()) {
          flatQuery = flatQuery.ilike('purchase_number', `%${filters.search.trim()}%`);
        }

        const { data: flatData, error: flatError } = await flatQuery;

        if (flatError || !flatData) {
          console.warn('Flat getPurchases also failed, using local storage:', flatError);
          return { data: localPurchases, error: null };
        }

        // Hydrate supplier & items separately
        const [supsRes, itemsRes, prodsRes] = await Promise.all([
          supabase.from('suppliers').select('id, name, contact_person, phone'),
          supabase.from('purchase_items').select('*'),
          supabase.from('products').select('id, name, sku, unit'),
        ]);

        const supplierMap = new Map((supsRes.data || []).map((s) => [s.id, s]));
        const productMap = new Map((prodsRes.data || []).map((p) => [p.id, p]));

        const itemsByPurchaseId = new Map();
        (itemsRes.data || []).forEach((item) => {
          const list = itemsByPurchaseId.get(item.purchase_id) || [];
          list.push({
            ...item,
            product: productMap.get(item.product_id) || { name: 'Material', sku: '', unit: 'PCS' },
          });
          itemsByPurchaseId.set(item.purchase_id, list);
        });

        const formattedFlat = flatData.map((p) => {
          const sup = supplierMap.get(p.supplier_id);
          return {
            ...p,
            supplier_name: sup?.name || 'Supplier Umum',
            supplier: sup || null,
            purchase_items: itemsByPurchaseId.get(p.id) || [],
          };
        });

        return { data: formattedFlat, error: null };
      }

      // Format clean data from successful nested query
      const formatted = (data || []).map((p) => ({
        ...p,
        supplier_name: p.supplier?.name || p.supplier_name || 'Supplier Umum',
      }));

      // Merge with any local offline purchases if any
      const cloudPONumbers = new Set(formatted.map((p) => p.purchase_number));
      const localOnly = localPurchases.filter((p) => !cloudPONumbers.has(p.purchase_number));
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
      const purchaseNo =
        purchaseData.purchaseNumber ||
        `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      let totalAmount = 0;
      purchaseData.items.forEach((item) => {
        totalAmount += Number(item.quantity || 0) * Number(item.unitCost || 0);
      });

      const validSupplierId = isValidUUID(purchaseData.supplierId) ? purchaseData.supplierId : null;

      // 1. Insert Purchase Header
      let { data: purchase, error: purErr } = await supabase
        .from('purchases')
        .insert([
          {
            purchase_number: purchaseNo,
            supplier_id: validSupplierId,
            total_amount: totalAmount,
            status: 'COMPLETED',
            payment_status: purchaseData.paymentStatus || 'PAID',
            due_date: purchaseData.dueDate ? new Date(purchaseData.dueDate).toISOString() : null,
          },
        ])
        .select()
        .single();

      // Retry without foreign key if supplier_id fails constraint
      if (purErr && (purErr.code === '23503' || purErr.code === '22P02')) {
        console.warn('Retrying purchase header with null supplier_id due to foreign key constraint');
        const retryRes = await supabase
          .from('purchases')
          .insert([
            {
              purchase_number: purchaseNo,
              supplier_id: null,
              total_amount: totalAmount,
              status: 'COMPLETED',
              payment_status: purchaseData.paymentStatus || 'PAID',
              due_date: purchaseData.dueDate ? new Date(purchaseData.dueDate).toISOString() : null,
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

      // 2. Insert Purchase Items & Update Products / Stock Movements
      for (const item of purchaseData.items) {
        const validProdId = isValidUUID(item.productId) ? item.productId : null;
        const qty = Number(item.quantity || 0);
        const cost = Number(item.unitCost || 0);
        const subtotal = qty * cost;

        if (validProdId) {
          try {
            // Insert item line
            const { error: itemInsertErr } = await supabase.from('purchase_items').insert([
              {
                purchase_id: purchase.id,
                product_id: validProdId,
                quantity: qty,
                unit_cost: cost,
                subtotal,
              },
            ]);

            // If foreign key failed on product_id, retry with null
            if (itemInsertErr && itemInsertErr.code === '23503') {
              await supabase.from('purchase_items').insert([
                {
                  purchase_id: purchase.id,
                  product_id: null,
                  quantity: qty,
                  unit_cost: cost,
                  subtotal,
                },
              ]);
            }

            // Fetch current stock from Supabase products
            const { data: prod } = await supabase
              .from('products')
              .select('stock, cost_price')
              .eq('id', validProdId)
              .single();

            if (prod) {
              const currentStock = Number(prod.stock || 0);
              const newStock = currentStock + qty;

              // Update product stock and cost_price
              await supabase
                .from('products')
                .update({
                  stock: newStock,
                  cost_price: cost > 0 ? cost : prod.cost_price,
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
            }
          } catch (itemErr) {
            console.warn('Error updating purchase item or stock in Supabase:', itemErr);
          }
        }
      }

      // Also mirror to local cache
      try {
        const localList = getLocalPurchases();
        localList.unshift({
          ...purchase,
          supplier_name: purchaseData.supplierName || 'Supplier Toko',
          purchase_items: purchaseData.items,
        });
        saveLocalPurchases(localList);
      } catch (e) {
        console.warn('Failed to mirror purchase to local storage:', e);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pos_data_updated', {
            detail: { type: 'purchase', data: purchase },
          })
        );
      }

      return { data: purchase, error: null };
    } catch (err) {
      console.warn('Exception during createPurchase, falling back to local:', err);
      const localPur = createLocalPurchaseRecord(purchaseData);
      return { data: localPur, error: null };
    }
  },
};

