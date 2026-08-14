import { useState } from 'react';
import { Loader2, AlertCircle, Barcode, Package, Camera } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UNITS } from '../../utils/formatters';
import { CameraScannerModal } from '../common/CameraScannerModal';

const ProductFormInner = ({
  onClose,
  onSubmit,
  categories = [],
  productToEdit = null,
}) => {
  const [formData, setFormData] = useState(() => {
    if (productToEdit) {
      return {
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        category_id: productToEdit.category_id || '',
        unit: productToEdit.unit || 'PCS',
        cost_price: productToEdit.cost_price ?? 0,
        selling_price: productToEdit.selling_price ?? 0,
        stock: productToEdit.stock ?? 0,
        minimum_stock: productToEdit.minimum_stock ?? 5,
        is_active: productToEdit.is_active !== undefined ? productToEdit.is_active : true,
      };
    }
    return {
      name: '',
      sku: '',
      barcode: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      unit: 'PCS',
      cost_price: 0,
      selling_price: 0,
      stock: 0,
      minimum_stock: 5,
      is_active: true,
    };
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const generateAutoSKU = () => {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'PRD';
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${randomSeq}` }));
  };

  const handleBarcodeScanned = (scannedCode) => {
    if (scannedCode) {
      setFormData((prev) => ({ ...prev, barcode: scannedCode.trim() }));
      setIsCameraOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (!formData.sku.trim()) {
      setErrorMsg('SKU produk wajib diisi.');
      return;
    }
    if (Number(formData.cost_price) < 0) {
      setErrorMsg('Harga modal tidak boleh bernilai negatif.');
      return;
    }
    if (Number(formData.selling_price) < 0) {
      setErrorMsg('Harga jual tidak boleh bernilai negatif.');
      return;
    }
    if (Number(formData.stock) < 0) {
      setErrorMsg('Stok tidak boleh bernilai negatif.');
      return;
    }
    if (Number(formData.minimum_stock) < 0) {
      setErrorMsg('Minimum stok tidak boleh bernilai negatif.');
      return;
    }

    setLoading(true);

    const { error } = await onSubmit(formData);

    if (error) {
      setErrorMsg(error.message || 'Gagal menyimpan produk.');
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Informasi Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Produk / Material <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Semen Gresik 40kg / Besi 10mm SNI"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Kode SKU <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateAutoSKU}
                className="text-[10px] text-emerald-600 hover:underline font-bold"
              >
                + Auto SKU
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="SMN-GRS-40"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Barcode / Kode Batang (Opsional)
              </label>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition"
              >
                <Camera className="w-3 h-3" />
                <span>Scan Kamera</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Scan / ketik barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full pl-9 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {formData.barcode && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, barcode: '' })}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Material</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Tanpa Kategori --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Material</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Pricing & Stock */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-600" />
            Harga & Batas Stok Toko
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Modal / Pokok (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Jual Kasir (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stok Awal <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Minimum Stok <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="block text-xs font-bold text-slate-900">Status Produk Aktif</span>
            <span className="text-[11px] text-slate-500">
              Produk aktif akan muncul di pilihan terminal kasir POS
            </span>
          </div>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{productToEdit ? 'Simpan Perubahan' : 'Tambah Produk'}</span>
          </button>
        </div>
      </form>

      {/* Camera Barcode Scanner Modal for adding/editing product barcode */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleBarcodeScanned}
        title="Scan Barcode Produk"
        subtitle="Arahkan kamera ke barcode kemasan untuk mengisi input barcode secara otomatis"
        allowContinuous={false}
        defaultContinuous={false}
      />
    </>
  );
};

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  productToEdit = null,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Data Produk Material' : 'Tambah Produk Material Baru'}
      maxWidth="max-w-2xl"
    >
      {isOpen && (
        <ProductFormInner
          key={productToEdit?.id || 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          categories={categories}
          productToEdit={productToEdit}
        />
      )}
    </Modal>
  );
};

export default ProductFormModal;
