import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UNITS } from '../../utils/formatters';
import { productService } from '../../services/productService';

export const QuickProductModal = ({
  isOpen,
  onClose,
  categories = [],
  onProductCreated,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [unit, setUnit] = useState('PCS');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minimumStock] = useState('10');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateAutoSKU = (productName) => {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const prefix = productName ? productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'PRD';
    setSku(`${prefix}-${randomSeq}`);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!sku) {
      generateAutoSKU(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama material / barang wajib diisi.');
      return;
    }

    const cleanSku = sku.trim() || `PRD-${Math.floor(1000 + Math.random() * 9000)}`;

    setLoading(true);

    const payload = {
      name: name.trim(),
      sku: cleanSku.toUpperCase(),
      barcode: barcode.trim() || null,
      category_id: categoryId || (categories[0]?.id || null),
      unit: unit || 'PCS',
      cost_price: Number(costPrice || 0),
      selling_price: Number(sellingPrice || (Number(costPrice || 0) * 1.15)),
      stock: 0, // Initial stock is 0, will be added by the purchase invoice!
      minimum_stock: Number(minimumStock || 5),
      is_active: true,
    };

    const { data, error } = await productService.createProduct(payload);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Gagal menyimpan produk baru');
    } else if (data) {
      if (onProductCreated) {
        onProductCreated(data);
      }
      // Reset form
      setName('');
      setSku('');
      setBarcode('');
      setCostPrice('');
      setSellingPrice('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Material / Barang Baru Cepat"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Material / Produk *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            placeholder="Contoh: Semen Dynamix 40kg / Besi 12mm SNI"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Kode SKU *</label>
              <button
                type="button"
                onClick={() => generateAutoSKU(name)}
                className="text-[10px] text-sky-600 font-semibold hover:underline"
              >
                Auto Generate
              </button>
            </div>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SMN-DNX-40"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan Unit *</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Harga Beli / Modal (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="Contoh: 55000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Harga Jual Toko (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="Contoh: 62000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Simpan & Pilih ke Faktur
          </button>
        </div>
      </form>
    </Modal>
  );
};
