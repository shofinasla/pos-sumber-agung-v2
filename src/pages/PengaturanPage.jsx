import { useState } from 'react';
import {
  Settings,
  Store,
  Printer,
  FileText,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { settingsService } from '../services/settingsService';

export const PengaturanPage = () => {
  const [settings, setSettings] = useState(() => {
    return settingsService.getSettings() || {
      store_name: 'TB. Sumber Agung',
      address: 'Jl. Pemuda No. 88, Kebumen, Jawa Tengah',
      phone: '0812-3456-7890',
      whatsapp: '0812-3456-7890',
      receipt_header: 'Selamat Datang di Toko Bangunan Sumber Agung',
      receipt_footer: 'Terima kasih telah berbelanja material di toko kami!\nBarang yang sudah dibeli tidak dapat dikembalikan.',
      paper_size: '80mm',
      auto_print: true,
      tax_rate: 0,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    settingsService.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-slate-800" />
            Pengaturan Toko & Printer Struk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi profil TB. Sumber Agung, cetak struk kasir thermal, dan parameter sistem POS.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-2xl transition shadow-xs text-sm"
        >
          <Save className="w-4 h-4" />
          Simpan Pengaturan
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Pengaturan berhasil disimpan! Perubahan akan langsung diterapkan pada cetak struk kasir.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identitas Toko */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-sky-600" />
              Identitas Toko Bangunan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Toko Material *
                </label>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / Telp *
                </label>
                <input
                  type="text"
                  required
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Toko Lengkap *
              </label>
              <textarea
                rows={2}
                required
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp Toko (Ditampilkan di Struk)
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Configuration Thermal Printer & Struk */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Printer className="w-5 h-5 text-indigo-600" />
              Format Printer & Struk Belanja
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ukuran Kertas Thermal Printer *
                </label>
                <select
                  value={settings.paper_size}
                  onChange={(e) => handleChange('paper_size', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="58mm">58mm (Kertas Kasir Kecil Portable)</option>
                  <option value="80mm">80mm (Kertas Kasir Standar Minimarket/Toko)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pajak PPN % (Bila Ada)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.tax_rate}
                  onChange={(e) => handleChange('tax_rate', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pesan Header Struk (Salam Pembuka)
              </label>
              <input
                type="text"
                value={settings.receipt_header}
                onChange={(e) => handleChange('receipt_header', e.target.value)}
                placeholder="Selamat Datang..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pesan Footer Struk (Syarat & Ketentuan / Penutup)
              </label>
              <textarea
                rows={3}
                value={settings.receipt_footer}
                onChange={(e) => handleChange('receipt_footer', e.target.value)}
                placeholder="Terima kasih..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_print}
                  onChange={(e) => handleChange('auto_print', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Cetak Struk Otomatis Setelah Pembayaran Kasir Selesai
              </label>
            </div>
          </div>
        </div>

        {/* Live Thermal Receipt Preview Right Column */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Preview Hasil Cetak Struk
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                {settings.paper_size}
              </span>
            </h3>

            {/* Thermal Struk Card Simulation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-[11px] leading-tight text-slate-800 space-y-3 shadow-inner max-w-xs mx-auto">
              <div className="text-center space-y-1">
                <p className="font-bold text-xs uppercase tracking-wide">{settings.store_name}</p>
                <p className="text-[10px] text-slate-600">{settings.address}</p>
                <p className="text-[10px] text-slate-600">Telp/WA: {settings.phone}</p>
                <div className="border-b border-dashed border-slate-300 my-2" />
                <p className="text-[10px] italic">{settings.receipt_header}</p>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>TRX-2026-0813-001</span>
                  <span>13/08/26 10:15</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Kasir: Kasir Utama</span>
                  <span>TUNAI</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              {/* Items sample */}
              <div className="space-y-1.5">
                <div>
                  <p className="font-semibold">Semen Tiga Roda 50kg</p>
                  <div className="flex justify-between text-slate-600">
                    <span>2 x Rp 65.000</span>
                    <span>Rp 130.000</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Paku Kayu 3 inchi (kg)</p>
                  <div className="flex justify-between text-slate-600">
                    <span>1 x Rp 18.000</span>
                    <span>Rp 18.000</span>
                  </div>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp 148.000</span>
                </div>
                {settings.tax_rate > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>PPN {settings.tax_rate}%</span>
                    <span>
                      Rp {new Intl.NumberFormat('id-ID').format((148000 * settings.tax_rate) / 100)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs border-t border-slate-300 pt-1">
                  <span>TOTAL</span>
                  <span>
                    Rp{' '}
                    {new Intl.NumberFormat('id-ID').format(
                      148000 + (148000 * settings.tax_rate) / 100
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bayar</span>
                  <span>Rp 150.000</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kembali</span>
                  <span>
                    Rp{' '}
                    {new Intl.NumberFormat('id-ID').format(
                      150000 - (148000 + (148000 * settings.tax_rate) / 100)
                    )}
                  </span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2" />

              <div className="text-center text-[10px] text-slate-600 whitespace-pre-line">
                {settings.receipt_footer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengaturanPage;
