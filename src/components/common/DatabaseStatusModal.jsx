import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  KeyRound,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Modal } from './Modal';
import {
  supabaseUrl,
  testSupabaseConnection,
} from '../../lib/supabase';

export const DatabaseStatusModal = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [customUrl, setCustomUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tb_sa_custom_supabase_url') || '';
    }
    return '';
  });
  const [customKey, setCustomKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tb_sa_custom_supabase_key') || '';
    }
    return '';
  });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      testSupabaseConnection()
        .then((res) => {
          if (isMounted) setStatusResult(res);
        })
        .catch((err) => {
          if (isMounted) {
            setStatusResult({
              success: false,
              isConfigured: false,
              message: err?.message || 'Gagal menghubungi database.',
              latencyMs: null,
            });
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setStatusResult(res);
    } catch (err) {
      setStatusResult({
        success: false,
        isConfigured: false,
        message: err?.message || 'Gagal menghubungi database.',
        latencyMs: null,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      localStorage.setItem('tb_sa_custom_supabase_url', customUrl.trim());
    } else {
      localStorage.removeItem('tb_sa_custom_supabase_url');
    }

    if (customKey.trim()) {
      localStorage.setItem('tb_sa_custom_supabase_key', customKey.trim());
    } else {
      localStorage.removeItem('tb_sa_custom_supabase_key');
    }

    setSaveSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('tb_sa_custom_supabase_url');
    localStorage.removeItem('tb_sa_custom_supabase_key');
    setCustomUrl('');
    setCustomKey('');
    setSaveSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Status & Konfigurasi Database Cloud (Supabase)"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Status Card Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            statusResult?.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : statusResult?.isConfigured
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  statusResult?.success
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                }`}
              >
                {statusResult?.success ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">
                    {statusResult?.success
                      ? 'Database Cloud Supabase Terhubung Aktif'
                      : 'Memeriksa Koneksi Database...'}
                  </h4>
                  {statusResult?.latencyMs !== null && statusResult?.latencyMs !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      ⚡ {statusResult.latencyMs} ms
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 text-slate-600 font-medium">
                  {statusResult?.message ||
                    'Sistem kasir terhubung langsung dengan server cloud database Supabase TB. Sumber Agung.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={testing}
              title="Tes Ulang Koneksi"
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Connection Details Pills */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                Host Database
              </span>
              <span className="font-mono text-slate-800 font-bold truncate block text-[11px]">
                {supabaseUrl ? supabaseUrl.replace('https://', '') : 'Belum diatur'}
              </span>
            </div>

            <div className="bg-white/80 p-2 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                Mode Penyimpanan
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                <Zap className="w-3 h-3 text-emerald-600" />
                Real-time Cloud Sync
              </span>
            </div>
          </div>
        </div>

        {/* Feature Benefits List */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Keuntungan Database Cloud Supabase Aktif:
          </h5>
          <ul className="text-xs text-slate-600 space-y-1.5 pl-5 list-disc">
            <li>
              <strong>Multi-Device:</strong> Data kasir, stok material, transaksi, dan laporan otomatis tersinkron antar laptop, HP, dan tablet.
            </li>
            <li>
              <strong>Keamanan Data:</strong> Data tidak akan hilang saat riwayat/cache browser dibersihkan.
            </li>
            <li>
              <strong>Hak Akses Bertingkat:</strong> Akun Owner dan Kasir terdaftar dengan kredensial aman di Cloud Auth.
            </li>
          </ul>
        </div>

        {/* Custom Credentials Toggle / Form */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Kustomisasi Proyek Supabase Sendiri?
            </span>
            <button
              type="button"
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              {showCustomForm ? 'Tutup Formulir' : 'Ubah URL & API Key'}
            </button>
          </div>

          {showCustomForm && (
            <form onSubmit={handleSaveCustom} className="mt-3 space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Server className="w-3 h-3 text-slate-500" />
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xxxx.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-slate-500" />
                  Supabase Publishable / Anon Key
                </label>
                <input
                  type="text"
                  placeholder="sb_publishable_... atau eyJhbGciOi..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs font-semibold text-slate-600 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset ke Proyek Sumber Agung
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan & Terapkan
                </button>
              </div>
            </form>
          )}
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Pengaturan disimpan. Memuat ulang aplikasi...
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DatabaseStatusModal;
