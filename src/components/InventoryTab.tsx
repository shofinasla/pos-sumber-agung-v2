import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Filter, 
  TrendingUp, 
  DollarSign,
  X,
  Check
} from 'lucide-react';
import { Product } from '../types/pos';
import { PRODUCT_CATEGORIES, UNITS, formatRupiah } from '../utils/formatters';

interface InventoryTabProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestockProduct: (productId: string, addQty: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestockProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedRestockProd, setSelectedRestockProd] = useState<Product | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState<string>('10');

  // Product Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Sembako',
    costPrice: '',
    price: '',
    stock: '',
    minStock: '5',
    unit: 'pcs',
  });

  // Calculate Metrics
  const totalProductsCount = products.length;
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock <= 0).length,
    [products]
  );

  const totalCostValue = useMemo(
    () => products.reduce((acc, p) => acc + p.costPrice * Math.max(0, p.stock), 0),
    [products]
  );

  const totalRetailValue = useMemo(
    () => products.reduce((acc, p) => acc + p.price * Math.max(0, p.stock), 0),
    [products]
  );

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.stock > 0 && p.stock <= p.minStock;
      if (stockFilter === 'out') matchStock = p.stock <= 0;

      return matchCat && matchQuery && matchStock;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      code: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: '',
      category: 'Sembako',
      costPrice: '10000',
      price: '12000',
      stock: '20',
      minStock: '5',
      unit: 'pcs',
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      category: p.category,
      costPrice: p.costPrice.toString(),
      price: p.price.toString(),
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      unit: p.unit,
    });
    setIsProductModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama produk harus diisi!');
      return;
    }

    const payload = {
      code: formData.code.trim() || `899${Date.now().toString().slice(-9)}`,
      name: formData.name.trim(),
      category: formData.category,
      costPrice: Number(formData.costPrice) || 0,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
      unit: formData.unit,
    };

    if (editingProduct) {
      onUpdateProduct({ ...payload, id: editingProduct.id });
    } else {
      onAddProduct(payload);
    }

    setIsProductModalOpen(false);
  };

  // Open Restock
  const handleOpenRestock = (p: Product) => {
    setSelectedRestockProd(p);
    setRestockQtyInput('10');
    setIsRestockModalOpen(true);
  };

  // Process Restock
  const handleConfirmRestock = () => {
    if (!selectedRestockProd) return;
    const addQty = Number(restockQtyInput) || 0;
    if (addQty > 0) {
      onRestockProduct(selectedRestockProd.id, addQty);
    }
    setIsRestockModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Jenis Produk</p>
            <h3 className="text-xl font-bold text-slate-900">{totalProductsCount} Item</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Stok Menipis / Habis</p>
            <h3 className="text-xl font-bold text-slate-900">
              {lowStockCount + outOfStockCount} <span className="text-xs font-normal text-slate-500">Item</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Aset Stok (Harga Beli)</p>
            <h3 className="text-lg font-bold text-slate-900">{formatRupiah(totalCostValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Nilai Jual Stok (Omset)</p>
            <h3 className="text-lg font-bold text-slate-900">{formatRupiah(totalRetailValue)}</h3>
          </div>
        </div>

      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau barcode produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Right Action: Add Product Button */}
          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>

        {/* Categories & Stock Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stock Filter Buttons */}
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                stockFilter === 'all'
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Semua Stok
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                stockFilter === 'low'
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Stok Menipis ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                stockFilter === 'out'
                  ? 'bg-rose-100 text-rose-800 font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Stok Habis ({outOfStockCount})
            </button>
          </div>

        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Barcode / Kode</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Beli</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Stok Saat Ini</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data produk yang cocok.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {p.code}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.name}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                        {formatRupiah(p.costPrice)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold font-mono text-emerald-600">
                        {formatRupiah(p.price)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Habis (0)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            {p.stock} {p.unit} (Menipis)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {p.stock} {p.unit}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenRestock(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Restock / Tambah Stok"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Produk"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Indomie Goreng Spesial 85g"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barcode / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="8991234567890"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Beli / Modal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Stok Minimal
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="pt-4 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && selectedRestockProd && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Restock / Tambah Stok</h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">{selectedRestockProd.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stok saat ini: <strong>{selectedRestockProd.stock} {selectedRestockProd.unit}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Stok yang Ditambahkan ({selectedRestockProd.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQtyInput}
                  onChange={(e) => setRestockQtyInput(e.target.value)}
                  className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestock}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
                >
                  Tambah Stok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
