import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toSearchString } from '../utils/searchUtils';

// Local storage key for demo fallback mode
const DEMO_PRODUCTS_KEY = 'tb_sa_demo_products';

// Seed demo products for offline / fallback
const INITIAL_DEMO_PRODUCTS = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    sku: 'SMN-GRS-40',
    barcode: '899123456001',
    name: 'Semen Gresik 40kg',
    category_id: 'c1111111-1111-1111-1111-111111111111',
    unit: 'SAK',
    cost_price: 58000,
    selling_price: 65000,
    stock: 120,
    minimum_stock: 20,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    sku: 'SMN-TGR-50',
    barcode: '899123456002',
    name: 'Semen Tiga Roda 50kg',
    category_id: 'c1111111-1111-1111-1111-111111111111',
    unit: 'SAK',
    cost_price: 68000,
    selling_price: 75000,
    stock: 4,
    minimum_stock: 20,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    sku: 'BSI-BTN-10',
    barcode: '899123456003',
    name: 'Besi Beton 10mm SNI',
    category_id: 'c2222222-2222-2222-2222-222222222222',
    unit: 'BATANG',
    cost_price: 65000,
    selling_price: 75000,
    stock: 85,
    minimum_stock: 15,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p4444444-4444-4444-4444-444444444444',
    sku: 'PKU-KYU-03',
    barcode: '899123456004',
    name: 'Paku Kayu 3 inch',
    category_id: 'c2222222-2222-2222-2222-222222222222',
    unit: 'KG',
    cost_price: 18000,
    selling_price: 22000,
    stock: 2,
    minimum_stock: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p5555555-5555-5555-5555-555555555555',
    sku: 'CAT-NPP-05',
    barcode: '899123456005',
    name: 'Cat Tembok Nippon Paint 5kg White',
    category_id: 'c3333333-3333-3333-3333-333333333333',
    unit: 'DOS',
    cost_price: 115000,
    selling_price: 135000,
    stock: 18,
    minimum_stock: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p6666666-6666-6666-6666-666666666666',
    sku: 'PPA-WVN-34',
    barcode: '899123456006',
    name: 'Pipa PVC Wavin 3/4 inch (4 Meter)',
    category_id: 'c4444444-4444-4444-4444-444444444444',
    unit: 'BATANG',
    cost_price: 24000,
    selling_price: 30000,
    stock: 45,
    minimum_stock: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getLocalProducts() {
  const stored = localStorage.getItem(DEMO_PRODUCTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(INITIAL_DEMO_PRODUCTS));
  return INITIAL_DEMO_PRODUCTS;
}

function saveLocalProducts(products) {
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
}

