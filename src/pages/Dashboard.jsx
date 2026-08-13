import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Receipt,
  HardHat
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatRupiah } from '../utils/formatters';

export const Dashboard = () => {
  const { user, profile } = useAuth();

  // Mock summary metrics for dashboard baseline
  const metrics = {
    todaySales: 3450000,
    todayTxCount: 24,
    todayProfit: 860000,
    lowStockCount: 5,
  };

  const topProducts = [
    { name: 'Semen Gresik 40kg', category: 'Sembako & Material', sold: 48, revenue: 3120000 },
    { name: 'Besi Beton 10mm SNI', category: 'Besi & Logam', sold: 35, revenue: 2625000 },
    { name: 'Cat Tembok Nippon Paint 5kg', category: 'Cat & Coating', sold: 12, revenue: 1620000 },
    { name: 'Pipa PVC Wavin 3/4 inch', category: 'Pipa & Plambing', sold: 28, revenue: 840000 },
  ];

  const lowStockItems = [
    { name: 'Semen Tiga Roda 50kg', stock: 4, minStock: 20, unit: 'SAK' },
    { name: 'Paku Kayu 3 inch', stock: 2, minStock: 10, unit: 'KG' },
    { name: 'Kawat Bendrat', stock: 3, minStock: 15, unit: 'ROLL' },
    { name: 'FITTING KNEE PVC 1/2 inch', stock: 8, minStock: 30, unit: 'PCS' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <HardHat className="w-4 h-4" />
            <span>POS TB. SUMBER AGUNG</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            Selamat Datang, {profile?.full_name || user?.email || 'Kasir'}!
          </h2>
          <p className="text-slate-400 text-xs">
            Ringkasan operasional dan statistik penjualan toko bahan bangunan hari ini.
          </p>
        </div>

        <Link
          to="/kasir"
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Buka Terminal Kasir</span>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Penjualan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Penjualan Hari Ini</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {formatRupiah(metrics.todaySales)}
          </h3>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +18% dari kemarin
          </p>
        </div>

        {/* Transaksi Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Transaksi Selesai</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {metrics.todayTxCount} <span className="text-xs text-slate-500 font-normal">Struk</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Rata-rata: {formatRupiah(metrics.todaySales / metrics.todayTxCount)}/struk
          </p>
        </div>

        {/* Est. Laba Bersih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Laba Bersih Hari Ini</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 font-mono">
            {formatRupiah(metrics.todayProfit)}
          </h3>
          <p className="text-[11px] text-purple-600 font-medium">
            Margin: {((metrics.todayProfit / metrics.todaySales) * 100).toFixed(1)}%
          </p>
        </div>

        {/* Stok Menipis Warning */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Stok Perlu Restock</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {metrics.lowStockCount} <span className="text-xs text-slate-500 font-normal">Produk</span>
          </h3>
          <Link to="/stok" className="text-[11px] text-amber-600 hover:underline font-semibold block">
            Lihat daftar stok menipis →
          </Link>
        </div>

      </div>

      {/* Main Grid: Top Selling & Low Stock Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Produk Terlaris Hari Ini
            </h3>
            <Link to="/laporan" className="text-xs font-semibold text-emerald-600 hover:underline">
              Laporan Lengkap
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <span className="text-[10px] text-slate-500">{item.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 block font-mono">
                    {formatRupiah(item.revenue)}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.sold} unit terjual</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warning List (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Peringatan Stok Menipis
            </h3>
            <Link to="/pembelian" className="text-xs font-semibold text-amber-600 hover:underline">
              Order Pembelian
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <span className="text-[10px] text-amber-800">
                    Min. Stok: {item.minStock} {item.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-amber-200 text-amber-900 font-bold rounded-lg text-xs">
                    Sisa: {item.stock} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
