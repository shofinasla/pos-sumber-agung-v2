import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Percent,
  Award,
  RefreshCw,
} from 'lucide-react';
import { reportService } from '../services/reportService';

export const LaporanPage = () => {
  const [period, setPeriod] = useState('today'); // 'today', 'month', 'all'
  const [report, setReport] = useState({
    totalOmset: 0,
    totalCost: 0,
    grossProfit: 0,
    totalDiscount: 0,
    transactionCount: 0,
    paymentBreakdown: { CASH: 0, QRIS: 0, TRANSFER: 0, DEBIT: 0, CREDIT: 0 },
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const { data } = await reportService.getFinancialReport(period);
    if (data) {
      setReport(data);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data } = await reportService.getFinancialReport(period);
      if (isMounted) {
        if (data) setReport(data);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [period]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const profitMargin =
    report.totalOmset > 0
      ? Math.round((report.grossProfit / report.totalOmset) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Laporan Finansial & Laba Bersih
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis omset penjualan, estimasi laba kotor, HPP modal material, dan metode pembayaran TB. Sumber Agung.
          </p>
        </div>

        {/* Period Selector */}
        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              period === 'today'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              period === 'month'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              period === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Waktu
          </button>
          <button
            onClick={fetchReport}
            className="p-1.5 text-slate-400 hover:text-emerald-600 transition"
            title="Refresh Laporan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Omset Penjualan</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatRupiah(report.totalOmset)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
              {report.transactionCount} Transaksi Sukses
            </span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total HPP / Modal */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total HPP / Modal Barang</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {formatRupiah(report.totalCost)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
              Estimasi Harga Beli Kulakan
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Estimasi Laba Bersih */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Estimasi Laba Kotor</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {formatRupiah(report.grossProfit)}
            </h3>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block">
              Margin {profitMargin}%
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Diskon */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Diskon Diberikan</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">
              {formatRupiah(report.totalDiscount)}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
              Potongan Toko
            </span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Metode Pembayaran Transaksi
            </h3>
            <span className="text-xs font-semibold text-slate-400">Porsi Omset</span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { label: 'Tunai (Cash)', key: 'CASH', color: 'bg-emerald-500' },
              { label: 'QRIS / E-Wallet', key: 'QRIS', color: 'bg-sky-500' },
              { label: 'Transfer Bank', key: 'TRANSFER', color: 'bg-indigo-500' },
              { label: 'Kartu Debit', key: 'DEBIT', color: 'bg-purple-500' },
              { label: 'Kartu Kredit', key: 'CREDIT', color: 'bg-amber-500' },
            ].map((m) => {
              const val = report.paymentBreakdown[m.key] || 0;
              const pct = report.totalOmset > 0 ? Math.round((val / report.totalOmset) * 100) : 0;

              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{m.label}</span>
                    <span className="text-slate-900">
                      {formatRupiah(val)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              5 Produk Terlaris (Fast-Moving)
            </h3>
            <span className="text-xs font-semibold text-slate-400">Total Terjual</span>
          </div>

          {report.topProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada data penjualan produk pada periode ini.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {report.topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{p.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {p.qty} Item Terjual
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaporanPage;