export const productService = {
  // Fetch paginated products with filters and total count
  async getProducts(params = {}) {
    const options = typeof params === 'string' ? { search: params } : (params || {});
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId = '',
      statusFilter = 'all', // 'all', 'active', 'inactive'
      stockFilter = 'all',  // 'all', 'available', 'low', 'out_of_stock'
    } = options;

    const cleanSearch = toSearchString(search);
    const q = cleanSearch.toLowerCase();

    if (!isSupabaseConfigured) {
      let products = getLocalProducts();

      // Search
      if (q) {
        products = products.filter(
          (p) =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q) ||
            (p.barcode && (p.barcode || '').toLowerCase().includes(q))
        );
      }

      // Category filter
      if (categoryId) {
        products = products.filter((p) => p.category_id === categoryId);
      }

      // Status filter
      if (statusFilter === 'active') {
        products = products.filter((p) => p.is_active === true);
      } else if (statusFilter === 'inactive') {
        products = products.filter((p) => p.is_active === false);
      }

      // Stock filter
      if (stockFilter === 'available') {
        products = products.filter((p) => p.stock > 0);
      } else if (stockFilter === 'low') {
        products = products.filter((p) => p.stock > 0 && p.stock <= p.minimum_stock);
      } else if (stockFilter === 'out_of_stock') {
        products = products.filter((p) => p.stock <= 0);
      }

      const total = products.length;
      const start = (page - 1) * limit;
      const paginated = products.slice(start, start + limit);

      return {
        data: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        error: null,
      };
    }

    try {
      let query = supabase
        .from('products')
        .select('*, categories(id, name)', { count: 'exact' });

      // Search by Name, SKU, or Barcode
      if (cleanSearch) {
        query = query.or(`name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%,barcode.ilike.%${cleanSearch}%`);
      }

      // Category filter
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Status filter
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Stock filter
      if (stockFilter === 'available') {
        query = query.gt('stock', 0);
      } else if (stockFilter === 'out_of_stock') {
        query = query.lte('stock', 0);
      }
      // Note: 'low' stock is handled after query if complex, or via query column comparison

      query = query.order('name', { ascending: true });

      // Pagination range
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      let filteredData = data || [];

      // If stockFilter === 'low', filter locally based on minimum_stock
      if (stockFilter === 'low') {
        filteredData = filteredData.filter((p) => p.stock > 0 && p.stock <= p.minimum_stock);
      }

      return {
        data: filteredData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 1, error };
    }
  },

  // Get single product details
  async getProductById(id) {
    if (!isSupabaseConfigured) {
      const products = getLocalProducts();
      const product = products.find((p) => p.id === id);
      return { data: product || null, error: product ? null : new Error('Produk tidak ditemukan') };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Create Product with validation & stock movement tracking
  async createProduct(productData) {
    // Validations
    if (!productData.name || !productData.name.trim()) {
      return { data: null, error: new Error('Nama produk wajib diisi.') };
    }
    if (!productData.sku || !productData.sku.trim()) {
      return { data: null, error: new Error('SKU produk wajib diisi.') };
    }
    if (productData.cost_price < 0 || isNaN(productData.cost_price)) {
      return { data: null, error: new Error('Harga modal tidak boleh negatif.') };
    }
    if (productData.selling_price < 0 || isNaN(productData.selling_price)) {
      return { data: null, error: new Error('Harga jual tidak boleh negatif.') };
    }
    if (productData.stock < 0 || isNaN(productData.stock)) {
      return { data: null, error: new Error('Stok tidak boleh negatif.') };
    }
    if (productData.minimum_stock < 0 || isNaN(productData.minimum_stock)) {
      return { data: null, error: new Error('Minimum stok tidak boleh negatif.') };
    }

    const cleanSKU = productData.sku.trim().toUpperCase();
    const cleanBarcode = productData.barcode ? productData.barcode.trim() : null;

    if (!isSupabaseConfigured) {
      const products = getLocalProducts();

      // Check duplicates
      const skuExists = products.some((p) => p.sku.toUpperCase() === cleanSKU);
      if (skuExists) {
        return { data: null, error: new Error(`SKU "${cleanSKU}" sudah digunakan oleh produk lain.`) };
      }
      if (cleanBarcode) {
        const barcodeExists = products.some((p) => p.barcode === cleanBarcode);
        if (barcodeExists) {
          return { data: null, error: new Error(`Barcode "${cleanBarcode}" sudah digunakan oleh produk lain.`) };
        }
      }

      const newProd = {
        id: `prod-${Date.now()}`,
        sku: cleanSKU,
        barcode: cleanBarcode,
        name: productData.name.trim(),
        category_id: productData.category_id || null,
        unit: productData.unit || 'PCS',
        cost_price: Number(productData.cost_price) || 0,
        selling_price: Number(productData.selling_price) || 0,
        stock: Number(productData.stock) || 0,
        minimum_stock: Number(productData.minimum_stock) || 5,
        is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [newProd, ...products];
      saveLocalProducts(updated);
      return { data: newProd, error: null };
    }

    try {
      // 1. Insert product
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([
          {
            sku: cleanSKU,
            barcode: cleanBarcode,
            name: productData.name.trim(),
            category_id: productData.category_id || null,
            unit: productData.unit || 'PCS',
            cost_price: Number(productData.cost_price) || 0,
            selling_price: Number(productData.selling_price) || 0,
            stock: Number(productData.stock) || 0,
            minimum_stock: Number(productData.minimum_stock) || 5,
            is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('sku')) {
            throw new Error(`SKU "${cleanSKU}" sudah digunakan produk lain.`);
          }
          if (error.message.includes('barcode')) {
            throw new Error(`Barcode "${cleanBarcode}" sudah digunakan produk lain.`);
          }
        }
        throw error;
      }

      // 2. Track initial stock movement if stock > 0
      if (newProduct && Number(newProduct.stock) > 0) {
        await supabase.from('stock_movements').insert([
          {
            product_id: newProduct.id,
            movement_type: 'ADJUSTMENT',
            quantity: Number(newProduct.stock),
            stock_before: 0,
            stock_after: Number(newProduct.stock),
            notes: 'Stok Awal Master Produk',
          },
        ]);
      }

      return { data: newProduct, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update Product
  async updateProduct(id, productData) {
    if (!productData.name || !productData.name.trim()) {
      return { data: null, error: new Error('Nama produk wajib diisi.') };
    }
    if (!productData.sku || !productData.sku.trim()) {
      return { data: null, error: new Error('SKU produk wajib diisi.') };
    }
    if (productData.cost_price < 0 || isNaN(productData.cost_price)) {
      return { data: null, error: new Error('Harga modal tidak boleh negatif.') };
    }
    if (productData.selling_price < 0 || isNaN(productData.selling_price)) {
      return { data: null, error: new Error('Harga jual tidak boleh negatif.') };
    }
    if (productData.stock < 0 || isNaN(productData.stock)) {
      return { data: null, error: new Error('Stok tidak boleh negatif.') };
    }

    const cleanSKU = productData.sku.trim().toUpperCase();
    const cleanBarcode = productData.barcode ? productData.barcode.trim() : null;

    if (!isSupabaseConfigured) {
      const products = getLocalProducts();
      const existing = products.find((p) => p.id === id);
      if (!existing) return { data: null, error: new Error('Produk tidak ditemukan.') };

      // Duplicate SKU check excluding current id
      const skuConflict = products.some((p) => p.id !== id && p.sku.toUpperCase() === cleanSKU);
      if (skuConflict) return { data: null, error: new Error(`SKU "${cleanSKU}" sudah dipakai.`) };

      const updatedProd = {
        ...existing,
        name: productData.name.trim(),
        sku: cleanSKU,
        barcode: cleanBarcode,
        category_id: productData.category_id || null,
        unit: productData.unit || 'PCS',
        cost_price: Number(productData.cost_price),
        selling_price: Number(productData.selling_price),
        stock: Number(productData.stock),
        minimum_stock: Number(productData.minimum_stock),
        is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : existing.is_active,
        updated_at: new Date().toISOString(),
      };

      const newProducts = products.map((p) => (p.id === id ? updatedProd : p));
      saveLocalProducts(newProducts);
      return { data: updatedProd, error: null };
    }

    try {
      // Fetch latest existing product first to compute stock diff safely
      const { data: oldProduct } = await supabase.from('products').select('*').eq('id', id).single();

      const { data, error } = await supabase
        .from('products')
        .update({
          name: productData.name.trim(),
          sku: cleanSKU,
          barcode: cleanBarcode,
          category_id: productData.category_id || null,
          unit: productData.unit || 'PCS',
          cost_price: Number(productData.cost_price),
          selling_price: Number(productData.selling_price),
          stock: Number(productData.stock),
          minimum_stock: Number(productData.minimum_stock),
          is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('SKU atau Barcode sudah terdaftar pada produk lain.');
        }
        throw error;
      }

      // Record stock movement if stock level changed directly
      if (oldProduct && Number(oldProduct.stock) !== Number(data.stock)) {
        const diff = Number(data.stock) - Number(oldProduct.stock);
        await supabase.from('stock_movements').insert([
          {
            product_id: data.id,
            movement_type: 'ADJUSTMENT',
            quantity: diff,
            stock_before: Number(oldProduct.stock),
            stock_after: Number(data.stock),
            notes: 'Penyesuaian stok dari Edit Produk',
          },
        ]);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Soft delete / Toggle active status
  async toggleProductActive(id, isActive) {
    if (!isSupabaseConfigured) {
      const products = getLocalProducts();
      const updated = products.map((p) => (p.id === id ? { ...p, is_active: isActive } : p));
      saveLocalProducts(updated);
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Bulk CSV Import Processor
  // Format required: Produk;Harga Pokok;Harga Jual;Stok;Grup Produk;Satuan;Barcode;Kode Produk;Non Stok
  async importProductsCSV(rows, categoryMap = {}) {
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // CSV 1-indexed row header offset

      const name = row['Produk'] || row['Nama Produk'] || row['name'];
      const costPrice = parseFloat(row['Harga Pokok'] || row['cost_price'] || 0);
      const sellingPrice = parseFloat(row['Harga Jual'] || row['selling_price'] || 0);
      const stock = parseFloat(row['Stok'] || row['stock'] || 0);
      const categoryName = row['Grup Produk'] || row['Kategori'] || row['category'];
      const unit = row['Satuan'] || row['unit'] || 'PCS';
      const barcode = row['Barcode'] || row['barcode'] || null;
      const sku = row['Kode Produk'] || row['SKU'] || row['sku'] || `SKU-${Date.now()}-${i}`;

      if (!name || !name.trim()) {
        failCount++;
        errors.push({ row: rowNum, message: 'Nama produk kosong' });
        continue;
      }

      const categoryId = categoryName && categoryMap[categoryName.trim().toLowerCase()]
        ? categoryMap[categoryName.trim().toLowerCase()]
        : null;

      const productPayload = {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode ? barcode.trim() : null,
        category_id: categoryId,
        unit: unit.trim().toUpperCase() || 'PCS',
        cost_price: isNaN(costPrice) ? 0 : Math.max(0, costPrice),
        selling_price: isNaN(sellingPrice) ? 0 : Math.max(0, sellingPrice),
        stock: isNaN(stock) ? 0 : Math.max(0, stock),
        minimum_stock: 5,
        is_active: true,
      };

      const { data, error } = await this.createProduct(productPayload);

      if (error) {
        if (error.message?.includes('sudah digunakan') || error.message?.includes('terdaftar')) {
          duplicateCount++;
          errors.push({ row: rowNum, message: `Duplikat: ${error.message}` });
        } else {
          failCount++;
          errors.push({ row: rowNum, message: error.message || 'Gagal menyimpan produk' });
        }
      } else if (data) {
        successCount++;
      }
    }

    return {
      successCount,
      failCount,
      duplicateCount,
      errors,
    };
  },
};
