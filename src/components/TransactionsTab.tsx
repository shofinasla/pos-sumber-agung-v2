import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  Eye, 
  RotateCcw, 
  Download, 
  FileText, 
  Filter, 
  CheckCircle2, 
  XCircle,
  X,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { Transaction } from '../types/pos';
import { formatRupiah, formatDate } from '../utils/formatters';

interface TransactionsTabProps {
  transactions: Transaction[];
  onOpenReceipt: (transaction: Transaction) => void;
  onVoidTransaction: (transactionId: string, reason: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  onOpenReceipt,
  onVoidTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided'>('all');

  // Void modal state
  const [selectedVoidTx, setSelectedVoidTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.cashierName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPayment = paymentFilter === 'all' || tx.paymentMethod === paymentFilter;
      const matchStatus = statusFilter === 'all' || tx.status === statusFilter;

      return matchSearch && matchPayment && matchStatus;
    });
  }, [transactions, searchQuery, paymentFilter, statusFilter]);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No. Transaksi,Tanggal,Kasir,Pelanggan,Metode Bayar,Subtotal,Diskon,Grand Total,Keuntungan,Status\n';

    filteredTransactions.forEach((tx) => {
      csvContent += `"${tx.id}","${formatDate(tx.date)}","${tx.cashierName}","${tx.customerName || '-'}","${tx.paymentMethod.toUpperCase()}",${tx.subtotal},${tx.discountTotal},${tx.grandTotal},${tx.profit},"${tx.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Riwayat-Penjualan-SumberAgung-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmVoid = () => {
    if (!selectedVoidTx) return;
    if (!voidReason.trim()) {
      alert('Mohon isi alasan pembatalan transaksi.');
      return;
    }
    onVoidTransaction(selectedVoidTx.id, voidReason);
    setSelectedVoidTx(null);
    setVoidReason('');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID transaksi, nama kasir, atau pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-sm transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Laporan CSV</span>
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          
          {/* Payment Method filter */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-medium mr-1">Pembayaran:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'cash', label: 'Tunai' },
              { id: 'qris', label: 'QRIS' },
              { id: 'debit', label: 'Debit/Card' },
              { id: 'transfer', label: 'Transfer' },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentFilter(method.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  paymentFilter === method.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 ml-auto">
            <span className="text-slate-500 font-medium mr-1">Status:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'completed', label: 'Lunas' },
              { id: 'voided', label: 'Dibatalkan (Void)' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === st.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">No. Transaksi</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Kasir & Pelanggan</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4 text-right">Total Belanja</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada riwayat transaksi yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isVoid = tx.status === 'voided';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isVoid ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900">
                        {tx.id}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(tx.date)}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 text-xs">{tx.cashierName}</p>
                        <p className="text-[11px] text-slate-400">
                          {tx.customerName ? `Pelanggan: ${tx.customerName}` : 'Pelanggan Umum'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-bold uppercase text-slate-700">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {tx.paymentMethod === 'cash' && <Banknote className="w-3 h-3 text-emerald-600" />}
                          {tx.paymentMethod === 'qris' && <QrCode className="w-3 h-3 text-blue-600" />}
                          {tx.paymentMethod !== 'cash' && tx.paymentMethod !== 'qris' && <CreditCard className="w-3 h-3 text-purple-600" />}
                          {tx.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatRupiah(tx.grandTotal)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isVoid ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            Voided
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selesai
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onOpenReceipt(tx)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                            title="Lihat / Cetak Struk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>

                          {!isVoid && (
                            <button
                              onClick={() => setSelectedVoidTx(tx)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                              title="Batalkan Transaksi (Void)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Void</span>
                            </button>
                          )}
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

      {/* Void Modal */}
      {selectedVoidTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-rose-950 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                Pembatalan Transaksi (Void)
              </h3>
              <button
                onClick={() => setSelectedVoidTx(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <p className="text-xs text-rose-800 font-semibold">
                  Transaksi #{selectedVoidTx.id} - {formatRupiah(selectedVoidTx.grandTotal)}
                </p>
                <p className="text-xs text-rose-600 mt-1">
                  Stok barang dalam transaksi ini akan dikembalikan otomatis ke inventaris.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Pembatalan Transaksi
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Misal: Kesalahan input item / Permintaan pelanggan / Retur..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVoidTx(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoid}
                  className="flex-1 py-2.5 px-4 bg-rose-600 text-white font-bold rounded-xl text-sm hover:bg-rose-700 transition"
                >
                  Konfirmasi Void
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
