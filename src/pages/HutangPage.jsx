import { Wallet, Construction } from 'lucide-react';

export const HutangPage = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center max-w-2xl mx-auto my-8">
    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
      <Wallet className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-slate-900">Buku Hutang & Piutang</h2>
    <p className="text-slate-600 text-sm">
      Pencatatan piutang bon proyek/tukang dan hutang tagihan ke supplier material.
    </p>
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
      <Construction className="w-4 h-4 text-rose-600" />
      <span>Modul Hutang/Piutang Siap di Phase 7</span>
    </div>
  </div>
);
