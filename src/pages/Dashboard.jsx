import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Receipt,
  HardHat,
  RefreshCw,
  Clock,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CreditCard,
  Building2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatRupiah } from '../utils/formatters';
import { dashboardService } from '../services/dashboardService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Dashboard = () => {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [metrics, setMetrics] = useState({
    todaySales: 0,
    todayTxCount: 0,
    todayProfit: 0,
    todayProfitMargin: '0',
    yesterdaySales: 0,
    salesGrowthPercent: 0,
    averageTicket: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
    totalPiutangPending: 0,
    totalHutangPending: 0,
  });

  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [weeklyChartData, setWeeklyChartData] = useState([]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const { data } = await dashboardService.getDashboardRealtimeData();
      if (data) {
        if (data.metrics) setMetrics(data.metrics);
        if (data.topProducts) setTopProducts(data.topProducts);
        if (data.lowStockItems) setLowStockItems(data.lowStockItems);
        if (data.recentTransactions) setRecentTransactions(data.recentTransactions);
        if (data.weeklyChartData) setWeeklyChartData(data.weeklyChartData);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Manual refresh error:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  // Real-time synchronization setup
  useEffect(() => {
    let isMounted = true;

    const fetchData = async (showLoadingState = false) => {
      if (showLoadingState) setLoading(true);
      try {
        const { data } = await dashboardService.getDashboardRealtimeData();
        if (isMounted && data) {
          if (data.metrics) setMetrics(data.metrics);
          if (data.topProducts) setTopProducts(data.topProducts);
          if (data.lowStockItems) setLowStockItems(data.lowStockItems);
          if (data.recentTransactions) setRecentTransactions(data.recentTransactions);
          if (data.weeklyChartData) setWeeklyChartData(data.weeklyChartData);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Failed to load realtime dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData(true);

    // 1. Polling interval every 6 seconds for continuous live update
    const interval = setInterval(() => {
      fetchData(false);
    }, 6000);

    // 2. Window event listeners for immediate updates (cross-tab / same window)
    const handleDataUpdated = () => {
      fetchData(false);
    };

    window.addEventListener('pos_data_updated', handleDataUpdated);
    window.addEventListener('storage', handleDataUpdated);
    window.addEventListener('focus', handleDataUpdated);

    // 3. Supabase Realtime Channel if configured
    let realtimeChannel = null;
    if (isSupabaseConfigured && supabase) {
      try {
        realtimeChannel = supabase
          .channel('pos-dashboard-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'sales' },
            () => fetchData(false)
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            () => fetchData(false)
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'stock_movements' },
            () => fetchData(false)
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription error:', e);
      }
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('pos_data_updated', handleDataUpdated);
      window.removeEventListener('storage', handleDataUpdated);
      window.removeEventListener('focus', handleDataUpdated);
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  // Format relative time helper
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Baru saja';
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now - past;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);

      if (diffSecs < 60) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return 'Baru saja';
    }
  };

  // Find maximum sales in weekly chart for relative bar height
  const maxWeeklySales = Math.max(
    ...weeklyChartData.map((d) => d.sales || 0),
    100000
  );

  return (
    <div className="space-y-6 pb-8 font-sans">
      
      {/* Realtime Live Header Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Dashboard Live Realtime
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                LIVE SYNC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Terakhir diperbarui:</span>
              <span className="font-semibold text-slate-700">
                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
            title="Segarkan data saat ini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>

          <Link
            to="/kasir"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Kasir POS</span>
          </Link>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <HardHat className="w-4 h-4" />
            <span>POS TB. SUMBER AGUNG</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            Selamat Datang, {profile?.full_name || user?.email || 'Kasir'}!
          </h2>
          <p className="text-slate-400 text-xs">
            Data transaksi omset kasir, nilai persediaan stok, dan performa keuangan diperbarui secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10">
          <Link
            to="/stok"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cek Stok</span>
          </Link>
          <Link
            to="/laporan"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Laporan Lengkap</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton if Initial Load */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Primary Metrics Cards Grid (Real-time Live) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Penjualan Hari Ini (Omset) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition group">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Penjualan Hari Ini</span>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {formatRupiah(metrics.todaySales)}
              </h3>
              <div className="flex items-center justify-between text-[11px] pt-1">
                {metrics.salesGrowthPercent >= 0 ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{metrics.salesGrowthPercent}% vs kemarin
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-0.5">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {metrics.salesGrowthPercent}% vs kemarin
                  </span>
                )}
                <span className="text-slate-400">Kemarin: {formatRupiah(metrics.yesterdaySales)}</span>
              </div>
            </div>

            {/* Transaksi Selesai Hari Ini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-blue-300 transition group">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Transaksi Hari Ini</span>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-mono">
                {metrics.todayTxCount} <span className="text-xs text-slate-500 font-sans font-normal">Struk Selesai</span>
              </h3>
              <p className="text-[11px] text-slate-500 pt-1">
                Rata-rata keranjang: <span className="font-semibold text-slate-700">{formatRupiah(metrics.averageTicket)}</span>/struk
              </p>
            </div>

            {/* Laba Bersih Hari Ini */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-purple-300 transition group">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Laba Bersih Hari Ini</span>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {formatRupiah(metrics.todayProfit)}
              </h3>
              <p className="text-[11px] text-purple-700 font-semibold pt-1">
                Margin Laba: <span className="font-mono">{metrics.todayProfitMargin}%</span> dari omset hari ini
              </p>
            </div>

            {/* Peringatan Stok Menipis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-amber-300 transition group">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Stok Kritis / Menipis</span>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-mono">
                {metrics.lowStockCount + metrics.outOfStockCount}{' '}
                <span className="text-xs text-slate-500 font-sans font-normal">
                  Produk ({metrics.outOfStockCount} Habis)
                </span>
              </h3>
              <Link
                to="/stok"
                className="text-[11px] text-amber-700 hover:text-amber-800 hover:underline font-bold block pt-1"
              >
                Buka daftar periksa stok →
              </Link>
            </div>

          </div>

          {/* Secondary Quick Overview Badges: Inventory Value & Piutang */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai Aset Inventaris</span>
                <h4 className="text-lg font-black text-slate-900 font-mono">{formatRupiah(metrics.totalInventoryValue)}</h4>
                <span className="text-[10px] text-slate-500">{metrics.totalProducts} item produk material aktif</span>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Piutang Pelanggan (Bon)</span>
                <h4 className="text-lg font-black text-amber-800 font-mono">{formatRupiah(metrics.totalPiutangPending)}</h4>
                <Link to="/hutang" className="text-[10px] text-amber-700 font-bold hover:underline">
                  Kelola Bon Pelanggan →
                </Link>
              </div>
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hutang ke Supplier</span>
                <h4 className="text-lg font-black text-rose-800 font-mono">{formatRupiah(metrics.totalHutangPending)}</h4>
                <Link to="/hutang" className="text-[10px] text-rose-700 font-bold hover:underline">
                  Kelola Tagihan Supplier →
                </Link>
              </div>
              <div className="p-3 bg-rose-100 text-rose-800 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 7-Day Live Sales Trend Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Tren Penjualan 7 Hari Terakhir (Realtime)
                </h3>
                <p className="text-xs text-slate-500">
                  Grafik perbandingan omset penjualan material harian TB. Sumber Agung.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                Puncak: {formatRupiah(maxWeeklySales)}
              </span>
            </div>

            {/* Dynamic Interactive Chart Bars */}
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 border-b border-slate-200 pb-2">
                {weeklyChartData.map((item, idx) => {
                  const heightPercent = Math.max(8, Math.round((item.sales / maxWeeklySales) * 100));
                  const isToday = idx === weeklyChartData.length - 1;
                  return (
                    <div key={item.date || idx} className="flex flex-col items-center h-full justify-end group relative">
                      
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap text-center">
                        <p className="font-bold font-mono">{formatRupiah(item.sales)}</p>
                        <p className="text-slate-400">{item.count} transaksi</p>
                      </div>

                      {/* Bar */}
                      <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isToday
                              ? 'bg-gradient-to-t from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20'
                              : 'bg-gradient-to-t from-slate-600 to-slate-400 hover:from-emerald-500 hover:to-teal-400'
                          }`}
                        />
                      </div>

                      {/* Label */}
                      <span className={`text-[10px] mt-2 font-bold ${isToday ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Grid: Top Selling & Low Stock Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Top Selling Products (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Produk Terlaris Hari Ini (Riil)
                </h3>
                <Link to="/laporan" className="text-xs font-semibold text-emerald-600 hover:underline">
                  Laporan Lengkap →
                </Link>
              </div>

              {topProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    Belum ada data penjualan hari ini.
                  </p>
                  <Link
                    to="/kasir"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Mulai Transaksi di Kasir →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topProducts.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl flex justify-between items-center text-xs transition border border-slate-100"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 font-black'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <span className="text-[10px] text-slate-500">{item.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 block font-mono">
                          {formatRupiah(item.revenue)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{item.sold} Terjual</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Preview (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Peringatan Stok ({lowStockItems.length})
                </h3>
                <Link to="/stok" className="text-xs font-semibold text-amber-600 hover:underline">
                  Kelola Stok →
                </Link>
              </div>

              {lowStockItems.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-emerald-800 font-semibold">Semua stok barang aman!</p>
                  <p className="text-[10px] text-emerald-600">Tidak ada produk di bawah batas minimum.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <span className="text-[10px] text-slate-500">
                          Batas Min: {item.minStock} {item.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-xs font-mono inline-block ${
                            item.stock <= 0
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.stock <= 0 ? 'Habis (0)' : `Sisa: ${item.stock} ${item.unit}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Live Recent Transactions Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Aktivitas Transaksi Kasir Terkini (Live Stream)
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar struk penjualan paling baru yang telah tercatat di sistem.
                </p>
              </div>
              <Link to="/transaksi" className="text-xs font-semibold text-emerald-600 hover:underline">
                Riwayat Selengkapnya →
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Belum ada riwayat transaksi yang tersimpan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No. Faktur</th>
                      <th className="py-2.5 px-3">Pelanggan</th>
                      <th className="py-2.5 px-3">Jumlah Item</th>
                      <th className="py-2.5 px-3">Metode Bayar</th>
                      <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                      <th className="py-2.5 px-3 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {tx.invoice_number}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {tx.customer_name}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {tx.item_count} item
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {tx.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700 text-right">
                          {formatRupiah(tx.total)}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-right font-medium">
                          {formatTimeAgo(tx.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};
