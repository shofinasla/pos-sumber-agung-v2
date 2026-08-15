import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Sparkles,
  Printer,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { Modal } from '../components/common/Modal';
import { ProductPickerModal } from '../components/purchases/ProductPickerModal';
import { QuickProductModal } from '../components/purchases/QuickProductModal';
import { formatRupiah, formatDate } from '../utils/formatters';

export const PembelianPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('ALL'); // 'ALL', 'PAID', 'UNPAID'
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Create Purchase Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Sub-Modals for Product Selection & Quick Create
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [activeRowIndexToPick, setActiveRowIndexToPick] = useState(null);

  // Detail Modal State
  const [detailPurchase, setDetailPurchase] = useState(null);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setIsSyncing(true);

    try {
      const [purRes, supRes, prodRes, catRes] = await Promise.all([
        purchaseService.getPurchases({ search }),
        supplierService.getSuppliers(),
        productService.getProducts({ limit: 1000, statusFilter: 'all' }),
        categoryService.getCategories(),
      ]);

      setPurchases(purRes.data || []);
      setSuppliers(supRes.data || []);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.warn('Error fetching purchase data:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      await fetchData(true);
    };
    loadInitial();

    // Subscribe to Realtime Supabase changes across all accounts & devices
    const unsubscribe = purchaseService.subscribePurchases((payload) => {
      if (!isMounted) return;

      // When a new purchase was added by another user / account in Supabase
      if (payload?.table === 'purchases' && payload?.eventType === 'INSERT') {
        const newNo = payload.new?.purchase_number || 'Baru';
        showToast(`⚡ Faktur #${newNo} baru saja masuk dari akun lain & tersimpan di Supabase!`, 'success');
      }

      // Background silent sync
      fetchData(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchData]);

  // Low stock products calculation for one-click restock
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => Number(p.stock || 0) <= Number(p.minimum_stock || 5));
  }, [products]);

  const handleOpenCreateModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setPurchaseNumber(`PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentStatus('PAID');
    setDueDate('');

    if (products.length > 0) {
      const first = products[0];
      setItems([
        {
          productId: first.id,
          productName: first.name,
          sku: first.sku,
          unit: first.unit || 'PCS',
          currentStock: Number(first.stock || 0),
          sellingPrice: Number(first.selling_price || 0),
          quantity: 10,
          unitCost: Number(first.cost_price || 0),
        },
      ]);
    } else {
      setItems([]);
    }

    setIsCreateModalOpen(true);
  };

  // Open product picker for specific row or general add
  const handleOpenProductPicker = (rowIndex = null) => {
    setActiveRowIndexToPick(rowIndex);
    setIsPickerOpen(true);
  };

  // When a product is selected from Picker
  const handleProductSelectedFromPicker = (product) => {
    if (activeRowIndexToPick !== null && items[activeRowIndexToPick]) {
      // Replace existing row
      const newItems = [...items];
      newItems[activeRowIndexToPick] = {
        ...newItems[activeRowIndexToPick],
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit || 'PCS',
        currentStock: Number(product.stock || 0),
        sellingPrice: Number(product.selling_price || 0),
        unitCost: Number(product.cost_price || 0),
      };
      setItems(newItems);
    } else {
      // Append new row
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unit: product.unit || 'PCS',
          currentStock: Number(product.stock || 0),
          sellingPrice: Number(product.selling_price || 0),
          quantity: 10,
          unitCost: Number(product.cost_price || 0),
        },
      ]);
    }
  };

  // When multiple products are selected at once from Picker
  const handleMultipleProductsSelected = (selectedList) => {
    const newRows = selectedList.map(({ product, quantity, unitCost }) => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit || 'PCS',
      currentStock: Number(product.stock || 0),
      sellingPrice: Number(product.selling_price || 0),
      quantity: quantity || 10,
      unitCost: unitCost || product.cost_price || 0,
    }));

    // Filter out duplicate productIds already in items
    const existingIds = new Set(items.map((it) => it.productId));
    const nonDuplicates = newRows.filter((row) => !existingIds.has(row.productId));

    setItems((prev) => [...prev, ...nonDuplicates]);
  };

  // One-click add all low stock items
  const handleAutoPopulateLowStock = () => {
    if (lowStockProducts.length === 0) {
      alert('Semua stok material dalam kondisi aman! Tidak ada stok kritis saat ini.');
      return;
    }

    const restockItems = lowStockProducts.map((p) => {
      const neededQty = Math.max(10, (p.minimum_stock || 10) * 2 - Number(p.stock || 0));
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unit: p.unit || 'PCS',
        currentStock: Number(p.stock || 0),
        sellingPrice: Number(p.selling_price || 0),
        quantity: neededQty,
        unitCost: Number(p.cost_price || 0),
      };
    });

    setItems(restockItems);
  };

  // When a newly created product is saved
  const handleProductCreatedQuickly = (newProd) => {
    setProducts((prev) => [newProd, ...prev]);
    setItems((prev) => [
      ...prev,
      {
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        unit: newProd.unit || 'PCS',
        currentStock: 0,
        sellingPrice: Number(newProd.selling_price || 0),
        quantity: 10,
        unitCost: Number(newProd.cost_price || 0),
      },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      setItems([
        {
          productId: '',
          productName: '',
          sku: '',
          unit: 'PCS',
          currentStock: 0,
          sellingPrice: 0,
          quantity: 1,
          unitCost: 0,
        },
      ]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0);
  };

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();

    const validItems = items.filter((it) => it.productId && Number(it.quantity) > 0);

    if (validItems.length === 0) {
      showToast('Pilih minimal 1 material/produk dan pastikan jumlah kulakan lebih dari 0.', 'error');
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
      items: validItems,
    };

    const { error } = await purchaseService.createPurchase(payload);
    setSubmitting(false);

    if (error) {
      showToast('Gagal mencatat pembelian: ' + (error.message || 'Error tidak diketahui'), 'error');
    } else {
      setIsCreateModalOpen(false);
      showToast(`✅ Faktur ${purchaseNumber} berhasil disimpan ke Supabase & tersinkron ke semua akun.`);
      fetchData(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (filterPayment !== 'ALL' && p.payment_status !== filterPayment) return false;
      return true;
    });
  }, [purchases, filterPayment]);

  const totalExpenditure = useMemo(() => {
    return purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);
  }, [purchases]);

  const unpaidPurchases = useMemo(() => {
    return purchases.filter((p) => p.payment_status === 'UNPAID');
  }, [purchases]);

  return (
    <div className="space-y-6">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShoppingCart className="w-7 h-7 text-sky-600" />
              Pembelian & Kulakan Stok
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Realtime Cloud Supabase</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Faktur masuk dari distributor, kulakan barang toko bangunan, otomatis sinkron antar akun & update stok secara realtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-2xl transition text-sm shadow-2xs"
            title="Segarkan data faktur & stok dari Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-sky-600 ${loading || isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Menyinkron...' : 'Sinkron'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-2xl transition shadow-xs text-sm"
          >
            <Plus className="w-4 h-4" />
            + Input Faktur Kulakan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Faktur Pembelian</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{purchases.length} Transaksi</h3>
            <span className="text-[11px] text-slate-400 font-medium">Dari seluruh distributor rekanan</span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Pengeluaran Kulakan</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {formatRupiah(totalExpenditure)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Akumulasi modal belanja material</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Faktur Belum Lunas (Tempo)</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {unpaidPurchases.length} Faktur
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Total Hutang: {formatRupiah(unpaidPurchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0))}
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Faktur / Supplier..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterPayment('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterPayment === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterPayment('PAID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterPayment === 'PAID'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Lunas
            </button>
            <button
              onClick={() => setFilterPayment('UNPAID')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterPayment === 'UNPAID'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Hutang Tagihan
            </button>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition self-end sm:self-center"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat riwayat faktur pembelian...</div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">Tidak ada riwayat faktur pembelian</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik "+ Input Faktur Kulakan" untuk mencatat barang masuk dari distributor supplier.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">No. Faktur / PO</th>
                  <th className="px-6 py-4">Distributor / Supplier</th>
                  <th className="px-6 py-4">Tanggal Masuk</th>
                  <th className="px-6 py-4">Total Pembelian</th>
                  <th className="px-6 py-4">Status Pembayaran</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="font-mono">{pur.purchase_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">{pur.supplier_name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(pur.created_at)}
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-700 font-medium text-xs rounded-xl transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail Faktur
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PURCHASE INVOICE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Input Faktur Pembelian & Kulakan Stok"
        size="xl"
      >
        <form onSubmit={handleSubmitPurchase} className="space-y-4">
          {/* Header Info: Supplier & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Distributor / Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="">-- Pilih Supplier Rekanan --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Faktur / No. PO *
              </label>
              <input
                type="text"
                required
                value={purchaseNumber}
                onChange={(e) => setPurchaseNumber(e.target.value)}
                placeholder="PO-20260814-001"
                className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pembayaran *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="PAID">Lunas (Tunai / Transfer Direct)</option>
                <option value="UNPAID">Hutang (Tempo Tagihan Supplier)</option>
              </select>
            </div>

            {paymentStatus === 'UNPAID' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jatuh Tempo Pembayaran Tagihan *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* Action Toolbar for Product Selection */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenProductPicker(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                Pilih dari Katalog Material ({products.length} Produk)
              </button>

              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                + Buat Produk Baru
              </button>
            </div>

            {lowStockProducts.length > 0 && (
              <button
                type="button"
                onClick={handleAutoPopulateLowStock}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Kulakan ({lowStockProducts.length}) Stok Kritis
              </button>
            )}
          </div>

          {/* Table Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              <span>Daftar Material Kulakan ({items.length} Item)</span>
              <button
                type="button"
                onClick={() => handleOpenProductPicker(null)}
                className="text-sky-600 hover:text-sky-700 font-semibold normal-case flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Baris
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const subtotal = Number(item.quantity || 0) * Number(item.unitCost || 0);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    {/* Product Selection Button / Card */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5 sm:hidden">
                        Material Produk
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenProductPicker(idx)}
                        className="w-full text-left px-3 py-2 bg-white rounded-xl text-xs border border-slate-200 hover:border-sky-500 transition flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {item.productName || '-- Klik untuk Pilih Produk --'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {item.sku ? `SKU: ${item.sku}` : ''} | Stok: {item.currentStock || 0}{' '}
                            {item.unit || 'PCS'}
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </div>

                    {/* Qty Input */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                        Jumlah ({item.unit || 'Unit'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white rounded-xl text-xs font-bold text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-center"
                      />
                    </div>

                    {/* Unit Cost Price Input */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                        Harga Modal / Unit
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(idx, 'unitCost', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white rounded-xl text-xs font-medium text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-right"
                      />
                    </div>

                    {/* Subtotal Display */}
                    <div className="sm:col-span-2 text-right">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                        Subtotal
                      </label>
                      <span className="font-extrabold text-xs text-sky-700 block py-1.5">
                        {formatRupiah(subtotal)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grand Total Summary */}
          <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-sky-900 block">
                Total Nilai Faktur Kulakan:
              </span>
              <span className="text-[11px] text-sky-700">
                {items.length} jenis material akan otomatis bertambah ke stok gudang
              </span>
            </div>
            <span className="text-xl font-black text-sky-700">
              {formatRupiah(calculateTotal())}
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan & Tambah Stok Barang'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRODUCT PICKER MODAL */}
      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        products={products}
        categories={categories}
        alreadySelectedIds={items.map((i) => i.productId).filter(Boolean)}
        onSelectProduct={handleProductSelectedFromPicker}
        onSelectMultipleProducts={handleMultipleProductsSelected}
        onOpenQuickCreateProduct={() => {
          setIsPickerOpen(false);
          setIsQuickCreateOpen(true);
        }}
      />

      {/* QUICK CREATE PRODUCT MODAL */}
      <QuickProductModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        categories={categories}
        onProductCreated={handleProductCreatedQuickly}
      />

      {/* DETAIL PURCHASE MODAL */}
      <Modal
        isOpen={Boolean(detailPurchase)}
        onClose={() => setDetailPurchase(null)}
        title={`Faktur Pembelian: ${detailPurchase?.purchase_number}`}
        size="lg"
      >
        {detailPurchase && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Distributor / Supplier:</span>
                <p className="font-bold text-slate-900 mt-0.5">{detailPurchase.supplier_name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Tanggal Masuk:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {formatDate(detailPurchase.created_at)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Status Pembayaran:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {detailPurchase.payment_status === 'PAID' ? 'LUNAS' : 'TEMPO (HUTANG)'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Total Pembelian:</span>
                <p className="font-bold text-sky-600 text-sm mt-0.5">
                  {formatRupiah(detailPurchase.total_amount)}
                </p>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Rincian Material Barang Masuk
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nama Material</th>
                    <th className="p-3 text-center">Jumlah Masuk</th>
                    <th className="p-3 text-right">Harga Modal / Unit</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(detailPurchase.purchase_items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-900">
                        {item.product?.name || item.product_name || 'Material'}
                        {item.product?.sku && (
                          <span className="ml-2 text-[10px] text-slate-400 font-mono">
                            ({item.product.sku})
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {item.quantity} {item.product?.unit || 'PCS'}
                      </td>
                      <td className="p-3 text-right">{formatRupiah(item.unit_cost)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                Cetak Bukti Faktur
              </button>

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
