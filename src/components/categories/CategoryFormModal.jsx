import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

export const CategoryFormModal = ({ isOpen, onClose, onSubmit, categoryToEdit = null }) => {
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { error } = await onSubmit({ name, description });

    if (error) {
      setErrorMsg(error.message || 'Gagal menyimpan kategori.');
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Kategori Material' : 'Tambah Kategori Baru'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nama Kategori <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Semen & Pasir"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Catatan</label>
          <textarea
            rows="3"
            placeholder="Deskripsi singkat jenis material dalam kategori ini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{categoryToEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
