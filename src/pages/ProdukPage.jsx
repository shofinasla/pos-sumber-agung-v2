import { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Upload,
  RefreshCw,
  AlertCircle,
  Power,
  Edit2,
  Filter,
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductImportModal } from '../components/products/ProductImportModal';
import { ProductCardMobile } from '../components/products/ProductCardMobile';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Pagination } from '../components/common/Pagination';

export function ProdukPage() {
  const {
    products,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    search,
    categoryId,
    statusFilter,
    stockFilter,
    setPage,
    setSearch,
    setCategoryId,
    setStatusFilter,
    setStockFilter,
    refreshProducts,
  } = useProducts();

  const { categories } = useCategories();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isImportOpen, setIsImportOpen] = useState(false);

  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [productToToggle, setProductToToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    let res;
    if (selectedProduct) {
      res = await productService.updateProduct(selectedProduct.id, formData);
    } else {
      res = await productService.createProduct(formData);
    }

    if (res.error) {
      return { error: res.error };
    }

    showToast(
      selectedProduct
        ? 'Data produk berhasil diperbarui.'
        : 'Produk material baru berhasil ditambahkan.'
    );
    refreshProducts();
    return { error: null };
  };

  const handleConfirmToggleActive = (product) => {
    setProductToToggle(product);
    setIsToggleModalOpen(true);
  };

  const executeToggleActive = async () => {
    if (!productToToggle) return;
    setToggleLoading(true);

    const newStatus = !productToToggle.is_active;
    const { error: err } = await productService.toggleProductActive(
      productToToggle.id,
      newStatus
    );

    setToggleLoading(false);
    setIsToggleModalOpen(false);

    if (err) {
      showToast(err.message || 'Gagal mengubah status produk.', 'error');
    } else {
      showToast(
        newStatus ? 'Produk berhasil diaktifkan.' : 'Produk telah dinonaktifkan.'
      );
      refreshProducts();
    }
  };

  const handleCSVImportExecute = async (parsedRows, categoryMap) => {
    const summary = await productService.importProductsCSV(parsedRows, categoryMap);
    refreshProducts();
    return summary;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center space-x-2 animate-bounce ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Master Data Produk & Material
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Katalog stok material bangunan TB. Sumber Agung untuk penjualan kasir POS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk, SKU, atau scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            {/* Filter Category */}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Sajaa</option>
              <option value="inactive">Non-Aktif</option>
            </select>

            {/* Filter Stock */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Stok</option>
              <option value="available">Stok Tersedia (&gt; 0)</option>
              <option value="low">Stok Menipis (&lt;= Min)</option>
              <option value="out_of_stock">Stok Habis (= 0)</option>
            </select>
          </div>

          <button
            onClick={refreshProducts}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshProducts}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 font-bold rounded-lg text-[11px]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded-lg w-1/4" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Produk Material</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || categoryId || statusFilter !== 'all' || stockFilter !== 'all'
              ? 'Tidak ada produk yang memenuhi kriteria pencarian dan filter.'
              : 'Mulai dengan menambahkan produk pertama atau mengimport dari file CSV.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
            >
              + Tambah Produk Pertama
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Nama Produk / Material</th>
                    <th className="py-3.5 px-4">SKU / Barcode</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Stok Toko</th>
                    <th className="py-3.5 px-4">Harga Modal</th>
                    <th className="py-3.5 px-4">Harga Jual</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const isLow = product.stock > 0 && product.stock <= product.minimum_stock;
                    const isOut = product.stock <= 0;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {product.name}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          <div className="font-bold text-slate-800">{product.sku}</div>
                          <div className="text-[10px] text-slate-400">
                            {product.barcode ? `Barcode: ${product.barcode}` : '-'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[10px]">
                            {product.categories?.name || 'Umum'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span
                            className={`font-bold ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {product.stock} {product.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Min: {product.minimum_stock}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600">
                          {formatCurrency(product.cost_price)}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {formatCurrency(product.selling_price)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              product.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {product.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleConfirmToggleActive(product)}
                              title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              className={`p-1.5 rounded-lg transition ${
                                product.is_active
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(product)}
                              title="Edit Produk"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {products.map((product) => (
              <ProductCardMobile
                key={product.id}
                product={product}
                onEdit={handleOpenEdit}
                onToggleActive={handleConfirmToggleActive}
              />
            ))}

            <div className="bg-white p-2 rounded-2xl border border-slate-200">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>
        </>
      )}

      {/* Product Add/Edit Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        categories={categories}
        productToEdit={selectedProduct}
      />

      {/* CSV Import Modal */}
      <ProductImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleCSVImportExecute}
        categories={categories}
      />

      {/* Toggle Active Confirm Modal */}
      <ConfirmModal
        isOpen={isToggleModalOpen}
        onClose={() => setIsToggleModalOpen(false)}
        onConfirm={executeToggleActive}
        title={
          productToToggle?.is_active ? 'Nonaktifkan Produk' : 'Aktifkan Produk'
        }
        message={`Apakah Anda yakin ingin ${
          productToToggle?.is_active ? 'menonaktifkan' : 'mengaktifkan'
        } produk "${productToToggle?.name}"? Produk non-aktif tidak akan muncul di kasir POS.`}
        confirmText={
          productToToggle?.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'
        }
        isDanger={productToToggle?.is_active}
        loading={toggleLoading}
      />
    </div>
  );
}
