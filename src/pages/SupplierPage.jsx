import { Truck, Construction } from 'lucide-react';

export const SupplierPage = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center max-w-2xl mx-auto my-8">
    <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto">
      <Truck className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-slate-900">Daftar Supplier Material</h2>
    <p className="text-slate-600 text-sm">
      Pengelolaan distributor semen, besi, cat, sanitari, dan kontak sales.
    </p>
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
      <Construction className="w-4 h-4 text-cyan-600" />
      <span>Modul Supplier Siap di Phase 7</span>
    </div>
  </div>
);
