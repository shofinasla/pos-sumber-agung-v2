import React from 'react';
import { Printer, Download, CheckCircle, X, Store } from 'lucide-react';
import { Transaction } from '../types/pos';
import { STORE_INFO } from '../data/initialData';
import { formatRupiah, formatDate } from '../utils/formatters';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onNewTransaction?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  onNewTransaction,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    let receiptText = `${STORE_INFO.name}\n${STORE_INFO.address}\nTelp: ${STORE_INFO.phone}\n`;
    receiptText += `========================================\n`;
    receiptText += `No. Struk : ${transaction.id}\n`;
    receiptText += `Tanggal   : ${formatDate(transaction.date)}\n`;
    receiptText += `Kasir     : ${transaction.cashierName}\n`;
    if (transaction.customerName) {
      receiptText += `Pelanggan : ${transaction.customerName}\n`;
    }
    receiptText += `========================================\n`;
    
    transaction.items.forEach((item) => {
      receiptText += `${item.name}\n`;
      receiptText += `  ${item.quantity} ${item.unit} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}\n`;
    });
    
    receiptText += `----------------------------------------\n`;
    receiptText += `Subtotal : ${formatRupiah(transaction.subtotal)}\n`;
    if (transaction.discountTotal > 0) {
      receiptText += `Diskon   : -${formatRupiah(transaction.discountTotal)}\n`;
    }
    receiptText += `TOTAL    : ${formatRupiah(transaction.grandTotal)}\n`;
    receiptText += `Bayar (${transaction.paymentMethod.toUpperCase()}) : ${formatRupiah(transaction.cashPaid)}\n`;
    receiptText += `Kembali  : ${formatRupiah(transaction.change)}\n`;
    receiptText += `========================================\n`;
    receiptText += `${STORE_INFO.footerMessage}\n`;

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk-${transaction.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Transaksi Berhasil</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-6 bg-slate-50 flex justify-center">
          <div
            id="printable-receipt"
            className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 w-full font-mono text-xs text-slate-800 leading-tight"
          >
            {/* Header */}
            <div className="text-center mb-4 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-1">
                <Store className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 tracking-wide uppercase">
                {STORE_INFO.name}
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{STORE_INFO.address}</p>
              <p className="text-[10px] text-slate-500">Telp: {STORE_INFO.phone}</p>
            </div>

            {/* Meta */}
            <div className="mb-3 space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Transaksi:</span>
                <span className="font-semibold text-slate-900">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{formatDate(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-semibold text-emerald-700">{transaction.customerName}</span>
                </div>
              )}
            </div>

            {/* Itemized List */}
            <div className="mb-3 space-y-2 pb-3 border-b border-dashed border-slate-300">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>
                      {item.quantity} {item.unit} x {formatRupiah(item.price)}
                    </span>
                    <span className="font-medium text-slate-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discountTotal > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(transaction.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>TOTAL</span>
                <span>{formatRupiah(transaction.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1 text-[11px] pt-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Bayar ({transaction.paymentMethod.toUpperCase()})</span>
                <span>{formatRupiah(transaction.cashPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Kembali</span>
                <span>{formatRupiah(transaction.change)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500 whitespace-pre-line leading-normal">
              {STORE_INFO.footerMessage}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-900 text-white hover:bg-slate-800 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm transition shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          
          <button
            onClick={handleDownloadTxt}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm transition border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>Unduh TXT</span>
          </button>

          {onNewTransaction && (
            <button
              onClick={() => {
                onClose();
                onNewTransaction();
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow shadow-emerald-600/20"
            >
              Transaksi Baru
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
