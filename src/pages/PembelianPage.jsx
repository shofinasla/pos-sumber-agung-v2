import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  FileText,
  DollarSign,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import { Modal } from '../components/common/Modal';

export const PembelianPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New Purchase Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([
    { productId: '', productName: '', quantity: 1, unitCost: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [detailPurchase, setDetailPurchase] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [purRes, supRes, prodRes] = await Promise.all([
      purchaseService.getPurchases({ search }),
      supplierService.getSuppliers(),
      productService.getProducts(''),
    ]);
    setPurchases(purRes.data || []);
    setSuppliers(supRes.data || []);
    setProducts(prodRes.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [purRes, supRes, prodRes] = await Promise.all([
        purchaseService.getPurchases({ search }),
        supplierService.getSuppliers(),
        productService.getProducts(''),
      ]);
      if (isMounted) {
        setPurchases(purRes.data || []);
        setSuppliers(supRes.data || []);
        setProducts(prodRes.data || []);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [search]);

  const handleOpenCreateModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setPurchaseNumber(`PO-${Date.now().toString().slice(-6)}`);
    setPaymentStatus('PAID');
    setDueDate('');
    setItems([{ productId: products[0]?.id || '', productName: products[0]?.name || '', quantity: 1, unitCost: products[0]?.cost_price || 0 }]);
    setIsCreateModalOpen(true);
  };

  const handleProductChange = (index, prodId) => {
    const prod = products.find((p) => p.id === prodId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prodId,
      productName: prod ? prod.name : '',
      unitCost: prod ? (prod.cost_price || 0) : 0,
    };
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const firstProd = products[0];
    setItems([
      ...items,
      {
        productId: firstProd?.id || '',
        productName: firstProd?.name || '',
        quantity: 1,
        unitCost: firstProd?.cost_price || 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0);
  };

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (items.some((it) => !it.productId || Number(it.quantity) <= 0)) {
      alert('Pilih produk dan pastikan jumlah stok lebih dari 0.');
      return;
    }

    setSubmitting(true);
    const supObj = suppliers.find((s) => s.id === selectedSupplierId);

    const payload = {
      supplierId: selectedSupplierId || null,
      supplierName: supObj ? supObj.name : 'Supplier Umum',
      purchaseNumber,
      paymentStatus,
      dueDate: paymentStatus === 'UNPAID' ? dueDate : null,
      items,
    };

    const { error } = await purchaseService.createPurchase(payload);
    setSubmitting(false);

    if (error) {
      alert('Gagal mencatat pembelian: ' + (error.message || 'Error tidak diketahui'));
    } else {
      setIsCreateModalOpen(false);
      fetchData();
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-sky-600" />
            Pembelian & Kulakan Stok
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan faktur masuk dari supplier, penambahan stok barang, dan pembaruan HPP modal.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-2xl transition shadow-xs text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Faktur Pembelian
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Faktur Kulakan</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{purchases.length} Transaksi</h3>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Pengeluaran Kulakan</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {formatRupiah(purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0))}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Kulakan Belum Lunas (Hutang)</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {purchases.filter((p) => p.payment_status === 'UNPAID').length} Faktur
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. Faktur / Supplier..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat riwayat pembelian...</div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">Belum ada transaksi pembelian</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik "Tambah Faktur Pembelian" di atas untuk mencatat barang masuk dari supplier.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">No. Faktur</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Total Pembelian</th>
                  <th className="px-6 py-4">Status Pembayaran</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      {pur.purchase_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">{pur.supplier_name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(pur.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatRupiah(pur.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      {pur.payment_status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200/60">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Hutang Tagihan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDetailPurchase(pur)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-medium text-xs rounded-xl transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Input Faktur Pembelian Supplier (Kulakan)"
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Distributor / Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="">-- Pilih Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Faktur / PO *
              </label>
              <input
                type="text"
                required
                value={purchaseNumber}
                onChange={(e) => setPurchaseNumber(e.target.value)}
                placeholder="PO-2026-001"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pembayaran *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="PAID">Lunas (Tunai / Transfer Direct)</option>
                <option value="UNPAID">Hutang (Tempo Tagihan Supplier)</option>
              </select>
            </div>

            {paymentStatus === 'UNPAID' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Jatuh Tempo Pembayaran
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Item Material Kulakan
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Barang
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5 sm:hidden">
                      Produk
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg text-xs border border-slate-200 focus:outline-none"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock} {p.unit || 'pcs'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5 sm:hidden">
                      Jumlah Kulakan
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg text-xs border border-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5 sm:hidden">
                      Harga Beli / Unit (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, 'unitCost', Number(e.target.value))}
                      placeholder="Harga Modal"
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg text-xs border border-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total display */}
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-900">Total Nilai Pembelian:</span>
            <span className="text-lg font-extrabold text-sky-700">
              {formatRupiah(calculateTotal())}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Memproses Kulakan...' : 'Simpan & Tambah Stok'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Purchase Modal */}
      <Modal
        isOpen={Boolean(detailPurchase)}
        onClose={() => setDetailPurchase(null)}
        title={`Detail Faktur: ${detailPurchase?.purchase_number}`}
      >
        {detailPurchase && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Supplier:</span>
                <p className="font-bold text-slate-900 mt-0.5">{detailPurchase.supplier_name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Tanggal Masuk:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {new Date(detailPurchase.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Status Pembayaran:</span>
                <p className="font-bold text-slate-900 mt-0.5">{detailPurchase.payment_status}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Total Faktur:</span>
                <p className="font-bold text-sky-600 text-sm mt-0.5">
                  {formatRupiah(detailPurchase.total_amount)}
                </p>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Item Material Yang Dibeli
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Material</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3 text-right">Harga Modal</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(detailPurchase.purchase_items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-900">
                        {item.product?.name || item.product_name || 'Material'}
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">{formatRupiah(item.unit_cost)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setDetailPurchase(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PembelianPage;
