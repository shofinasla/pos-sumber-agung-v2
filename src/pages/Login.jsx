import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HardHat, Lock, Mail, ArrowRight, AlertCircle, Loader2, Database } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { error } = await login(email, password);
      if (error) {
        setErrorMsg(error.message || 'Gagal masuk. Periksa kembali email dan password.');
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi/sistem.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Accent */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 mb-2">
            <HardHat className="w-8 h-8 font-black" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">TB. SUMBER AGUNG</h1>
          <p className="text-xs text-slate-400 font-medium">
            Sistem Kasir & Manajemen Toko Bahan Bangunan
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-3 bg-amber-950/50 border border-amber-800/60 rounded-2xl text-amber-300 text-xs flex items-start space-x-2">
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Mode Demo Aktif:</span>
              <span>Koneksi Supabase belum dikonfigurasi. Anda dapat masuk langsung menggunakan akun demo di bawah.</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="nama@sumberagung.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Proses Masuk...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Kasir</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-500 block font-semibold uppercase tracking-wider text-center">
            Uji Coba Cepat (Akun Demo)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickLogin('admin@sumberagung.com', 'admin123')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold text-center transition border border-slate-700"
            >
              Demo Owner
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('kasir@sumberagung.com', 'kasir123')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold text-center transition border border-slate-700"
            >
              Demo Kasir
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-600">
          POS TB. Sumber Agung © 2026 • Hak Cipta Dilindungi
        </div>

      </div>
    </div>
  );
};
