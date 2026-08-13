const SETTINGS_KEY = 'tb_sa_store_settings';

const DEFAULT_SETTINGS = {
  store_name: 'TB. Sumber Agung',
  address: 'Jl. Pemuda No. 88, Kebumen, Jawa Tengah',
  phone: '0812-3456-7890',
  whatsapp: '0812-3456-7890',
  receipt_header: 'Selamat Datang di Toko Bangunan Sumber Agung',
  receipt_footer: 'Terima kasih telah berbelanja material di toko kami!\nBarang yang sudah dibeli tidak dapat dikembalikan.',
  paper_size: '80mm', // '58mm' or '80mm'
  auto_print: true,
  tax_rate: 0,
};

export const settingsService = {
  getSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch (e) {
        console.warn('Failed to parse settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(newSettings) {
    const updated = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },
};
