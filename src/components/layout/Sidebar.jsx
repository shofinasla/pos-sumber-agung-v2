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
  X,
  HardHat
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

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
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-md">
              <HardHat className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="font-black text-white text-base tracking-tight leading-none">TB. SUMBER AGUNG</h1>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest block mt-0.5">
                Bahan Bangunan & POS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
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
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition duration-150 ${
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-white font-semibold border-l-4 border-emerald-500'
                      : item.highlight
                      ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? '' : ''}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Store Info Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex justify-between items-center">
          <span>TB. Sumber Agung v1.0</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
            Ready
          </span>
        </div>
      </aside>
    </>
  );
};
