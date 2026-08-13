import { UserCog, Construction } from 'lucide-react';

export const PenggunaPage = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center max-w-2xl mx-auto my-8">
    <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto">
      <UserCog className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Hak Akses</h2>
    <p className="text-slate-600 text-sm">
      Pengaturan role pengguna (OWNER, ADMIN, CASHIER) dan akses Supabase Auth.
    </p>
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
      <Construction className="w-4 h-4 text-slate-800" />
      <span>Hanya Dapat Diakses Role OWNER / ADMIN</span>
    </div>
  </div>
);
