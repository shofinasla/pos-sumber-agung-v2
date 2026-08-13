import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award, 
  Calendar, 
  Download, 
  Printer,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import { Transaction, Product } from '../types/pos';
import { formatRupiah, formatDateOnly } from '../utils/formatters';

interface ReportsTabProps {
  transactions: Transaction[];
  products: Product[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ transactions, products }) => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');

  // Filter valid completed transactions
  const validTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (tx.status !== 'completed') return false;

      const txDate = new Date(tx.date);
      if (dateFilter === 'today') {
        return txDate.toDateString() === now.toDateString();
      }
      if (dateFilter === '7days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (dateFilter === 'month') {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [transactions, dateFilter]);

  // Aggregate Key Metrics
  const totalRevenue = useMemo(
    () => validTransactions.reduce((acc, tx) => acc + tx.grandTotal, 0),
    [validTransactions]
  );

  const totalProfit = useMemo(
    () => validTransactions.reduce((acc, tx) => acc + tx.profit, 0),
    [validTransactions]
  );

  const totalTransactionsCount = validTransactions.length;

  const avgTicketValue = useMemo(
    () => (totalTransactionsCount > 0 ? totalRevenue / totalTransactionsCount : 0),
    [totalRevenue, totalTransactionsCount]
  );

  // Top Selling Products Calculation
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();

    validTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const existing = map.get(item.productId) || { name: item.name, qty: 0, revenue: 0 };
        map.set(item.productId, {
          name: item.name,
          qty: existing.qty + item.quantity,
          revenue: existing.revenue + item.subtotal,
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [validTransactions]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const counts = { cash: 0, qris: 0, debit: 0, transfer: 0 };
    const amounts = { cash: 0, qris: 0, debit: 0, transfer: 0 };

    validTransactions.forEach((tx) => {
      const method = tx.paymentMethod;
      if (counts[method] !== undefined) {
        counts[method] += 1;
        amounts[method] += tx.grandTotal;
      }
    });

    return { counts, amounts };
  }, [validTransactions]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Date Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-900 text-base">Laporan Penjualan & Keuangan</h2>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: '7days', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua Waktu' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateFilter === item.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Omset Penjualan</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400 font-mono">
            {formatRupiah(totalRevenue)}
          </h3>
          <p className="text-[11px] text-slate-400">Dari {totalTransactionsCount} transaksi selesai</p>
        </div>

        {/* Total Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Laba Bersih (Profit)</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 font-mono">
            {formatRupiah(totalProfit)}
          </h3>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Margin Rata-rata: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Transaksi</span>
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {totalTransactionsCount} <span className="text-sm font-normal text-slate-500">Struk</span>
          </h3>
          <p className="text-[11px] text-slate-400">Transaksi berstatus Lunas</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Rata-rata / Struk</span>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 font-mono">
            {formatRupiah(avgTicketValue)}
          </h3>
          <p className="text-[11px] text-slate-400">Nilai keranjang rata-rata</p>
        </div>

      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              5 Produk Terlaris (Top Selling)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Berdasarkan Jumlah Terjual</span>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Belum ada data transaksi.</p>
            ) : (
              topProducts.map((item, idx) => {
                const maxQty = topProducts[0]?.qty || 1;
                const percent = Math.min(100, Math.round((item.qty / maxQty) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {item.name}
                      </span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {item.qty} pcs ({formatRupiah(item.revenue)})
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Methods Split (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Metode Pembayaran
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { key: 'cash', label: 'Uang Tunai (Cash)', color: 'bg-emerald-500' },
              { key: 'qris', label: 'QRIS / E-Wallet', color: 'bg-blue-500' },
              { key: 'debit', label: 'Debit / Kartu Kredit', color: 'bg-purple-500' },
              { key: 'transfer', label: 'Transfer Bank', color: 'bg-amber-500' },
            ].map((m) => {
              const count = paymentBreakdown.counts[m.key as keyof typeof paymentBreakdown.counts] || 0;
              const amount = paymentBreakdown.amounts[m.key as keyof typeof paymentBreakdown.amounts] || 0;
              const share = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0;

              return (
                <div key={m.key} className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                      {m.label}
                    </span>
                    <span className="font-mono text-slate-900">{formatRupiah(amount)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>{count} Transaksi</span>
                    <span>{share}% dari omset</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
