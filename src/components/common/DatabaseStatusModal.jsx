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
  Table,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import { Modal } from './Modal';
import {
  supabase,
  supabaseUrl,
  testSupabaseConnection,
} from '../../lib/supabase';

export const DatabaseStatusModal = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [tablesStatus, setTablesStatus] = useState([]);
  const [checkingTables, setCheckingTables] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
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

  const checkTables = async () => {
    if (!supabase) return;
    setCheckingTables(true);
    const tables = [
      { name: 'sales', label: 'Penjualan Kasir (sales)' },
      { name: 'sale_items', label: 'Item Penjualan (sale_items)' },
      { name: 'products', label: 'Katalog Produk (products)' },
      { name: 'stock_movements', label: 'Mutasi Kartu Stok (stock_movements)' },
      { name: 'cash_transactions', label: 'Arus Kas Toko (cash_transactions)' },
      { name: 'purchases', label: 'Faktur Pembelian (purchases)' },
      { name: 'purchase_items', label: 'Item Pembelian (purchase_items)' },
      { name: 'customers', label: 'Pelanggan (customers)' },
      { name: 'suppliers', label: 'Supplier (suppliers)' },
    ];

    const results = [];
    for (const t of tables) {
      try {
        const { count, error } = await supabase.from(t.name).select('*', { count: 'exact', head: true });
        results.push({
          ...t,
          status: error ? 'error' : 'ok',
          count: count !== null && count !== undefined ? count : 0,
          error: error ? error.message : null,
        });
      } catch (err) {
        results.push({
          ...t,
          status: 'error',
          count: 0,
          error: err?.message || 'Error',
        });
      }
    }
    setTablesStatus(results);
    setCheckingTables(false);
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      testSupabaseConnection()
        .then((res) => {
          if (isMounted) {
            setStatusResult(res);
            checkTables();
          }
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
      await checkTables();
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

  const sqlFixScript = `-- ==========================================
-- SCRIPT SINKRONISASI DATABASE TB. SUMBER AGUNG
-- Jalankan di menu SQL Editor Supabase untuk memastikan
-- semua tabel dan izin RLS terbuka penuh.
-- ==========================================

-- 1. Nonaktifkan RLS agar semua tabel dapat diakses & disinkronkan real-time
ALTER TABLE IF EXISTS public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_transactions DISABLE ROW LEVEL SECURITY;

-- 2. Pastikan tabel cash_transactions memiliki struktur lengkap
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category VARCHAR(50) DEFAULT 'OPERASIONAL',
    notes TEXT,
    cashier_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Berikan hak akses penuh ke role anon dan authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlFixScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
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
      title="Status & Sinkronisasi Database Cloud (Supabase)"
      maxWidth="max-w-2xl"
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
              disabled={testing || checkingTables}
              title="Tes Ulang Koneksi & Tabel"
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${testing || checkingTables ? 'animate-spin text-emerald-600' : ''}`} />
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

        {/* Live Table Health Grid */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Table className="w-4 h-4 text-emerald-600" />
              Status Sinkronisasi Tabel Database:
            </h5>
            <span className="text-[11px] text-slate-500 font-medium">
              {tablesStatus.length > 0
                ? `${tablesStatus.filter((t) => t.status === 'ok').length}/${tablesStatus.length} Tabel Terhubung`
                : 'Memeriksa tabel...'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tablesStatus.map((tab) => (
              <div
                key={tab.name}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  tab.status === 'ok'
                    ? 'bg-white border-slate-200/80 text-slate-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold block truncate">{tab.label}</span>
                  <span className="font-mono text-[10px] text-slate-500 block truncate">
                    tabel: {tab.name}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    {tab.count} baris
                  </span>
                  {tab.status === 'ok' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Tersambung" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200" title={tab.error || 'Perlu SQL RLS Policy'} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SQL Helper Accordion */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              Script SQL Izin Akses & Sinkronisasi Supabase (Klik untuk Buka)
            </span>
            <span className="text-[11px] text-emerald-700 font-bold">
              {showSqlGuide ? 'Sembunyikan' : 'Buka Script'}
            </span>
          </button>

          {showSqlGuide && (
            <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  Salin dan jalankan script ini di menu <strong>SQL Editor</strong> dashboard Supabase Anda jika ingin memastikan semua tabel terbuka tanpa kendala RLS.
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Tersalin!' : 'Salin Script SQL'}
                </button>
              </div>

              <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 border border-slate-800">
                {sqlFixScript}
              </pre>
            </div>
          )}
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
