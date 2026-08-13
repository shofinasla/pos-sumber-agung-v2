import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Receipt, 
  BarChart3, 
  Users, 
  Store, 
  Clock, 
  User, 
  AlertTriangle,
  RotateCcw,
  DollarSign
} from 'lucide-react';
import { ActiveTab, Shift } from '../types/pos';
import { STORE_INFO } from '../data/initialData';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  cashierName: string;
  onChangeCashier: () => void;
  shift: Shift;
  onOpenShiftModal: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  cashierName,
  onChangeCashier,
  shift,
  onOpenShiftModal,
  onResetData,
}) => {
  const [time, setTime] = React.useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'cashier',
      label: 'Kasir',
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      id: 'inventory',
      label: 'Produk & Stok',
      icon: <Package className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'transactions',
      label: 'Riwayat Transaksi',
      icon: <Receipt className="w-5 h-5" />,
    },
    {
      id: 'reports',
      label: 'Laporan Penjualan',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'customers',
      label: 'Pelanggan',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Store Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-slate-950 font-bold flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {STORE_INFO.name}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {STORE_INFO.tagline}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                        isActive
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Shift Indicator */}
            <button
              onClick={onOpenShiftModal}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                shift.status === 'open'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
              }`}
              title="Kelola Shift Kasir"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                Shift: {shift.status === 'open' ? 'Buka' : 'Tutup'}
              </span>
            </button>

            {/* Cashier Info */}
            <button
              onClick={onChangeCashier}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition border border-slate-700"
              title="Ganti Nama Kasir"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[100px] truncate">{cashierName}</span>
            </button>

            {/* Live Clock */}
            <div className="hidden lg:flex items-center space-x-1 text-slate-400 text-xs font-mono bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{time}</span>
            </div>

            {/* Reset Sample Data Button */}
            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
              title="Reset Data Sampel Awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center p-2 rounded-lg text-xs font-medium relative ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                {item.icon}
                <span className="mt-1 text-[10px]">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
