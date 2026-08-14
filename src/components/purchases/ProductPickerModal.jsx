import { useState, useMemo } from 'react';
import {
  Search,
  Check,
  Plus,
  AlertTriangle,
  Package,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatRupiah } from '../../utils/formatters';

export const ProductPickerModal = ({
  isOpen,
  onClose,
  products = [],
  categories = [],
  alreadySelectedIds = [],
  onSelectProduct,
  onSelectMultipleProducts,
  onOpenQuickCreateProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'low_stock'
  const [tempSelectedMap, setTempSelectedMap] = useState({}); // { [productId]: { quantity: 10, unitCost: 50000 } }

  const alreadySelectedSet = useMemo(() => new Set(alreadySelectedIds), [alreadySelectedIds]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode) return false;
      }

      // Category
      if (selectedCategory !== 'ALL') {
        const catId = p.category_id || p.categories?.id;
        const catName = p.categories?.name || p.category?.name || '';
        if (catId !== selectedCategory && catName !== selectedCategory) {
          return false;
        }
      }

      // Filter Low Stock
      if (filterMode === 'low_stock') {
        const isLow = Number(p.stock || 0) <= Number(p.minimum_stock || 5);
        if (!isLow) return false;
      }

      return true;
    });
  }, [products, search, selectedCategory, filterMode]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => Number(p.stock || 0) <= Number(p.minimum_stock || 5)).length;
  }, [products]);

  const toggleProductSelection = (product) => {
    setTempSelectedMap((prev) => {
      const copy = { ...prev };
      if (copy[product.id]) {
        delete copy[product.id];
      } else {
        copy[product.id] = {
          product,
          quantity: Math.max(1, (product.minimum_stock || 10) * 2 - Number(product.stock || 0)),
          unitCost: product.cost_price || 0,
        };
      }
      return copy;
    });
  };

  const handleSelectAllFiltered = () => {
    const newMap = { ...tempSelectedMap };
    filteredProducts.forEach((p) => {
      if (!alreadySelectedSet.has(p.id)) {
        newMap[p.id] = {
          product: p,
          quantity: Math.max(1, (p.minimum_stock || 10) * 2 - Number(p.stock || 0)),
          unitCost: p.cost_price || 0,
        };
      }
    });
    setTempSelectedMap(newMap);
  };

  const handleClearSelected = () => {
    setTempSelectedMap({});
  };

  const handleConfirmBatchAdd = () => {
    const selectedItems = Object.values(tempSelectedMap);
    if (selectedItems.length > 0 && onSelectMultipleProducts) {
      onSelectMultipleProducts(selectedItems);
    }
    setTempSelectedMap({});
    onClose();
  };

  const handleSingleAdd = (product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    onClose();
  };

  const tempSelectedCount = Object.keys(tempSelectedMap).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Katalog Lengkap Material (Pilih Produk Kulakan)"
      size="xl"
    >
      <div className="space-y-4">
        {/* Top Controls: Search Bar & Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama material, SKU, barcode (contoh: Semen, Besi, Cat, Pipa)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenQuickCreateProduct && onOpenQuickCreateProduct()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              + Produk Baru
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setFilterMode('all');
            }}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              selectedCategory === 'ALL' && filterMode === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode(filterMode === 'low_stock' ? 'all' : 'low_stock')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition ${
              filterMode === 'low_stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Stok Kritis / Menipis ({lowStockCount})
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setFilterMode('all');
              }}
              className={`px-2.5 py-1.5 rounded-xl transition ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Quick Batch Actions Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="inline-flex items-center gap-1.5 font-semibold text-sky-700 hover:text-sky-800"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Pilih Semua Yang Tampil ({filteredProducts.length})
            </button>
            {tempSelectedCount > 0 && (
              <button
                type="button"
                onClick={handleClearSelected}
                className="font-medium text-slate-500 hover:text-rose-600"
              >
                Reset Pilihan ({tempSelectedCount})
              </button>
            )}
          </div>
          <span className="text-slate-500 font-medium">
            Ditemukan <strong className="text-slate-800">{filteredProducts.length}</strong> produk
          </span>
        </div>

        {/* Products List Table / Grid */}
        <div className="max-h-[360px] overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada produk yang cocok</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Coba ubah kata kunci pencarian atau klik "+ Produk Baru" untuk menambahkan material baru ke database.
              </p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isAlreadyInPurchase = alreadySelectedSet.has(p.id);
              const isTempSelected = Boolean(tempSelectedMap[p.id]);
              const isLowStock = Number(p.stock || 0) <= Number(p.minimum_stock || 5);
              const catName = p.categories?.name || p.category?.name || 'Material Umum';

              return (
                <div
                  key={p.id}
                  onClick={() => !isAlreadyInPurchase && toggleProductSelection(p)}
                  className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition cursor-pointer ${
                    isTempSelected
                      ? 'bg-sky-50/80 border-l-4 border-l-sky-600'
                      : isAlreadyInPurchase
                      ? 'bg-slate-50/60 opacity-60 cursor-not-allowed'
                      : 'hover:bg-slate-50/90'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      disabled={isAlreadyInPurchase}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProductSelection(p);
                      }}
                      className="text-slate-400 hover:text-sky-600 disabled:opacity-40"
                    >
                      {isTempSelected ? (
                        <CheckSquare className="w-5 h-5 text-sky-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 truncate">{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
                          {p.sku}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded font-medium">
                          {catName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold">
                          Stok Saat Ini:
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              Number(p.stock || 0) === 0
                                ? 'bg-rose-100 text-rose-800'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stock} {p.unit || 'PCS'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          Modal Terakhir:{' '}
                          <strong className="text-slate-700">
                            {formatRupiah(p.cost_price || 0)}
                          </strong>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">
                          Jual: {formatRupiah(p.selling_price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAlreadyInPurchase ? (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Sudah di Faktur
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleAdd(p);
                        }}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
                      >
                        + Pilih
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-600">
            {tempSelectedCount > 0 ? (
              <span className="font-semibold text-sky-700">
                ✓ {tempSelectedCount} material dipilih siap dimasukkan
              </span>
            ) : (
              <span className="text-slate-400">
                Pilih checkbox untuk multi-item atau klik tombol "+ Pilih"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Tutup
            </button>
            {tempSelectedCount > 0 && (
              <button
                type="button"
                onClick={handleConfirmBatchAdd}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Masukkan ({tempSelectedCount}) Item ke Faktur
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
