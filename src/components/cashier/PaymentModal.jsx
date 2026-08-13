import { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const PaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const { items, selectedCustomer, cartDiscount, subtotal, total, notes } = useCart();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [transactionNotes, setTransactionNotes] = useState(notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method !== 'CASH') {
      setPaidAmountInput(total.toString());
    }
  };

  const effectivePaidInput = paidAmountInput === '' ? total.toString() : paidAmountInput;
  const paidNum = paymentMethod !== 'CASH' ? total : (Number(effectivePaidInput) || 0);
  const changeNum = paidNum - total;
  const isCashInsufficient = paymentMethod === 'CASH' && paidNum < total;

  // Preset pecahan uang tunai
  const cashPresets = [
    { label: 'Uang Pas', value: total },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
    { label: '200.000', value: 200000 },
    { label: '500.000', value: 500000 },
  ].filter((p) => p.value >= total || p.label === 'Uang Pas');

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevention double submit

    if (items.length === 0) {
      setErrorMessage('Keranjang belanja kosong.');
      return;
    }

    if (isCashInsufficient) {
      setErrorMessage(`Uang pembayaran kurang ${formatCurrency(total - paidNum)}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const salePayload = {
      customerId: selectedCustomer?.id || null,
      cashierId: user?.id || null,
      subtotal,
      discount: cartDiscount,
      tax: 0,
      total,
      paymentMethod,
      paidAmount: paidNum,
      changeAmount: Math.max(0, changeNum),
      notes: transactionNotes,
      items,
    };

    const { data, error } = await transactionService.createSale(salePayload);

    if (error) {
      setErrorMessage(error.message || 'Gagal memproses transaksi.');
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onSuccess({
        ...data,
        items,
        selectedCustomer,
        cashierName: user?.email || 'Kasir POS',
        paymentMethod,
        subtotal,
        discount: cartDiscount,
        total,
        paidAmount: paidNum,
        changeAmount: Math.max(0, changeNum),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Pembayaran</h3>
              <p className="text-xs text-slate-500 font-medium">
                TB. Sumber Agung POS Terminal
              </p>
            </div>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Tagihan Banner */}
        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Total Harus Dibayar
            </p>
            <p className="text-2xl sm:text-3xl font-black">{formatCurrency(total)}</p>
          </div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-xs text-white text-xs font-bold rounded-xl">
            {items.reduce((a, b) => a + Number(b.quantity), 0)} barang
          </span>
        </div>

        {/* Form Pembayaran */}
        <form onSubmit={handleProcessPayment} className="space-y-4">
          {/* Pilihan Metode Pembayaran Enum */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'CASH', icon: Banknote },
                { id: 'QRIS', label: 'QRIS', icon: QrCode },
                { id: 'TRANSFER', label: 'TRANSFER', icon: ArrowRightLeft },
                { id: 'DEBIT', label: 'DEBIT', icon: CreditCard },
                { id: 'CREDIT', label: 'CREDIT', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectPaymentMethod(m.id)}
                    className={`p-2.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skenario TUNAI: Input Jumlah Uang & Preset */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full text-xl font-extrabold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  placeholder="0"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-1.5">
                {cashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setPaidAmountInput(preset.value.toString())}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Kalkulasi Kembalian */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between text-sm ${
                  isCashInsufficient
                    ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-xs font-semibold">
                  {isCashInsufficient ? 'Kurang Uang' : 'Uang Kembalian'}
                </span>
                <span
                  className={`font-black text-lg ${
                    isCashInsufficient ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {isCashInsufficient
                    ? formatCurrency(total - paidNum)
                    : formatCurrency(Math.max(0, changeNum))}
                </span>
              </div>
            </div>
          )}

          {/* Catatan Transaksi Optional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={transactionNotes}
              onChange={(e) => setTransactionNotes(e.target.value)}
              placeholder="Contoh: Titip di proyek, dikirim sore ini..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Peringatan Pesan Error */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-colors disabled:opacity-40"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCashInsufficient}
              className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses transaksi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PROSES PEMBAYARAN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
