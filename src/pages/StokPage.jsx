import { useState, useEffect, useCallback } from 'react';
import { Boxes, AlertTriangle, XCircle, DollarSign, RefreshCw, Plus, Filter, ArrowUpRight, ArrowDownLeft, Sliders, PackageCheck, Search } from 'lucide-react';
import { stockService } from '../services/stockService';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';

export const StokPage = () => {
  const [overview, setOverview] = useState({ totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 });
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustType, setAdjustType] = useState('IN'); // 'IN' (Tambah) or 'OUT' (Kurang) or 'DAMAGE'
  const [adjustQuantity, setAdjustQuantity] = useState(1);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ovRes, movRes] = await Promise.all([
      stockService.getStockOverview(),
      stockService.getStockMovements({ search, type: typeFilter }),
    ]);

    if (ovRes.data) setOverview(ovRes.data);
    if (movRes.data) setMovements(movRes.data);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    let isMounted = true;
    const load = async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      const [ovRes, movRes] = await Promise.all([
        stockService.getStockOverview(),
        stockService.getStockMovements({ search, type: typeFilter }),
      ]);
      if (isMounted) {
        if (ovRes.data) setOverview(ovRes.data);
        if (movRes.data) setMovements(movRes.data);
        setLoading(false);
      }
    };
    load(true);

    const handleUpdate = () => {
      if (isMounted) load(false);
    };

    window.addEventListener('pos_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('pos_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [search, typeFilter]);

  const handleOpenAdjustModal = async () => {
    const res = await productService.getProducts({ limit: 200, status: 'active' });
    if (res.data) setProductsList(res.data);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Pilih produk material terlebih dahulu.', 'error');
      return;
    }

    setSubmitting(true);
    let delta = Number(adjustQuantity);
    let movType;

    if (adjustType === 'OUT') {
      delta = -Math.abs(delta);
      movType = 'ADJUSTMENT';
    } else if (adjustType === 'DAMAGE') {
      delta = -Math.abs(delta);
      movType = 'DAMAGE';
    } else {
      delta = Math.abs(delta);
      movType = 'ADJUSTMENT';
    }

    const res = await stockService.adjustStock({
      productId: selectedProductId,
      delta,
      movementType: movType,
      notes: adjustNotes || 'Penyesuaian stok fisik manual',
    });

    setSubmitting(false);
    if (res.error) {
      showToast(res.error.message || 'Gagal menyesuaikan stok.', 'error');
    } else {
      showToast('Stok produk berhasil diperbarui.');
      setIsAdjustModalOpen(false);
      setSelectedProductId('');
      setAdjustQuantity(1);
      setAdjustNotes('');
      loadData();
    }
  };

  const getMovementBadge = (type, qty) => {
    if (type === 'SALE') {
      return (
        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
          <ArrowDownLeft className="w-3 h-3" /> Penjualan ({qty})
        </span>
      );
    }
    if (type === 'PURCHASE') {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" /> Restok Kulakan (+{qty})
        </span>
      );
    }
    if (type === 'DAMAGE') {
      return (
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Barang Rusak ({qty})
        </span>
      );
    }
    if (qty > 0) {
      return (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
          <Sliders className="w-3 h-3" /> Penyesuaian (+{qty})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
        <Sliders className="w-3 h-3" /> Penyesuaian ({qty})
      </span>
    );
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

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-600" />
            Stok & Histori Pergerakan Barang
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring ketersediaan stok material, opname fisik, barang rusak, dan histori pergerakan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdjustModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-amber-600/20 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Penyesuaian Stok</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total SKU Produk</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{overview.totalProducts} Item</h3>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Stok Menipis (&le; Min)</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{overview.lowStock} Item</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Stok Habis (= 0)</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{overview.outOfStock} Item</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Nilai Inventaris (Modal)</p>
            <h3 className="text-lg font-bold text-emerald-700 mt-1 font-mono">{formatCurrency(overview.totalValue)}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Movement History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk / catatan..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Tipe:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Semua Pergerakan</option>
                <option value="SALE">Penjualan (SALE)</option>
                <option value="PURCHASE">Kulakan Restok (PURCHASE)</option>
                <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
                <option value="DAMAGE">Barang Rusak (DAMAGE)</option>
              </select>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Total: {movements.length} Catatan</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            <div className="h-6 bg-slate-100 rounded-lg w-1/3" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold">Belum Ada Riwayat Pergerakan Stok</p>
            <p className="text-[11px] text-slate-400">Setiap transaksi kasir atau restok akan otomatis tercatat di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Produk Material</th>
                  <th className="py-3 px-4">Tipe Pergerakan</th>
                  <th className="py-3 px-4 text-center">Sebelum</th>
                  <th className="py-3 px-4 text-center">Perubahan</th>
                  <th className="py-3 px-4 text-center">Sesudah</th>
                  <th className="py-3 px-4">Catatan / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.product_name}
                      {m.sku && <span className="block text-[10px] text-slate-400 font-mono font-normal">SKU: {m.sku}</span>}
                    </td>
                    <td className="py-3 px-4">{getMovementBadge(m.movement_type, m.quantity)}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">{m.stock_before} {m.unit}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{m.stock_after} {m.unit}</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Penyesuaian Stok */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                Penyesuaian Stok Material (Opname)
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Produk Material</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Pilih Produk --</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Perubahan</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="IN">+ Tambah Stok (Restok/Bonus)</option>
                    <option value="OUT">- Kurangi Stok (Selisih Opname)</option>
                    <option value="DAMAGE">⚠️ Barang Rusak / Pecah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Unit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Alasan Opname</label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Semen sak bocor pas pengiriman, opname bulanan..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center space-x-1.5"
                >
                  {submitting ? 'Selesai...' : 'Simpan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
