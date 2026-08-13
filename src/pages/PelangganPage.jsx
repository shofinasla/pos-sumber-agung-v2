import { Users, Construction } from 'lucide-react';

export const PelangganPage = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center max-w-2xl mx-auto my-8">
    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
      <Users className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-slate-900">Data Pelanggan & Member</h2>
    <p className="text-slate-600 text-sm">
      Database pelanggan, nomor kontak tukang/kontraktor, dan riwayat belanja.
    </p>
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
      <Construction className="w-4 h-4 text-indigo-600" />
      <span>Modul Pelanggan Siap Dikembangkan</span>
    </div>
  </div>
);
