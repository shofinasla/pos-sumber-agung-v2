import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, LogOut, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../lib/supabase';

const pageTitles = {
  '/dashboard': 'Dashboard Utama',
  '/kasir': 'Kasir Terminal POS',
  '/produk': 'Katalog & Master Produk',
  '/kategori': 'Kategori Material & Barang',
  '/stok': 'Manajemen & Riwayat Stok',
  '/transaksi': 'Riwayat & Struk Transaksi',
  '/pelanggan': 'Data Pelanggan & Member',
  '/supplier': 'Daftar Supplier Material',
  '/pembelian': 'Pembelian & Kulakan Stok',
  '/hutang': 'Buku Hutang & Piutang',
  '/laporan': 'Laporan Penjualan & Laba',
  '/pengguna': 'Manajemen Pengguna',
  '/pengaturan': 'Pengaturan Toko & Aplikasi',
};

export const Navbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { user, profile, logout, role } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const title = pageTitles[location.pathname] || 'TB. Sumber Agung POS';

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="font-bold text-slate-900 text-sm md:text-base leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {time.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            • {time.toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>

      {/* Right: Connection Status & User Profile */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Supabase status indicator */}
        <div
          title={isSupabaseConfigured ? 'Terhubung ke Cloud Database' : 'Database Lokal / Penyimpanan Perangkat'}
          className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSupabaseConfigured ? 'Cloud Terhubung' : 'Penyimpanan Lokal'}</span>
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <span className="block font-bold text-slate-900 text-xs">
              {profile?.full_name || user?.email || 'Kasir Sumber Agung'}
            </span>
            <div className="flex items-center justify-end space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
            title="Keluar dari Aplikasi"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
