import { useState, useEffect, useRef, useCallback } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import { BarcodeScanner } from './BarcodeScanner';
import { productService } from '../../services/productService';
import {
  Search,
  ScanBarcode,
  Camera,
  Package,
} from 'lucide-react';

export const ProductSearch = () => {
  const { addToCart, showToast } = useCart();
  const searchInputRef = useRef(null);

  // Filter Categories
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState('');

  // Products hook
  const {
    products,
    loading,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
  } = useProducts({
    initialLimit: 12,
    initialStatusFilter: 'active',
  });

  // State untuk Camera Modal
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Auto focus search input pada mount atau shortcut keyboard (F2)
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Memproses pencarian barcode secara langsung (USB Scanner) saat Enter ditekan
  const handleKeyDownInput = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const term = search.trim();
      if (!term) return;

      // Cari persis barcode atau SKU
      const { data } = await productService.getProducts({
        search: term,
        statusFilter: 'active',
        limit: 10,
      });

      if (data && data.length > 0) {
        // Cari match persis barcode atau SKU dulu
        const exactMatch = data.find(
          (p) =>
            p.barcode?.toLowerCase() === term.toLowerCase() ||
            p.sku?.toLowerCase() === term.toLowerCase()
        );

        const targetProduct = exactMatch || data[0];

        const added = addToCart(targetProduct, 1);
        if (added) {
          setSearch(''); // Clear input untuk scan berikutnya
        }
      } else {
        showToast('Produk dengan barcode/SKU tersebut tidak ditemukan.', 'error');
      }
    }
  };

  // Callback saat kamera mendeteksi barcode
  const handleCameraDetected = useCallback(
    async (barcode) => {
      const term = (barcode || '').trim();
      if (!term) return;

      const { data } = await productService.getProducts({
        search: term,
        statusFilter: 'active',
        limit: 10,
      });

      if (data && data.length > 0) {
        const exactMatch = data.find(
          (p) =>
            p.barcode?.toLowerCase() === term.toLowerCase() ||
            p.sku?.toLowerCase() === term.toLowerCase()
        );
        const target = exactMatch || data[0];
        addToCart(target, 1);
      } else {
        showToast(`Produk dengan barcode "${term}" belum terdaftar di toko.`, 'error');
      }
    },
    [addToCart, showToast]
  );

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Header Search & Scanner Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Input Cari Barcode / SKU / Nama */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDownInput}
              placeholder="Cari nama, SKU, atau scan barcode... (F2)"
              className="w-full pl-11 pr-11 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-200 hover:bg-slate-300 rounded-full w-6 h-6 flex items-center justify-center touch-manipulation"
              >
                ✕
              </button>
            ) : (
              <ScanBarcode className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            )}
          </div>

          {/* Tombol Camera Scanner */}
          <button
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-sm sm:text-sm transition-all shadow-xs shrink-0 touch-manipulation"
            title="Scan Barcode Menggunakan Kamera Hp/Laptop"
          >
            <Camera className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>Scan Kamera</span>
          </button>
        </div>

        {/* Filter Chips Kategori Material */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-2 rounded-xl font-bold shrink-0 transition-colors touch-manipulation ${
              selectedCategory === ''
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
              className={`px-3.5 py-2 rounded-xl font-bold shrink-0 transition-colors touch-manipulation ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Katalog Produk */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-40 bg-slate-100 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-bold text-base">
              Tidak ada produk yang sesuai.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Coba ubah kata kunci pencarian atau pilih kategori lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {products
              .filter((p) => !selectedCategory || p.category_id === selectedCategory)
              .map((product) => {
                const stock = Number(product.stock) || 0;
                const isOut = stock <= 0;
                const isLow = stock > 0 && stock <= (Number(product.minimum_stock) || 5);

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product, 1)}
                    disabled={isOut}
                    className={`group text-left bg-white p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[148px] h-auto sm:h-38 ${
                      isOut
                        ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Category & Badge Stok */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase truncate max-w-[85px]">
                          {product.category?.name || 'Material'}
                        </span>
                        <span
                          className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Habis' : `Stok: ${stock} ${product.unit || 'PCS'}`}
                        </span>
                      </div>

                      {/* Nama Produk */}
                      <h4 className="font-bold text-slate-900 text-sm sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700">
                        {product.name}
                      </h4>
                    </div>

                    {/* Footer Card: SKU & Harga */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] sm:text-xs text-slate-500 font-mono">
                        {product.sku || '-'}
                      </div>
                      <div className="font-black text-emerald-600 text-sm sm:text-base">
                        {formatCurrency(product.selling_price)}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Pagination ringkas jika halaman > 1 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm">
          <span className="text-slate-500">
            Halaman <span className="font-bold text-slate-800">{page}</span> dari {totalPages}
          </span>
          <div className="space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
            >
              Sebelumna
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-semibold"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Modal Scanner Kamera */}
      <BarcodeScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleCameraDetected}
      />
    </div>
  );
};
