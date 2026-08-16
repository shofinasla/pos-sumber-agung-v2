import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toSearchString } from '../utils/searchUtils';

const DEMO_PRODUCTS_KEY = 'tb_sa_demo_products';
const DEMO_MOVEMENTS_KEY = 'tb_sa_demo_stock_movements';

function getLocalProducts() {
  const stored = localStorage.getItem(DEMO_PRODUCTS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  return [];
}

function saveLocalProducts(prods) {
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(prods));
}

function getLocalMovements() {
  const stored = localStorage.getItem(DEMO_MOVEMENTS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.warn(e); }
  }
  return [];
}

function saveLocalMovements(movs) {
  localStorage.setItem(DEMO_MOVEMENTS_KEY, JSON.stringify(movs));
}

export const stockService = {
  /**
   * Ringkasan statistik stok & inventaris akurat untuk seluruh produk (> 4000+ item)
   */
  async getStockOverview() {
    if (!isSupabaseConfigured || !supabase) {
      const prods = getLocalProducts();
      let totalProducts = prods.length;
      let lowStock = 0;
      let outOfStock = 0;
      let totalValue = 0;

      prods.forEach((p) => {
        const stock = Number(p.stock || 0);
        const min = Number(p.minimum_stock || 5);
        const price = Number(p.cost_price || p.selling_price || 0);

        if (stock <= 0) outOfStock++;
        else if (stock <= min) lowStock++;

        if (stock > 0) {
          totalValue += stock * price;
        }
      });

      return {
        data: { totalProducts, lowStock, outOfStock, totalValue },
        error: null,
      };
    }

    try {
      const CHUNK_SIZE = 1000;
      // 1. Ambil chunk pertama sekaligus total hitungan seluruh produk di Supabase
      const { data: firstBatch, count, error } = await supabase
        .from('products')
        .select('id, stock, minimum_stock, cost_price, selling_price, is_active', { count: 'exact' })
        .range(0, CHUNK_SIZE - 1);

      if (error) return { data: null, error };

      let allProducts = firstBatch || [];
      const totalCount = count || allProducts.length;

      // 2. Jika produk > 1000 (misal 4000+), tarik seluruh chunk tersisa secara paralel
      if (totalCount > CHUNK_SIZE) {
        const batchPromises = [];
        for (let from = CHUNK_SIZE; from < totalCount; from += CHUNK_SIZE) {
          const to = Math.min(from + CHUNK_SIZE - 1, totalCount - 1);
          batchPromises.push(
            supabase
              .from('products')
              .select('id, stock, minimum_stock, cost_price, selling_price, is_active')
              .range(from, to)
          );
        }

        const results = await Promise.all(batchPromises);
        results.forEach((res) => {
          if (res.data && Array.isArray(res.data)) {
            allProducts = allProducts.concat(res.data);
          }
        });
      }

      let totalProducts = totalCount || allProducts.length;
      let lowStock = 0;
      let outOfStock = 0;
      let totalValue = 0;

      allProducts.forEach((p) => {
        const stock = Number(p.stock || 0);
        const min = Number(p.minimum_stock || 5);
        const price = Number(p.cost_price || p.selling_price || 0);

        if (stock <= 0) outOfStock++;
        else if (stock <= min) lowStock++;

        if (stock > 0) {
          totalValue += stock * price;
        }
      });

      return {
        data: { totalProducts, lowStock, outOfStock, totalValue },
        error: null,
      };
    } catch (err) {
      console.error('Error in getStockOverview:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Mengambil riwayat pergerakan stok
   */
  async getStockMovements(filters = {}) {
    const searchStr = typeof filters === 'string' ? toSearchString(filters) : toSearchString(filters?.search);
    const q = searchStr.toLowerCase();

    if (!isSupabaseConfigured) {
      let movs = getLocalMovements();
      if (q) {
        movs = movs.filter((m) =>
          (m.product_name || '').toLowerCase().includes(q) ||
          (m.notes || '').toLowerCase().includes(q)
        );
      }
      if (filters.type && filters.type !== 'all') {
        movs = movs.filter((m) => m.movement_type === filters.type);
      }
      return { data: movs, error: null };
    }

    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          id,
          product_id,
          movement_type,
          quantity,
          stock_before,
          stock_after,
          reference_id,
          notes,
          created_at,
          product:products(name, sku, unit),
          created_by_user:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.type && filters.type !== 'all') {
        query = query.eq('movement_type', filters.type);
      }

      const { data, error } = await query;
      if (error) return { data: [], error };

      const formatted = (data || []).map((m) => ({
        ...m,
        product_name: m.product?.name || 'Produk Material',
        sku: m.product?.sku || '-',
        unit: m.product?.unit || 'PCS',
        user_name: m.created_by_user?.full_name || 'Sistem Kasir',
      }));

      return { data: formatted, error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  },

  /**
   * Penyesuaian stok manual (Adjustment, Damage, Return, etc)
   */
  async adjustStock({ productId, delta, movementType, notes, createdBy }) {
    if (!isSupabaseConfigured) {
      const prods = getLocalProducts();
      const idx = prods.findIndex((p) => p.id === productId);
      if (idx === -1) return { error: { message: 'Produk tidak ditemukan.' } };

      const product = prods[idx];
      const stockBefore = Number(product.stock || 0);
      const stockAfter = Math.max(0, stockBefore + Number(delta));

      prods[idx].stock = stockAfter;
      saveLocalProducts(prods);

      const movs = getLocalMovements();
      const newMov = {
        id: `mov-${Date.now()}`,
        product_id: productId,
        product_name: product.name,
        sku: product.sku,
        unit: product.unit || 'PCS',
        movement_type: movementType || 'ADJUSTMENT',
        quantity: delta,
        stock_before: stockBefore,
        stock_after: stockAfter,
        notes: notes || 'Penyesuaian stok manual',
        user_name: 'Petugas Stok',
        created_at: new Date().toISOString(),
      };
      movs.unshift(newMov);
      saveLocalMovements(movs);

      return { data: prods[idx], error: null };
    }

    try {
      // Fetch current stock
      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .select('name, stock, sku, unit')
        .eq('id', productId)
        .single();

      if (prodErr || !prod) {
        return { error: { message: 'Produk tidak ditemukan.' } };
      }

      const stockBefore = Number(prod.stock || 0);
      const stockAfter = Math.max(0, stockBefore + Number(delta));

      // Update product stock
      const { error: updateErr } = await supabase
        .from('products')
        .update({ stock: stockAfter, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (updateErr) return { error: updateErr };

      // Insert movement
      const { error: movErr } = await supabase.from('stock_movements').insert([
        {
          product_id: productId,
          movement_type: movementType || 'ADJUSTMENT',
          quantity: delta,
          stock_before: stockBefore,
          stock_after: stockAfter,
          notes: notes || 'Penyesuaian stok manual',
          created_by: createdBy || null,
        },
      ]);

      if (movErr) console.warn('Movement log insert warning:', movErr);

      return { data: { id: productId, stock: stockAfter }, error: null };
    } catch (err) {
      return { error: err };
    }
  },
};
