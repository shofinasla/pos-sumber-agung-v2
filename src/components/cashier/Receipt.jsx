import { Printer, PlusCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const Receipt = ({ isOpen, saleResult, onNewTransaction }) => {
  if (!isOpen || !saleResult) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = saleResult.created_at
    ? new Date(saleResult.created_at).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        {/* Header Sukses */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">
            Transaksi Berhasil
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Pembayaran telah diterima & stok diperbarui
          </p>
        </div>

        {/* Struk Thermal View / Printable Container */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 space-y-3">
          <div id="printable-receipt" className="space-y-3">
            {/* Store Header */}
            <div className="text-center space-y-0.5">
              <h2 className="font-bold text-sm tracking-wide">TB. SUMBER AGUNG</h2>
              <p className="text-[10px] text-slate-500">
                Jl. Raya Bahan Bangunan No. 88
              </p>
              <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No. Invoice:</span>
                <span className="font-bold">{saleResult.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{saleResult.cashierName || 'Kasir POS'}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>
                  {saleResult.selectedCustomer
                    ? saleResult.selectedCustomer.name
                    : 'Pelanggan Umum'}
                </span>
              </div>
            </div>

            {/* List Barang */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5">
              {saleResult.items?.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>
                      {item.quantity} {item.unit} x {formatCurrency(item.selling_price)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Perhitungan Header Total */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(saleResult.subtotal)}</span>
              </div>
              {saleResult.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Diskon</span>
                  <span>-{formatCurrency(saleResult.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL</span>
                <span>{formatCurrency(saleResult.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Metode Pembayaran:</span>
                <span className="font-bold">{saleResult.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar:</span>
                <span>{formatCurrency(saleResult.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Kembalian:</span>
                <span>{formatCurrency(saleResult.changeAmount)}</span>
              </div>
            </div>

            {/* Footer Struk */}
            <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-0.5 text-[10px] text-slate-500">
              <p>================================</p>
              <p className="font-bold text-slate-700">TERIMA KASIH</p>
              <p>Atas Kunjungan Anda di TB. Sumber Agung</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handlePrint}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>CETAK STRUK (CTRL+P)</span>
          </button>

          <button
            onClick={onNewTransaction}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>TRANSAKSI BARU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
