import { useState, useEffect, useCallback } from 'react';
import { Receipt, Search, Filter, RefreshCw, Printer, Ban } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { ReceiptModal } from '../components/ReceiptModal';

export const TransaksiPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Sale for Detail Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Void Modal
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const res = await transactionService.getSalesHistory({
      search,
      paymentMethod: paymentFilter,
      status: statusFilter,
    });
    if (res.data) setSales(res.data);
    setLoading(false);
  }, [search, paymentFilter, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const res = await transactionService.getSalesHistory({
        search,
        paymentMethod: paymentFilter,
        status: statusFilter,
      });
      if (isMounted) {
        if (res.data) setSales(res.data);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [search, paymentFilter, statusFilter]);

  const handleOpenReceipt = (sale) => {
    // Format sale object so ReceiptModal handles it smoothly
    const formattedData = {
      sale_id: sale.id,
      invoice_number: sale.invoice_number,
      created_at: sale.created_at,
      payment_method: sale.payment_method,
      total: sale.total,
      subtotal: sale.subtotal,
      discount: sale.discount,
      paid_amount: sale.paid_amount,
      change_amount: sale.change_amount,
      customer_name: sale.customer?.name || 'Pelanggan Umum',
      cashier_name: sale.cashier?.full_name || 'Kasir Toko',
      items: (sale.sale_items || []).map((item) => ({
        name: item.product?.name || 'Produk Material',
        quantity: item.quantity,
        selling_price: item.unit_price,
        subtotal: item.subtotal,
        unit: item.product?.unit || 'PCS',
      })),
    };
    setSelectedSale(formattedData);
    setIsReceiptOpen(true);
  };

  const handleOpenVoidModal = (sale) => {
    setSaleToVoid(sale);
    setVoidReason('');
    setIsVoidOpen(true);
  };

  const executeVoid = async () => {
    if (!saleToVoid) return;
    setVoidLoading(true);
    const res = await transactionService.voidSale(saleToVoid.id, voidReason || 'Salah input kasir');
    setVoidLoading(false);
    setIsVoidOpen(false);

    if (res.error) {
      showToast(res.error.message || 'Gagal membatalkan transaksi.', 'error');
    } else {
      showToast('Transaksi berhasil dibatalkan (Void).');
      fetchSales();
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
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
            <Receipt className="w-6 h-6 text-teal-600" />
            Riwayat Nota & Transaksi Penjualan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh transaksi kasir, cetak ulang nota/struk thermal, dan opsi pembatalan (Void)
          </p>
        </div>

        <button
          onClick={fetchSales}
          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center space-x-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-slate-600" />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari no invoice, pelanggan, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSales()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Metode Bayar (Semua)</option>
            <option value="CASH">Tunai (CASH)</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer Bank</option>
            <option value="DEBIT">Kartu Debit</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Status (Semua)</option>
            <option value="COMPLETED">Selesai (Completed)</option>
            <option value="VOIDED">Dibatalkan (Voided)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            <div className="h-6 bg-slate-100 rounded-lg w-1/4" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold">Belum Ada Transaksi</p>
            <p className="text-[11px] text-slate-400">
              Transaksi yang diproses di kasir POS akan langsung tercatat di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">No. Invoice / Tanggal</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Kasir</th>
                  <th className="py-3.5 px-4 text-center">Metode Bayar</th>
                  <th className="py-3.5 px-4 font-mono text-right">Total Transaksi</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => {
                  const isVoid = sale.status === 'VOIDED';
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900">{sale.invoice_number}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(sale.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {sale.customer?.name || 'Pelanggan Umum'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {sale.cashier?.full_name || 'Kasir'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md text-[10px] uppercase">
                          {sale.payment_method || 'CASH'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-teal-700 text-right">
                        {formatCurrency(sale.total)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVoid ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isVoid ? 'Dibatalkan' : 'Selesai'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenReceipt(sale)}
                            title="Lihat & Cetak Struk"
                            className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition flex items-center gap-1 font-bold text-[11px]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>

                          {!isVoid && (
                            <button
                              onClick={() => handleOpenVoidModal(sale)}
                              title="Batalkan Transaksi (Void)"
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Thermal Print Modal */}
      {isReceiptOpen && selectedSale && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          transactionData={selectedSale}
        />
      )}

      {/* Void Confirm Modal */}
      {isVoidOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-rose-700 text-sm flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                Batalkan Transaksi ({saleToVoid?.invoice_number})
              </h3>
              <button onClick={() => setIsVoidOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin membatalkan transaksi ini? Status akan diubah menjadi <strong className="text-rose-600">VOIDED</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Pembatalan</label>
              <input
                type="text"
                placeholder="Contoh: Barang retur, salah nominal..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setIsVoidOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={executeVoid}
                disabled={voidLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center space-x-1.5"
              >
                {voidLoading ? 'Proses...' : 'Ya, Batalkan Nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
