import { ShoppingCart, Construction } from 'lucide-react';

export const PembelianPage = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center max-w-2xl mx-auto my-8">
    <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
      <ShoppingCart className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-slate-900">Pembelian & Kulakan Stok</h2>
    <p className="text-slate-600 text-sm">
      Pencatatan faktur masuk dari supplier dan otomatisasi penambahan stok barang.
    </p>
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
      <Construction className="w-4 h-4 text-sky-600" />
      <span>Modul Pembelian Siap di Phase 7</span>
    </div>
  </div>
);
