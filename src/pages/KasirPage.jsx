import { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { ProductSearch } from '../components/cashier/ProductSearch';
import { Cart } from '../components/cashier/Cart';
import { PaymentModal } from '../components/cashier/PaymentModal';
import { Receipt } from '../components/cashier/Receipt';
import {
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export const KasirPage = () => {
  const { items, total, itemCount, clearCart, toastMessage } = useCart();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [saleResult, setSaleResult] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Mobile drawer view state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Keyboard shortcut listener (F9 untuk bayar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        if (items.length > 0 && !isPaymentOpen && !isReceiptOpen) {
          setIsPaymentOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, isPaymentOpen, isReceiptOpen]);

  // Handler saat checkout sukses
  const handlePaymentSuccess = (result) => {
    setIsPaymentOpen(false);
    setSaleResult(result);
    setIsReceiptOpen(true);
    clearCart();
    setMobileCartOpen(false);
  };

  // Handler untuk transaksi baru dari modal struk
  const handleNewTransaction = () => {
    setIsReceiptOpen(false);
    setSaleResult(null);
  };

  return (
    <div className="relative space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Toast Notification Banner Floating */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-3.5 rounded-2xl shadow-xl border flex items-center space-x-2.5 text-xs font-bold animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-800'
              : toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
              : 'bg-slate-900 text-slate-100 border-slate-800'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Main Grid Kasir Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Kolom Kiri: Cari Produk & Katalog (lg:col-span-7 atau 8) */}
        <div className="lg:col-span-7 xl:col-span-8 h-full min-h-0 flex flex-col">
          <ProductSearch />
        </div>

        {/* Kolom Kanan: Keranjang Belanja (lg:col-span-5 atau 4) - Desktop */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 h-full min-h-0">
          <Cart onOpenCheckout={() => setIsPaymentOpen(true)} />
        </div>
      </div>

      {/* Mobile / Tablet Floating Cart Bar (Bottom) */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-3 right-3 z-30 bg-slate-900 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-slate-700/50">
          <div
            onClick={() => setMobileCartOpen(true)}
            className="flex items-center space-x-3 cursor-pointer touch-manipulation"
          >
            <div className="relative">
              <ShoppingBag className="w-7 h-7 text-emerald-400" />
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Total Belanja
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-400">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileCartOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold text-sm rounded-2xl transition-colors touch-manipulation"
            >
              Lihat Cart
            </button>
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl flex items-center space-x-1.5 shadow-md touch-manipulation"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bayar</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer Slide-Over Keranjang */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                Keranjang (Mobile)
              </h3>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 touch-manipulation"
                aria-label="Tutup Keranjang"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden pt-2">
              <Cart
                onOpenCheckout={() => {
                  setMobileCartOpen(false);
                  setIsPaymentOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembayaran */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Modal Cetak Struk */}
      <Receipt
        isOpen={isReceiptOpen}
        saleResult={saleResult}
        onNewTransaction={handleNewTransaction}
      />
    </div>
  );
};
