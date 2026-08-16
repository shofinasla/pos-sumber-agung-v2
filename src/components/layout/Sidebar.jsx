import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Boxes,
  Receipt,
  Users,
  Truck,
  ShoppingCart,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../common/Logo';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/kasir', label: 'Kasir POS', icon: ShoppingBag, highlight: true },
  { path: '/produk', label: 'Produk', icon: Package },
  { path: '/kategori', label: 'Kategori', icon: Tags },
  { path: '/stok', label: 'Stok Barang', icon: Boxes },
  { path: '/transaksi', label: 'Riwayat Transaksi', icon: Receipt },
  { path: '/pelanggan', label: 'Pelanggan', icon: Users },
  { path: '/supplier', label: 'Supplier', icon: Truck },
  { path: '/pembelian', label: 'Pembelian', icon: ShoppingCart },
  { path: '/hutang', label: 'Hutang / Piutang', icon: Wallet },
  { path: '/laporan', label: 'Laporan Finansial', icon: BarChart3 },
  { path: '/pengguna', label: 'Pengguna', icon: UserCog, roles: ['OWNER', 'ADMIN'] },
  { path: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <Logo size="sm" className="scale-105" />
            <div>
              <h1 className="font-black text-white text-base sm:text-sm tracking-tight leading-none">TB. SUMBER AGUNG</h1>
              <span className="text-xs sm:text-[10px] font-semibold text-rose-400 uppercase tracking-widest block mt-0.5">
                Toko Bangunan & POS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 sm:space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(role)) {
              return null;
            }

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3.5 sm:space-x-3 px-3.5 sm:px-3 py-3 sm:py-2.5 rounded-2xl sm:rounded-xl font-medium text-sm sm:text-xs transition duration-150 ${
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-white font-semibold border-l-4 border-emerald-500'
                      : item.highlight
                      ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 font-semibold'
                      : 'text-slate-300 sm:text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className={`w-5 h-5 sm:w-4 sm:h-4 shrink-0 ${item.highlight ? '' : ''}`} />
                <span className="text-sm sm:text-xs font-semibold">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Store Info Footer */}
        <div className="p-3.5 sm:p-3 border-t border-slate-800 bg-slate-950/40 text-xs sm:text-[11px] text-slate-400 sm:text-slate-500 flex justify-between items-center">
          <span className="font-medium">TB. Sumber Agung v1.0</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-mono text-xs sm:text-[10px] font-bold">
            Online Ready
          </span>
        </div>
      </aside>
    </>
  );
};
