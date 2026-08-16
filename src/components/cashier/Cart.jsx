import { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { CartItem } from './CartItem';
import { formatCurrency } from '../../utils/formatCurrency';
import { transactionService } from '../../services/transactionService';
import {
  ShoppingBag,
  User,
  Trash2,
  Tag,
  CreditCard,
  Search,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';

export const Cart = ({ onOpenCheckout }) => {
  const {
    items,
    selectedCustomer,
    cartDiscount,
    subtotal,
    total,
    itemCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    setCartDiscount,
    setSelectedCustomer,
  } = useCart();

  // State dropdown pilihan pelanggan
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customersList, setCustomersList] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Fetch customers saat modal dibuka
  useEffect(() => {
    let isMounted = true;
    if (!isCustomerModalOpen) return;

    (async () => {
      setLoadingCustomers(true);
      const { data } = await transactionService.getCustomers(customerSearch);
      if (isMounted) {
        setCustomersList(data || []);
        setLoadingCustomers(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isCustomerModalOpen, customerSearch]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header Cart & Pelanggan */}
      <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Keranjang Belanja
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {itemCount} item terpilih
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center space-x-1.5 text-xs sm:text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors touch-manipulation"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {/* Pilihan Pelanggan */}
        <div className="pt-1">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl text-left transition-all group shadow-2xs touch-manipulation"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Pelanggan
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum (Default)'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* List Items Keranjang */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2.5">
            <ShoppingBag className="w-14 h-14 text-slate-200" />
            <p className="text-sm font-bold text-slate-600">
              Keranjang masih kosong
            </p>
            <p className="text-xs text-slate-500 max-w-[220px]">
              Klik produk pada katalog atau scan barcode untuk menambahkan barang.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.product_id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))
        )}
      </div>

      {/* Rincian Subtotal, Diskon, & Total */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
        {/* Rincian Angka */}
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Diskon Nominal Input */}
          <div className="flex items-center justify-between text-slate-600 pt-1">
            <span className="flex items-center space-x-1.5 font-medium">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Diskon (Rp)</span>
            </span>
            <div className="w-36">
              <input
                type="number"
                min="0"
                value={cartDiscount || ''}
                onChange={(e) => setCartDiscount(e.target.value)}
                placeholder="0"
                className="w-full text-right px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Line Total */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 font-extrabold text-sm sm:text-base text-slate-900">
            <span>TOTAL AKHIR</span>
            <span className="text-emerald-600 text-lg sm:text-xl font-black">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Tombol BAYAR Utama */}
        <button
          disabled={items.length === 0}
          onClick={onOpenCheckout}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold rounded-2xl text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99] touch-manipulation"
        >
          <CreditCard className="w-5 h-5" />
          <span>BAYAR (F9) • {formatCurrency(total)}</span>
        </button>
      </div>

      {/* Modal Pilihan Pelanggan */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base">Pilih Pelanggan</h4>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Search Customer */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Cari nama atau telepon pelanggan..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* List Pelanggan */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {/* Opsi Default: Pelanggan Umum */}
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsCustomerModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors touch-manipulation ${
                  !selectedCustomer
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <p className="font-bold text-slate-900">Pelanggan Umum (Default)</p>
                  <p className="text-xs text-slate-500 font-normal">Tanpa nomor telepon</p>
                </div>
                {!selectedCustomer && <Check className="w-4 h-4 text-emerald-600" />}
              </button>

              {loadingCustomers ? (
                <div className="p-4 text-center text-xs sm:text-sm text-slate-400 animate-pulse">
                  Memuat data pelanggan...
                </div>
              ) : (
                customersList.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <button
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setIsCustomerModalOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between transition-colors touch-manipulation ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-900">{cust.name}</p>
                        <p className="text-xs text-slate-500 font-normal">
                          {cust.phone || 'Tanpa No. Telp'} • Tier: {cust.member_tier}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
